package com.surework.payroll.service;

import com.surework.common.messaging.DomainEventPublisher;
import com.surework.common.messaging.event.PayrollEvent;
import com.surework.common.security.TenantContext;
import com.surework.common.web.exception.BusinessRuleException;
import com.surework.common.web.exception.ResourceNotFoundException;
import com.surework.payroll.domain.PayrollRun;
import com.surework.payroll.domain.Payslip;
import com.surework.payroll.domain.PayslipLine;
import com.surework.payroll.dto.PayrollDto;
import com.surework.payroll.repository.PayrollRunRepository;
import com.surework.payroll.repository.PayslipRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementation of PayrollService.
 * Handles payroll processing with South African statutory compliance.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PayrollServiceImpl implements PayrollService {

    private final PayrollRunRepository payrollRunRepository;
    private final PayslipRepository payslipRepository;
    private final TaxCalculationService taxCalculationService;
    private final EmployeePayrollDataService employeePayrollDataService;
    private final DomainEventPublisher eventPublisher;
    private final PayslipPdfService payslipPdfService;

    @Override
    @Transactional
    public PayrollDto.PayrollRunResponse createPayrollRun(PayrollDto.CreatePayrollRunRequest request) {
        YearMonth period = YearMonth.of(request.periodYear(), request.periodMonth());

        // Check if period already has a paid run
        if (payrollRunRepository.isPeriodPaid(request.periodYear(), request.periodMonth())) {
            throw new BusinessRuleException("Payroll for this period has already been paid");
        }

        // Check for existing draft runs
        List<PayrollRun> existingRuns = payrollRunRepository.findByPeriod(
                request.periodYear(), request.periodMonth());
        for (PayrollRun existing : existingRuns) {
            if (existing.getStatus() == PayrollRun.PayrollRunStatus.DRAFT) {
                throw new BusinessRuleException("A draft payroll run already exists for this period. " +
                        "Please use or cancel the existing run.");
            }
        }

        PayrollRun run = PayrollRun.create(period, request.paymentDate());
        run.setNotes(request.notes());

        // Tenant isolation: always set tenantId from context before saving
        run.setTenantId(TenantContext.requireTenantId());

        run = payrollRunRepository.save(run);

        log.info("Created payroll run {} for period {}", run.getRunNumber(), period);

        return PayrollDto.PayrollRunResponse.fromEntity(run);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<PayrollDto.PayrollRunResponse> getPayrollRun(UUID runId) {
        return payrollRunRepository.findById(runId)
                .filter(r -> !r.isDeleted())
                .map(PayrollDto.PayrollRunResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<PayrollDto.PayrollRunDetailResponse> getPayrollRunWithPayslips(UUID runId) {
        return payrollRunRepository.findById(runId)
                .filter(r -> !r.isDeleted())
                .map(run -> {
                    List<PayrollDto.PayslipSummary> payslips = run.getPayslips().stream()
                            .map(PayrollDto.PayslipSummary::fromEntity)
                            .toList();
                    return new PayrollDto.PayrollRunDetailResponse(
                            PayrollDto.PayrollRunResponse.fromEntity(run),
                            payslips
                    );
                });
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PayrollDto.PayrollRunResponse> searchPayrollRuns(
            Integer year,
            PayrollRun.PayrollRunStatus status,
            Pageable pageable) {
        return payrollRunRepository.search(year, status, pageable)
                .map(PayrollDto.PayrollRunResponse::fromEntity);
    }

    @Override
    @Transactional
    public PayrollDto.PayrollRunResponse processPayrollRun(UUID runId, UUID processedBy) {
        PayrollRun run = payrollRunRepository.findById(runId)
                .orElseThrow(() -> new ResourceNotFoundException("PayrollRun", runId));

        if (run.getStatus() != PayrollRun.PayrollRunStatus.DRAFT) {
            throw new BusinessRuleException("Only draft payroll runs can be processed");
        }

        run.startProcessing();

        // Publish event for start - tenant context is required for multi-tenant security
        UUID tenantId = TenantContext.requireTenantId();
        eventPublisher.publish(new PayrollEvent.PayrollRunStarted(
                UUID.randomUUID(),
                tenantId,
                Instant.now(),
                run.getId(),
                run.getPeriod().toString()
        ));

        // Get all active employees for payroll
        List<PayrollDto.EmployeePayrollData> employees = employeePayrollDataService.getActiveEmployeesForPayroll();

        log.info("Processing payroll run {} for {} employees", run.getRunNumber(), employees.size());

        for (PayrollDto.EmployeePayrollData employee : employees) {
            try {
                Payslip payslip = calculatePayslip(run, employee);
                run.addPayslip(payslip);
            } catch (Exception e) {
                log.error("Error calculating payslip for employee {}: {}",
                        employee.employeeNumber(), e.getMessage());
                // Continue processing other employees
            }
        }

        run.recalculateTotals();
        run.completeProcessing(processedBy);
        run = payrollRunRepository.save(run);

        // Publish completion event
        eventPublisher.publish(new PayrollEvent.PayrollRunCompleted(
                UUID.randomUUID(),
                tenantId,
                Instant.now(),
                run.getId(),
                run.getEmployeeCount(),
                run.getTotalGross(),
                run.getTotalNet()
        ));

        log.info("Completed processing payroll run {} with {} payslips",
                run.getRunNumber(), run.getEmployeeCount());

        return PayrollDto.PayrollRunResponse.fromEntity(run);
    }

    private Payslip calculatePayslip(PayrollRun run, PayrollDto.EmployeePayrollData employee) {
        Payslip payslip = Payslip.create(
                employee.employeeId(),
                employee.employeeNumber(),
                employee.firstName() + " " + employee.lastName(),
                run.getPeriodYear(),
                run.getPeriodMonth(),
                run.getPaymentDate()
        );

        // Tenant isolation: always set tenantId from context before saving
        payslip.setTenantId(TenantContext.requireTenantId());

        payslip.setIdNumber(employee.idNumber());
        payslip.setTaxNumber(employee.taxNumber());
        payslip.setDepartment(employee.department());
        payslip.setJobTitle(employee.jobTitle());
        payslip.setBankAccount(employee.bankAccount());
        payslip.setBankName(employee.bankName());
        payslip.setBranchCode(employee.branchCode());

        // Set basic salary
        payslip.setBasicSalary(employee.basicSalary());
        payslip.setGrossEarnings(employee.basicSalary());

        // Add basic salary line
        payslip.addLine(PayslipLine.earning(
                PayslipLine.EarningCodes.BASIC_SALARY,
                "Basic Salary",
                employee.basicSalary()
        ));

        // Calculate pension contribution if applicable
        BigDecimal pensionContribution = BigDecimal.ZERO;
        if (employee.pensionContributionPercent() != null &&
                employee.pensionContributionPercent().compareTo(BigDecimal.ZERO) > 0) {
            pensionContribution = employee.basicSalary()
                    .multiply(employee.pensionContributionPercent())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            payslip.setPensionFund(pensionContribution);

            payslip.addLine(PayslipLine.voluntaryDeduction(
                    PayslipLine.DeductionCodes.PENSION,
                    "Pension Fund",
                    pensionContribution
            ));
        }

        // Calculate medical aid if applicable
        if (employee.medicalAidContribution() != null &&
                employee.medicalAidContribution().compareTo(BigDecimal.ZERO) > 0) {
            payslip.setMedicalAid(employee.medicalAidContribution());

            payslip.addLine(PayslipLine.voluntaryDeduction(
                    PayslipLine.DeductionCodes.MEDICAL_AID,
                    "Medical Aid",
                    employee.medicalAidContribution()
            ));
        }

        // Calculate tax
        PayrollDto.TaxCalculationResult taxResult = taxCalculationService.calculateMonthlyTax(
                employee.basicSalary(),
                employee.dateOfBirth(),
                pensionContribution,
                null, // No RA in this basic implementation
                1, // Assume main member
                employee.medicalAidDependants(),
                run.getPaymentDate()
        );

        // Set PAYE
        payslip.setPaye(taxResult.monthlyPaye());
        payslip.setTaxableIncome(taxResult.taxableIncome());
        payslip.setAnnualEquivalent(taxResult.annualEquivalent());
        payslip.setTaxRebate(taxResult.rebate());
        payslip.setMedicalTaxCredit(taxResult.medicalTaxCredit());

        payslip.addLine(PayslipLine.statutoryDeduction(
                PayslipLine.DeductionCodes.PAYE,
                "PAYE Tax",
                taxResult.monthlyPaye()
        ));

        // Set UIF
        payslip.setUifEmployee(taxResult.uifEmployee());
        payslip.setUifEmployer(taxResult.uifEmployer());

        payslip.addLine(PayslipLine.statutoryDeduction(
                PayslipLine.DeductionCodes.UIF_EMPLOYEE,
                "UIF (Employee)",
                taxResult.uifEmployee()
        ));

        payslip.addLine(PayslipLine.employerContribution(
                PayslipLine.EmployerCodes.UIF_EMPLOYER,
                "UIF (Employer)",
                taxResult.uifEmployer()
        ));

        // Calculate SDL (employer only)
        BigDecimal sdl = taxCalculationService.calculateSdl(employee.basicSalary());
        payslip.setSdl(sdl);

        payslip.addLine(PayslipLine.employerContribution(
                PayslipLine.EmployerCodes.SDL,
                "Skills Development Levy",
                sdl
        ));

        // Calculate totals
        payslip.calculateTotalDeductions();
        payslip.calculateNetPay();
        payslip.calculateTotalEmployerCost();

        // Get YTD totals
        int taxYearStartMonth = 3; // March
        int ytdYear = run.getPeriodMonth() >= taxYearStartMonth ? run.getPeriodYear() : run.getPeriodYear() - 1;

        payslip.setYtdGross(payslipRepository.getYtdGross(
                employee.employeeId(), ytdYear, run.getPeriodMonth()).add(payslip.getGrossEarnings()));
        payslip.setYtdPaye(payslipRepository.getYtdPaye(
                employee.employeeId(), ytdYear, run.getPeriodMonth()).add(payslip.getPaye()));
        payslip.setYtdUif(payslipRepository.getYtdUif(
                employee.employeeId(), ytdYear, run.getPeriodMonth()).add(payslip.getUifEmployee()));
        payslip.setYtdNet(payslipRepository.getYtdNet(
                employee.employeeId(), ytdYear, run.getPeriodMonth()).add(payslip.getNetPay()));

        payslip.markAsCalculated();

        return payslip;
    }

    @Override
    @Transactional
    public PayrollDto.PayrollRunResponse approvePayrollRun(UUID runId, UUID approvedBy) {
        PayrollRun run = payrollRunRepository.findById(runId)
                .orElseThrow(() -> new ResourceNotFoundException("PayrollRun", runId));

        run.approve(approvedBy);

        // Approve all payslips
        for (Payslip payslip : run.getPayslips()) {
            if (payslip.getStatus() == Payslip.PayslipStatus.CALCULATED) {
                payslip.approve();
            }
        }

        run = payrollRunRepository.save(run);

        log.info("Approved payroll run {} by {}", run.getRunNumber(), approvedBy);

        return PayrollDto.PayrollRunResponse.fromEntity(run);
    }

    @Override
    @Transactional
    public PayrollDto.PayrollRunResponse markPayrollRunAsPaid(UUID runId) {
        PayrollRun run = payrollRunRepository.findById(runId)
                .orElseThrow(() -> new ResourceNotFoundException("PayrollRun", runId));

        run.markAsPaid();

        // Mark all payslips as paid and publish events - tenant context is required for multi-tenant security
        UUID tenantId = TenantContext.requireTenantId();
        for (Payslip payslip : run.getPayslips()) {
            if (payslip.getStatus() == Payslip.PayslipStatus.APPROVED) {
                payslip.markAsPaid();

                eventPublisher.publish(new PayrollEvent.PayslipGenerated(
                        UUID.randomUUID(),
                        tenantId,
                        Instant.now(),
                        payslip.getId(),
                        payslip.getEmployeeId(),
                        payslip.getPeriodYear(),
                        payslip.getPeriodMonth(),
                        payslip.getNetPay()
                ));
            }
        }

        run = payrollRunRepository.save(run);

        log.info("Marked payroll run {} as paid", run.getRunNumber());

        return PayrollDto.PayrollRunResponse.fromEntity(run);
    }

    @Override
    @Transactional
    public void cancelPayrollRun(UUID runId) {
        PayrollRun run = payrollRunRepository.findById(runId)
                .orElseThrow(() -> new ResourceNotFoundException("PayrollRun", runId));

        run.cancel();
        payrollRunRepository.save(run);

        log.info("Cancelled payroll run {}", run.getRunNumber());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PayrollDto.PayrollRunResponse> getPendingApprovalRuns() {
        return payrollRunRepository.findPendingApproval().stream()
                .map(PayrollDto.PayrollRunResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<PayrollDto.PayslipResponse> getPayslip(UUID payslipId) {
        return payslipRepository.findById(payslipId)
                .filter(p -> !p.isDeleted())
                .map(PayrollDto.PayslipResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PayrollDto.PayslipSummary> getEmployeePayslips(UUID employeeId) {
        return payslipRepository.findByEmployeeId(employeeId).stream()
                .map(PayrollDto.PayslipSummary::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<PayrollDto.PayslipResponse> getEmployeePayslipForPeriod(
            UUID employeeId, int year, int month) {
        return payslipRepository.findByEmployeeAndPeriod(employeeId, year, month)
                .map(PayrollDto.PayslipResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PayrollDto.PayslipSummary> searchPayslips(
            UUID employeeId,
            UUID runId,
            Integer year,
            Integer month,
            Payslip.PayslipStatus status,
            Pageable pageable) {
        return payslipRepository.search(employeeId, runId, year, month, status, pageable)
                .map(PayrollDto.PayslipSummary::fromEntity);
    }

    @Override
    @Transactional
    public void excludePayslip(UUID payslipId) {
        Payslip payslip = payslipRepository.findById(payslipId)
                .orElseThrow(() -> new ResourceNotFoundException("Payslip", payslipId));

        payslip.exclude();

        if (payslip.getPayrollRun() != null) {
            payslip.getPayrollRun().recalculateTotals();
        }

        payslipRepository.save(payslip);

        log.info("Excluded payslip {} from payroll run", payslip.getPayslipNumber());
    }

    @Override
    @Transactional
    public void includePayslip(UUID payslipId) {
        Payslip payslip = payslipRepository.findById(payslipId)
                .orElseThrow(() -> new ResourceNotFoundException("Payslip", payslipId));

        if (payslip.getStatus() != Payslip.PayslipStatus.EXCLUDED) {
            throw new BusinessRuleException("Payslip is not excluded");
        }

        payslip.setStatus(Payslip.PayslipStatus.CALCULATED);

        if (payslip.getPayrollRun() != null) {
            payslip.getPayrollRun().recalculateTotals();
        }

        payslipRepository.save(payslip);

        log.info("Included payslip {} in payroll run", payslip.getPayslipNumber());
    }

    @Override
    public PayrollDto.TaxCalculationResult calculateTax(
            BigDecimal grossMonthlyIncome,
            LocalDate dateOfBirth,
            BigDecimal pensionContribution,
            BigDecimal retirementAnnuity,
            int medicalAidMembers,
            int medicalAidDependants) {
        return taxCalculationService.calculateMonthlyTax(
                grossMonthlyIncome,
                dateOfBirth,
                pensionContribution,
                retirementAnnuity,
                medicalAidMembers,
                medicalAidDependants,
                LocalDate.now()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<PayrollDto.PayrollPeriodSummary> getPayrollSummary(int year, int month) {
        return payrollRunRepository.findLatestByPeriod(year, month)
                .filter(run -> run.getStatus() == PayrollRun.PayrollRunStatus.PAID)
                .map(run -> new PayrollDto.PayrollPeriodSummary(
                        year,
                        month,
                        run.getEmployeeCount(),
                        run.getTotalGross(),
                        run.getTotalPaye(),
                        run.getTotalUifEmployee().add(run.getTotalUifEmployer()),
                        run.getTotalNet(),
                        run.getTotalEmployerCost()
                ));
    }

    @Override
    @Transactional(readOnly = true)
    public PayrollDto.PayrollAnnualSummary getAnnualPayrollSummary(int year) {
        List<PayrollRun> runs = payrollRunRepository.findByYear(year).stream()
                .filter(run -> run.getStatus() == PayrollRun.PayrollRunStatus.PAID)
                .toList();

        List<PayrollDto.PayrollPeriodSummary> months = runs.stream()
                .map(run -> new PayrollDto.PayrollPeriodSummary(
                        year,
                        run.getPeriodMonth(),
                        run.getEmployeeCount(),
                        run.getTotalGross(),
                        run.getTotalPaye(),
                        run.getTotalUifEmployee().add(run.getTotalUifEmployer()),
                        run.getTotalNet(),
                        run.getTotalEmployerCost()
                ))
                .toList();

        BigDecimal totalGross = months.stream()
                .map(PayrollDto.PayrollPeriodSummary::totalGross)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPaye = months.stream()
                .map(PayrollDto.PayrollPeriodSummary::totalPaye)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalUif = months.stream()
                .map(PayrollDto.PayrollPeriodSummary::totalUif)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalNet = months.stream()
                .map(PayrollDto.PayrollPeriodSummary::totalNet)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalEmployerCost = months.stream()
                .map(PayrollDto.PayrollPeriodSummary::totalEmployerCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new PayrollDto.PayrollAnnualSummary(
                year,
                months,
                totalGross,
                totalPaye,
                totalUif,
                totalNet,
                totalEmployerCost
        );
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] generatePayslipPdf(UUID payslipId) {
        Payslip payslip = payslipRepository.findById(payslipId)
                .orElseThrow(() -> new ResourceNotFoundException("Payslip", payslipId));

        return payslipPdfService.generatePdf(payslip);
    }
}
