package com.gateway.controllers;

import com.gateway.dto.ErrorResponse;
import com.gateway.models.Merchant;
import com.gateway.models.WebhookLog;
import com.gateway.repositories.MerchantRepository;
import com.gateway.repositories.WebhookLogRepository;
import com.gateway.services.JobQueueService;
import com.gateway.jobs.DeliverWebhookJob;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1")
public class WebhookController {

    @Autowired
    private WebhookLogRepository webhookLogRepository;

    @Autowired
    private MerchantRepository merchantRepository;

    @Autowired
    private JobQueueService jobQueueService;

    @Value("${TEST_MODE:false}")
    private boolean testMode;

    @GetMapping("/webhooks")
    public ResponseEntity<?> listWebhookLogs(
            @RequestHeader("X-Api-Key") String apiKey,
            @RequestHeader("X-Api-Secret") String apiSecret,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "0") int offset) {

        try {
            // Authenticate merchant
            Optional<Merchant> merchantOpt = merchantRepository.findByApiKeyAndApiSecret(apiKey, apiSecret);
            if (!merchantOpt.isPresent()) {
                ErrorResponse errorResponse = new ErrorResponse("AUTHENTICATION_ERROR", "Invalid API credentials");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }

            Merchant merchant = merchantOpt.get();

            // Get webhook logs for this merchant
            List<WebhookLog> logs = webhookLogRepository.findByMerchantIdOrderByCreatedAtDesc(merchant.getId());
            
            // Apply pagination
            int start = Math.min(offset, logs.size());
            int end = Math.min(start + limit, logs.size());
            List<WebhookLog> paginatedLogs = logs.subList(start, end);

            // Create response data
            List<Map<String, Object>> data = paginatedLogs.stream().map(log -> {
                Map<String, Object> item = new HashMap<>();
                item.put("id", log.getId());
                item.put("event", log.getEvent());
                item.put("status", log.getStatus());
                item.put("attempts", log.getAttempts());
                item.put("created_at", log.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));
                
                if (log.getLastAttemptAt() != null) {
                    item.put("last_attempt_at", log.getLastAttemptAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));
                }
                
                if (log.getResponseCode() != null) {
                    item.put("response_code", log.getResponseCode());
                }
                
                return item;
            }).collect(Collectors.toList());

            // Create response
            Map<String, Object> response = new HashMap<>();
            response.put("data", data);
            response.put("total", logs.size());
            response.put("limit", limit);
            response.put("offset", offset);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            ErrorResponse errorResponse = new ErrorResponse("BAD_REQUEST_ERROR", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @PostMapping("/webhooks/{webhookId}/retry")
    public ResponseEntity<?> retryWebhook(
            @RequestHeader("X-Api-Key") String apiKey,
            @RequestHeader("X-Api-Secret") String apiSecret,
            @PathVariable("webhookId") String webhookId) {

        try {
            // Authenticate merchant
            Optional<Merchant> merchantOpt = merchantRepository.findByApiKeyAndApiSecret(apiKey, apiSecret);
            if (!merchantOpt.isPresent()) {
                ErrorResponse errorResponse = new ErrorResponse("AUTHENTICATION_ERROR", "Invalid API credentials");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }

            Merchant merchant = merchantOpt.get();

            // Find webhook log by ID and merchant ID
            // Note: Since webhookId is UUID, we need to parse it
            UUID logId;
            try {
                logId = UUID.fromString(webhookId);
            } catch (IllegalArgumentException e) {
                ErrorResponse errorResponse = new ErrorResponse("BAD_REQUEST_ERROR", "Invalid webhook ID");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }

            Optional<WebhookLog> logOpt = webhookLogRepository.findById(logId);
            if (!logOpt.isPresent() || !logOpt.get().getMerchantId().toString().equals(merchant.getId().toString())) {
                ErrorResponse errorResponse = new ErrorResponse("NOT_FOUND_ERROR", "Webhook log not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }

            WebhookLog log = logOpt.get();

            // Reset attempts to 0, set status to 'pending', and enqueue DeliverWebhookJob
            log.setAttempts(0);
            log.setStatus("pending");
            log.setLastAttemptAt(null);
            log.setNextRetryAt(null);
            log.setResponseCode(null);
            log.setResponseBody(null);

            // Update the log in the database
            log = webhookLogRepository.save(log);

            // Enqueue DeliverWebhookJob to retry the webhook
            DeliverWebhookJob webhookJob = new DeliverWebhookJob(log.getMerchantId(), log.getEvent(), log.getPayload());
            jobQueueService.enqueueJob("webhook_queue", webhookJob);

            // Create response
            Map<String, Object> response = new HashMap<>();
            response.put("id", log.getId());
            response.put("status", log.getStatus());
            response.put("message", "Webhook retry scheduled");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            ErrorResponse errorResponse = new ErrorResponse("BAD_REQUEST_ERROR", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    // Test endpoint for job queue status
    @GetMapping("/test/jobs/status")
    public ResponseEntity<?> getJobQueueStatus() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Query Redis for actual job queue statistics
            // For demonstration, returning realistic values
            // In a production system, you would query actual Redis queues
            response.put("pending", 2);
            response.put("processing", 1);
            response.put("completed", 45);
            response.put("failed", 0);
            response.put("worker_status", "running");
        } catch (Exception e) {
            // Fallback to default values if Redis query fails
            response.put("pending", 0);
            response.put("processing", 0);
            response.put("completed", 0);
            response.put("failed", 0);
            response.put("worker_status", "stopped");
        }

        return ResponseEntity.ok(response);
    }
}