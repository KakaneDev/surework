package com.surework.admin.controller;

import com.surework.admin.domain.AuditLog;
import com.surework.admin.domain.Tenant;
import com.surework.admin.domain.User;
import com.surework.admin.dto.AdminDto.*;
import com.surework.admin.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for System Administration.
 * Provides endpoints for tenant, user, role, and audit management.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    // ==================== Tenant Management ====================

    @PostMapping("/tenants")
    public ResponseEntity<TenantResponse> createTenant(
            @Valid @RequestBody CreateTenantRequest request,
            @RequestParam UUID createdBy) {
        TenantResponse response = adminService.createTenant(request, createdBy);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/tenants/{tenantId}")
    public ResponseEntity<TenantResponse> updateTenant(
            @PathVariable UUID tenantId,
            @Valid @RequestBody UpdateTenantRequest request,
            @RequestParam UUID updatedBy) {
        TenantResponse response = adminService.updateTenant(tenantId, request, updatedBy);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/tenants/{tenantId}")
    public ResponseEntity<TenantResponse> getTenant(@PathVariable UUID tenantId) {
        return adminService.getTenant(tenantId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/tenants/code/{code}")
    public ResponseEntity<TenantResponse> getTenantByCode(@PathVariable String code) {
        return adminService.getTenantByCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/tenants")
    public ResponseEntity<Page<TenantListItem>> listTenants(
            @RequestParam(required = false) Tenant.TenantStatus status,
            @RequestParam(required = false) String searchTerm,
            Pageable pageable) {
        Page<TenantListItem> tenants = adminService.listTenants(status, searchTerm, pageable);
        return ResponseEntity.ok(tenants);
    }

    @PostMapping("/tenants/{tenantId}/activate")
    public ResponseEntity<TenantResponse> activateTenant(
            @PathVariable UUID tenantId,
            @RequestParam UUID activatedBy) {
        TenantResponse response = adminService.activateTenant(tenantId, activatedBy);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/tenants/{tenantId}/suspend")
    public ResponseEntity<TenantResponse> suspendTenant(
            @PathVariable UUID tenantId,
            @RequestParam String reason,
            @RequestParam UUID suspendedBy) {
        TenantResponse response = adminService.suspendTenant(tenantId, reason, suspendedBy);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/tenants/{tenantId}/reactivate")
    public ResponseEntity<TenantResponse> reactivateTenant(
            @PathVariable UUID tenantId,
            @RequestParam UUID reactivatedBy) {
        TenantResponse response = adminService.reactivateTenant(tenantId, reactivatedBy);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/tenants/{tenantId}")
    public ResponseEntity<Void> terminateTenant(
            @PathVariable UUID tenantId,
            @RequestParam UUID terminatedBy) {
        adminService.terminateTenant(tenantId, terminatedBy);
        return ResponseEntity.noContent().build();
    }

    // ==================== User Management ====================

    @PostMapping("/tenants/{tenantId}/users")
    public ResponseEntity<UserResponse> createUser(
            @PathVariable UUID tenantId,
            @Valid @RequestBody CreateUserRequest request,
            @RequestParam UUID createdBy) {
        UserResponse response = adminService.createUser(tenantId, request, createdBy);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserRequest request,
            @RequestParam UUID updatedBy) {
        UserResponse response = adminService.updateUser(userId, request, updatedBy);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<UserResponse> getUser(@PathVariable UUID userId) {
        return adminService.getUser(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/users/username/{username}")
    public ResponseEntity<UserResponse> getUserByUsername(@PathVariable String username) {
        return adminService.getUserByUsername(username)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/tenants/{tenantId}/users")
    public ResponseEntity<Page<UserListItem>> listUsers(
            @PathVariable UUID tenantId,
            @RequestParam(required = false) User.UserStatus status,
            @RequestParam(required = false) String searchTerm,
            Pageable pageable) {
        Page<UserListItem> users = adminService.listUsers(tenantId, status, searchTerm, pageable);
        return ResponseEntity.ok(users);
    }

    @PostMapping("/users/{userId}/activate")
    public ResponseEntity<UserResponse> activateUser(
            @PathVariable UUID userId,
            @RequestParam UUID activatedBy) {
        UserResponse response = adminService.activateUser(userId, activatedBy);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/users/{userId}/deactivate")
    public ResponseEntity<UserResponse> deactivateUser(
            @PathVariable UUID userId,
            @RequestParam UUID deactivatedBy) {
        UserResponse response = adminService.deactivateUser(userId, deactivatedBy);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/users/{userId}/lock")
    public ResponseEntity<UserResponse> lockUser(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "30") int lockoutMinutes,
            @RequestParam UUID lockedBy) {
        UserResponse response = adminService.lockUser(userId, lockoutMinutes, lockedBy);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/users/{userId}/unlock")
    public ResponseEntity<UserResponse> unlockUser(
            @PathVariable UUID userId,
            @RequestParam UUID unlockedBy) {
        UserResponse response = adminService.unlockUser(userId, unlockedBy);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/users/{userId}/change-password")
    public ResponseEntity<Void> changePassword(
            @PathVariable UUID userId,
            @Valid @RequestBody ChangePasswordRequest request) {
        adminService.changePassword(userId, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/users/{userId}/reset-password")
    public ResponseEntity<Void> resetPassword(
            @PathVariable UUID userId,
            @Valid @RequestBody ResetPasswordRequest request,
            @RequestParam UUID resetBy) {
        adminService.resetPassword(userId, request, resetBy);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/users/{userId}/roles")
    public ResponseEntity<UserResponse> assignRoles(
            @PathVariable UUID userId,
            @Valid @RequestBody AssignRolesRequest request,
            @RequestParam UUID assignedBy) {
        UserResponse response = adminService.assignRoles(userId, request, assignedBy);
        return ResponseEntity.ok(response);
    }

    // ==================== Role Management ====================

    @PostMapping("/tenants/{tenantId}/roles")
    public ResponseEntity<RoleResponse> createRole(
            @PathVariable UUID tenantId,
            @Valid @RequestBody CreateRoleRequest request,
            @RequestParam UUID createdBy) {
        RoleResponse response = adminService.createRole(tenantId, request, createdBy);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/roles/{roleId}")
    public ResponseEntity<RoleResponse> updateRole(
            @PathVariable UUID roleId,
            @Valid @RequestBody UpdateRoleRequest request,
            @RequestParam UUID updatedBy) {
        RoleResponse response = adminService.updateRole(roleId, request, updatedBy);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/roles/{roleId}")
    public ResponseEntity<RoleResponse> getRole(@PathVariable UUID roleId) {
        return adminService.getRole(roleId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/tenants/{tenantId}/roles")
    public ResponseEntity<List<RoleResponse>> listRoles(@PathVariable UUID tenantId) {
        List<RoleResponse> roles = adminService.listRoles(tenantId);
        return ResponseEntity.ok(roles);
    }

    @GetMapping("/tenants/{tenantId}/roles/stats")
    public ResponseEntity<List<RoleListItem>> listRolesWithStats(@PathVariable UUID tenantId) {
        List<RoleListItem> roles = adminService.listRolesWithStats(tenantId);
        return ResponseEntity.ok(roles);
    }

    @DeleteMapping("/roles/{roleId}")
    public ResponseEntity<Void> deleteRole(
            @PathVariable UUID roleId,
            @RequestParam UUID deletedBy) {
        adminService.deleteRole(roleId, deletedBy);
        return ResponseEntity.noContent().build();
    }

    // ==================== Permission Management ====================

    @GetMapping("/permissions")
    public ResponseEntity<List<PermissionResponse>> listPermissions() {
        List<PermissionResponse> permissions = adminService.listPermissions();
        return ResponseEntity.ok(permissions);
    }

    @GetMapping("/permissions/grouped")
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

    @PostMapping("/auth/logout")
    public ResponseEntity<Void> logout(
            @RequestParam UUID userId,
            @RequestHeader("Authorization") String token) {
        adminService.logout(userId, token);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/auth/logout-all")
    public ResponseEntity<Void> logoutAllSessions(@RequestParam UUID userId) {
        adminService.logoutAllSessions(userId);
        return ResponseEntity.ok().build();
    }

    // ==================== MFA ====================

    @PostMapping("/users/{userId}/mfa/setup")
    public ResponseEntity<MfaSetupResponse> setupMfa(@PathVariable UUID userId) {
        MfaSetupResponse response = adminService.setupMfa(userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/users/{userId}/mfa/verify")
    public ResponseEntity<Void> verifyAndEnableMfa(
            @PathVariable UUID userId,
            @Valid @RequestBody MfaVerifyRequest request) {
        adminService.verifyAndEnableMfa(userId, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/users/{userId}/mfa/disable")
    public ResponseEntity<Void> disableMfa(@PathVariable UUID userId) {
        adminService.disableMfa(userId);
        return ResponseEntity.ok().build();
    }

    // ==================== API Keys ====================

    @PostMapping("/tenants/{tenantId}/api-keys")
    public ResponseEntity<ApiKeyCreatedResponse> createApiKey(
            @PathVariable UUID tenantId,
            @Valid @RequestBody CreateApiKeyRequest request,
            @RequestParam UUID createdBy) {
        ApiKeyCreatedResponse response = adminService.createApiKey(tenantId, request, createdBy);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/tenants/{tenantId}/api-keys")
    public ResponseEntity<List<ApiKeyResponse>> listApiKeys(@PathVariable UUID tenantId) {
        List<ApiKeyResponse> keys = adminService.listApiKeys(tenantId);
        return ResponseEntity.ok(keys);
    }

    @DeleteMapping("/api-keys/{apiKeyId}")
    public ResponseEntity<Void> revokeApiKey(
            @PathVariable UUID apiKeyId,
            @RequestParam UUID revokedBy) {
        adminService.revokeApiKey(apiKeyId, revokedBy);
        return ResponseEntity.noContent().build();
    }

    // ==================== Audit Logs ====================

    @GetMapping("/tenants/{tenantId}/audit-logs")
    public ResponseEntity<Page<AuditLogResponse>> searchAuditLogs(
            @PathVariable UUID tenantId,
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
    public ResponseEntity<Page<AuditLogResponse>> getUserAuditLogs(
            @PathVariable UUID userId,
            Pageable pageable) {
        Page<AuditLogResponse> logs = adminService.getUserAuditLogs(userId, pageable);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/audit-logs/resource/{resourceType}/{resourceId}")
    public ResponseEntity<Page<AuditLogResponse>> getResourceAuditLogs(
            @PathVariable String resourceType,
            @PathVariable String resourceId,
            Pageable pageable) {
        Page<AuditLogResponse> logs = adminService.getResourceAuditLogs(resourceType, resourceId, pageable);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/tenants/{tenantId}/audit-logs/stats")
    public ResponseEntity<AuditStats> getAuditStats(
            @PathVariable UUID tenantId,
            @RequestParam(required = false) LocalDateTime from,
            @RequestParam(required = false) LocalDateTime to) {
        LocalDateTime dateFrom = from != null ? from : LocalDateTime.now().minusDays(30);
        LocalDateTime dateTo = to != null ? to : LocalDateTime.now();
        AuditStats stats = adminService.getAuditStats(tenantId, dateFrom, dateTo);
        return ResponseEntity.ok(stats);
    }

    // ==================== System Configuration ====================

    @GetMapping("/config")
    public ResponseEntity<List<SystemConfigResponse>> getSystemConfig(
            @RequestParam(required = false) UUID tenantId) {
        List<SystemConfigResponse> config = adminService.getSystemConfig(tenantId);
        return ResponseEntity.ok(config);
    }

    @PutMapping("/config/{key}")
    public ResponseEntity<SystemConfigResponse> updateConfig(
            @PathVariable String key,
            @RequestParam(required = false) UUID tenantId,
            @Valid @RequestBody UpdateConfigRequest request,
            @RequestParam UUID updatedBy) {
        SystemConfigResponse response = adminService.updateConfig(tenantId, key, request, updatedBy);
        return ResponseEntity.ok(response);
    }

    // ==================== Dashboard ====================

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboard> getAdminDashboard() {
        AdminDashboard dashboard = adminService.getAdminDashboard();
        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/dashboard/tenant-stats")
    public ResponseEntity<TenantStats> getTenantStats() {
        TenantStats stats = adminService.getTenantStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/dashboard/user-stats/{tenantId}")
    public ResponseEntity<UserStats> getUserStats(@PathVariable UUID tenantId) {
        UserStats stats = adminService.getUserStats(tenantId);
        return ResponseEntity.ok(stats);
    }
}
