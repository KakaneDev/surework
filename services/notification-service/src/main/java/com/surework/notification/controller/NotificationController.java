package com.surework.notification.controller;

import com.surework.notification.config.JwtHeaderAuthenticationFilter.UserPrincipal;
import com.surework.notification.dto.NotificationDto;
import com.surework.notification.service.NotificationService;
import com.surework.common.web.PageResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.UUID;

/**
 * REST API controller for notification operations.
 */
@RestController
@RequestMapping({"/api/notifications", "/api/v1/notifications"})
@RequiredArgsConstructor
@Validated
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Get paginated notifications for the current user.
     */
    @GetMapping
    public ResponseEntity<PageResponse<NotificationDto.Response>> getNotifications(
            @AuthenticationPrincipal UserPrincipal user,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        UUID userId = getUserId(user);
        Page<NotificationDto.Response> page = notificationService.getNotifications(userId, pageable);
        return ResponseEntity.ok(PageResponse.from(page));
    }

    /**
     * Get recent notifications for dropdown (limited count).
     *
     * @param user the authenticated user principal
     * @param limit number of notifications to return (1-50, default 10)
     * @return list of recent notifications
     */
    @GetMapping("/recent")
    public ResponseEntity<List<NotificationDto.Response>> getRecentNotifications(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(defaultValue = "10")
            @Min(value = 1, message = "Limit must be at least 1")
            @Max(value = 50, message = "Limit cannot exceed 50")
            int limit
    ) {
        UUID userId = getUserId(user);
        List<NotificationDto.Response> notifications = notificationService.getRecentNotifications(userId, limit);
        return ResponseEntity.ok(notifications);
    }

    /**
     * Get unread notification count.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<NotificationDto.UnreadCount> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal user
    ) {
        UUID userId = getUserId(user);
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(new NotificationDto.UnreadCount(count));
    }

    /**
     * Get a single notification.
     */
    @GetMapping("/{id}")
    public ResponseEntity<NotificationDto.Response> getNotification(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal user
    ) {
        UUID userId = getUserId(user);
        return notificationService.getNotification(id, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Mark a notification as read (PATCH method).
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationDto.Response> markAsReadPatch(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal user
    ) {
        UUID userId = getUserId(user);
        return notificationService.markAsRead(id, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Mark a notification as read (POST method for frontend compatibility).
     */
    @PostMapping("/{id}/read")
    public ResponseEntity<NotificationDto.Response> markAsRead(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal user
    ) {
        UUID userId = getUserId(user);
        return notificationService.markAsRead(id, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Mark all notifications as read.
     */
    @PostMapping({"/mark-all-read", "/read-all"})
    public ResponseEntity<Void> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal user
    ) {
        UUID userId = getUserId(user);
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }

    /**
     * Delete a notification.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal user
    ) {
        UUID userId = getUserId(user);
        if (notificationService.deleteNotification(id, userId)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Create a test notification (for development/testing).
     */
    @PostMapping("/test")
    public ResponseEntity<NotificationDto.Response> createTestNotification(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody(required = false) NotificationDto.CreateRequest request
    ) {
        UUID userId = getUserId(user);

        // If no request body, create a default test notification
        NotificationDto.CreateRequest createRequest = request != null ? request :
                new NotificationDto.CreateRequest(
                        userId,
                        com.surework.notification.domain.Notification.NotificationType.SYSTEM_ANNOUNCEMENT,
                        "Test Notification",
                        "This is a test notification created at " + java.time.Instant.now(),
                        null,
                        null
                );

        // Ensure the notification is for the current user
        if (!createRequest.userId().equals(userId)) {
            createRequest = new NotificationDto.CreateRequest(
                    userId,
                    createRequest.type(),
                    createRequest.title(),
                    createRequest.message(),
                    createRequest.referenceType(),
                    createRequest.referenceId()
            );
        }

        NotificationDto.Response response = notificationService.createNotification(createRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get user ID from authenticated principal.
     *
     * @throws AccessDeniedException if no authenticated user is present
     */
    private UUID getUserId(UserPrincipal user) {
        if (user == null || user.userId() == null) {
            throw new AccessDeniedException("User authentication required to access notifications");
        }
        return user.userId();
    }
}
