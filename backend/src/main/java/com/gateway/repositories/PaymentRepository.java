package com.gateway.repositories;

import com.gateway.models.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, String> {
    Optional<Payment> findByIdAndMerchantId(String id, String merchantId);
    List<Payment> findByOrderId(String orderId);
    List<Payment> findByMerchantId(String merchantId);
    List<Payment> findByStatus(String status);
}