package com.surework.hr.service;

import com.surework.hr.domain.LeaveRequest;
import com.surework.hr.dto.LeaveDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
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
     * Get leave request by ID with ownership/access verification.
     * Returns the request if:
     * - The user owns the request, OR
     * - The user has an approver/admin role
     */
    Optional<LeaveDto.Response> getLeaveRequest(UUID requestId, UUID userId, Set<String> userRoles);

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
     * Get all pending leave requests across the organization.
     * Used by HR/Admin for Phase 1 single-level approval workflow.
     */
    Page<LeaveDto.Response> getAllPendingRequests(Pageable pageable);

    /**
     * Approve a leave request.
     * @param requestId the leave request ID
     * @param approverId the approver's user ID (for audit trail)
     * @param approverEmployeeId the approver's employee ID (for self-approval check, may be null)
     * @param comment optional approval comment
     */
    LeaveDto.Response approveLeaveRequest(UUID requestId, UUID approverId, UUID approverEmployeeId, String comment);

    /**
     * Reject a leave request.
     * @param requestId the leave request ID
     * @param approverId the approver's user ID (for audit trail)
     * @param approverEmployeeId the approver's employee ID (for self-rejection check, may be null)
     * @param comment rejection reason/comment
     */
    LeaveDto.Response rejectLeaveRequest(UUID requestId, UUID approverId, UUID approverEmployeeId, String comment);

    /**
     * Cancel a leave request.
     * Verifies that the user owns the request before allowing cancellation.
     */
    LeaveDto.Response cancelLeaveRequest(UUID requestId, UUID userId, String reason);

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

    /**
     * Check if an employee's sick leave cycle has expired.
     * BCEA: 30 days sick leave per 36-month cycle.
     */
    boolean isSickLeaveCycleExpired(UUID employeeId, LocalDate asOfDate);

    /**
     * Get sick leave cycle information for an employee.
     */
    LeaveDto.SickLeaveCycleInfo getSickLeaveCycleInfo(UUID employeeId);

    /**
     * Adjust an employee's leave balance (HR only).
     * Used for manual corrections, special grants, or error fixes.
     */
    LeaveDto.AdjustmentResponse adjustLeaveBalance(UUID employeeId, UUID adjustedBy, LeaveDto.AdjustmentRequest request);

    /**
     * Get all employees' leave balances for HR view.
     */
    Page<LeaveDto.LeaveSummary> getAllEmployeeLeaveBalances(int year, Pageable pageable);
}
