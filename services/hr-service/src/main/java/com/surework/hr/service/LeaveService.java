package com.surework.hr.service;

import com.surework.hr.domain.LeaveRequest;
import com.surework.hr.dto.LeaveDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service interface for Leave operations.
 * Implements User Story 2: Leave Management.
 */
public interface LeaveService {

    /**
     * Create a new leave request.
     */
    LeaveDto.Response createLeaveRequest(UUID employeeId, LeaveDto.CreateRequest request);

    /**
     * Get leave request by ID.
     */
    Optional<LeaveDto.Response> getLeaveRequest(UUID requestId);

    /**
     * Search leave requests with filters.
     */
    Page<LeaveDto.Response> searchLeaveRequests(
            UUID employeeId,
            LeaveRequest.LeaveStatus status,
            LeaveRequest.LeaveType leaveType,
            LocalDate fromDate,
            LocalDate toDate,
            Pageable pageable
    );

    /**
     * Get pending requests for a manager.
     */
    List<LeaveDto.Response> getPendingRequestsForManager(UUID managerId);

    /**
     * Approve a leave request.
     */
    LeaveDto.Response approveLeaveRequest(UUID requestId, UUID approverId, String comment);

    /**
     * Reject a leave request.
     */
    LeaveDto.Response rejectLeaveRequest(UUID requestId, UUID approverId, String comment);

    /**
     * Cancel a leave request.
     */
    LeaveDto.Response cancelLeaveRequest(UUID requestId, String reason);

    /**
     * Get leave balances for an employee.
     */
    List<LeaveDto.BalanceResponse> getLeaveBalances(UUID employeeId, int year);

    /**
     * Initialize leave balances for a new employee.
     */
    void initializeLeaveBalances(UUID employeeId);

    /**
     * Carry over annual leave to next year.
     */
    void carryOverAnnualLeave(UUID employeeId, int fromYear, int toYear);
}
