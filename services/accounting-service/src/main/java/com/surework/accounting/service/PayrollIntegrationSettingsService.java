package com.surework.accounting.service;

import com.surework.accounting.domain.PayrollIntegrationSettings;
import com.surework.accounting.repository.PayrollIntegrationSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;
import java.util.UUID;

/**
 * Service for managing PayrollIntegrationSettings.
 * Extracted to ensure @Transactional works correctly via Spring AOP proxy.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PayrollIntegrationSettingsService {

    private final PayrollIntegrationSettingsRepository settingsRepository;

    /**
     * Get or create integration settings for a tenant.
     * Creates default settings if none exist.
     *
     * @param tenantId The tenant ID
     * @return The integration settings (never null)
     */
    @Transactional
    public PayrollIntegrationSettings getOrCreateSettings(UUID tenantId) {
        Objects.requireNonNull(tenantId, "Tenant ID must not be null");

        return settingsRepository.findByTenantId(tenantId)
                .orElseGet(() -> {
                    log.info("Creating default integration settings for tenant: {}", tenantId);
                    PayrollIntegrationSettings newSettings = PayrollIntegrationSettings.createDefault(tenantId);
                    return settingsRepository.save(newSettings);
                });
    }
}
