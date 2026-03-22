package com.surework.notification.dto;

import com.surework.notification.domain.Notification;
import com.surework.notification.domain.NotificationCategory;
import com.surework.notification.domain.TenantNotificationSetting;
import com.surework.notification.domain.UserNotificationPreference;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

/**
 * DTOs for notification settings and preferences.
 */
public final class NotificationSettingsDto {

    private NotificationSettingsDto() {}

    /**
     * Response for a single tenant notification setting.
     */
    public record TenantSettingResponse(
            UUID id,
            Notification.NotificationType type,
            String displayName,
            String description,
            String category,
            String categoryIcon,
            boolean emailEnabled,
            boolean smsEnabled,
            boolean inAppEnabled,
            boolean mandatory
    ) {
        public static TenantSettingResponse fromEntity(TenantNotificationSetting entity) {
            NotificationCategory category = NotificationCategory.forType(entity.getNotificationType());
            return new TenantSettingResponse(
                    entity.getId(),
                    entity.getNotificationType(),
                    NotificationCategory.getDisplayName(entity.getNotificationType()),
                    NotificationCategory.getDescription(entity.getNotificationType()),
                    category.getDisplayName(),
                    category.getIcon(),
                    entity.isEmailEnabled(),
                    entity.isSmsEnabled(),
                    entity.isInAppEnabled(),
                    entity.isMandatory()
            );
        }
    }

    /**
     * Request to update a tenant notification setting.
     */
    public record UpdateTenantSettingRequest(
            @NotNull Boolean emailEnabled,
            @NotNull Boolean smsEnabled,
            @NotNull Boolean inAppEnabled
    ) {}

    /**
     * Request for bulk update of tenant settings.
     * Limited to 50 settings per request to prevent performance issues.
     */
    public record BulkUpdateRequest(
            @NotNull(message = "Settings list is required")
            @Size(min = 1, max = 50, message = "Must provide between 1 and 50 settings")
            List<@Valid TypeChannelUpdate> settings
    ) {}

    /**
     * Single type-channel update in bulk request.
     */
    public record TypeChannelUpdate(
            @NotNull Notification.NotificationType type,
            @NotNull Boolean emailEnabled,
            @NotNull Boolean smsEnabled,
            @NotNull Boolean inAppEnabled
    ) {}

    /**
     * Response grouping settings by category.
     */
    public record GroupedSettingsResponse(
            List<CategoryGroup> categories
    ) {}

    /**
     * A category with its settings.
     */
    public record CategoryGroup(
            String name,
            String icon,
            List<TenantSettingResponse> settings
    ) {}

    /**
     * User preference response showing effective state.
     */
    public record UserPreferenceResponse(
            Notification.NotificationType type,
            String displayName,
            String description,
            String category,
            String categoryIcon,
            boolean emailEnabled,
            boolean smsEnabled,
            boolean inAppEnabled,
            boolean emailDisabled,
            boolean smsDisabled,
            boolean inAppDisabled,
            boolean mandatory
    ) {
        /**
         * Create from tenant setting and optional user preference.
         */
        public static UserPreferenceResponse create(
                TenantNotificationSetting tenantSetting,
                UserNotificationPreference userPref
        ) {
            NotificationCategory category = NotificationCategory.forType(tenantSetting.getNotificationType());
            return new UserPreferenceResponse(
                    tenantSetting.getNotificationType(),
                    NotificationCategory.getDisplayName(tenantSetting.getNotificationType()),
                    NotificationCategory.getDescription(tenantSetting.getNotificationType()),
                    category.getDisplayName(),
                    category.getIcon(),
                    tenantSetting.isEmailEnabled(),
                    tenantSetting.isSmsEnabled(),
                    tenantSetting.isInAppEnabled(),
                    userPref != null && userPref.isEmailDisabled(),
                    userPref != null && userPref.isSmsDisabled(),
                    userPref != null && userPref.isInAppDisabled(),
                    tenantSetting.isMandatory()
            );
        }
    }

    /**
     * Request to update user preference.
     */
    public record UpdateUserPreferenceRequest(
            @NotNull Boolean emailDisabled,
            @NotNull Boolean smsDisabled,
            @NotNull Boolean inAppDisabled
    ) {}

    /**
     * Grouped user preferences response.
     */
    public record GroupedUserPreferencesResponse(
            List<UserCategoryGroup> categories
    ) {}

    /**
     * A category with user preferences.
     */
    public record UserCategoryGroup(
            String name,
            String icon,
            List<UserPreferenceResponse> preferences
    ) {}

    /**
     * Enabled channels record for channel resolution.
     */
    public record EnabledChannels(
            boolean email,
            boolean sms,
            boolean inApp
    ) {
        public static EnabledChannels none() {
            return new EnabledChannels(false, false, false);
        }

        public static EnabledChannels all() {
            return new EnabledChannels(true, true, true);
        }

        public boolean hasAnyEnabled() {
            return email || sms || inApp;
        }
    }
}
