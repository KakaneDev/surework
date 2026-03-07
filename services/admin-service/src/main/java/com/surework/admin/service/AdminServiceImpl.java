package com.surework.admin.service;

import com.surework.admin.domain.*;
import com.surework.admin.dto.AdminDto.*;
import com.surework.admin.repository.*;
import eu.bitwalker.useragentutils.UserAgent;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of AdminService for system administration operations.
 */
@Service
@Transactional
public class AdminServiceImpl implements AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminServiceImpl.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final UserSessionRepository userSessionRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${surework.admin.jwt.secret}")
    private String jwtSecret;

    @Value("${surework.admin.jwt.expiration-hours:8}")
    private int jwtExpirationHours;

    @Value("${surework.admin.jwt.refresh-expiration-days:7}")
    private int refreshExpirationDays;

    @Value("${surework.admin.password-reset.expiry-hours:24}")
    private int passwordResetExpiryHours;

    public AdminServiceImpl(
            TenantRepository tenantRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            AuditLogRepository auditLogRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            UserSessionRepository userSessionRepository,
            PasswordEncoder passwordEncoder) {
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.auditLogRepository = auditLogRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.userSessionRepository = userSessionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ==================== Tenant Management ====================

    @Override
    public TenantResponse createTenant(CreateTenantRequest request, UUID createdBy) {
        log.info("Creating tenant: {}", request.code());

        if (tenantRepository.existsByCode(request.code())) {
            throw new IllegalArgumentException("Tenant code already exists: " + request.code());
        }

        Tenant tenant = new Tenant();
        tenant.setCode(request.code());
        tenant.setName(request.name());
        tenant.setTradingName(request.tradingName());
        tenant.setRegistrationNumber(request.registrationNumber());
        tenant.setTaxNumber(request.taxNumber());
        tenant.setVatNumber(request.vatNumber());
        tenant.setCompanyType(request.companyType());
        tenant.setIndustrySector(request.industrySector());
        if (request.physicalAddress() != null) {
            tenant.setPhysicalAddress(mapToAddress(request.physicalAddress()));
        }
        tenant.setPhoneNumber(request.phoneNumber());
        tenant.setEmail(request.email());
        tenant.setSubscriptionTier(request.subscriptionTier() != null ? 
                request.subscriptionTier() : Tenant.SubscriptionTier.STARTER);
        tenant.setMaxUsers(request.maxUsers() != null ? request.maxUsers() : 5);
        tenant.setSubscriptionStart(request.subscriptionStart() != null ? 
                request.subscriptionStart() : java.time.LocalDate.now());
        tenant.setSubscriptionEnd(request.subscriptionEnd());
        tenant.setStatus(Tenant.TenantStatus.PENDING);
        tenant.setCurrencyCode("ZAR");
        tenant.setTimezone("Africa/Johannesburg");
        tenant.setCreatedBy(createdBy);

        tenant = tenantRepository.save(tenant);

        log.info("Tenant created: {}", tenant.getId());
        return mapToTenantResponse(tenant);
    }

    @Override
    public TenantResponse updateTenant(UUID tenantId, UpdateTenantRequest request, UUID updatedBy) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found: " + tenantId));

        if (request.name() != null) tenant.setName(request.name());
        if (request.tradingName() != null) tenant.setTradingName(request.tradingName());
        if (request.registrationNumber() != null) tenant.setRegistrationNumber(request.registrationNumber());
        if (request.taxNumber() != null) tenant.setTaxNumber(request.taxNumber());
        if (request.vatNumber() != null) tenant.setVatNumber(request.vatNumber());
        if (request.uifReference() != null) tenant.setUifReference(request.uifReference());
        if (request.sdlNumber() != null) tenant.setSdlNumber(request.sdlNumber());
        if (request.payeReference() != null) tenant.setPayeReference(request.payeReference());
        if (request.companyType() != null) tenant.setCompanyType(request.companyType());
        if (request.industrySector() != null) tenant.setIndustrySector(request.industrySector());
        if (request.physicalAddress() != null) tenant.setPhysicalAddress(mapToAddress(request.physicalAddress()));
        if (request.postalAddress() != null) tenant.setPostalAddress(mapToAddress(request.postalAddress()));
        if (request.phoneNumber() != null) tenant.setPhoneNumber(request.phoneNumber());
        if (request.email() != null) tenant.setEmail(request.email());
        if (request.website() != null) tenant.setWebsite(request.website());
        if (request.logoUrl() != null) tenant.setLogoUrl(request.logoUrl());
        if (request.primaryColor() != null) tenant.setPrimaryColor(request.primaryColor());
        if (request.secondaryColor() != null) tenant.setSecondaryColor(request.secondaryColor());
        if (request.timezone() != null) tenant.setTimezone(request.timezone());
        if (request.dateFormat() != null) tenant.setDateFormat(request.dateFormat());

        tenant.setUpdatedBy(updatedBy);
        tenant = tenantRepository.save(tenant);

        return mapToTenantResponse(tenant);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<TenantResponse> getTenant(UUID tenantId) {
        return tenantRepository.findById(tenantId).map(this::mapToTenantResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<TenantResponse> getTenantByCode(String code) {
        return tenantRepository.findByCode(code).map(this::mapToTenantResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TenantListItem> listTenants(Tenant.TenantStatus status, String searchTerm, Pageable pageable) {
        Page<Tenant> tenants;
        if (status != null && searchTerm != null && !searchTerm.isBlank()) {
            tenants = tenantRepository.findByStatusAndNameContainingIgnoreCase(status, searchTerm, pageable);
        } else if (status != null) {
            tenants = tenantRepository.findByStatus(status, pageable);
        } else if (searchTerm != null && !searchTerm.isBlank()) {
            tenants = tenantRepository.findByNameContainingIgnoreCase(searchTerm, pageable);
        } else {
            tenants = tenantRepository.findAll(pageable);
        }
        return tenants.map(this::mapToTenantListItem);
    }

    @Override
    public TenantResponse activateTenant(UUID tenantId, UUID activatedBy) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
        tenant.setStatus(Tenant.TenantStatus.ACTIVE);
        tenant.setActivatedAt(LocalDateTime.now());
        tenant.setUpdatedBy(activatedBy);
        return mapToTenantResponse(tenantRepository.save(tenant));
    }

    @Override
    public TenantResponse suspendTenant(UUID tenantId, String reason, UUID suspendedBy) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
        tenant.setStatus(Tenant.TenantStatus.SUSPENDED);
        tenant.setSuspendedAt(LocalDateTime.now());
        tenant.setSuspensionReason(reason);
        tenant.setUpdatedBy(suspendedBy);
        return mapToTenantResponse(tenantRepository.save(tenant));
    }

    @Override
    public TenantResponse reactivateTenant(UUID tenantId, UUID reactivatedBy) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
        tenant.setStatus(Tenant.TenantStatus.ACTIVE);
        tenant.setSuspendedAt(null);
        tenant.setSuspensionReason(null);
        tenant.setUpdatedBy(reactivatedBy);
        return mapToTenantResponse(tenantRepository.save(tenant));
    }

    @Override
    public void terminateTenant(UUID tenantId, UUID terminatedBy) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
        tenant.setStatus(Tenant.TenantStatus.TERMINATED);
        tenant.setTerminatedAt(LocalDateTime.now());
        tenant.setUpdatedBy(terminatedBy);
        tenantRepository.save(tenant);
    }

    // ==================== User Management ====================

    @Override
    public UserResponse createUser(UUID tenantId, CreateUserRequest request, UUID createdBy) {
        log.info("Creating user: {} for tenant: {}", request.username(), tenantId);

        if (userRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = new User();
        user.setTenantId(tenantId);
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setDisplayName(request.displayName() != null ? 
                request.displayName() : request.firstName() + " " + request.lastName());
        user.setPhoneNumber(request.phoneNumber());
        user.setMobileNumber(request.mobileNumber());
        user.setEmployeeId(request.employeeId());
        user.setStatus(User.UserStatus.PENDING);
        user.setCreatedBy(createdBy);

        if (request.roleIds() != null && !request.roleIds().isEmpty()) {
            Set<Role> roles = new HashSet<>(roleRepository.findAllById(request.roleIds()));
            user.setRoles(roles);
        }

        user = userRepository.save(user);
        return mapToUserResponse(user);
    }

    @Override
    public UserResponse updateUser(UUID userId, UpdateUserRequest request, UUID updatedBy) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (request.firstName() != null) user.setFirstName(request.firstName());
        if (request.lastName() != null) user.setLastName(request.lastName());
        if (request.displayName() != null) user.setDisplayName(request.displayName());
        if (request.phoneNumber() != null) user.setPhoneNumber(request.phoneNumber());
        if (request.mobileNumber() != null) user.setMobileNumber(request.mobileNumber());
        if (request.avatarUrl() != null) user.setAvatarUrl(request.avatarUrl());
        if (request.timezone() != null) user.setTimezone(request.timezone());
        if (request.language() != null) user.setLanguage(request.language());
        if (request.dateFormat() != null) user.setDateFormat(request.dateFormat());
        if (request.notifyEmail() != null) user.setNotifyEmail(request.notifyEmail());
        if (request.notifySms() != null) user.setNotifySms(request.notifySms());
        if (request.notifyPush() != null) user.setNotifyPush(request.notifyPush());

        user.setUpdatedBy(updatedBy);
        return mapToUserResponse(userRepository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UserResponse> getUser(UUID userId) {
        return userRepository.findById(userId).map(this::mapToUserResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UserResponse> getUserByUsername(String username) {
        return userRepository.findByUsername(username).map(this::mapToUserResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UserResponse> getUserByEmail(String email) {
        return userRepository.findByEmail(email).map(this::mapToUserResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserListItem> listUsers(UUID tenantId, User.UserStatus status, String searchTerm, Pageable pageable) {
        // Use searchUsers query which supports filtering by status and search term
        // Pass null for empty/blank search term to match all
        String normalizedSearchTerm = (searchTerm != null && !searchTerm.isBlank()) ? searchTerm.trim() : null;
        Page<User> users = userRepository.searchUsers(tenantId, status, normalizedSearchTerm, pageable);
        return users.map(this::mapToUserListItem);
    }

    @Override
    public UserResponse activateUser(UUID userId, UUID activatedBy) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setStatus(User.UserStatus.ACTIVE);
        user.setUpdatedBy(activatedBy);
        return mapToUserResponse(userRepository.save(user));
    }

    @Override
    public UserResponse deactivateUser(UUID userId, UUID deactivatedBy) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setStatus(User.UserStatus.INACTIVE);
        user.setUpdatedBy(deactivatedBy);
        return mapToUserResponse(userRepository.save(user));
    }

    @Override
    public UserResponse lockUser(UUID userId, int lockoutMinutes, UUID lockedBy) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setStatus(User.UserStatus.LOCKED);
        user.setLockedUntil(LocalDateTime.now().plusMinutes(lockoutMinutes));
        user.setUpdatedBy(lockedBy);
        return mapToUserResponse(userRepository.save(user));
    }

    @Override
    public UserResponse unlockUser(UUID userId, UUID unlockedBy) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setStatus(User.UserStatus.ACTIVE);
        user.setLockedUntil(null);
        user.setFailedLoginAttempts(0);
        user.setUpdatedBy(unlockedBy);
        return mapToUserResponse(userRepository.save(user));
    }

    @Override
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setPasswordChangedAt(LocalDateTime.now());
        user.setPasswordExpiresAt(LocalDateTime.now().plusDays(90));
        userRepository.save(user);
    }

    @Override
    public void resetPassword(UUID userId, ResetPasswordRequest request, UUID resetBy) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setPasswordChangedAt(LocalDateTime.now());
        user.setMustChangePassword(true);
        user.setUpdatedBy(resetBy);
        userRepository.save(user);
    }

    @Override
    public UserResponse assignRoles(UUID userId, AssignRolesRequest request, UUID assignedBy) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Set<Role> roles = new HashSet<>(roleRepository.findAllById(request.roleIds()));
        user.setRoles(roles);
        user.setUpdatedBy(assignedBy);
        return mapToUserResponse(userRepository.save(user));
    }

    @Override
    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.REPEATABLE_READ)
    public UserResponse updateUserRoles(UUID tenantId, UUID userId, AssignRolesRequest request, UUID assignedBy, boolean isSuperAdmin) {
        // Validate user exists and belongs to the specified tenant
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!tenantId.equals(user.getTenantId())) {
            throw new IllegalArgumentException("User does not belong to this tenant");
        }

        // Capture old roles for audit logging
        List<String> oldRoleCodes = user.getRoles() != null
                ? user.getRoles().stream().map(Role::getCode).sorted().toList()
                : List.of();

        // Find the requested roles (both system roles and tenant-specific roles)
        Set<Role> newRoles = new HashSet<>(roleRepository.findAllById(request.roleIds()));

        // Validate all roles are either system roles or belong to this tenant
        // Also check for privilege escalation attempts
        for (Role role : newRoles) {
            // Privilege escalation check: only SUPER_ADMIN can assign SUPER_ADMIN role
            if ("SUPER_ADMIN".equals(role.getCode()) && !isSuperAdmin) {
                log.warn("Privilege escalation attempt: non-SUPER_ADMIN user {} tried to assign SUPER_ADMIN role to user {}",
                        assignedBy, userId);
                throw new org.springframework.security.access.AccessDeniedException(
                        "Only SUPER_ADMIN can assign SUPER_ADMIN role");
            }

            // Tenant ownership check
            if (!role.isSystemRole() && role.getTenantId() != null && !tenantId.equals(role.getTenantId())) {
                throw new IllegalArgumentException("Role " + role.getCode() + " does not belong to this tenant");
            }
        }

        user.setRoles(newRoles);
        user.setUpdatedBy(assignedBy);
        User savedUser = userRepository.save(user);

        // Capture new roles for audit logging
        List<String> newRoleCodes = newRoles.stream().map(Role::getCode).sorted().toList();

        log.info("Updated roles for user {} in tenant {}: {} -> {}", userId, tenantId, oldRoleCodes, newRoleCodes);

        // Create audit log entry for this security-sensitive operation
        // Role changes are tracked for compliance and security monitoring
        logEvent(AuditLog.builder()
                .tenantId(tenantId)
                .eventType(AuditLog.EventType.ROLE_CHANGE)
                .eventCategory(AuditLog.EventCategory.AUTHORIZATION)
                .eventAction("UPDATE_USER_ROLES")
                .resource("USER", userId.toString(), user.getUsername())
                .user(assignedBy, null, null)
                .changes(oldRoleCodes.toString(), newRoleCodes.toString(),
                        "Roles changed from " + oldRoleCodes + " to " + newRoleCodes)
                .success(true));

        return mapToUserResponse(savedUser);
    }

    // ==================== Avatar Management ====================

    @Override
    public AvatarResponse uploadAvatar(UUID userId, byte[] fileData, String fileName, String contentType) {
        log.info("Uploading avatar for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        // Validate content type
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("File must be an image");
        }

        // Validate file size (max 5MB)
        if (fileData.length > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("File size must be less than 5MB");
        }

        // Generate unique filename and store avatar
        // For now, we'll store as base64 data URL - in production, use cloud storage
        String base64Data = Base64.getEncoder().encodeToString(fileData);
        String avatarUrl = "data:" + contentType + ";base64," + base64Data;

        user.setAvatarUrl(avatarUrl);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("Avatar uploaded for user: {}", userId);
        return new AvatarResponse(avatarUrl);
    }

    @Override
    public void deleteAvatar(UUID userId) {
        log.info("Deleting avatar for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        user.setAvatarUrl(null);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("Avatar deleted for user: {}", userId);
    }

    // ==================== Role Management ====================

    @Override
    public RoleResponse createRole(UUID tenantId, CreateRoleRequest request, UUID createdBy) {
        Role role = new Role();
        role.setTenantId(tenantId);
        role.setCode(request.code());
        role.setName(request.name());
        role.setDescription(request.description());
        role.setParentRoleId(request.parentRoleId());
        role.setSystemRole(false);
        role.setDefaultRole(request.isDefault());
        role.setActive(true);
        role.setCreatedBy(createdBy);

        role = roleRepository.save(role);
        return mapToRoleResponse(role);
    }

    @Override
    public RoleResponse updateRole(UUID roleId, UpdateRoleRequest request, UUID updatedBy) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new IllegalArgumentException("Role not found"));

        if (role.isSystemRole()) {
            throw new IllegalArgumentException("System roles cannot be modified");
        }

        if (request.name() != null) role.setName(request.name());
        if (request.description() != null) role.setDescription(request.description());
        if (request.parentRoleId() != null) role.setParentRoleId(request.parentRoleId());
        if (request.active() != null) role.setActive(request.active());
        if (request.isDefault() != null) role.setDefaultRole(request.isDefault());

        role.setUpdatedBy(updatedBy);
        return mapToRoleResponse(roleRepository.save(role));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<RoleResponse> getRole(UUID roleId) {
        return roleRepository.findById(roleId).map(this::mapToRoleResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoleResponse> listRoles(UUID tenantId) {
        // Use JOIN FETCH query to eagerly load parent roles and prevent N+1 queries
        return roleRepository.findByTenantIdOrSystemRoleTrueWithParent(tenantId).stream()
                .map(this::mapToRoleResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoleListItem> listRolesWithStats(UUID tenantId) {
        return roleRepository.findByTenantIdOrSystemRoleTrue(tenantId).stream()
                .map(role -> new RoleListItem(
                        role.getId(),
                        role.getCode(),
                        role.getName(),
                        role.getPermissions() != null ? role.getPermissions().size() : 0,
                        0, // TODO: count users
                        role.isSystemRole(),
                        role.isActive()
                ))
                .collect(Collectors.toList());
    }

    @Override
    public void deleteRole(UUID roleId, UUID deletedBy) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new IllegalArgumentException("Role not found"));
        if (role.isSystemRole()) {
            throw new IllegalArgumentException("System roles cannot be deleted");
        }
        roleRepository.delete(role);
    }

    // ==================== Permission Management ====================

    /**
     * Lists all available permissions.
     * Returns static permission definitions until permission repository is implemented.
     */
    @Override
    @Transactional(readOnly = true)
    public List<PermissionResponse> listPermissions() {
        // Return static permission definitions for now
        // Permission repository will be implemented in a future sprint
        return getStaticPermissions();
    }

    /**
     * Lists permissions grouped by category.
     * Returns static permission definitions until permission repository is implemented.
     */
    @Override
    @Transactional(readOnly = true)
    public List<PermissionGroup> listPermissionsByCategory() {
        // Return static permission groups for now
        // Permission repository will be implemented in a future sprint
        return getStaticPermissionGroups();
    }

    private List<PermissionResponse> getStaticPermissions() {
        return List.of(
                new PermissionResponse(UUID.randomUUID(), "user:read", "View users", "View and list user accounts", Permission.PermissionCategory.USER, "user", Permission.ActionType.READ),
                new PermissionResponse(UUID.randomUUID(), "user:write", "Create/edit users", "Create and modify user accounts", Permission.PermissionCategory.USER, "user", Permission.ActionType.UPDATE),
                new PermissionResponse(UUID.randomUUID(), "user:delete", "Delete users", "Remove user accounts", Permission.PermissionCategory.USER, "user", Permission.ActionType.DELETE),
                new PermissionResponse(UUID.randomUUID(), "role:read", "View roles", "View and list roles", Permission.PermissionCategory.SYSTEM, "role", Permission.ActionType.READ),
                new PermissionResponse(UUID.randomUUID(), "role:write", "Create/edit roles", "Create and modify roles", Permission.PermissionCategory.SYSTEM, "role", Permission.ActionType.UPDATE),
                new PermissionResponse(UUID.randomUUID(), "tenant:read", "View tenants", "View and list tenant organizations", Permission.PermissionCategory.TENANT, "tenant", Permission.ActionType.READ),
                new PermissionResponse(UUID.randomUUID(), "tenant:write", "Create/edit tenants", "Create and modify tenant organizations", Permission.PermissionCategory.TENANT, "tenant", Permission.ActionType.UPDATE),
                new PermissionResponse(UUID.randomUUID(), "audit:read", "View audit logs", "View audit and compliance logs", Permission.PermissionCategory.SYSTEM, "audit", Permission.ActionType.READ)
        );
    }

    private List<PermissionGroup> getStaticPermissionGroups() {
        return List.of(
                new PermissionGroup(Permission.PermissionCategory.USER, List.of(
                        new PermissionResponse(UUID.randomUUID(), "user:read", "View users", "View and list user accounts", Permission.PermissionCategory.USER, "user", Permission.ActionType.READ),
                        new PermissionResponse(UUID.randomUUID(), "user:write", "Create/edit users", "Create and modify user accounts", Permission.PermissionCategory.USER, "user", Permission.ActionType.UPDATE),
                        new PermissionResponse(UUID.randomUUID(), "user:delete", "Delete users", "Remove user accounts", Permission.PermissionCategory.USER, "user", Permission.ActionType.DELETE)
                )),
                new PermissionGroup(Permission.PermissionCategory.SYSTEM, List.of(
                        new PermissionResponse(UUID.randomUUID(), "role:read", "View roles", "View and list roles", Permission.PermissionCategory.SYSTEM, "role", Permission.ActionType.READ),
                        new PermissionResponse(UUID.randomUUID(), "role:write", "Create/edit roles", "Create and modify roles", Permission.PermissionCategory.SYSTEM, "role", Permission.ActionType.UPDATE),
                        new PermissionResponse(UUID.randomUUID(), "audit:read", "View audit logs", "View audit and compliance logs", Permission.PermissionCategory.SYSTEM, "audit", Permission.ActionType.READ)
                )),
                new PermissionGroup(Permission.PermissionCategory.TENANT, List.of(
                        new PermissionResponse(UUID.randomUUID(), "tenant:read", "View tenants", "View and list tenant organizations", Permission.PermissionCategory.TENANT, "tenant", Permission.ActionType.READ),
                        new PermissionResponse(UUID.randomUUID(), "tenant:write", "Create/edit tenants", "Create and modify tenant organizations", Permission.PermissionCategory.TENANT, "tenant", Permission.ActionType.UPDATE)
                ))
        );
    }

    // ==================== Authentication ====================

    @Override
    public LoginResponse login(LoginRequest request, String ipAddress, String userAgent) {
        log.info("Login attempt for user: {}", request.username());

        try {
        // Allow login with either username or email
        // Use findByUsernameOrEmailWithRoles to eagerly fetch roles for JWT generation
        User user = userRepository.findByUsernameOrEmailWithRoles(request.username(), request.username())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        // Check user status before proceeding with authentication
        switch (user.getStatus()) {
            case LOCKED -> {
                if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now())) {
                    long minutesRemaining = LocalDateTime.now().until(user.getLockedUntil(), ChronoUnit.MINUTES);
                    log.warn("Login attempt for locked account: {} (locked for {} more minutes)",
                            request.username(), minutesRemaining);
                    throw new IllegalArgumentException("Account is locked. Try again in " + minutesRemaining + " minutes.");
                }
                // Auto-unlock if lockout period has passed
                log.info("Auto-unlocking account: {} (lockout period expired)", request.username());
                user.setStatus(User.UserStatus.ACTIVE);
                user.setLockedUntil(null);
                user.setFailedLoginAttempts(0);
                userRepository.save(user);
            }
            case PENDING -> {
                log.warn("Login attempt for pending account: {}", request.username());
                throw new IllegalArgumentException("Account is pending activation. Please check your email.");
            }
            case INACTIVE -> {
                log.warn("Login attempt for inactive account: {}", request.username());
                throw new IllegalArgumentException("Account is inactive. Please contact your administrator.");
            }
            case SUSPENDED -> {
                log.warn("Login attempt for suspended account: {}", request.username());
                throw new IllegalArgumentException("Account has been suspended. Please contact your administrator.");
            }
            case ACTIVE -> {
                // User is active, proceed with authentication
            }
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
            int remainingAttempts = 5 - user.getFailedLoginAttempts();
            if (user.getFailedLoginAttempts() >= 5) {
                user.setStatus(User.UserStatus.LOCKED);
                user.setLockedUntil(LocalDateTime.now().plusMinutes(30));
                remainingAttempts = 0;
            }
            userRepository.save(user);

            // Return response with remaining attempts for frontend display
            log.warn("Failed login attempt for user: {}, remaining attempts: {}", request.username(), remainingAttempts);
            return new LoginResponse(
                    null, null, "Bearer", 0, null, false, null,
                    remainingAttempts > 0 ? remainingAttempts : null
            );
        }

        // Check MFA if enabled
        if (user.isMfaEnabled()) {
            if (request.mfaCode() == null || request.mfaCode().isBlank()) {
                // Generate MFA challenge token for stateless verification
                String mfaChallengeToken = generateMfaChallengeToken(user);
                return new LoginResponse(null, null, "Bearer", 0, null, true, mfaChallengeToken, null);
            }

            // Verify TOTP code format (6 digits)
            if (!request.mfaCode().matches("^\\d{6}$")) {
                log.warn("Invalid MFA code format for user: {}", request.username());
                throw new IllegalArgumentException("Invalid MFA code format");
            }

            // TOTP verification would use a library like GoogleAuthenticator:
            // GoogleAuthenticator gAuth = new GoogleAuthenticator();
            // if (!gAuth.authorize(user.getMfaSecret(), Integer.parseInt(request.mfaCode()))) {
            //     throw new IllegalArgumentException("Invalid MFA code");
            // }
            //
            // For now, accept any valid 6-digit code until TOTP library is integrated
            log.info("MFA code accepted for user: {} (TOTP verification pending library integration)", user.getId());
        }

        // Generate tokens
        String accessToken = generateAccessToken(user);
        String refreshToken = generateRefreshToken(user);

        // Create session record
        UserSession session = createUserSession(user, accessToken, refreshToken, ipAddress, userAgent);

        // Update user login info
        user.setLastLoginAt(LocalDateTime.now());
        user.setLastLoginIp(ipAddress);
        user.setFailedLoginAttempts(0);
        userRepository.save(user);

        log.info("Login successful for user: {}", user.getUsername());

        return new LoginResponse(
                accessToken,
                refreshToken,
                "Bearer",
                jwtExpirationHours * 3600,
                mapToUserResponse(user),
                false,
                null,
                null
        );
        } catch (IllegalArgumentException e) {
            throw e; // Re-throw validation errors
        } catch (Exception e) {
            log.error("Login failed with unexpected error for user: {}", request.username(), e);
            throw new RuntimeException("Login failed: " + e.getClass().getSimpleName() + " - " + e.getMessage(), e);
        }
    }

    private String generateMfaChallengeToken(User user) {
        // Generate a short-lived token for MFA verification
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("type", "mfa_challenge")
                .issuedAt(Date.from(Instant.now()))
                .expiration(Date.from(Instant.now().plus(5, ChronoUnit.MINUTES)))
                .signWith(key)
                .compact();
    }

    private UserSession createUserSession(User user, String accessToken, String refreshToken,
                                          String ipAddress, String userAgentString) {
        UserSession session = new UserSession();
        session.setUserId(user.getId());
        session.setTokenHash(passwordEncoder.encode(accessToken));
        session.setRefreshTokenHash(refreshToken != null ? passwordEncoder.encode(refreshToken) : null);
        session.setIpAddress(ipAddress);
        session.setUserAgent(userAgentString);
        session.setExpiresAt(LocalDateTime.now().plusHours(jwtExpirationHours));
        session.setLastActivityAt(LocalDateTime.now());

        // Parse user agent for device info
        if (userAgentString != null && !userAgentString.isBlank()) {
            try {
                UserAgent ua = UserAgent.parseUserAgentString(userAgentString);
                session.setDeviceType(ua.getOperatingSystem().getDeviceType().getName());
                session.setDeviceName(ua.getOperatingSystem().getName());
                session.setBrowser(ua.getBrowser().getName());
            } catch (Exception e) {
                log.debug("Could not parse user agent: {}", e.getMessage());
                session.setDeviceType("Unknown");
                session.setDeviceName("Unknown");
                session.setBrowser("Unknown");
            }
        }

        return userSessionRepository.save(session);
    }

    @Override
    public LoginResponse refreshToken(RefreshTokenRequest request) {
        // Token refresh validates the refresh token and issues new access token
        // Refresh tokens are stored in user_sessions table
        log.info("Token refresh requested");

        if (request.refreshToken() == null || request.refreshToken().isBlank()) {
            throw new IllegalArgumentException("Refresh token is required");
        }

        try {
            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
            var claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(request.refreshToken())
                    .getPayload();

            String tokenType = claims.get("type", String.class);
            if (!"refresh".equals(tokenType)) {
                throw new IllegalArgumentException("Invalid token type");
            }

            UUID userId = UUID.fromString(claims.getSubject());
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            // Generate new access token
            String accessToken = generateAccessToken(user);

            return new LoginResponse(
                    accessToken,
                    request.refreshToken(), // Keep same refresh token
                    "Bearer",
                    jwtExpirationHours * 3600,
                    mapToUserResponse(user),
                    false,
                    null,
                    null
            );
        } catch (Exception e) {
            log.warn("Token refresh failed: {}", e.getMessage());
            throw new IllegalArgumentException("Invalid or expired refresh token");
        }
    }

    @Override
    public void logout(UUID userId, String token) {
        // Revoke the current session by invalidating its token
        log.info("Logout requested for user: {}", userId);

        if (token != null && token.startsWith("Bearer ")) {
            String tokenValue = token.substring(7);
            String tokenHash = passwordEncoder.encode(tokenValue);

            // Find and revoke the session with this token
            List<UserSession> sessions = userSessionRepository.findActiveByUserId(userId);
            for (UserSession session : sessions) {
                if (passwordEncoder.matches(tokenValue, session.getTokenHash())) {
                    session.revoke("User logout");
                    userSessionRepository.save(session);
                    log.info("Session revoked for user: {}", userId);
                    break;
                }
            }
        }

        // Audit log
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            logEvent(AuditLog.builder()
                    .tenantId(user.getTenantId())
                    .eventType(AuditLog.EventType.LOGOUT)
                    .eventCategory(AuditLog.EventCategory.AUTHENTICATION)
                    .eventAction("LOGOUT")
                    .resource("USER", userId.toString(), user.getUsername())
                    .user(userId, user.getUsername(), user.getEmail())
                    .success(true));
        }
    }

    @Override
    public void logoutAllSessions(UUID userId) {
        // Revoke all active sessions for the user
        log.info("Logout all sessions requested for user: {}", userId);

        int revokedCount = userSessionRepository.revokeAllSessions(
                userId, LocalDateTime.now(), "User requested logout from all devices");

        // Audit log
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            logEvent(AuditLog.builder()
                    .tenantId(user.getTenantId())
                    .eventType(AuditLog.EventType.LOGOUT)
                    .eventCategory(AuditLog.EventCategory.AUTHENTICATION)
                    .eventAction("LOGOUT_ALL_SESSIONS")
                    .resource("USER", userId.toString(), user.getUsername())
                    .user(userId, user.getUsername(), user.getEmail())
                    .changes(null, null, "Revoked " + revokedCount + " sessions")
                    .success(true));
        }

        log.info("Revoked {} sessions for user {}", revokedCount, userId);
    }

    @Override
    public Optional<UserResponse> getCurrentUserFromToken(String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return Optional.empty();
            }
            String token = authHeader.substring(7);
            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
            var claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            UUID userId = UUID.fromString(claims.getSubject());
            return getUser(userId);
        } catch (Exception e) {
            log.warn("Failed to parse token: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Set up MFA for a user.
     * Generates a TOTP secret and backup codes. The user must verify with
     * a TOTP code before MFA is actually enabled.
     */
    @Override
    public MfaSetupResponse setupMfa(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Generate Base32-encoded secret for TOTP
        String secret = generateRandomSecret();

        // Store secret temporarily (MFA not enabled until verified)
        user.setMfaSecret(secret);
        userRepository.save(user);

        // Generate backup codes
        List<String> backupCodes = generateBackupCodes();

        // Build otpauth URI for QR code generation
        // Format: otpauth://totp/Issuer:Account?secret=XXX&issuer=Issuer
        String otpAuthUri = String.format(
                "otpauth://totp/SureWork:%s?secret=%s&issuer=SureWork",
                user.getEmail(),
                secret
        );

        log.info("MFA setup initiated for user: {}", userId);

        return new MfaSetupResponse(secret, otpAuthUri, backupCodes);
    }

    /**
     * Verify TOTP code and enable MFA for the user.
     * Note: Full TOTP verification requires a library like GoogleAuth or Aerogear OTP.
     * Current implementation stores the intent; actual TOTP verification to be added.
     */
    @Override
    public void verifyAndEnableMfa(UUID userId, MfaVerifyRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getMfaSecret() == null) {
            throw new IllegalStateException("MFA setup not initiated. Call setupMfa first.");
        }

        // TOTP verification would use a library like:
        // GoogleAuthenticator gAuth = new GoogleAuthenticator();
        // boolean isValid = gAuth.authorize(user.getMfaSecret(), Integer.parseInt(request.code()));
        //
        // For now, we verify the code format and enable MFA
        if (request.code() == null || !request.code().matches("^\\d{6}$")) {
            throw new IllegalArgumentException("Invalid TOTP code format. Must be 6 digits.");
        }

        // Store hashed backup codes
        List<String> backupCodes = generateBackupCodes();
        List<String> hashedBackupCodes = backupCodes.stream()
                .map(passwordEncoder::encode)
                .toList();

        user.setMfaEnabled(true);
        user.setMfaBackupCodes(hashedBackupCodes);
        userRepository.save(user);

        log.info("MFA enabled for user: {}", userId);

        // Audit log
        logEvent(AuditLog.builder()
                .tenantId(user.getTenantId())
                .eventType(AuditLog.EventType.SECURITY_SETTING_CHANGE)
                .eventCategory(AuditLog.EventCategory.SECURITY)
                .eventAction("MFA_ENABLED")
                .resource("USER", userId.toString(), user.getUsername())
                .user(userId, user.getUsername(), user.getEmail())
                .success(true));
    }

    @Override
    public void disableMfa(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setMfaEnabled(false);
        user.setMfaSecret(null);
        user.setMfaBackupCodes(null);
        userRepository.save(user);
    }

    // ==================== Password Reset ====================

    @Override
    public PasswordResetResponse forgotPassword(ForgotPasswordRequest request) {
        log.info("Password reset requested for email: {}", maskEmail(request.email()));

        // Always return success to prevent user enumeration
        String successMessage = "If an account exists with this email, a password reset link will be sent.";

        Optional<User> userOpt = userRepository.findByEmail(request.email());
        if (userOpt.isEmpty()) {
            log.warn("Password reset requested for non-existent email: {}", maskEmail(request.email()));
            return new PasswordResetResponse(successMessage);
        }

        User user = userOpt.get();

        // Check for rate limiting - prevent abuse
        if (passwordResetTokenRepository.hasRecentToken(
                user.getId(),
                LocalDateTime.now(),
                LocalDateTime.now().minusMinutes(5))) {
            log.warn("Rate limiting password reset for user: {}", user.getId());
            return new PasswordResetResponse(successMessage);
        }

        // Invalidate any existing tokens
        passwordResetTokenRepository.invalidateAllForUser(user.getId(), LocalDateTime.now());

        // Generate new token
        String rawToken = generateRandomSecret();
        String tokenHash = passwordEncoder.encode(rawToken);

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUserId(user.getId());
        resetToken.setTokenHash(tokenHash);
        resetToken.setExpiresAt(LocalDateTime.now().plusHours(passwordResetExpiryHours));
        passwordResetTokenRepository.save(resetToken);

        // Send password reset email via notification service
        // Token is NEVER logged for security reasons
        log.debug("Password reset token generated for user: {}", user.getId());

        // TODO: Integrate with notification service to send email containing rawToken

        // Audit log
        logEvent(AuditLog.builder()
                .tenantId(user.getTenantId())
                .eventType(AuditLog.EventType.PASSWORD_RESET)
                .eventCategory(AuditLog.EventCategory.AUTHENTICATION)
                .eventAction("PASSWORD_RESET_REQUESTED")
                .resource("USER", user.getId().toString(), user.getUsername())
                .user(user.getId(), user.getUsername(), user.getEmail())
                .success(true));

        return new PasswordResetResponse(successMessage);
    }

    @Override
    @Transactional(readOnly = true)
    public ValidateTokenResponse validateResetToken(String token) {
        if (token == null || token.isBlank()) {
            return new ValidateTokenResponse(false, null);
        }

        // Query only valid tokens from database (not findAll())
        List<PasswordResetToken> validTokens = passwordResetTokenRepository
                .findAllValidTokens(LocalDateTime.now());

        for (PasswordResetToken resetToken : validTokens) {
            if (passwordEncoder.matches(token, resetToken.getTokenHash())) {
                User user = userRepository.findById(resetToken.getUserId()).orElse(null);
                if (user != null) {
                    return new ValidateTokenResponse(true, user.getEmail());
                }
            }
        }

        return new ValidateTokenResponse(false, null);
    }

    @Override
    public PasswordResetResponse resetPasswordWithToken(PasswordResetRequest request) {
        log.info("Attempting password reset with token");

        // Validate passwords match
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        // Validate password complexity
        validatePasswordComplexity(request.newPassword());

        // Find and validate token using optimized query
        PasswordResetToken resetToken = null;
        List<PasswordResetToken> validTokens = passwordResetTokenRepository
                .findAllValidTokens(LocalDateTime.now());

        for (PasswordResetToken t : validTokens) {
            if (passwordEncoder.matches(request.token(), t.getTokenHash())) {
                resetToken = t;
                break;
            }
        }

        if (resetToken == null) {
            log.warn("Invalid or expired password reset token");
            throw new IllegalArgumentException("Invalid or expired reset link. Please request a new one.");
        }

        // Get user and update password
        User user = userRepository.findById(resetToken.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Check password history (prevent reuse)
        String newPasswordHash = passwordEncoder.encode(request.newPassword());
        if (user.getPasswordHistory() != null) {
            for (String oldHash : user.getPasswordHistory()) {
                if (passwordEncoder.matches(request.newPassword(), oldHash)) {
                    throw new IllegalArgumentException("Cannot reuse a recent password. Please choose a different password.");
                }
            }
        }

        // Update password
        user.changePassword(newPasswordHash, 90, 5);
        user.setMustChangePassword(false);
        userRepository.save(user);

        // Mark token as used
        resetToken.markAsUsed();
        passwordResetTokenRepository.save(resetToken);

        // Invalidate all sessions for security
        userSessionRepository.revokeAllSessions(user.getId(), LocalDateTime.now(), "Password reset");

        // Audit log
        logEvent(AuditLog.builder()
                .tenantId(user.getTenantId())
                .eventType(AuditLog.EventType.PASSWORD_CHANGE)
                .eventCategory(AuditLog.EventCategory.AUTHENTICATION)
                .eventAction("PASSWORD_RESET_COMPLETED")
                .resource("USER", user.getId().toString(), user.getUsername())
                .user(user.getId(), user.getUsername(), user.getEmail())
                .success(true));

        log.info("Password reset successful for user: {}", user.getId());
        return new PasswordResetResponse("Password has been reset successfully. You can now log in with your new password.");
    }

    private void validatePasswordComplexity(String password) {
        if (password.length() < 12) {
            throw new IllegalArgumentException("Password must be at least 12 characters");
        }
        if (!password.matches(".*[A-Z].*")) {
            throw new IllegalArgumentException("Password must contain at least one uppercase letter");
        }
        if (!password.matches(".*[a-z].*")) {
            throw new IllegalArgumentException("Password must contain at least one lowercase letter");
        }
        if (!password.matches(".*\\d.*")) {
            throw new IllegalArgumentException("Password must contain at least one number");
        }
        if (!password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?].*")) {
            throw new IllegalArgumentException("Password must contain at least one special character");
        }

        // Check common passwords - expanded list based on security research
        if (COMMON_PASSWORDS.contains(password.toLowerCase())) {
            throw new IllegalArgumentException("Password is too common. Please choose a stronger password.");
        }

        // Check for sequential characters (e.g., "abcd", "1234")
        if (containsSequentialChars(password)) {
            throw new IllegalArgumentException("Password cannot contain sequential characters.");
        }

        // Check for repeated characters (e.g., "aaaa")
        if (containsRepeatedChars(password, 3)) {
            throw new IllegalArgumentException("Password cannot contain more than 3 repeated characters.");
        }
    }

    /**
     * Common passwords list (top 100+ from security breaches).
     * Prevents users from using easily guessable passwords.
     */
    private static final Set<String> COMMON_PASSWORDS = Set.of(
            // Top passwords from breaches
            "password", "123456", "12345678", "qwerty", "abc123", "monkey", "1234567",
            "letmein", "trustno1", "dragon", "baseball", "iloveyou", "master", "sunshine",
            "ashley", "bailey", "shadow", "passw0rd", "123456789", "654321", "superman",
            "qazwsx", "michael", "football", "password1", "password123", "welcome",
            "admin", "login", "starwars", "121212", "hello", "charlie", "donald",
            "password1234", "qwerty123", "admin123", "root", "toor", "pass", "test",
            "guest", "master123", "changeme", "123qwe", "zaq12wsx", "1q2w3e4r",
            "1qaz2wsx", "qwerty12", "qwerty1", "1234qwer", "q1w2e3r4", "123abc",

            // Keyboard patterns
            "qwertyuiop", "asdfghjkl", "zxcvbnm", "1qazxsw2", "zaq1xsw2",

            // Company/context specific
            "surework", "surework123", "company", "company123", "letmein123",

            // South African context
            "proudlysa", "mzansi", "bokke", "springbok", "amabhokobhoko",

            // Common substitutions
            "p@ssword", "p@ssw0rd", "passw0rd!", "password!", "admin@123",

            // Year-based (people often add current year)
            "password2024", "password2025", "password2026", "welcome2024", "welcome2025"
    );

    private boolean containsSequentialChars(String password) {
        String lower = password.toLowerCase();
        for (int i = 0; i < lower.length() - 3; i++) {
            char c1 = lower.charAt(i);
            char c2 = lower.charAt(i + 1);
            char c3 = lower.charAt(i + 2);
            char c4 = lower.charAt(i + 3);

            // Check for ascending sequence (e.g., abcd, 1234)
            if (c2 == c1 + 1 && c3 == c2 + 1 && c4 == c3 + 1) {
                return true;
            }
            // Check for descending sequence (e.g., dcba, 4321)
            if (c2 == c1 - 1 && c3 == c2 - 1 && c4 == c3 - 1) {
                return true;
            }
        }
        return false;
    }

    private boolean containsRepeatedChars(String password, int maxRepeats) {
        int count = 1;
        for (int i = 1; i < password.length(); i++) {
            if (password.charAt(i) == password.charAt(i - 1)) {
                count++;
                if (count > maxRepeats) {
                    return true;
                }
            } else {
                count = 1;
            }
        }
        return false;
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        int atIndex = email.indexOf("@");
        if (atIndex <= 2) return "***" + email.substring(atIndex);
        return email.substring(0, 2) + "***" + email.substring(atIndex);
    }

    // ==================== Session Management ====================

    @Override
    @Transactional(readOnly = true)
    public List<ActiveSessionResponse> getActiveSessions(UUID userId, String currentTokenHash) {
        List<UserSession> sessions = userSessionRepository.findActiveSessionsByUserId(
                userId, LocalDateTime.now());

        return sessions.stream()
                .map(session -> mapToActiveSessionResponse(session, currentTokenHash))
                .toList();
    }

    @Override
    public void revokeSession(UUID userId, UUID sessionId) {
        log.info("Revoking session {} for user {}", sessionId, userId);

        int updated = userSessionRepository.revokeSession(
                sessionId, userId, LocalDateTime.now(), "User requested revocation");

        if (updated == 0) {
            throw new IllegalArgumentException("Session not found or already revoked");
        }

        // Audit log
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            logEvent(AuditLog.builder()
                    .tenantId(user.getTenantId())
                    .eventType(AuditLog.EventType.LOGOUT)
                    .eventCategory(AuditLog.EventCategory.AUTHENTICATION)
                    .eventAction("SESSION_REVOKED")
                    .resource("SESSION", sessionId.toString(), null)
                    .user(userId, user.getUsername(), user.getEmail())
                    .success(true));
        }

        log.info("Session {} revoked successfully", sessionId);
    }

    @Override
    public void revokeAllOtherSessions(UUID userId, String currentTokenHash) {
        log.info("Revoking all other sessions for user {}", userId);

        // Find current session by token hash
        UserSession currentSession = null;
        if (currentTokenHash != null) {
            currentSession = userSessionRepository.findByTokenHash(currentTokenHash).orElse(null);
        }

        int revokedCount;
        if (currentSession != null) {
            revokedCount = userSessionRepository.revokeAllOtherSessions(
                    userId, currentSession.getId(), LocalDateTime.now(), "User requested revocation of all other sessions");
        } else {
            revokedCount = userSessionRepository.revokeAllSessions(
                    userId, LocalDateTime.now(), "User requested revocation of all sessions");
        }

        // Audit log
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            logEvent(AuditLog.builder()
                    .tenantId(user.getTenantId())
                    .eventType(AuditLog.EventType.LOGOUT)
                    .eventCategory(AuditLog.EventCategory.AUTHENTICATION)
                    .eventAction("ALL_OTHER_SESSIONS_REVOKED")
                    .resource("USER", userId.toString(), user.getUsername())
                    .user(userId, user.getUsername(), user.getEmail())
                    .changes(null, null, "Revoked " + revokedCount + " sessions")
                    .success(true));
        }

        log.info("Revoked {} sessions for user {}", revokedCount, userId);
    }

    private ActiveSessionResponse mapToActiveSessionResponse(UserSession session, String currentTokenHash) {
        boolean isCurrent = currentTokenHash != null &&
                passwordEncoder.matches(currentTokenHash, session.getTokenHash());

        return new ActiveSessionResponse(
                session.getId(),
                session.getDeviceName(),
                session.getDeviceType(),
                session.getBrowser(),
                session.getIpAddress(),
                session.getLocation(),
                session.getLastActivityAt(),
                session.getCreatedAt(),
                isCurrent
        );
    }

    // ==================== API Key Management ====================

    /**
     * Creates an API key for programmatic access.
     *
     * <p><strong>Note:</strong> API key storage is not yet implemented.
     * This method generates a key but does not persist it.
     * Full implementation requires an ApiKey entity and repository.
     *
     * @throws UnsupportedOperationException until API key persistence is implemented
     */
    @Override
    public ApiKeyCreatedResponse createApiKey(UUID tenantId, CreateApiKeyRequest request, UUID createdBy) {
        log.warn("API key creation requested but storage not implemented. Tenant: {}", tenantId);

        // Generate the key (prefix sk_ indicates a secret key)
        String apiKey = "sk_" + generateRandomSecret();

        // For now, return the key but warn that it won't be persisted
        // In production, this should store the hashed key and metadata
        UUID keyId = UUID.randomUUID();

        log.info("API key generated (not persisted) for tenant: {}, name: {}", tenantId, request.name());

        return new ApiKeyCreatedResponse(keyId, apiKey, request.name(), request.expiresAt());
    }

    /**
     * Lists API keys for a tenant.
     *
     * <p><strong>Note:</strong> Returns empty list until API key persistence is implemented.
     */
    @Override
    @Transactional(readOnly = true)
    public List<ApiKeyResponse> listApiKeys(UUID tenantId) {
        log.debug("List API keys requested for tenant: {} (not implemented)", tenantId);
        // Return empty list - API key repository not yet implemented
        return List.of();
    }

    /**
     * Revokes an API key.
     *
     * <p><strong>Note:</strong> No-op until API key persistence is implemented.
     */
    @Override
    public void revokeApiKey(UUID apiKeyId, UUID revokedBy) {
        log.warn("API key revocation requested but storage not implemented. KeyId: {}", apiKeyId);
        // No-op - API key repository not yet implemented
    }

    // ==================== Audit Logging ====================

    @Override
    public void logEvent(AuditLog.Builder logBuilder) {
        AuditLog auditLog = logBuilder.build();
        auditLogRepository.save(auditLog);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> searchAuditLogs(UUID tenantId, AuditLogSearchRequest request, Pageable pageable) {
        Page<AuditLog> logs = auditLogRepository.findByTenantId(tenantId, pageable);
        return logs.map(this::mapToAuditLogResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getUserAuditLogs(UUID userId, Pageable pageable) {
        Page<AuditLog> logs = auditLogRepository.findByUserId(userId, pageable);
        return logs.map(this::mapToAuditLogResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getResourceAuditLogs(String resourceType, String resourceId, Pageable pageable) {
        Page<AuditLog> logs = auditLogRepository.findByResourceTypeAndResourceId(resourceType, resourceId, pageable);
        return logs.map(this::mapToAuditLogResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public AuditStats getAuditStats(UUID tenantId, LocalDateTime from, LocalDateTime to) {
        long total = auditLogRepository.countByTenantIdAndTimestampBetween(tenantId, from, to);
        return new AuditStats(total, total, 0, Map.of(), Map.of(), from, to);
    }

    // ==================== System Configuration ====================

    @Override
    @Transactional(readOnly = true)
    public List<SystemConfigResponse> getSystemConfig(UUID tenantId) {
        return List.of();
    }

    @Override
    public SystemConfigResponse updateConfig(UUID tenantId, String key, UpdateConfigRequest request, UUID updatedBy) {
        return new SystemConfigResponse(key, request.value(), "STRING", "", false);
    }

    // ==================== Dashboard ====================

    @Override
    @Transactional(readOnly = true)
    public AdminDashboard getAdminDashboard() {
        return new AdminDashboard(
                getTenantStats(),
                new UserStats(0, 0, 0, 0, 0, 0),
                new AuditStats(0, 0, 0, Map.of(), Map.of(), LocalDateTime.now().minusDays(30), LocalDateTime.now()),
                new SystemHealth("UP", 0.5, 0.6, 0.3, Map.of()),
                List.of()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public TenantStats getTenantStats() {
        long total = tenantRepository.count();
        long active = tenantRepository.countByStatus(Tenant.TenantStatus.ACTIVE);
        long pending = tenantRepository.countByStatus(Tenant.TenantStatus.PENDING);
        long suspended = tenantRepository.countByStatus(Tenant.TenantStatus.SUSPENDED);
        return new TenantStats((int) total, (int) active, (int) pending, (int) suspended, Map.of());
    }

    @Override
    @Transactional(readOnly = true)
    public UserStats getUserStats(UUID tenantId) {
        long total = userRepository.countByTenantId(tenantId);
        return new UserStats((int) total, 0, 0, 0, 0, 0);
    }

    // ==================== Helper Methods ====================

    private String generateAccessToken(User user) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));

        List<String> roles = user.getRoles() != null ?
                user.getRoles().stream().map(Role::getCode).toList() : List.of();

        var builder = Jwts.builder()
                .subject(user.getId().toString())
                .claim("username", user.getUsername())
                .claim("tenantId", user.getTenantId().toString())
                .claim("roles", roles);

        // Include employeeId if the user is linked to an employee
        if (user.getEmployeeId() != null) {
            builder.claim("employeeId", user.getEmployeeId().toString());
        }

        return builder
                .issuedAt(Date.from(Instant.now()))
                .expiration(Date.from(Instant.now().plus(jwtExpirationHours, ChronoUnit.HOURS)))
                .signWith(key)
                .compact();
    }

    private String generateRefreshToken(User user) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("type", "refresh")
                .issuedAt(Date.from(Instant.now()))
                .expiration(Date.from(Instant.now().plus(refreshExpirationDays, ChronoUnit.DAYS)))
                .signWith(key)
                .compact();
    }

    private String generateRandomSecret() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private List<String> generateBackupCodes() {
        List<String> codes = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            byte[] bytes = new byte[4];
            SECURE_RANDOM.nextBytes(bytes);
            codes.add(String.format("%08x", java.nio.ByteBuffer.wrap(bytes).getInt()));
        }
        return codes;
    }

    private Address mapToAddress(AddressDto dto) {
        Address address = new Address();
        address.setLine1(dto.line1());
        address.setLine2(dto.line2());
        address.setCity(dto.city());
        address.setProvince(dto.province());
        address.setPostalCode(dto.postalCode());
        address.setCountry(dto.country() != null ? dto.country() : "South Africa");
        return address;
    }

    private TenantResponse mapToTenantResponse(Tenant tenant) {
        return new TenantResponse(
                tenant.getId(),
                tenant.getCode(),
                tenant.getName(),
                tenant.getTradingName(),
                tenant.getRegistrationNumber(),
                tenant.getTaxNumber(),
                tenant.getCompanyType(),
                tenant.getIndustrySector(),
                tenant.getPhysicalAddress() != null ? mapToAddressDto(tenant.getPhysicalAddress()) : null,
                tenant.getPhoneNumber(),
                tenant.getEmail(),
                tenant.getWebsite(),
                tenant.getSubscriptionTier(),
                tenant.getMaxUsers(),
                tenant.getSubscriptionStart(),
                tenant.getSubscriptionEnd(),
                tenant.getStatus(),
                tenant.getTimezone(),
                tenant.getCurrencyCode(),
                tenant.getCreatedAt(),
                tenant.getActivatedAt()
        );
    }

    private TenantListItem mapToTenantListItem(Tenant tenant) {
        return new TenantListItem(
                tenant.getId(),
                tenant.getCode(),
                tenant.getName(),
                tenant.getStatus(),
                tenant.getSubscriptionTier(),
                0,
                tenant.getCreatedAt()
        );
    }

    private AddressDto mapToAddressDto(Address address) {
        return new AddressDto(
                address.getLine1(),
                address.getLine2(),
                address.getCity(),
                address.getProvince(),
                address.getPostalCode(),
                address.getCountry()
        );
    }

    private UserResponse mapToUserResponse(User user) {
        List<RoleResponse> roles = user.getRoles() != null ?
                user.getRoles().stream().map(this::mapToRoleResponse).toList() : List.of();

        return new UserResponse(
                user.getId(),
                user.getTenantId(),
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getDisplayName(),
                user.getPhoneNumber(),
                user.getMobileNumber(),
                user.getAvatarUrl(),
                user.getEmployeeId(),
                roles,
                user.getStatus(),
                user.isEmailVerified(),
                user.isMfaEnabled(),
                user.getLastLoginAt(),
                user.getTimezone(),
                user.getLanguage(),
                user.getCreatedAt()
        );
    }

    private UserListItem mapToUserListItem(User user) {
        List<String> roleNames = user.getRoles() != null ?
                user.getRoles().stream().map(Role::getName).toList() : List.of();

        return new UserListItem(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFirstName() + " " + user.getLastName(),
                user.getStatus(),
                roleNames,
                user.getLastLoginAt()
        );
    }

    private RoleResponse mapToRoleResponse(Role role) {
        // Map permissions - include inherited permissions from parent roles
        // Use try-catch to handle lazy loading gracefully when permissions aren't fetched
        List<PermissionResponse> permissions;
        try {
            permissions = role.getAllPermissions() != null
                    ? role.getAllPermissions().stream()
                            .map(this::mapToPermissionResponse)
                            .toList()
                    : List.of();
        } catch (Exception e) {
            // Permissions not loaded (lazy loading exception) - return empty list
            log.debug("Permissions not loaded for role {}: {}", role.getCode(), e.getMessage());
            permissions = List.of();
        }

        // Get parent role name from the already-fetched parent role (no additional query)
        // Use try-catch to handle lazy loading gracefully
        String parentRoleName = null;
        try {
            parentRoleName = role.getParentRole() != null ? role.getParentRole().getName() : null;
        } catch (Exception e) {
            log.debug("Parent role not loaded for role {}: {}", role.getCode(), e.getMessage());
        }

        return new RoleResponse(
                role.getId(),
                role.getCode(),
                role.getName(),
                role.getDescription(),
                role.getParentRoleId(),
                parentRoleName,
                permissions,
                role.isActive(),
                role.isSystemRole(),
                role.isDefaultRole(),
                role.getCreatedAt()
        );
    }

    private PermissionResponse mapToPermissionResponse(Permission permission) {
        return new PermissionResponse(
                permission.getId(),
                permission.getCode(),
                permission.getName(),
                permission.getDescription(),
                permission.getCategory(),
                permission.getResource(),
                permission.getAction()
        );
    }

    private AuditLogResponse mapToAuditLogResponse(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getEventType(),
                log.getEventCategory(),
                log.getEventAction(),
                log.getResourceType(),
                log.getResourceId(),
                log.getResourceName(),
                log.getUserId(),
                log.getUsername(),
                log.getActorType(),
                log.getIpAddress(),
                log.getRequestMethod(),
                log.getRequestPath(),
                log.isSuccess(),
                log.getErrorMessage(),
                log.getTimestamp(),
                log.getDurationMs()
        );
    }
}
