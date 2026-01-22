package com.surework.hr;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * HR Service - Employee and Leave Management.
 * Implements User Stories 1-2: Employee Management and Leave Management.
 *
 * Responsibilities:
 * - Employee CRUD operations
 * - Employee onboarding/offboarding
 * - Leave request management
 * - Leave balance tracking
 * - BCEA compliance for leave policies
 */
@SpringBootApplication(scanBasePackages = {
        "com.surework.hr",
        "com.surework.common"
})
@EnableAsync
public class HrServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(HrServiceApplication.class, args);
    }
}
