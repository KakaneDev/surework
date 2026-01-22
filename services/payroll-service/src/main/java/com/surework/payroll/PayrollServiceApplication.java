package com.surework.payroll;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Payroll Service Application.
 * Handles payroll processing, PAYE tax calculations, UIF, and payslip generation
 * with full South African statutory compliance.
 */
@SpringBootApplication(scanBasePackages = {"com.surework.payroll", "com.surework.common"})
@EnableJpaAuditing
@EnableAsync
@EnableScheduling
public class PayrollServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(PayrollServiceApplication.class, args);
    }
}
