package com.surework.accounting.repository;

import com.surework.accounting.domain.BankAccount;
import com.surework.accounting.domain.BankAccount.ConnectionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for BankAccount entities.
 */
@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, UUID> {

    /**
     * Find by Stitch account ID.
     */
    Optional<BankAccount> findByStitchAccountId(String stitchAccountId);

    /**
     * Find by ID and tenant ID for secure tenant-scoped access.
     */
    @Query("SELECT ba FROM BankAccount ba WHERE ba.id = :id AND ba.tenantId = :tenantId AND ba.deleted = false")
    Optional<BankAccount> findByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

    /**
     * Find by status and tenant ID.
     */
    @Query("SELECT ba FROM BankAccount ba WHERE ba.tenantId = :tenantId AND ba.status = :status AND ba.deleted = false " +
            "ORDER BY ba.lastSyncAt DESC NULLS LAST")
    List<BankAccount> findByTenantIdAndStatus(@Param("tenantId") UUID tenantId, @Param("status") ConnectionStatus status);

    /**
     * Check if Stitch account ID exists for tenant.
     */
    @Query("SELECT CASE WHEN COUNT(ba) > 0 THEN true ELSE false END FROM BankAccount ba " +
            "WHERE ba.tenantId = :tenantId AND ba.stitchAccountId = :stitchAccountId AND ba.deleted = false")
    boolean existsByTenantIdAndStitchAccountId(@Param("tenantId") UUID tenantId, @Param("stitchAccountId") String stitchAccountId);

    /**
     * Find all active bank accounts for a tenant.
     */
    @Query("SELECT ba FROM BankAccount ba WHERE ba.tenantId = :tenantId AND ba.deleted = false " +
            "ORDER BY ba.institutionName, ba.accountName")
    List<BankAccount> findByTenantId(@Param("tenantId") UUID tenantId);

    /**
     * Find by status.
     */
    @Query("SELECT ba FROM BankAccount ba WHERE ba.status = :status AND ba.deleted = false " +
            "ORDER BY ba.lastSyncAt DESC NULLS LAST")
    List<BankAccount> findByStatus(@Param("status") ConnectionStatus status);

    /**
     * Find accounts that need syncing.
     */
    @Query("SELECT ba FROM BankAccount ba WHERE ba.status = 'ACTIVE' AND ba.deleted = false " +
            "AND (ba.nextSyncAt IS NULL OR ba.nextSyncAt < :now) " +
            "ORDER BY ba.nextSyncAt ASC NULLS FIRST")
    List<BankAccount> findAccountsDueForSync(@Param("now") Instant now);

    /**
     * Find accounts by institution.
     */
    @Query("SELECT ba FROM BankAccount ba WHERE ba.institutionId = :institutionId AND ba.deleted = false " +
            "ORDER BY ba.accountName")
    List<BankAccount> findByInstitutionId(@Param("institutionId") String institutionId);

    /**
     * Find accounts linked to a GL account.
     */
    @Query("SELECT ba FROM BankAccount ba WHERE ba.glAccount.id = :glAccountId AND ba.deleted = false")
    List<BankAccount> findByGlAccountId(@Param("glAccountId") UUID glAccountId);

    /**
     * Find accounts requiring re-authentication.
     */
    @Query("SELECT ba FROM BankAccount ba WHERE ba.status = 'REAUTH_REQUIRED' AND ba.deleted = false " +
            "ORDER BY ba.updatedAt DESC")
    List<BankAccount> findAccountsRequiringReauth();

    /**
     * Find by Stitch user ID.
     */
    @Query("SELECT ba FROM BankAccount ba WHERE ba.stitchUserId = :stitchUserId AND ba.deleted = false " +
            "ORDER BY ba.institutionName, ba.accountName")
    List<BankAccount> findByStitchUserId(@Param("stitchUserId") String stitchUserId);

    /**
     * Count active accounts for a tenant.
     */
    @Query("SELECT COUNT(ba) FROM BankAccount ba WHERE ba.tenantId = :tenantId " +
            "AND ba.status = 'ACTIVE' AND ba.deleted = false")
    long countActiveByTenantId(@Param("tenantId") UUID tenantId);

    /**
     * Search bank accounts.
     */
    @Query("SELECT ba FROM BankAccount ba WHERE ba.deleted = false " +
            "AND (:tenantId IS NULL OR ba.tenantId = :tenantId) " +
            "AND (:searchTerm IS NULL OR LOWER(ba.accountName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "    OR LOWER(ba.institutionName) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "AND (:status IS NULL OR ba.status = :status) " +
            "ORDER BY ba.institutionName, ba.accountName")
    Page<BankAccount> search(
            @Param("tenantId") UUID tenantId,
            @Param("searchTerm") String searchTerm,
            @Param("status") ConnectionStatus status,
            Pageable pageable);

    /**
     * Check if Stitch account ID exists.
     */
    boolean existsByStitchAccountId(String stitchAccountId);

    /**
     * Get distinct institutions for tenant.
     */
    @Query("SELECT DISTINCT ba.institutionId, ba.institutionName, ba.institutionLogo " +
            "FROM BankAccount ba WHERE ba.tenantId = :tenantId AND ba.deleted = false " +
            "ORDER BY ba.institutionName")
    List<Object[]> findDistinctInstitutions(@Param("tenantId") UUID tenantId);
}
