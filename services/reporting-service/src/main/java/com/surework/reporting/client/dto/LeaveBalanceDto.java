package com.surework.reporting.client.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Leave Balance data transfer object from Leave Service.
 */
public record LeaveBalanceDto(
        UUID id,
        UUID employeeId,
        String leaveType,
        int year,
        LocalDate cycleStartDate,
        BigDecimal entitlement,
        BigDecimal used,
        BigDecimal pending,
        BigDecimal carriedOver
) {
    /**
     * Calculate available leave days.
     */
    public BigDecimal available() {
        return entitlement.add(carriedOver).subtract(used).subtract(pending);
    }
}
