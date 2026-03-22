package com.surework.notification.websocket;

import com.surework.notification.domain.Notification;
import com.surework.notification.dto.NotificationDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/**
 * Handles WebSocket message delivery for notifications.
 * Uses STOMP protocol for reliable message delivery to specific users.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class NotificationWebSocketHandler {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Send a notification to a specific user via WebSocket.
     * The user subscribes to /user/queue/notifications to receive messages.
     *
     * <p>The userId must match the Principal.getName() value from the authenticated
     * WebSocket session. UserPrincipal.getName() returns userId.toString().
     *
     * @param notification The notification to send
     */
    public void sendNotificationToUser(Notification notification) {
        try {
            NotificationDto.WebSocketPayload payload = NotificationDto.WebSocketPayload.fromEntity(notification);
            String destination = "/queue/notifications";
            String userId = notification.getUserId().toString();

            // convertAndSendToUser routes to /user/{userId}/queue/notifications
            // where {userId} must match Principal.getName() from the authenticated session
            messagingTemplate.convertAndSendToUser(userId, destination, payload);
            log.info("Sent notification {} to user {} via WebSocket destination /user/{}/queue/notifications",
                    notification.getId(), userId, userId);
        } catch (Exception e) {
            log.error("Failed to send notification {} to user {} via WebSocket: {}",
                    notification.getId(), notification.getUserId(), e.getMessage(), e);
        }
    }

    /**
     * Send a notification to all connected users (broadcast).
     * Users subscribe to /topic/notifications for broadcast messages.
     *
     * @param notification The notification to broadcast
     */
    public void broadcastNotification(Notification notification) {
        try {
            NotificationDto.WebSocketPayload payload = NotificationDto.WebSocketPayload.fromEntity(notification);
            messagingTemplate.convertAndSend("/topic/notifications", payload);
            log.debug("Broadcast notification {} to all users", notification.getId());
        } catch (Exception e) {
            log.error("Failed to broadcast notification {}: {}", notification.getId(), e.getMessage());
        }
    }

    /**
     * Send an unread count update to a specific user.
     *
     * @param userId The user's ID
     * @param count  The unread count
     */
    public void sendUnreadCountUpdate(String userId, long count) {
        try {
            messagingTemplate.convertAndSendToUser(
                    userId,
                    "/queue/notifications/count",
                    new NotificationDto.UnreadCount(count)
            );
            log.debug("Sent unread count {} to user {}", count, userId);
        } catch (Exception e) {
            log.error("Failed to send unread count to user {}: {}", userId, e.getMessage());
        }
    }
}
