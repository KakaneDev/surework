package com.surework.notification.service;

import com.surework.notification.domain.Notification;
import com.surework.notification.domain.NotificationCategory;
import com.surework.notification.domain.TenantNotificationSetting;
import com.surework.notification.domain.UserNotificationPreference;
import com.surework.notification.dto.NotificationSettingsDto.*;
import com.surework.notification.repository.TenantNotificationSettingRepository;
import com.surework.notification.repository.UserNotificationPreferenceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of TenantNotificationSettingsService.
 * Manages tenant-level notification channel settings and user preferences.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class TenantNotificationSettingsServiceImpl implements TenantNotificationSettingsService {

    private final TenantNotificationSettingRepository tenantSettingRepository;
    private final UserNotificationPreferenceRepository userPreferenceRepository;
    private final NotificationChannelResolver channelResolver;

    /**
     * Initialize tenant settings if they don't exist.
     * This is a separate transaction to avoid read-only conflicts.
     */
    @Transactional
    public void ensureSettingsInitialized(UUID tenantId) {
        if (!channelResolver.tenantSettingsExist(tenantId)) {
            channelResolver.initializeTenantSettings(tenantId);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public GroupedSettingsResponse getTenantSettings(UUID tenantId) {
        List<TenantNotificationSetting> settings = tenantSettingRepository.findByTenantId(tenantId);

        if (settings.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Notification settings not initialized for tenant. Call initialize endpoint first.");
        }

        return buildGroupedSettingsResponse(settings);
    }

    @Override
    @Transactional
    public TenantSettingResponse updateTenantSetting(
            UUID tenantId,
            Notification.NotificationType type,
            UpdateTenantSettingRequest request
    ) {
        TenantNotificationSetting setting = tenantSettingRepository
                .findByTenantIdAndNotificationType(tenantId, type)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Setting not found for type: " + type));

        // Defense-in-depth: verify tenant ownership
        if (!setting.getTenantId().equals(tenantId)) {
            log.warn("Tenant {} attempted to modify setting belonging to tenant {}",
                    tenantId, setting.getTenantId());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Setting does not belong to this tenant");
        }

        setting.setEmailEnabled(request.emailEnabled());
        setting.setSmsEnabled(request.smsEnabled());
        setting.setInAppEnabled(request.inAppEnabled());

        setting = tenantSettingRepository.save(setting);
        log.info("Updated tenant {} setting for type {}", tenantId, type);

        return TenantSettingResponse.fromEntity(setting);
    }

    @Override
    @Transactional
    public GroupedSettingsResponse bulkUpdateTenantSettings(
            UUID tenantId,
            BulkUpdateRequest request
    ) {
        int updatedCount = 0;

        for (TypeChannelUpdate update : request.settings()) {
            Optional<TenantNotificationSetting> settingOpt = tenantSettingRepository
                    .findByTenantIdAndNotificationType(tenantId, update.type());

            if (settingOpt.isPresent()) {
                TenantNotificationSetting setting = settingOpt.get();

                // Defense-in-depth: verify tenant ownership
                if (!setting.getTenantId().equals(tenantId)) {
                    log.warn("Tenant {} attempted to modify setting belonging to tenant {}",
                            tenantId, setting.getTenantId());
                    continue;
                }

                setting.setEmailEnabled(update.emailEnabled());
                setting.setSmsEnabled(update.smsEnabled());
                setting.setInAppEnabled(update.inAppEnabled());
                tenantSettingRepository.save(setting);
                updatedCount++;
            }
        }

        log.info("Bulk updated {} of {} settings for tenant {}",
                updatedCount, request.settings().size(), tenantId);

        return getTenantSettingsInternal(tenantId);
    }

    @Override
    @Transactional(readOnly = true)
    public GroupedUserPreferencesResponse getUserPreferences(UUID tenantId, UUID userId) {
        List<TenantNotificationSetting> tenantSettings = tenantSettingRepository.findByTenantId(tenantId);

        if (tenantSettings.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Notification settings not initialized for tenant");
        }

        List<UserNotificationPreference> userPrefs = userPreferenceRepository.findByUserId(userId);

        Map<Notification.NotificationType, UserNotificationPreference> userPrefMap = userPrefs.stream()
                .collect(Collectors.toMap(
                        UserNotificationPreference::getNotificationType,
                        p -> p
                ));

        return buildGroupedUserPreferencesResponse(tenantSettings, userPrefMap);
    }

    @Override
    @Transactional
    public UserPreferenceResponse updateUserPreference(
            UUID tenantId,
            UUID userId,
            Notification.NotificationType type,
            UpdateUserPreferenceRequest request
    ) {
        TenantNotificationSetting tenantSetting = tenantSettingRepository
                .findByTenantIdAndNotificationType(tenantId, type)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Setting not found for type: " + type));

        // Mandatory notifications cannot be disabled by users
        if (tenantSetting.isMandatory()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cannot update preferences for mandatory notification type: " + type);
        }

        // Get or create user preference
        UserNotificationPreference userPref = userPreferenceRepository
                .findByUserIdAndNotificationType(userId, type)
                .orElseGet(() -> UserNotificationPreference.create(userId, type));

        // Users can only disable channels that are enabled at tenant level
        userPref.setEmailDisabled(request.emailDisabled() && tenantSetting.isEmailEnabled());
        userPref.setSmsDisabled(request.smsDisabled() && tenantSetting.isSmsEnabled());
        userPref.setInAppDisabled(request.inAppDisabled() && tenantSetting.isInAppEnabled());

        userPref = userPreferenceRepository.save(userPref);
        log.info("Updated user {} preference for type {}", userId, type);

        return UserPreferenceResponse.create(tenantSetting, userPref);
    }

    /**
     * Internal method to get tenant settings without throwing on empty.
     * Used after bulk update within same transaction.
     */
    private GroupedSettingsResponse getTenantSettingsInternal(UUID tenantId) {
        List<TenantNotificationSetting> settings = tenantSettingRepository.findByTenantId(tenantId);
        return buildGroupedSettingsResponse(settings);
    }

    private GroupedSettingsResponse buildGroupedSettingsResponse(List<TenantNotificationSetting> settings) {
        Map<NotificationCategory, List<TenantNotificationSetting>> grouped = settings.stream()
                .collect(Collectors.groupingBy(
                        s -> NotificationCategory.forType(s.getNotificationType()),
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        List<CategoryGroup> categories = Arrays.stream(NotificationCategory.values())
                .map(cat -> {
                    List<TenantSettingResponse> catSettings = grouped.getOrDefault(cat, List.of())
                            .stream()
                            .map(TenantSettingResponse::fromEntity)
                            .toList();
                    return new CategoryGroup(cat.getDisplayName(), cat.getIcon(), catSettings);
                })
                .filter(g -> !g.settings().isEmpty())
                .toList();

        return new GroupedSettingsResponse(categories);
    }

    private GroupedUserPreferencesResponse buildGroupedUserPreferencesResponse(
            List<TenantNotificationSetting> tenantSettings,
            Map<Notification.NotificationType, UserNotificationPreference> userPrefMap
    ) {
        Map<NotificationCategory, List<TenantNotificationSetting>> grouped = tenantSettings.stream()
                .collect(Collectors.groupingBy(
                        s -> NotificationCategory.forType(s.getNotificationType()),
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        List<UserCategoryGroup> categories = Arrays.stream(NotificationCategory.values())
                .map(cat -> {
                    List<UserPreferenceResponse> prefs = grouped.getOrDefault(cat, List.of())
                            .stream()
                            .map(ts -> UserPreferenceResponse.create(
                                    ts,
                                    userPrefMap.get(ts.getNotificationType())
                            ))
                            .toList();
                    return new UserCategoryGroup(cat.getDisplayName(), cat.getIcon(), prefs);
                })
                .filter(g -> !g.preferences().isEmpty())
                .toList();

        return new GroupedUserPreferencesResponse(categories);
    }
}
