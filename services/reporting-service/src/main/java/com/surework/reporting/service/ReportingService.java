package com.surework.reporting.service;

import com.surework.reporting.domain.Report;
import com.surework.reporting.dto.ReportingDto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * Service interface for report generation and management.
 */
public interface ReportingService {

    // ==================== Report Generation ====================

    /**
     * Generate a report synchronously (for small reports).
     */
    ReportResponse generateReport(GenerateReportRequest request, UUID tenantId, UUID userId);

    /**
     * Generate a report asynchronously (for large reports).
     */
    CompletableFuture<ReportResponse> generateReportAsync(GenerateReportRequest request, UUID tenantId, UUID userId);

    /**
     * Get report by ID.
     */
    Optional<ReportResponse> getReport(UUID reportId);

    /**
     * Get report by reference.
     */
    Optional<ReportResponse> getReportByReference(String reference);

    /**
     * Search reports with filters.
     */
    Page<ReportListItem> searchReports(
            UUID tenantId,
            Report.ReportCategory category,
            Report.ReportStatus status,
            Report.ReportType reportType,
            UUID createdBy,
            Pageable pageable);

    /**
     * Get recent reports for a tenant.
     */
    java.util.List<ReportListItem> getRecentReports(UUID tenantId, int limit);

    /**
     * Cancel a pending or generating report.
     */
    void cancelReport(UUID reportId);

    /**
     * Retry a failed report.
     */
    ReportResponse retryReport(UUID reportId);

    /**
     * Get download URL for a completed report.
     */
    DownloadResponse getDownloadUrl(UUID reportId);

    /**
     * Delete a report.
     */
    void deleteReport(UUID reportId);

    // ==================== Report Scheduling ====================

    /**
     * Create a report schedule.
     */
    ScheduleResponse createSchedule(CreateScheduleRequest request, UUID tenantId, UUID userId);

    /**
     * Update a report schedule.
     */
    ScheduleResponse updateSchedule(UUID scheduleId, UpdateScheduleRequest request);

    /**
     * Get schedule by ID.
     */
    Optional<ScheduleResponse> getSchedule(UUID scheduleId);

    /**
     * List schedules for a tenant.
     */
    Page<ScheduleResponse> listSchedules(UUID tenantId, Boolean active, Pageable pageable);

    /**
     * Activate a schedule.
     */
    ScheduleResponse activateSchedule(UUID scheduleId);

    /**
     * Deactivate a schedule.
     */
    ScheduleResponse deactivateSchedule(UUID scheduleId);

    /**
     * Run a scheduled report immediately.
     */
    ReportResponse runScheduleNow(UUID scheduleId, UUID userId);

    /**
     * Delete a schedule.
     */
    void deleteSchedule(UUID scheduleId);

    // ==================== Analytics ====================

    /**
     * Get HR headcount summary.
     */
    HeadcountSummary getHeadcountSummary(UUID tenantId);

    /**
     * Get demographics summary.
     */
    DemographicsSummary getDemographicsSummary(UUID tenantId);

    /**
     * Get turnover analysis.
     */
    TurnoverAnalysis getTurnoverAnalysis(UUID tenantId, LocalDateTime from, LocalDateTime to);

    /**
     * Get payroll summary.
     */
    PayrollSummary getPayrollSummary(UUID tenantId, LocalDateTime from, LocalDateTime to);

    /**
     * Get leave summary.
     */
    LeaveSummary getLeaveSummary(UUID tenantId, LocalDateTime from, LocalDateTime to);

    /**
     * Get attendance summary.
     */
    AttendanceSummary getAttendanceSummary(UUID tenantId, LocalDateTime from, LocalDateTime to);

    /**
     * Get recruitment summary.
     */
    RecruitmentSummary getRecruitmentSummary(UUID tenantId, LocalDateTime from, LocalDateTime to);

    /**
     * Get compliance dashboard.
     */
    ComplianceDashboard getComplianceDashboard(UUID tenantId);

    /**
     * Get executive dashboard.
     */
    ExecutiveDashboard getExecutiveDashboard(UUID tenantId);

    // ==================== Statutory Reports ====================

    /**
     * Generate EMP201 (Monthly PAYE/UIF/SDL).
     */
    EMP201Summary getEMP201Summary(UUID tenantId, int year, int month);

    /**
     * Generate EMP501 (Bi-annual reconciliation).
     */
    EMP501Summary getEMP501Summary(UUID tenantId, int taxYear, boolean isInterim);

    // ==================== Widget Data ====================

    /**
     * Get data for a specific widget.
     */
    WidgetDataResponse getWidgetData(UUID widgetId, UUID tenantId);
}
