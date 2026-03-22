package com.surework.timeattendance.service;

import com.surework.timeattendance.domain.*;
import com.surework.timeattendance.dto.TimeAttendanceDto;
import com.surework.timeattendance.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of TimeAttendanceService.
 * Compliant with South African BCEA regulations.
 */
@Service
@Transactional
public class TimeAttendanceServiceImpl implements TimeAttendanceService {

    private final TimeEntryRepository timeEntryRepository;
    private final TimesheetRepository timesheetRepository;
    private final WorkScheduleRepository workScheduleRepository;
    private final PublicHolidayRepository publicHolidayRepository;

    public TimeAttendanceServiceImpl(
            TimeEntryRepository timeEntryRepository,
            TimesheetRepository timesheetRepository,
            WorkScheduleRepository workScheduleRepository,
            PublicHolidayRepository publicHolidayRepository) {
        this.timeEntryRepository = timeEntryRepository;
        this.timesheetRepository = timesheetRepository;
        this.workScheduleRepository = workScheduleRepository;
        this.publicHolidayRepository = publicHolidayRepository;
    }

    // === Clock In/Out Operations ===

    @Override
    public TimeAttendanceDto.TimeEntryResponse clockIn(TimeAttendanceDto.ClockInRequest request) {
        // Check if already clocked in
        if (isClockedIn(request.employeeId())) {
            throw new IllegalStateException("Employee is already clocked in");
        }

        LocalDateTime clockTime = request.clockTime() != null ? request.clockTime() : LocalDateTime.now();

        TimeEntry entry = new TimeEntry();
        entry.setEmployeeId(request.employeeId());
        entry.setWorkDate(clockTime.toLocalDate());
        entry.setClockMethod(request.clockMethod() != null ? request.clockMethod() : TimeEntry.ClockMethod.WEB);
        entry.setDeviceId(request.deviceId());
        entry.setIpAddress(request.ipAddress());
        entry.setClockInLatitude(request.latitude());
        entry.setClockInLongitude(request.longitude());
        entry.setClockInLocation(request.location());
        entry.setNotes(request.notes());

        // Get employee's schedule for the day
        workScheduleRepository.findActiveForEmployeeOnDate(request.employeeId(), clockTime.toLocalDate())
                .ifPresent(schedule -> {
                    entry.setScheduledStart(schedule.getStandardStartTime());
                    entry.setScheduledEnd(schedule.getStandardEndTime());
                });

        // Check if it's a public holiday
        publicHolidayRepository.findByHolidayDate(clockTime.toLocalDate())
                .ifPresent(holiday -> {
                    entry.setPublicHoliday(true);
                    entry.setPublicHolidayName(holiday.getName());
                    entry.setEntryType(TimeEntry.EntryType.PUBLIC_HOLIDAY);
                });

        // Determine entry type based on day
        if (clockTime.getDayOfWeek() == DayOfWeek.SUNDAY) {
            entry.setEntryType(TimeEntry.EntryType.WEEKEND);
        } else if (clockTime.getDayOfWeek() == DayOfWeek.SATURDAY) {
            entry.setEntryType(TimeEntry.EntryType.WEEKEND);
        }

        entry.clockIn(clockTime);

        TimeEntry savedEntry = timeEntryRepository.save(entry);
        return TimeAttendanceDto.TimeEntryResponse.fromEntity(savedEntry);
    }

    @Override
    public TimeAttendanceDto.TimeEntryResponse clockOut(TimeAttendanceDto.ClockOutRequest request) {
        TimeEntry entry = timeEntryRepository.findActiveEntry(request.employeeId())
                .orElseThrow(() -> new IllegalStateException("Employee is not clocked in"));

        LocalDateTime clockTime = request.clockTime() != null ? request.clockTime() : LocalDateTime.now();

        entry.setClockOutLatitude(request.latitude());
        entry.setClockOutLongitude(request.longitude());
        entry.setClockOutLocation(request.location());
        if (request.notes() != null && !request.notes().isEmpty()) {
            String existingNotes = entry.getNotes() != null ? entry.getNotes() + "\n" : "";
            entry.setNotes(existingNotes + "Clock out: " + request.notes());
        }

        entry.clockOut(clockTime);

        entry = timeEntryRepository.save(entry);
        return TimeAttendanceDto.TimeEntryResponse.fromEntity(entry);
    }

    @Override
    public TimeAttendanceDto.TimeEntryResponse startBreak(TimeAttendanceDto.BreakRequest request) {
        TimeEntry entry = timeEntryRepository.findById(request.timeEntryId())
                .orElseThrow(() -> new IllegalArgumentException("Time entry not found"));

        LocalDateTime breakTime = request.breakTime() != null ? request.breakTime() : LocalDateTime.now();
        entry.startBreak(breakTime);

        entry = timeEntryRepository.save(entry);
        return TimeAttendanceDto.TimeEntryResponse.fromEntity(entry);
    }

    @Override
    public TimeAttendanceDto.TimeEntryResponse endBreak(TimeAttendanceDto.BreakRequest request) {
        TimeEntry entry = timeEntryRepository.findById(request.timeEntryId())
                .orElseThrow(() -> new IllegalArgumentException("Time entry not found"));

        LocalDateTime breakTime = request.breakTime() != null ? request.breakTime() : LocalDateTime.now();
        entry.endBreak(breakTime);

        entry = timeEntryRepository.save(entry);
        return TimeAttendanceDto.TimeEntryResponse.fromEntity(entry);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<TimeAttendanceDto.TimeEntryResponse> getActiveEntry(UUID employeeId) {
        return timeEntryRepository.findActiveEntry(employeeId)
                .map(TimeAttendanceDto.TimeEntryResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isClockedIn(UUID employeeId) {
        return timeEntryRepository.findActiveEntry(employeeId).isPresent();
    }

    // === Time Entry Operations ===

    @Override
    public TimeAttendanceDto.TimeEntryResponse createTimeEntry(TimeAttendanceDto.CreateTimeEntryRequest request) {
        TimeEntry entry = new TimeEntry();
        entry.setEmployeeId(request.employeeId());
        entry.setWorkDate(request.workDate());
        entry.setClockIn(request.clockIn());
        entry.setClockMethod(TimeEntry.ClockMethod.MANUAL);
        entry.setEntryType(request.entryType() != null ? request.entryType() : TimeEntry.EntryType.REGULAR);
        entry.setNotes(request.notes());
        entry.setRequiresApproval(request.requiresApproval());

        if (request.clockOut() != null) {
            entry.setClockOut(request.clockOut());
            entry.setStatus(TimeEntry.TimeEntryStatus.COMPLETED);
            if (request.breakDurationMinutes() != null) {
                entry.setUnpaidBreakMinutes(request.breakDurationMinutes());
            }
            entry.calculateHours();
        } else {
            entry.setStatus(TimeEntry.TimeEntryStatus.ACTIVE);
        }

        if (request.requiresApproval()) {
            entry.setStatus(TimeEntry.TimeEntryStatus.PENDING_APPROVAL);
        }

        // Check for public holiday
        publicHolidayRepository.findByHolidayDate(request.workDate())
                .ifPresent(holiday -> {
                    entry.setPublicHoliday(true);
                    entry.setPublicHolidayName(holiday.getName());
                });

        TimeEntry savedEntry = timeEntryRepository.save(entry);
        return TimeAttendanceDto.TimeEntryResponse.fromEntity(savedEntry);
    }

    @Override
    public TimeAttendanceDto.TimeEntryResponse updateTimeEntry(
            UUID entryId, TimeAttendanceDto.UpdateTimeEntryRequest request, UUID editorId) {
        TimeEntry entry = timeEntryRepository.findById(entryId)
                .orElseThrow(() -> new IllegalArgumentException("Time entry not found"));

        if (request.clockIn() != null) entry.setClockIn(request.clockIn());
        if (request.clockOut() != null) entry.setClockOut(request.clockOut());
        if (request.breakDurationMinutes() != null) entry.setUnpaidBreakMinutes(request.breakDurationMinutes());
        if (request.entryType() != null) entry.setEntryType(request.entryType());
        if (request.notes() != null) entry.setNotes(request.notes());

        entry.edit(editorId, request.editReason());

        entry = timeEntryRepository.save(entry);
        return TimeAttendanceDto.TimeEntryResponse.fromEntity(entry);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<TimeAttendanceDto.TimeEntryResponse> getTimeEntry(UUID entryId) {
        return timeEntryRepository.findById(entryId)
                .filter(e -> !e.isDeleted())
                .map(TimeAttendanceDto.TimeEntryResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimeAttendanceDto.TimeEntryResponse> getEntriesForEmployee(
            UUID employeeId, LocalDate startDate, LocalDate endDate) {
        return timeEntryRepository.findByEmployeeAndDateRange(employeeId, startDate, endDate)
                .stream()
                .map(TimeAttendanceDto.TimeEntryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimeAttendanceDto.TimeEntryResponse> getEntriesForDate(LocalDate date) {
        return timeEntryRepository.findByDateRange(date, date)
                .stream()
                .map(TimeAttendanceDto.TimeEntryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TimeAttendanceDto.TimeEntryResponse> searchTimeEntries(
            UUID employeeId,
            TimeEntry.TimeEntryStatus status,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable) {
        return timeEntryRepository.search(employeeId, status, startDate, endDate, pageable)
                .map(TimeAttendanceDto.TimeEntryResponse::fromEntity);
    }

    @Override
    public void deleteTimeEntry(UUID entryId) {
        timeEntryRepository.findById(entryId).ifPresent(entry -> {
            entry.setDeleted(true);
            timeEntryRepository.save(entry);
        });
    }

    // === Time Entry Approvals ===

    @Override
    public TimeAttendanceDto.TimeEntryResponse submitForApproval(UUID entryId) {
        TimeEntry entry = timeEntryRepository.findById(entryId)
                .orElseThrow(() -> new IllegalArgumentException("Time entry not found"));

        entry.submitForApproval();
        entry = timeEntryRepository.save(entry);
        return TimeAttendanceDto.TimeEntryResponse.fromEntity(entry);
    }

    @Override
    public TimeAttendanceDto.TimeEntryResponse approveTimeEntry(UUID entryId, UUID approverId, String notes) {
        TimeEntry entry = timeEntryRepository.findById(entryId)
                .orElseThrow(() -> new IllegalArgumentException("Time entry not found"));

        entry.approve(approverId);
        if (notes != null) {
            entry.setManagerNotes(notes);
        }

        entry = timeEntryRepository.save(entry);
        return TimeAttendanceDto.TimeEntryResponse.fromEntity(entry);
    }

    @Override
    public TimeAttendanceDto.TimeEntryResponse rejectTimeEntry(UUID entryId, UUID approverId, String reason) {
        TimeEntry entry = timeEntryRepository.findById(entryId)
                .orElseThrow(() -> new IllegalArgumentException("Time entry not found"));

        entry.reject(approverId, reason);

        entry = timeEntryRepository.save(entry);
        return TimeAttendanceDto.TimeEntryResponse.fromEntity(entry);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimeAttendanceDto.TimeEntryResponse> getPendingApprovals() {
        return timeEntryRepository.findPendingApproval()
                .stream()
                .map(TimeAttendanceDto.TimeEntryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimeAttendanceDto.TimeEntryResponse> getPendingApprovalsForEmployees(List<UUID> employeeIds) {
        return timeEntryRepository.findPendingApprovalForEmployees(employeeIds)
                .stream()
                .map(TimeAttendanceDto.TimeEntryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // === Timesheet Operations ===

    @Override
    public TimeAttendanceDto.TimesheetResponse createTimesheet(TimeAttendanceDto.CreateTimesheetRequest request) {
        Timesheet timesheet = Timesheet.create(
                request.employeeId(),
                request.periodType(),
                request.periodStart(),
                request.periodEnd()
        );
        timesheet.setEmployeeNotes(request.employeeNotes());
        timesheet.setWorkingDaysInPeriod(calculateWorkingDays(request.periodStart(), request.periodEnd()));

        timesheet = timesheetRepository.save(timesheet);
        return TimeAttendanceDto.TimesheetResponse.fromEntity(timesheet);
    }

    @Override
    public TimeAttendanceDto.TimesheetResponse generateTimesheet(
            UUID employeeId, LocalDate periodStart, LocalDate periodEnd) {
        // Check if timesheet already exists
        Optional<Timesheet> existing = timesheetRepository.findByEmployeeAndPeriod(
                employeeId, periodStart, periodEnd);
        if (existing.isPresent()) {
            throw new IllegalStateException("Timesheet already exists for this period");
        }

        Timesheet timesheet = Timesheet.create(
                employeeId,
                Timesheet.PeriodType.MONTHLY,
                periodStart,
                periodEnd
        );
        timesheet.setWorkingDaysInPeriod(calculateWorkingDays(periodStart, periodEnd));

        // Get all time entries for the period
        List<TimeEntry> entries = timeEntryRepository.findByEmployeeAndDateRange(
                employeeId, periodStart, periodEnd);

        // Aggregate hours
        for (TimeEntry entry : entries) {
            if (entry.getStatus() != TimeEntry.TimeEntryStatus.REJECTED &&
                    entry.getStatus() != TimeEntry.TimeEntryStatus.CANCELLED) {
                timesheet.addTimeEntry(entry);
            }
        }

        timesheet = timesheetRepository.save(timesheet);
        return TimeAttendanceDto.TimesheetResponse.fromEntity(timesheet);
    }

    @Override
    public List<TimeAttendanceDto.TimesheetResponse> generateTimesheets(
            TimeAttendanceDto.GenerateTimesheetsRequest request) {
        List<TimeAttendanceDto.TimesheetResponse> timesheets = new ArrayList<>();

        // Get all time entries for the period
        List<TimeEntry> allEntries = timeEntryRepository.findByDateRange(
                request.periodStart(), request.periodEnd());

        // Group by employee
        Map<UUID, List<TimeEntry>> entriesByEmployee = allEntries.stream()
                .filter(e -> request.employeeIds() == null || request.employeeIds().contains(e.getEmployeeId()))
                .collect(Collectors.groupingBy(TimeEntry::getEmployeeId));

        Timesheet.PeriodType periodType = request.periodType() != null ?
                request.periodType() : Timesheet.PeriodType.MONTHLY;

        for (Map.Entry<UUID, List<TimeEntry>> empEntries : entriesByEmployee.entrySet()) {
            UUID employeeId = empEntries.getKey();

            // Check if timesheet already exists
            if (timesheetRepository.findByEmployeeAndPeriod(
                    employeeId, request.periodStart(), request.periodEnd()).isPresent()) {
                continue;
            }

            Timesheet timesheet = Timesheet.create(
                    employeeId,
                    periodType,
                    request.periodStart(),
                    request.periodEnd()
            );
            timesheet.setWorkingDaysInPeriod(calculateWorkingDays(request.periodStart(), request.periodEnd()));

            for (TimeEntry entry : empEntries.getValue()) {
                if (entry.getStatus() != TimeEntry.TimeEntryStatus.REJECTED &&
                        entry.getStatus() != TimeEntry.TimeEntryStatus.CANCELLED) {
                    timesheet.addTimeEntry(entry);
                }
            }

            timesheet = timesheetRepository.save(timesheet);
            timesheets.add(TimeAttendanceDto.TimesheetResponse.fromEntity(timesheet));
        }

        return timesheets;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<TimeAttendanceDto.TimesheetResponse> getTimesheet(UUID timesheetId) {
        return timesheetRepository.findById(timesheetId)
                .filter(t -> !t.isDeleted())
                .map(TimeAttendanceDto.TimesheetResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<TimeAttendanceDto.TimesheetResponse> getTimesheetByReference(String reference) {
        return timesheetRepository.findByTimesheetReference(reference)
                .map(TimeAttendanceDto.TimesheetResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimeAttendanceDto.TimesheetResponse> getTimesheetsForEmployee(UUID employeeId) {
        return timesheetRepository.findByEmployeeId(employeeId)
                .stream()
                .map(TimeAttendanceDto.TimesheetResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TimeAttendanceDto.TimesheetResponse> searchTimesheets(
            UUID employeeId,
            UUID departmentId,
            Timesheet.TimesheetStatus status,
            Integer year,
            Integer month,
            Pageable pageable) {
        return timesheetRepository.search(employeeId, departmentId, status, year, month, pageable)
                .map(TimeAttendanceDto.TimesheetResponse::fromEntity);
    }

    // === Timesheet Workflow ===

    @Override
    public TimeAttendanceDto.TimesheetResponse submitTimesheet(UUID timesheetId, UUID submitterId) {
        Timesheet timesheet = timesheetRepository.findById(timesheetId)
                .orElseThrow(() -> new IllegalArgumentException("Timesheet not found"));

        timesheet.submit(submitterId);

        timesheet = timesheetRepository.save(timesheet);
        return TimeAttendanceDto.TimesheetResponse.fromEntity(timesheet);
    }

    @Override
    public TimeAttendanceDto.TimesheetResponse approveTimesheet(UUID timesheetId, UUID approverId, String notes) {
        Timesheet timesheet = timesheetRepository.findById(timesheetId)
                .orElseThrow(() -> new IllegalArgumentException("Timesheet not found"));

        if (!timesheet.canBeApproved()) {
            throw new IllegalStateException("Timesheet cannot be approved in current state");
        }

        timesheet.approve(approverId);
        if (notes != null) {
            timesheet.setManagerNotes(notes);
        }

        timesheet = timesheetRepository.save(timesheet);
        return TimeAttendanceDto.TimesheetResponse.fromEntity(timesheet);
    }

    @Override
    public TimeAttendanceDto.TimesheetResponse rejectTimesheet(UUID timesheetId, UUID reviewerId, String reason) {
        Timesheet timesheet = timesheetRepository.findById(timesheetId)
                .orElseThrow(() -> new IllegalArgumentException("Timesheet not found"));

        timesheet.reject(reviewerId, reason);

        timesheet = timesheetRepository.save(timesheet);
        return TimeAttendanceDto.TimesheetResponse.fromEntity(timesheet);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimeAttendanceDto.TimesheetResponse> getPendingTimesheetApprovals() {
        return timesheetRepository.findPendingApproval()
                .stream()
                .map(TimeAttendanceDto.TimesheetResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimeAttendanceDto.TimesheetResponse> getApprovedTimesheetsForPayroll(int year, int month) {
        return timesheetRepository.findApprovedForPayrollPeriod(year, month)
                .stream()
                .map(TimeAttendanceDto.TimesheetResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public void markTimesheetsAsProcessed(List<UUID> timesheetIds, UUID payrollRunId) {
        for (UUID timesheetId : timesheetIds) {
            timesheetRepository.findById(timesheetId).ifPresent(timesheet -> {
                timesheet.markAsProcessed(payrollRunId);
                timesheetRepository.save(timesheet);
            });
        }
    }

    // === Work Schedule Operations ===

    @Override
    public TimeAttendanceDto.ScheduleResponse createSchedule(TimeAttendanceDto.CreateScheduleRequest request) {
        // Deactivate any existing active schedules
        workScheduleRepository.findCurrentForEmployee(request.employeeId())
                .ifPresent(existing -> {
                    existing.deactivate(request.effectiveFrom().minusDays(1));
                    workScheduleRepository.save(existing);
                });

        WorkSchedule schedule = new WorkSchedule();
        schedule.setEmployeeId(request.employeeId());
        schedule.setScheduleType(request.scheduleType());
        schedule.setStandardStartTime(request.standardStartTime());
        schedule.setStandardEndTime(request.standardEndTime());
        schedule.setHoursPerDay(request.hoursPerDay());
        schedule.setHoursPerWeek(request.hoursPerWeek());
        schedule.setWorksMonday(request.worksMonday());
        schedule.setWorksTuesday(request.worksTuesday());
        schedule.setWorksWednesday(request.worksWednesday());
        schedule.setWorksThursday(request.worksThursday());
        schedule.setWorksFriday(request.worksFriday());
        schedule.setWorksSaturday(request.worksSaturday());
        schedule.setWorksSunday(request.worksSunday());
        schedule.setFlexible(request.flexible());
        schedule.setFlexStartEarliest(request.flexStartEarliest());
        schedule.setFlexStartLatest(request.flexStartLatest());
        schedule.setCoreHoursStart(request.coreHoursStart());
        schedule.setCoreHoursEnd(request.coreHoursEnd());
        schedule.setLunchBreakStart(request.lunchBreakStart());
        schedule.setLunchBreakDurationMinutes(request.lunchBreakDurationMinutes());
        schedule.setLunchBreakPaid(request.lunchBreakPaid());
        schedule.setEffectiveFrom(request.effectiveFrom());
        schedule.setEffectiveTo(request.effectiveTo());
        schedule.setNotes(request.notes());
        schedule.setActive(true);

        schedule = workScheduleRepository.save(schedule);
        return TimeAttendanceDto.ScheduleResponse.fromEntity(schedule);
    }

    @Override
    public TimeAttendanceDto.ScheduleResponse updateSchedule(
            UUID scheduleId, TimeAttendanceDto.CreateScheduleRequest request) {
        WorkSchedule schedule = workScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found"));

        schedule.setScheduleType(request.scheduleType());
        schedule.setStandardStartTime(request.standardStartTime());
        schedule.setStandardEndTime(request.standardEndTime());
        schedule.setHoursPerDay(request.hoursPerDay());
        schedule.setHoursPerWeek(request.hoursPerWeek());
        schedule.setWorksMonday(request.worksMonday());
        schedule.setWorksTuesday(request.worksTuesday());
        schedule.setWorksWednesday(request.worksWednesday());
        schedule.setWorksThursday(request.worksThursday());
        schedule.setWorksFriday(request.worksFriday());
        schedule.setWorksSaturday(request.worksSaturday());
        schedule.setWorksSunday(request.worksSunday());
        schedule.setFlexible(request.flexible());
        schedule.setLunchBreakStart(request.lunchBreakStart());
        schedule.setLunchBreakDurationMinutes(request.lunchBreakDurationMinutes());
        schedule.setNotes(request.notes());

        schedule = workScheduleRepository.save(schedule);
        return TimeAttendanceDto.ScheduleResponse.fromEntity(schedule);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<TimeAttendanceDto.ScheduleResponse> getSchedule(UUID scheduleId) {
        return workScheduleRepository.findById(scheduleId)
                .filter(s -> !s.isDeleted())
                .map(TimeAttendanceDto.ScheduleResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<TimeAttendanceDto.ScheduleResponse> getCurrentScheduleForEmployee(UUID employeeId) {
        return workScheduleRepository.findCurrentForEmployee(employeeId)
                .map(TimeAttendanceDto.ScheduleResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimeAttendanceDto.ScheduleResponse> getSchedulesForEmployee(UUID employeeId) {
        return workScheduleRepository.findByEmployeeId(employeeId)
                .stream()
                .map(TimeAttendanceDto.ScheduleResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public void deactivateSchedule(UUID scheduleId, LocalDate endDate) {
        workScheduleRepository.findById(scheduleId).ifPresent(schedule -> {
            schedule.deactivate(endDate);
            workScheduleRepository.save(schedule);
        });
    }

    // === Public Holiday Operations ===

    @Override
    @Transactional(readOnly = true)
    public List<TimeAttendanceDto.PublicHolidayResponse> getPublicHolidaysForYear(int year) {
        return publicHolidayRepository.findByYear(year)
                .stream()
                .map(TimeAttendanceDto.PublicHolidayResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimeAttendanceDto.PublicHolidayResponse> getPublicHolidaysInRange(
            LocalDate startDate, LocalDate endDate) {
        return publicHolidayRepository.findByDateRange(startDate, endDate)
                .stream()
                .map(TimeAttendanceDto.PublicHolidayResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isPublicHoliday(LocalDate date) {
        return publicHolidayRepository.isPublicHoliday(date);
    }

    @Override
    public void generatePublicHolidaysForYear(int year) {
        // Check if already generated
        if (!publicHolidayRepository.findByYear(year).isEmpty()) {
            return;
        }

        List<PublicHoliday> holidays = PublicHoliday.generateForYear(year);
        publicHolidayRepository.saveAll(holidays);
    }

    // === Dashboard & Reporting ===

    @Override
    @Transactional(readOnly = true)
    public TimeAttendanceDto.AttendanceDashboard getDashboard() {
        LocalDate today = LocalDate.now();

        Object[] dailySummary = timeEntryRepository.getDailySummary(today);
        int presentToday = dailySummary[0] != null ? ((Number) dailySummary[0]).intValue() : 0;
        int lateToday = dailySummary[3] != null ? ((Number) dailySummary[3]).intValue() : 0;
        BigDecimal totalHours = dailySummary[1] != null ? (BigDecimal) dailySummary[1] : BigDecimal.ZERO;

        List<TimeAttendanceDto.TimeEntryResponse> recentClockIns = timeEntryRepository
                .findByDateRange(today, today)
                .stream()
                .limit(10)
                .map(TimeAttendanceDto.TimeEntryResponse::fromEntity)
                .collect(Collectors.toList());

        List<TimeAttendanceDto.TimeEntryResponse> pendingApprovals = getPendingApprovals();

        return new TimeAttendanceDto.AttendanceDashboard(
                today,
                0, // Would need employee count from HR service
                presentToday,
                0, // Absent count
                lateToday,
                0, // On leave count
                presentToday > 0 ? totalHours.divide(BigDecimal.valueOf(presentToday), 2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO,
                recentClockIns,
                pendingApprovals
        );
    }

    @Override
    @Transactional(readOnly = true)
    public TimeAttendanceDto.EmployeeAttendanceSummary getEmployeeAttendanceSummary(
            UUID employeeId, LocalDate periodStart, LocalDate periodEnd) {
        BigDecimal totalHours = timeEntryRepository.sumHoursByEmployeeAndDateRange(
                employeeId, periodStart, periodEnd);
        BigDecimal overtimeHours = timeEntryRepository.sumOvertimeByEmployeeAndDateRange(
                employeeId, periodStart, periodEnd);
        long workedDays = timeEntryRepository.countWorkedDays(employeeId, periodStart, periodEnd);
        long lateDays = timeEntryRepository.countLateDays(employeeId, periodStart, periodEnd);

        int workingDays = calculateWorkingDays(periodStart, periodEnd);
        int absentDays = workingDays - (int) workedDays;

        BigDecimal attendancePercentage = workingDays > 0 ?
                BigDecimal.valueOf(workedDays * 100.0 / workingDays) : BigDecimal.ZERO;

        return new TimeAttendanceDto.EmployeeAttendanceSummary(
                employeeId,
                null, // Would need to fetch from HR
                null,
                periodStart,
                periodEnd,
                (int) workedDays,
                absentDays,
                (int) lateDays,
                0, // Leave days
                totalHours != null ? totalHours : BigDecimal.ZERO,
                totalHours != null && overtimeHours != null ?
                        totalHours.subtract(overtimeHours) : BigDecimal.ZERO,
                overtimeHours != null ? overtimeHours : BigDecimal.ZERO,
                attendancePercentage
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimeAttendanceDto.DailyAttendanceSummary> getDailyAttendanceSummary(
            LocalDate startDate, LocalDate endDate) {
        List<TimeAttendanceDto.DailyAttendanceSummary> summaries = new ArrayList<>();

        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            Object[] summary = timeEntryRepository.getDailySummary(current);

            int presentCount = summary[0] != null ? ((Number) summary[0]).intValue() : 0;
            BigDecimal totalHours = summary[1] != null ? (BigDecimal) summary[1] : BigDecimal.ZERO;
            BigDecimal overtimeHours = summary[2] != null ? (BigDecimal) summary[2] : BigDecimal.ZERO;
            int lateCount = summary[3] != null ? ((Number) summary[3]).intValue() : 0;

            boolean isWeekend = current.getDayOfWeek() == DayOfWeek.SATURDAY ||
                    current.getDayOfWeek() == DayOfWeek.SUNDAY;
            boolean isPublicHoliday = publicHolidayRepository.isPublicHoliday(current);
            String holidayName = isPublicHoliday ?
                    publicHolidayRepository.findByHolidayDate(current)
                            .map(PublicHoliday::getName).orElse(null) : null;

            summaries.add(new TimeAttendanceDto.DailyAttendanceSummary(
                    current,
                    presentCount,
                    0, // Absent count
                    lateCount,
                    0, // On leave count
                    totalHours,
                    overtimeHours,
                    isWeekend,
                    isPublicHoliday,
                    holidayName
            ));

            current = current.plusDays(1);
        }

        return summaries;
    }

    @Override
    @Transactional(readOnly = true)
    public TimeAttendanceDto.OvertimeReport getOvertimeReport(LocalDate periodStart, LocalDate periodEnd) {
        List<TimeEntry> entriesWithOvertime = timeEntryRepository.findWithOvertime(periodStart, periodEnd);

        Map<UUID, TimeAttendanceDto.EmployeeOvertimeSummary> summaryByEmployee = new HashMap<>();

        for (TimeEntry entry : entriesWithOvertime) {
            UUID empId = entry.getEmployeeId();

            TimeAttendanceDto.EmployeeOvertimeSummary existing = summaryByEmployee.get(empId);
            if (existing == null) {
                existing = new TimeAttendanceDto.EmployeeOvertimeSummary(
                        empId,
                        entry.getEmployeeNumber(),
                        entry.getEmployeeName(),
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO
                );
            }

            BigDecimal weekdayOT = existing.weekdayOvertimeHours();
            BigDecimal sundayHrs = existing.sundayHours();
            BigDecimal holidayHrs = existing.publicHolidayHours();
            BigDecimal nightHrs = existing.nightHours();

            if (entry.getOvertimeHours() != null && !entry.isPublicHoliday() &&
                    entry.getWorkDate().getDayOfWeek() != DayOfWeek.SUNDAY) {
                weekdayOT = weekdayOT.add(entry.getOvertimeHours());
            }
            if (entry.getSundayHours() != null) {
                sundayHrs = sundayHrs.add(entry.getSundayHours());
            }
            if (entry.getPublicHolidayHours() != null) {
                holidayHrs = holidayHrs.add(entry.getPublicHolidayHours());
            }
            if (entry.getNightHours() != null) {
                nightHrs = nightHrs.add(entry.getNightHours());
            }

            BigDecimal total = weekdayOT.add(sundayHrs).add(holidayHrs);

            summaryByEmployee.put(empId, new TimeAttendanceDto.EmployeeOvertimeSummary(
                    empId,
                    entry.getEmployeeNumber(),
                    entry.getEmployeeName(),
                    weekdayOT,
                    sundayHrs,
                    holidayHrs,
                    nightHrs,
                    total
            ));
        }

        List<TimeAttendanceDto.EmployeeOvertimeSummary> employees = new ArrayList<>(summaryByEmployee.values());

        BigDecimal totalOvertime = employees.stream()
                .map(TimeAttendanceDto.EmployeeOvertimeSummary::weekdayOvertimeHours)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalSunday = employees.stream()
                .map(TimeAttendanceDto.EmployeeOvertimeSummary::sundayHours)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalHoliday = employees.stream()
                .map(TimeAttendanceDto.EmployeeOvertimeSummary::publicHolidayHours)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalNight = employees.stream()
                .map(TimeAttendanceDto.EmployeeOvertimeSummary::nightHours)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new TimeAttendanceDto.OvertimeReport(
                periodStart,
                periodEnd,
                employees,
                totalOvertime,
                totalSunday,
                totalHoliday,
                totalNight
        );
    }

    // === Utility Operations ===

    @Override
    public int calculateWorkingDays(LocalDate startDate, LocalDate endDate) {
        int workingDays = 0;
        LocalDate current = startDate;

        while (!current.isAfter(endDate)) {
            DayOfWeek day = current.getDayOfWeek();
            if (day != DayOfWeek.SATURDAY && day != DayOfWeek.SUNDAY) {
                if (!publicHolidayRepository.isPublicHoliday(current)) {
                    workingDays++;
                }
            }
            current = current.plusDays(1);
        }

        return workingDays;
    }

    @Override
    @Scheduled(cron = "0 0 */4 * * *") // Every 4 hours
    public void autoClockOutForgottenEntries() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(12);
        List<TimeEntry> forgotten = timeEntryRepository.findForgottenClockOuts(cutoff);

        for (TimeEntry entry : forgotten) {
            // Auto clock out at the end of their scheduled day or after 12 hours
            LocalDateTime autoClockOut = entry.getScheduledEnd() != null ?
                    entry.getWorkDate().atTime(entry.getScheduledEnd()) :
                    entry.getClockIn().plusHours(12);

            entry.setClockOut(autoClockOut);
            entry.setStatus(TimeEntry.TimeEntryStatus.PENDING_APPROVAL);
            entry.setRequiresApproval(true);
            entry.setNotes((entry.getNotes() != null ? entry.getNotes() + "\n" : "") +
                    "Auto-clocked out - forgot to clock out");
            entry.calculateHours();

            timeEntryRepository.save(entry);
        }
    }
}
