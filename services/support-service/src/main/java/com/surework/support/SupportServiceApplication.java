package com.surework.support;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main application class for SureWork Support Service.
 * Handles support ticket management for employee self-service.
 */
@SpringBootApplication(scanBasePackages = {
        "com.surework.support",
        "com.surework.common"
})
public class SupportServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(SupportServiceApplication.class, args);
    }
}
