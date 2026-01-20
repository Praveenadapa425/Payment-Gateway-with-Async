package com.gateway.jobs;

import com.gateway.models.Payment;
import com.gateway.repositories.PaymentRepository;
import com.gateway.services.ValidationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.Random;

@Component
public class ProcessPaymentJob implements Job {
    
    private PaymentRepository paymentRepository;
    
    private ValidationService validationService;
    
    private boolean testMode;
    
    private boolean testPaymentSuccess;
    
    private int processingDelayMin;
    
    private int processingDelayMax;
    
    private int testProcessingDelay;
    
    private double upiSuccessRate;
    
    private double cardSuccessRate;
    
    private com.gateway.services.JobQueueService jobQueueService;
    
    private String paymentId;
    
    public ProcessPaymentJob() {}
    
    public ProcessPaymentJob(String paymentId) {
        this.paymentId = paymentId;
    }
    
    @Override
    public void execute() {
        // Fetch payment record from database using the payment ID
        Optional<Payment> paymentOpt = paymentRepository.findById(paymentId);
        if (!paymentOpt.isPresent()) {
            System.err.println("Payment not found: " + paymentId);
            return;
        }
        
        Payment payment = paymentOpt.get();
        
        // Update status to processing if it's pending
        if ("pending".equals(payment.getStatus())) {
            payment.setStatus("processing");
            paymentRepository.save(payment);
        }
        
        // Ensure the status is processing before delay
        if (!"processing".equals(payment.getStatus())) {
            payment.setStatus("processing");
            paymentRepository.save(payment);
        }
        
        // Simulate payment processing with delay
        int delay = testMode ? testProcessingDelay : 
                   (int)(Math.random() * (processingDelayMax - processingDelayMin + 1)) + processingDelayMin;
        
        try {
            Thread.sleep(delay);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            System.err.println("Payment processing interrupted: " + paymentId);
            return;
        }

        // Determine success/failure based on test mode or random chance
        boolean success;
        if (testMode) {
            success = testPaymentSuccess;
        } else {
            if ("upi".equals(payment.getMethod())) {
                success = Math.random() < upiSuccessRate;
            } else { // card
                success = Math.random() < cardSuccessRate;
            }
        }

        // Update payment status based on result
        if (success) {
            payment.setStatus("success");
        } else {
            payment.setStatus("failed");
            payment.setErrorCode("PAYMENT_FAILED");
            payment.setErrorDescription("Payment processing failed");
        }

        // Save updated payment status
        paymentRepository.save(payment);
        
        // Enqueue webhook delivery job for the appropriate event
        if (jobQueueService != null) {
            com.gateway.jobs.DeliverWebhookJob webhookJob = new com.gateway.jobs.DeliverWebhookJob(
                payment.getMerchantId(), 
                success ? "payment.success" : "payment.failed", 
                createWebhookPayload(payment, success)
            );
            jobQueueService.enqueueJob("webhook_queue", webhookJob);
        }
    }
    
    private String createWebhookPayload(Payment payment, boolean success) {
        // Create a simple JSON payload for the webhook
        StringBuilder payload = new StringBuilder();
        payload.append("{");
        payload.append("\"event\": \"").append(success ? "payment.success" : "payment.failed").append("\",");
        payload.append("\"timestamp\": \"").append(System.currentTimeMillis() / 1000).append("\",");
        payload.append("\"data\": {");
        payload.append("\"payment\": {");
        payload.append("\"id\": \"").append(payment.getId()).append("\",");
        payload.append("\"order_id\": \"").append(payment.getOrderId()).append("\",");
        payload.append("\"amount\": ").append(payment.getAmount()).append(",");
        payload.append("\"currency\": \"").append(payment.getCurrency()).append("\",");
        payload.append("\"method\": \"").append(payment.getMethod()).append("\",");
        payload.append("\"status\": \"").append(payment.getStatus()).append("\",");
        payload.append("\"created_at\": \"").append(payment.getCreatedAt().toString()).append("\"");
        payload.append("}}}}");
        return payload.toString();
    }
    
    public void setPaymentId(String paymentId) {
        this.paymentId = paymentId;
    }
    
    public void setDependencies(PaymentRepository paymentRepository, ValidationService validationService,
            boolean testMode, boolean testPaymentSuccess, int processingDelayMin, int processingDelayMax,
            int testProcessingDelay, double upiSuccessRate, double cardSuccessRate, 
            com.gateway.services.JobQueueService jobQueueService) {
        this.paymentRepository = paymentRepository;
        this.validationService = validationService;
        this.testMode = testMode;
        this.testPaymentSuccess = testPaymentSuccess;
        this.processingDelayMin = processingDelayMin;
        this.processingDelayMax = processingDelayMax;
        this.testProcessingDelay = testProcessingDelay;
        this.upiSuccessRate = upiSuccessRate;
        this.cardSuccessRate = cardSuccessRate;
        this.jobQueueService = jobQueueService;
    }
}