package com.surework.admin.repository;

import com.surework.admin.domain.Tenant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, UUID> {

    Optional<Tenant> findByCode(String code);

    Optional<Tenant> findByDbSchema(String dbSchema);

    boolean existsByCode(String code);

    boolean existsByDbSchema(String dbSchema);

    List<Tenant> findByStatus(Tenant.TenantStatus status);

    Page<Tenant> findByStatus(Tenant.TenantStatus status, Pageable pageable);

    @Query("SELECT t FROM Tenant t WHERE t.status = :status AND " +
           "(:searchTerm IS NULL OR LOWER(t.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(t.code) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<Tenant> searchTenants(@Param("status") Tenant.TenantStatus status,
                               @Param("searchTerm") String searchTerm,
                               Pageable pageable);

    // Find tenants with expiring subscriptions
    @Query("SELECT t FROM Tenant t WHERE t.status = 'ACTIVE' " +
           "AND t.subscriptionEnd IS NOT NULL " +
           "AND t.subscriptionEnd <= :expiryDate")
    List<Tenant> findTenantsWithExpiringSubscription(@Param("expiryDate") LocalDate expiryDate);

    // Find tenants by subscription tier
    List<Tenant> findBySubscriptionTier(Tenant.SubscriptionTier tier);

    // Count tenants by status
    @Query("SELECT t.status, COUNT(t) FROM Tenant t GROUP BY t.status")
    List<Object[]> countByStatus();

    // Find active tenants with user count approaching limit
    @Query("SELECT t FROM Tenant t WHERE t.status = 'ACTIVE' " +
           "AND t.maxUsers IS NOT NULL")
    List<Tenant> findActiveTenantsWithUserLimit();
}
