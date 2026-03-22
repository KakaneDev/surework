package com.surework.admin.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.*;

/**
 * User entity for authentication and authorization.
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    // Profile
    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "display_name")
    private String displayName;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "mobile_number")
    private String mobileNumber;

    @Column(name = "avatar_url")
    private String avatarUrl;

    // Link to Employee (if applicable)
    @Column(name = "employee_id")
    private UUID employeeId;

    // Roles - LAZY fetch to prevent N+1 queries
    // Use explicit JOIN FETCH in repository when roles are needed
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

    // Status
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status = UserStatus.PENDING;

    @Column(name = "email_verified")
    private boolean emailVerified = false;

    @Column(name = "email_verified_at")
    private LocalDateTime emailVerifiedAt;

    @Column(name = "phone_verified")
    private boolean phoneVerified = false;

    // Authentication
    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "last_login_ip")
    private String lastLoginIp;

    @Column(name = "failed_login_attempts")
    private int failedLoginAttempts = 0;

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    @Column(name = "password_changed_at")
    private LocalDateTime passwordChangedAt;

    @Column(name = "password_expires_at")
    private LocalDateTime passwordExpiresAt;

    @Column(name = "must_change_password")
    private boolean mustChangePassword = false;

    // MFA
    @Column(name = "mfa_enabled")
    private boolean mfaEnabled = false;

    @Column(name = "mfa_secret")
    private String mfaSecret;

    @Column(name = "mfa_backup_codes", columnDefinition = "text[]")
    private List<String> mfaBackupCodes = new ArrayList<>();

    // Password History (for preventing reuse)
    @Column(name = "password_history", columnDefinition = "text[]")
    private List<String> passwordHistory = new ArrayList<>();

    // Preferences
    @Column(name = "timezone")
    private String timezone = "Africa/Johannesburg";

    @Column(name = "language")
    private String language = "en-ZA";

    @Column(name = "date_format")
    private String dateFormat = "dd/MM/yyyy";

    // Notification Preferences
    @Column(name = "notify_email")
    private boolean notifyEmail = true;

    @Column(name = "notify_sms")
    private boolean notifySms = false;

    @Column(name = "notify_push")
    private boolean notifyPush = true;

    // System flags
    @Column(name = "is_system_user")
    private boolean systemUser = false;

    @Column(name = "is_super_admin")
    private boolean superAdmin = false;

    // Audit
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by")
    private UUID updatedBy;

    @Column(name = "deactivated_at")
    private LocalDateTime deactivatedAt;

    @Column(name = "deactivated_by")
    private UUID deactivatedBy;

    // Enums
    public enum UserStatus {
        PENDING,        // Awaiting email verification
        ACTIVE,         // Normal active user
        INACTIVE,       // Temporarily disabled
        LOCKED,         // Locked due to failed attempts
        SUSPENDED,      // Administratively suspended
        TERMINATED      // Permanently deactivated
    }

    // Business Methods
    public void activate() {
        this.status = UserStatus.ACTIVE;
        this.updatedAt = LocalDateTime.now();
    }

    public void deactivate(UUID deactivatedBy) {
        this.status = UserStatus.INACTIVE;
        this.deactivatedAt = LocalDateTime.now();
        this.deactivatedBy = deactivatedBy;
        this.updatedAt = LocalDateTime.now();
    }

    public void suspend() {
        this.status = UserStatus.SUSPENDED;
        this.updatedAt = LocalDateTime.now();
    }

    public void lock(int lockoutMinutes) {
        this.status = UserStatus.LOCKED;
        this.lockedUntil = LocalDateTime.now().plusMinutes(lockoutMinutes);
        this.updatedAt = LocalDateTime.now();
    }

    public void unlock() {
        this.status = UserStatus.ACTIVE;
        this.lockedUntil = null;
        this.failedLoginAttempts = 0;
        this.updatedAt = LocalDateTime.now();
    }

    public void recordLoginSuccess(String ipAddress) {
        this.lastLoginAt = LocalDateTime.now();
        this.lastLoginIp = ipAddress;
        this.failedLoginAttempts = 0;
        if (this.status == UserStatus.LOCKED && isLockExpired()) {
            unlock();
        }
    }

    public void recordLoginFailure() {
        this.failedLoginAttempts++;
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isLockExpired() {
        return this.lockedUntil != null && LocalDateTime.now().isAfter(this.lockedUntil);
    }

    public boolean isPasswordExpired() {
        return this.passwordExpiresAt != null && LocalDateTime.now().isAfter(this.passwordExpiresAt);
    }

    public void changePassword(String newPasswordHash, int expiryDays, int historyCount) {
        // Add current password to history
        if (this.passwordHash != null) {
            this.passwordHistory.add(0, this.passwordHash);
            // Keep only the specified number of passwords
            while (this.passwordHistory.size() > historyCount) {
                this.passwordHistory.remove(this.passwordHistory.size() - 1);
            }
        }

        this.passwordHash = newPasswordHash;
        this.passwordChangedAt = LocalDateTime.now();
        this.passwordExpiresAt = expiryDays > 0 ? LocalDateTime.now().plusDays(expiryDays) : null;
        this.mustChangePassword = false;
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isPasswordInHistory(String passwordHash) {
        return this.passwordHistory.contains(passwordHash);
    }

    public void verifyEmail() {
        this.emailVerified = true;
        this.emailVerifiedAt = LocalDateTime.now();
        if (this.status == UserStatus.PENDING) {
            this.status = UserStatus.ACTIVE;
        }
        this.updatedAt = LocalDateTime.now();
    }

    public void enableMfa(String secret, List<String> backupCodes) {
        this.mfaEnabled = true;
        this.mfaSecret = secret;
        this.mfaBackupCodes = new ArrayList<>(backupCodes);
        this.updatedAt = LocalDateTime.now();
    }

    public void disableMfa() {
        this.mfaEnabled = false;
        this.mfaSecret = null;
        this.mfaBackupCodes = new ArrayList<>();
        this.updatedAt = LocalDateTime.now();
    }

    public boolean useBackupCode(String code) {
        if (this.mfaBackupCodes.remove(code)) {
            this.updatedAt = LocalDateTime.now();
            return true;
        }
        return false;
    }

    public void addRole(Role role) {
        this.roles.add(role);
        this.updatedAt = LocalDateTime.now();
    }

    public void removeRole(Role role) {
        this.roles.remove(role);
        this.updatedAt = LocalDateTime.now();
    }

    public boolean hasRole(String roleCode) {
        return this.roles.stream().anyMatch(r -> r.getCode().equals(roleCode));
    }

    public boolean hasPermission(String permission) {
        return this.roles.stream()
                .flatMap(r -> r.getPermissions().stream())
                .anyMatch(p -> p.getCode().equals(permission) || p.getCode().equals("ALL"));
    }

    public Set<String> getAllPermissions() {
        Set<String> permissions = new HashSet<>();
        for (Role role : roles) {
            for (Permission permission : role.getPermissions()) {
                permissions.add(permission.getCode());
            }
        }
        return permissions;
    }

    public String getFullName() {
        return firstName + " " + lastName;
    }

    public boolean canLogin() {
        return this.status == UserStatus.ACTIVE && !isPasswordExpired();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getMobileNumber() { return mobileNumber; }
    public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public UUID getEmployeeId() { return employeeId; }
    public void setEmployeeId(UUID employeeId) { this.employeeId = employeeId; }

    public Set<Role> getRoles() { return roles; }
    public void setRoles(Set<Role> roles) { this.roles = roles; }

    public UserStatus getStatus() { return status; }
    public void setStatus(UserStatus status) { this.status = status; }

    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }

    public LocalDateTime getEmailVerifiedAt() { return emailVerifiedAt; }
    public void setEmailVerifiedAt(LocalDateTime emailVerifiedAt) { this.emailVerifiedAt = emailVerifiedAt; }

    public boolean isPhoneVerified() { return phoneVerified; }
    public void setPhoneVerified(boolean phoneVerified) { this.phoneVerified = phoneVerified; }

    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(LocalDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }

    public String getLastLoginIp() { return lastLoginIp; }
    public void setLastLoginIp(String lastLoginIp) { this.lastLoginIp = lastLoginIp; }

    public int getFailedLoginAttempts() { return failedLoginAttempts; }
    public void setFailedLoginAttempts(int failedLoginAttempts) { this.failedLoginAttempts = failedLoginAttempts; }

    public LocalDateTime getLockedUntil() { return lockedUntil; }
    public void setLockedUntil(LocalDateTime lockedUntil) { this.lockedUntil = lockedUntil; }

    public LocalDateTime getPasswordChangedAt() { return passwordChangedAt; }
    public void setPasswordChangedAt(LocalDateTime passwordChangedAt) { this.passwordChangedAt = passwordChangedAt; }

    public LocalDateTime getPasswordExpiresAt() { return passwordExpiresAt; }
    public void setPasswordExpiresAt(LocalDateTime passwordExpiresAt) { this.passwordExpiresAt = passwordExpiresAt; }

    public boolean isMustChangePassword() { return mustChangePassword; }
    public void setMustChangePassword(boolean mustChangePassword) { this.mustChangePassword = mustChangePassword; }

    public boolean isMfaEnabled() { return mfaEnabled; }
    public void setMfaEnabled(boolean mfaEnabled) { this.mfaEnabled = mfaEnabled; }

    public String getMfaSecret() { return mfaSecret; }
    public void setMfaSecret(String mfaSecret) { this.mfaSecret = mfaSecret; }

    public List<String> getMfaBackupCodes() { return mfaBackupCodes; }
    public void setMfaBackupCodes(List<String> mfaBackupCodes) { this.mfaBackupCodes = mfaBackupCodes; }

    public List<String> getPasswordHistory() { return passwordHistory; }
    public void setPasswordHistory(List<String> passwordHistory) { this.passwordHistory = passwordHistory; }

    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getDateFormat() { return dateFormat; }
    public void setDateFormat(String dateFormat) { this.dateFormat = dateFormat; }

    public boolean isNotifyEmail() { return notifyEmail; }
    public void setNotifyEmail(boolean notifyEmail) { this.notifyEmail = notifyEmail; }

    public boolean isNotifySms() { return notifySms; }
    public void setNotifySms(boolean notifySms) { this.notifySms = notifySms; }

    public boolean isNotifyPush() { return notifyPush; }
    public void setNotifyPush(boolean notifyPush) { this.notifyPush = notifyPush; }

    public boolean isSystemUser() { return systemUser; }
    public void setSystemUser(boolean systemUser) { this.systemUser = systemUser; }

    public boolean isSuperAdmin() { return superAdmin; }
    public void setSuperAdmin(boolean superAdmin) { this.superAdmin = superAdmin; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public UUID getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(UUID updatedBy) { this.updatedBy = updatedBy; }

    public LocalDateTime getDeactivatedAt() { return deactivatedAt; }
    public void setDeactivatedAt(LocalDateTime deactivatedAt) { this.deactivatedAt = deactivatedAt; }

    public UUID getDeactivatedBy() { return deactivatedBy; }
    public void setDeactivatedBy(UUID deactivatedBy) { this.deactivatedBy = deactivatedBy; }
}
