package com.surework.admin.service;

import com.surework.admin.domain.*;
import com.surework.admin.dto.AdminDto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service interface for system administration operations.
 */
public interface AdminService {

    // ==================== Tenant Management ====================

    TenantResponse createTenant(CreateTenantRequest request, UUID createdBy);

    TenantResponse updateTenant(UUID tenantId, UpdateTenantRequest request, UUID updatedBy);

    Optional<TenantResponse> getTenant(UUID tenantId);

    Optional<TenantResponse> getTenantByCode(String code);

    Page<TenantListItem> listTenants(Tenant.TenantStatus status, String searchTerm, Pageable pageable);

    TenantResponse activateTenant(UUID tenantId, UUID activatedBy);

    TenantResponse suspendTenant(UUID tenantId, String reason, UUID suspendedBy);

    TenantResponse reactivateTenant(UUID tenantId, UUID reactivatedBy);

    void terminateTenant(UUID tenantId, UUID terminatedBy);

    // ==================== User Management ====================

    UserResponse createUser(UUID tenantId, CreateUserRequest request, UUID createdBy);

    UserResponse updateUser(UUID userId, UpdateUserRequest request, UUID updatedBy);

    Optional<UserResponse> getUser(UUID userId);

    Optional<UserResponse> getUserByUsername(String username);

    Optional<UserResponse> getUserByEmail(String email);

    Page<UserListItem> listUsers(UUID tenantId, User.UserStatus status, String searchTerm, Pageable pageable);

    UserResponse activateUser(UUID userId, UUID activatedBy);

    UserResponse deactivateUser(UUID userId, UUID deactivatedBy);

    UserResponse lockUser(UUID userId, int lockoutMinutes, UUID lockedBy);

    UserResponse unlockUser(UUID userId, UUID unlockedBy);

    void changePassword(UUID userId, ChangePasswordRequest request);

    void resetPassword(UUID userId, ResetPasswordRequest request, UUID resetBy);

    UserResponse assignRoles(UUID userId, AssignRolesRequest request, UUID assignedBy);

    // ==================== Role Management ====================

    RoleResponse createRole(UUID tenantId, CreateRoleRequest request, UUID createdBy);

    RoleResponse updateRole(UUID roleId, UpdateRoleRequest request, UUID updatedBy);

    Optional<RoleResponse> getRole(UUID roleId);

    List<RoleResponse> listRoles(UUID tenantId);

    List<RoleListItem> listRolesWithStats(UUID tenantId);

    void deleteRole(UUID roleId, UUID deletedBy);

    // ==================== Permission Management ====================

    List<PermissionResponse> listPermissions();

    List<PermissionGroup> listPermissionsByCategory();

    // ==================== Authentication ====================

    LoginResponse login(LoginRequest request, String ipAddress, String userAgent);

    LoginResponse refreshToken(RefreshTokenRequest request);

    void logout(UUID userId, String token);

    void logoutAllSessions(UUID userId);

    MfaSetupResponse setupMfa(UUID userId);

    void verifyAndEnableMfa(UUID userId, MfaVerifyRequest request);

    void disableMfa(UUID userId);

    // ==================== API Key Management ====================

    ApiKeyCreatedResponse createApiKey(UUID tenantId, CreateApiKeyRequest request, UUID createdBy);

    List<ApiKeyResponse> listApiKeys(UUID tenantId);

    void revokeApiKey(UUID apiKeyId, UUID revokedBy);

    // ==================== Audit Logging ====================

    void logEvent(AuditLog.Builder logBuilder);

    Page<AuditLogResponse> searchAuditLogs(UUID tenantId, AuditLogSearchRequest request, Pageable pageable);

    Page<AuditLogResponse> getUserAuditLogs(UUID userId, Pageable pageable);

    Page<AuditLogResponse> getResourceAuditLogs(String resourceType, String resourceId, Pageable pageable);

    AuditStats getAuditStats(UUID tenantId, LocalDateTime from, LocalDateTime to);

    // ==================== System Configuration ====================

    List<SystemConfigResponse> getSystemConfig(UUID tenantId);

    SystemConfigResponse updateConfig(UUID tenantId, String key, UpdateConfigRequest request, UUID updatedBy);

    // ==================== Dashboard ====================

    AdminDashboard getAdminDashboard();

    TenantStats getTenantStats();

    UserStats getUserStats(UUID tenantId);
}
