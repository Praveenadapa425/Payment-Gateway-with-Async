package com.gateway.repositories;

import com.gateway.models.WebhookLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface WebhookLogRepository extends JpaRepository<WebhookLog, UUID> {
    List<WebhookLog> findByMerchantId(UUID merchantId);
    List<WebhookLog> findByStatus(String status);
    
    @Query("SELECT w FROM WebhookLog w WHERE w.nextRetryAt < CURRENT_TIMESTAMP AND w.status = 'pending'")
    List<WebhookLog> findPendingRetries();
    
    @Query("SELECT w FROM WebhookLog w WHERE w.merchantId = :merchantId ORDER BY w.createdAt DESC")
    List<WebhookLog> findByMerchantIdOrderByCreatedAtDesc(@Param("merchantId") UUID merchantId);
}