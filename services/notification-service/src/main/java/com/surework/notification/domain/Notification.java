package com.surework.notification.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Notification entity representing a user notification.
 * Notifications are delivered via WebSocket for real-time updates
 * and stored in the database for persistence.
 */
@Entity
@Table(name = "notification", indexes = {
        @Index(name = "idx_notification_user_unread", columnList = "user_id, read"),
        @Index(name = "idx_notification_user_created", columnList = "user_id, created_at")
})
@Getter
@Setter
@NoArgsConstructor
public class Notification extends BaseEntity {

    /**
     * The user who receives this notification.
     */
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    /**
     * Type of notification for categorization and icon display.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 50)
    private NotificationType type;

    /**
     * Short title for the notification.
     */
    @Column(name = "title", nullable = false)
    private String title;

    /**
     * Detailed notification message.
     */
    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    /**
     * Type of the referenced entity (e.g., LEAVE_REQUEST, PAYSLIP, DOCUMENT).
     */
    @Column(name = "reference_type", length = 50)
    private String referenceType;

    /**
     * ID of the referenced entity for navigation.
     */
    @Column(name = "reference_id")
    private UUID referenceId;

    /**
     * Whether the notification has been read.
     */
    @Column(name = "read", nullable = false)
    private boolean read = false;

    /**
     * Timestamp when the notification was read.
     */
    @Column(name = "read_at")
    private Instant readAt;

    /**
     * Mark this notification as read.
     */
    public void markAsRead() {
        if (!this.read) {
            this.read = true;
            this.readAt = Instant.now();
        }
    }

    /**
     * Create a notification with the given parameters.
     */
    public static Notification create(
            UUID userId,
            NotificationType type,
            String title,
            String message,
            String referenceType,
            UUID referenceId
    ) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setReferenceType(referenceType);
        notification.setReferenceId(referenceId);
        return notification;
    }

    /**
     * Notification types for categorization.
     */
    public enum NotificationType {
        // Leave
        LEAVE_SUBMITTED,
        LEAVE_APPROVED,
        LEAVE_REJECTED,
        LEAVE_CANCELLED,

        // Payroll
        PAYSLIP_READY,
        PAYROLL_PROCESSED,

        // Documents
        DOCUMENT_UPLOADED,
        DOCUMENT_EXPIRING,
        DOCUMENT_SHARED,

        // Support
        TICKET_CREATED,
        TICKET_UPDATED,
        TICKET_RESOLVED,
        TICKET_ASSIGNED,

        // Recruitment
        APPLICATION_RECEIVED,
        INTERVIEW_SCHEDULED,
        OFFER_EXTENDED,
        OFFER_ACCEPTED,
        OFFER_DECLINED,

        // External Posting & Portal Management (Admin)
        EXTERNAL_POSTING_FAILED,
        EXTERNAL_POSTING_REQUIRES_MANUAL,
        PORTAL_CREDENTIAL_ALERT,

        // System
        SYSTEM_ANNOUNCEMENT,
        ACCOUNT_UPDATED,
        PASSWORD_CHANGED
    }
}
