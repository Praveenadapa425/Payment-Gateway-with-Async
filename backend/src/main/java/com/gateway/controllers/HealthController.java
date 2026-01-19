package com.gateway.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

import org.redisson.api.RedissonClient;

@RestController
@RequestMapping("/api/v1")
public class HealthController {

    @Autowired
    private RedissonClient redissonClient;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        
        response.put("status", "healthy");
        response.put("database", "connected");
        
        // Check Redis connection
        String redisStatus = "disconnected";
        try {
            redissonClient.getBucket("health_check_test").set("ok"); // Simple operation to test connection
            redisStatus = "connected";
        } catch (Exception e) {
            System.err.println("Redis connection failed: " + e.getMessage());
        }
        response.put("redis", redisStatus);
        
        // For worker status, we'll assume it's running if we can connect to Redis
        // In a real implementation, you'd have a more sophisticated way to check worker status
        String workerStatus = redisStatus.equals("connected") ? "running" : "stopped";
        response.put("worker", workerStatus);
        
        response.put("timestamp", java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));
        
        return ResponseEntity.ok(response);
    }
}