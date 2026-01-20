package com.gateway.controllers;

import com.gateway.dto.CreatePaymentRequest;
import com.gateway.dto.ErrorResponse;
import com.gateway.models.Merchant;
import com.gateway.models.Payment;
import com.gateway.models.Refund;
import com.gateway.repositories.MerchantRepository;
import com.gateway.repositories.PaymentRepository;
import com.gateway.repositories.RefundRepository;
import com.gateway.services.JobQueueService;
import com.gateway.utils.IdGenerator;
import com.gateway.jobs.ProcessRefundJob;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class RefundController {

    @Autowired
    private RefundRepository refundRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private MerchantRepository merchantRepository;

    @Autowired
    private JobQueueService jobQueueService;

    @PostMapping("/payments/{paymentId}/refunds")
    public ResponseEntity<?> createRefund(
            @RequestHeader("X-Api-Key") String apiKey,
            @RequestHeader("X-Api-Secret") String apiSecret,
            @PathVariable("paymentId") String paymentId,
            @RequestBody RefundRequest request) {

        try {
            // Authenticate merchant
            Optional<Merchant> merchantOpt = merchantRepository.findByApiKeyAndApiSecret(apiKey, apiSecret);
            if (!merchantOpt.isPresent()) {
                ErrorResponse errorResponse = new ErrorResponse("AUTHENTICATION_ERROR", "Invalid API credentials");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }

            Merchant merchant = merchantOpt.get();

            // Look up payment by paymentId
            Optional<Payment> paymentOpt = paymentRepository.findById(paymentId);
            if (!paymentOpt.isPresent()) {
                ErrorResponse errorResponse = new ErrorResponse("NOT_FOUND_ERROR", "Payment not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }

            Payment payment = paymentOpt.get();

            // Ensure payment.merchant_id matches the authenticated merchant
            if (!payment.getMerchantId().equals(merchant.getId())) {
                ErrorResponse errorResponse = new ErrorResponse("NOT_FOUND_ERROR", "Payment not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }

            // Verify payment is refundable
            if (!"success".equals(payment.getStatus())) {
                ErrorResponse errorResponse = new ErrorResponse("BAD_REQUEST_ERROR", "Payment not in refundable state");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }

            // Calculate total already refunded
            List<Refund> existingRefunds = refundRepository.findByPaymentId(paymentId);
            int totalRefundedAmount = existingRefunds.stream()
                    .filter(r -> "processed".equals(r.getStatus()) || "pending".equals(r.getStatus()))
                    .mapToInt(Refund::getAmount)
                    .sum();

            // Validate refund amount
            if (request.getAmount() == null || request.getAmount() <= 0) {
                ErrorResponse errorResponse = new ErrorResponse("BAD_REQUEST_ERROR", "Amount is required and must be positive");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }

            if (request.getAmount() > (payment.getAmount() - totalRefundedAmount)) {
                ErrorResponse errorResponse = new ErrorResponse("BAD_REQUEST_ERROR", "Refund amount exceeds available amount");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }

            // Generate refund ID
            String refundId = IdGenerator.generateRefundId();

            // Create refund record in database
            Refund refund = new Refund();
            refund.setId(refundId);
            refund.setPaymentId(paymentId);
            refund.setMerchantId(merchant.getId());
            refund.setAmount(request.getAmount());
            refund.setReason(request.getReason());
            refund.setStatus("pending");

            refund = refundRepository.save(refund);

            // Enqueue ProcessRefundJob
            ProcessRefundJob refundJob = new ProcessRefundJob(refundId);
            jobQueueService.enqueueJob("refund_queue", refundJob);

            // Create response
            RefundResponse response = new RefundResponse();
            response.setId(refund.getId());
            response.setPaymentId(refund.getPaymentId());
            response.setAmount(refund.getAmount());
            response.setReason(refund.getReason());
            response.setStatus(refund.getStatus());
            response.setCreatedAt(refund.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            ErrorResponse errorResponse = new ErrorResponse("BAD_REQUEST_ERROR", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @GetMapping("/refunds/{refundId}")
    public ResponseEntity<?> getRefund(
            @RequestHeader("X-Api-Key") String apiKey,
            @RequestHeader("X-Api-Secret") String apiSecret,
            @PathVariable("refundId") String refundId) {

        try {
            // Authenticate merchant
            Optional<Merchant> merchantOpt = merchantRepository.findByApiKeyAndApiSecret(apiKey, apiSecret);
            if (!merchantOpt.isPresent()) {
                ErrorResponse errorResponse = new ErrorResponse("AUTHENTICATION_ERROR", "Invalid API credentials");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }

            Merchant merchant = merchantOpt.get();

            // Find refund by ID and merchant ID
            Optional<Refund> refundOpt = refundRepository.findByIdAndMerchantId(refundId, merchant.getId());
            if (!refundOpt.isPresent()) {
                ErrorResponse errorResponse = new ErrorResponse("NOT_FOUND_ERROR", "Refund not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }

            Refund refund = refundOpt.get();

            // Create response
            RefundResponse response = new RefundResponse();
            response.setId(refund.getId());
            response.setPaymentId(refund.getPaymentId());
            response.setAmount(refund.getAmount());
            response.setReason(refund.getReason());
            response.setStatus(refund.getStatus());
            response.setCreatedAt(refund.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));
            
            if (refund.getProcessedAt() != null) {
                response.setProcessedAt(refund.getProcessedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            ErrorResponse errorResponse = new ErrorResponse("BAD_REQUEST_ERROR", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @GetMapping("/refunds")
    public ResponseEntity<?> listRefunds(
            @RequestHeader("X-Api-Key") String apiKey,
            @RequestHeader("X-Api-Secret") String apiSecret,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "0") int offset) {

        try {
            // Authenticate merchant
            Optional<Merchant> merchantOpt = merchantRepository.findByApiKeyAndApiSecret(apiKey, apiSecret);
            if (!merchantOpt.isPresent()) {
                ErrorResponse errorResponse = new ErrorResponse("AUTHENTICATION_ERROR", "Invalid API credentials");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }

            Merchant merchant = merchantOpt.get();

            // Get refunds for this merchant
            List<Refund> refunds = refundRepository.findByMerchantIdOrderByCreatedAtDesc(merchant.getId());
            
            // Apply pagination
            int start = Math.min(offset, refunds.size());
            int end = Math.min(start + limit, refunds.size());
            List<Refund> paginatedRefunds = refunds.subList(start, end);

            // Transform refunds to response format
            List<RefundResponse> refundResponses = paginatedRefunds.stream().map(refund -> {
                RefundResponse response = new RefundResponse();
                response.setId(refund.getId());
                response.setPaymentId(refund.getPaymentId());
                response.setAmount(refund.getAmount());
                response.setReason(refund.getReason());
                response.setStatus(refund.getStatus());
                response.setCreatedAt(refund.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));
                
                if (refund.getProcessedAt() != null) {
                    response.setProcessedAt(refund.getProcessedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));
                }
                
                return response;
            }).collect(Collectors.toList());

            // Create response
            Map<String, Object> response = new HashMap<>();
            response.put("data", refundResponses);
            response.put("total", refunds.size());
            response.put("limit", limit);
            response.put("offset", offset);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            ErrorResponse errorResponse = new ErrorResponse("BAD_REQUEST_ERROR", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    // Inner classes for request/response
    public static class RefundRequest {
        private Integer amount;
        private String reason;

        public Integer getAmount() {
            return amount;
        }

        public void setAmount(Integer amount) {
            this.amount = amount;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }
    }

    public static class RefundResponse {
        private String id;
        private String paymentId;
        private Integer amount;
        private String reason;
        private String status;
        private String createdAt;
        private String processedAt;

        // Getters and setters
        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getPaymentId() {
            return paymentId;
        }

        public void setPaymentId(String paymentId) {
            this.paymentId = paymentId;
        }

        public Integer getAmount() {
            return amount;
        }

        public void setAmount(Integer amount) {
            this.amount = amount;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(String createdAt) {
            this.createdAt = createdAt;
        }

        public String getProcessedAt() {
            return processedAt;
        }

        public void setProcessedAt(String processedAt) {
            this.processedAt = processedAt;
        }
    }
}