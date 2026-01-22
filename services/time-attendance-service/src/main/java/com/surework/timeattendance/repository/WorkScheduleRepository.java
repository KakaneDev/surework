package com.surework.timeattendance.repository;

import com.surework.timeattendance.domain.WorkSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for WorkSchedule entities.
 */
@Repository
public interface WorkScheduleRepository extends JpaRepository<WorkSchedule, UUID> {

    /**
     * Find active schedule for employee on a specific date.
     */
    @Query("SELECT s FROM WorkSchedule s WHERE s.employeeId = :employeeId " +
            "AND s.active = true AND s.effectiveFrom <= :date " +
            "AND (s.effectiveTo IS NULL OR s.effectiveTo >= :date) " +
            "AND s.deleted = false ORDER BY s.effectiveFrom DESC")
    Optional<WorkSchedule> findActiveForEmployeeOnDate(
            @Param("employeeId") UUID employeeId,
            @Param("date") LocalDate date);

    /**
     * Find current schedule for employee.
     */
    @Query("SELECT s FROM WorkSchedule s WHERE s.employeeId = :employeeId " +
            "AND s.active = true AND s.deleted = false ORDER BY s.effectiveFrom DESC")
    Optional<WorkSchedule> findCurrentForEmployee(@Param("employeeId") UUID employeeId);

    /**
     * Find all schedules for employee.
     */
    @Query("SELECT s FROM WorkSchedule s WHERE s.employeeId = :employeeId AND s.deleted = false " +
            "ORDER BY s.effectiveFrom DESC")
    List<WorkSchedule> findByEmployeeId(@Param("employeeId") UUID employeeId);

    /**
     * Find active schedules by shift.
     */
    @Query("SELECT s FROM WorkSchedule s WHERE s.shiftId = :shiftId " +
            "AND s.active = true AND s.deleted = false")
    List<WorkSchedule> findByShiftId(@Param("shiftId") UUID shiftId);

    /**
     * Find schedules by type.
     */
    @Query("SELECT s FROM WorkSchedule s WHERE s.scheduleType = :type " +
            "AND s.active = true AND s.deleted = false")
    List<WorkSchedule> findByScheduleType(@Param("type") WorkSchedule.ScheduleType type);

    /**
     * Find employees working on a specific day.
     */
    @Query("SELECT s FROM WorkSchedule s WHERE s.active = true AND s.deleted = false " +
            "AND s.effectiveFrom <= :date AND (s.effectiveTo IS NULL OR s.effectiveTo >= :date)")
    List<WorkSchedule> findActiveOnDate(@Param("date") LocalDate date);
}
