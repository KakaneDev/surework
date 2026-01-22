package com.surework.hr.dto;

import com.surework.hr.domain.LeaveBalance;
import com.surework.hr.domain.LeaveRequest;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTOs for Leave operations.
 */
public sealed interface LeaveDto {

    /**
     * Request to create a leave request.
     */
    record CreateRequest(
            @NotNull(message = "Leave type is required")
            LeaveRequest.LeaveType leaveType,

            @NotNull(message = "Start date is required")
            LocalDate startDate,

            @NotNull(message = "End date is required")
            LocalDate endDate,

            @Size(max = 500, message = "Reason must not exceed 500 characters")
            String reason
    ) implements LeaveDto {}

    /**
     * Request to approve/reject a leave request.
     */
    record ApprovalRequest(
            @NotNull(message = "Approved flag is required")
            Boolean approved,

            @Size(max = 500, message = "Comment must not exceed 500 characters")
            String comment
    ) implements LeaveDto {}

    /**
     * Leave request response DTO.
     */
    record Response(
            UUID id,
            EmployeeDto.EmployeeSummary employee,
            LeaveRequest.LeaveType leaveType,
            LocalDate startDate,
            LocalDate endDate,
            int days,
            LeaveRequest.LeaveStatus status,
            String reason,
            EmployeeDto.EmployeeSummary approver,
            LocalDate approvalDate,
            String approverComment,
            LocalDate cancellationDate,
            String cancellationReason,
            Instant createdAt,
            Instant updatedAt
    ) implements LeaveDto {

        public static Response fromEntity(LeaveRequest request) {
            return new Response(
                    request.getId(),
                    new EmployeeDto.EmployeeSummary(
                            request.getEmployee().getId(),
                            request.getEmployee().getEmployeeNumber(),
                            request.getEmployee().getFullName()
                    ),
                    request.getLeaveType(),
                    request.getStartDate(),
                    request.getEndDate(),
                    request.getDays(),
                    request.getStatus(),
                    request.getReason(),
                    null, // Would need to load approver
                    request.getApprovalDate(),
                    request.getApproverComment(),
                    request.getCancellationDate(),
                    request.getCancellationReason(),
                    request.getCreatedAt(),
                    request.getUpdatedAt()
            );
        }
    }

    /**
     * Leave balance response DTO.
     */
    record BalanceResponse(
            UUID id,
            LeaveRequest.LeaveType leaveType,
            int year,
            LocalDate cycleStartDate,
            double entitlement,
            double used,
            double pending,
            double carriedOver,
            double available
    ) implements LeaveDto {

        public static BalanceResponse fromEntity(LeaveBalance balance) {
            return new BalanceResponse(
                    balance.getId(),
                    balance.getLeaveType(),
                    balance.getYear(),
                    balance.getCycleStartDate(),
                    balance.getEntitlement(),
                    balance.getUsed(),
                    balance.getPending(),
                    balance.getCarriedOver(),
                    balance.getAvailable()
            );
        }
    }

    /**
     * Employee leave summary.
     */
    record LeaveSummary(
            UUID employeeId,
            String employeeName,
            java.util.List<BalanceResponse> balances
    ) implements LeaveDto {}
}
