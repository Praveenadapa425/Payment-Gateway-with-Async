package com.gateway.workers;

import com.gateway.jobs.ProcessPaymentJob;
import com.gateway.services.JobQueueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Profile("worker")
public class PaymentWorker {

    @Autowired
    private JobQueueService jobQueueService;

    // Process payment jobs periodically
    @Scheduled(fixedDelay = 1000) // Check every second
    public void processPaymentJobs() {
        try {
            ProcessPaymentJob job = (ProcessPaymentJob) jobQueueService.dequeueJob("payment_queue");
            if (job != null) {
                job.execute();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            System.err.println("Payment worker interrupted: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Error processing payment job: " + e.getMessage());
        }
    }
}