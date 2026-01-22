package com.surework.common.messaging.event;

import java.time.Instant;
import java.util.UUID;

/**
 * Sealed interface for HR domain events.
 * Implements Constitution Principle III: Java 21 Features (Sealed Interfaces).
 */
public sealed interface HrEvent extends DomainEvent permits
        HrEvent.EmployeeCreated,
        HrEvent.EmployeeUpdated,
        HrEvent.EmployeeTerminated,
        HrEvent.SalaryUpdated,
        HrEvent.LeaveRequested,
        HrEvent.LeaveApproved,
        HrEvent.LeaveRejected,
        HrEvent.LeaveCancelled {

    /**
     * Event raised when a new employee is created.
     */
    record EmployeeCreated(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID employeeId,
            String employeeNumber,
            String firstName,
            String lastName,
            String email
    ) implements HrEvent {}

    /**
     * Event raised when employee details are updated.
     */
    record EmployeeUpdated(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID employeeId,
            String fieldName,
            String oldValue,
            String newValue
    ) implements HrEvent {}

    /**
     * Event raised when an employee is terminated.
     */
    record EmployeeTerminated(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID employeeId,
            Instant terminationDate,
            String reason
    ) implements HrEvent {}

    /**
     * Event raised when employee salary is updated.
     */
    record SalaryUpdated(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID employeeId,
            java.math.BigDecimal previousSalary,
            java.math.BigDecimal newSalary,
            Instant effectiveDate
    ) implements HrEvent {}

    /**
     * Event raised when leave is requested.
     */
    record LeaveRequested(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID leaveRequestId,
            UUID employeeId,
            String leaveType,
            Instant startDate,
            Instant endDate,
            int days
    ) implements HrEvent {}

    /**
     * Event raised when leave is approved.
     */
    record LeaveApproved(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID leaveRequestId,
            UUID employeeId,
            UUID approvedBy
    ) implements HrEvent {}

    /**
     * Event raised when leave is rejected.
     */
    record LeaveRejected(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID leaveRequestId,
            UUID employeeId,
            UUID rejectedBy,
            String reason
    ) implements HrEvent {}

    /**
     * Event raised when leave is cancelled.
     */
    record LeaveCancelled(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID leaveRequestId,
            UUID employeeId,
            String reason
    ) implements HrEvent {}
}
