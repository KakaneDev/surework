package com.surework.timeattendance.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Represents a timesheet summary for an employee for a specific period.
 * Consolidates time entries for payroll processing.
 */
@Entity
@Table(name = "timesheets", indexes = {
        @Index(name = "idx_timesheets_employee", columnList = "employee_id"),
        @Index(name = "idx_timesheets_period", columnList = "period_start, period_end"),
        @Index(name = "idx_timesheets_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
public class Timesheet extends BaseEntity {

    @Column(name = "timesheet_reference", nullable = false, unique = true)
    private String timesheetReference;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "employee_number")
    private String employeeNumber;

    @Column(name = "employee_name")
    private String employeeName;

    @Column(name = "department_id")
    private UUID departmentId;

    @Column(name = "department_name")
    private String departmentName;

    @Enumerated(EnumType.STRING)
    @Column(name = "period_type", nullable = false)
    private PeriodType periodType;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "period_year")
    private int periodYear;

    @Column(name = "period_month")
    private int periodMonth;

    @Column(name = "period_week")
    private Integer periodWeek;

    // Hour totals
    @Column(name = "total_hours", precision = 7, scale = 2)
    private BigDecimal totalHours = BigDecimal.ZERO;

    @Column(name = "regular_hours", precision = 7, scale = 2)
    private BigDecimal regularHours = BigDecimal.ZERO;

    @Column(name = "overtime_hours", precision = 7, scale = 2)
    private BigDecimal overtimeHours = BigDecimal.ZERO;

    @Column(name = "night_hours", precision = 7, scale = 2)
    private BigDecimal nightHours = BigDecimal.ZERO;

    @Column(name = "sunday_hours", precision = 7, scale = 2)
    private BigDecimal sundayHours = BigDecimal.ZERO;

    @Column(name = "public_holiday_hours", precision = 7, scale = 2)
    private BigDecimal publicHolidayHours = BigDecimal.ZERO;

    // Leave hours taken during period
    @Column(name = "annual_leave_hours", precision = 7, scale = 2)
    private BigDecimal annualLeaveHours = BigDecimal.ZERO;

    @Column(name = "sick_leave_hours", precision = 7, scale = 2)
    private BigDecimal sickLeaveHours = BigDecimal.ZERO;

    @Column(name = "family_leave_hours", precision = 7, scale = 2)
    private BigDecimal familyLeaveHours = BigDecimal.ZERO;

    @Column(name = "unpaid_leave_hours", precision = 7, scale = 2)
    private BigDecimal unpaidLeaveHours = BigDecimal.ZERO;

    // Day counts
    @Column(name = "days_worked")
    private int daysWorked = 0;

    @Column(name = "days_absent")
    private int daysAbsent = 0;

    @Column(name = "days_late")
    private int daysLate = 0;

    @Column(name = "early_departures")
    private int earlyDepartures = 0;

    @Column(name = "working_days_in_period")
    private int workingDaysInPeriod;

    // Status
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private TimesheetStatus status = TimesheetStatus.DRAFT;

    // Approval workflow
    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "submitted_by")
    private UUID submittedBy;

    @Column(name = "reviewed_by")
    private UUID reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    // Payroll processing
    @Column(name = "payroll_processed")
    private boolean payrollProcessed = false;

    @Column(name = "payroll_run_id")
    private UUID payrollRunId;

    @Column(name = "payroll_processed_at")
    private Instant payrollProcessedAt;

    // Notes
    @Column(name = "employee_notes", columnDefinition = "TEXT")
    private String employeeNotes;

    @Column(name = "manager_notes", columnDefinition = "TEXT")
    private String managerNotes;

    /**
     * Timesheet period types.
     */
    public enum PeriodType {
        WEEKLY,
        FORTNIGHTLY,
        MONTHLY
    }

    /**
     * Timesheet statuses.
     */
    public enum TimesheetStatus {
        DRAFT,              // Being filled in
        SUBMITTED,          // Submitted by employee
        UNDER_REVIEW,       // Being reviewed by manager
        APPROVED,           // Approved
        REJECTED,           // Rejected, needs revision
        PROCESSED,          // Processed for payroll
        LOCKED              // Locked for audit
    }

    /**
     * Create a new timesheet.
     */
    public static Timesheet create(UUID employeeId, PeriodType periodType,
                                    LocalDate periodStart, LocalDate periodEnd) {
        Timesheet timesheet = new Timesheet();
        timesheet.setEmployeeId(employeeId);
        timesheet.setPeriodType(periodType);
        timesheet.setPeriodStart(periodStart);
        timesheet.setPeriodEnd(periodEnd);
        timesheet.setPeriodYear(periodStart.getYear());
        timesheet.setPeriodMonth(periodStart.getMonthValue());
        timesheet.setTimesheetReference(generateReference(employeeId, periodStart));
        timesheet.setStatus(TimesheetStatus.DRAFT);
        return timesheet;
    }

    private static String generateReference(UUID employeeId, LocalDate periodStart) {
        return "TS-" + periodStart.getYear() +
                String.format("%02d", periodStart.getMonthValue()) +
                "-" + employeeId.toString().substring(0, 8).toUpperCase();
    }

    /**
     * Add time entry hours.
     */
    public void addTimeEntry(TimeEntry entry) {
        if (entry.getTotalHours() != null) {
            this.totalHours = this.totalHours.add(entry.getTotalHours());
        }
        if (entry.getRegularHours() != null) {
            this.regularHours = this.regularHours.add(entry.getRegularHours());
        }
        if (entry.getOvertimeHours() != null) {
            this.overtimeHours = this.overtimeHours.add(entry.getOvertimeHours());
        }
        if (entry.getNightHours() != null) {
            this.nightHours = this.nightHours.add(entry.getNightHours());
        }
        if (entry.getSundayHours() != null) {
            this.sundayHours = this.sundayHours.add(entry.getSundayHours());
        }
        if (entry.getPublicHolidayHours() != null) {
            this.publicHolidayHours = this.publicHolidayHours.add(entry.getPublicHolidayHours());
        }

        this.daysWorked++;
        if (entry.isLate()) {
            this.daysLate++;
        }
        if (entry.isEarlyDeparture()) {
            this.earlyDepartures++;
        }
    }

    /**
     * Submit for approval.
     */
    public void submit(UUID submitterUserId) {
        this.status = TimesheetStatus.SUBMITTED;
        this.submittedBy = submitterUserId;
        this.submittedAt = Instant.now();
    }

    /**
     * Start review.
     */
    public void startReview(UUID reviewerUserId) {
        this.status = TimesheetStatus.UNDER_REVIEW;
        this.reviewedBy = reviewerUserId;
        this.reviewedAt = Instant.now();
    }

    /**
     * Approve the timesheet.
     */
    public void approve(UUID approverUserId) {
        this.status = TimesheetStatus.APPROVED;
        this.approvedBy = approverUserId;
        this.approvedAt = Instant.now();
    }

    /**
     * Reject the timesheet.
     */
    public void reject(UUID reviewerUserId, String reason) {
        this.status = TimesheetStatus.REJECTED;
        this.reviewedBy = reviewerUserId;
        this.reviewedAt = Instant.now();
        this.rejectionReason = reason;
    }

    /**
     * Mark as processed for payroll.
     */
    public void markAsProcessed(UUID payrollRunId) {
        this.status = TimesheetStatus.PROCESSED;
        this.payrollProcessed = true;
        this.payrollRunId = payrollRunId;
        this.payrollProcessedAt = Instant.now();
    }

    /**
     * Lock the timesheet.
     */
    public void lock() {
        this.status = TimesheetStatus.LOCKED;
    }

    /**
     * Check if editable.
     */
    public boolean isEditable() {
        return status == TimesheetStatus.DRAFT || status == TimesheetStatus.REJECTED;
    }

    /**
     * Check if can be approved.
     */
    public boolean canBeApproved() {
        return status == TimesheetStatus.SUBMITTED || status == TimesheetStatus.UNDER_REVIEW;
    }

    /**
     * Calculate attendance percentage.
     */
    public BigDecimal getAttendancePercentage() {
        if (workingDaysInPeriod == 0) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(daysWorked)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(workingDaysInPeriod), 2, java.math.RoundingMode.HALF_UP);
    }

    /**
     * Get total leave hours.
     */
    public BigDecimal getTotalLeaveHours() {
        return annualLeaveHours
                .add(sickLeaveHours)
                .add(familyLeaveHours)
                .add(unpaidLeaveHours);
    }
}
