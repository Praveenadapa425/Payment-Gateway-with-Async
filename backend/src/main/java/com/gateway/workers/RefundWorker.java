package com.gateway.workers;

import com.gateway.jobs.ProcessRefundJob;
import com.gateway.services.JobQueueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Profile("worker")
public class RefundWorker {

    @Autowired
    private JobQueueService jobQueueService;
    
    @Autowired
    private com.gateway.repositories.RefundRepository refundRepository;
    
    @Autowired
    private com.gateway.repositories.PaymentRepository paymentRepository;
    
    @Value("${TEST_MODE:false}")
    private boolean testMode;

    // Process refund jobs periodically
    @Scheduled(fixedDelay = 1000) // Check every second
    public void processRefundJobs() {
        try {
            ProcessRefundJob job = (ProcessRefundJob) jobQueueService.dequeueJob("refund_queue");
            if (job != null) {
                job.setDependencies(refundRepository, paymentRepository, testMode);
                job.execute();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            System.err.println("Refund worker interrupted: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Error processing refund job: " + e.getMessage());
            e.printStackTrace();
        }
    }
}