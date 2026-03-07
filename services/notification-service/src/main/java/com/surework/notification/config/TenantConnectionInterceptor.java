package com.surework.notification.config;

import com.surework.common.security.TenantContext;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Aspect that sets the PostgreSQL session variable for tenant context
 * before any repository method execution.
 *
 * This enables Row-Level Security (RLS) policies to work correctly
 * by ensuring the current tenant ID is available in the database session.
 */
@Aspect
@Component
@Slf4j
public class TenantConnectionInterceptor {

    private final JdbcTemplate jdbcTemplate;

    public TenantConnectionInterceptor(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Set the tenant context in PostgreSQL before any repository method.
     */
    @Before("execution(* com.surework.notification.repository.*.*(..))")
    public void setTenantContext() {
        UUID tenantId = TenantContext.getTenantId().orElse(null);
        if (tenantId != null) {
            try {
                jdbcTemplate.execute("SET LOCAL app.current_tenant_id = '" + tenantId + "'");
                log.trace("Set tenant context in database: {}", tenantId);
            } catch (Exception e) {
                log.warn("Failed to set tenant context: {}", e.getMessage());
            }
        } else {
            log.trace("No tenant context available, skipping SET LOCAL");
        }
    }
}
