package com.gateway.jobs;

import com.gateway.models.Refund;
import com.gateway.repositories.RefundRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Optional;

@Component
public class ProcessRefundJob implements Job {
    
    private RefundRepository refundRepository;
    
    private com.gateway.repositories.PaymentRepository paymentRepository;
    
    private boolean testMode;
    
    private String refundId;
    
    public ProcessRefundJob() {}
    
    public ProcessRefundJob(String refundId) {
        this.refundId = refundId;
    }
    
    @Override
    public void execute() {
        // Fetch refund record from database using the refund ID
        Optional<Refund> refundOpt = refundRepository.findById(refundId);
        if (!refundOpt.isPresent()) {
            System.err.println("Refund not found: " + refundId);
            return;
        }
        
        Refund refund = refundOpt.get();
        
        // Simulate refund processing delay: wait 3-5 seconds (random within this range)
        int processingDelay = testMode ? 1000 : 3000 + (int)(Math.random() * 2000); // 3-5 seconds
        
        try {
            Thread.sleep(processingDelay);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            System.err.println("Refund processing interrupted: " + refundId);
            return;
        }

        // Update refund status in database
        refund.setStatus("processed");
        refund.setProcessedAt(LocalDateTime.now());

        // Save updated refund status
        refundRepository.save(refund);
        
        // TODO: Enqueue webhook delivery job for 'refund.processed' event
        // This would be implemented when we create the webhook worker
    }
    
    public void setRefundId(String refundId) {
        this.refundId = refundId;
    }
    
    public void setDependencies(RefundRepository refundRepository, com.gateway.repositories.PaymentRepository paymentRepository, boolean testMode) {
        this.refundRepository = refundRepository;
        this.paymentRepository = paymentRepository;
        this.testMode = testMode;
    }
}