package com.surework.common.messaging.event;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Sealed interface for Payroll domain events.
 * Implements Constitution Principle III: Java 21 Features (Sealed Interfaces).
 */
public sealed interface PayrollEvent extends DomainEvent permits
        PayrollEvent.PayrollRunStarted,
        PayrollEvent.PayrollRunCompleted,
        PayrollEvent.PayrollRunFailed,
        PayrollEvent.PayslipGenerated,
        PayrollEvent.SalaryUpdated {

    /**
     * Event raised when a payroll run is started.
     */
    record PayrollRunStarted(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID payrollRunId,
            String period // e.g., "2025-01"
    ) implements PayrollEvent {}

    /**
     * Event raised when a payroll run completes successfully.
     */
    record PayrollRunCompleted(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID payrollRunId,
            int employeeCount,
            BigDecimal totalGross,
            BigDecimal totalNet
    ) implements PayrollEvent {}

    /**
     * Event raised when a payroll run fails.
     */
    record PayrollRunFailed(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID payrollRunId,
            String period,
            String errorMessage
    ) implements PayrollEvent {}

    /**
     * Event raised when a payslip is generated for an employee.
     */
    record PayslipGenerated(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID payslipId,
            UUID employeeId,
            int periodYear,
            int periodMonth,
            BigDecimal netPay
    ) implements PayrollEvent {}

    /**
     * Event raised when an employee's salary is updated.
     */
    record SalaryUpdated(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID employeeId,
            BigDecimal oldSalary,
            BigDecimal newSalary,
            Instant effectiveDate
    ) implements PayrollEvent {}
}
