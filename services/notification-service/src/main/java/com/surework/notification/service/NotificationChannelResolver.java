package com.surework.notification.service;

import com.surework.notification.domain.Notification;
import com.surework.notification.dto.NotificationSettingsDto.EnabledChannels;

import java.util.UUID;

/**
 * Service for resolving which notification channels are enabled
 * for a specific user and notification type.
 *
 * Resolution logic:
 * 1. Get tenant settings for notification type
 * 2. If mandatory -> return tenant settings (user cannot override)
 * 3. If optional -> apply user preferences (can only disable enabled channels)
 * 4. Return EnabledChannels(email, sms, inApp)
 */
public interface NotificationChannelResolver {

    /**
     * Resolve which channels are enabled for a notification.
     *
     * @param tenantId The tenant ID
     * @param userId The user ID
     * @param type The notification type
     * @return EnabledChannels indicating which channels to use
     */
    EnabledChannels resolveChannels(UUID tenantId, UUID userId, Notification.NotificationType type);

    /**
     * Initialize default settings for a new tenant.
     *
     * @param tenantId The tenant ID
     */
    void initializeTenantSettings(UUID tenantId);

    /**
     * Check if settings exist for a tenant.
     *
     * @param tenantId The tenant ID
     * @return true if settings exist
     */
    boolean tenantSettingsExist(UUID tenantId);
}
