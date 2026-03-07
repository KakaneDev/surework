package com.surework.notification.controller;

import com.surework.notification.config.JwtHeaderAuthenticationFilter.UserPrincipal;
import com.surework.notification.domain.Notification;
import com.surework.notification.dto.NotificationSettingsDto.*;
import com.surework.notification.service.TenantNotificationSettingsService;
import com.surework.notification.service.TenantNotificationSettingsServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST API controller for tenant notification settings (admin) and user preferences.
 */
@RestController
@RequestMapping("/api/notifications/settings")
@RequiredArgsConstructor
@Validated
@Slf4j
public class TenantNotificationSettingsController {

    private final TenantNotificationSettingsService settingsService;
    private final TenantNotificationSettingsServiceImpl settingsServiceImpl;

    // ===== Tenant Settings Initialization =====

    /**
     * Initialize notification settings for the tenant.
     * Should be called once during tenant onboarding.
     * Idempotent - safe to call multiple times.
     */
    @PostMapping("/tenant/initialize")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SYSTEM_ADMIN', 'TENANT_ADMIN') or hasAuthority('TENANT_MANAGE')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void initializeTenantSettings(
            @AuthenticationPrincipal UserPrincipal user
    ) {
        UUID tenantId = getTenantId(user);
        log.info("Initializing notification settings for tenant {}", tenantId);
        settingsServiceImpl.ensureSettingsInitialized(tenantId);
    }

    // ===== Tenant Settings (Admin only) =====

    /**
     * Get all tenant notification settings grouped by category.
     */
    @GetMapping("/tenant")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SYSTEM_ADMIN', 'TENANT_ADMIN') or hasAuthority('TENANT_MANAGE')")
    public ResponseEntity<GroupedSettingsResponse> getTenantSettings(
            @AuthenticationPrincipal UserPrincipal user
    ) {
        UUID tenantId = getTenantId(user);
        log.debug("Getting tenant settings for tenant {}", tenantId);
        return ResponseEntity.ok(settingsService.getTenantSettings(tenantId));
    }

    /**
     * Update a single tenant notification setting.
     */
    @PutMapping("/tenant/{type}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SYSTEM_ADMIN', 'TENANT_ADMIN') or hasAuthority('TENANT_MANAGE')")
    public ResponseEntity<TenantSettingResponse> updateTenantSetting(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Notification.NotificationType type,
            @Valid @RequestBody UpdateTenantSettingRequest request
    ) {
        UUID tenantId = getTenantId(user);
        log.info("Updating tenant {} setting for type {}", tenantId, type);
        return ResponseEntity.ok(settingsService.updateTenantSetting(tenantId, type, request));
    }

    /**
     * Bulk update tenant settings.
     * Limited to 50 settings per request.
     */
    @PutMapping("/tenant")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SYSTEM_ADMIN', 'TENANT_ADMIN') or hasAuthority('TENANT_MANAGE')")
    public ResponseEntity<GroupedSettingsResponse> bulkUpdateTenantSettings(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody BulkUpdateRequest request
    ) {
        UUID tenantId = getTenantId(user);
        log.info("Bulk updating {} tenant settings for tenant {}", request.settings().size(), tenantId);
        return ResponseEntity.ok(settingsService.bulkUpdateTenantSettings(tenantId, request));
    }

    // ===== User Preferences (All authenticated users) =====

    /**
     * Get user's effective notification preferences.
     * Shows tenant settings combined with user opt-out choices.
     */
    @GetMapping("/preferences")
    public ResponseEntity<GroupedUserPreferencesResponse> getUserPreferences(
            @AuthenticationPrincipal UserPrincipal user
    ) {
        UUID tenantId = getTenantId(user);
        UUID userId = getUserId(user);
        log.debug("Getting user preferences for user {} in tenant {}", userId, tenantId);
        return ResponseEntity.ok(settingsService.getUserPreferences(tenantId, userId));
    }

    /**
     * Update user preference for a notification type.
     * Users can only disable channels that tenant has enabled.
     * Cannot modify preferences for mandatory notification types.
     */
    @PutMapping("/preferences/{type}")
    public ResponseEntity<UserPreferenceResponse> updateUserPreference(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Notification.NotificationType type,
            @Valid @RequestBody UpdateUserPreferenceRequest request
    ) {
        UUID tenantId = getTenantId(user);
        UUID userId = getUserId(user);
        log.info("Updating user {} preference for type {}", userId, type);
        return ResponseEntity.ok(settingsService.updateUserPreference(tenantId, userId, type, request));
    }

    private UUID getTenantId(UserPrincipal user) {
        if (user == null || user.tenantId() == null) {
            throw new AccessDeniedException("Tenant context required");
        }
        return user.tenantId();
    }

    private UUID getUserId(UserPrincipal user) {
        if (user == null || user.userId() == null) {
            throw new AccessDeniedException("User authentication required");
        }
        return user.userId();
    }
}
