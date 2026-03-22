package com.surework.reporting.dto;

import com.surework.reporting.domain.Dashboard;
import com.surework.reporting.domain.DashboardWidget;
import com.surework.reporting.domain.Report;
import com.surework.reporting.domain.ReportSchedule;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * DTOs for Reporting and Analytics Service.
 */
public sealed interface ReportingDto {

    // ==================== Report DTOs ====================

    record GenerateReportRequest(
            @NotNull Report.ReportType reportType,
            @NotNull Report.OutputFormat outputFormat,
            LocalDateTime dateFrom,
            LocalDateTime dateTo,
            Map<String, Object> parameters,
            Report.ReportVisibility visibility,
            String name,
            String description
    ) implements ReportingDto {}

    record ReportResponse(
            UUID id,
            String reference,
            String name,
            String description,
            Report.ReportCategory category,
            Report.ReportType reportType,
            Report.ReportStatus status,
            Report.OutputFormat outputFormat,
            LocalDateTime dateFrom,
            LocalDateTime dateTo,
            Map<String, Object> parameters,
            String filePath,
            Long fileSize,
            String contentType,
            Integer rowCount,
            Integer pageCount,
            Long generationTimeMs,
            String errorMessage,
            Report.ReportVisibility visibility,
            LocalDateTime expiresAt,
            boolean scheduled,
            UUID createdBy,
            LocalDateTime createdAt,
            LocalDateTime completedAt
    ) implements ReportingDto {}

    record ReportListItem(
            UUID id,
            String reference,
            String name,
            Report.ReportCategory category,
            Report.ReportType reportType,
            Report.ReportStatus status,
            Report.OutputFormat outputFormat,
            Long fileSize,
            LocalDateTime createdAt,
            LocalDateTime completedAt
    ) implements ReportingDto {}

    // ==================== Schedule DTOs ====================

    record CreateScheduleRequest(
            @NotBlank String name,
            String description,
            @NotNull Report.ReportType reportType,
            @NotNull Report.OutputFormat outputFormat,
            Map<String, Object> parameters,
            @NotNull ReportSchedule.ScheduleFrequency frequency,
            LocalTime runTime,
            Integer dayOfWeek,
            Integer dayOfMonth,
            String cronExpression,
            @NotNull ReportSchedule.DateRangeType dateRangeType,
            @Valid DistributionSettings distribution
    ) implements ReportingDto {}

    record UpdateScheduleRequest(
            String name,
            String description,
            Report.OutputFormat outputFormat,
            Map<String, Object> parameters,
            ReportSchedule.ScheduleFrequency frequency,
            LocalTime runTime,
            Integer dayOfWeek,
            Integer dayOfMonth,
            String cronExpression,
            ReportSchedule.DateRangeType dateRangeType,
            @Valid DistributionSettings distribution,
            Boolean active
    ) implements ReportingDto {}

    record DistributionSettings(
            List<@Email String> emailRecipients,
            String emailSubject,
            String emailBody,
            boolean attachReport,
            boolean includeDownloadLink
    ) implements ReportingDto {}

    record ScheduleResponse(
            UUID id,
            String name,
            String description,
            Report.ReportType reportType,
            Report.OutputFormat outputFormat,
            Map<String, Object> parameters,
            ReportSchedule.ScheduleFrequency frequency,
            LocalTime runTime,
            Integer dayOfWeek,
            Integer dayOfMonth,
            String cronExpression,
            ReportSchedule.DateRangeType dateRangeType,
            LocalDateTime lastRunAt,
            LocalDateTime nextRunAt,
            Report.ReportStatus lastRunStatus,
            Integer runCount,
            Integer failureCount,
            List<String> emailRecipients,
            boolean attachReport,
            boolean active,
            UUID createdBy,
            LocalDateTime createdAt
    ) implements ReportingDto {}

    // ==================== Dashboard DTOs ====================

    record CreateDashboardRequest(
            @NotBlank String name,
            String description,
            @NotNull Dashboard.DashboardType dashboardType,
            Map<String, Object> layout,
            boolean isDefault,
            boolean shared,
            List<String> sharedWithRoles,
            boolean autoRefresh,
            @Min(30) Integer refreshIntervalSeconds
    ) implements ReportingDto {}

    record UpdateDashboardRequest(
            String name,
            String description,
            Map<String, Object> layout,
            Boolean isDefault,
            Boolean shared,
            List<String> sharedWithRoles,
            Boolean autoRefresh,
            Integer refreshIntervalSeconds
    ) implements ReportingDto {}

    record DashboardResponse(
            UUID id,
            String name,
            String description,
            Dashboard.DashboardType dashboardType,
            Map<String, Object> layout,
            List<WidgetResponse> widgets,
            boolean isDefault,
            boolean shared,
            List<String> sharedWithRoles,
            boolean autoRefresh,
            Integer refreshIntervalSeconds,
            UUID createdBy,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) implements ReportingDto {}

    record DashboardListItem(
            UUID id,
            String name,
            Dashboard.DashboardType dashboardType,
            int widgetCount,
            boolean isDefault,
            boolean shared,
            LocalDateTime updatedAt
    ) implements ReportingDto {}

    // ==================== Widget DTOs ====================

    record CreateWidgetRequest(
            @NotBlank String title,
            String description,
            @NotNull DashboardWidget.WidgetType widgetType,
            @NotNull DashboardWidget.DataSource dataSource,
            Map<String, Object> config,
            Integer gridX,
            Integer gridY,
            @Min(1) @Max(12) Integer gridWidth,
            @Min(1) @Max(12) Integer gridHeight,
            Map<String, Object> filters,
            @Min(30) Integer cacheTtlSeconds
    ) implements ReportingDto {}

    record UpdateWidgetRequest(
            String title,
            String description,
            Map<String, Object> config,
            Integer gridX,
            Integer gridY,
            Integer gridWidth,
            Integer gridHeight,
            Map<String, Object> filters,
            Integer cacheTtlSeconds,
            Boolean showTitle,
            Boolean showBorder,
            String backgroundColor,
            String textColor
    ) implements ReportingDto {}

    record WidgetResponse(
            UUID id,
            String title,
            String description,
            DashboardWidget.WidgetType widgetType,
            DashboardWidget.DataSource dataSource,
            Map<String, Object> config,
            Integer position,
            Integer gridX,
            Integer gridY,
            Integer gridWidth,
            Integer gridHeight,
            Map<String, Object> filters,
            Integer cacheTtlSeconds,
            LocalDateTime lastDataRefresh,
            boolean showTitle,
            boolean showBorder,
            String backgroundColor,
            String textColor,
            boolean active
    ) implements ReportingDto {}

    record WidgetDataResponse(
            UUID widgetId,
            DashboardWidget.DataSource dataSource,
            Object data,
            LocalDateTime generatedAt,
            LocalDateTime expiresAt
    ) implements ReportingDto {}

    record ReorderWidgetsRequest(
            @NotEmpty List<UUID> widgetIds
    ) implements ReportingDto {}

    // ==================== Analytics DTOs ====================

    // HR Analytics
    record HeadcountSummary(
            int totalHeadcount,
            int activeEmployees,
            int onLeave,
            int onProbation,
            int newHiresThisMonth,
            int terminationsThisMonth,
            BigDecimal turnoverRatePercent,
            Map<String, Integer> byDepartment,
            Map<String, Integer> byLocation,
            Map<String, Integer> byEmploymentType
    ) implements ReportingDto {}

    record DemographicsSummary(
            Map<String, Integer> byGender,
            Map<String, Integer> byRace,
            Map<String, Integer> byAgeGroup,
            Map<String, Integer> byTenure,
            Map<String, Integer> byDisabilityStatus,
            BigDecimal averageAge,
            BigDecimal averageTenureYears
    ) implements ReportingDto {}

    record TurnoverAnalysis(
            int totalTerminations,
            BigDecimal turnoverRatePercent,
            BigDecimal voluntaryRatePercent,
            BigDecimal involuntaryRatePercent,
            Map<String, Integer> byReason,
            Map<String, Integer> byDepartment,
            Map<String, Integer> byTenure,
            List<TurnoverTrend> monthlyTrend
    ) implements ReportingDto {}

    record TurnoverTrend(
            String month,
            int hires,
            int terminations,
            BigDecimal turnoverRate
    ) implements ReportingDto {}

    // Payroll Analytics
    record PayrollSummary(
            BigDecimal totalGrossPay,
            BigDecimal totalNetPay,
            BigDecimal totalDeductions,
            BigDecimal totalPAYE,
            BigDecimal totalUIF,
            BigDecimal totalSDL,
            BigDecimal totalEmployerContributions,
            BigDecimal totalCostToCompany,
            int employeesProcessed,
            Map<String, BigDecimal> byDepartment,
            List<PayrollTrend> monthlyTrend
    ) implements ReportingDto {}

    record PayrollTrend(
            String month,
            BigDecimal grossPay,
            BigDecimal netPay,
            BigDecimal costToCompany
    ) implements ReportingDto {}

    // Leave Analytics
    record LeaveSummary(
            int totalLeaveRequestsThisMonth,
            int pendingRequests,
            int approvedRequests,
            int rejectedRequests,
            BigDecimal averageLeaveBalance,
            BigDecimal sickLeaveUtilizationPercent,
            Map<String, Integer> byLeaveType,
            Map<String, Integer> byDepartment,
            List<LeaveTrend> monthlyTrend
    ) implements ReportingDto {}

    record LeaveTrend(
            String month,
            int totalDaysTaken,
            int sickDays,
            int annualDays,
            int otherDays
    ) implements ReportingDto {}

    // Time & Attendance Analytics
    record AttendanceSummary(
            BigDecimal attendanceRatePercent,
            int lateArrivals,
            int earlyDepartures,
            int absences,
            BigDecimal totalOvertimeHours,
            BigDecimal averageHoursWorked,
            Map<String, BigDecimal> attendanceByDepartment,
            List<AttendanceTrend> weeklyTrend
    ) implements ReportingDto {}

    record AttendanceTrend(
            String week,
            BigDecimal attendanceRate,
            BigDecimal overtimeHours,
            int lateCount
    ) implements ReportingDto {}

    // Recruitment Analytics
    record RecruitmentSummary(
            int openPositions,
            int totalApplications,
            int interviewsScheduled,
            int offersExtended,
            int hiresMade,
            BigDecimal averageDaysToHire,
            BigDecimal offerAcceptanceRatePercent,
            Map<String, Integer> applicationsBySource,
            Map<String, Integer> byDepartment,
            List<RecruitmentTrend> monthlyTrend
    ) implements ReportingDto {}

    record RecruitmentTrend(
            String month,
            int applications,
            int interviews,
            int offers,
            int hires
    ) implements ReportingDto {}

    // ==================== Statutory Report DTOs ====================

    record EMP201Summary(
            String taxPeriod,
            int employeeCount,
            BigDecimal totalRemuneration,
            BigDecimal paye,
            BigDecimal sdl,
            BigDecimal uif,
            BigDecimal uifEmployer,
            BigDecimal totalPayable,
            LocalDateTime dueDate,
            boolean submitted,
            LocalDateTime submittedAt
    ) implements ReportingDto {}

    record EMP501Summary(
            String taxYear,
            String period, // "Interim" or "Annual"
            int employeeCount,
            BigDecimal totalRemuneration,
            BigDecimal totalPAYE,
            BigDecimal totalUIF,
            BigDecimal totalSDL,
            int irp5sGenerated,
            LocalDateTime dueDate,
            boolean submitted
    ) implements ReportingDto {}

    record ComplianceDashboard(
            int documentsExpiringSoon,
            int expiredDocuments,
            int pendingAcknowledgments,
            int overdueTraining,
            BigDecimal overallComplianceScore,
            List<ComplianceAlert> alerts,
            Map<String, BigDecimal> complianceByCategory
    ) implements ReportingDto {}

    record ComplianceAlert(
            String type,
            String severity,
            String message,
            LocalDateTime dueDate,
            String actionRequired
    ) implements ReportingDto {}

    // ==================== Executive Dashboard DTOs ====================

    record ExecutiveDashboard(
            HeadcountSummary headcount,
            PayrollSummary payroll,
            LeaveSummary leave,
            AttendanceSummary attendance,
            RecruitmentSummary recruitment,
            ComplianceDashboard compliance,
            List<KeyMetric> keyMetrics,
            List<Alert> alerts
    ) implements ReportingDto {}

    record KeyMetric(
            String name,
            String value,
            String trend, // "up", "down", "stable"
            BigDecimal changePercent,
            String period
    ) implements ReportingDto {}

    record Alert(
            String type,
            String severity, // "info", "warning", "critical"
            String title,
            String message,
            LocalDateTime timestamp
    ) implements ReportingDto {}

    // ==================== Report Export DTOs ====================

    record ExportOptions(
            Report.OutputFormat format,
            boolean includeCharts,
            boolean includeSummary,
            boolean includeDetails,
            String paperSize,
            String orientation,
            String dateFormat,
            String numberFormat,
            String currencyCode
    ) implements ReportingDto {}

    record DownloadResponse(
            UUID reportId,
            String downloadUrl,
            String fileName,
            String contentType,
            Long fileSize,
            LocalDateTime expiresAt
    ) implements ReportingDto {}
}
