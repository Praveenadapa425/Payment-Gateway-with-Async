package com.gateway.jobs;

import com.gateway.models.Merchant;
import com.gateway.models.WebhookLog;
import com.gateway.repositories.MerchantRepository;
import com.gateway.repositories.WebhookLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Component
public class DeliverWebhookJob implements Job {
    
    private MerchantRepository merchantRepository;
    
    private WebhookLogRepository webhookLogRepository;
    

    
    private boolean webhookRetryIntervalsTest;
    
    private UUID merchantId;
    private String eventType;
    private String payload;
    
    public DeliverWebhookJob() {}
    
    public void setDependencies(WebhookLogRepository webhookLogRepository, MerchantRepository merchantRepository, boolean webhookRetryIntervalsTest) {
        this.webhookLogRepository = webhookLogRepository;
        this.merchantRepository = merchantRepository;
        this.webhookRetryIntervalsTest = webhookRetryIntervalsTest;
    }
    
    public DeliverWebhookJob(UUID merchantId, String eventType, String payload) {
        this.merchantId = merchantId;
        this.eventType = eventType;
        this.payload = payload;
    }
    
    @Override
    public void execute() {
        // Fetch merchant details from database using merchant ID
        Optional<Merchant> merchantOpt = merchantRepository.findById(merchantId);
        if (!merchantOpt.isPresent()) {
            System.err.println("Merchant not found: " + merchantId);
            return;
        }
        
        Merchant merchant = merchantOpt.get();
        
        // Skip if webhook URL is not configured
        if (merchant.getWebhookUrl() == null || merchant.getWebhookUrl().isEmpty()) {
            System.out.println("Webhook URL not configured for merchant: " + merchantId);
            return;
        }
        
        // Generate HMAC-SHA256 signature
        String webhookSecret = merchant.getWebhookSecret();
        String signature = generateHmacSignature(payload, webhookSecret);
        
        // Send HTTP POST request to merchant's webhook URL
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Webhook-Signature", signature);
            
            HttpEntity<String> entity = new HttpEntity<>(payload, headers);
            
            // Use RestTemplate with timeout configuration
            RestTemplate client = new RestTemplate();
            HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory();
            factory.setConnectTimeout(5000); // 5 seconds timeout
            factory.setReadTimeout(5000); // 5 seconds timeout
            client.setRequestFactory(factory);
            
            ResponseEntity<String> response = client.postForEntity(merchant.getWebhookUrl(), entity, String.class);
            
            // Log successful webhook attempt
            logWebhookAttempt(merchantId, eventType, payload, "success", 1, 
                             response.getStatusCodeValue(), response.getBody(), null);
            
        } catch (Exception e) {
            // Log failed webhook attempt
            logWebhookAttempt(merchantId, eventType, payload, "pending", 1, 
                             null, null, e.getMessage());
        }
    }
    
    private String generateHmacSignature(String payload, String secret) {
        try {
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            javax.crypto.spec.SecretKeySpec secretKeySpec = new javax.crypto.spec.SecretKeySpec(
                secret.getBytes("UTF-8"), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] digest = mac.doFinal(payload.getBytes("UTF-8"));
            
            // Convert to hex string
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            System.err.println("Error generating HMAC signature: " + e.getMessage());
            return "";
        }
    }
    
    private void logWebhookAttempt(UUID merchantId, String eventType, String payload, 
                                 String status, int attempts, Integer responseCode, 
                                 String responseBody, String errorMessage) {
        WebhookLog log = new WebhookLog(merchantId, eventType, payload);
        log.setStatus(status);
        log.setAttempts(attempts);
        log.setLastAttemptAt(LocalDateTime.now());
        
        if (responseCode != null) {
            log.setResponseCode(responseCode);
        }
        if (responseBody != null) {
            log.setResponseBody(responseBody);
        }
        
        // Calculate next retry time if status is pending and attempts < 5
        if ("pending".equals(status) && attempts < 5) {
            LocalDateTime nextRetryAt = calculateNextRetryTime(attempts);
            log.setNextRetryAt(nextRetryAt);
        }
        
        webhookLogRepository.save(log);
    }
    
    private LocalDateTime calculateNextRetryTime(int attempt) {
        long delaySeconds;
        
        if (webhookRetryIntervalsTest) {
            // Test intervals: 0s, 5s, 10s, 15s, 20s
            switch (attempt) {
                case 1: delaySeconds = 5; break;
                case 2: delaySeconds = 10; break;
                case 3: delaySeconds = 15; break;
                case 4: delaySeconds = 20; break;
                default: delaySeconds = 20; break;
            }
        } else {
            // Production intervals: immediate, 1min, 5min, 30min, 2hr
            switch (attempt) {
                case 1: delaySeconds = 60; break;  // 1 minute
                case 2: delaySeconds = 300; break; // 5 minutes
                case 3: delaySeconds = 1800; break; // 30 minutes
                case 4: delaySeconds = 7200; break; // 2 hours
                default: delaySeconds = 7200; break; // 2 hours
            }
        }
        
        return LocalDateTime.now().plusSeconds(delaySeconds);
    }
    
    public void setMerchantId(UUID merchantId) {
        this.merchantId = merchantId;
    }
    
    public void setEventType(String eventType) {
        this.eventType = eventType;
    }
    
    public void setPayload(String payload) {
        this.payload = payload;
    }
}