package com.surework.hr.service;

import com.surework.common.messaging.DomainEventPublisher;
import com.surework.common.messaging.event.HrEvent;
import com.surework.common.security.TenantContext;
import com.surework.common.web.exception.BusinessRuleException;
import com.surework.common.web.exception.ResourceNotFoundException;
import com.surework.hr.domain.Employee;
import com.surework.hr.domain.LeaveBalance;
import com.surework.hr.domain.LeaveRequest;
import com.surework.hr.dto.LeaveDto;
import com.surework.hr.repository.EmployeeRepository;
import com.surework.hr.repository.LeaveBalanceRepository;
import com.surework.hr.repository.LeaveRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementation of LeaveService.
 * Implements User Story 2: Leave Management with BCEA compliance.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class LeaveServiceImpl implements LeaveService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final EmployeeRepository employeeRepository;
    private final DomainEventPublisher eventPublisher;

    @Override
    @Transactional
    public LeaveDto.Response createLeaveRequest(UUID employeeId, LeaveDto.CreateRequest request) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));

        // Validate dates
        if (request.endDate().isBefore(request.startDate())) {
            throw new BusinessRuleException("End date cannot be before start date");
        }

        // Calculate working days
        int days = LeaveRequest.calculateWorkingDays(request.startDate(), request.endDate());
        if (days <= 0) {
            throw new BusinessRuleException("Leave request must include at least one working day");
        }

        // Check for overlapping approved leave
        List<LeaveRequest> overlapping = leaveRequestRepository.findOverlappingApproved(
                employeeId, request.startDate(), request.endDate());
        if (!overlapping.isEmpty()) {
            throw new BusinessRuleException("Leave dates overlap with existing approved leave");
        }

        // Check balance (for applicable leave types)
        if (requiresBalanceCheck(request.leaveType())) {
            int year = request.startDate().getYear();
            LeaveBalance balance = getOrCreateBalance(employee, request.leaveType(), year);

            if (!balance.hasSufficientBalance(days)) {
                throw new BusinessRuleException(String.format(
                        "Insufficient %s leave balance. Available: %.1f days, Requested: %d days",
                        request.leaveType(), balance.getAvailable(), days));
            }

            // Reserve the days
            balance.reserveDays(days);
            leaveBalanceRepository.save(balance);
        }

        // Create leave request
        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setEmployee(employee);
        leaveRequest.setLeaveType(request.leaveType());
        leaveRequest.setStartDate(request.startDate());
        leaveRequest.setEndDate(request.endDate());
        leaveRequest.setDays(days);
        leaveRequest.setReason(request.reason());
        leaveRequest.setStatus(LeaveRequest.LeaveStatus.PENDING);

        leaveRequest = leaveRequestRepository.save(leaveRequest);

        // Publish event
        UUID tenantId = TenantContext.getTenantId().orElse(null);
        if (tenantId != null) {
            eventPublisher.publish(new HrEvent.LeaveRequested(
                    UUID.randomUUID(),
                    tenantId,
                    Instant.now(),
                    leaveRequest.getId(),
                    employeeId,
                    request.leaveType().name(),
                    request.startDate().atStartOfDay().toInstant(java.time.ZoneOffset.UTC),
                    request.endDate().atStartOfDay().toInstant(java.time.ZoneOffset.UTC),
                    days
            ));
        }

        log.info("Created leave request {} for employee {} ({} days of {})",
                leaveRequest.getId(), employeeId, days, request.leaveType());

        return LeaveDto.Response.fromEntity(leaveRequest);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<LeaveDto.Response> getLeaveRequest(UUID requestId) {
        return leaveRequestRepository.findById(requestId)
                .filter(r -> !r.isDeleted())
                .map(LeaveDto.Response::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LeaveDto.Response> searchLeaveRequests(
            UUID employeeId,
            LeaveRequest.LeaveStatus status,
            LeaveRequest.LeaveType leaveType,
            LocalDate fromDate,
            LocalDate toDate,
            Pageable pageable) {
        return leaveRequestRepository.search(employeeId, status, leaveType, fromDate, toDate, pageable)
                .map(LeaveDto.Response::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LeaveDto.Response> getPendingRequestsForManager(UUID managerId) {
        return leaveRequestRepository.findPendingForManager(managerId).stream()
                .map(LeaveDto.Response::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public LeaveDto.Response approveLeaveRequest(UUID requestId, UUID approverId, String comment) {
        LeaveRequest request = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("LeaveRequest", requestId));

        if (request.getStatus() != LeaveRequest.LeaveStatus.PENDING) {
            throw new BusinessRuleException("Only pending requests can be approved");
        }

        request.approve(approverId, comment);
        request = leaveRequestRepository.save(request);

        // Confirm the balance usage
        if (requiresBalanceCheck(request.getLeaveType())) {
            int year = request.getStartDate().getYear();
            leaveBalanceRepository.findByEmployeeIdAndLeaveTypeAndYear(
                    request.getEmployee().getId(), request.getLeaveType(), year
            ).ifPresent(balance -> {
                balance.confirmUsage(request.getDays());
                leaveBalanceRepository.save(balance);
            });
        }

        // Publish event
        UUID tenantId = TenantContext.getTenantId().orElse(null);
        if (tenantId != null) {
            eventPublisher.publish(new HrEvent.LeaveApproved(
                    UUID.randomUUID(),
                    tenantId,
                    Instant.now(),
                    requestId,
                    request.getEmployee().getId(),
                    approverId
            ));
        }

        log.info("Approved leave request {} by {}", requestId, approverId);

        return LeaveDto.Response.fromEntity(request);
    }

    @Override
    @Transactional
    public LeaveDto.Response rejectLeaveRequest(UUID requestId, UUID approverId, String comment) {
        LeaveRequest request = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("LeaveRequest", requestId));

        if (request.getStatus() != LeaveRequest.LeaveStatus.PENDING) {
            throw new BusinessRuleException("Only pending requests can be rejected");
        }

        request.reject(approverId, comment);
        request = leaveRequestRepository.save(request);

        // Release reserved balance
        if (requiresBalanceCheck(request.getLeaveType())) {
            int year = request.getStartDate().getYear();
            leaveBalanceRepository.findByEmployeeIdAndLeaveTypeAndYear(
                    request.getEmployee().getId(), request.getLeaveType(), year
            ).ifPresent(balance -> {
                balance.releaseReservedDays(request.getDays());
                leaveBalanceRepository.save(balance);
            });
        }

        // Publish event
        UUID tenantId = TenantContext.getTenantId().orElse(null);
        if (tenantId != null) {
            eventPublisher.publish(new HrEvent.LeaveRejected(
                    UUID.randomUUID(),
                    tenantId,
                    Instant.now(),
                    requestId,
                    request.getEmployee().getId(),
                    approverId,
                    comment
            ));
        }

        log.info("Rejected leave request {} by {} - reason: {}", requestId, approverId, comment);

        return LeaveDto.Response.fromEntity(request);
    }

    @Override
    @Transactional
    public LeaveDto.Response cancelLeaveRequest(UUID requestId, String reason) {
        LeaveRequest request = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("LeaveRequest", requestId));

        if (request.getStatus() == LeaveRequest.LeaveStatus.CANCELLED) {
            throw new BusinessRuleException("Request is already cancelled");
        }

        // Can only cancel pending or approved requests
        if (request.getStatus() != LeaveRequest.LeaveStatus.PENDING &&
                request.getStatus() != LeaveRequest.LeaveStatus.APPROVED) {
            throw new BusinessRuleException("Only pending or approved requests can be cancelled");
        }

        // If approved, check if leave hasn't started yet
        if (request.getStatus() == LeaveRequest.LeaveStatus.APPROVED &&
                !request.getStartDate().isAfter(LocalDate.now())) {
            throw new BusinessRuleException("Cannot cancel leave that has already started");
        }

        request.cancel(reason);
        request = leaveRequestRepository.save(request);

        // Restore balance
        if (requiresBalanceCheck(request.getLeaveType())) {
            int year = request.getStartDate().getYear();
            leaveBalanceRepository.findByEmployeeIdAndLeaveTypeAndYear(
                    request.getEmployee().getId(), request.getLeaveType(), year
            ).ifPresent(balance -> {
                balance.releaseReservedDays(request.getDays());
                leaveBalanceRepository.save(balance);
            });
        }

        // Publish event
        UUID tenantId = TenantContext.getTenantId().orElse(null);
        if (tenantId != null) {
            eventPublisher.publish(new HrEvent.LeaveCancelled(
                    UUID.randomUUID(),
                    tenantId,
                    Instant.now(),
                    requestId,
                    request.getEmployee().getId(),
                    reason
            ));
        }

        log.info("Cancelled leave request {} - reason: {}", requestId, reason);

        return LeaveDto.Response.fromEntity(request);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LeaveDto.BalanceResponse> getLeaveBalances(UUID employeeId, int year) {
        return leaveBalanceRepository.findAllByEmployeeAndYear(employeeId, year).stream()
                .map(LeaveDto.BalanceResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public void initializeLeaveBalances(UUID employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));

        int currentYear = LocalDate.now().getYear();

        // Create annual leave balance
        if (leaveBalanceRepository.findByEmployeeIdAndLeaveTypeAndYear(
                employeeId, LeaveRequest.LeaveType.ANNUAL, currentYear).isEmpty()) {
            LeaveBalance annual = LeaveBalance.createAnnualBalance(employee, currentYear);
            leaveBalanceRepository.save(annual);
        }

        // Create sick leave balance (36-month cycle from hire date)
        if (leaveBalanceRepository.findByEmployeeIdAndLeaveTypeAndYear(
                employeeId, LeaveRequest.LeaveType.SICK, currentYear).isEmpty()) {
            LeaveBalance sick = LeaveBalance.createSickBalance(employee, currentYear, employee.getHireDate());
            leaveBalanceRepository.save(sick);
        }

        // Create family responsibility balance
        if (leaveBalanceRepository.findByEmployeeIdAndLeaveTypeAndYear(
                employeeId, LeaveRequest.LeaveType.FAMILY_RESPONSIBILITY, currentYear).isEmpty()) {
            LeaveBalance fr = LeaveBalance.createFamilyResponsibilityBalance(employee, currentYear);
            leaveBalanceRepository.save(fr);
        }

        log.info("Initialized leave balances for employee {}", employeeId);
    }

    @Override
    @Transactional
    public void carryOverAnnualLeave(UUID employeeId, int fromYear, int toYear) {
        Optional<LeaveBalance> fromBalance = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeAndYear(
                employeeId, LeaveRequest.LeaveType.ANNUAL, fromYear);

        if (fromBalance.isEmpty()) {
            return;
        }

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));

        LeaveBalance newBalance = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeAndYear(
                        employeeId, LeaveRequest.LeaveType.ANNUAL, toYear)
                .orElseGet(() -> LeaveBalance.createAnnualBalance(employee, toYear));

        // Carry over unused days (up to a limit, e.g., maximum 5 days)
        double unusedDays = fromBalance.get().getAvailable();
        double carryOver = Math.min(unusedDays, 5); // Configurable limit

        newBalance.setCarriedOver(carryOver);
        leaveBalanceRepository.save(newBalance);

        log.info("Carried over {} days of annual leave for employee {} from {} to {}",
                carryOver, employeeId, fromYear, toYear);
    }

    private boolean requiresBalanceCheck(LeaveRequest.LeaveType leaveType) {
        return leaveType == LeaveRequest.LeaveType.ANNUAL ||
                leaveType == LeaveRequest.LeaveType.SICK ||
                leaveType == LeaveRequest.LeaveType.FAMILY_RESPONSIBILITY;
    }

    private LeaveBalance getOrCreateBalance(Employee employee, LeaveRequest.LeaveType leaveType, int year) {
        return leaveBalanceRepository.findByEmployeeIdAndLeaveTypeAndYear(
                        employee.getId(), leaveType, year)
                .orElseGet(() -> {
                    LeaveBalance balance = switch (leaveType) {
                        case ANNUAL -> LeaveBalance.createAnnualBalance(employee, year);
                        case SICK -> LeaveBalance.createSickBalance(employee, year, employee.getHireDate());
                        case FAMILY_RESPONSIBILITY -> LeaveBalance.createFamilyResponsibilityBalance(employee, year);
                        default -> throw new BusinessRuleException("Unsupported leave type for balance: " + leaveType);
                    };
                    return leaveBalanceRepository.save(balance);
                });
    }
}
