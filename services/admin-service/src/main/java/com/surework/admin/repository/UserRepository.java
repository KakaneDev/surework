package com.surework.admin.repository;

import com.surework.admin.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByUsernameOrEmail(String username, String email);

    /**
     * Find user by username or email with roles eagerly fetched.
     * Use this method for login to ensure roles are available for JWT generation.
     */
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.roles WHERE u.username = :username OR u.email = :email")
    Optional<User> findByUsernameOrEmailWithRoles(@Param("username") String username, @Param("email") String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    List<User> findByTenantId(UUID tenantId);

    Page<User> findByTenantId(UUID tenantId, Pageable pageable);

    List<User> findByTenantIdAndStatus(UUID tenantId, User.UserStatus status);

    Page<User> findByTenantIdAndStatus(UUID tenantId, User.UserStatus status, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId " +
           "AND (:status IS NULL OR u.status = :status) " +
           "AND (:searchTerm IS NULL OR " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<User> searchUsers(@Param("tenantId") UUID tenantId,
                           @Param("status") User.UserStatus status,
                           @Param("searchTerm") String searchTerm,
                           Pageable pageable);

    Optional<User> findByEmployeeId(UUID employeeId);

    // Count users by tenant
    long countByTenantId(UUID tenantId);

    long countByTenantIdAndStatus(UUID tenantId, User.UserStatus status);

    // Find locked users
    @Query("SELECT u FROM User u WHERE u.status = 'LOCKED' AND u.lockedUntil < :now")
    List<User> findUsersWithExpiredLock(@Param("now") LocalDateTime now);

    // Find users with expiring passwords
    @Query("SELECT u FROM User u WHERE u.status = 'ACTIVE' " +
           "AND u.passwordExpiresAt IS NOT NULL " +
           "AND u.passwordExpiresAt <= :expiryDate")
    List<User> findUsersWithExpiringPassword(@Param("expiryDate") LocalDateTime expiryDate);

    // Find inactive users
    @Query("SELECT u FROM User u WHERE u.status = 'ACTIVE' " +
           "AND u.lastLoginAt IS NOT NULL " +
           "AND u.lastLoginAt < :inactiveDate")
    List<User> findInactiveUsers(@Param("inactiveDate") LocalDateTime inactiveDate);

    // Users with role
    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.code = :roleCode AND u.tenantId = :tenantId")
    List<User> findByTenantIdAndRoleCode(@Param("tenantId") UUID tenantId, @Param("roleCode") String roleCode);

    // Unlock expired locks
    @Modifying
    @Query("UPDATE User u SET u.status = 'ACTIVE', u.lockedUntil = NULL, u.failedLoginAttempts = 0 " +
           "WHERE u.status = 'LOCKED' AND u.lockedUntil < :now")
    int unlockExpiredUsers(@Param("now") LocalDateTime now);
}
