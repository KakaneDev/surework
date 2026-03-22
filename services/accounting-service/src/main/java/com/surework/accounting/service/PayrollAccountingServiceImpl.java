package com.surework.accounting.service;

import com.surework.accounting.domain.*;
import com.surework.accounting.dto.PayrollAccountingDto;
import com.surework.accounting.dto.PayrollYtdSummary;
import com.surework.accounting.repository.*;
import com.surework.common.messaging.event.PayrollEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Year;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementation of PayrollAccountingService.
 * Handles automatic journal entry creation from payroll events.
 *
 * <p>South African payroll components journaled:
 * <ul>
 *   <li>Gross salary expense</li>
 *   <li>PAYE (Pay As You Earn) tax liability</li>
 *   <li>UIF (Unemployment Insurance Fund) - employee and employer portions</li>
 *   <li>SDL (Skills Development Levy)</li>
 *   <li>Pension fund contributions - employee and employer portions</li>
 *   <li>Medical aid contributions - employee and employer portions</li>
 *   <li>Net pay liability (amount due to employees)</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PayrollAccountingServiceImpl implements PayrollAccountingService {

    // === Constants ===

    /** Default number of recent journals to display on dashboard */
    private static final int DASHBOARD_RECENT_JOURNALS_LIMIT = 5;

    /** Maximum allowed limit for recent journals query */
    private static final int MAX_RECENT_JOURNALS_LIMIT = 100;

    // === Dependencies ===

    private final PayrollJournalEntryRepository payrollJournalRepository;
    private final PayrollAccountMappingRepository mappingRepository;
    private final PayrollIntegrationSettingsRepository settingsRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final AccountRepository accountRepository;
    private final FiscalPeriodRepository fiscalPeriodRepository;
    private final PayrollIntegrationSettingsService settingsService;

    // === Payroll Event Processing ===

    @Override
    @Transactional
    public PayrollAccountingDto.PayrollJournalResponse processPayrollRunApproved(PayrollEvent.PayrollRunApproved event) {
        Objects.requireNonNull(event, "Payroll event must not be null");
        Objects.requireNonNull(event.tenantId(), "Tenant ID must not be null");

        log.info("Processing payroll run approved: runId={}, period={}/{}, employees={}",
                event.payrollRunId(), event.periodYear(), event.periodMonth(), event.employeeCount());

        // Idempotency check - return existing if already processed
        Optional<PayrollJournalEntry> existing = payrollJournalRepository.findByPayrollRunId(event.payrollRunId());
        if (existing.isPresent()) {
            log.info("Payroll run {} already journaled, returning existing entry", event.payrollRunId());
            return PayrollAccountingDto.PayrollJournalResponse.fromEntity(existing.get());
        }

        // Check if auto-journaling is enabled
        PayrollIntegrationSettings settings = settingsService.getOrCreateSettings(event.tenantId());
        if (!settings.isAutoJournalEnabled()) {
            log.info("Auto-journaling disabled for tenant {}, skipping", event.tenantId());
            // Return null to indicate no journal was created (graceful handling instead of exception)
            return null;
        }

        // Create journal entry
        JournalEntry journalEntry = createPayrollJournalEntry(event, settings);

        // Validate and post the journal entry
        List<String> errors = journalEntry.validate();
        if (!errors.isEmpty()) {
            log.error("Invalid payroll journal entry: {}", errors);
            throw new IllegalStateException("Invalid journal entry: " + String.join(", ", errors));
        }

        // Find the fiscal period for posting
        LocalDate paymentDate = event.paymentDate();
        FiscalPeriod period = fiscalPeriodRepository.findByDate(paymentDate)
                .orElseThrow(() -> new IllegalStateException("No open fiscal period for date: " + paymentDate));

        // Post the journal entry
        journalEntry.post(null, period); // System-generated, no user ID
        journalEntry = journalEntryRepository.save(journalEntry);

        // Create payroll journal tracking record
        PayrollJournalEntry payrollJournal = PayrollJournalEntry.create(
                event.payrollRunId(),
                event.runNumber(),
                journalEntry,
                event.periodYear(),
                event.periodMonth()
        );
        payrollJournal.setTenantId(event.tenantId());
        payrollJournal.setTotalGross(event.totalGross());
        payrollJournal.setTotalPaye(event.totalPaye());
        payrollJournal.setTotalUif(event.totalUifEmployee().add(event.totalUifEmployer()));
        payrollJournal.setTotalSdl(event.totalSdl());
        payrollJournal.setTotalPension(event.totalPensionEmployee().add(event.totalPensionEmployer()));
        payrollJournal.setTotalMedical(event.totalMedicalEmployee().add(event.totalMedicalEmployer()));
        payrollJournal.setTotalNet(event.totalNet());
        payrollJournal.setTotalEmployerCost(event.totalEmployerCost());
        payrollJournal.setEmployeeCount(event.employeeCount());
        payrollJournal.markAsPosted();

        payrollJournal = payrollJournalRepository.save(payrollJournal);

        log.info("Successfully created payroll journal: journalId={}, payrollJournalId={}",
                journalEntry.getId(), payrollJournal.getId());

        return PayrollAccountingDto.PayrollJournalResponse.fromEntity(payrollJournal);
    }

    /**
     * Creates the journal entry with all payroll debit/credit lines.
     * Double-entry bookkeeping:
     *
     * <p>DEBITS (Expenses):
     * <ul>
     *   <li>Salary Expense: Gross salary</li>
     *   <li>UIF Employer Expense: Employer UIF contribution</li>
     *   <li>SDL Expense: Skills Development Levy</li>
     *   <li>Pension Employer Expense: Employer pension contribution</li>
     *   <li>Medical Employer Expense: Employer medical aid contribution</li>
     * </ul>
     *
     * <p>CREDITS (Liabilities):
     * <ul>
     *   <li>PAYE Liability: Tax withheld for SARS</li>
     *   <li>UIF Employee Liability: Employee UIF deduction</li>
     *   <li>UIF Employer Liability: Employer UIF payable</li>
     *   <li>SDL Liability: SDL payable to SETA</li>
     *   <li>Pension Employee Liability: Employee pension deduction</li>
     *   <li>Pension Employer Liability: Employer pension payable</li>
     *   <li>Medical Employee Liability: Employee medical deduction</li>
     *   <li>Medical Employer Liability: Employer medical payable</li>
     *   <li>Other Deductions Liability: Other employee deductions</li>
     *   <li>Net Pay Liability: Net amount due to employees</li>
     * </ul>
     */
    private JournalEntry createPayrollJournalEntry(PayrollEvent.PayrollRunApproved event,
                                                   PayrollIntegrationSettings settings) {
        String description = settings.getJournalDescriptionTemplate()
                .replace("{period}", event.periodYear() + "/" + String.format("%02d", event.periodMonth()))
                .replace("{runNumber}", event.runNumber())
                .replace("{employeeCount}", String.valueOf(event.employeeCount()));

        JournalEntry entry = JournalEntry.create(
                event.paymentDate(),
                description,
                JournalEntry.EntryType.PAYROLL
        );
        entry.setSourceDocument("PAYROLL_RUN");
        entry.setSourceId(event.payrollRunId());
        entry.setReference(event.runNumber());

        UUID tenantId = event.tenantId();

        // === DEBIT ENTRIES (Expenses) ===

        // Gross salary expense
        addDebitLine(entry, PayrollAccountMapping.MappingType.SALARY_EXPENSE, tenantId,
                event.totalGross(), "Gross salaries - " + event.runNumber());

        // UIF employer expense
        if (isPositive(event.totalUifEmployer())) {
            addDebitLine(entry, PayrollAccountMapping.MappingType.UIF_EMPLOYER_EXPENSE, tenantId,
                    event.totalUifEmployer(), "UIF employer contribution");
        }

        // SDL expense
        if (isPositive(event.totalSdl())) {
            addDebitLine(entry, PayrollAccountMapping.MappingType.SDL_EXPENSE, tenantId,
                    event.totalSdl(), "Skills Development Levy");
        }

        // Pension employer expense
        if (isPositive(event.totalPensionEmployer())) {
            addDebitLine(entry, PayrollAccountMapping.MappingType.PENSION_EMPLOYER_EXPENSE, tenantId,
                    event.totalPensionEmployer(), "Pension employer contribution");
        }

        // Medical employer expense
        if (isPositive(event.totalMedicalEmployer())) {
            addDebitLine(entry, PayrollAccountMapping.MappingType.MEDICAL_EMPLOYER_EXPENSE, tenantId,
                    event.totalMedicalEmployer(), "Medical aid employer contribution");
        }

        // === CREDIT ENTRIES (Liabilities) ===

        // PAYE liability
        if (isPositive(event.totalPaye())) {
            addCreditLine(entry, PayrollAccountMapping.MappingType.PAYE_LIABILITY, tenantId,
                    event.totalPaye(), "PAYE payable to SARS");
        }

        // UIF employee liability
        if (isPositive(event.totalUifEmployee())) {
            addCreditLine(entry, PayrollAccountMapping.MappingType.UIF_EMPLOYEE_LIABILITY, tenantId,
                    event.totalUifEmployee(), "UIF employee deductions");
        }

        // UIF employer liability
        if (isPositive(event.totalUifEmployer())) {
            addCreditLine(entry, PayrollAccountMapping.MappingType.UIF_EMPLOYER_LIABILITY, tenantId,
                    event.totalUifEmployer(), "UIF employer payable");
        }

        // SDL liability
        if (isPositive(event.totalSdl())) {
            addCreditLine(entry, PayrollAccountMapping.MappingType.SDL_LIABILITY, tenantId,
                    event.totalSdl(), "SDL payable to SETA");
        }

        // Pension employee liability
        if (isPositive(event.totalPensionEmployee())) {
            addCreditLine(entry, PayrollAccountMapping.MappingType.PENSION_EMPLOYEE_LIABILITY, tenantId,
                    event.totalPensionEmployee(), "Pension employee deductions");
        }

        // Pension employer liability
        if (isPositive(event.totalPensionEmployer())) {
            addCreditLine(entry, PayrollAccountMapping.MappingType.PENSION_EMPLOYER_LIABILITY, tenantId,
                    event.totalPensionEmployer(), "Pension employer payable");
        }

        // Medical employee liability
        if (isPositive(event.totalMedicalEmployee())) {
            addCreditLine(entry, PayrollAccountMapping.MappingType.MEDICAL_EMPLOYEE_LIABILITY, tenantId,
                    event.totalMedicalEmployee(), "Medical aid employee deductions");
        }

        // Medical employer liability
        if (isPositive(event.totalMedicalEmployer())) {
            addCreditLine(entry, PayrollAccountMapping.MappingType.MEDICAL_EMPLOYER_LIABILITY, tenantId,
                    event.totalMedicalEmployer(), "Medical aid employer payable");
        }

        // Other deductions liability
        if (isPositive(event.totalOtherDeductions())) {
            addCreditLine(entry, PayrollAccountMapping.MappingType.OTHER_DEDUCTIONS_LIABILITY, tenantId,
                    event.totalOtherDeductions(), "Other employee deductions");
        }

        // Net pay liability (amount due to employees)
        addCreditLine(entry, PayrollAccountMapping.MappingType.NET_PAY_LIABILITY, tenantId,
                event.totalNet(), "Net salaries payable");

        return entry;
    }

    private boolean isPositive(BigDecimal amount) {
        return amount != null && amount.compareTo(BigDecimal.ZERO) > 0;
    }

    private void addDebitLine(JournalEntry entry, PayrollAccountMapping.MappingType type,
                              UUID tenantId, BigDecimal amount, String description) {
        Account account = getAccountForMapping(type, tenantId);
        entry.addDebit(account, amount, description);
    }

    private void addCreditLine(JournalEntry entry, PayrollAccountMapping.MappingType type,
                               UUID tenantId, BigDecimal amount, String description) {
        Account account = getAccountForMapping(type, tenantId);
        entry.addCredit(account, amount, description);
    }

    private Account getAccountForMapping(PayrollAccountMapping.MappingType type, UUID tenantId) {
        return mappingRepository.findDefaultByTypeAndTenant(type, tenantId)
                .map(PayrollAccountMapping::getAccount)
                .orElseThrow(() -> new IllegalStateException(
                        "No account mapping found for type: " + type + ". Please configure account mappings."));
    }

    @Override
    public boolean isPayrollRunJournaled(UUID tenantId, UUID payrollRunId) {
        Objects.requireNonNull(tenantId, "Tenant ID must not be null");
        Objects.requireNonNull(payrollRunId, "Payroll run ID must not be null");
        return payrollJournalRepository.existsByPayrollRunId(payrollRunId);
    }

    @Override
    public Optional<PayrollAccountingDto.PayrollJournalResponse> getPayrollJournal(UUID tenantId, UUID payrollRunId) {
        Objects.requireNonNull(tenantId, "Tenant ID must not be null");
        Objects.requireNonNull(payrollRunId, "Payroll run ID must not be null");
        return payrollJournalRepository.findByPayrollRunId(payrollRunId)
                .filter(entry -> tenantId.equals(entry.getTenantId()))
                .map(PayrollAccountingDto.PayrollJournalResponse::fromEntity);
    }

    @Override
    public List<PayrollAccountingDto.PayrollJournalResponse> getRecentPayrollJournals(UUID tenantId, int limit) {
        Objects.requireNonNull(tenantId, "Tenant ID must not be null");
        int safeLimit = Math.min(Math.max(1, limit), MAX_RECENT_JOURNALS_LIMIT);
        return payrollJournalRepository.findRecentByTenant(tenantId, PageRequest.of(0, safeLimit))
                .map(PayrollAccountingDto.PayrollJournalResponse::fromEntity)
                .getContent();
    }

    @Override
    public List<PayrollAccountingDto.PayrollJournalResponse> getPayrollJournalsForYear(UUID tenantId, int year) {
        Objects.requireNonNull(tenantId, "Tenant ID must not be null");
        return payrollJournalRepository.findByYearAndTenant(year, tenantId).stream()
                .map(PayrollAccountingDto.PayrollJournalResponse::fromEntity)
                .toList();
    }

    // === Account Mappings ===

    @Override
    public List<PayrollAccountingDto.AccountMappingResponse> getAllMappings(UUID tenantId) {
        Objects.requireNonNull(tenantId, "Tenant ID must not be null");
        return mappingRepository.findAllActiveByTenant(tenantId).stream()
                .map(PayrollAccountingDto.AccountMappingResponse::fromEntity)
                .toList();
    }

    @Override
    public List<PayrollAccountingDto.AccountMappingResponse> getDefaultMappings(UUID tenantId) {
        Objects.requireNonNull(tenantId, "Tenant ID must not be null");
        return mappingRepository.findAllDefaultsByTenant(tenantId).stream()
                .map(PayrollAccountingDto.AccountMappingResponse::fromEntity)
                .toList();
    }

    @Override
    public List<PayrollAccountingDto.AccountMappingResponse> getMappingsByType(UUID tenantId, PayrollAccountMapping.MappingType type) {
        Objects.requireNonNull(tenantId, "Tenant ID must not be null");
        Objects.requireNonNull(type, "Mapping type must not be null");
        return mappingRepository.findByTypeAndTenant(type, tenantId).stream()
                .map(PayrollAccountingDto.AccountMappingResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public PayrollAccountingDto.AccountMappingResponse createMapping(UUID tenantId,
            PayrollAccountingDto.CreateAccountMappingRequest request) {
        Objects.requireNonNull(tenantId, "Tenant ID must not be null");
        Objects.requireNonNull(request, "Request must not be null");

        log.info("Creating account mapping: type={}, tenant={}", request.mappingType(), tenantId);

        Account account = accountRepository.findById(request.accountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found: " + request.accountId()));

        if (!account.isPostable()) {
            throw new IllegalArgumentException("Account is not postable: " + account.getAccountCode());
        }

        PayrollAccountMapping mapping = new PayrollAccountMapping();
        mapping.setTenantId(tenantId);
        mapping.setMappingType(request.mappingType());
        mapping.setAccount(account);
        mapping.setDepartmentId(request.departmentId());
        mapping.setDefault(request.isDefault());
        mapping.setActive(true);

        mapping = mappingRepository.save(mapping);

        return PayrollAccountingDto.AccountMappingResponse.fromEntity(mapping);
    }

    @Override
    @Transactional
    public PayrollAccountingDto.AccountMappingResponse updateMapping(UUID tenantId, UUID mappingId,
            PayrollAccountingDto.UpdateAccountMappingRequest request) {
        Objects.requireNonNull(tenantId, "Tenant ID must not be null");
        Objects.requireNonNull(mappingId, "Mapping ID must not be null");
        Objects.requireNonNull(request, "Request must not be null");

        log.info("Updating account mapping: id={}, tenant={}", mappingId, tenantId);

        PayrollAccountMapping mapping = mappingRepository.findById(mappingId)
                .filter(m -> tenantId.equals(m.getTenantId()))
                .orElseThrow(() -> new IllegalArgumentException("Mapping not found: " + mappingId));

        if (request.accountId() != null) {
            Account account = accountRepository.findById(request.accountId())
                    .orElseThrow(() -> new IllegalArgumentException("Account not found: " + request.accountId()));
            if (!account.isPostable()) {
                throw new IllegalArgumentException("Account is not postable: " + account.getAccountCode());
            }
            mapping.setAccount(account);
        }

        if (request.departmentId() != null) {
            mapping.setDepartmentId(request.departmentId());
        }

        if (request.isDefault() != null) {
            mapping.setDefault(request.isDefault());
        }

        if (request.active() != null) {
            mapping.setActive(request.active());
        }

        mapping = mappingRepository.save(mapping);

        return PayrollAccountingDto.AccountMappingResponse.fromEntity(mapping);
    }

    @Override
    @Transactional
    public void deleteMapping(UUID tenantId, UUID mappingId) {
        Objects.requireNonNull(tenantId, "Tenant ID must not be null");
        Objects.requireNonNull(mappingId, "Mapping ID must not be null");

        log.info("Deleting account mapping: id={}, tenant={}", mappingId, tenantId);

        PayrollAccountMapping mapping = mappingRepository.findById(mappingId)
                .filter(m -> tenantId.equals(m.getTenantId()))
                .orElseThrow(() -> new IllegalArgumentException("Mapping not found: " + mappingId));

        mapping.setDeleted(true);
        mappingRepository.save(mapping);
    }

    // === Integration Settings ===

    @Override
    public PayrollAccountingDto.IntegrationSettingsResponse getSettings(UUID tenantId) {
        Objects.requireNonNull(tenantId, "Tenant ID must not be null");
        PayrollIntegrationSettings settings = settingsService.getOrCreateSettings(tenantId);
        return PayrollAccountingDto.IntegrationSettingsResponse.fromEntity(settings);
    }

    @Override
    @Transactional
    public PayrollAccountingDto.IntegrationSettingsResponse updateSettings(UUID tenantId,
            PayrollAccountingDto.UpdateIntegrationSettingsRequest request) {
        Objects.requireNonNull(tenantId, "Tenant ID must not be null");
        Objects.requireNonNull(request, "Request must not be null");

        log.info("Updating integration settings for tenant: {}", tenantId);

        PayrollIntegrationSettings settings = settingsService.getOrCreateSettings(tenantId);

        if (request.autoJournalEnabled() != null) {
            settings.setAutoJournalEnabled(request.autoJournalEnabled());
        }

        if (request.journalOnApproval() != null) {
            settings.setJournalOnApproval(request.journalOnApproval());
        }

        if (request.createPaymentEntry() != null) {
            settings.setCreatePaymentEntry(request.createPaymentEntry());
        }

        if (request.defaultExpenseAccountId() != null) {
            Account expenseAccount = accountRepository.findById(request.defaultExpenseAccountId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Expense account not found: " + request.defaultExpenseAccountId()));
            settings.setDefaultExpenseAccount(expenseAccount);
        }

        if (request.defaultLiabilityAccountId() != null) {
            Account liabilityAccount = accountRepository.findById(request.defaultLiabilityAccountId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Liability account not found: " + request.defaultLiabilityAccountId()));
            settings.setDefaultLiabilityAccount(liabilityAccount);
        }

        if (request.defaultBankAccountId() != null) {
            Account bankAccount = accountRepository.findById(request.defaultBankAccountId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Bank account not found: " + request.defaultBankAccountId()));
            settings.setDefaultBankAccount(bankAccount);
        }

        if (request.journalDescriptionTemplate() != null) {
            settings.setJournalDescriptionTemplate(request.journalDescriptionTemplate());
        }

        settings = settingsRepository.save(settings);

        return PayrollAccountingDto.IntegrationSettingsResponse.fromEntity(settings);
    }

    @Override
    public boolean isAutoJournalEnabled(UUID tenantId) {
        Objects.requireNonNull(tenantId, "Tenant ID must not be null");
        return settingsRepository.findByTenantId(tenantId)
                .map(PayrollIntegrationSettings::isAutoJournalEnabled)
                .orElse(false);
    }

    // === Dashboard ===

    @Override
    public PayrollAccountingDto.PayrollAccountingDashboard getDashboard(UUID tenantId) {
        Objects.requireNonNull(tenantId, "Tenant ID must not be null");

        int currentYear = Year.now().getValue();
        PayrollIntegrationSettings settings = settingsService.getOrCreateSettings(tenantId);

        // Single optimized query for YTD aggregates
        PayrollYtdSummary ytdSummary = payrollJournalRepository.getYtdSummary(currentYear, tenantId);
        if (ytdSummary == null) {
            ytdSummary = PayrollYtdSummary.empty();
        }

        List<PayrollAccountingDto.PayrollJournalResponse> recentJournals =
                getRecentPayrollJournals(tenantId, DASHBOARD_RECENT_JOURNALS_LIMIT);
        List<PayrollAccountingDto.AccountMappingResponse> accountMappings = getDefaultMappings(tenantId);

        return new PayrollAccountingDto.PayrollAccountingDashboard(
                settings.isAutoJournalEnabled(),
                currentYear,
                ytdSummary.totalGross(),
                ytdSummary.totalPaye(),
                ytdSummary.totalEmployerCost(),
                (int) ytdSummary.journaledRunsCount(),
                recentJournals,
                accountMappings
        );
    }

    @Override
    public PayrollAccountingDto.PayrollYearSummary getYearSummary(UUID tenantId, int year) {
        Objects.requireNonNull(tenantId, "Tenant ID must not be null");

        List<PayrollJournalEntry> entries = payrollJournalRepository.findByYearAndTenant(year, tenantId);

        BigDecimal totalGross = BigDecimal.ZERO;
        BigDecimal totalPaye = BigDecimal.ZERO;
        BigDecimal totalUif = BigDecimal.ZERO;
        BigDecimal totalSdl = BigDecimal.ZERO;
        BigDecimal totalNet = BigDecimal.ZERO;
        BigDecimal totalEmployerCost = BigDecimal.ZERO;
        int employeeCount = 0;

        for (PayrollJournalEntry entry : entries) {
            if (entry.getStatus() != PayrollJournalEntry.Status.REVERSED) {
                totalGross = totalGross.add(entry.getTotalGross());
                totalPaye = totalPaye.add(entry.getTotalPaye());
                totalUif = totalUif.add(entry.getTotalUif());
                totalSdl = totalSdl.add(entry.getTotalSdl() != null ? entry.getTotalSdl() : BigDecimal.ZERO);
                totalNet = totalNet.add(entry.getTotalNet());
                totalEmployerCost = totalEmployerCost.add(entry.getTotalEmployerCost());
                employeeCount = Math.max(employeeCount, entry.getEmployeeCount());
            }
        }

        return new PayrollAccountingDto.PayrollYearSummary(
                year,
                totalGross,
                totalPaye,
                totalUif,
                totalSdl,
                totalNet,
                totalEmployerCost,
                employeeCount,
                entries.size()
        );
    }
}
