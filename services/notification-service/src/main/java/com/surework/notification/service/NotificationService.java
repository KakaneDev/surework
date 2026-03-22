package com.surework.notification.service;

import com.surework.notification.domain.Notification;
import com.surework.notification.dto.NotificationDto;
import com.surework.notification.dto.NotificationSettingsDto.EnabledChannels;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service interface for notification operations.
 */
public interface NotificationService {

    /**
     * Create a new notification and deliver via WebSocket.
     */
    NotificationDto.Response createNotification(NotificationDto.CreateRequest request);

    /**
     * Create a notification from domain parameters (internal use).
     */
    Notification createNotification(
            UUID userId,
            Notification.NotificationType type,
            String title,
            String message,
            String referenceType,
            UUID referenceId
    );

    /**
     * Create a notification with channel resolution based on tenant settings and user preferences.
     * Only sends via enabled channels.
     *
     * @param tenantId The tenant ID for channel resolution
     * @param userId The user ID to notify
     * @param type The notification type
     * @param title The notification title
     * @param message The notification message
     * @param referenceType Optional reference type for navigation
     * @param referenceId Optional reference ID for navigation
     * @return The created notification, or null if all channels are disabled
     */
    Notification createNotificationWithChannelResolution(
            UUID tenantId,
            UUID userId,
            Notification.NotificationType type,
            String title,
            String message,
            String referenceType,
            UUID referenceId
    );

    /**
     * Get the enabled channels for a notification.
     */
    EnabledChannels getEnabledChannels(UUID tenantId, UUID userId, Notification.NotificationType type);

    /**
     * Get paginated notifications for a user.
     */
    Page<NotificationDto.Response> getNotifications(UUID userId, Pageable pageable);

    /**
     * Get recent notifications for a user (for dropdown).
     */
    List<NotificationDto.Response> getRecentNotifications(UUID userId, int limit);

    /**
     * Get a single notification by ID.
     */
    Optional<NotificationDto.Response> getNotification(UUID id, UUID userId);

    /**
     * Get unread notification count for a user.
     */
    long getUnreadCount(UUID userId);

    /**
     * Mark a notification as read.
     */
    Optional<NotificationDto.Response> markAsRead(UUID id, UUID userId);

    /**
     * Mark all notifications as read for a user.
     */
    int markAllAsRead(UUID userId);

    /**
     * Delete (soft) a notification.
     */
    boolean deleteNotification(UUID id, UUID userId);
}
