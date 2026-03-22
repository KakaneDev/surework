package com.surework.notification.dto;

import com.surework.notification.domain.Notification;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

/**
 * DTOs for Notification operations.
 */
public sealed interface NotificationDto {

    /**
     * Request to create a notification (internal use or testing).
     */
    record CreateRequest(
            @NotNull(message = "User ID is required")
            UUID userId,

            @NotNull(message = "Notification type is required")
            Notification.NotificationType type,

            @NotBlank(message = "Title is required")
            @Size(max = 255, message = "Title must not exceed 255 characters")
            String title,

            @NotBlank(message = "Message is required")
            String message,

            String referenceType,

            UUID referenceId
    ) implements NotificationDto {}

    /**
     * Response DTO for a notification.
     */
    record Response(
            UUID id,
            Notification.NotificationType type,
            String title,
            String message,
            String referenceType,
            UUID referenceId,
            boolean read,
            Instant readAt,
            Instant createdAt
    ) implements NotificationDto {
        public static Response fromEntity(Notification notification) {
            return new Response(
                    notification.getId(),
                    notification.getType(),
                    notification.getTitle(),
                    notification.getMessage(),
                    notification.getReferenceType(),
                    notification.getReferenceId(),
                    notification.isRead(),
                    notification.getReadAt(),
                    notification.getCreatedAt()
            );
        }
    }

    /**
     * Lightweight response for list views.
     */
    record ListItem(
            UUID id,
            Notification.NotificationType type,
            String title,
            boolean read,
            Instant createdAt
    ) implements NotificationDto {
        public static ListItem fromEntity(Notification notification) {
            return new ListItem(
                    notification.getId(),
                    notification.getType(),
                    notification.getTitle(),
                    notification.isRead(),
                    notification.getCreatedAt()
            );
        }
    }

    /**
     * Unread count response.
     */
    record UnreadCount(
            long count
    ) implements NotificationDto {}

    /**
     * WebSocket notification payload for real-time delivery.
     */
    record WebSocketPayload(
            UUID id,
            Notification.NotificationType type,
            String title,
            String message,
            String referenceType,
            UUID referenceId,
            Instant createdAt
    ) implements NotificationDto {
        public static WebSocketPayload fromEntity(Notification notification) {
            return new WebSocketPayload(
                    notification.getId(),
                    notification.getType(),
                    notification.getTitle(),
                    notification.getMessage(),
                    notification.getReferenceType(),
                    notification.getReferenceId(),
                    notification.getCreatedAt()
            );
        }
    }
}
