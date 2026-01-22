package com.surework.payroll.controller;

import com.surework.common.web.PageResponse;
import com.surework.common.web.exception.ResourceNotFoundException;
import com.surework.payroll.domain.PayrollRun;
import com.surework.payroll.domain.Payslip;
import com.surework.payroll.dto.PayrollDto;
import com.surework.payroll.service.PayrollService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for Payroll operations.
 * Implements User Story 3: Payroll Processing.
 */
@RestController
@RequestMapping("/api/v1/payroll")
@RequiredArgsConstructor
public class PayrollController {

    private final PayrollService payrollService;

    // === Payroll Run Endpoints ===

    /**
     * Create a new payroll run.
     */
    @PostMapping("/runs")
    public ResponseEntity<PayrollDto.PayrollRunResponse> createPayrollRun(
            @Valid @RequestBody PayrollDto.CreatePayrollRunRequest request) {
        PayrollDto.PayrollRunResponse response = payrollService.createPayrollRun(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get a payroll run by ID.
     */
    @GetMapping("/runs/{runId}")
    public ResponseEntity<PayrollDto.PayrollRunResponse> getPayrollRun(@PathVariable UUID runId) {
        return payrollService.getPayrollRun(runId)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("PayrollRun", runId));
    }

    /**
     * Get a payroll run with all payslip details.
     */
    @GetMapping("/runs/{runId}/details")
    public ResponseEntity<PayrollDto.PayrollRunDetailResponse> getPayrollRunWithPayslips(
            @PathVariable UUID runId) {
        return payrollService.getPayrollRunWithPayslips(runId)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("PayrollRun", runId));
    }

    /**
     * Search payroll runs.
     */
    @GetMapping("/runs")
    public ResponseEntity<PageResponse<PayrollDto.PayrollRunResponse>> searchPayrollRuns(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) PayrollRun.PayrollRunStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<PayrollDto.PayrollRunResponse> page = payrollService.searchPayrollRuns(year, status, pageable);
        return ResponseEntity.ok(PageResponse.of(page));
    }

    /**
     * Get payroll runs pending approval.
     */
    @GetMapping("/runs/pending-approval")
    public ResponseEntity<List<PayrollDto.PayrollRunResponse>> getPendingApprovalRuns() {
        List<PayrollDto.PayrollRunResponse> runs = payrollService.getPendingApprovalRuns();
        return ResponseEntity.ok(runs);
    }

    /**
     * Process a payroll run (calculate all payslips).
     */
    @PostMapping("/runs/{runId}/process")
    public ResponseEntity<PayrollDto.PayrollRunResponse> processPayrollRun(
            @PathVariable UUID runId,
            @RequestHeader("X-User-Id") UUID processedBy) {
        PayrollDto.PayrollRunResponse response = payrollService.processPayrollRun(runId, processedBy);
        return ResponseEntity.ok(response);
    }

    /**
     * Approve a payroll run.
     */
    @PostMapping("/runs/{runId}/approve")
    public ResponseEntity<PayrollDto.PayrollRunResponse> approvePayrollRun(
            @PathVariable UUID runId,
            @RequestHeader("X-User-Id") UUID approvedBy) {
        PayrollDto.PayrollRunResponse response = payrollService.approvePayrollRun(runId, approvedBy);
        return ResponseEntity.ok(response);
    }

    /**
     * Mark a payroll run as paid.
     */
    @PostMapping("/runs/{runId}/mark-paid")
    public ResponseEntity<PayrollDto.PayrollRunResponse> markPayrollRunAsPaid(@PathVariable UUID runId) {
        PayrollDto.PayrollRunResponse response = payrollService.markPayrollRunAsPaid(runId);
        return ResponseEntity.ok(response);
    }

    /**
     * Cancel a payroll run.
     */
    @PostMapping("/runs/{runId}/cancel")
    public ResponseEntity<Void> cancelPayrollRun(@PathVariable UUID runId) {
        payrollService.cancelPayrollRun(runId);
        return ResponseEntity.noContent().build();
    }

    // === Payslip Endpoints ===

    /**
     * Get a payslip by ID.
     */
    @GetMapping("/payslips/{payslipId}")
    public ResponseEntity<PayrollDto.PayslipResponse> getPayslip(@PathVariable UUID payslipId) {
        return payrollService.getPayslip(payslipId)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Payslip", payslipId));
    }

    /**
     * Search payslips.
     */
    @GetMapping("/payslips")
    public ResponseEntity<PageResponse<PayrollDto.PayslipSummary>> searchPayslips(
            @RequestParam(required = false) UUID employeeId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Payslip.PayslipStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<PayrollDto.PayslipSummary> page = payrollService.searchPayslips(
                employeeId, year, month, status, pageable);
        return ResponseEntity.ok(PageResponse.of(page));
    }

    /**
     * Get payslips for an employee.
     */
    @GetMapping("/employees/{employeeId}/payslips")
    public ResponseEntity<List<PayrollDto.PayslipSummary>> getEmployeePayslips(
            @PathVariable UUID employeeId) {
        List<PayrollDto.PayslipSummary> payslips = payrollService.getEmployeePayslips(employeeId);
        return ResponseEntity.ok(payslips);
    }

    /**
     * Get my payslips.
     */
    @GetMapping("/my-payslips")
    public ResponseEntity<List<PayrollDto.PayslipSummary>> getMyPayslips(
            @RequestHeader("X-User-Id") UUID userId) {
        List<PayrollDto.PayslipSummary> payslips = payrollService.getEmployeePayslips(userId);
        return ResponseEntity.ok(payslips);
    }

    /**
     * Get a specific payslip for an employee and period.
     */
    @GetMapping("/employees/{employeeId}/payslips/{year}/{month}")
    public ResponseEntity<PayrollDto.PayslipResponse> getEmployeePayslipForPeriod(
            @PathVariable UUID employeeId,
            @PathVariable int year,
            @PathVariable int month) {
        return payrollService.getEmployeePayslipForPeriod(employeeId, year, month)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Payslip",
                        "employee " + employeeId + " for " + year + "/" + month));
    }

    /**
     * Download payslip as PDF.
     */
    @GetMapping("/payslips/{payslipId}/pdf")
    public ResponseEntity<byte[]> downloadPayslipPdf(@PathVariable UUID payslipId) {
        byte[] pdf = payrollService.generatePayslipPdf(payslipId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "payslip-" + payslipId + ".pdf");
        headers.setContentLength(pdf.length);

        return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
    }

    /**
     * Exclude a payslip from a run.
     */
    @PostMapping("/payslips/{payslipId}/exclude")
    public ResponseEntity<Void> excludePayslip(@PathVariable UUID payslipId) {
        payrollService.excludePayslip(payslipId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Include an excluded payslip in a run.
     */
    @PostMapping("/payslips/{payslipId}/include")
    public ResponseEntity<Void> includePayslip(@PathVariable UUID payslipId) {
        payrollService.includePayslip(payslipId);
        return ResponseEntity.noContent().build();
    }

    // === Tax Calculator ===

    /**
     * Calculate tax (preview/calculator).
     */
    @PostMapping("/calculate-tax")
    public ResponseEntity<PayrollDto.TaxCalculationResult> calculateTax(
            @RequestParam BigDecimal grossMonthlyIncome,
            @RequestParam(required = false) LocalDate dateOfBirth,
            @RequestParam(required = false, defaultValue = "0") BigDecimal pensionContribution,
            @RequestParam(required = false, defaultValue = "0") BigDecimal retirementAnnuity,
            @RequestParam(required = false, defaultValue = "1") int medicalAidMembers,
            @RequestParam(required = false, defaultValue = "0") int medicalAidDependants) {
        PayrollDto.TaxCalculationResult result = payrollService.calculateTax(
                grossMonthlyIncome,
                dateOfBirth != null ? dateOfBirth : LocalDate.of(1990, 1, 1),
                pensionContribution,
                retirementAnnuity,
                medicalAidMembers,
                medicalAidDependants
        );
        return ResponseEntity.ok(result);
    }

    // === Reporting ===

    /**
     * Get payroll summary for a period.
     */
    @GetMapping("/summary/{year}/{month}")
    public ResponseEntity<PayrollDto.PayrollPeriodSummary> getPayrollSummary(
            @PathVariable int year,
            @PathVariable int month) {
        return payrollService.getPayrollSummary(year, month)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("PayrollSummary",
                        year + "/" + month));
    }

    /**
     * Get annual payroll summary.
     */
    @GetMapping("/summary/{year}")
    public ResponseEntity<PayrollDto.PayrollAnnualSummary> getAnnualPayrollSummary(
            @PathVariable int year) {
        PayrollDto.PayrollAnnualSummary summary = payrollService.getAnnualPayrollSummary(year);
        return ResponseEntity.ok(summary);
    }
}
