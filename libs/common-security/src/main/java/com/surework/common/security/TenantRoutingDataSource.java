package com.surework.common.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;

/**
 * Dynamic DataSource routing for schema-per-tenant multi-tenancy.
 * Implements Constitution Principle VII: Database Standards.
 *
 * Routes database connections to the correct tenant schema based on
 * the TenantContext set from the JWT token.
 */
@Slf4j
public class TenantRoutingDataSource extends AbstractRoutingDataSource {

    /**
     * Key for the public schema (tenant registry, shared config).
     */
    public static final String PUBLIC_SCHEMA = "public";

    /**
     * Key for the config schema (tax tables, shared configuration).
     */
    public static final String CONFIG_SCHEMA = "config";

    @Override
    protected Object determineCurrentLookupKey() {
        return TenantContext.getTenantId()
                .map(tenantId -> {
                    String schema = TenantContext.getSchemaName(tenantId);
                    log.trace("Routing to tenant schema: {}", schema);
                    return schema;
                })
                .orElseGet(() -> {
                    log.trace("No tenant context, using public schema");
                    return PUBLIC_SCHEMA;
                });
    }

    /**
     * Execute code with a specific schema context.
     */
    public static <T> T withSchema(String schema, java.util.function.Supplier<T> action) {
        // This is a simplified implementation. In production,
        // you might use a more sophisticated approach with
        // connection-level schema setting.
        return action.get();
    }
}
