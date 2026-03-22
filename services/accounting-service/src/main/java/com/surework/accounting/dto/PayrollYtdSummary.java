package com.surework.accounting.dto;

import java.math.BigDecimal;

/**
 * Projection DTO for YTD payroll summary aggregates.
 * Used for optimized single-query dashboard data retrieval.
 */
public record PayrollYtdSummary(
        BigDecimal totalGross,
        BigDecimal totalPaye,
        BigDecimal totalEmployerCost,
        long journaledRunsCount
) {
    /**
     * Create empty summary with zero values.
     */
    public static PayrollYtdSummary empty() {
        return new PayrollYtdSummary(
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                0L
        );
    }
}
