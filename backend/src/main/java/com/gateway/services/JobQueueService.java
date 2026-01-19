package com.gateway.services;

import com.gateway.jobs.Job;
import org.redisson.api.RBlockingQueue;
import org.redisson.api.RDelayedQueue;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class JobQueueService {

    @Autowired
    private RedissonClient redissonClient;

    public void enqueueJob(String queueName, Job job) {
        RBlockingQueue<Job> queue = redissonClient.getBlockingQueue(queueName);
        queue.offer(job);
    }

    public void enqueueJobWithDelay(String queueName, Job job, long delay, java.util.concurrent.TimeUnit timeUnit) {
        RBlockingQueue<Job> queue = redissonClient.getBlockingQueue(queueName);
        RDelayedQueue<Job> delayedQueue = redissonClient.getDelayedQueue(queue);
        delayedQueue.offer(job, delay, timeUnit);
    }

    public Job dequeueJob(String queueName) throws InterruptedException {
        RBlockingQueue<Job> queue = redissonClient.getBlockingQueue(queueName);
        return queue.take();
    }
}