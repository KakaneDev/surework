package com.surework.admin.dto;

import com.surework.admin.domain.*;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * DTOs for System Administration Service.
 */
public sealed interface AdminDto {

    // ==================== Tenant DTOs ====================

    record CreateTenantRequest(
            @NotBlank String code,
            @NotBlank String name,
            String tradingName,
            String registrationNumber,
            String taxNumber,
            String vatNumber,
            Tenant.CompanyType companyType,
            Tenant.IndustrySector industrySector,
            AddressDto physicalAddress,
            String phoneNumber,
            @Email String email,
            Tenant.SubscriptionTier subscriptionTier,
            Integer maxUsers,
            LocalDate subscriptionStart,
            LocalDate subscriptionEnd
    ) implements AdminDto {}

    record UpdateTenantRequest(
            String name,
            String tradingName,
            String registrationNumber,
            String taxNumber,
            String vatNumber,
            String uifReference,
            String sdlNumber,
            String payeReference,
            Tenant.CompanyType companyType,
            Tenant.IndustrySector industrySector,
            AddressDto physicalAddress,
            AddressDto postalAddress,
            String phoneNumber,
            @Email String email,
            String website,
            String logoUrl,
            String primaryColor,
            String secondaryColor,
            String timezone,
            String dateFormat
    ) implements AdminDto {}

    record TenantResponse(
            UUID id,
            String code,
            String name,
            String tradingName,
            String registrationNumber,
            String taxNumber,
            Tenant.CompanyType companyType,
            Tenant.IndustrySector industrySector,
            AddressDto physicalAddress,
            String phoneNumber,
            String email,
            String website,
            Tenant.SubscriptionTier subscriptionTier,
            Integer maxUsers,
            LocalDate subscriptionStart,
            LocalDate subscriptionEnd,
            Tenant.TenantStatus status,
            String timezone,
            String currencyCode,
            LocalDateTime createdAt,
            LocalDateTime activatedAt
    ) implements AdminDto {}

    record TenantListItem(
            UUID id,
            String code,
            String name,
            Tenant.TenantStatus status,
            Tenant.SubscriptionTier subscriptionTier,
            int userCount,
            LocalDateTime createdAt
    ) implements AdminDto {}

    record AddressDto(
            String line1,
            String line2,
            String city,
            String province,
            String postalCode,
            String country
    ) implements AdminDto {}

    // ==================== User DTOs ====================

    record CreateUserRequest(
            @NotBlank String username,
            @NotBlank @Email String email,
            @NotBlank String password,
            @NotBlank String firstName,
            @NotBlank String lastName,
            String displayName,
            String phoneNumber,
            String mobileNumber,
            UUID employeeId,
            List<UUID> roleIds,
            boolean sendWelcomeEmail
    ) implements AdminDto {}

    record UpdateUserRequest(
            String firstName,
            String lastName,
            String displayName,
            String phoneNumber,
            String mobileNumber,
            String avatarUrl,
            String timezone,
            String language,
            String dateFormat,
            Boolean notifyEmail,
            Boolean notifySms,
            Boolean notifyPush
    ) implements AdminDto {}

    record UserResponse(
            UUID id,
            UUID tenantId,
            String username,
            String email,
            String firstName,
            String lastName,
            String displayName,
            String phoneNumber,
            String mobileNumber,
            String avatarUrl,
            UUID employeeId,
            List<RoleResponse> roles,
            User.UserStatus status,
            boolean emailVerified,
            boolean mfaEnabled,
            LocalDateTime lastLoginAt,
            String timezone,
            String language,
            LocalDateTime createdAt
    ) implements AdminDto {}

    record UserListItem(
            UUID id,
            String username,
            String email,
            String fullName,
            User.UserStatus status,
            List<String> roleNames,
            LocalDateTime lastLoginAt
    ) implements AdminDto {}

    record ChangePasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank String newPassword,
            @NotBlank String confirmPassword
    ) implements AdminDto {}

    record ResetPasswordRequest(
            @NotBlank String newPassword,
            boolean sendNotification
    ) implements AdminDto {}

    record AssignRolesRequest(
            @NotEmpty List<UUID> roleIds
    ) implements AdminDto {}

    // ==================== Avatar DTOs ====================

    record AvatarResponse(
            String avatarUrl
    ) implements AdminDto {}

    // ==================== Role DTOs ====================

    record CreateRoleRequest(
            @NotBlank String code,
            @NotBlank String name,
            String description,
            UUID parentRoleId,
            List<UUID> permissionIds,
            boolean isDefault
    ) implements AdminDto {}

    record UpdateRoleRequest(
            String name,
            String description,
            UUID parentRoleId,
            List<UUID> permissionIds,
            Boolean active,
            Boolean isDefault
    ) implements AdminDto {}

    record RoleResponse(
            UUID id,
            String code,
            String name,
            String description,
            UUID parentRoleId,
            String parentRoleName,
            List<PermissionResponse> permissions,
            boolean active,
            boolean systemRole,
            boolean defaultRole,
            LocalDateTime createdAt
    ) implements AdminDto {}

    record RoleListItem(
            UUID id,
            String code,
            String name,
            int permissionCount,
            int userCount,
            boolean systemRole,
            boolean active
    ) implements AdminDto {}

    // ==================== Permission DTOs ====================

    record PermissionResponse(
            UUID id,
            String code,
            String name,
            String description,
            Permission.PermissionCategory category,
            String resource,
            Permission.ActionType action
    ) implements AdminDto {}

    record PermissionGroup(
            Permission.PermissionCategory category,
            List<PermissionResponse> permissions
    ) implements AdminDto {}

    // ==================== Authentication DTOs ====================

    record LoginRequest(
            @NotBlank String username,
            @NotBlank String password,
            String mfaCode
    ) implements AdminDto {}

    record LoginResponse(
            String accessToken,
            String refreshToken,
            String tokenType,
            int expiresIn,
            UserResponse user,
            boolean mfaRequired,
            String mfaChallengeToken,
            Integer remainingAttempts
    ) implements AdminDto {}

    record RefreshTokenRequest(
            @NotBlank String refreshToken
    ) implements AdminDto {}

    record MfaSetupResponse(
            String secret,
            String qrCodeUrl,
            List<String> backupCodes
    ) implements AdminDto {}

    record MfaVerifyRequest(
            @NotBlank String code
    ) implements AdminDto {}

    // ==================== Password Reset DTOs ====================

    record ForgotPasswordRequest(
            @NotBlank @Email String email
    ) implements AdminDto {}

    record PasswordResetRequest(
            @NotBlank String token,
            @NotBlank @Size(min = 12, message = "Password must be at least 12 characters")
            String newPassword,
            @NotBlank String confirmPassword
    ) implements AdminDto {}

    record ValidateTokenResponse(
            boolean valid,
            String email
    ) implements AdminDto {}

    record PasswordResetResponse(
            String message
    ) implements AdminDto {}

    // ==================== Session Management DTOs ====================

    record ActiveSessionResponse(
            UUID id,
            String deviceName,
            String deviceType,
            String browser,
            String ipAddress,
            String location,
            LocalDateTime lastActiveAt,
            LocalDateTime createdAt,
            boolean isCurrent
    ) implements AdminDto {}

    // ==================== API Key DTOs ====================

    record CreateApiKeyRequest(
            @NotBlank String name,
            String description,
            List<String> scopes,
            Integer rateLimit,
            LocalDateTime expiresAt
    ) implements AdminDto {}

    record ApiKeyResponse(
            UUID id,
            String name,
            String description,
            String keyPrefix,
            List<String> scopes,
            Integer rateLimit,
            boolean active,
            LocalDateTime expiresAt,
            LocalDateTime lastUsedAt,
            LocalDateTime createdAt
    ) implements AdminDto {}

    record ApiKeyCreatedResponse(
            UUID id,
            String apiKey,  // Only shown once at creation
            String name,
            LocalDateTime expiresAt
    ) implements AdminDto {}

    // ==================== Audit Log DTOs ====================

    record AuditLogResponse(
            UUID id,
            AuditLog.EventType eventType,
            AuditLog.EventCategory eventCategory,
            String eventAction,
            String resourceType,
            String resourceId,
            String resourceName,
            UUID userId,
            String username,
            AuditLog.ActorType actorType,
            String ipAddress,
            String requestMethod,
            String requestPath,
            boolean success,
            String errorMessage,
            LocalDateTime timestamp,
            Long durationMs
    ) implements AdminDto {}

    record AuditLogSearchRequest(
            AuditLog.EventType eventType,
            AuditLog.EventCategory eventCategory,
            UUID userId,
            String resourceType,
            LocalDateTime from,
            LocalDateTime to
    ) implements AdminDto {}

    record AuditStats(
            long totalEvents,
            long successfulEvents,
            long failedEvents,
            Map<String, Long> eventsByType,
            Map<String, Long> eventsByCategory,
            LocalDateTime periodStart,
            LocalDateTime periodEnd
    ) implements AdminDto {}

    // ==================== System Config DTOs ====================

    record SystemConfigResponse(
            String key,
            String value,
            String valueType,
            String description,
            boolean encrypted
    ) implements AdminDto {}

    record UpdateConfigRequest(
            @NotBlank String value
    ) implements AdminDto {}

    // ==================== Dashboard DTOs ====================

    record AdminDashboard(
            TenantStats tenantStats,
            UserStats userStats,
            AuditStats auditStats,
            SystemHealth systemHealth,
            List<RecentActivity> recentActivities
    ) implements AdminDto {}

    record TenantStats(
            int totalTenants,
            int activeTenants,
            int pendingTenants,
            int suspendedTenants,
            Map<String, Integer> bySubscriptionTier
    ) implements AdminDto {}

    record UserStats(
            int totalUsers,
            int activeUsers,
            int lockedUsers,
            int pendingUsers,
            int loginsToday,
            int failedLoginsToday
    ) implements AdminDto {}

    record SystemHealth(
            String status,
            double cpuUsage,
            double memoryUsage,
            double diskUsage,
            Map<String, String> serviceStatus
    ) implements AdminDto {}

    record RecentActivity(
            AuditLog.EventType eventType,
            String description,
            String username,
            LocalDateTime timestamp
    ) implements AdminDto {}
}
