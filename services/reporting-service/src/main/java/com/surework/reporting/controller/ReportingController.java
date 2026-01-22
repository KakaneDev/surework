package com.surework.reporting.controller;

import com.surework.reporting.domain.Dashboard;
import com.surework.reporting.domain.Report;
import com.surework.reporting.dto.ReportingDto.*;
import com.surework.reporting.service.DashboardService;
import com.surework.reporting.service.ReportingService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * REST controller for Reporting and Analytics.
 * Provides endpoints for report generation, scheduling, dashboards, and analytics.
 */
@RestController
@RequestMapping("/api/reporting")
public class ReportingController {

    private final ReportingService reportingService;
    private final DashboardService dashboardService;

    public ReportingController(ReportingService reportingService, DashboardService dashboardService) {
        this.reportingService = reportingService;
        this.dashboardService = dashboardService;
    }

    // ==================== Report Generation ====================

    @PostMapping("/reports")
    public ResponseEntity<ReportResponse> generateReport(
            @Valid @RequestBody GenerateReportRequest request,
            @RequestParam UUID tenantId,
            @RequestParam UUID userId) {
        ReportResponse response = reportingService.generateReport(request, tenantId, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/reports/async")
    public ResponseEntity<CompletableFuture<ReportResponse>> generateReportAsync(
            @Valid @RequestBody GenerateReportRequest request,
            @RequestParam UUID tenantId,
            @RequestParam UUID userId) {
        CompletableFuture<ReportResponse> future = reportingService.generateReportAsync(request, tenantId, userId);
        return ResponseEntity.accepted().body(future);
    }

    @GetMapping("/reports/{reportId}")
    public ResponseEntity<ReportResponse> getReport(@PathVariable UUID reportId) {
        return reportingService.getReport(reportId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/reports/reference/{reference}")
    public ResponseEntity<ReportResponse> getReportByReference(@PathVariable String reference) {
        return reportingService.getReportByReference(reference)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/reports")
    public ResponseEntity<Page<ReportListItem>> searchReports(
            @RequestParam UUID tenantId,
            @RequestParam(required = false) Report.ReportCategory category,
            @RequestParam(required = false) Report.ReportStatus status,
            @RequestParam(required = false) Report.ReportType reportType,
            @RequestParam(required = false) UUID createdBy,
            Pageable pageable) {
        Page<ReportListItem> reports = reportingService.searchReports(
                tenantId, category, status, reportType, createdBy, pageable);
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/reports/recent")
    public ResponseEntity<List<ReportListItem>> getRecentReports(
            @RequestParam UUID tenantId,
            @RequestParam(defaultValue = "10") int limit) {
        List<ReportListItem> reports = reportingService.getRecentReports(tenantId, limit);
        return ResponseEntity.ok(reports);
    }

    @PostMapping("/reports/{reportId}/cancel")
    public ResponseEntity<Void> cancelReport(@PathVariable UUID reportId) {
        reportingService.cancelReport(reportId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reports/{reportId}/retry")
    public ResponseEntity<ReportResponse> retryReport(@PathVariable UUID reportId) {
        ReportResponse response = reportingService.retryReport(reportId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/reports/{reportId}/download-url")
    public ResponseEntity<DownloadResponse> getDownloadUrl(@PathVariable UUID reportId) {
        DownloadResponse response = reportingService.getDownloadUrl(reportId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/reports/{reportId}")
    public ResponseEntity<Void> deleteReport(@PathVariable UUID reportId) {
        reportingService.deleteReport(reportId);
        return ResponseEntity.noContent().build();
    }

    // ==================== Report Scheduling ====================

    @PostMapping("/schedules")
    public ResponseEntity<ScheduleResponse> createSchedule(
            @Valid @RequestBody CreateScheduleRequest request,
            @RequestParam UUID tenantId,
            @RequestParam UUID userId) {
        ScheduleResponse response = reportingService.createSchedule(request, tenantId, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/schedules/{scheduleId}")
    public ResponseEntity<ScheduleResponse> updateSchedule(
            @PathVariable UUID scheduleId,
            @Valid @RequestBody UpdateScheduleRequest request) {
        ScheduleResponse response = reportingService.updateSchedule(scheduleId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/schedules/{scheduleId}")
    public ResponseEntity<ScheduleResponse> getSchedule(@PathVariable UUID scheduleId) {
        return reportingService.getSchedule(scheduleId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/schedules")
    public ResponseEntity<Page<ScheduleResponse>> listSchedules(
            @RequestParam UUID tenantId,
            @RequestParam(required = false) Boolean active,
            Pageable pageable) {
        Page<ScheduleResponse> schedules = reportingService.listSchedules(tenantId, active, pageable);
        return ResponseEntity.ok(schedules);
    }

    @PostMapping("/schedules/{scheduleId}/activate")
    public ResponseEntity<ScheduleResponse> activateSchedule(@PathVariable UUID scheduleId) {
        ScheduleResponse response = reportingService.activateSchedule(scheduleId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/schedules/{scheduleId}/deactivate")
    public ResponseEntity<ScheduleResponse> deactivateSchedule(@PathVariable UUID scheduleId) {
        ScheduleResponse response = reportingService.deactivateSchedule(scheduleId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/schedules/{scheduleId}/run")
    public ResponseEntity<ReportResponse> runScheduleNow(
            @PathVariable UUID scheduleId,
            @RequestParam UUID userId) {
        ReportResponse response = reportingService.runScheduleNow(scheduleId, userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/schedules/{scheduleId}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable UUID scheduleId) {
        reportingService.deleteSchedule(scheduleId);
        return ResponseEntity.noContent().build();
    }

    // ==================== Dashboard Management ====================

    @PostMapping("/dashboards")
    public ResponseEntity<DashboardResponse> createDashboard(
            @Valid @RequestBody CreateDashboardRequest request,
            @RequestParam UUID tenantId,
            @RequestParam UUID userId) {
        DashboardResponse response = dashboardService.createDashboard(request, tenantId, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/dashboards/{dashboardId}")
    public ResponseEntity<DashboardResponse> updateDashboard(
            @PathVariable UUID dashboardId,
            @Valid @RequestBody UpdateDashboardRequest request) {
        DashboardResponse response = dashboardService.updateDashboard(dashboardId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/dashboards/{dashboardId}")
    public ResponseEntity<DashboardResponse> getDashboard(@PathVariable UUID dashboardId) {
        return dashboardService.getDashboard(dashboardId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/dashboards/default")
    public ResponseEntity<DashboardResponse> getDefaultDashboard(@RequestParam UUID tenantId) {
        return dashboardService.getDefaultDashboard(tenantId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/dashboards")
    public ResponseEntity<Page<DashboardListItem>> listDashboards(
            @RequestParam UUID tenantId,
            Pageable pageable) {
        Page<DashboardListItem> dashboards = dashboardService.listDashboards(tenantId, pageable);
        return ResponseEntity.ok(dashboards);
    }

    @GetMapping("/dashboards/accessible")
    public ResponseEntity<List<DashboardListItem>> getAccessibleDashboards(
            @RequestParam UUID tenantId,
            @RequestParam UUID userId) {
        List<DashboardListItem> dashboards = dashboardService.getAccessibleDashboards(tenantId, userId);
        return ResponseEntity.ok(dashboards);
    }

    @GetMapping("/dashboards/type/{type}")
    public ResponseEntity<List<DashboardListItem>> getDashboardsByType(
            @RequestParam UUID tenantId,
            @PathVariable Dashboard.DashboardType type) {
        List<DashboardListItem> dashboards = dashboardService.getDashboardsByType(tenantId, type);
        return ResponseEntity.ok(dashboards);
    }

    @PostMapping("/dashboards/{dashboardId}/set-default")
    public ResponseEntity<DashboardResponse> setAsDefault(
            @PathVariable UUID dashboardId,
            @RequestParam UUID tenantId) {
        DashboardResponse response = dashboardService.setAsDefault(dashboardId, tenantId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/dashboards/{dashboardId}/duplicate")
    public ResponseEntity<DashboardResponse> duplicateDashboard(
            @PathVariable UUID dashboardId,
            @RequestParam String newName,
            @RequestParam UUID userId) {
        DashboardResponse response = dashboardService.duplicateDashboard(dashboardId, newName, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/dashboards/{dashboardId}")
    public ResponseEntity<Void> deleteDashboard(@PathVariable UUID dashboardId) {
        dashboardService.deleteDashboard(dashboardId);
        return ResponseEntity.noContent().build();
    }

    // ==================== Widget Management ====================

    @PostMapping("/dashboards/{dashboardId}/widgets")
    public ResponseEntity<WidgetResponse> addWidget(
            @PathVariable UUID dashboardId,
            @Valid @RequestBody CreateWidgetRequest request) {
        WidgetResponse response = dashboardService.addWidget(dashboardId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/widgets/{widgetId}")
    public ResponseEntity<WidgetResponse> updateWidget(
            @PathVariable UUID widgetId,
            @Valid @RequestBody UpdateWidgetRequest request) {
        WidgetResponse response = dashboardService.updateWidget(widgetId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/widgets/{widgetId}")
    public ResponseEntity<WidgetResponse> getWidget(@PathVariable UUID widgetId) {
        return dashboardService.getWidget(widgetId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/widgets/{widgetId}/data")
    public ResponseEntity<WidgetDataResponse> getWidgetData(
            @PathVariable UUID widgetId,
            @RequestParam UUID tenantId) {
        WidgetDataResponse response = reportingService.getWidgetData(widgetId, tenantId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/dashboards/{dashboardId}/widgets/reorder")
    public ResponseEntity<DashboardResponse> reorderWidgets(
            @PathVariable UUID dashboardId,
            @Valid @RequestBody ReorderWidgetsRequest request) {
        DashboardResponse response = dashboardService.reorderWidgets(dashboardId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/dashboards/{dashboardId}/widgets/{widgetId}")
    public ResponseEntity<Void> removeWidget(
            @PathVariable UUID dashboardId,
            @PathVariable UUID widgetId) {
        dashboardService.removeWidget(dashboardId, widgetId);
        return ResponseEntity.noContent().build();
    }

    // ==================== Dashboard Templates ====================

    @PostMapping("/dashboards/templates/hr")
    public ResponseEntity<DashboardResponse> createHRDashboard(
            @RequestParam UUID tenantId,
            @RequestParam UUID userId) {
        DashboardResponse response = dashboardService.createHRDashboard(tenantId, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/dashboards/templates/payroll")
    public ResponseEntity<DashboardResponse> createPayrollDashboard(
            @RequestParam UUID tenantId,
            @RequestParam UUID userId) {
        DashboardResponse response = dashboardService.createPayrollDashboard(tenantId, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/dashboards/templates/leave")
    public ResponseEntity<DashboardResponse> createLeaveDashboard(
            @RequestParam UUID tenantId,
            @RequestParam UUID userId) {
        DashboardResponse response = dashboardService.createLeaveDashboard(tenantId, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/dashboards/templates/executive")
    public ResponseEntity<DashboardResponse> createExecutiveDashboard(
            @RequestParam UUID tenantId,
            @RequestParam UUID userId) {
        DashboardResponse response = dashboardService.createExecutiveDashboard(tenantId, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/dashboards/templates/recruitment")
    public ResponseEntity<DashboardResponse> createRecruitmentDashboard(
            @RequestParam UUID tenantId,
            @RequestParam UUID userId) {
        DashboardResponse response = dashboardService.createRecruitmentDashboard(tenantId, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ==================== Dashboard Sharing ====================

    @PostMapping("/dashboards/{dashboardId}/share")
    public ResponseEntity<DashboardResponse> shareDashboard(
            @PathVariable UUID dashboardId,
            @RequestBody List<String> roles) {
        DashboardResponse response = dashboardService.shareDashboard(dashboardId, roles);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/dashboards/{dashboardId}/unshare")
    public ResponseEntity<DashboardResponse> unshareDashboard(@PathVariable UUID dashboardId) {
        DashboardResponse response = dashboardService.unshareDashboard(dashboardId);
        return ResponseEntity.ok(response);
    }

    // ==================== Analytics Endpoints ====================

    @GetMapping("/analytics/headcount")
    public ResponseEntity<HeadcountSummary> getHeadcountSummary(@RequestParam UUID tenantId) {
        HeadcountSummary summary = reportingService.getHeadcountSummary(tenantId);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/analytics/demographics")
    public ResponseEntity<DemographicsSummary> getDemographicsSummary(@RequestParam UUID tenantId) {
        DemographicsSummary summary = reportingService.getDemographicsSummary(tenantId);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/analytics/turnover")
    public ResponseEntity<TurnoverAnalysis> getTurnoverAnalysis(
            @RequestParam UUID tenantId,
            @RequestParam(required = false) LocalDateTime from,
            @RequestParam(required = false) LocalDateTime to) {
        LocalDateTime dateFrom = from != null ? from : LocalDateTime.now().minusMonths(6);
        LocalDateTime dateTo = to != null ? to : LocalDateTime.now();
        TurnoverAnalysis analysis = reportingService.getTurnoverAnalysis(tenantId, dateFrom, dateTo);
        return ResponseEntity.ok(analysis);
    }

    @GetMapping("/analytics/payroll")
    public ResponseEntity<PayrollSummary> getPayrollSummary(
            @RequestParam UUID tenantId,
            @RequestParam(required = false) LocalDateTime from,
            @RequestParam(required = false) LocalDateTime to) {
        LocalDateTime dateFrom = from != null ? from : LocalDateTime.now().minusMonths(1);
        LocalDateTime dateTo = to != null ? to : LocalDateTime.now();
        PayrollSummary summary = reportingService.getPayrollSummary(tenantId, dateFrom, dateTo);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/analytics/leave")
    public ResponseEntity<LeaveSummary> getLeaveSummary(
            @RequestParam UUID tenantId,
            @RequestParam(required = false) LocalDateTime from,
            @RequestParam(required = false) LocalDateTime to) {
        LocalDateTime dateFrom = from != null ? from : LocalDateTime.now().minusMonths(1);
        LocalDateTime dateTo = to != null ? to : LocalDateTime.now();
        LeaveSummary summary = reportingService.getLeaveSummary(tenantId, dateFrom, dateTo);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/analytics/attendance")
    public ResponseEntity<AttendanceSummary> getAttendanceSummary(
            @RequestParam UUID tenantId,
            @RequestParam(required = false) LocalDateTime from,
            @RequestParam(required = false) LocalDateTime to) {
        LocalDateTime dateFrom = from != null ? from : LocalDateTime.now().minusMonths(1);
        LocalDateTime dateTo = to != null ? to : LocalDateTime.now();
        AttendanceSummary summary = reportingService.getAttendanceSummary(tenantId, dateFrom, dateTo);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/analytics/recruitment")
    public ResponseEntity<RecruitmentSummary> getRecruitmentSummary(
            @RequestParam UUID tenantId,
            @RequestParam(required = false) LocalDateTime from,
            @RequestParam(required = false) LocalDateTime to) {
        LocalDateTime dateFrom = from != null ? from : LocalDateTime.now().minusMonths(3);
        LocalDateTime dateTo = to != null ? to : LocalDateTime.now();
        RecruitmentSummary summary = reportingService.getRecruitmentSummary(tenantId, dateFrom, dateTo);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/analytics/compliance")
    public ResponseEntity<ComplianceDashboard> getComplianceDashboard(@RequestParam UUID tenantId) {
        ComplianceDashboard dashboard = reportingService.getComplianceDashboard(tenantId);
        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/analytics/executive")
    public ResponseEntity<ExecutiveDashboard> getExecutiveDashboard(@RequestParam UUID tenantId) {
        ExecutiveDashboard dashboard = reportingService.getExecutiveDashboard(tenantId);
        return ResponseEntity.ok(dashboard);
    }

    // ==================== Statutory Reports ====================

    @GetMapping("/statutory/emp201")
    public ResponseEntity<EMP201Summary> getEMP201Summary(
            @RequestParam UUID tenantId,
            @RequestParam int year,
            @RequestParam int month) {
        EMP201Summary summary = reportingService.getEMP201Summary(tenantId, year, month);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/statutory/emp501")
    public ResponseEntity<EMP501Summary> getEMP501Summary(
            @RequestParam UUID tenantId,
            @RequestParam int taxYear,
            @RequestParam(defaultValue = "false") boolean isInterim) {
        EMP501Summary summary = reportingService.getEMP501Summary(tenantId, taxYear, isInterim);
        return ResponseEntity.ok(summary);
    }
}
