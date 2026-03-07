package com.surework.payroll.service;

import com.surework.payroll.domain.PayrollRun;
import com.surework.payroll.domain.Payslip;
import com.surework.payroll.dto.PayrollDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service interface for payroll operations.
 */
public interface PayrollService {

    // === Payroll Run Operations ===

    /**
     * Create a new payroll run for a period.
     */
    PayrollDto.PayrollRunResponse createPayrollRun(PayrollDto.CreatePayrollRunRequest request);

    /**
     * Get a payroll run by ID.
     */
    Optional<PayrollDto.PayrollRunResponse> getPayrollRun(UUID runId);

    /**
     * Get a payroll run with all payslip summaries.
     */
    Optional<PayrollDto.PayrollRunDetailResponse> getPayrollRunWithPayslips(UUID runId);

    /**
     * Search payroll runs.
     */
    Page<PayrollDto.PayrollRunResponse> searchPayrollRuns(
            Integer year,
            PayrollRun.PayrollRunStatus status,
            Pageable pageable);

    /**
     * Process a payroll run - calculate all payslips.
     */
    PayrollDto.PayrollRunResponse processPayrollRun(UUID runId, UUID processedBy);

    /**
     * Approve a payroll run.
     */
    PayrollDto.PayrollRunResponse approvePayrollRun(UUID runId, UUID approvedBy);

    /**
     * Mark a payroll run as paid.
     */
    PayrollDto.PayrollRunResponse markPayrollRunAsPaid(UUID runId);

    /**
     * Cancel a payroll run.
     */
    void cancelPayrollRun(UUID runId);

    /**
     * Get payroll runs awaiting approval.
     */
    List<PayrollDto.PayrollRunResponse> getPendingApprovalRuns();

    // === Payslip Operations ===

    /**
     * Get a payslip by ID.
     */
    Optional<PayrollDto.PayslipResponse> getPayslip(UUID payslipId);

    /**
     * Get payslips for an employee.
     */
    List<PayrollDto.PayslipSummary> getEmployeePayslips(UUID employeeId);

    /**
     * Get payslip for employee and period.
     */
    Optional<PayrollDto.PayslipResponse> getEmployeePayslipForPeriod(UUID employeeId, int year, int month);

    /**
     * Search payslips.
     */
    Page<PayrollDto.PayslipSummary> searchPayslips(
            UUID employeeId,
            UUID runId,
            Integer year,
            Integer month,
            Payslip.PayslipStatus status,
            Pageable pageable);

    /**
     * Exclude a payslip from a run.
     */
    void excludePayslip(UUID payslipId);

    /**
     * Include an excluded payslip in a run.
     */
    void includePayslip(UUID payslipId);

    // === Tax Calculation ===

    /**
     * Calculate tax for a monthly income (preview).
     */
    PayrollDto.TaxCalculationResult calculateTax(
            java.math.BigDecimal grossMonthlyIncome,
            LocalDate dateOfBirth,
            java.math.BigDecimal pensionContribution,
            java.math.BigDecimal retirementAnnuity,
            int medicalAidMembers,
            int medicalAidDependants);

    // === Reporting ===

    /**
     * Get payroll summary for a period.
     */
    Optional<PayrollDto.PayrollPeriodSummary> getPayrollSummary(int year, int month);

    /**
     * Get annual payroll summary.
     */
    PayrollDto.PayrollAnnualSummary getAnnualPayrollSummary(int year);

    /**
     * Generate payslip PDF.
     */
    byte[] generatePayslipPdf(UUID payslipId);

    /**
     * Generate IRP5/IT3a data for an employee for a tax year.
     */
    // Future: IRP5Data generateIrp5(UUID employeeId, String taxYear);
}
