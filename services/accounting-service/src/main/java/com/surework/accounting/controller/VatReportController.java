package com.surework.accounting.controller;

import com.surework.accounting.domain.VatReport;
import com.surework.accounting.dto.VatReportDto;
import com.surework.accounting.service.VatReportService;
import com.surework.common.web.PageResponse;
import com.surework.common.web.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for VAT201 report operations.
 * Implements SARS VAT reporting for South African businesses.
 *
 * <p>All endpoints require authentication and appropriate role-based authorization.
 * Tenant isolation is enforced via the X-Tenant-Id header.
 *
 * Endpoints:
 * - POST /api/v1/accounting/vat/preview - Preview VAT report
 * - POST /api/v1/accounting/vat/generate - Generate VAT report
 * - GET /api/v1/accounting/vat/{id} - Get VAT report
 * - GET /api/v1/accounting/vat/period/{period} - Get by period
 * - GET /api/v1/accounting/vat - Search VAT reports
 * - POST /api/v1/accounting/vat/{id}/finalize - Finalize report
 * - POST /api/v1/accounting/vat/{id}/submit - Submit to SARS
 * - POST /api/v1/accounting/vat/{id}/payment - Record payment
 * - GET /api/v1/accounting/vat/dashboard - Dashboard summary
 */
@RestController
@RequestMapping("/api/v1/accounting/vat")
@RequiredArgsConstructor
@Validated
@Slf4j
@PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'FINANCE_MANAGER')")
public class VatReportController {

    private final VatReportService vatReportService;

    // === Report Generation ===

    /**
     * Preview VAT report without persisting.
     */
    @PostMapping("/preview")
    public ResponseEntity<VatReportDto.VatReportResponse> previewVatReport(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @Valid @RequestBody VatReportDto.PreviewVatReportRequest request) {
        log.info("Previewing VAT report for {} to {}", request.periodStart(), request.periodEnd());
        VatReportDto.VatReportResponse response = vatReportService.previewVatReport(tenantId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Generate and persist VAT report.
     */
    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<VatReportDto.VatReportResponse> generateVatReport(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @Valid @RequestBody VatReportDto.GenerateVatReportRequest request) {
        log.info("Generating VAT report for {} to {}", request.periodStart(), request.periodEnd());
        VatReportDto.VatReportResponse response = vatReportService.generateVatReport(tenantId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Regenerate an existing draft report.
     */
    @PostMapping("/{reportId}/regenerate")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<VatReportDto.VatReportResponse> regenerateVatReport(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID reportId,
            @RequestHeader("X-User-Id") @NotNull UUID userId) {
        VatReportDto.VatReportResponse response = vatReportService.regenerateVatReport(tenantId, reportId, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Finalize report for submission.
     */
    @PostMapping("/{reportId}/finalize")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<VatReportDto.VatReportResponse> finalizeReport(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID reportId,
            @RequestHeader("X-User-Id") @NotNull UUID userId) {
        VatReportDto.VatReportResponse response = vatReportService.finalizeReport(tenantId, reportId, userId);
        return ResponseEntity.ok(response);
    }

    // === Report Retrieval ===

    /**
     * Get VAT report by ID.
     */
    @GetMapping("/{reportId}")
    public ResponseEntity<VatReportDto.VatReportResponse> getReport(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID reportId) {
        return vatReportService.getReport(tenantId, reportId)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("VatReport", reportId));
    }

    /**
     * Get VAT report by period (e.g., "2024-01").
     */
    @GetMapping("/period/{vatPeriod}")
    public ResponseEntity<VatReportDto.VatReportResponse> getReportByPeriod(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable String vatPeriod) {
        return vatReportService.getReportByPeriod(tenantId, vatPeriod)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("VatReport for period", vatPeriod));
    }

    /**
     * Get VAT report with all source transactions.
     */
    @GetMapping("/{reportId}/transactions")
    public ResponseEntity<VatReportDto.VatReportResponse> getReportWithTransactions(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID reportId) {
        return vatReportService.getReportWithTransactions(tenantId, reportId)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("VatReport", reportId));
    }

    /**
     * Search VAT reports with filters.
     */
    @GetMapping
    public ResponseEntity<PageResponse<VatReportDto.VatReportSummary>> searchReports(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @RequestParam(required = false) VatReport.ReportStatus status,
            @RequestParam(required = false) Integer year,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<VatReportDto.VatReportSummary> page = vatReportService.searchReports(tenantId, status, year, pageable);
        return ResponseEntity.ok(PageResponse.from(page));
    }

    /**
     * Get reports for a specific year.
     */
    @GetMapping("/year/{year}")
    public ResponseEntity<List<VatReportDto.VatReportSummary>> getReportsForYear(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable int year) {
        List<VatReportDto.VatReportSummary> reports = vatReportService.getReportsForYear(tenantId, year);
        return ResponseEntity.ok(reports);
    }

    /**
     * Get recent reports.
     */
    @GetMapping("/recent")
    public ResponseEntity<List<VatReportDto.VatReportSummary>> getRecentReports(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @RequestParam(defaultValue = "6") int limit) {
        List<VatReportDto.VatReportSummary> reports = vatReportService.getRecentReports(tenantId, limit);
        return ResponseEntity.ok(reports);
    }

    /**
     * Get overdue reports.
     */
    @GetMapping("/overdue")
    public ResponseEntity<List<VatReportDto.VatReportSummary>> getOverdueReports(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId) {
        List<VatReportDto.VatReportSummary> reports = vatReportService.getOverdueReports(tenantId);
        return ResponseEntity.ok(reports);
    }

    /**
     * Get pending submission reports.
     */
    @GetMapping("/pending")
    public ResponseEntity<List<VatReportDto.VatReportSummary>> getPendingSubmissionReports(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId) {
        List<VatReportDto.VatReportSummary> reports = vatReportService.getPendingSubmissionReports(tenantId);
        return ResponseEntity.ok(reports);
    }

    // === Submission and Payment ===

    /**
     * Submit VAT report to SARS.
     */
    @PostMapping("/{reportId}/submit")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<VatReportDto.VatReportResponse> submitToSars(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID reportId,
            @Valid @RequestBody VatReportDto.SubmitVatReportRequest request,
            @RequestHeader("X-User-Id") @NotNull UUID userId) {
        // Ensure request has the correct report ID
        VatReportDto.SubmitVatReportRequest fullRequest = new VatReportDto.SubmitVatReportRequest(
                reportId, request.sarsReference(), request.notes());
        VatReportDto.VatReportResponse response = vatReportService.submitToSars(tenantId, fullRequest, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Record payment against VAT report.
     */
    @PostMapping("/{reportId}/payment")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<VatReportDto.VatReportResponse> recordPayment(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID reportId,
            @Valid @RequestBody VatReportDto.RecordPaymentRequest request) {
        // Ensure request has the correct report ID
        VatReportDto.RecordPaymentRequest fullRequest = new VatReportDto.RecordPaymentRequest(
                reportId, request.amount(), request.paymentReference(), request.notes());
        VatReportDto.VatReportResponse response = vatReportService.recordPayment(tenantId, fullRequest);
        return ResponseEntity.ok(response);
    }

    // === Adjustments ===

    /**
     * Apply manual adjustment to VAT report.
     */
    @PostMapping("/{reportId}/adjustments")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<VatReportDto.VatReportResponse> applyAdjustment(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID reportId,
            @Valid @RequestBody VatReportDto.VatAdjustmentRequest request,
            @RequestHeader("X-User-Id") @NotNull UUID userId) {
        VatReportDto.VatReportResponse response = vatReportService.applyAdjustment(tenantId, reportId, request, userId);
        return ResponseEntity.ok(response);
    }

    // === Dashboard and Analytics ===

    /**
     * Get VAT dashboard summary.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<VatReportDto.VatDashboardSummary> getDashboardSummary(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId) {
        VatReportDto.VatDashboardSummary summary = vatReportService.getDashboardSummary(tenantId);
        return ResponseEntity.ok(summary);
    }

    /**
     * Get VAT period comparison data.
     */
    @GetMapping("/comparison/{year}")
    public ResponseEntity<List<VatReportDto.VatPeriodComparison>> getPeriodComparison(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable int year) {
        List<VatReportDto.VatPeriodComparison> comparison = vatReportService.getPeriodComparison(tenantId, year);
        return ResponseEntity.ok(comparison);
    }

    /**
     * Get breakdown for a specific VAT box.
     */
    @GetMapping("/{reportId}/box/{boxNumber}")
    public ResponseEntity<VatReportDto.VatBoxBreakdown> getBoxBreakdown(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID reportId,
            @PathVariable String boxNumber) {
        VatReportDto.VatBoxBreakdown breakdown = vatReportService.getBoxBreakdown(tenantId, reportId, boxNumber);
        return ResponseEntity.ok(breakdown);
    }

    // === Export ===

    /**
     * Export report in SARS VAT201 format.
     */
    @GetMapping("/{reportId}/export/sars")
    public ResponseEntity<VatReportDto.SarsVat201Export> exportForSars(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID reportId) {
        VatReportDto.SarsVat201Export export = vatReportService.exportForSars(tenantId, reportId);
        return ResponseEntity.ok(export);
    }

    /**
     * Generate PDF report.
     */
    @GetMapping("/{reportId}/export/pdf")
    public ResponseEntity<byte[]> generatePdf(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID reportId) {
        byte[] pdfContent = vatReportService.generatePdf(tenantId, reportId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=vat201-" + reportId + ".pdf")
                .body(pdfContent);
    }

    // === Validation ===

    /**
     * Validate VAT report.
     */
    @GetMapping("/{reportId}/validate")
    public ResponseEntity<List<String>> validateReport(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID reportId) {
        List<String> errors = vatReportService.validateReport(tenantId, reportId);
        return ResponseEntity.ok(errors);
    }

    /**
     * Check if period is available for new report.
     */
    @GetMapping("/check-period")
    public ResponseEntity<Boolean> checkPeriodAvailability(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodStart,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodEnd) {
        boolean available = vatReportService.isPeriodAvailable(tenantId, periodStart, periodEnd);
        return ResponseEntity.ok(available);
    }
}
