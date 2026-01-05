package com.gateway.dto;

public class ErrorResponse {
    private ErrorDetails error;

    public static class ErrorDetails {
        private String code;
        private String description;

        public ErrorDetails(String code, String description) {
            this.code = code;
            this.description = description;
        }

        // Getters and Setters
        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }
    }

    public ErrorResponse(String code, String description) {
        this.error = new ErrorDetails(code, description);
    }

    // Getters and Setters
    public ErrorDetails getError() {
        return error;
    }

    public void setError(ErrorDetails error) {
        this.error = error;
    }
}