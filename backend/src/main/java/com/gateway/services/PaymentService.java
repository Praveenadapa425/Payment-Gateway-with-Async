package com.gateway.services;

import com.gateway.dto.*;
import com.gateway.models.*;
import com.gateway.repositories.*;
import com.gateway.utils.IdGenerator;
import com.gateway.jobs.ProcessPaymentJob;
import com.gateway.services.JobQueueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private MerchantRepository merchantRepository;

    @Autowired
    private ValidationService validationService;

    @Autowired
    private JobQueueService jobQueueService;

    @Autowired
    private IdempotencyKeyRepository idempotencyKeyRepository;

    @Value("${TEST_MODE:false}")
    private boolean testMode;

    @Value("${TEST_PAYMENT_SUCCESS:true}")
    private boolean testPaymentSuccess;

    @Value("${PROCESSING_DELAY_MIN:5000}")
    private int processingDelayMin;

    @Value("${PROCESSING_DELAY_MAX:10000}")
    private int processingDelayMax;

    @Value("${TEST_PROCESSING_DELAY:1000}")
    private int testProcessingDelay;

    @Value("${UPI_SUCCESS_RATE:0.90}")
    private double upiSuccessRate;

    @Value("${CARD_SUCCESS_RATE:0.95}")
    private double cardSuccessRate;

    public CreatePaymentResponse createPayment(String apiKey, String apiSecret, String idempotencyKey, CreatePaymentRequest request) {
        // Authenticate merchant
        Optional<Merchant> merchantOpt = merchantRepository.findByApiKeyAndApiSecret(apiKey, apiSecret);
        if (!merchantOpt.isPresent()) {
            throw new RuntimeException("Invalid API credentials");
        }

        Merchant merchant = merchantOpt.get();
        
        // Handle idempotency key if provided
        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            Optional<IdempotencyKey> existingKeyOpt = idempotencyKeyRepository.findByKeyAndMerchantId(idempotencyKey, merchant.getId());
            if (existingKeyOpt.isPresent()) {
                IdempotencyKey existingKey = existingKeyOpt.get();
                
                // Check if the key has expired
                if (LocalDateTime.now().isAfter(existingKey.getExpiresAt())) {
                    // Delete expired key and continue with normal processing
                    idempotencyKeyRepository.delete(existingKey);
                } else {
                    // Return cached response
                    ObjectMapper objectMapper = new ObjectMapper();
                    try {
                        return objectMapper.readValue(existingKey.getResponse(), CreatePaymentResponse.class);
                    } catch (Exception e) {
                        // If deserialization fails, continue with normal processing
                        System.err.println("Failed to deserialize cached response: " + e.getMessage());
                    }
                }
            }
        }

        // Find order by ID
        Optional<Order> orderOpt = orderRepository.findById(request.getOrderId());
        if (!orderOpt.isPresent()) {
            throw new RuntimeException("Order not found");
        }

        Order order = orderOpt.get();

        // Verify order belongs to the authenticated merchant
        if (!order.getMerchantId().equals(merchant.getId())) {
            throw new RuntimeException("Order not found");
        }

        // Validate payment method specific fields
        if ("upi".equals(request.getMethod())) {
            validateUpiPayment(request);
        } else if ("card".equals(request.getMethod())) {
            validateCardPayment(request);
        } else {
            throw new RuntimeException("Invalid payment method");
        }

        // Generate payment ID
        String paymentId = IdGenerator.generatePaymentId();

        // Create payment entity
        Payment payment = new Payment();
        payment.setId(paymentId);
        payment.setOrderId(request.getOrderId());
        payment.setMerchantId(merchant.getId());
        payment.setAmount(order.getAmount());
        payment.setCurrency(order.getCurrency());
        payment.setMethod(request.getMethod());
        payment.setStatus("pending"); // Payment starts in pending state for async processing

        // Set method-specific fields
        if ("upi".equals(request.getMethod())) {
            payment.setVpa(request.getVpa());
        } else if ("card".equals(request.getMethod())) {
            String cardNumber = request.getCard().getNumber();
            payment.setCardNetwork(validationService.detectCardNetwork(cardNumber));
            if (cardNumber.length() >= 4) {
                payment.setCardLast4(cardNumber.substring(cardNumber.length() - 4));
            }
        }

        // Save payment (initially with pending status)
        payment = paymentRepository.save(payment);

        // Enqueue ProcessPaymentJob with payment ID
        ProcessPaymentJob paymentJob = new ProcessPaymentJob(paymentId);
        jobQueueService.enqueueJob("payment_queue", paymentJob);

        // Create response
        CreatePaymentResponse response = new CreatePaymentResponse();
        response.setId(payment.getId());
        response.setOrderId(payment.getOrderId());
        response.setAmount(payment.getAmount());
        response.setCurrency(payment.getCurrency());
        response.setMethod(payment.getMethod());
        response.setStatus(payment.getStatus()); // Will be 'pending'
        response.setCreatedAt(payment.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));

        if ("upi".equals(request.getMethod())) {
            response.setVpa(payment.getVpa());
        } else if ("card".equals(request.getMethod())) {
            response.setCardNetwork(payment.getCardNetwork());
            response.setCardLast4(payment.getCardLast4());
        }
        
        // If idempotency key was provided, store the response
        if (idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            ObjectMapper objectMapper = new ObjectMapper();
            try {
                String responseJson = objectMapper.writeValueAsString(response);
                IdempotencyKey idempotencyKeyObj = new IdempotencyKey(
                    idempotencyKey,
                    merchant.getId(),
                    responseJson,
                    LocalDateTime.now().plusDays(1) // Expires in 24 hours
                );
                idempotencyKeyRepository.save(idempotencyKeyObj);
            } catch (Exception e) {
                System.err.println("Failed to serialize response for idempotency: " + e.getMessage());
            }
        }

        return response;
    }

    public GetPaymentResponse getPayment(String apiKey, String apiSecret, String paymentId) {
        // Authenticate merchant
        Optional<Merchant> merchantOpt = merchantRepository.findByApiKeyAndApiSecret(apiKey, apiSecret);
        if (!merchantOpt.isPresent()) {
            throw new RuntimeException("Invalid API credentials");
        }

        Merchant merchant = merchantOpt.get();

        // Find payment by ID and merchant ID
        Optional<Payment> paymentOpt = paymentRepository.findByIdAndMerchantId(paymentId, merchant.getId());
        if (!paymentOpt.isPresent()) {
            throw new RuntimeException("Payment not found");
        }

        Payment payment = paymentOpt.get();

        // Create response
        GetPaymentResponse response = new GetPaymentResponse();
        response.setId(payment.getId());
        response.setOrderId(payment.getOrderId());
        response.setAmount(payment.getAmount());
        response.setCurrency(payment.getCurrency());
        response.setMethod(payment.getMethod());
        response.setStatus(payment.getStatus());
        response.setErrorCode(payment.getErrorCode());
        response.setErrorDescription(payment.getErrorDescription());
        response.setCreatedAt(payment.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));
        response.setUpdatedAt(payment.getUpdatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));

        if ("upi".equals(payment.getMethod())) {
            response.setVpa(payment.getVpa());
        } else if ("card".equals(payment.getMethod())) {
            response.setCardNetwork(payment.getCardNetwork());
            response.setCardLast4(payment.getCardLast4());
        }

        return response;
    }

    public List<GetPaymentResponse> getAllPayments(String apiKey, String apiSecret) {
        // Authenticate merchant
        Optional<Merchant> merchantOpt = merchantRepository.findByApiKeyAndApiSecret(apiKey, apiSecret);
        if (!merchantOpt.isPresent()) {
            throw new RuntimeException("Invalid API credentials");
        }

        Merchant merchant = merchantOpt.get();

        // Find all payments for this merchant
        List<Payment> payments = paymentRepository.findByMerchantId(merchant.getId());

        // Convert to responses
        return payments.stream()
            .map(this::convertToGetPaymentResponse)
            .collect(Collectors.toList());
    }

    private GetPaymentResponse convertToGetPaymentResponse(Payment payment) {
        GetPaymentResponse response = new GetPaymentResponse();
        response.setId(payment.getId());
        response.setOrderId(payment.getOrderId());
        response.setAmount(payment.getAmount());
        response.setCurrency(payment.getCurrency());
        response.setMethod(payment.getMethod());
        response.setStatus(payment.getStatus());
        response.setErrorCode(payment.getErrorCode());
        response.setErrorDescription(payment.getErrorDescription());
        response.setCreatedAt(payment.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));
        response.setUpdatedAt(payment.getUpdatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));

        if ("upi".equals(payment.getMethod())) {
            response.setVpa(payment.getVpa());
        } else if ("card".equals(payment.getMethod())) {
            response.setCardNetwork(payment.getCardNetwork());
            response.setCardLast4(payment.getCardLast4());
        }
        return response;
    }

    public CapturePaymentResponse capturePayment(String apiKey, String apiSecret, String paymentId, CapturePaymentRequest request) {
        // Authenticate merchant
        Optional<Merchant> merchantOpt = merchantRepository.findByApiKeyAndApiSecret(apiKey, apiSecret);
        if (!merchantOpt.isPresent()) {
            throw new RuntimeException("Invalid API credentials");
        }

        Merchant merchant = merchantOpt.get();

        // Find payment by ID and merchant ID
        Optional<Payment> paymentOpt = paymentRepository.findByIdAndMerchantId(paymentId, merchant.getId());
        if (!paymentOpt.isPresent()) {
            throw new RuntimeException("Payment not found");
        }

        Payment payment = paymentOpt.get();

        // Verify payment is in a capturable state
        if (!"success".equals(payment.getStatus())) {
            throw new RuntimeException("Payment not in capturable state");
        }

        // Update captured field to true
        payment.setCaptured(true);
        payment = paymentRepository.save(payment);

        // Create response
        CapturePaymentResponse response = new CapturePaymentResponse();
        response.setId(payment.getId());
        response.setOrderId(payment.getOrderId());
        response.setAmount(payment.getAmount());
        response.setCurrency(payment.getCurrency());
        response.setMethod(payment.getMethod());
        response.setStatus(payment.getStatus());
        response.setCaptured(payment.getCaptured());
        response.setCreatedAt(payment.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));
        response.setUpdatedAt(payment.getUpdatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));

        if ("upi".equals(payment.getMethod())) {
            response.setVpa(payment.getVpa());
        } else if ("card".equals(payment.getMethod())) {
            response.setCardNetwork(payment.getCardNetwork());
            response.setCardLast4(payment.getCardLast4());
        }

        return response;
    }

    private void validateUpiPayment(CreatePaymentRequest request) {
        if (request.getVpa() == null || request.getVpa().trim().isEmpty()) {
            throw new RuntimeException("VPA is required for UPI payments");
        }

        if (!validationService.validateVpa(request.getVpa())) {
            throw new RuntimeException("Invalid VPA format");
        }
    }

    private void validateCardPayment(CreatePaymentRequest request) {
        if (request.getCard() == null) {
            throw new RuntimeException("Card details are required for card payments");
        }

        String number = request.getCard().getNumber();
        String expiryMonth = request.getCard().getExpiryMonth();
        String expiryYear = request.getCard().getExpiryYear();
        String cvv = request.getCard().getCvv();
        String holderName = request.getCard().getHolderName();

        if (number == null || number.trim().isEmpty()) {
            throw new RuntimeException("Card number is required");
        }

        if (expiryMonth == null || expiryMonth.trim().isEmpty()) {
            throw new RuntimeException("Expiry month is required");
        }

        if (expiryYear == null || expiryYear.trim().isEmpty()) {
            throw new RuntimeException("Expiry year is required");
        }

        if (cvv == null || cvv.trim().isEmpty()) {
            throw new RuntimeException("CVV is required");
        }

        if (holderName == null || holderName.trim().isEmpty()) {
            throw new RuntimeException("Card holder name is required");
        }

        if (!validationService.validateCardNumber(number)) {
            throw new RuntimeException("Invalid card number");
        }

        if (!validationService.validateExpiryDate(expiryMonth, expiryYear)) {
            throw new RuntimeException("Invalid expiry date");
        }

        // Basic CVV validation (3-4 digits)
        if (!cvv.matches("\\d{3,4}")) {
            throw new RuntimeException("Invalid CVV format");
        }
    }

    private String generateRandomString(int length) {
        String characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < length; i++) {
            int index = (int) (Math.random() * characters.length());
            result.append(characters.charAt(index));
        }
        return result.toString();
    }
}