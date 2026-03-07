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
import java.util.Set;
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
    private final PublicHolidayService publicHolidayService;
    private final TaxYearService taxYearService;

    @Override
    @Transactional
    public LeaveDto.Response createLeaveRequest(UUID employeeId, LeaveDto.CreateRequest request) {
        Employee employee = employeeRepository.findByIdAndTenantId(employeeId, TenantContext.requireTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));

        // Validate dates
        if (request.endDate().isBefore(request.startDate())) {
            throw new BusinessRuleException("End date cannot be before start date");
        }

        // Calculate working days (excluding weekends and public holidays)
        int days = publicHolidayService.calculateWorkingDays(request.startDate(), request.endDate());
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
            // Use tax year (March-February) for balance lookup
            int taxYear = taxYearService.getTaxYear(request.startDate());
            LeaveBalance balance = getOrCreateBalance(employee, request.leaveType(), taxYear);

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

        // Tenant isolation: always set tenantId from context before saving
        leaveRequest.setTenantId(TenantContext.requireTenantId());

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
        return leaveRequestRepository.findByIdAndTenantId(requestId, TenantContext.requireTenantId())
                .map(LeaveDto.Response::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<LeaveDto.Response> getLeaveRequest(UUID requestId, UUID userId, Set<String> userRoles) {
        return leaveRequestRepository.findByIdAndTenantId(requestId, TenantContext.requireTenantId())
                .filter(r -> {
                    // Allow if user owns the request
                    if (r.getEmployee().getId().equals(userId)) {
                        return true;
                    }
                    // Allow if user has an approver/admin role
                    return hasApproverRole(userRoles);
                })
                .map(LeaveDto.Response::fromEntity);
    }

    /**
     * Check if user has a role that can view/approve leave requests.
     */
    private boolean hasApproverRole(Set<String> roles) {
        Set<String> approverRoles = Set.of(
                "SUPER_ADMIN", "TENANT_ADMIN", "HR_MANAGER",
                "DEPARTMENT_MANAGER", "PAYROLL_ADMIN"
        );
        return roles.stream().anyMatch(approverRoles::contains);
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
        return leaveRequestRepository.searchByTenantId(TenantContext.requireTenantId(), employeeId, status, leaveType, fromDate, toDate, pageable)
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
    @Transactional(readOnly = true)
    public Page<LeaveDto.Response> getAllPendingRequests(Pageable pageable) {
        return leaveRequestRepository.findAllPendingRequestsByTenantId(TenantContext.requireTenantId(), pageable)
                .map(LeaveDto.Response::fromEntity);
    }

    @Override
    @Transactional
    public LeaveDto.Response approveLeaveRequest(UUID requestId, UUID approverId, UUID approverEmployeeId, String comment) {
        LeaveRequest request = leaveRequestRepository.findByIdAndTenantId(requestId, TenantContext.requireTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("LeaveRequest", requestId));

        if (request.getStatus() != LeaveRequest.LeaveStatus.PENDING) {
            throw new BusinessRuleException("Only pending requests can be approved");
        }

        // Prevent self-approval for segregation of duties
        // Compare the approver's employee ID with the request's employee ID
        if (approverEmployeeId != null && request.getEmployee().getId().equals(approverEmployeeId)) {
            throw new BusinessRuleException("You cannot approve your own leave request");
        }

        request.approve(approverId, comment);
        final int days = request.getDays();
        final UUID employeeId = request.getEmployee().getId();
        final LeaveRequest.LeaveType leaveType = request.getLeaveType();
        final int taxYear = taxYearService.getTaxYear(request.getStartDate());
        request = leaveRequestRepository.save(request);

        // Confirm the balance usage
        if (requiresBalanceCheck(leaveType)) {
            leaveBalanceRepository.findByEmployeeIdAndLeaveTypeAndYear(
                    employeeId, leaveType, taxYear
            ).ifPresent(balance -> {
                balance.confirmUsage(days);
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
    public LeaveDto.Response rejectLeaveRequest(UUID requestId, UUID approverId, UUID approverEmployeeId, String comment) {
        LeaveRequest request = leaveRequestRepository.findByIdAndTenantId(requestId, TenantContext.requireTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("LeaveRequest", requestId));

        if (request.getStatus() != LeaveRequest.LeaveStatus.PENDING) {
            throw new BusinessRuleException("Only pending requests can be rejected");
        }

        // Prevent self-rejection (use cancel instead)
        // Compare the approver's employee ID with the request's employee ID
        if (approverEmployeeId != null && request.getEmployee().getId().equals(approverEmployeeId)) {
            throw new BusinessRuleException("You cannot reject your own leave request. Use cancel instead.");
        }

        request.reject(approverId, comment);
        final int days = request.getDays();
        final UUID employeeId = request.getEmployee().getId();
        final LeaveRequest.LeaveType leaveType = request.getLeaveType();
        final int taxYear = taxYearService.getTaxYear(request.getStartDate());
        request = leaveRequestRepository.save(request);

        // Release reserved balance
        if (requiresBalanceCheck(leaveType)) {
            leaveBalanceRepository.findByEmployeeIdAndLeaveTypeAndYear(
                    employeeId, leaveType, taxYear
            ).ifPresent(balance -> {
                balance.releaseReservedDays(days);
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
    public LeaveDto.Response cancelLeaveRequest(UUID requestId, UUID userId, String reason) {
        LeaveRequest request = leaveRequestRepository.findByIdAndTenantId(requestId, TenantContext.requireTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("LeaveRequest", requestId));

        // Verify ownership - only the request owner can cancel their own request
        if (!request.getEmployee().getId().equals(userId)) {
            throw new BusinessRuleException("You can only cancel your own leave requests");
        }

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
        final int days = request.getDays();
        final UUID employeeId = request.getEmployee().getId();
        final LeaveRequest.LeaveType leaveType = request.getLeaveType();
        final int taxYear = taxYearService.getTaxYear(request.getStartDate());
        request = leaveRequestRepository.save(request);

        // Restore balance
        if (requiresBalanceCheck(leaveType)) {
            leaveBalanceRepository.findByEmployeeIdAndLeaveTypeAndYear(
                    employeeId, leaveType, taxYear
            ).ifPresent(balance -> {
                balance.releaseReservedDays(days);
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

        log.info("Cancelled leave request {} by user {} - reason: {}", requestId, userId, reason);

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
        Employee employee = employeeRepository.findByIdAndTenantId(employeeId, TenantContext.requireTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));

        // Use tax year (March-February) for balance initialization
        int currentTaxYear = taxYearService.getCurrentTaxYear();

        // Create annual leave balance
        if (leaveBalanceRepository.findByEmployeeIdAndLeaveTypeAndYear(
                employeeId, LeaveRequest.LeaveType.ANNUAL, currentTaxYear).isEmpty()) {
            LeaveBalance annual = LeaveBalance.createAnnualBalance(employee, currentTaxYear);
            leaveBalanceRepository.save(annual);
        }

        // Create sick leave balance (36-month cycle from hire date)
        if (leaveBalanceRepository.findByEmployeeIdAndLeaveTypeAndYear(
                employeeId, LeaveRequest.LeaveType.SICK, currentTaxYear).isEmpty()) {
            LeaveBalance sick = LeaveBalance.createSickBalance(employee, currentTaxYear, employee.getHireDate());
            leaveBalanceRepository.save(sick);
        }

        // Create family responsibility balance
        if (leaveBalanceRepository.findByEmployeeIdAndLeaveTypeAndYear(
                employeeId, LeaveRequest.LeaveType.FAMILY_RESPONSIBILITY, currentTaxYear).isEmpty()) {
            LeaveBalance fr = LeaveBalance.createFamilyResponsibilityBalance(employee, currentTaxYear);
            leaveBalanceRepository.save(fr);
        }

        log.info("Initialized leave balances for employee {} for tax year {}", employeeId, currentTaxYear);
    }

    @Override
    @Transactional
    public void carryOverAnnualLeave(UUID employeeId, int fromYear, int toYear) {
        Optional<LeaveBalance> fromBalance = leaveBalanceRepository.findByEmployeeIdAndLeaveTypeAndYear(
                employeeId, LeaveRequest.LeaveType.ANNUAL, fromYear);

        if (fromBalance.isEmpty()) {
            return;
        }

        Employee employee = employeeRepository.findByIdAndTenantId(employeeId, TenantContext.requireTenantId())
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
        // For sick leave, use the 36-month cycle logic
        if (leaveType == LeaveRequest.LeaveType.SICK) {
            return getOrCreateSickLeaveBalance(employee, LocalDate.now());
        }

        return leaveBalanceRepository.findByEmployeeIdAndLeaveTypeAndYear(
                        employee.getId(), leaveType, year)
                .orElseGet(() -> {
                    LeaveBalance balance = switch (leaveType) {
                        case ANNUAL -> LeaveBalance.createAnnualBalance(employee, year);
                        case FAMILY_RESPONSIBILITY -> LeaveBalance.createFamilyResponsibilityBalance(employee, year);
                        default -> throw new BusinessRuleException("Unsupported leave type for balance: " + leaveType);
                    };
                    return leaveBalanceRepository.save(balance);
                });
    }

    /**
     * Get or create sick leave balance based on the 36-month cycle.
     * BCEA: Employees get 30 days sick leave per 36-month cycle.
     * The cycle starts from the employee's hire date.
     * When a cycle ends, a new one begins with a fresh 30-day entitlement.
     */
    private LeaveBalance getOrCreateSickLeaveBalance(Employee employee, LocalDate asOfDate) {
        LocalDate hireDate = employee.getHireDate();
        if (hireDate == null) {
            hireDate = asOfDate; // Fallback if no hire date
        }

        // Calculate the current sick leave cycle
        LocalDate cycleStart = calculateCurrentSickLeaveCycleStart(hireDate, asOfDate);
        LocalDate cycleEnd = cycleStart.plusMonths(36).minusDays(1);

        // Check if we have a balance for this cycle
        int cycleYear = taxYearService.getTaxYear(cycleStart);

        // First check using the cycle-based query
        Optional<LeaveBalance> existingBalance = leaveBalanceRepository
                .findCurrentSickLeaveBalance(employee.getId(), LeaveRequest.LeaveType.SICK, asOfDate);

        if (existingBalance.isPresent()) {
            LeaveBalance balance = existingBalance.get();
            // Check if this balance's cycle is still valid
            if (balance.getCycleStartDate() != null) {
                LocalDate balanceCycleEnd = balance.getCycleStartDate().plusMonths(36).minusDays(1);
                if (!asOfDate.isAfter(balanceCycleEnd)) {
                    return balance; // Current cycle is still valid
                }
            } else {
                // Balance exists but without cycle start - use it anyway
                return balance;
            }
        }

        // Also check by year to avoid duplicate key violation (in case cycle_start_date is null)
        Optional<LeaveBalance> balanceByYear = leaveBalanceRepository
                .findByEmployeeIdAndLeaveTypeAndYear(employee.getId(), LeaveRequest.LeaveType.SICK, cycleYear);

        if (balanceByYear.isPresent()) {
            LeaveBalance balance = balanceByYear.get();
            // Update cycle start date if missing
            if (balance.getCycleStartDate() == null) {
                balance.setCycleStartDate(cycleStart);
                return leaveBalanceRepository.save(balance);
            }
            return balance;
        }

        // Create new balance for the current cycle
        log.info("Creating new sick leave cycle for employee {} starting {}", employee.getId(), cycleStart);
        LeaveBalance newBalance = LeaveBalance.createSickBalance(employee, cycleYear, cycleStart);
        return leaveBalanceRepository.save(newBalance);
    }

    /**
     * Calculate the start date of the current 36-month sick leave cycle.
     * Each cycle is 36 months from hire date, repeating.
     */
    private LocalDate calculateCurrentSickLeaveCycleStart(LocalDate hireDate, LocalDate asOfDate) {
        LocalDate cycleStart = hireDate;

        // Find the current cycle by advancing 36 months until we're in the right cycle
        while (cycleStart.plusMonths(36).isBefore(asOfDate) || cycleStart.plusMonths(36).isEqual(asOfDate)) {
            cycleStart = cycleStart.plusMonths(36);
        }

        return cycleStart;
    }

    /**
     * Check if an employee's sick leave cycle has ended and needs to be renewed.
     */
    @Override
    public boolean isSickLeaveCycleExpired(UUID employeeId, LocalDate asOfDate) {
        Employee employee = employeeRepository.findByIdAndTenantId(employeeId, TenantContext.requireTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));

        Optional<LeaveBalance> currentBalance = leaveBalanceRepository
                .findCurrentSickLeaveBalance(employeeId, LeaveRequest.LeaveType.SICK, asOfDate);

        if (currentBalance.isEmpty() || currentBalance.get().getCycleStartDate() == null) {
            return true; // No cycle exists, needs initialization
        }

        LocalDate cycleEnd = currentBalance.get().getCycleStartDate().plusMonths(36).minusDays(1);
        return asOfDate.isAfter(cycleEnd);
    }

    /**
     * Get sick leave cycle information for an employee.
     */
    @Override
    public LeaveDto.SickLeaveCycleInfo getSickLeaveCycleInfo(UUID employeeId) {
        Employee employee = employeeRepository.findByIdAndTenantId(employeeId, TenantContext.requireTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));

        LocalDate hireDate = employee.getHireDate() != null ? employee.getHireDate() : LocalDate.now();
        LocalDate cycleStart = calculateCurrentSickLeaveCycleStart(hireDate, LocalDate.now());
        LocalDate cycleEnd = cycleStart.plusMonths(36).minusDays(1);

        LeaveBalance balance = getOrCreateSickLeaveBalance(employee, LocalDate.now());

        return new LeaveDto.SickLeaveCycleInfo(
                cycleStart,
                cycleEnd,
                balance.getEntitlement(),
                balance.getUsed(),
                balance.getPending(),
                balance.getAvailable()
        );
    }

    @Override
    @Transactional
    public LeaveDto.AdjustmentResponse adjustLeaveBalance(UUID employeeId, UUID adjustedBy, LeaveDto.AdjustmentRequest request) {
        Employee employee = employeeRepository.findByIdAndTenantId(employeeId, TenantContext.requireTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));

        int currentTaxYear = taxYearService.getCurrentTaxYear();

        // Get or create the balance
        LeaveBalance balance = getOrCreateBalance(employee, request.leaveType(), currentTaxYear);

        double previousEntitlement = balance.getEntitlement();
        double newEntitlement = previousEntitlement + request.adjustment();

        if (newEntitlement < 0) {
            throw new BusinessRuleException("Adjustment would result in negative entitlement");
        }

        balance.setEntitlement(newEntitlement);
        leaveBalanceRepository.save(balance);

        log.info("Adjusted {} leave balance for employee {} by {} days. Reason: {}. Adjusted by: {}",
                request.leaveType(), employeeId, request.adjustment(), request.reason(), adjustedBy);

        return new LeaveDto.AdjustmentResponse(
                balance.getId(),
                request.leaveType(),
                previousEntitlement,
                newEntitlement,
                request.adjustment(),
                request.reason(),
                adjustedBy,
                Instant.now()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LeaveDto.LeaveSummary> getAllEmployeeLeaveBalances(int year, Pageable pageable) {
        // Get all employees with pagination
        Page<Employee> employees = employeeRepository.findAll(pageable);

        return employees.map(employee -> {
            List<LeaveDto.BalanceResponse> balances = leaveBalanceRepository
                    .findAllByEmployeeAndYear(employee.getId(), year)
                    .stream()
                    .map(LeaveDto.BalanceResponse::fromEntity)
                    .toList();

            return new LeaveDto.LeaveSummary(
                    employee.getId(),
                    employee.getFullName(),
                    balances
            );
        });
    }
}

