package com.gateway.controllers;

import com.gateway.dto.CreatePaymentRequest;
import com.gateway.dto.CreatePaymentResponse;
import com.gateway.models.Merchant;
import com.gateway.models.Order;
import com.gateway.models.Payment;
import com.gateway.repositories.MerchantRepository;
import com.gateway.repositories.OrderRepository;
import com.gateway.repositories.PaymentRepository;
import com.gateway.services.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1")
public class PublicApiController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private MerchantRepository merchantRepository;

    @Autowired
    private PaymentService paymentService;

    @GetMapping("/orders/{orderId}/public")
    public ResponseEntity<?> getPublicOrder(@PathVariable("orderId") String orderId) {
        // Find order by ID
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (!orderOpt.isPresent()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", Map.of("code", "NOT_FOUND_ERROR", "description", "Order not found"));
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }

        Order order = orderOpt.get();

        // Verify that the order belongs to a valid merchant
        Optional<Merchant> merchantOpt = merchantRepository.findById(java.util.UUID.fromString(order.getMerchantId()));
        if (!merchantOpt.isPresent()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", Map.of("code", "NOT_FOUND_ERROR", "description", "Order not found"));
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }

        // Create public response with only basic info
        Map<String, Object> response = new HashMap<>();
        response.put("id", order.getId());
        response.put("amount", order.getAmount());
        response.put("currency", order.getCurrency());
        response.put("status", order.getStatus());
        response.put("created_at", order.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

        return ResponseEntity.ok(response);
    }

    @PostMapping("/payments/public")
    public ResponseEntity<?> createPublicPayment(@RequestBody CreatePaymentRequest request) {
        // Find order by ID
        Optional<Order> orderOpt = orderRepository.findById(request.getOrderId());
        if (!orderOpt.isPresent()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", Map.of("code", "NOT_FOUND_ERROR", "description", "Order not found"));
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }

        Order order = orderOpt.get();

        // Verify that the order belongs to a valid merchant
        Optional<Merchant> merchantOpt = merchantRepository.findById(java.util.UUID.fromString(order.getMerchantId()));
        if (!merchantOpt.isPresent()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", Map.of("code", "NOT_FOUND_ERROR", "description", "Order not found"));
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }

        // Create payment using the existing payment service
        try {
            CreatePaymentResponse response = paymentService.createPayment(
                merchantOpt.get().getApiKey(), 
                merchantOpt.get().getApiSecret(), 
                request
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", Map.of("code", "BAD_REQUEST_ERROR", "description", e.getMessage()));
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }
}