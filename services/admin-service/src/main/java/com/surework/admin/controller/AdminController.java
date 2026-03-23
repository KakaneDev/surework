package com.surework.admin.controller;

import com.surework.admin.config.JwtHeaderAuthenticationFilter.UserPrincipal;
import com.surework.admin.config.RateLimitConfig;
import com.surework.admin.domain.AuditLog;
import com.surework.admin.domain.Tenant;
import com.surework.admin.domain.User;
import com.surework.admin.dto.AdminDto.*;
import com.surework.admin.service.AdminService;
import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * REST controller for System Administration.
 * Provides endpoints for tenant, user, role, and audit management.
 *
 * <p><strong>Security:</strong> All endpoints except public auth endpoints
 * require authentication and appropriate role-based authorization via
 * {@code @PreAuthorize} annotations.
 */
@RestController
@RequestMapping("/api/admin")
@Validated
public class AdminController {

    private static final Logger log = LoggerFactory.getLogger(AdminController.class);

    private final AdminService adminService;
    private final RateLimitConfig rateLimitConfig;

    /**
     * Trusted proxy IP addresses that are allowed to set X-Forwarded-For header.
     * Only trust X-Forwarded-For when request comes from these IPs.
     */
    @Value("${surework.admin.trusted-proxies:127.0.0.1,::1}")
    private Set<String> trustedProxies;

    public AdminController(AdminService adminService, RateLimitConfig rateLimitConfig) {
        this.adminService = adminService;
        this.rateLimitConfig = rateLimitConfig;
    }

    /**
     * Extract client IP address from request, considering proxy headers.
     * Only trusts X-Forwarded-For when request comes from a known proxy.
     * This prevents IP spoofing to bypass rate limiting.
     */
    private String getClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();

        // Only trust X-Forwarded-For if request came from a trusted proxy
        if (trustedProxies.contains(remoteAddr)) {
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isBlank()) {
                // Take the first IP (original client) from the chain
                return xForwardedFor.split(",")[0].trim();
            }
        }

        return remoteAddr;
    }

    // ==================== Tenant Management ====================

    @PostMapping("/tenants")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<TenantResponse> createTenant(
            @Valid @RequestBody CreateTenantRequest request,
            @RequestParam UUID createdBy) {
        TenantResponse response = adminService.createTenant(request, createdBy);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/tenants/{tenantId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<TenantResponse> updateTenant(
            @PathVariable @NotNull UUID tenantId,
            @Valid @RequestBody UpdateTenantRequest request,
            @RequestParam UUID updatedBy) {
        TenantResponse response = adminService.updateTenant(tenantId, request, updatedBy);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/tenants/{tenantId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<TenantResponse> getTenant(@PathVariable @NotNull UUID tenantId) {
        return adminService.getTenant(tenantId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/tenants/code/{code}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<TenantResponse> getTenantByCode(@PathVariable @NotNull String code) {
        return adminService.getTenantByCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/tenants")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Page<TenantListItem>> listTenants(
            @RequestParam(required = false) Tenant.TenantStatus status,
            @RequestParam(required = false) String searchTerm,
            Pageable pageable) {
        Page<TenantListItem> tenants = adminService.listTenants(status, searchTerm, pageable);
        return ResponseEntity.ok(tenants);
    }

    @PostMapping("/tenants/{tenantId}/activate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<TenantResponse> activateTenant(
            @PathVariable @NotNull UUID tenantId,
            @RequestParam UUID activatedBy) {
        TenantResponse response = adminService.activateTenant(tenantId, activatedBy);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/tenants/{tenantId}/suspend")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<TenantResponse> suspendTenant(
            @PathVariable @NotNull UUID tenantId,
            @RequestParam String reason,
            @RequestParam UUID suspendedBy) {
        TenantResponse response = adminService.suspendTenant(tenantId, reason, suspendedBy);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/tenants/{tenantId}/reactivate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<TenantResponse> reactivateTenant(
            @PathVariable @NotNull UUID tenantId,
            @RequestParam UUID reactivatedBy) {
        TenantResponse response = adminService.reactivateTenant(tenantId, reactivatedBy);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/tenants/{tenantId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> terminateTenant(
            @PathVariable @NotNull UUID tenantId,
            @RequestParam UUID terminatedBy) {
        adminService.terminateTenant(tenantId, terminatedBy);
        return ResponseEntity.noContent().build();
    }

    // ==================== User Management ====================

    @PostMapping("/tenants/{tenantId}/users")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<UserResponse> createUser(
            @PathVariable @NotNull UUID tenantId,
            @Valid @RequestBody CreateUserRequest request,
            @RequestParam(required = false) UUID createdBy,
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID creator = createdBy != null ? createdBy : (principal != null ? principal.userId() : null);
        UserResponse response = adminService.createUser(tenantId, request, creator);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/users/{userId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable @NotNull UUID userId,
            @Valid @RequestBody UpdateUserRequest request,
            @RequestParam UUID updatedBy) {
        UserResponse response = adminService.updateUser(userId, request, updatedBy);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/users/{userId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN', 'MANAGER')")
    public ResponseEntity<UserResponse> getUser(@PathVariable @NotNull UUID userId) {
        return adminService.getUser(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/users/username/{username}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<UserResponse> getUserByUsername(@PathVariable @NotNull String username) {
        return adminService.getUserByUsername(username)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/tenants/{tenantId}/users")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN', 'MANAGER')")
    public ResponseEntity<Page<UserListItem>> listUsers(
            @PathVariable @NotNull UUID tenantId,
            @RequestParam(required = false) User.UserStatus status,
            @RequestParam(required = false) String searchTerm,
            Pageable pageable) {
        Page<UserListItem> users = adminService.listUsers(tenantId, status, searchTerm, pageable);
        return ResponseEntity.ok(users);
    }

    @PostMapping("/users/{userId}/activate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<UserResponse> activateUser(
            @PathVariable @NotNull UUID userId,
            @RequestParam UUID activatedBy) {
        UserResponse response = adminService.activateUser(userId, activatedBy);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/users/{userId}/deactivate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<UserResponse> deactivateUser(
            @PathVariable @NotNull UUID userId,
            @RequestParam UUID deactivatedBy) {
        UserResponse response = adminService.deactivateUser(userId, deactivatedBy);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/users/{userId}/lock")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<UserResponse> lockUser(
            @PathVariable @NotNull UUID userId,
            @RequestParam(defaultValue = "30") int lockoutMinutes,
            @RequestParam UUID lockedBy) {
        UserResponse response = adminService.lockUser(userId, lockoutMinutes, lockedBy);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/users/{userId}/unlock")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<UserResponse> unlockUser(
            @PathVariable @NotNull UUID userId,
            @RequestParam UUID unlockedBy) {
        UserResponse response = adminService.unlockUser(userId, unlockedBy);
        return ResponseEntity.ok(response);
    }

    /**
     * Change user password. Users can change their own password.
     * Admins can change passwords for users in their scope.
     */
    @PostMapping("/users/{userId}/change-password")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN') or @securityService.isCurrentUser(#userId, authentication)")
    public ResponseEntity<Void> changePassword(
            @PathVariable @NotNull UUID userId,
            @Valid @RequestBody ChangePasswordRequest request) {
        adminService.changePassword(userId, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/users/{userId}/reset-password")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<Void> resetPassword(
            @PathVariable @NotNull UUID userId,
            @Valid @RequestBody ResetPasswordRequest request,
            @RequestParam UUID resetBy) {
        adminService.resetPassword(userId, request, resetBy);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/tenants/{tenantId}/users/{userId}/resend-invitation")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<Void> resendInvitation(
            @PathVariable @NotNull UUID tenantId,
            @PathVariable @NotNull UUID userId) {
        adminService.resendInvitation(tenantId, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/users/{userId}/roles")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<UserResponse> assignRoles(
            @PathVariable @NotNull UUID userId,
            @Valid @RequestBody AssignRolesRequest request,
            @RequestParam UUID assignedBy) {
        UserResponse response = adminService.assignRoles(userId, request, assignedBy);
        return ResponseEntity.ok(response);
    }

    /**
     * Update user roles (tenant-scoped endpoint for frontend).
     * Validates user belongs to tenant before updating roles.
     *
     * <p><strong>Security:</strong> Requires SUPER_ADMIN or TENANT_ADMIN role.
     * TENANT_ADMIN can only modify users within their own tenant.
     * Only SUPER_ADMIN can assign SUPER_ADMIN role to others.
     */
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    @PutMapping("/tenants/{tenantId}/users/{userId}/roles")
    public ResponseEntity<UserResponse> updateUserRoles(
            @PathVariable @NotNull UUID tenantId,
            @PathVariable @NotNull UUID userId,
            @Valid @RequestBody AssignRolesRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String assignedByHeader,
            @RequestHeader(value = "X-User-Roles", required = false) String currentUserRoles) {
        // Safely parse the assigning user's ID from header
        UUID assignedBy = parseUuidSafely(assignedByHeader, userId);

        // Check if current user has SUPER_ADMIN role (needed for privilege escalation check)
        boolean isSuperAdmin = currentUserRoles != null && currentUserRoles.contains("SUPER_ADMIN");

        UserResponse response = adminService.updateUserRoles(tenantId, userId, request, assignedBy, isSuperAdmin);
        return ResponseEntity.ok(response);
    }

    /**
     * Safely parses UUID from string, returning default value on failure.
     * Prevents IllegalArgumentException from propagating on malformed headers.
     */
    private UUID parseUuidSafely(String uuidString, UUID defaultValue) {
        if (uuidString == null || uuidString.isBlank()) {
            return defaultValue;
        }
        try {
            return UUID.fromString(uuidString);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid UUID format in header: {}", uuidString);
            return defaultValue;
        }
    }

    // ==================== Avatar Management ====================

    /**
     * Upload user avatar. Users can upload their own avatar.
     * Admins can upload avatars for users in their scope.
     */
    @PostMapping("/users/{userId}/avatar")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN') or @securityService.isCurrentUser(#userId, authentication)")
    public ResponseEntity<AvatarResponse> uploadAvatar(
            @PathVariable @NotNull UUID userId,
            @RequestPart("file") MultipartFile file) {
        try {
            AvatarResponse response = adminService.uploadAvatar(
                    userId,
                    file.getBytes(),
                    file.getOriginalFilename(),
                    file.getContentType()
            );
            return ResponseEntity.ok(response);
        } catch (java.io.IOException e) {
            log.error("Failed to read avatar file for user {}: {}", userId, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Delete user avatar. Users can delete their own avatar.
     * Admins can delete avatars for users in their scope.
     */
    @DeleteMapping("/users/{userId}/avatar")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN') or @securityService.isCurrentUser(#userId, authentication)")
    public ResponseEntity<Void> deleteAvatar(@PathVariable @NotNull UUID userId) {
        adminService.deleteAvatar(userId);
        return ResponseEntity.noContent().build();
    }

    // ==================== Role Management ====================

    @PostMapping("/tenants/{tenantId}/roles")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<RoleResponse> createRole(
            @PathVariable @NotNull UUID tenantId,
            @Valid @RequestBody CreateRoleRequest request,
            @RequestParam UUID createdBy) {
        RoleResponse response = adminService.createRole(tenantId, request, createdBy);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/roles/{roleId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<RoleResponse> updateRole(
            @PathVariable @NotNull UUID roleId,
            @Valid @RequestBody UpdateRoleRequest request,
            @RequestParam UUID updatedBy) {
        RoleResponse response = adminService.updateRole(roleId, request, updatedBy);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/roles/{roleId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN', 'MANAGER')")
    public ResponseEntity<RoleResponse> getRole(@PathVariable @NotNull UUID roleId) {
        return adminService.getRole(roleId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/tenants/{tenantId}/roles")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN', 'MANAGER')")
    public ResponseEntity<List<RoleResponse>> listRoles(@PathVariable @NotNull UUID tenantId) {
        List<RoleResponse> roles = adminService.listRoles(tenantId);
        return ResponseEntity.ok(roles);
    }

    @GetMapping("/tenants/{tenantId}/roles/stats")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<List<RoleListItem>> listRolesWithStats(@PathVariable @NotNull UUID tenantId) {
        List<RoleListItem> roles = adminService.listRolesWithStats(tenantId);
        return ResponseEntity.ok(roles);
    }

    @DeleteMapping("/roles/{roleId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<Void> deleteRole(
            @PathVariable @NotNull UUID roleId,
            @RequestParam UUID deletedBy) {
        adminService.deleteRole(roleId, deletedBy);
        return ResponseEntity.noContent().build();
    }

    // ==================== Permission Management ====================

    @GetMapping("/permissions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<List<PermissionResponse>> listPermissions() {
        List<PermissionResponse> permissions = adminService.listPermissions();
        return ResponseEntity.ok(permissions);
    }

    @GetMapping("/permissions/grouped")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<List<PermissionGroup>> listPermissionsByCategory() {
        List<PermissionGroup> groups = adminService.listPermissionsByCategory();
        return ResponseEntity.ok(groups);
    }

    // ==================== Authentication ====================

    @PostMapping("/auth/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            @RequestHeader(value = "X-Forwarded-For", required = false) String ipAddress,
            @RequestHeader(value = "User-Agent", required = false) String userAgent) {
        LoginResponse response = adminService.login(request, ipAddress, userAgent);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/auth/refresh")
    public ResponseEntity<LoginResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        LoginResponse response = adminService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Get the currently authenticated user's profile.
     * Requires valid authentication.
     */
    @GetMapping("/auth/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponse> getCurrentUser(
            @RequestHeader("Authorization") String authHeader) {
        return adminService.getCurrentUserFromToken(authHeader)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    /**
     * Logout current session. Users can only logout themselves.
     */
    @PostMapping("/auth/logout")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> logout(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader("Authorization") String token) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        adminService.logout(principal.userId(), token);
        return ResponseEntity.ok().build();
    }

    /**
     * Logout all sessions for the authenticated user.
     */
    @PostMapping("/auth/logout-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> logoutAllSessions(
            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        adminService.logoutAllSessions(principal.userId());
        return ResponseEntity.ok().build();
    }

    // ==================== Password Reset ====================

    /**
     * Request a password reset email.
     * Rate limited to 3 requests per hour per IP to prevent email bombing.
     */
    @PostMapping("/auth/password/forgot")
    public ResponseEntity<PasswordResetResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest httpRequest) {

        // Apply rate limiting based on client IP
        String clientIp = getClientIp(httpRequest);
        Bucket bucket = rateLimitConfig.getPasswordResetBucket(clientIp);

        if (!bucket.tryConsume(1)) {
            log.warn("Rate limit exceeded for password reset from IP: {}", clientIp);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header("Retry-After", "3600")
                    .body(new PasswordResetResponse("Too many requests. Please try again later."));
        }

        PasswordResetResponse response = adminService.forgotPassword(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/auth/password/validate-token")
    public ResponseEntity<ValidateTokenResponse> validateResetToken(
            @RequestParam String token) {
        ValidateTokenResponse response = adminService.validateResetToken(token);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/auth/password/reset")
    public ResponseEntity<PasswordResetResponse> resetPassword(
            @Valid @RequestBody PasswordResetRequest request) {
        PasswordResetResponse response = adminService.resetPasswordWithToken(request);
        return ResponseEntity.ok(response);
    }

    // ==================== Session Management ====================

    /**
     * Get all active sessions for the authenticated user.
     * Uses authenticated principal instead of headers to prevent spoofing.
     */
    @GetMapping("/auth/sessions")
    public ResponseEntity<List<ActiveSessionResponse>> getActiveSessions(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // Extract token for current session identification
        String token = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }

        List<ActiveSessionResponse> sessions = adminService.getActiveSessions(principal.userId(), token);
        return ResponseEntity.ok(sessions);
    }

    /**
     * Revoke a specific session for the authenticated user.
     * Users can only revoke their own sessions.
     */
    @DeleteMapping("/auth/sessions/{sessionId}")
    public ResponseEntity<Void> revokeSession(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        adminService.revokeSession(principal.userId(), sessionId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Revoke all sessions except the current one for the authenticated user.
     */
    @DeleteMapping("/auth/sessions/others")
    public ResponseEntity<Void> revokeAllOtherSessions(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // Extract token for current session identification
        String token = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }

        adminService.revokeAllOtherSessions(principal.userId(), token);
        return ResponseEntity.noContent().build();
    }

    // ==================== MFA ====================

    /**
     * Setup MFA for a user. Users can setup their own MFA.
     * Admins can setup MFA for users in their scope.
     */
    @PostMapping("/users/{userId}/mfa/setup")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @securityService.isCurrentUser(#userId, authentication)")
    public ResponseEntity<MfaSetupResponse> setupMfa(@PathVariable @NotNull UUID userId) {
        MfaSetupResponse response = adminService.setupMfa(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Verify and enable MFA for a user. Users can verify their own MFA.
     */
    @PostMapping("/users/{userId}/mfa/verify")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @securityService.isCurrentUser(#userId, authentication)")
    public ResponseEntity<Void> verifyAndEnableMfa(
            @PathVariable @NotNull UUID userId,
            @Valid @RequestBody MfaVerifyRequest request) {
        adminService.verifyAndEnableMfa(userId, request);
        return ResponseEntity.ok().build();
    }

    /**
     * Disable MFA for a user. Only SUPER_ADMIN or the user themselves can disable MFA.
     * TENANT_ADMIN cannot disable other users' MFA for security reasons.
     */
    @PostMapping("/users/{userId}/mfa/disable")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @securityService.isCurrentUser(#userId, authentication)")
    public ResponseEntity<Void> disableMfa(@PathVariable @NotNull UUID userId) {
        adminService.disableMfa(userId);
        return ResponseEntity.ok().build();
    }

    // ==================== API Keys ====================

    @PostMapping("/tenants/{tenantId}/api-keys")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<ApiKeyCreatedResponse> createApiKey(
            @PathVariable @NotNull UUID tenantId,
            @Valid @RequestBody CreateApiKeyRequest request,
            @RequestParam UUID createdBy) {
        ApiKeyCreatedResponse response = adminService.createApiKey(tenantId, request, createdBy);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/tenants/{tenantId}/api-keys")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<List<ApiKeyResponse>> listApiKeys(@PathVariable @NotNull UUID tenantId) {
        List<ApiKeyResponse> keys = adminService.listApiKeys(tenantId);
        return ResponseEntity.ok(keys);
    }

    @DeleteMapping("/api-keys/{apiKeyId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<Void> revokeApiKey(
            @PathVariable @NotNull UUID apiKeyId,
            @RequestParam UUID revokedBy) {
        adminService.revokeApiKey(apiKeyId, revokedBy);
        return ResponseEntity.noContent().build();
    }

    // ==================== Audit Logs ====================

    @GetMapping("/tenants/{tenantId}/audit-logs")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<Page<AuditLogResponse>> searchAuditLogs(
            @PathVariable @NotNull UUID tenantId,
            @RequestParam(required = false) AuditLog.EventType eventType,
            @RequestParam(required = false) AuditLog.EventCategory eventCategory,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) LocalDateTime from,
            @RequestParam(required = false) LocalDateTime to,
            Pageable pageable) {

        AuditLogSearchRequest searchRequest = new AuditLogSearchRequest(
                eventType, eventCategory, userId, resourceType, from, to);
        Page<AuditLogResponse> logs = adminService.searchAuditLogs(tenantId, searchRequest, pageable);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/users/{userId}/audit-logs")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<Page<AuditLogResponse>> getUserAuditLogs(
            @PathVariable @NotNull UUID userId,
            Pageable pageable) {
        Page<AuditLogResponse> logs = adminService.getUserAuditLogs(userId, pageable);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/audit-logs/resource/{resourceType}/{resourceId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<Page<AuditLogResponse>> getResourceAuditLogs(
            @PathVariable @NotNull String resourceType,
            @PathVariable @NotNull String resourceId,
            Pageable pageable) {
        Page<AuditLogResponse> logs = adminService.getResourceAuditLogs(resourceType, resourceId, pageable);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/tenants/{tenantId}/audit-logs/stats")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<AuditStats> getAuditStats(
            @PathVariable @NotNull UUID tenantId,
            @RequestParam(required = false) LocalDateTime from,
            @RequestParam(required = false) LocalDateTime to) {
        LocalDateTime dateFrom = from != null ? from : LocalDateTime.now().minusDays(30);
        LocalDateTime dateTo = to != null ? to : LocalDateTime.now();
        AuditStats stats = adminService.getAuditStats(tenantId, dateFrom, dateTo);
        return ResponseEntity.ok(stats);
    }

    // ==================== System Configuration ====================

    @GetMapping("/config")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<List<SystemConfigResponse>> getSystemConfig(
            @RequestParam(required = false) UUID tenantId) {
        List<SystemConfigResponse> config = adminService.getSystemConfig(tenantId);
        return ResponseEntity.ok(config);
    }

    @PutMapping("/config/{key}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<SystemConfigResponse> updateConfig(
            @PathVariable @NotNull String key,
            @RequestParam(required = false) UUID tenantId,
            @Valid @RequestBody UpdateConfigRequest request,
            @RequestParam UUID updatedBy) {
        SystemConfigResponse response = adminService.updateConfig(tenantId, key, request, updatedBy);
        return ResponseEntity.ok(response);
    }

    // ==================== Dashboard ====================

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<AdminDashboard> getAdminDashboard() {
        AdminDashboard dashboard = adminService.getAdminDashboard();
        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/dashboard/tenant-stats")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<TenantStats> getTenantStats() {
        TenantStats stats = adminService.getTenantStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/dashboard/user-stats/{tenantId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<UserStats> getUserStats(@PathVariable @NotNull UUID tenantId) {
        UserStats stats = adminService.getUserStats(tenantId);
        return ResponseEntity.ok(stats);
    }
}
