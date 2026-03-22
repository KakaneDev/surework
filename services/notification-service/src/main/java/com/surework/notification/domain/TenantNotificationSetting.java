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
 * Entity for tenant-level notification channel settings.
 * Controls which delivery channels (Email, SMS, In-App) are enabled
 * for each notification type at the tenant level.
 */
@Entity
@Table(name = "tenant_notification_settings",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_tenant_notification_type",
                columnNames = {"tenant_id", "notification_type"}
        ),
        indexes = @Index(
                name = "idx_tenant_notification_settings_tenant",
                columnList = "tenant_id"
        ))
@Getter
@Setter
@NoArgsConstructor
public class TenantNotificationSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false, length = 50)
    private Notification.NotificationType notificationType;

    @Column(name = "email_enabled", nullable = false)
    private boolean emailEnabled = true;

    @Column(name = "sms_enabled", nullable = false)
    private boolean smsEnabled = false;

    @Column(name = "in_app_enabled", nullable = false)
    private boolean inAppEnabled = true;

    @Column(name = "is_mandatory", nullable = false)
    private boolean mandatory = false;

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
     * Create a new tenant notification setting with defaults.
     */
    public static TenantNotificationSetting createDefault(
            UUID tenantId,
            Notification.NotificationType type
    ) {
        TenantNotificationSetting setting = new TenantNotificationSetting();
        setting.setTenantId(tenantId);
        setting.setNotificationType(type);
        setting.setEmailEnabled(true);
        setting.setSmsEnabled(false);
        setting.setInAppEnabled(true);
        setting.setMandatory(NotificationCategory.isMandatory(type));
        return setting;
    }

    /**
     * Create settings for all notification types for a tenant.
     */
    public static java.util.List<TenantNotificationSetting> createDefaultsForTenant(UUID tenantId) {
        return java.util.Arrays.stream(Notification.NotificationType.values())
                .map(type -> createDefault(tenantId, type))
                .toList();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        TenantNotificationSetting that = (TenantNotificationSetting) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
