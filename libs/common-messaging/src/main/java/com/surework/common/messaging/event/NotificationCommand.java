package com.surework.common.messaging.event;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Sealed interface for notification commands.
 * These are command events sent to the Notification Service.
 * Implements Constitution Principle III: Java 21 Features (Sealed Interfaces).
 */
public sealed interface NotificationCommand extends DomainEvent permits
        NotificationCommand.SendEmail,
        NotificationCommand.SendSms,
        NotificationCommand.SendPushNotification {

    /**
     * Command to send an email notification.
     */
    record SendEmail(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            String recipientEmail,
            String templateId,
            Map<String, String> templateVariables,
            String subject,
            UUID correlationId
    ) implements NotificationCommand {}

    /**
     * Command to send an SMS notification.
     */
    record SendSms(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            String recipientPhone,
            String templateId,
            Map<String, String> templateVariables,
            UUID correlationId
    ) implements NotificationCommand {}

    /**
     * Command to send a push notification.
     */
    record SendPushNotification(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID userId,
            String title,
            String body,
            Map<String, String> data,
            UUID correlationId
    ) implements NotificationCommand {}
}
