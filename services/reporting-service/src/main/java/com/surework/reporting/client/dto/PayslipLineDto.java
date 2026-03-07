package com.surework.reporting.client.dto;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Payslip Line data transfer object from Payroll Service.
 */
public record PayslipLineDto(
        UUID id,
        UUID payslipId,
        String lineType,
        String code,
        String description,
        BigDecimal quantity,
        BigDecimal rate,
        BigDecimal amount,
        BigDecimal ytdAmount,
        boolean taxable,
        boolean pensionable,
        int sortOrder
) {}
