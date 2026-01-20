package com.gateway.config;

import com.gateway.models.Merchant;
import com.gateway.repositories.MerchantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
public class TestMerchantInitializer {

    @Autowired
    private MerchantRepository merchantRepository;

    @Value("${TEST_MERCHANT_EMAIL:test@example.com}")
    private String testMerchantEmail;

    @Value("${TEST_API_KEY:key_test_abc123}")
    private String testApiKey;

    @Value("${TEST_API_SECRET:secret_test_xyz789}")
    private String testApiSecret;

    @EventListener(ContextRefreshedEvent.class)
    public void initializeTestMerchant() {
        // Check if test merchant already exists
        Optional<Merchant> existingMerchant = merchantRepository.findByEmail(testMerchantEmail);
        
        if (!existingMerchant.isPresent()) {
            // Create test merchant
            Merchant testMerchant = new Merchant();
            testMerchant.setId(UUID.fromString("550e8400-e29b-41d4-a716-446655440000"));
            testMerchant.setName("Test Merchant");
            testMerchant.setEmail(testMerchantEmail);
            testMerchant.setApiKey(testApiKey);
            testMerchant.setApiSecret(testApiSecret);
            testMerchant.setWebhookUrl("http://host.docker.internal:4000/webhook");
            testMerchant.setWebhookSecret("whsec_test_abc123");
            
            merchantRepository.save(testMerchant);
        }
    }
}