package com.gateway.services;

import org.springframework.stereotype.Service;
import java.util.regex.Pattern;

@Service
public class ValidationService {

    // VPA Validation
    private static final Pattern VPA_PATTERN = Pattern.compile("^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$");

    public boolean validateVpa(String vpa) {
        if (vpa == null || vpa.trim().isEmpty()) {
            return false;
        }
        return VPA_PATTERN.matcher(vpa).matches();
    }

    // Luhn Algorithm for Card Validation
    public boolean validateCardNumber(String cardNumber) {
        if (cardNumber == null) {
            return false;
        }

        // Remove spaces and dashes
        String cleanedCardNumber = cardNumber.replaceAll("[\\s-]", "");

        // Check if it contains only digits and has proper length (13-19)
        if (!cleanedCardNumber.matches("\\d{13,19}")) {
            return false;
        }

        // Apply Luhn algorithm
        int sum = 0;
        boolean alternate = false;

        for (int i = cleanedCardNumber.length() - 1; i >= 0; i--) {
            int n = Character.getNumericValue(cleanedCardNumber.charAt(i));

            if (alternate) {
                n *= 2;
                if (n > 9) {
                    n = (n % 10) + 1;
                }
            }

            sum += n;
            alternate = !alternate;
        }

        return (sum % 10 == 0);
    }

    // Card Network Detection
    public String detectCardNetwork(String cardNumber) {
        if (cardNumber == null) {
            return "unknown";
        }

        // Remove spaces and dashes
        String cleanedCardNumber = cardNumber.replaceAll("[\\s-]", "");

        if (cleanedCardNumber.startsWith("4")) {
            return "visa";
        } else if (cleanedCardNumber.startsWith("5") && 
                   cleanedCardNumber.length() >= 2) {
            String secondDigit = cleanedCardNumber.substring(1, 2);
            if ("12345".contains(secondDigit)) {
                return "mastercard";
            }
        } else if (cleanedCardNumber.startsWith("3") && 
                   cleanedCardNumber.length() >= 2) {
            String secondDigit = cleanedCardNumber.substring(1, 2);
            if ("47".contains(secondDigit)) {
                return "amex";
            }
        } else if (cleanedCardNumber.startsWith("6") && 
                   cleanedCardNumber.length() >= 2) {
            String secondDigit = cleanedCardNumber.substring(1, 2);
            if ("05".contains(secondDigit)) {
                return "rupay";
            }
        } else if (cleanedCardNumber.startsWith("8") && 
                   cleanedCardNumber.length() >= 2) {
            int secondDigit = Character.getNumericValue(cleanedCardNumber.charAt(1));
            if (secondDigit >= 1 && secondDigit <= 9) {
                return "rupay";
            }
        }

        return "unknown";
    }

    // Card Expiry Validation
    public boolean validateExpiryDate(String month, String year) {
        if (month == null || year == null) {
            return false;
        }

        try {
            int expiryMonth = Integer.parseInt(month);
            int expiryYear = Integer.parseInt(year);

            // Handle 2-digit year format
            if (year.length() == 2) {
                expiryYear = 2000 + expiryYear;
            }

            // Validate month range
            if (expiryMonth < 1 || expiryMonth > 12) {
                return false;
            }

            // Get current date for comparison
            java.time.LocalDate currentDate = java.time.LocalDate.now();
            int currentYear = currentDate.getYear();
            int currentMonth = currentDate.getMonthValue();

            // Compare expiry with current date
            if (expiryYear < currentYear) {
                return false;
            } else if (expiryYear == currentYear && expiryMonth < currentMonth) {
                return false;
            }

            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }
}