package com.gateway.controllers;

import com.gateway.dto.CreateOrderRequest;
import com.gateway.dto.CreateOrderResponse;
import com.gateway.dto.GetOrderResponse;
import com.gateway.dto.ErrorResponse;
import com.gateway.services.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @PostMapping("/orders")
    public ResponseEntity<?> createOrder(
            @RequestHeader("X-Api-Key") String apiKey,
            @RequestHeader("X-Api-Secret") String apiSecret,
            @RequestBody CreateOrderRequest request) {
        
        try {
            CreateOrderResponse response = orderService.createOrder(apiKey, apiSecret, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            // Handle authentication errors
            if (e.getMessage().equals("Invalid API credentials")) {
                ErrorResponse errorResponse = new ErrorResponse("AUTHENTICATION_ERROR", e.getMessage());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }
            // Handle validation errors
            else if (e.getMessage().contains("amount must be at least")) {
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

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<?> getOrder(
            @RequestHeader("X-Api-Key") String apiKey,
            @RequestHeader("X-Api-Secret") String apiSecret,
            @PathVariable("orderId") String orderId) {
        
        try {
            GetOrderResponse response = orderService.getOrder(apiKey, apiSecret, orderId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            // Handle authentication errors
            if (e.getMessage().equals("Invalid API credentials")) {
                ErrorResponse errorResponse = new ErrorResponse("AUTHENTICATION_ERROR", e.getMessage());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
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
}