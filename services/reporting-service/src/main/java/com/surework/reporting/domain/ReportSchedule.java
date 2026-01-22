package com.surework.reporting.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

/**
 * Scheduled report configuration.
 * Allows automatic generation of reports on a recurring basis.
 */
@Entity
@Table(name = "report_schedules")
public class ReportSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    // Report configuration
    @Enumerated(EnumType.STRING)
    @Column(name = "report_type", nullable = false)
    private Report.ReportType reportType;

    @Enumerated(EnumType.STRING)
    @Column(name = "output_format", nullable = false)
    private Report.OutputFormat outputFormat = Report.OutputFormat.PDF;

    @Column(name = "parameters", columnDefinition = "jsonb")
    @Convert(converter = MapToJsonConverter.class)
    private Map<String, Object> parameters = new HashMap<>();

    // Schedule configuration
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ScheduleFrequency frequency;

    // For DAILY - time to run
    @Column(name = "run_time")
    private LocalTime runTime;

    // For WEEKLY - day of week (1=Monday, 7=Sunday)
    @Column(name = "day_of_week")
    private Integer dayOfWeek;

    // For MONTHLY - day of month
    @Column(name = "day_of_month")
    private Integer dayOfMonth;

    // For CUSTOM - cron expression
    @Column(name = "cron_expression")
    private String cronExpression;

    // Date range type for report data
    @Enumerated(EnumType.STRING)
    @Column(name = "date_range_type", nullable = false)
    private DateRangeType dateRangeType = DateRangeType.PREVIOUS_PERIOD;

    // Execution tracking
    @Column(name = "last_run_at")
    private LocalDateTime lastRunAt;

    @Column(name = "next_run_at")
    private LocalDateTime nextRunAt;

    @Column(name = "last_run_status")
    @Enumerated(EnumType.STRING)
    private Report.ReportStatus lastRunStatus;

    @Column(name = "run_count")
    private Integer runCount = 0;

    @Column(name = "failure_count")
    private Integer failureCount = 0;

    // Distribution
    @Column(name = "email_recipients", columnDefinition = "text[]")
    private List<String> emailRecipients = new ArrayList<>();

    @Column(name = "email_subject")
    private String emailSubject;

    @Column(name = "email_body", length = 2000)
    private String emailBody;

    @Column(name = "attach_report")
    private boolean attachReport = true;

    @Column(name = "include_download_link")
    private boolean includeDownloadLink = true;

    // Status
    @Column(nullable = false)
    private boolean active = true;

    // Audit
    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Related reports
    @OneToMany(mappedBy = "schedule", fetch = FetchType.LAZY)
    private List<Report> generatedReports = new ArrayList<>();

    // Enums
    public enum ScheduleFrequency {
        DAILY,
        WEEKLY,
        BIWEEKLY,
        MONTHLY,
        QUARTERLY,
        ANNUALLY,
        CUSTOM
    }

    public enum DateRangeType {
        PREVIOUS_DAY,
        PREVIOUS_WEEK,
        PREVIOUS_MONTH,
        PREVIOUS_QUARTER,
        PREVIOUS_YEAR,
        MONTH_TO_DATE,
        QUARTER_TO_DATE,
        YEAR_TO_DATE,
        PREVIOUS_PERIOD,  // Based on frequency
        CUSTOM
    }

    // Business methods
    public void recordRun(Report.ReportStatus status) {
        this.lastRunAt = LocalDateTime.now();
        this.lastRunStatus = status;
        this.runCount++;
        if (status == Report.ReportStatus.FAILED) {
            this.failureCount++;
        }
        calculateNextRunAt();
        this.updatedAt = LocalDateTime.now();
    }

    public void calculateNextRunAt() {
        LocalDateTime baseTime = this.lastRunAt != null ? this.lastRunAt : LocalDateTime.now();
        LocalTime time = this.runTime != null ? this.runTime : LocalTime.of(6, 0);

        switch (this.frequency) {
            case DAILY -> this.nextRunAt = baseTime.plusDays(1).with(time);
            case WEEKLY -> this.nextRunAt = baseTime.plusWeeks(1).with(time);
            case BIWEEKLY -> this.nextRunAt = baseTime.plusWeeks(2).with(time);
            case MONTHLY -> this.nextRunAt = baseTime.plusMonths(1)
                    .withDayOfMonth(Math.min(this.dayOfMonth != null ? this.dayOfMonth : 1, 28))
                    .with(time);
            case QUARTERLY -> this.nextRunAt = baseTime.plusMonths(3).with(time);
            case ANNUALLY -> this.nextRunAt = baseTime.plusYears(1).with(time);
            case CUSTOM -> {
                // Cron-based calculation would be done by scheduler
            }
        }
    }

    public void activate() {
        this.active = true;
        calculateNextRunAt();
        this.updatedAt = LocalDateTime.now();
    }

    public void deactivate() {
        this.active = false;
        this.nextRunAt = null;
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isDue() {
        return this.active && this.nextRunAt != null && LocalDateTime.now().isAfter(this.nextRunAt);
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Report.ReportType getReportType() { return reportType; }
    public void setReportType(Report.ReportType reportType) { this.reportType = reportType; }

    public Report.OutputFormat getOutputFormat() { return outputFormat; }
    public void setOutputFormat(Report.OutputFormat outputFormat) { this.outputFormat = outputFormat; }

    public Map<String, Object> getParameters() { return parameters; }
    public void setParameters(Map<String, Object> parameters) { this.parameters = parameters; }

    public ScheduleFrequency getFrequency() { return frequency; }
    public void setFrequency(ScheduleFrequency frequency) { this.frequency = frequency; }

    public LocalTime getRunTime() { return runTime; }
    public void setRunTime(LocalTime runTime) { this.runTime = runTime; }

    public Integer getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(Integer dayOfWeek) { this.dayOfWeek = dayOfWeek; }

    public Integer getDayOfMonth() { return dayOfMonth; }
    public void setDayOfMonth(Integer dayOfMonth) { this.dayOfMonth = dayOfMonth; }

    public String getCronExpression() { return cronExpression; }
    public void setCronExpression(String cronExpression) { this.cronExpression = cronExpression; }

    public DateRangeType getDateRangeType() { return dateRangeType; }
    public void setDateRangeType(DateRangeType dateRangeType) { this.dateRangeType = dateRangeType; }

    public LocalDateTime getLastRunAt() { return lastRunAt; }
    public void setLastRunAt(LocalDateTime lastRunAt) { this.lastRunAt = lastRunAt; }

    public LocalDateTime getNextRunAt() { return nextRunAt; }
    public void setNextRunAt(LocalDateTime nextRunAt) { this.nextRunAt = nextRunAt; }

    public Report.ReportStatus getLastRunStatus() { return lastRunStatus; }
    public void setLastRunStatus(Report.ReportStatus lastRunStatus) { this.lastRunStatus = lastRunStatus; }

    public Integer getRunCount() { return runCount; }
    public void setRunCount(Integer runCount) { this.runCount = runCount; }

    public Integer getFailureCount() { return failureCount; }
    public void setFailureCount(Integer failureCount) { this.failureCount = failureCount; }

    public List<String> getEmailRecipients() { return emailRecipients; }
    public void setEmailRecipients(List<String> emailRecipients) { this.emailRecipients = emailRecipients; }

    public String getEmailSubject() { return emailSubject; }
    public void setEmailSubject(String emailSubject) { this.emailSubject = emailSubject; }

    public String getEmailBody() { return emailBody; }
    public void setEmailBody(String emailBody) { this.emailBody = emailBody; }

    public boolean isAttachReport() { return attachReport; }
    public void setAttachReport(boolean attachReport) { this.attachReport = attachReport; }

    public boolean isIncludeDownloadLink() { return includeDownloadLink; }
    public void setIncludeDownloadLink(boolean includeDownloadLink) { this.includeDownloadLink = includeDownloadLink; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<Report> getGeneratedReports() { return generatedReports; }
    public void setGeneratedReports(List<Report> generatedReports) { this.generatedReports = generatedReports; }
}
