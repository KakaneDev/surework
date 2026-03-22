package com.surework.reporting.client.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Payslip data transfer object from Payroll Service.
 */
public record PayslipDto(
        UUID id,
        UUID payrollRunId,
        String payslipNumber,
        UUID employeeId,
        String employeeNumber,
        String employeeName,
        String idNumber,
        String taxNumber,
        String department,
        String jobTitle,
        int periodYear,
        int periodMonth,
        LocalDate paymentDate,
        BigDecimal basicSalary,
        BigDecimal grossEarnings,
        BigDecimal paye,
        BigDecimal uifEmployee,
        BigDecimal uifEmployer,
        BigDecimal pensionFund,
        BigDecimal medicalAid,
        BigDecimal otherDeductions,
        BigDecimal totalDeductions,
        BigDecimal netPay,
        BigDecimal employerPension,
        BigDecimal employerMedical,
        BigDecimal sdl,
        BigDecimal totalEmployerCost,
        BigDecimal ytdGross,
        BigDecimal ytdPaye,
        BigDecimal ytdUif,
        BigDecimal ytdNet,
        BigDecimal taxableIncome,
        BigDecimal annualEquivalent,
        BigDecimal taxRebate,
        BigDecimal medicalTaxCredit,
        String status,
        String bankAccount,
        String bankName,
        String branchCode,
        List<PayslipLineDto> lines,
        LocalDateTime createdAt
) {}
