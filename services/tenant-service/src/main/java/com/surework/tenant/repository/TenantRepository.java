package com.surework.tenant.repository;

import com.surework.tenant.domain.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Tenant entity.
 */
@Repository
public interface TenantRepository extends JpaRepository<Tenant, UUID> {

    Optional<Tenant> findByCode(String code);

    Optional<Tenant> findByDbSchema(String dbSchema);

    Optional<Tenant> findByName(String name);

    boolean existsByCode(String code);

    boolean existsByName(String name);

    boolean existsByRegistrationNumber(String registrationNumber);

    List<Tenant> findByStatus(Tenant.TenantStatus status);

    @Query("""
        SELECT t FROM Tenant t
        WHERE t.status = :status
        ORDER BY t.createdAt DESC
        """)
    List<Tenant> findActiveByStatus(@Param("status") Tenant.TenantStatus status);

    @Query("""
        SELECT COUNT(t) FROM Tenant t
        WHERE t.status = 'ACTIVE'
        """)
    long countActiveTenants();

    @Query("""
        SELECT t FROM Tenant t
        WHERE (:status IS NULL OR t.status = :status)
        AND (:searchTerm IS NULL OR :searchTerm = ''
             OR LOWER(CAST(t.name AS string)) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%'))
             OR LOWER(CAST(t.code AS string)) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%'))
             OR LOWER(COALESCE(CAST(t.tradingName AS string), '')) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%'))
             OR LOWER(COALESCE(CAST(t.email AS string), '')) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%'))
             OR LOWER(COALESCE(CAST(t.registrationNumber AS string), '')) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%')))
        ORDER BY t.createdAt DESC
        """)
    Page<Tenant> searchTenants(
            @Param("status") Tenant.TenantStatus status,
            @Param("searchTerm") String searchTerm,
            Pageable pageable);

    // === Trial Management Queries ===

    /**
     * Find all tenants in trial status.
     */
    @Query("""
        SELECT t FROM Tenant t
        WHERE t.status = 'TRIAL'
        ORDER BY t.subscriptionEnd ASC
        """)
    Page<Tenant> findTrialTenants(Pageable pageable);

    /**
     * Find trials expiring within a certain number of days.
     */
    @Query("""
        SELECT t FROM Tenant t
        WHERE t.status = 'TRIAL'
        AND t.subscriptionEnd <= :expiryDate
        ORDER BY t.subscriptionEnd ASC
        """)
    Page<Tenant> findExpiringTrials(@Param("expiryDate") LocalDate expiryDate, Pageable pageable);

    /**
     * Count tenants by status.
     */
    @Query("SELECT COUNT(t) FROM Tenant t WHERE t.status = :status")
    long countByStatus(@Param("status") Tenant.TenantStatus status);

    /**
     * Count tenants created after a certain date.
     */
    @Query("SELECT COUNT(t) FROM Tenant t WHERE t.createdAt >= :since")
    long countCreatedSince(@Param("since") Instant since);

    /**
     * Count expired trials (past subscription end date but not converted).
     */
    @Query("""
        SELECT COUNT(t) FROM Tenant t
        WHERE t.status = 'TRIAL'
        AND t.subscriptionEnd < :today
        """)
    long countExpiredTrials(@Param("today") LocalDate today);

    /**
     * Count converted trials (went from TRIAL to ACTIVE with paid tier).
     */
    @Query("""
        SELECT COUNT(t) FROM Tenant t
        WHERE t.status = 'ACTIVE'
        AND t.subscriptionTier != 'FREE'
        """)
    long countConvertedTrials();

    // === Stuck Onboarding Queries ===

    /**
     * Find tenants in PENDING or TRIAL status (for stuck onboarding analysis).
     */
    @Query("""
        SELECT t FROM Tenant t
        WHERE t.status IN ('PENDING', 'TRIAL')
        ORDER BY t.createdAt ASC
        """)
    List<Tenant> findOnboardingTenants();

    /**
     * Find new tenants created within a date range.
     */
    @Query("""
        SELECT t FROM Tenant t
        WHERE t.createdAt >= :startDate
        AND t.createdAt < :endDate
        ORDER BY t.createdAt DESC
        """)
    List<Tenant> findCreatedBetween(
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate);
}
