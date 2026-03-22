package com.surework.notification.service;

import com.surework.notification.domain.Notification;
import com.surework.notification.dto.NotificationDto;
import com.surework.notification.dto.NotificationSettingsDto.EnabledChannels;
import com.surework.notification.repository.NotificationRepository;
import com.surework.notification.websocket.NotificationWebSocketHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementation of NotificationService.
 * Handles notification persistence and WebSocket delivery.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationWebSocketHandler webSocketHandler;
    private final NotificationChannelResolver channelResolver;

    @Override
    @Transactional
    public NotificationDto.Response createNotification(NotificationDto.CreateRequest request) {
        Notification notification = Notification.create(
                request.userId(),
                request.type(),
                request.title(),
                request.message(),
                request.referenceType(),
                request.referenceId()
        );

        notification = notificationRepository.save(notification);
        log.info("Created notification {} for user {} of type {}",
                notification.getId(), notification.getUserId(), notification.getType());

        // Send via WebSocket for real-time delivery
        webSocketHandler.sendNotificationToUser(notification);

        return NotificationDto.Response.fromEntity(notification);
    }

    @Override
    @Transactional
    public Notification createNotification(
            UUID userId,
            Notification.NotificationType type,
            String title,
            String message,
            String referenceType,
            UUID referenceId
    ) {
        Notification notification = Notification.create(userId, type, title, message, referenceType, referenceId);
        notification = notificationRepository.save(notification);

        log.info("Created notification {} for user {} of type {}",
                notification.getId(), userId, type);

        // Send via WebSocket for real-time delivery
        webSocketHandler.sendNotificationToUser(notification);

        return notification;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationDto.Response> getNotifications(UUID userId, Pageable pageable) {
        return notificationRepository.findByUserId(userId, pageable)
                .map(NotificationDto.Response::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationDto.Response> getRecentNotifications(UUID userId, int limit) {
        return notificationRepository.findRecentByUserId(userId, limit)
                .stream()
                .map(NotificationDto.Response::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<NotificationDto.Response> getNotification(UUID id, UUID userId) {
        return notificationRepository.findByIdAndUserId(id, userId)
                .map(NotificationDto.Response::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countUnreadByUserId(userId);
    }

    @Override
    @Transactional
    public Optional<NotificationDto.Response> markAsRead(UUID id, UUID userId) {
        return notificationRepository.findByIdAndUserId(id, userId)
                .map(notification -> {
                    notification.markAsRead();
                    notification = notificationRepository.save(notification);
                    log.debug("Marked notification {} as read for user {}", id, userId);
                    return NotificationDto.Response.fromEntity(notification);
                });
    }

    @Override
    @Transactional
    public int markAllAsRead(UUID userId) {
        int count = notificationRepository.markAllAsReadByUserId(userId);
        log.info("Marked {} notifications as read for user {}", count, userId);
        return count;
    }

    @Override
    @Transactional
    public boolean deleteNotification(UUID id, UUID userId) {
        return notificationRepository.findByIdAndUserId(id, userId)
                .map(notification -> {
                    notification.softDelete();
                    notificationRepository.save(notification);
                    log.info("Deleted notification {} for user {}", id, userId);
                    return true;
                })
                .orElse(false);
    }

    @Override
    @Transactional
    public Notification createNotificationWithChannelResolution(
            UUID tenantId,
            UUID userId,
            Notification.NotificationType type,
            String title,
            String message,
            String referenceType,
            UUID referenceId
    ) {
        // Resolve which channels are enabled
        EnabledChannels channels = channelResolver.resolveChannels(tenantId, userId, type);

        if (!channels.hasAnyEnabled()) {
            log.debug("All channels disabled for notification type {} to user {}", type, userId);
            return null;
        }

        // Create and persist the notification
        Notification notification = Notification.create(userId, type, title, message, referenceType, referenceId);
        notification = notificationRepository.save(notification);

        log.info("Created notification {} for user {} of type {} (channels: email={}, sms={}, inApp={})",
                notification.getId(), userId, type, channels.email(), channels.sms(), channels.inApp());

        // Send via enabled channels
        if (channels.inApp()) {
            webSocketHandler.sendNotificationToUser(notification);
        }

        // Email and SMS channels are configured but delivery services not yet integrated.
        // When enabled, these will publish domain events for async processing.
        if (channels.email()) {
            log.debug("Email channel enabled for notification {} - delivery pending integration",
                    notification.getId());
        }
        if (channels.sms()) {
            log.debug("SMS channel enabled for notification {} - delivery pending integration",
                    notification.getId());
        }

        return notification;
    }

    @Override
    @Transactional(readOnly = true)
    public EnabledChannels getEnabledChannels(UUID tenantId, UUID userId, Notification.NotificationType type) {
        return channelResolver.resolveChannels(tenantId, userId, type);
    }
}
