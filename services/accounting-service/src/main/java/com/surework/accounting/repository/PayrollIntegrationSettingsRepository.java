package com.surework.accounting.repository;

import com.surework.accounting.domain.PayrollIntegrationSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for PayrollIntegrationSettings entities.
 */
@Repository
public interface PayrollIntegrationSettingsRepository extends JpaRepository<PayrollIntegrationSettings, UUID> {

    /**
     * Find settings by tenant ID.
     */
    Optional<PayrollIntegrationSettings> findByTenantId(UUID tenantId);

    /**
     * Check if settings exist for a tenant.
     */
    boolean existsByTenantId(UUID tenantId);
}
