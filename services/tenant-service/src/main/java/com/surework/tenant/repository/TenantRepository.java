package com.surework.tenant.repository;

import com.surework.tenant.domain.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Tenant entity.
 */
@Repository
public interface TenantRepository extends JpaRepository<Tenant, UUID> {

    Optional<Tenant> findBySubdomain(String subdomain);

    Optional<Tenant> findBySchemaName(String schemaName);

    Optional<Tenant> findByCompanyName(String companyName);

    boolean existsBySubdomain(String subdomain);

    boolean existsByCompanyName(String companyName);

    boolean existsByRegistrationNumber(String registrationNumber);

    List<Tenant> findByStatus(Tenant.TenantStatus status);

    @Query("""
        SELECT t FROM Tenant t
        WHERE t.status = :status
        AND t.deleted = false
        ORDER BY t.createdAt DESC
        """)
    List<Tenant> findActiveByStatus(@Param("status") Tenant.TenantStatus status);

    @Query("""
        SELECT COUNT(t) FROM Tenant t
        WHERE t.status = 'ACTIVE'
        AND t.deleted = false
        """)
    long countActiveTenants();
}
