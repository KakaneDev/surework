package com.surework.notification.service;

import com.surework.notification.domain.Notification;
import com.surework.notification.domain.TenantNotificationSetting;
import com.surework.notification.domain.UserNotificationPreference;
import com.surework.notification.dto.NotificationSettingsDto.EnabledChannels;
import com.surework.notification.repository.TenantNotificationSettingRepository;
import com.surework.notification.repository.UserNotificationPreferenceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Implementation of NotificationChannelResolver.
 * Resolves which notification channels should be used based on
 * tenant settings and user preferences.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationChannelResolverImpl implements NotificationChannelResolver {

    /**
     * Default channel configuration when no tenant settings exist.
     * Email and In-App enabled by default, SMS disabled (requires explicit opt-in).
     */
    private static final EnabledChannels DEFAULT_CHANNELS = new EnabledChannels(true, false, true);

    private final TenantNotificationSettingRepository tenantSettingRepository;
    private final UserNotificationPreferenceRepository userPreferenceRepository;

    /**
     * Resolve which channels are enabled for a notification.
     * <p>
     * Resolution logic:
     * <ol>
     *   <li>Get tenant settings for notification type</li>
     *   <li>If no settings exist, return defaults: email=true, sms=false, inApp=true</li>
     *   <li>If mandatory notification, return tenant settings (user cannot override)</li>
     *   <li>If optional, apply user preferences (can only disable enabled channels)</li>
     * </ol>
     *
     * @param tenantId The tenant ID
     * @param userId The user ID
     * @param type The notification type
     * @return EnabledChannels indicating which channels to use (never null)
     */
    @Override
    @Transactional(readOnly = true)
    public EnabledChannels resolveChannels(UUID tenantId, UUID userId, Notification.NotificationType type) {
        var tenantSetting = tenantSettingRepository
                .findByTenantIdAndNotificationType(tenantId, type)
                .orElse(null);

        if (tenantSetting == null) {
            log.debug("No tenant setting for type {}, using defaults", type);
            return DEFAULT_CHANNELS;
        }

        boolean email = tenantSetting.isEmailEnabled();
        boolean sms = tenantSetting.isSmsEnabled();
        boolean inApp = tenantSetting.isInAppEnabled();

        // Mandatory notifications cannot be overridden by user preferences
        if (tenantSetting.isMandatory()) {
            log.debug("Mandatory notification type {}, using tenant settings", type);
            return new EnabledChannels(email, sms, inApp);
        }

        // Apply user preferences (can only disable, not enable)
        var userPref = userPreferenceRepository
                .findByUserIdAndNotificationType(userId, type)
                .orElse(null);

        if (userPref != null) {
            if (userPref.isEmailDisabled()) email = false;
            if (userPref.isSmsDisabled()) sms = false;
            if (userPref.isInAppDisabled()) inApp = false;
            log.debug("Applied user preferences for type {}: email={}, sms={}, inApp={}",
                    type, email, sms, inApp);
        }

        return new EnabledChannels(email, sms, inApp);
    }

    /**
     * Initialize default settings for a new tenant.
     * <p>
     * This method is idempotent - concurrent calls are handled safely via
     * database unique constraint. If settings already exist (either from
     * prior call or concurrent insert), this method returns without error.
     *
     * @param tenantId The tenant ID
     */
    @Override
    @Transactional
    public void initializeTenantSettings(UUID tenantId) {
        if (tenantSettingsExist(tenantId)) {
            log.debug("Tenant {} already has notification settings", tenantId);
            return;
        }

        try {
            List<TenantNotificationSetting> defaults = TenantNotificationSetting
                    .createDefaultsForTenant(tenantId);

            tenantSettingRepository.saveAll(defaults);
            log.info("Initialized {} notification settings for tenant {}", defaults.size(), tenantId);
        } catch (DataIntegrityViolationException e) {
            // Concurrent insert already created the settings - this is fine
            log.debug("Tenant {} settings already initialized by concurrent request", tenantId);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean tenantSettingsExist(UUID tenantId) {
        return tenantSettingRepository.existsByTenantId(tenantId);
    }
}
