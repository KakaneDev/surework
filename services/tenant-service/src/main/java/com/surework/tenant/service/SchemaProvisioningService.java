package com.surework.tenant.service;

import com.surework.tenant.domain.Tenant;
import com.surework.tenant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.util.UUID;

/**
 * Service for provisioning tenant schemas.
 * Implements Constitution Principle VII: Multi-Tenancy (Schema-per-Tenant).
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class SchemaProvisioningService {

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;
    private final TenantRepository tenantRepository;

    @Value("${spring.flyway.locations:classpath:db/migration/tenant}")
    private String flywayLocations;

    /**
     * Provision a new schema for a tenant asynchronously.
     */
    @Async
    public void provisionSchema(UUID tenantId, String schemaName) {
        log.info("Starting schema provisioning for tenant {} with schema {}", tenantId, schemaName);

        try {
            // Create the schema
            createSchema(schemaName);

            // Run Flyway migrations for the tenant schema
            runMigrations(schemaName);

            // Activate the tenant
            activateTenant(tenantId);

            log.info("Schema provisioning completed for tenant {}", tenantId);

        } catch (Exception e) {
            log.error("Schema provisioning failed for tenant {}: {}", tenantId, e.getMessage(), e);
            // Mark tenant as failed (could add a FAILED status)
            throw new RuntimeException("Schema provisioning failed", e);
        }
    }

    /**
     * Create the PostgreSQL schema.
     */
    private void createSchema(String schemaName) {
        log.debug("Creating schema: {}", schemaName);
        // Use parameterized query where possible, but schema names can't be parameterized
        // Validate schema name format to prevent SQL injection
        if (!schemaName.matches("^tenant_[a-f0-9]{32}$")) {
            throw new IllegalArgumentException("Invalid schema name format: " + schemaName);
        }
        jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS " + schemaName);
        log.debug("Schema created: {}", schemaName);
    }

    /**
     * Run Flyway migrations for the tenant schema.
     */
    private void runMigrations(String schemaName) {
        log.debug("Running migrations for schema: {}", schemaName);

        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .schemas(schemaName)
                .locations(flywayLocations)
                .baselineOnMigrate(true)
                .load();

        flyway.migrate();

        log.debug("Migrations completed for schema: {}", schemaName);
    }

    /**
     * Activate the tenant after successful provisioning.
     */
    @Transactional
    protected void activateTenant(UUID tenantId) {
        tenantRepository.findById(tenantId).ifPresent(tenant -> {
            if (tenant.getStatus() == Tenant.TenantStatus.PENDING) {
                tenant.setStatus(Tenant.TenantStatus.ACTIVE);
                tenantRepository.save(tenant);
                log.info("Tenant {} activated", tenantId);
            }
        });
    }

    /**
     * Drop a tenant schema (for cleanup/testing).
     */
    public void dropSchema(String schemaName) {
        // Validate schema name format
        if (!schemaName.matches("^tenant_[a-f0-9]{32}$")) {
            throw new IllegalArgumentException("Invalid schema name format: " + schemaName);
        }
        log.warn("Dropping schema: {}", schemaName);
        jdbcTemplate.execute("DROP SCHEMA IF EXISTS " + schemaName + " CASCADE");
    }
}
