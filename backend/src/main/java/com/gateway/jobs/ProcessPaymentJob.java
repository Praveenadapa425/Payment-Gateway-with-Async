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
    
    @Autowired
    private PaymentRepository paymentRepository;
    
    @Autowired
    private ValidationService validationService;
    
    @Value("${TEST_MODE:false}")
    private boolean testMode;
    
    @Value("${TEST_PAYMENT_SUCCESS:true}")
    private boolean testPaymentSuccess;
    
    @Value("${PROCESSING_DELAY_MIN:5000}")
    private int processingDelayMin;
    
    @Value("${PROCESSING_DELAY_MAX:10000}")
    private int processingDelayMax;
    
    @Value("${TEST_PROCESSING_DELAY:1000}")
    private int testProcessingDelay;
    
    @Value("${UPI_SUCCESS_RATE:0.90}")
    private double upiSuccessRate;
    
    @Value("${CARD_SUCCESS_RATE:0.95}")
    private double cardSuccessRate;
    
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
        
        // TODO: Enqueue webhook delivery job for the appropriate event
        // This would be implemented when we create the webhook worker
    }
    
    public void setPaymentId(String paymentId) {
        this.paymentId = paymentId;
    }
}