package com.surework.accounting;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Accounting Service Application.
 * Implements double-entry bookkeeping with South African VAT compliance.
 */
@SpringBootApplication(scanBasePackages = {"com.surework.accounting", "com.surework.common"})
@EnableJpaAuditing
@EnableAsync
@EnableScheduling
public class AccountingServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AccountingServiceApplication.class, args);
    }
}
