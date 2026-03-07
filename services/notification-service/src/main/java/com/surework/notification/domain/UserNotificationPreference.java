package com.surework.notification.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Entity for user-level notification preferences.
 * Allows users to opt-out of optional notifications.
 * Users cannot opt-out of mandatory notification types.
 */
@Entity
@Table(name = "user_notification_preferences",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_user_notification_type",
                columnNames = {"user_id", "notification_type"}
        ),
        indexes = @Index(
                name = "idx_user_notification_preferences_user",
                columnList = "user_id"
        ))
@Getter
@Setter
@NoArgsConstructor
public class UserNotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false, length = 50)
    private Notification.NotificationType notificationType;

    /**
     * User has opted out of email for this notification type.
     * Only applies if tenant has email enabled and notification is not mandatory.
     */
    @Column(name = "email_disabled", nullable = false)
    private boolean emailDisabled = false;

    /**
     * User has opted out of SMS for this notification type.
     * Only applies if tenant has SMS enabled and notification is not mandatory.
     */
    @Column(name = "sms_disabled", nullable = false)
    private boolean smsDisabled = false;

    /**
     * User has opted out of in-app notifications for this type.
     * Only applies if tenant has in-app enabled and notification is not mandatory.
     */
    @Column(name = "in_app_disabled", nullable = false)
    private boolean inAppDisabled = false;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * Create a new preference for a user and notification type.
     */
    public static UserNotificationPreference create(
            UUID userId,
            Notification.NotificationType type
    ) {
        UserNotificationPreference pref = new UserNotificationPreference();
        pref.setUserId(userId);
        pref.setNotificationType(type);
        return pref;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserNotificationPreference that = (UserNotificationPreference) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
