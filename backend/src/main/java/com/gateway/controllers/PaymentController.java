package com.gateway.controllers;

import com.gateway.dto.CreatePaymentRequest;
import com.gateway.dto.CreatePaymentResponse;
import com.gateway.dto.GetPaymentResponse;
import com.gateway.dto.ErrorResponse;
import com.gateway.dto.CapturePaymentRequest;
import com.gateway.dto.CapturePaymentResponse;
import com.gateway.services.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping(value = "/payments", consumes = "application/json")
    public ResponseEntity<?> createPayment(
            @RequestHeader("X-Api-Key") String apiKey,
            @RequestHeader("X-Api-Secret") String apiSecret,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @RequestBody CreatePaymentRequest request) {
        
        try {
            CreatePaymentResponse response = paymentService.createPayment(apiKey, apiSecret, idempotencyKey, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            // Handle authentication errors
            if (e.getMessage().equals("Invalid API credentials")) {
                ErrorResponse errorResponse = new ErrorResponse("AUTHENTICATION_ERROR", e.getMessage());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }
            // Handle validation errors
            else if (e.getMessage().contains("VPA is required") || 
                     e.getMessage().contains("Invalid VPA format")) {
                ErrorResponse errorResponse = new ErrorResponse("INVALID_VPA", e.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
            else if (e.getMessage().contains("Card details are required") ||
                     e.getMessage().contains("Card number is required") ||
                     e.getMessage().contains("Invalid card number") ||
                     e.getMessage().contains("Invalid expiry date")) {
                ErrorResponse errorResponse = new ErrorResponse("INVALID_CARD", e.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
            else if (e.getMessage().contains("amount must be at least")) {
                ErrorResponse errorResponse = new ErrorResponse("BAD_REQUEST_ERROR", e.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
            // Handle not found errors
            else if (e.getMessage().equals("Order not found")) {
                ErrorResponse errorResponse = new ErrorResponse("NOT_FOUND_ERROR", e.getMessage());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }
            // Handle other errors
            else {
                ErrorResponse errorResponse = new ErrorResponse("BAD_REQUEST_ERROR", e.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
        }
    }

    @GetMapping("/payments")
    public ResponseEntity<?> getAllPayments(
            @RequestHeader("X-Api-Key") String apiKey,
            @RequestHeader("X-Api-Secret") String apiSecret) {
        
        try {
            List<GetPaymentResponse> responses = paymentService.getAllPayments(apiKey, apiSecret);
            return ResponseEntity.ok(responses);
        } catch (RuntimeException e) {
            // Handle authentication errors
            if (e.getMessage().equals("Invalid API credentials")) {
                ErrorResponse errorResponse = new ErrorResponse("AUTHENTICATION_ERROR", e.getMessage());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }
            // Handle other errors
            else {
                ErrorResponse errorResponse = new ErrorResponse("BAD_REQUEST_ERROR", e.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
        }
    }

    @GetMapping("/payments/{paymentId}")
    public ResponseEntity<?> getPayment(
            @RequestHeader("X-Api-Key") String apiKey,
            @RequestHeader("X-Api-Secret") String apiSecret,
            @PathVariable("paymentId") String paymentId) {
        
        try {
            GetPaymentResponse response = paymentService.getPayment(apiKey, apiSecret, paymentId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            // Handle authentication errors
            if (e.getMessage().equals("Invalid API credentials")) {
                ErrorResponse errorResponse = new ErrorResponse("AUTHENTICATION_ERROR", e.getMessage());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }
            // Handle not found errors
            else if (e.getMessage().equals("Payment not found")) {
                ErrorResponse errorResponse = new ErrorResponse("NOT_FOUND_ERROR", e.getMessage());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }
            // Handle other errors
            else {
                ErrorResponse errorResponse = new ErrorResponse("BAD_REQUEST_ERROR", e.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
        }
    }

    @PostMapping("/payments/{paymentId}/capture")
    public ResponseEntity<?> capturePayment(
            @RequestHeader("X-Api-Key") String apiKey,
            @RequestHeader("X-Api-Secret") String apiSecret,
            @PathVariable("paymentId") String paymentId,
            @RequestBody CapturePaymentRequest request) {
        
        try {
            CapturePaymentResponse response = paymentService.capturePayment(apiKey, apiSecret, paymentId, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            // Handle authentication errors
            if (e.getMessage().equals("Invalid API credentials")) {
                ErrorResponse errorResponse = new ErrorResponse("AUTHENTICATION_ERROR", e.getMessage());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }
            // Handle validation errors
            else if (e.getMessage().contains("Payment not found") ||
                     e.getMessage().contains("Payment not in capturable state")) {
                ErrorResponse errorResponse = new ErrorResponse("BAD_REQUEST_ERROR", e.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
            // Handle other errors
            else {
                ErrorResponse errorResponse = new ErrorResponse("BAD_REQUEST_ERROR", e.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
        }
    }
}