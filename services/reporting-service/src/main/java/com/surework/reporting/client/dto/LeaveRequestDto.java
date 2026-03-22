package com.surework.reporting.client.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Leave Request data transfer object from Leave Service.
 */
public record LeaveRequestDto(
        UUID id,
        UUID employeeId,
        String leaveType,
        LocalDate startDate,
        LocalDate endDate,
        int days,
        String status,
        String reason,
        UUID approverId,
        LocalDate approvalDate,
        String approverComment,
        LocalDate cancellationDate,
        String cancellationReason,
        LocalDateTime createdAt
) {}
