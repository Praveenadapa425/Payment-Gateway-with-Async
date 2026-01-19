package com.gateway.utils;

import java.util.Random;

public class IdGenerator {
    
    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    private static final Random RANDOM = new Random();
    
    public static String generateOrderId() {
        return "order_" + generateRandomString(16);
    }
    
    public static String generatePaymentId() {
        return "pay_" + generateRandomString(16);
    }
    
    public static String generateRefundId() {
        return "rfnd_" + generateRandomString(16);
    }
    
    private static String generateRandomString(int length) {
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < length; i++) {
            result.append(CHARACTERS.charAt(RANDOM.nextInt(CHARACTERS.length())));
        }
        return result.toString();
    }
}