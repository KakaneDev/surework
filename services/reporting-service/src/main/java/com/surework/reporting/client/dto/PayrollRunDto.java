package com.surework.reporting.client.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Payroll Run data transfer object from Payroll Service.
 */
public record PayrollRunDto(
        UUID id,
        String runNumber,
        int periodYear,
        int periodMonth,
        LocalDate paymentDate,
        String status,
        BigDecimal totalGross,
        BigDecimal totalPaye,
        BigDecimal totalUifEmployee,
        BigDecimal totalUifEmployer,
        BigDecimal totalNet,
        BigDecimal totalEmployerCost,
        int employeeCount,
        UUID processedBy,
        LocalDateTime processedAt,
        UUID approvedBy,
        LocalDateTime approvedAt,
        String notes,
        LocalDateTime createdAt
) {}
