package com.surework.reporting.service;

import com.surework.reporting.domain.Report;
import com.surework.reporting.domain.ReportSchedule;
import com.surework.reporting.dto.ReportingDto.*;
import com.surework.reporting.repository.ReportRepository;
import com.surework.reporting.repository.ReportScheduleRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.CompletableFuture;

/**
 * Implementation of ReportingService.
 * Provides comprehensive reporting and analytics for South African SMEs.
 */
@Service
@Transactional
public class ReportingServiceImpl implements ReportingService {

    private final ReportRepository reportRepository;
    private final ReportScheduleRepository scheduleRepository;
    private final ReportGeneratorService generatorService;

    public ReportingServiceImpl(
            ReportRepository reportRepository,
            ReportScheduleRepository scheduleRepository,
            ReportGeneratorService generatorService) {
        this.reportRepository = reportRepository;
        this.scheduleRepository = scheduleRepository;
        this.generatorService = generatorService;
    }

    // ==================== Report Generation ====================

    @Override
    public ReportResponse generateReport(GenerateReportRequest request, UUID tenantId, UUID userId) {
        Report report = createReportEntity(request, tenantId, userId);
        report = reportRepository.save(report);

        try {
            report.startGeneration();
            generatorService.generateReport(report);
            report = reportRepository.save(report);
        } catch (Exception e) {
            report.fail(e.getMessage());
            reportRepository.save(report);
            throw new RuntimeException("Report generation failed: " + e.getMessage(), e);
        }

        return toReportResponse(report);
    }

    @Override
    @Async
    public CompletableFuture<ReportResponse> generateReportAsync(GenerateReportRequest request, UUID tenantId, UUID userId) {
        return CompletableFuture.supplyAsync(() -> generateReport(request, tenantId, userId));
    }

    private Report createReportEntity(GenerateReportRequest request, UUID tenantId, UUID userId) {
        Report report = new Report();
        report.setTenantId(tenantId);
        report.setName(request.name() != null ? request.name() : generateDefaultName(request.reportType()));
        report.setDescription(request.description());
        report.setCategory(getCategoryForReportType(request.reportType()));
        report.setReportType(request.reportType());
        report.setOutputFormat(request.outputFormat());
        report.setDateFrom(request.dateFrom());
        report.setDateTo(request.dateTo());
        report.setParameters(request.parameters() != null ? request.parameters() : new HashMap<>());
        report.setVisibility(request.visibility() != null ? request.visibility() : Report.ReportVisibility.PRIVATE);
        report.setCreatedBy(userId);
        report.setExpiresAt(LocalDateTime.now().plusDays(30)); // Reports expire after 30 days
        return report;
    }

    private String generateDefaultName(Report.ReportType type) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        return type.name().replace("_", " ") + " - " + timestamp;
    }

    private Report.ReportCategory getCategoryForReportType(Report.ReportType type) {
        return switch (type) {
            case HEADCOUNT, TURNOVER, DEMOGRAPHICS, SKILLS_MATRIX, TRAINING_SUMMARY,
                 PROBATION_STATUS, EMPLOYEE_DIRECTORY -> Report.ReportCategory.HR;
            case PAYROLL_REGISTER, PAYROLL_SUMMARY, PAYSLIP_BATCH, STATUTORY_DEDUCTIONS,
                 COST_TO_COMPANY, PAYROLL_VARIANCE, YEAR_TO_DATE, PAYROLL_JOURNAL -> Report.ReportCategory.PAYROLL;
            case LEAVE_BALANCE, LEAVE_UTILIZATION, LEAVE_LIABILITY, SICK_LEAVE_ANALYSIS,
                 ABSENCE_TRENDS -> Report.ReportCategory.LEAVE;
            case ATTENDANCE_SUMMARY, OVERTIME_REPORT, LATE_ARRIVALS, TIMESHEET_COMPLIANCE,
                 HOURS_WORKED -> Report.ReportCategory.TIME_ATTENDANCE;
            case RECRUITMENT_PIPELINE, TIME_TO_HIRE, SOURCE_EFFECTIVENESS, OFFER_ACCEPTANCE -> Report.ReportCategory.RECRUITMENT;
            case EMP201, EMP501, UI19, IRP5, IT3A, EEA2, EEA4 -> Report.ReportCategory.STATUTORY;
            case LABOR_COST_ANALYSIS, DEPARTMENT_BUDGET, HEADCOUNT_FORECAST -> Report.ReportCategory.FINANCIAL;
            case AD_HOC, CUSTOM_QUERY -> Report.ReportCategory.CUSTOM;
        };
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ReportResponse> getReport(UUID reportId) {
        return reportRepository.findById(reportId).map(this::toReportResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ReportResponse> getReportByReference(String reference) {
        return reportRepository.findByReference(reference).map(this::toReportResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReportListItem> searchReports(
            UUID tenantId, Report.ReportCategory category, Report.ReportStatus status,
            Report.ReportType reportType, UUID createdBy, Pageable pageable) {
        return reportRepository.searchReports(tenantId, category, status, reportType, createdBy, pageable)
                .map(this::toReportListItem);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReportListItem> getRecentReports(UUID tenantId, int limit) {
        return reportRepository.findTop10ByTenantIdOrderByCreatedAtDesc(tenantId).stream()
                .map(this::toReportListItem)
                .limit(limit)
                .toList();
    }

    @Override
    public void cancelReport(UUID reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found"));

        if (report.getStatus() == Report.ReportStatus.PENDING ||
            report.getStatus() == Report.ReportStatus.QUEUED ||
            report.getStatus() == Report.ReportStatus.GENERATING) {
            report.cancel();
            reportRepository.save(report);
        } else {
            throw new IllegalStateException("Cannot cancel report in status: " + report.getStatus());
        }
    }

    @Override
    public ReportResponse retryReport(UUID reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found"));

        if (!report.canRetry()) {
            throw new IllegalStateException("Report cannot be retried");
        }

        report.setStatus(Report.ReportStatus.PENDING);
        report.setErrorMessage(null);
        report = reportRepository.save(report);

        try {
            report.startGeneration();
            generatorService.generateReport(report);
            report = reportRepository.save(report);
        } catch (Exception e) {
            report.fail(e.getMessage());
            reportRepository.save(report);
        }

        return toReportResponse(report);
    }

    @Override
    @Transactional(readOnly = true)
    public DownloadResponse getDownloadUrl(UUID reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found"));

        if (report.getStatus() != Report.ReportStatus.COMPLETED) {
            throw new IllegalStateException("Report is not ready for download");
        }

        // Generate pre-signed URL or direct download link
        String fileName = report.getName().replaceAll("[^a-zA-Z0-9.-]", "_") +
                         getFileExtension(report.getOutputFormat());

        return new DownloadResponse(
                report.getId(),
                "/api/reports/" + reportId + "/download",
                fileName,
                getContentType(report.getOutputFormat()),
                report.getFileSize(),
                LocalDateTime.now().plusHours(1)
        );
    }

    private String getFileExtension(Report.OutputFormat format) {
        return switch (format) {
            case PDF -> ".pdf";
            case EXCEL -> ".xlsx";
            case CSV -> ".csv";
            case JSON -> ".json";
            case HTML -> ".html";
        };
    }

    private String getContentType(Report.OutputFormat format) {
        return switch (format) {
            case PDF -> "application/pdf";
            case EXCEL -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case CSV -> "text/csv";
            case JSON -> "application/json";
            case HTML -> "text/html";
        };
    }

    @Override
    public void deleteReport(UUID reportId) {
        reportRepository.deleteById(reportId);
    }

    // ==================== Report Scheduling ====================

    @Override
    public ScheduleResponse createSchedule(CreateScheduleRequest request, UUID tenantId, UUID userId) {
        ReportSchedule schedule = new ReportSchedule();
        schedule.setTenantId(tenantId);
        schedule.setName(request.name());
        schedule.setDescription(request.description());
        schedule.setReportType(request.reportType());
        schedule.setOutputFormat(request.outputFormat());
        schedule.setParameters(request.parameters() != null ? request.parameters() : new HashMap<>());
        schedule.setFrequency(request.frequency());
        schedule.setRunTime(request.runTime());
        schedule.setDayOfWeek(request.dayOfWeek());
        schedule.setDayOfMonth(request.dayOfMonth());
        schedule.setCronExpression(request.cronExpression());
        schedule.setDateRangeType(request.dateRangeType());

        if (request.distribution() != null) {
            schedule.setEmailRecipients(request.distribution().emailRecipients());
            schedule.setEmailSubject(request.distribution().emailSubject());
            schedule.setEmailBody(request.distribution().emailBody());
            schedule.setAttachReport(request.distribution().attachReport());
            schedule.setIncludeDownloadLink(request.distribution().includeDownloadLink());
        }

        schedule.setCreatedBy(userId);
        schedule.calculateNextRunAt();
        schedule = scheduleRepository.save(schedule);

        return toScheduleResponse(schedule);
    }

    @Override
    public ScheduleResponse updateSchedule(UUID scheduleId, UpdateScheduleRequest request) {
        ReportSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found"));

        if (request.name() != null) schedule.setName(request.name());
        if (request.description() != null) schedule.setDescription(request.description());
        if (request.outputFormat() != null) schedule.setOutputFormat(request.outputFormat());
        if (request.parameters() != null) schedule.setParameters(request.parameters());
        if (request.frequency() != null) schedule.setFrequency(request.frequency());
        if (request.runTime() != null) schedule.setRunTime(request.runTime());
        if (request.dayOfWeek() != null) schedule.setDayOfWeek(request.dayOfWeek());
        if (request.dayOfMonth() != null) schedule.setDayOfMonth(request.dayOfMonth());
        if (request.cronExpression() != null) schedule.setCronExpression(request.cronExpression());
        if (request.dateRangeType() != null) schedule.setDateRangeType(request.dateRangeType());

        if (request.distribution() != null) {
            schedule.setEmailRecipients(request.distribution().emailRecipients());
            schedule.setEmailSubject(request.distribution().emailSubject());
            schedule.setEmailBody(request.distribution().emailBody());
            schedule.setAttachReport(request.distribution().attachReport());
            schedule.setIncludeDownloadLink(request.distribution().includeDownloadLink());
        }

        if (request.active() != null) {
            if (request.active()) {
                schedule.activate();
            } else {
                schedule.deactivate();
            }
        }

        schedule.setUpdatedAt(LocalDateTime.now());
        schedule = scheduleRepository.save(schedule);
        return toScheduleResponse(schedule);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ScheduleResponse> getSchedule(UUID scheduleId) {
        return scheduleRepository.findById(scheduleId).map(this::toScheduleResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ScheduleResponse> listSchedules(UUID tenantId, Boolean active, Pageable pageable) {
        if (active != null) {
            return scheduleRepository.findByTenantIdAndActive(tenantId, active, pageable)
                    .map(this::toScheduleResponse);
        }
        return scheduleRepository.findByTenantId(tenantId, pageable)
                .map(this::toScheduleResponse);
    }

    @Override
    public ScheduleResponse activateSchedule(UUID scheduleId) {
        ReportSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found"));
        schedule.activate();
        schedule = scheduleRepository.save(schedule);
        return toScheduleResponse(schedule);
    }

    @Override
    public ScheduleResponse deactivateSchedule(UUID scheduleId) {
        ReportSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found"));
        schedule.deactivate();
        schedule = scheduleRepository.save(schedule);
        return toScheduleResponse(schedule);
    }

    @Override
    public ReportResponse runScheduleNow(UUID scheduleId, UUID userId) {
        ReportSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found"));

        GenerateReportRequest request = new GenerateReportRequest(
                schedule.getReportType(),
                schedule.getOutputFormat(),
                calculateDateFrom(schedule.getDateRangeType()),
                LocalDateTime.now(),
                schedule.getParameters(),
                Report.ReportVisibility.PRIVATE,
                schedule.getName() + " (Manual Run)",
                "Generated manually from schedule"
        );

        return generateReport(request, schedule.getTenantId(), userId);
    }

    private LocalDateTime calculateDateFrom(ReportSchedule.DateRangeType dateRangeType) {
        return switch (dateRangeType) {
            case PREVIOUS_DAY -> LocalDateTime.now().minusDays(1).withHour(0).withMinute(0);
            case PREVIOUS_WEEK -> LocalDateTime.now().minusWeeks(1);
            case PREVIOUS_MONTH -> LocalDateTime.now().minusMonths(1);
            case PREVIOUS_QUARTER -> LocalDateTime.now().minusMonths(3);
            case PREVIOUS_YEAR -> LocalDateTime.now().minusYears(1);
            case MONTH_TO_DATE -> LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0);
            case QUARTER_TO_DATE -> LocalDateTime.now().minusMonths((LocalDateTime.now().getMonthValue() - 1) % 3);
            case YEAR_TO_DATE -> LocalDateTime.now().withDayOfYear(1).withHour(0).withMinute(0);
            default -> LocalDateTime.now().minusMonths(1);
        };
    }

    @Override
    public void deleteSchedule(UUID scheduleId) {
        scheduleRepository.deleteById(scheduleId);
    }

    // ==================== Analytics ====================

    @Override
    @Cacheable(value = "headcount", key = "#tenantId")
    @Transactional(readOnly = true)
    public HeadcountSummary getHeadcountSummary(UUID tenantId) {
        // In production, this would aggregate data from employee-service
        // For now, return sample data structure
        return new HeadcountSummary(
                150,  // totalHeadcount
                145,  // activeEmployees
                5,    // onLeave
                12,   // onProbation
                8,    // newHiresThisMonth
                2,    // terminationsThisMonth
                new BigDecimal("12.5"),  // turnoverRatePercent
                Map.of("Engineering", 45, "Sales", 30, "HR", 15, "Finance", 20, "Operations", 40),
                Map.of("Johannesburg", 80, "Cape Town", 50, "Durban", 20),
                Map.of("Permanent", 130, "Contract", 15, "Part-time", 5)
        );
    }

    @Override
    @Cacheable(value = "demographics", key = "#tenantId")
    @Transactional(readOnly = true)
    public DemographicsSummary getDemographicsSummary(UUID tenantId) {
        return new DemographicsSummary(
                Map.of("Male", 75, "Female", 73, "Other", 2),
                Map.of("African", 90, "Coloured", 25, "Indian", 20, "White", 15),
                Map.of("18-25", 20, "26-35", 55, "36-45", 45, "46-55", 25, "55+", 5),
                Map.of("0-1 years", 30, "1-3 years", 45, "3-5 years", 35, "5-10 years", 25, "10+ years", 15),
                Map.of("None", 140, "Physical", 5, "Sensory", 3, "Other", 2),
                new BigDecimal("34.5"),  // averageAge
                new BigDecimal("3.2")    // averageTenureYears
        );
    }

    @Override
    @Cacheable(value = "turnover", key = "#tenantId + '-' + #from + '-' + #to")
    @Transactional(readOnly = true)
    public TurnoverAnalysis getTurnoverAnalysis(UUID tenantId, LocalDateTime from, LocalDateTime to) {
        List<TurnoverTrend> trend = List.of(
                new TurnoverTrend("Jan", 5, 2, new BigDecimal("1.3")),
                new TurnoverTrend("Feb", 3, 1, new BigDecimal("0.7")),
                new TurnoverTrend("Mar", 4, 3, new BigDecimal("2.0")),
                new TurnoverTrend("Apr", 6, 2, new BigDecimal("1.3")),
                new TurnoverTrend("May", 4, 4, new BigDecimal("2.7")),
                new TurnoverTrend("Jun", 5, 2, new BigDecimal("1.3"))
        );

        return new TurnoverAnalysis(
                14,  // totalTerminations
                new BigDecimal("9.3"),  // turnoverRatePercent
                new BigDecimal("6.0"),  // voluntaryRatePercent
                new BigDecimal("3.3"),  // involuntaryRatePercent
                Map.of("Resignation", 9, "Dismissal", 3, "Retrenchment", 2),
                Map.of("Engineering", 4, "Sales", 5, "HR", 2, "Finance", 1, "Operations", 2),
                Map.of("0-1 years", 6, "1-3 years", 5, "3-5 years", 2, "5+ years", 1),
                trend
        );
    }

    @Override
    @Cacheable(value = "payroll", key = "#tenantId + '-' + #from + '-' + #to")
    @Transactional(readOnly = true)
    public PayrollSummary getPayrollSummary(UUID tenantId, LocalDateTime from, LocalDateTime to) {
        List<PayrollTrend> trend = List.of(
                new PayrollTrend("Jan", new BigDecimal("4500000"), new BigDecimal("3200000"), new BigDecimal("5400000")),
                new PayrollTrend("Feb", new BigDecimal("4520000"), new BigDecimal("3215000"), new BigDecimal("5424000")),
                new PayrollTrend("Mar", new BigDecimal("4550000"), new BigDecimal("3235000"), new BigDecimal("5460000")),
                new PayrollTrend("Apr", new BigDecimal("4600000"), new BigDecimal("3270000"), new BigDecimal("5520000")),
                new PayrollTrend("May", new BigDecimal("4650000"), new BigDecimal("3305000"), new BigDecimal("5580000")),
                new PayrollTrend("Jun", new BigDecimal("4700000"), new BigDecimal("3340000"), new BigDecimal("5640000"))
        );

        return new PayrollSummary(
                new BigDecimal("4700000"),   // totalGrossPay
                new BigDecimal("3340000"),   // totalNetPay
                new BigDecimal("1360000"),   // totalDeductions
                new BigDecimal("850000"),    // totalPAYE
                new BigDecimal("47000"),     // totalUIF (1% employee)
                new BigDecimal("47000"),     // totalSDL (1%)
                new BigDecimal("94000"),     // totalEmployerContributions (UIF 1% + other)
                new BigDecimal("5640000"),   // totalCostToCompany
                150,                         // employeesProcessed
                Map.of(
                        "Engineering", new BigDecimal("1800000"),
                        "Sales", new BigDecimal("1200000"),
                        "HR", new BigDecimal("450000"),
                        "Finance", new BigDecimal("600000"),
                        "Operations", new BigDecimal("650000")
                ),
                trend
        );
    }

    @Override
    @Cacheable(value = "leave", key = "#tenantId + '-' + #from + '-' + #to")
    @Transactional(readOnly = true)
    public LeaveSummary getLeaveSummary(UUID tenantId, LocalDateTime from, LocalDateTime to) {
        List<LeaveTrend> trend = List.of(
                new LeaveTrend("Jan", 120, 25, 85, 10),
                new LeaveTrend("Feb", 95, 30, 55, 10),
                new LeaveTrend("Mar", 110, 28, 70, 12),
                new LeaveTrend("Apr", 130, 22, 95, 13),
                new LeaveTrend("May", 105, 35, 60, 10),
                new LeaveTrend("Jun", 140, 20, 105, 15)
        );

        return new LeaveSummary(
                45,   // totalLeaveRequestsThisMonth
                8,    // pendingRequests
                35,   // approvedRequests
                2,    // rejectedRequests
                new BigDecimal("12.5"),  // averageLeaveBalance
                new BigDecimal("45.0"),  // sickLeaveUtilizationPercent
                Map.of("Annual", 580, "Sick", 160, "Family Responsibility", 35, "Unpaid", 25),
                Map.of("Engineering", 200, "Sales", 180, "HR", 80, "Finance", 120, "Operations", 220),
                trend
        );
    }

    @Override
    @Cacheable(value = "attendance", key = "#tenantId + '-' + #from + '-' + #to")
    @Transactional(readOnly = true)
    public AttendanceSummary getAttendanceSummary(UUID tenantId, LocalDateTime from, LocalDateTime to) {
        List<AttendanceTrend> trend = List.of(
                new AttendanceTrend("Week 1", new BigDecimal("96.5"), new BigDecimal("125"), 12),
                new AttendanceTrend("Week 2", new BigDecimal("97.0"), new BigDecimal("140"), 8),
                new AttendanceTrend("Week 3", new BigDecimal("95.8"), new BigDecimal("155"), 15),
                new AttendanceTrend("Week 4", new BigDecimal("96.2"), new BigDecimal("130"), 10)
        );

        return new AttendanceSummary(
                new BigDecimal("96.4"),  // attendanceRatePercent
                45,                      // lateArrivals
                12,                      // earlyDepartures
                8,                       // absences
                new BigDecimal("550"),   // totalOvertimeHours
                new BigDecimal("8.5"),   // averageHoursWorked
                Map.of(
                        "Engineering", new BigDecimal("97.5"),
                        "Sales", new BigDecimal("95.0"),
                        "HR", new BigDecimal("98.0"),
                        "Finance", new BigDecimal("97.0"),
                        "Operations", new BigDecimal("95.5")
                ),
                trend
        );
    }

    @Override
    @Cacheable(value = "recruitment", key = "#tenantId + '-' + #from + '-' + #to")
    @Transactional(readOnly = true)
    public RecruitmentSummary getRecruitmentSummary(UUID tenantId, LocalDateTime from, LocalDateTime to) {
        List<RecruitmentTrend> trend = List.of(
                new RecruitmentTrend("Jan", 45, 12, 5, 4),
                new RecruitmentTrend("Feb", 52, 15, 6, 5),
                new RecruitmentTrend("Mar", 38, 10, 4, 3),
                new RecruitmentTrend("Apr", 60, 18, 7, 6),
                new RecruitmentTrend("May", 48, 14, 5, 4),
                new RecruitmentTrend("Jun", 55, 16, 6, 5)
        );

        return new RecruitmentSummary(
                12,   // openPositions
                55,   // totalApplications
                16,   // interviewsScheduled
                6,    // offersExtended
                5,    // hiresMade
                new BigDecimal("32.5"),  // averageDaysToHire
                new BigDecimal("83.3"),  // offerAcceptanceRatePercent
                Map.of("LinkedIn", 120, "Indeed", 85, "Referral", 45, "Career Page", 35, "Other", 13),
                Map.of("Engineering", 5, "Sales", 3, "HR", 1, "Finance", 1, "Operations", 2),
                trend
        );
    }

    @Override
    @Cacheable(value = "compliance", key = "#tenantId")
    @Transactional(readOnly = true)
    public ComplianceDashboard getComplianceDashboard(UUID tenantId) {
        List<ComplianceAlert> alerts = List.of(
                new ComplianceAlert("DOCUMENT_EXPIRY", "warning",
                        "5 employee documents expiring within 30 days",
                        LocalDateTime.now().plusDays(30), "Review and renew expiring documents"),
                new ComplianceAlert("EMP201", "info",
                        "EMP201 submission due on 7th",
                        LocalDateTime.now().withDayOfMonth(7).plusMonths(1), "Prepare and submit EMP201"),
                new ComplianceAlert("TRAINING", "warning",
                        "12 employees have overdue compliance training",
                        null, "Schedule training sessions")
        );

        return new ComplianceDashboard(
                5,   // documentsExpiringSoon
                2,   // expiredDocuments
                8,   // pendingAcknowledgments
                12,  // overdueTraining
                new BigDecimal("87.5"),  // overallComplianceScore
                alerts,
                Map.of(
                        "Employment Contracts", new BigDecimal("95"),
                        "ID Documents", new BigDecimal("100"),
                        "Tax Numbers", new BigDecimal("98"),
                        "Training Certificates", new BigDecimal("75"),
                        "Medical Certificates", new BigDecimal("80")
                )
        );
    }

    @Override
    @Cacheable(value = "executive", key = "#tenantId")
    @Transactional(readOnly = true)
    public ExecutiveDashboard getExecutiveDashboard(UUID tenantId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime monthStart = now.withDayOfMonth(1);

        List<KeyMetric> keyMetrics = List.of(
                new KeyMetric("Headcount", "150", "up", new BigDecimal("4.2"), "vs last month"),
                new KeyMetric("Turnover Rate", "9.3%", "down", new BigDecimal("-1.5"), "vs last quarter"),
                new KeyMetric("Payroll Cost", "R4.7M", "up", new BigDecimal("2.1"), "vs last month"),
                new KeyMetric("Attendance", "96.4%", "stable", new BigDecimal("0.2"), "vs last week")
        );

        List<Alert> alerts = List.of(
                new Alert("payroll", "warning", "Payroll Processing Due",
                        "Monthly payroll run scheduled for 25th", LocalDateTime.now()),
                new Alert("compliance", "info", "EMP201 Reminder",
                        "Monthly PAYE submission due on 7th", LocalDateTime.now())
        );

        return new ExecutiveDashboard(
                getHeadcountSummary(tenantId),
                getPayrollSummary(tenantId, monthStart, now),
                getLeaveSummary(tenantId, monthStart, now),
                getAttendanceSummary(tenantId, monthStart, now),
                getRecruitmentSummary(tenantId, monthStart, now),
                getComplianceDashboard(tenantId),
                keyMetrics,
                alerts
        );
    }

    // ==================== Statutory Reports ====================

    @Override
    @Transactional(readOnly = true)
    public EMP201Summary getEMP201Summary(UUID tenantId, int year, int month) {
        // Calculate due date (7th of following month)
        LocalDateTime dueDate = LocalDateTime.of(year, month, 1, 0, 0).plusMonths(1).withDayOfMonth(7);

        return new EMP201Summary(
                String.format("%d/%02d", year, month),
                150,
                new BigDecimal("4700000"),   // totalRemuneration
                new BigDecimal("850000"),    // paye
                new BigDecimal("47000"),     // sdl (1%)
                new BigDecimal("47000"),     // uif employee (1%)
                new BigDecimal("47000"),     // uif employer (1%)
                new BigDecimal("991000"),    // totalPayable
                dueDate,
                false,
                null
        );
    }

    @Override
    @Transactional(readOnly = true)
    public EMP501Summary getEMP501Summary(UUID tenantId, int taxYear, boolean isInterim) {
        // Interim: October, Annual: May
        LocalDateTime dueDate = isInterim
                ? LocalDateTime.of(taxYear, 10, 31, 0, 0)
                : LocalDateTime.of(taxYear + 1, 5, 31, 0, 0);

        return new EMP501Summary(
                String.valueOf(taxYear) + "/" + (taxYear + 1),
                isInterim ? "Interim" : "Annual",
                150,
                new BigDecimal("28200000"),  // 6 months remuneration
                new BigDecimal("5100000"),   // totalPAYE
                new BigDecimal("282000"),    // totalUIF
                new BigDecimal("282000"),    // totalSDL
                150,                         // irp5sGenerated
                dueDate,
                false
        );
    }

    @Override
    @Transactional(readOnly = true)
    public WidgetDataResponse getWidgetData(UUID widgetId, UUID tenantId) {
        // This would fetch actual widget data based on configuration
        // For now, return placeholder
        return new WidgetDataResponse(
                widgetId,
                DashboardWidget.DataSource.HEADCOUNT,
                Map.of("value", 150, "trend", "up", "change", 4.2),
                LocalDateTime.now(),
                LocalDateTime.now().plusMinutes(5)
        );
    }

    // ==================== Mapping Methods ====================

    private ReportResponse toReportResponse(Report report) {
        return new ReportResponse(
                report.getId(),
                report.getReference(),
                report.getName(),
                report.getDescription(),
                report.getCategory(),
                report.getReportType(),
                report.getStatus(),
                report.getOutputFormat(),
                report.getDateFrom(),
                report.getDateTo(),
                report.getParameters(),
                report.getFilePath(),
                report.getFileSize(),
                report.getContentType(),
                report.getRowCount(),
                report.getPageCount(),
                report.getGenerationTimeMs(),
                report.getErrorMessage(),
                report.getVisibility(),
                report.getExpiresAt(),
                report.isScheduled(),
                report.getCreatedBy(),
                report.getCreatedAt(),
                report.getCompletedAt()
        );
    }

    private ReportListItem toReportListItem(Report report) {
        return new ReportListItem(
                report.getId(),
                report.getReference(),
                report.getName(),
                report.getCategory(),
                report.getReportType(),
                report.getStatus(),
                report.getOutputFormat(),
                report.getFileSize(),
                report.getCreatedAt(),
                report.getCompletedAt()
        );
    }

    private ScheduleResponse toScheduleResponse(ReportSchedule schedule) {
        return new ScheduleResponse(
                schedule.getId(),
                schedule.getName(),
                schedule.getDescription(),
                schedule.getReportType(),
                schedule.getOutputFormat(),
                schedule.getParameters(),
                schedule.getFrequency(),
                schedule.getRunTime(),
                schedule.getDayOfWeek(),
                schedule.getDayOfMonth(),
                schedule.getCronExpression(),
                schedule.getDateRangeType(),
                schedule.getLastRunAt(),
                schedule.getNextRunAt(),
                schedule.getLastRunStatus(),
                schedule.getRunCount(),
                schedule.getFailureCount(),
                schedule.getEmailRecipients(),
                schedule.isAttachReport(),
                schedule.isActive(),
                schedule.getCreatedBy(),
                schedule.getCreatedAt()
        );
    }
}
