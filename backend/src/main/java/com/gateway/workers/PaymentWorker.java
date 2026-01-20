package com.gateway.workers;

import com.gateway.jobs.ProcessPaymentJob;
import com.gateway.repositories.PaymentRepository;
import com.gateway.services.JobQueueService;
import com.gateway.services.ValidationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Profile("worker")
public class PaymentWorker {

    @Autowired
    private JobQueueService jobQueueService;
    
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

    // Process payment jobs periodically
    @Scheduled(fixedDelay = 1000) // Check every second
    public void processPaymentJobs() {
        try {
            ProcessPaymentJob job = (ProcessPaymentJob) jobQueueService.dequeueJob("payment_queue");
            if (job != null) {
                // Set dependencies before execution
                job.setDependencies(paymentRepository, validationService, testMode, testPaymentSuccess, 
                    processingDelayMin, processingDelayMax, testProcessingDelay, upiSuccessRate, cardSuccessRate, jobQueueService);
                job.execute();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            System.err.println("Payment worker interrupted: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Error processing payment job: " + e.getMessage());
            e.printStackTrace();
        }
    }
}