package com.surework.accounting.config;

import com.surework.common.security.SetupGateFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.Map;

/**
 * Registers the {@link SetupGateFilter} for the accounting service.
 *
 * <p>Gated paths:
 * <ul>
 *   <li>Company details gate — blocks invoice and customer endpoints until company
 *       profile is complete.</li>
 *   <li>Compliance gate — blocks payroll, VAT, and journal endpoints until
 *       compliance information is submitted.</li>
 * </ul>
 *
 * The filter runs at order 50, which places it after the JWT auth filter
 * (which populates {@link com.surework.common.security.TenantContext}) but
 * before any controllers process the request.
 */
@Configuration
public class SetupGateConfig {

    @Bean
    public FilterRegistrationBean<SetupGateFilter> setupGateFilter() {
        var filter = new SetupGateFilter(
                Map.of("COMPANY_DETAILS", List.of(
                        "/api/v1/accounting/invoices",
                        "/api/v1/accounting/customers")),
                Map.of("COMPLIANCE", List.of(
                        "/api/v1/accounting/payroll",
                        "/api/v1/accounting/vat",
                        "/api/v1/accounting/journals")));

        var registration = new FilterRegistrationBean<>(filter);
        registration.setOrder(50); // After auth filter, before controllers
        return registration;
    }
}
