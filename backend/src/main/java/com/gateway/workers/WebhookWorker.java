package com.gateway.workers;

import com.gateway.jobs.DeliverWebhookJob;
import com.gateway.services.JobQueueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Profile("worker")
public class WebhookWorker {

    @Autowired
    private JobQueueService jobQueueService;

    // Process webhook jobs periodically
    @Scheduled(fixedDelay = 1000) // Check every second
    public void processWebhookJobs() {
        try {
            DeliverWebhookJob job = (DeliverWebhookJob) jobQueueService.dequeueJob("webhook_queue");
            if (job != null) {
                job.execute();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            System.err.println("Webhook worker interrupted: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Error processing webhook job: " + e.getMessage());
        }
    }
}