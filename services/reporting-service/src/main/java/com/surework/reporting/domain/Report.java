package com.surework.reporting.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Represents a generated or scheduled report.
 */
@Entity
@Table(name = "reports")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "reference", nullable = false, unique = true)
    private String reference;

    // Report identification
    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "report_type", nullable = false)
    private ReportType reportType;

    // Report status
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus status = ReportStatus.PENDING;

    // Parameters used to generate the report
    @Column(name = "parameters", columnDefinition = "jsonb")
    @Convert(converter = MapToJsonConverter.class)
    private Map<String, Object> parameters = new HashMap<>();

    // Date range for report data
    @Column(name = "date_from")
    private LocalDateTime dateFrom;

    @Column(name = "date_to")
    private LocalDateTime dateTo;

    // Output format
    @Enumerated(EnumType.STRING)
    @Column(name = "output_format", nullable = false)
    private OutputFormat outputFormat = OutputFormat.PDF;

    // File storage
    @Column(name = "file_path")
    private String filePath;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "content_type")
    private String contentType;

    // Generation timing
    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt = LocalDateTime.now();

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "generation_time_ms")
    private Long generationTimeMs;

    // Record counts
    @Column(name = "row_count")
    private Integer rowCount;

    @Column(name = "page_count")
    private Integer pageCount;

    // Error handling
    @Column(name = "error_message", length = 2000)
    private String errorMessage;

    @Column(name = "retry_count")
    private Integer retryCount = 0;

    // Scheduling
    @Column(name = "is_scheduled")
    private boolean scheduled = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id")
    private ReportSchedule schedule;

    // Access control
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportVisibility visibility = ReportVisibility.PRIVATE;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    // Audit
    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Enums
    public enum ReportCategory {
        HR,
        PAYROLL,
        LEAVE,
        TIME_ATTENDANCE,
        RECRUITMENT,
        STATUTORY,
        FINANCIAL,
        COMPLIANCE,
        CUSTOM
    }

    public enum ReportType {
        // HR Reports
        HEADCOUNT,
        TURNOVER,
        DEMOGRAPHICS,
        SKILLS_MATRIX,
        TRAINING_SUMMARY,
        PROBATION_STATUS,
        EMPLOYEE_DIRECTORY,

        // Payroll Reports
        PAYROLL_REGISTER,
        PAYROLL_SUMMARY,
        PAYSLIP_BATCH,
        STATUTORY_DEDUCTIONS,
        COST_TO_COMPANY,
        PAYROLL_VARIANCE,
        YEAR_TO_DATE,
        PAYROLL_JOURNAL,

        // Leave Reports
        LEAVE_BALANCE,
        LEAVE_UTILIZATION,
        LEAVE_LIABILITY,
        SICK_LEAVE_ANALYSIS,
        ABSENCE_TRENDS,

        // Time & Attendance
        ATTENDANCE_SUMMARY,
        OVERTIME_REPORT,
        LATE_ARRIVALS,
        TIMESHEET_COMPLIANCE,
        HOURS_WORKED,

        // Recruitment
        RECRUITMENT_PIPELINE,
        TIME_TO_HIRE,
        SOURCE_EFFECTIVENESS,
        OFFER_ACCEPTANCE,

        // Statutory Reports (South Africa)
        EMP201,      // Monthly PAYE/UIF/SDL
        EMP501,      // Bi-annual reconciliation
        UI19,        // UIF certificate
        IRP5,        // Tax certificate
        IT3A,        // Third party payments
        EEA2,        // Employment Equity
        EEA4,        // Income differentials

        // Financial
        LABOR_COST_ANALYSIS,
        DEPARTMENT_BUDGET,
        HEADCOUNT_FORECAST,

        // Custom
        AD_HOC,
        CUSTOM_QUERY
    }

    public enum ReportStatus {
        PENDING,
        QUEUED,
        GENERATING,
        COMPLETED,
        FAILED,
        CANCELLED,
        EXPIRED
    }

    public enum OutputFormat {
        PDF,
        EXCEL,
        CSV,
        JSON,
        HTML
    }

    public enum ReportVisibility {
        PRIVATE,      // Only creator can view
        DEPARTMENT,   // Department members can view
        COMPANY,      // All company users can view
        PUBLIC        // Anyone with link (for shared reports)
    }

    // Business methods
    public void startGeneration() {
        this.status = ReportStatus.GENERATING;
        this.startedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void completeGeneration(String filePath, Long fileSize, Integer rowCount, Integer pageCount) {
        this.status = ReportStatus.COMPLETED;
        this.completedAt = LocalDateTime.now();
        this.filePath = filePath;
        this.fileSize = fileSize;
        this.rowCount = rowCount;
        this.pageCount = pageCount;
        this.generationTimeMs = java.time.Duration.between(startedAt, completedAt).toMillis();
        this.updatedAt = LocalDateTime.now();
    }

    public void fail(String errorMessage) {
        this.status = ReportStatus.FAILED;
        this.errorMessage = errorMessage;
        this.completedAt = LocalDateTime.now();
        this.retryCount++;
        this.updatedAt = LocalDateTime.now();
    }

    public void cancel() {
        this.status = ReportStatus.CANCELLED;
        this.updatedAt = LocalDateTime.now();
    }

    public void expire() {
        this.status = ReportStatus.EXPIRED;
        this.updatedAt = LocalDateTime.now();
    }

    public boolean canRetry() {
        return this.status == ReportStatus.FAILED && this.retryCount < 3;
    }

    public boolean isExpired() {
        return this.expiresAt != null && LocalDateTime.now().isAfter(this.expiresAt);
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }

    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public ReportCategory getCategory() { return category; }
    public void setCategory(ReportCategory category) { this.category = category; }

    public ReportType getReportType() { return reportType; }
    public void setReportType(ReportType reportType) { this.reportType = reportType; }

    public ReportStatus getStatus() { return status; }
    public void setStatus(ReportStatus status) { this.status = status; }

    public Map<String, Object> getParameters() { return parameters; }
    public void setParameters(Map<String, Object> parameters) { this.parameters = parameters; }

    public LocalDateTime getDateFrom() { return dateFrom; }
    public void setDateFrom(LocalDateTime dateFrom) { this.dateFrom = dateFrom; }

    public LocalDateTime getDateTo() { return dateTo; }
    public void setDateTo(LocalDateTime dateTo) { this.dateTo = dateTo; }

    public OutputFormat getOutputFormat() { return outputFormat; }
    public void setOutputFormat(OutputFormat outputFormat) { this.outputFormat = outputFormat; }

    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public LocalDateTime getRequestedAt() { return requestedAt; }
    public void setRequestedAt(LocalDateTime requestedAt) { this.requestedAt = requestedAt; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public Long getGenerationTimeMs() { return generationTimeMs; }
    public void setGenerationTimeMs(Long generationTimeMs) { this.generationTimeMs = generationTimeMs; }

    public Integer getRowCount() { return rowCount; }
    public void setRowCount(Integer rowCount) { this.rowCount = rowCount; }

    public Integer getPageCount() { return pageCount; }
    public void setPageCount(Integer pageCount) { this.pageCount = pageCount; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public Integer getRetryCount() { return retryCount; }
    public void setRetryCount(Integer retryCount) { this.retryCount = retryCount; }

    public boolean isScheduled() { return scheduled; }
    public void setScheduled(boolean scheduled) { this.scheduled = scheduled; }

    public ReportSchedule getSchedule() { return schedule; }
    public void setSchedule(ReportSchedule schedule) { this.schedule = schedule; }

    public ReportVisibility getVisibility() { return visibility; }
    public void setVisibility(ReportVisibility visibility) { this.visibility = visibility; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
