package com.surework.accounting.service;

import com.surework.accounting.dto.VatReportDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service interface for VAT201 report operations.
 * Implements SARS VAT reporting requirements for South African businesses.
 * All methods require tenant ID for multi-tenant data isolation.
 */
public interface VatReportService {

    // === Report Generation ===

    /**
     * Preview VAT report without persisting.
     * Calculates all VAT201 boxes based on posted journal entries.
     */
    VatReportDto.VatReportResponse previewVatReport(UUID tenantId, VatReportDto.PreviewVatReportRequest request);

    /**
     * Generate and persist VAT report for a period.
     * Creates report in DRAFT status.
     */
    VatReportDto.VatReportResponse generateVatReport(UUID tenantId, VatReportDto.GenerateVatReportRequest request);

    /**
     * Regenerate an existing draft report with current data.
     */
    VatReportDto.VatReportResponse regenerateVatReport(UUID tenantId, UUID reportId, UUID userId);

    /**
     * Finalize report for submission.
     * Transitions from PREVIEW to GENERATED status.
     */
    VatReportDto.VatReportResponse finalizeReport(UUID tenantId, UUID reportId, UUID userId);

    // === Report Retrieval ===

    /**
     * Get VAT report by ID.
     */
    Optional<VatReportDto.VatReportResponse> getReport(UUID tenantId, UUID reportId);

    /**
     * Get VAT report by period.
     */
    Optional<VatReportDto.VatReportResponse> getReportByPeriod(UUID tenantId, String vatPeriod);

    /**
     * Get VAT report with all transactions (for audit).
     */
    Optional<VatReportDto.VatReportResponse> getReportWithTransactions(UUID tenantId, UUID reportId);

    /**
     * Get all reports for a year.
     */
    List<VatReportDto.VatReportSummary> getReportsForYear(UUID tenantId, int year);

    /**
     * Search reports with filters.
     */
    Page<VatReportDto.VatReportSummary> searchReports(
            UUID tenantId,
            com.surework.accounting.domain.VatReport.ReportStatus status,
            Integer year,
            Pageable pageable);

    /**
     * Get recent reports.
     */
    List<VatReportDto.VatReportSummary> getRecentReports(UUID tenantId, int limit);

    // === Submission and Payment ===

    /**
     * Mark report as submitted to SARS.
     */
    VatReportDto.VatReportResponse submitToSars(UUID tenantId, VatReportDto.SubmitVatReportRequest request, UUID userId);

    /**
     * Record payment against VAT report.
     */
    VatReportDto.VatReportResponse recordPayment(UUID tenantId, VatReportDto.RecordPaymentRequest request);

    // === Adjustments ===

    /**
     * Apply manual adjustment to VAT report.
     * Only allowed for DRAFT or PREVIEW reports.
     */
    VatReportDto.VatReportResponse applyAdjustment(
            UUID tenantId,
            UUID reportId,
            VatReportDto.VatAdjustmentRequest adjustment,
            UUID userId);

    // === Dashboard and Analytics ===

    /**
     * Get VAT dashboard summary.
     */
    VatReportDto.VatDashboardSummary getDashboardSummary(UUID tenantId);

    /**
     * Get VAT period comparison data for charts.
     */
    List<VatReportDto.VatPeriodComparison> getPeriodComparison(UUID tenantId, int year);

    /**
     * Get breakdown for a specific VAT box.
     */
    VatReportDto.VatBoxBreakdown getBoxBreakdown(UUID tenantId, UUID reportId, String boxNumber);

    /**
     * Get overdue reports.
     */
    List<VatReportDto.VatReportSummary> getOverdueReports(UUID tenantId);

    /**
     * Get pending submission reports.
     */
    List<VatReportDto.VatReportSummary> getPendingSubmissionReports(UUID tenantId);

    // === Export ===

    /**
     * Export report in SARS VAT201 format.
     */
    VatReportDto.SarsVat201Export exportForSars(UUID tenantId, UUID reportId);

    /**
     * Generate PDF report for manual filing.
     */
    byte[] generatePdf(UUID tenantId, UUID reportId);

    // === Validation ===

    /**
     * Validate report before finalization.
     * Returns list of validation errors, empty if valid.
     */
    List<String> validateReport(UUID tenantId, UUID reportId);

    /**
     * Check if period is available for new report.
     */
    boolean isPeriodAvailable(UUID tenantId, LocalDate periodStart, LocalDate periodEnd);
}
