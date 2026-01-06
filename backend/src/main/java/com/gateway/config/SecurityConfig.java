package com.gateway.config;

import org.springframework.context.annotation.Configuration;

@Configuration
public class SecurityConfig {
    // For this implementation, we're handling authentication at the controller/service level
    // rather than using Spring Security filters, to keep it simple and match the requirements
    // which specify checking X-Api-Key and X-Api-Secret headers in the business logic
}