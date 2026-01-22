package com.surework.hr.repository;

import com.surework.hr.domain.LeaveBalance;
import com.surework.hr.domain.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for LeaveBalance entity.
 */
@Repository
public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, UUID> {

    Optional<LeaveBalance> findByEmployeeIdAndLeaveTypeAndYear(
            UUID employeeId,
            LeaveRequest.LeaveType leaveType,
            int year
    );

    List<LeaveBalance> findByEmployeeIdAndYear(UUID employeeId, int year);

    List<LeaveBalance> findByEmployeeId(UUID employeeId);

    @Query("""
        SELECT lb FROM LeaveBalance lb
        WHERE lb.employee.id = :employeeId
        AND lb.leaveType = :leaveType
        AND lb.cycleStartDate <= :date
        ORDER BY lb.cycleStartDate DESC
        LIMIT 1
        """)
    Optional<LeaveBalance> findCurrentSickLeaveBalance(
            @Param("employeeId") UUID employeeId,
            @Param("leaveType") LeaveRequest.LeaveType leaveType,
            @Param("date") java.time.LocalDate date
    );

    @Query("""
        SELECT lb FROM LeaveBalance lb
        WHERE lb.employee.id = :employeeId
        AND lb.year = :year
        AND lb.deleted = false
        """)
    List<LeaveBalance> findAllByEmployeeAndYear(
            @Param("employeeId") UUID employeeId,
            @Param("year") int year
    );
}
