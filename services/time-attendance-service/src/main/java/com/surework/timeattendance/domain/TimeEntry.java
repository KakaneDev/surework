package com.surework.timeattendance.domain;

import com.surework.common.persistence.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.UUID;

/**
 * Represents a time entry (clock in/out) for an employee.
 * Compliant with South African BCEA regulations.
 */
@Entity
@Table(name = "time_entries", indexes = {
        @Index(name = "idx_time_entries_employee", columnList = "employee_id"),
        @Index(name = "idx_time_entries_date", columnList = "work_date"),
        @Index(name = "idx_time_entries_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
public class TimeEntry extends BaseEntity {

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "employee_number")
    private String employeeNumber;

    @Column(name = "employee_name")
    private String employeeName;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(name = "clock_in")
    private LocalDateTime clockIn;

    @Column(name = "clock_out")
    private LocalDateTime clockOut;

    @Column(name = "scheduled_start")
    private LocalTime scheduledStart;

    @Column(name = "scheduled_end")
    private LocalTime scheduledEnd;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false)
    private EntryType entryType = EntryType.REGULAR;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private TimeEntryStatus status = TimeEntryStatus.ACTIVE;

    // Duration calculations
    @Column(name = "total_hours", precision = 5, scale = 2)
    private BigDecimal totalHours;

    @Column(name = "regular_hours", precision = 5, scale = 2)
    private BigDecimal regularHours;

    @Column(name = "overtime_hours", precision = 5, scale = 2)
    private BigDecimal overtimeHours;

    @Column(name = "night_hours", precision = 5, scale = 2)
    private BigDecimal nightHours; // BCEA 18:00-06:00

    @Column(name = "sunday_hours", precision = 5, scale = 2)
    private BigDecimal sundayHours;

    @Column(name = "public_holiday_hours", precision = 5, scale = 2)
    private BigDecimal publicHolidayHours;

    // Break tracking
    @Column(name = "break_start")
    private LocalDateTime breakStart;

    @Column(name = "break_end")
    private LocalDateTime breakEnd;

    @Column(name = "break_duration_minutes")
    private Integer breakDurationMinutes;

    @Column(name = "unpaid_break_minutes")
    private Integer unpaidBreakMinutes;

    // Location tracking (for mobile clock-in)
    @Column(name = "clock_in_latitude", precision = 10, scale = 7)
    private BigDecimal clockInLatitude;

    @Column(name = "clock_in_longitude", precision = 10, scale = 7)
    private BigDecimal clockInLongitude;

    @Column(name = "clock_in_location")
    private String clockInLocation;

    @Column(name = "clock_out_latitude", precision = 10, scale = 7)
    private BigDecimal clockOutLatitude;

    @Column(name = "clock_out_longitude", precision = 10, scale = 7)
    private BigDecimal clockOutLongitude;

    @Column(name = "clock_out_location")
    private String clockOutLocation;

    // Device/method
    @Enumerated(EnumType.STRING)
    @Column(name = "clock_method")
    private ClockMethod clockMethod = ClockMethod.WEB;

    @Column(name = "device_id")
    private String deviceId;

    @Column(name = "ip_address")
    private String ipAddress;

    // Approval
    @Column(name = "requires_approval")
    private boolean requiresApproval = false;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    // Notes
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "manager_notes", columnDefinition = "TEXT")
    private String managerNotes;

    // Flags
    @Column(name = "is_late")
    private boolean late = false;

    @Column(name = "late_minutes")
    private Integer lateMinutes;

    @Column(name = "is_early_departure")
    private boolean earlyDeparture = false;

    @Column(name = "early_departure_minutes")
    private Integer earlyDepartureMinutes;

    @Column(name = "is_public_holiday")
    private boolean publicHoliday = false;

    @Column(name = "public_holiday_name")
    private String publicHolidayName;

    @Column(name = "is_edited")
    private boolean edited = false;

    @Column(name = "edited_by")
    private UUID editedBy;

    @Column(name = "edit_reason")
    private String editReason;

    /**
     * Time entry types.
     */
    public enum EntryType {
        REGULAR,        // Normal work day
        OVERTIME,       // Pre-approved overtime
        WEEKEND,        // Weekend work
        PUBLIC_HOLIDAY, // Public holiday work
        STANDBY,        // On standby duty
        CALL_OUT,       // Called out after hours
        TRAINING,       // Training time
        TRAVEL          // Work-related travel
    }

    /**
     * Time entry statuses.
     */
    public enum TimeEntryStatus {
        ACTIVE,         // Currently clocked in
        COMPLETED,      // Clock out recorded
        PENDING_APPROVAL, // Needs manager approval
        APPROVED,       // Approved by manager
        REJECTED,       // Rejected by manager
        EDITED,         // Manually edited
        CANCELLED       // Cancelled entry
    }

    /**
     * Clock-in methods.
     */
    public enum ClockMethod {
        WEB,            // Web browser
        MOBILE_APP,     // Mobile application
        BIOMETRIC,      // Biometric device
        RFID,           // RFID card reader
        MANUAL,         // Manual entry
        KIOSK           // Self-service kiosk
    }

    /**
     * Clock in.
     */
    public void clockIn(LocalDateTime time) {
        this.clockIn = time;
        this.status = TimeEntryStatus.ACTIVE;

        // Check if late
        if (scheduledStart != null) {
            LocalTime clockInTime = time.toLocalTime();
            if (clockInTime.isAfter(scheduledStart.plusMinutes(5))) { // 5 min grace
                this.late = true;
                this.lateMinutes = (int) Duration.between(scheduledStart, clockInTime).toMinutes();
            }
        }
    }

    /**
     * Clock out.
     */
    public void clockOut(LocalDateTime time) {
        this.clockOut = time;
        this.status = TimeEntryStatus.COMPLETED;

        // Check if early departure
        if (scheduledEnd != null) {
            LocalTime clockOutTime = time.toLocalTime();
            if (clockOutTime.isBefore(scheduledEnd.minusMinutes(5))) { // 5 min grace
                this.earlyDeparture = true;
                this.earlyDepartureMinutes = (int) Duration.between(clockOutTime, scheduledEnd).toMinutes();
            }
        }

        calculateHours();
    }

    /**
     * Start break.
     */
    public void startBreak(LocalDateTime time) {
        this.breakStart = time;
    }

    /**
     * End break.
     */
    public void endBreak(LocalDateTime time) {
        this.breakEnd = time;
        if (breakStart != null) {
            this.breakDurationMinutes = (int) Duration.between(breakStart, breakEnd).toMinutes();
        }
    }

    /**
     * Calculate working hours.
     */
    public void calculateHours() {
        if (clockIn == null || clockOut == null) {
            return;
        }

        // Total duration in minutes
        long totalMinutes = Duration.between(clockIn, clockOut).toMinutes();

        // Subtract unpaid break time (typically 1 hour for shifts > 5 hours per BCEA)
        int breakMins = unpaidBreakMinutes != null ? unpaidBreakMinutes :
                (totalMinutes >= 300 ? 60 : 0); // 60 min break if > 5 hours

        long workMinutes = totalMinutes - breakMins;

        this.totalHours = BigDecimal.valueOf(workMinutes)
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);

        // Calculate regular vs overtime (9 hours standard per BCEA)
        BigDecimal standardHours = BigDecimal.valueOf(9);
        if (this.totalHours.compareTo(standardHours) > 0) {
            this.regularHours = standardHours;
            this.overtimeHours = this.totalHours.subtract(standardHours);
        } else {
            this.regularHours = this.totalHours;
            this.overtimeHours = BigDecimal.ZERO;
        }

        // Calculate night hours (18:00-06:00 per BCEA)
        calculateNightHours();

        // Calculate Sunday/Public Holiday hours
        DayOfWeek day = workDate.getDayOfWeek();
        if (day == DayOfWeek.SUNDAY) {
            this.sundayHours = this.totalHours;
        }
        if (publicHoliday) {
            this.publicHolidayHours = this.totalHours;
        }
    }

    /**
     * Calculate night work hours (18:00-06:00 per BCEA Section 17).
     */
    private void calculateNightHours() {
        if (clockIn == null || clockOut == null) {
            this.nightHours = BigDecimal.ZERO;
            return;
        }

        LocalTime nightStart = LocalTime.of(18, 0);
        LocalTime nightEnd = LocalTime.of(6, 0);

        LocalTime inTime = clockIn.toLocalTime();
        LocalTime outTime = clockOut.toLocalTime();

        long nightMinutes = 0;

        // Simplified calculation - check if any part falls in night hours
        if (inTime.isAfter(nightStart) || inTime.isBefore(nightEnd)) {
            // Started during night hours
            LocalTime effectiveEnd = outTime.isAfter(nightStart) || outTime.isBefore(nightEnd) ?
                    outTime : nightEnd;
            nightMinutes = Duration.between(inTime, effectiveEnd).toMinutes();
        } else if (outTime.isAfter(nightStart)) {
            // Ended during night hours
            nightMinutes = Duration.between(nightStart, outTime).toMinutes();
        }

        if (nightMinutes > 0) {
            this.nightHours = BigDecimal.valueOf(nightMinutes)
                    .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
        } else {
            this.nightHours = BigDecimal.ZERO;
        }
    }

    /**
     * Submit for approval.
     */
    public void submitForApproval() {
        this.status = TimeEntryStatus.PENDING_APPROVAL;
        this.requiresApproval = true;
    }

    /**
     * Approve the entry.
     */
    public void approve(UUID approverUserId) {
        this.status = TimeEntryStatus.APPROVED;
        this.approvedBy = approverUserId;
        this.approvedAt = Instant.now();
    }

    /**
     * Reject the entry.
     */
    public void reject(UUID approverUserId, String reason) {
        this.status = TimeEntryStatus.REJECTED;
        this.approvedBy = approverUserId;
        this.approvedAt = Instant.now();
        this.rejectionReason = reason;
    }

    /**
     * Edit the entry.
     */
    public void edit(UUID editorUserId, String reason) {
        this.edited = true;
        this.editedBy = editorUserId;
        this.editReason = reason;
        this.status = TimeEntryStatus.EDITED;
        calculateHours();
    }

    /**
     * Check if currently clocked in.
     */
    public boolean isClockedIn() {
        return status == TimeEntryStatus.ACTIVE && clockIn != null && clockOut == null;
    }

    /**
     * Get worked duration.
     */
    public Duration getWorkedDuration() {
        if (clockIn == null) {
            return Duration.ZERO;
        }
        LocalDateTime endTime = clockOut != null ? clockOut : LocalDateTime.now();
        return Duration.between(clockIn, endTime);
    }
}
