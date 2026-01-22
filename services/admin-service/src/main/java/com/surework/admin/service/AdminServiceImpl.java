package com.surework.admin.service;

import com.surework.admin.domain.*;
import com.surework.admin.dto.AdminDto.*;
import com.surework.admin.repository.*;
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
    private final PasswordEncoder passwordEncoder;

    @Value("${surework.admin.jwt.secret}")
    private String jwtSecret;

    @Value("${surework.admin.jwt.expiration-minutes:60}")
    private int jwtExpirationMinutes;

    @Value("${surework.admin.jwt.refresh-expiration-days:7}")
    private int refreshExpirationDays;

    public AdminServiceImpl(
            TenantRepository tenantRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            AuditLogRepository auditLogRepository,
            PasswordEncoder passwordEncoder) {
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.auditLogRepository = auditLogRepository;
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
        Page<User> users = userRepository.findByTenantId(tenantId, pageable);
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
        return roleRepository.findByTenantIdOrSystemRoleTrue(tenantId).stream()
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

    @Override
    @Transactional(readOnly = true)
    public List<PermissionResponse> listPermissions() {
        // TODO: Implement permission repository
        return List.of();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PermissionGroup> listPermissionsByCategory() {
        // TODO: Implement permission grouping
        return List.of();
    }

    // ==================== Authentication ====================

    @Override
    public LoginResponse login(LoginRequest request, String ipAddress, String userAgent) {
        log.info("Login attempt for user: {}", request.username());

        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (user.getStatus() == User.UserStatus.LOCKED) {
            if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now())) {
                throw new IllegalArgumentException("Account is locked");
            }
            // Auto-unlock if lockout period has passed
            user.setStatus(User.UserStatus.ACTIVE);
            user.setLockedUntil(null);
            user.setFailedLoginAttempts(0);
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
            if (user.getFailedLoginAttempts() >= 5) {
                user.setStatus(User.UserStatus.LOCKED);
                user.setLockedUntil(LocalDateTime.now().plusMinutes(30));
            }
            userRepository.save(user);
            throw new IllegalArgumentException("Invalid credentials");
        }

        // Check MFA if enabled
        if (user.isMfaEnabled()) {
            if (request.mfaCode() == null || request.mfaCode().isBlank()) {
                return new LoginResponse(null, null, "Bearer", 0, null, true);
            }
            // TODO: Verify MFA code
        }

        // Generate tokens
        String accessToken = generateAccessToken(user);
        String refreshToken = generateRefreshToken(user);

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
                jwtExpirationMinutes * 60,
                mapToUserResponse(user),
                false
        );
    }

    @Override
    public LoginResponse refreshToken(RefreshTokenRequest request) {
        // TODO: Implement token refresh
        throw new UnsupportedOperationException("Not implemented");
    }

    @Override
    public void logout(UUID userId, String token) {
        // TODO: Implement token blacklisting
        log.info("User logged out: {}", userId);
    }

    @Override
    public void logoutAllSessions(UUID userId) {
        // TODO: Implement session invalidation
        log.info("All sessions logged out for user: {}", userId);
    }

    @Override
    public MfaSetupResponse setupMfa(UUID userId) {
        // TODO: Implement TOTP setup
        String secret = generateRandomSecret();
        List<String> backupCodes = generateBackupCodes();
        return new MfaSetupResponse(secret, "otpauth://totp/SureWork?secret=" + secret, backupCodes);
    }

    @Override
    public void verifyAndEnableMfa(UUID userId, MfaVerifyRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        // TODO: Verify TOTP code
        user.setMfaEnabled(true);
        userRepository.save(user);
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

    // ==================== API Key Management ====================

    @Override
    public ApiKeyCreatedResponse createApiKey(UUID tenantId, CreateApiKeyRequest request, UUID createdBy) {
        String apiKey = "sk_" + generateRandomSecret();
        // TODO: Store API key
        return new ApiKeyCreatedResponse(UUID.randomUUID(), apiKey, request.name(), request.expiresAt());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ApiKeyResponse> listApiKeys(UUID tenantId) {
        return List.of();
    }

    @Override
    public void revokeApiKey(UUID apiKeyId, UUID revokedBy) {
        // TODO: Implement API key revocation
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

        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("username", user.getUsername())
                .claim("tenantId", user.getTenantId().toString())
                .claim("roles", roles)
                .issuedAt(Date.from(Instant.now()))
                .expiration(Date.from(Instant.now().plus(jwtExpirationMinutes, ChronoUnit.MINUTES)))
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
        return new RoleResponse(
                role.getId(),
                role.getCode(),
                role.getName(),
                role.getDescription(),
                role.getParentRoleId(),
                null,
                List.of(),
                role.isActive(),
                role.isSystemRole(),
                role.isDefaultRole(),
                role.getCreatedAt()
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
