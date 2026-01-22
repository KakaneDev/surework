package com.surework.notification;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Notification Service - Handles email, SMS, and push notifications.
 * Implements Constitution Principle XII: Communication (Notifications via Kafka).
 *
 * Responsibilities:
 * - Consume notification commands from Kafka
 * - Send emails using templates
 * - Send SMS notifications
 * - Send push notifications
 * - Track notification delivery status
 */
@SpringBootApplication(scanBasePackages = {
        "com.surework.notification",
        "com.surework.common"
})
@EnableAsync
public class NotificationServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(NotificationServiceApplication.class, args);
    }
}
