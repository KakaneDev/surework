package com.surework.document;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Document Management Service Application.
 * Handles document storage, versioning, and compliance for South African SMEs.
 */
@SpringBootApplication(scanBasePackages = {
        "com.surework.document",
        "com.surework.common"
})
@EnableJpaAuditing
@EnableAsync
@EnableScheduling
public class DocumentServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(DocumentServiceApplication.class, args);
    }
}
