package com.surework.notification.repository;

import com.surework.notification.domain.Notification;
import com.surework.notification.domain.TenantNotificationSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for TenantNotificationSetting entity.
 */
@Repository
public interface TenantNotificationSettingRepository extends JpaRepository<TenantNotificationSetting, UUID> {

    /**
     * Find all settings for a tenant.
     */
    List<TenantNotificationSetting> findByTenantId(UUID tenantId);

    /**
     * Find setting for a specific tenant and notification type.
     */
    Optional<TenantNotificationSetting> findByTenantIdAndNotificationType(
            UUID tenantId,
            Notification.NotificationType notificationType
    );

    /**
     * Check if settings exist for a tenant.
     */
    boolean existsByTenantId(UUID tenantId);

    /**
     * Find all settings for a tenant grouped by mandatory status.
     */
    @Query("""
            SELECT s FROM TenantNotificationSetting s
            WHERE s.tenantId = :tenantId
            ORDER BY s.mandatory DESC, s.notificationType ASC
            """)
    List<TenantNotificationSetting> findByTenantIdOrdered(@Param("tenantId") UUID tenantId);

    /**
     * Find all enabled channels for a notification type.
     */
    @Query("""
            SELECT s FROM TenantNotificationSetting s
            WHERE s.tenantId = :tenantId
            AND s.notificationType = :type
            AND (s.emailEnabled = true OR s.smsEnabled = true OR s.inAppEnabled = true)
            """)
    Optional<TenantNotificationSetting> findEnabledSetting(
            @Param("tenantId") UUID tenantId,
            @Param("type") Notification.NotificationType type
    );
}
