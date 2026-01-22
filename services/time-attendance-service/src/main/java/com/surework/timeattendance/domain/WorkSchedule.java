package com.surework.timeattendance.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Represents a work schedule or shift assignment.
 * Compliant with South African BCEA working hours regulations.
 */
@Entity
@Table(name = "work_schedules", indexes = {
        @Index(name = "idx_work_schedules_employee", columnList = "employee_id"),
        @Index(name = "idx_work_schedules_date", columnList = "effective_from, effective_to"),
        @Index(name = "idx_work_schedules_shift", columnList = "shift_id")
})
@Getter
@Setter
@NoArgsConstructor
public class WorkSchedule extends BaseEntity {

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "employee_number")
    private String employeeNumber;

    @Column(name = "employee_name")
    private String employeeName;

    @Column(name = "shift_id")
    private UUID shiftId;

    @Column(name = "shift_name")
    private String shiftName;

    @Enumerated(EnumType.STRING)
    @Column(name = "schedule_type", nullable = false)
    private ScheduleType scheduleType;

    // Standard working hours
    @Column(name = "standard_start_time")
    private LocalTime standardStartTime;

    @Column(name = "standard_end_time")
    private LocalTime standardEndTime;

    @Column(name = "hours_per_day")
    private int hoursPerDay = 9; // BCEA default

    @Column(name = "hours_per_week")
    private int hoursPerWeek = 45; // BCEA maximum ordinary hours

    // Working days
    @Column(name = "works_monday")
    private boolean worksMonday = true;

    @Column(name = "works_tuesday")
    private boolean worksTuesday = true;

    @Column(name = "works_wednesday")
    private boolean worksWednesday = true;

    @Column(name = "works_thursday")
    private boolean worksThursday = true;

    @Column(name = "works_friday")
    private boolean worksFriday = true;

    @Column(name = "works_saturday")
    private boolean worksSaturday = false;

    @Column(name = "works_sunday")
    private boolean worksSunday = false;

    // Flexible hours
    @Column(name = "is_flexible")
    private boolean flexible = false;

    @Column(name = "flex_start_earliest")
    private LocalTime flexStartEarliest;

    @Column(name = "flex_start_latest")
    private LocalTime flexStartLatest;

    @Column(name = "core_hours_start")
    private LocalTime coreHoursStart;

    @Column(name = "core_hours_end")
    private LocalTime coreHoursEnd;

    // Break rules per BCEA Section 14
    @Column(name = "lunch_break_start")
    private LocalTime lunchBreakStart;

    @Column(name = "lunch_break_duration_minutes")
    private int lunchBreakDurationMinutes = 60; // BCEA minimum

    @Column(name = "lunch_break_paid")
    private boolean lunchBreakPaid = false;

    // Validity period
    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @Column(name = "is_active")
    private boolean active = true;

    // Notes
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    /**
     * Schedule types.
     */
    public enum ScheduleType {
        STANDARD,       // Standard 08:00-17:00
        SHIFT,          // Rotating shifts
        FLEXIBLE,       // Flexible hours
        COMPRESSED,     // Compressed work week
        PART_TIME,      // Part-time schedule
        REMOTE,         // Remote work schedule
        HYBRID          // Mix of office and remote
    }

    /**
     * Create a standard 9-5 schedule.
     */
    public static WorkSchedule createStandard(UUID employeeId, LocalDate effectiveFrom) {
        WorkSchedule schedule = new WorkSchedule();
        schedule.setEmployeeId(employeeId);
        schedule.setScheduleType(ScheduleType.STANDARD);
        schedule.setStandardStartTime(LocalTime.of(8, 0));
        schedule.setStandardEndTime(LocalTime.of(17, 0));
        schedule.setHoursPerDay(9);
        schedule.setHoursPerWeek(45);
        schedule.setLunchBreakStart(LocalTime.of(13, 0));
        schedule.setLunchBreakDurationMinutes(60);
        schedule.setEffectiveFrom(effectiveFrom);
        schedule.setActive(true);
        return schedule;
    }

    /**
     * Check if employee works on a specific day.
     */
    public boolean worksOnDay(DayOfWeek day) {
        return switch (day) {
            case MONDAY -> worksMonday;
            case TUESDAY -> worksTuesday;
            case WEDNESDAY -> worksWednesday;
            case THURSDAY -> worksThursday;
            case FRIDAY -> worksFriday;
            case SATURDAY -> worksSaturday;
            case SUNDAY -> worksSunday;
        };
    }

    /**
     * Get working days per week.
     */
    public int getWorkingDaysPerWeek() {
        int days = 0;
        if (worksMonday) days++;
        if (worksTuesday) days++;
        if (worksWednesday) days++;
        if (worksThursday) days++;
        if (worksFriday) days++;
        if (worksSaturday) days++;
        if (worksSunday) days++;
        return days;
    }

    /**
     * Check if schedule is valid on a specific date.
     */
    public boolean isValidOnDate(LocalDate date) {
        if (!active) return false;
        if (date.isBefore(effectiveFrom)) return false;
        if (effectiveTo != null && date.isAfter(effectiveTo)) return false;
        return true;
    }

    /**
     * Get expected start time for a date.
     */
    public LocalTime getExpectedStartTime(LocalDate date) {
        if (flexible && flexStartEarliest != null) {
            return flexStartEarliest;
        }
        return standardStartTime;
    }

    /**
     * Get expected end time for a date.
     */
    public LocalTime getExpectedEndTime(LocalDate date) {
        if (flexible && flexStartLatest != null) {
            // Calculate based on latest start + hours per day
            return flexStartLatest.plusHours(hoursPerDay).plusMinutes(lunchBreakDurationMinutes);
        }
        return standardEndTime;
    }

    /**
     * Deactivate the schedule.
     */
    public void deactivate(LocalDate endDate) {
        this.active = false;
        this.effectiveTo = endDate;
    }
}
