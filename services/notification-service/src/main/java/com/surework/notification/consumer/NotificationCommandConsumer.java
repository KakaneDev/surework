package com.surework.notification.consumer;

import com.surework.common.messaging.KafkaTopics;
import com.surework.common.messaging.event.NotificationCommand;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

/**
 * Kafka consumer for notification commands.
 * Implements Constitution Principle XII: Communication (Async Notifications via Kafka).
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class NotificationCommandConsumer {

    @KafkaListener(
            topics = KafkaTopics.NOTIFICATION_COMMANDS,
            groupId = "${spring.kafka.consumer.group-id}",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handleNotificationCommand(NotificationCommand command, Acknowledgment ack) {
        log.info("Received notification command: {} for tenant {}",
                command.eventType(), command.tenantId());

        try {
            switch (command) {
                case NotificationCommand.SendEmail email -> handleSendEmail(email);
                case NotificationCommand.SendSms sms -> handleSendSms(sms);
                case NotificationCommand.SendPushNotification push -> handleSendPush(push);
            }
            ack.acknowledge();
            log.debug("Notification command processed successfully: {}", command.eventId());

        } catch (Exception e) {
            log.error("Error processing notification command {}: {}",
                    command.eventId(), e.getMessage(), e);
            // Don't acknowledge - message will be redelivered or sent to DLT
            throw e;
        }
    }

    private void handleSendEmail(NotificationCommand.SendEmail command) {
        log.info("Processing email notification to {} with template {}",
                command.recipientEmail(), command.templateId());
        // TODO: Implement email service when needed
        log.warn("Email service not yet implemented - would send to: {}", command.recipientEmail());
    }

    private void handleSendSms(NotificationCommand.SendSms command) {
        log.info("Processing SMS notification to {} with template {}",
                command.recipientPhone(), command.templateId());
        // TODO: Implement SMS service integration
        log.warn("SMS service not yet implemented");
    }

    private void handleSendPush(NotificationCommand.SendPushNotification command) {
        log.info("Processing push notification to user {} with title {}",
                command.userId(), command.title());
        // TODO: Implement push notification service integration
        log.warn("Push notification service not yet implemented");
    }
}
