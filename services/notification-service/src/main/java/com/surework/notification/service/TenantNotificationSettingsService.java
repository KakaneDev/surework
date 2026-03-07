package com.surework.notification.service;

import com.surework.notification.domain.Notification;
import com.surework.notification.dto.NotificationSettingsDto.*;

import java.util.UUID;

/**
 * Service for managing tenant notification settings and user preferences.
 */
public interface TenantNotificationSettingsService {

    // ===== Tenant Settings =====

    /**
     * Get all tenant settings grouped by category.
     */
    GroupedSettingsResponse getTenantSettings(UUID tenantId);

    /**
     * Update a single tenant notification setting.
     */
    TenantSettingResponse updateTenantSetting(
            UUID tenantId,
            Notification.NotificationType type,
            UpdateTenantSettingRequest request
    );

    /**
     * Bulk update tenant settings.
     */
    GroupedSettingsResponse bulkUpdateTenantSettings(
            UUID tenantId,
            BulkUpdateRequest request
    );

    // ===== User Preferences =====

    /**
     * Get user preferences with effective state from tenant settings.
     */
    GroupedUserPreferencesResponse getUserPreferences(UUID tenantId, UUID userId);

    /**
     * Update a user preference for a notification type.
     */
    UserPreferenceResponse updateUserPreference(
            UUID tenantId,
            UUID userId,
            Notification.NotificationType type,
            UpdateUserPreferenceRequest request
    );
}
