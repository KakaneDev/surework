package com.surework.payroll.dto;

import com.surework.payroll.domain.PayrollRun;
import com.surework.payroll.domain.Payslip;
import com.surework.payroll.domain.PayslipLine;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

/**
 * DTOs for Payroll operations.
 */
public sealed interface PayrollDto {

    // === Payroll Run DTOs ===

    /**
     * Request to create a payroll run.
     */
    record CreatePayrollRunRequest(
            @NotNull(message = "Period year is required")
            Integer periodYear,

            @NotNull(message = "Period month is required")
            Integer periodMonth,

            @NotNull(message = "Payment date is required")
            LocalDate paymentDate,

            @Size(max = 1000, message = "Notes must not exceed 1000 characters")
            String notes
    ) implements PayrollDto {}

    /**
     * Payroll run response.
     */
    record PayrollRunResponse(
            UUID id,
            String runNumber,
            int periodYear,
            int periodMonth,
            LocalDate paymentDate,
            PayrollRun.PayrollRunStatus status,
            BigDecimal totalGross,
            BigDecimal totalPaye,
            BigDecimal totalUifEmployee,
            BigDecimal totalUifEmployer,
            BigDecimal totalNet,
            BigDecimal totalEmployerCost,
            int employeeCount,
            UUID processedBy,
            Instant processedAt,
            UUID approvedBy,
            Instant approvedAt,
            String notes,
            Instant createdAt,
            Instant updatedAt
    ) implements PayrollDto {

        public static PayrollRunResponse fromEntity(PayrollRun run) {
            return new PayrollRunResponse(
                    run.getId(),
                    run.getRunNumber(),
                    run.getPeriodYear(),
                    run.getPeriodMonth(),
                    run.getPaymentDate(),
                    run.getStatus(),
                    run.getTotalGross(),
                    run.getTotalPaye(),
                    run.getTotalUifEmployee(),
                    run.getTotalUifEmployer(),
                    run.getTotalNet(),
                    run.getTotalEmployerCost(),
                    run.getEmployeeCount(),
                    run.getProcessedBy(),
                    run.getProcessedAt(),
                    run.getApprovedBy(),
                    run.getApprovedAt(),
                    run.getNotes(),
                    run.getCreatedAt(),
                    run.getUpdatedAt()
            );
        }

        public String getPeriodDisplay() {
            return YearMonth.of(periodYear, periodMonth).toString();
        }
    }

    /**
     * Payroll run with payslip summaries.
     */
    record PayrollRunDetailResponse(
            PayrollRunResponse run,
            List<PayslipSummary> payslips
    ) implements PayrollDto {}

    // === Payslip DTOs ===

    /**
     * Payslip summary for lists.
     */
    record PayslipSummary(
            UUID id,
            String payslipNumber,
            UUID employeeId,
            String employeeNumber,
            String employeeName,
            String department,
            BigDecimal grossEarnings,
            BigDecimal totalDeductions,
            BigDecimal netPay,
            Payslip.PayslipStatus status
    ) implements PayrollDto {

        public static PayslipSummary fromEntity(Payslip payslip) {
            return new PayslipSummary(
                    payslip.getId(),
                    payslip.getPayslipNumber(),
                    payslip.getEmployeeId(),
                    payslip.getEmployeeNumber(),
                    payslip.getEmployeeName(),
                    payslip.getDepartment(),
                    payslip.getGrossEarnings(),
                    payslip.getTotalDeductions(),
                    payslip.getNetPay(),
                    payslip.getStatus()
            );
        }
    }

    /**
     * Full payslip response.
     */
    record PayslipResponse(
            UUID id,
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
            Payslip.PayslipStatus status,
            String bankAccount,
            String bankName,
            String branchCode,
            List<PayslipLineResponse> lines,
            Instant createdAt
    ) implements PayrollDto {

        public static PayslipResponse fromEntity(Payslip payslip) {
            return new PayslipResponse(
                    payslip.getId(),
                    payslip.getPayslipNumber(),
                    payslip.getEmployeeId(),
                    payslip.getEmployeeNumber(),
                    payslip.getEmployeeName(),
                    payslip.getIdNumber(),
                    payslip.getTaxNumber(),
                    payslip.getDepartment(),
                    payslip.getJobTitle(),
                    payslip.getPeriodYear(),
                    payslip.getPeriodMonth(),
                    payslip.getPaymentDate(),
                    payslip.getBasicSalary(),
                    payslip.getGrossEarnings(),
                    payslip.getPaye(),
                    payslip.getUifEmployee(),
                    payslip.getUifEmployer(),
                    payslip.getPensionFund(),
                    payslip.getMedicalAid(),
                    payslip.getOtherDeductions(),
                    payslip.getTotalDeductions(),
                    payslip.getNetPay(),
                    payslip.getEmployerPension(),
                    payslip.getEmployerMedical(),
                    payslip.getSdl(),
                    payslip.getTotalEmployerCost(),
                    payslip.getYtdGross(),
                    payslip.getYtdPaye(),
                    payslip.getYtdUif(),
                    payslip.getYtdNet(),
                    payslip.getTaxableIncome(),
                    payslip.getAnnualEquivalent(),
                    payslip.getTaxRebate(),
                    payslip.getMedicalTaxCredit(),
                    payslip.getStatus(),
                    payslip.getBankAccount(),
                    payslip.getBankName(),
                    payslip.getBranchCode(),
                    payslip.getLines().stream()
                            .map(PayslipLineResponse::fromEntity)
                            .toList(),
                    payslip.getCreatedAt()
            );
        }

        public String getPeriodDisplay() {
            return YearMonth.of(periodYear, periodMonth).toString();
        }
    }

    /**
     * Payslip line response.
     */
    record PayslipLineResponse(
            UUID id,
            PayslipLine.LineType lineType,
            String code,
            String description,
            BigDecimal quantity,
            BigDecimal rate,
            BigDecimal amount,
            BigDecimal ytdAmount,
            boolean taxable,
            boolean pensionable
    ) implements PayrollDto {

        public static PayslipLineResponse fromEntity(PayslipLine line) {
            return new PayslipLineResponse(
                    line.getId(),
                    line.getLineType(),
                    line.getCode(),
                    line.getDescription(),
                    line.getQuantity(),
                    line.getRate(),
                    line.getAmount(),
                    line.getYtdAmount(),
                    line.isTaxable(),
                    line.isPensionable()
            );
        }
    }

    // === Tax Calculation DTOs ===

    /**
     * Tax calculation result.
     */
    record TaxCalculationResult(
            BigDecimal grossIncome,
            BigDecimal taxableIncome,
            BigDecimal annualEquivalent,
            BigDecimal annualTaxBeforeRebate,
            BigDecimal rebate,
            BigDecimal medicalTaxCredit,
            BigDecimal annualTaxAfterCredits,
            BigDecimal monthlyPaye,
            BigDecimal uifEmployee,
            BigDecimal uifEmployer,
            String taxBracket,
            BigDecimal effectiveRate
    ) implements PayrollDto {}

    /**
     * Employee data for payroll calculation.
     */
    record EmployeePayrollData(
            UUID employeeId,
            String employeeNumber,
            String firstName,
            String lastName,
            String idNumber,
            String taxNumber,
            LocalDate dateOfBirth,
            String department,
            String jobTitle,
            BigDecimal basicSalary,
            BigDecimal pensionContributionPercent,
            BigDecimal medicalAidContribution,
            int medicalAidDependants,
            String bankAccount,
            String bankName,
            String branchCode
    ) implements PayrollDto {}

    // === Reporting DTOs ===

    /**
     * Payroll summary for a period.
     */
    record PayrollPeriodSummary(
            int year,
            int month,
            int employeeCount,
            BigDecimal totalGross,
            BigDecimal totalPaye,
            BigDecimal totalUif,
            BigDecimal totalNet,
            BigDecimal totalEmployerCost
    ) implements PayrollDto {}

    /**
     * Annual payroll summary.
     */
    record PayrollAnnualSummary(
            int year,
            List<PayrollPeriodSummary> months,
            BigDecimal totalGross,
            BigDecimal totalPaye,
            BigDecimal totalUif,
            BigDecimal totalNet,
            BigDecimal totalEmployerCost
    ) implements PayrollDto {}
}
