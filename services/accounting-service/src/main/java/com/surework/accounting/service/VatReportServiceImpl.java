package com.surework.accounting.service;

import com.surework.accounting.domain.*;
import com.surework.accounting.dto.VatReportDto;
import com.surework.accounting.repository.AccountRepository;
import com.surework.accounting.repository.JournalEntryRepository;
import com.surework.accounting.repository.VatReportRepository;
import com.surework.common.web.exception.BusinessRuleException;
import com.surework.common.web.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of VatReportService.
 * Calculates SARS VAT201 reports for South African businesses.
 *
 * VAT201 Box Structure:
 * - Section A (Output Tax): Boxes 1-4 (Sales)
 * - Section B (Input Tax): Boxes 5-7 (Purchases)
 * - Section C (Adjustments): Boxes 8-13
 * - Section D (Calculation): Boxes 14-17
 * - Section E (Diesel Refund): Box 18
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class VatReportServiceImpl implements VatReportService {

    private static final BigDecimal VAT_RATE = new BigDecimal("0.15");
    private static final BigDecimal HUNDRED = new BigDecimal("100");

    private final VatReportRepository vatReportRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final AccountRepository accountRepository;

    /**
     * Default VAT number from configuration.
     * In production, this should be retrieved from tenant-specific settings.
     */
    @Value("${surework.accounting.default-vat-number:}")
    private String defaultVatNumber;

    // === Report Generation ===

    @Override
    @Transactional(readOnly = true)
    public VatReportDto.VatReportResponse previewVatReport(UUID tenantId, VatReportDto.PreviewVatReportRequest request) {
        log.info("Previewing VAT report for tenant {} period {} to {}",
                tenantId, request.periodStart(), request.periodEnd());

        VatReport report = calculateVatReport(request.periodStart(), request.periodEnd(), tenantId);
        report.markAsPreview(null);

        return VatReportDto.VatReportResponse.fromEntity(report);
    }

    @Override
    @Transactional
    public VatReportDto.VatReportResponse generateVatReport(UUID tenantId, VatReportDto.GenerateVatReportRequest request) {
        log.info("Generating VAT report for tenant {} period {} to {}",
                tenantId, request.periodStart(), request.periodEnd());

        String vatPeriod = VatReport.formatPeriod(request.periodStart());

        // Check if report already exists for this period and tenant
        if (vatReportRepository.findByPeriodAndTenant(vatPeriod, tenantId).isPresent()) {
            throw new BusinessRuleException("VAT report already exists for period: " + vatPeriod);
        }

        VatReport report = calculateVatReport(request.periodStart(), request.periodEnd(), tenantId);
        report.setTenantId(tenantId);
        report = vatReportRepository.save(report);

        log.info("Generated VAT report {} for tenant {} period {}", report.getId(), tenantId, vatPeriod);
        return VatReportDto.VatReportResponse.fromEntity(report);
    }

    @Override
    @Transactional
    public VatReportDto.VatReportResponse regenerateVatReport(UUID tenantId, UUID reportId, UUID userId) {
        VatReport report = vatReportRepository.findByIdWithLines(reportId)
                .filter(r -> r.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("VatReport", reportId));

        if (!report.isEditable()) {
            throw new BusinessRuleException("Report cannot be regenerated in status: " + report.getStatus());
        }

        log.info("Regenerating VAT report {} for tenant {} period {}", reportId, tenantId, report.getVatPeriod());

        // Clear existing details
        report.clearDetails();

        // Recalculate
        recalculateReport(report, tenantId);
        report.markAsPreview(userId);

        report = vatReportRepository.save(report);
        return VatReportDto.VatReportResponse.fromEntity(report);
    }

    @Override
    @Transactional
    public VatReportDto.VatReportResponse finalizeReport(UUID tenantId, UUID reportId, UUID userId) {
        VatReport report = vatReportRepository.findByIdWithLines(reportId)
                .filter(r -> r.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("VatReport", reportId));

        List<String> errors = validateReportInternal(report);
        if (!errors.isEmpty()) {
            throw new BusinessRuleException("Report validation failed: " + String.join(", ", errors));
        }

        report.finalize(userId);
        report = vatReportRepository.save(report);

        log.info("Finalized VAT report {} for tenant {} period {}", reportId, tenantId, report.getVatPeriod());
        return VatReportDto.VatReportResponse.fromEntity(report);
    }

    // === Report Retrieval ===

    @Override
    @Transactional(readOnly = true)
    public Optional<VatReportDto.VatReportResponse> getReport(UUID tenantId, UUID reportId) {
        log.debug("Getting VAT report {} for tenant {}", reportId, tenantId);
        return vatReportRepository.findByIdWithLines(reportId)
                .filter(r -> r.getTenantId().equals(tenantId))
                .map(VatReportDto.VatReportResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<VatReportDto.VatReportResponse> getReportByPeriod(UUID tenantId, String vatPeriod) {
        log.debug("Getting VAT report for tenant {} period {}", tenantId, vatPeriod);
        return vatReportRepository.findByPeriodAndTenant(vatPeriod, tenantId)
                .map(VatReportDto.VatReportResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<VatReportDto.VatReportResponse> getReportWithTransactions(UUID tenantId, UUID reportId) {
        log.debug("Getting VAT report with transactions {} for tenant {}", reportId, tenantId);
        return vatReportRepository.findByIdWithTransactions(reportId)
                .filter(r -> r.getTenantId().equals(tenantId))
                .map(VatReportDto.VatReportResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VatReportDto.VatReportSummary> getReportsForYear(UUID tenantId, int year) {
        log.debug("Getting VAT reports for tenant {} year {}", tenantId, year);
        return vatReportRepository.search(null, year, tenantId, Pageable.unpaged())
                .stream()
                .map(VatReportDto.VatReportSummary::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VatReportDto.VatReportSummary> searchReports(
            UUID tenantId,
            VatReport.ReportStatus status,
            Integer year,
            Pageable pageable) {
        log.debug("Searching VAT reports for tenant {} status {} year {}", tenantId, status, year);
        return vatReportRepository.search(status, year, tenantId, pageable)
                .map(VatReportDto.VatReportSummary::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VatReportDto.VatReportSummary> getRecentReports(UUID tenantId, int limit) {
        log.debug("Getting {} recent VAT reports for tenant {}", limit, tenantId);
        return vatReportRepository.search(null, null, tenantId, PageRequest.of(0, limit))
                .map(VatReportDto.VatReportSummary::fromEntity)
                .getContent();
    }

    // === Submission and Payment ===

    @Override
    @Transactional
    public VatReportDto.VatReportResponse submitToSars(UUID tenantId, VatReportDto.SubmitVatReportRequest request, UUID userId) {
        VatReport report = vatReportRepository.findById(request.reportId())
                .filter(r -> r.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("VatReport", request.reportId()));

        report.markAsSubmitted(userId, request.sarsReference());
        if (request.notes() != null) {
            report.setNotes(request.notes());
        }

        report = vatReportRepository.save(report);
        log.info("VAT report {} for tenant {} marked as submitted to SARS", request.reportId(), tenantId);

        return VatReportDto.VatReportResponse.fromEntity(report);
    }

    @Override
    @Transactional
    public VatReportDto.VatReportResponse recordPayment(UUID tenantId, VatReportDto.RecordPaymentRequest request) {
        VatReport report = vatReportRepository.findById(request.reportId())
                .filter(r -> r.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("VatReport", request.reportId()));

        report.recordPayment(request.amount(), request.paymentReference());
        if (request.notes() != null) {
            report.setNotes(request.notes());
        }

        report = vatReportRepository.save(report);
        log.info("Payment recorded for VAT report {} tenant {}: {}", request.reportId(), tenantId, request.amount());

        return VatReportDto.VatReportResponse.fromEntity(report);
    }

    // === Adjustments ===

    @Override
    @Transactional
    public VatReportDto.VatReportResponse applyAdjustment(
            UUID tenantId,
            UUID reportId,
            VatReportDto.VatAdjustmentRequest adjustment,
            UUID userId) {

        VatReport report = vatReportRepository.findById(reportId)
                .filter(r -> r.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("VatReport", reportId));

        if (!report.isEditable()) {
            throw new BusinessRuleException("Report cannot be adjusted in status: " + report.getStatus());
        }

        BigDecimal amount = adjustment.amount();
        if (adjustment.type() == VatReportDto.VatAdjustmentRequest.AdjustmentType.DECREASE) {
            amount = amount.negate();
        }

        // Apply adjustment to appropriate box
        switch (adjustment.boxNumber()) {
            case "8" -> report.setBox8ChangeInUseIncrease(
                    report.getBox8ChangeInUseIncrease().add(amount));
            case "9" -> report.setBox9ChangeInUseDecrease(
                    report.getBox9ChangeInUseDecrease().add(amount));
            case "10" -> report.setBox10BadDebtsRecovered(
                    report.getBox10BadDebtsRecovered().add(amount));
            case "11" -> report.setBox11BadDebtsWrittenOff(
                    report.getBox11BadDebtsWrittenOff().add(amount));
            case "12" -> report.setBox12OtherAdjustments(
                    report.getBox12OtherAdjustments().add(amount));
            case "18" -> report.setBox18DieselRefund(
                    report.getBox18DieselRefund().add(amount));
            default -> throw new BusinessRuleException("Invalid adjustment box: " + adjustment.boxNumber());
        }

        // Recalculate totals
        report.calculateTotals();

        report = vatReportRepository.save(report);
        log.info("Applied adjustment to VAT report {} tenant {} box {}: {}",
                reportId, tenantId, adjustment.boxNumber(), amount);

        return VatReportDto.VatReportResponse.fromEntity(report);
    }

    // === Dashboard and Analytics ===

    @Override
    @Transactional(readOnly = true)
    public VatReportDto.VatDashboardSummary getDashboardSummary(UUID tenantId) {
        log.debug("Getting VAT dashboard summary for tenant {}", tenantId);
        int currentYear = LocalDate.now().getYear();

        // Get current and previous period reports for tenant
        VatReportDto.VatReportSummary currentPeriod = vatReportRepository.findLatestByTenant(tenantId)
                .map(VatReportDto.VatReportSummary::fromEntity)
                .orElse(null);

        List<VatReport> yearReports = vatReportRepository.search(null, currentYear, tenantId, Pageable.unpaged())
                .getContent();
        VatReportDto.VatReportSummary previousPeriod = yearReports.size() > 1
                ? VatReportDto.VatReportSummary.fromEntity(yearReports.get(1))
                : null;

        // Calculate YTD totals for tenant
        BigDecimal ytdVatPayable = vatReportRepository.sumVatPayableForYearAndTenant(currentYear, tenantId);
        BigDecimal ytdVatRefundable = vatReportRepository.sumVatRefundableForYearAndTenant(currentYear, tenantId);
        BigDecimal ytdNetVat = ytdVatPayable.subtract(ytdVatRefundable);

        // Get counts for tenant
        int pendingCount = (int) vatReportRepository.countByStatusAndTenant(VatReport.ReportStatus.GENERATED, tenantId);
        List<VatReport> overdueReports = vatReportRepository.findOverdueByTenant(LocalDate.now(), tenantId);

        // Get next due date for tenant
        LocalDate nextDueDate = vatReportRepository.findPendingSubmissionByTenant(tenantId).stream()
                .map(VatReport::getPaymentDueDate)
                .filter(Objects::nonNull)
                .min(LocalDate::compareTo)
                .orElse(null);

        // Get recent reports for tenant
        List<VatReportDto.VatReportSummary> recentReports = getRecentReports(tenantId, 6);

        return new VatReportDto.VatDashboardSummary(
                currentPeriod,
                previousPeriod,
                ytdVatPayable,
                ytdVatRefundable,
                ytdNetVat,
                pendingCount,
                overdueReports.size(),
                nextDueDate,
                recentReports
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<VatReportDto.VatPeriodComparison> getPeriodComparison(UUID tenantId, int year) {
        log.debug("Getting VAT period comparison for tenant {} year {}", tenantId, year);
        return vatReportRepository.search(null, year, tenantId, Pageable.unpaged())
                .stream()
                .map(report -> new VatReportDto.VatPeriodComparison(
                        report.getVatPeriod(),
                        report.getBox1aOutputVat(),
                        report.getBox7TotalInputVat(),
                        report.getNetVat(),
                        report.getBox1StandardRatedSupplies(),
                        report.getBox2ZeroRatedSupplies()
                ))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public VatReportDto.VatBoxBreakdown getBoxBreakdown(UUID tenantId, UUID reportId, String boxNumber) {
        log.debug("Getting box {} breakdown for VAT report {} tenant {}", boxNumber, reportId, tenantId);
        VatReport report = vatReportRepository.findByIdWithTransactions(reportId)
                .filter(r -> r.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("VatReport", reportId));

        List<VatReportTransaction> boxTransactions = report.getTransactions().stream()
                .filter(t -> t.getVatBox().equals(boxNumber))
                .toList();

        BigDecimal totalAmount = boxTransactions.stream()
                .map(t -> t.getNetAmount().add(t.getVatAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new VatReportDto.VatBoxBreakdown(
                boxNumber,
                getBoxDescription(boxNumber),
                totalAmount,
                boxTransactions.size(),
                boxTransactions.stream()
                        .map(VatReportDto.VatTransactionResponse::fromEntity)
                        .toList()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<VatReportDto.VatReportSummary> getOverdueReports(UUID tenantId) {
        log.debug("Getting overdue VAT reports for tenant {}", tenantId);
        return vatReportRepository.findOverdueByTenant(LocalDate.now(), tenantId).stream()
                .map(VatReportDto.VatReportSummary::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<VatReportDto.VatReportSummary> getPendingSubmissionReports(UUID tenantId) {
        log.debug("Getting pending submission VAT reports for tenant {}", tenantId);
        return vatReportRepository.findPendingSubmissionByTenant(tenantId).stream()
                .map(VatReportDto.VatReportSummary::fromEntity)
                .toList();
    }

    // === Export ===

    @Override
    @Transactional(readOnly = true)
    public VatReportDto.SarsVat201Export exportForSars(UUID tenantId, UUID reportId) {
        log.info("Exporting VAT report {} for tenant {} to SARS format", reportId, tenantId);
        VatReport report = vatReportRepository.findByIdWithLines(reportId)
                .filter(r -> r.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("VatReport", reportId));

        // TODO: Retrieve vendor VAT number from tenant-specific settings service
        // For now, falls back to configuration or throws error if not configured
        String vendorVatNumber = defaultVatNumber;
        if (vendorVatNumber == null || vendorVatNumber.isBlank()) {
            throw new BusinessRuleException("Company VAT number not configured. " +
                    "Set COMPANY_VAT_NUMBER environment variable or configure tenant settings.");
        }

        return new VatReportDto.SarsVat201Export(
                vendorVatNumber,
                report.getVatPeriod(),
                report.getStatus() == VatReport.ReportStatus.AMENDED ? "AMENDED" : "ORIGINAL",
                VatReportDto.VatReportResponse.fromEntity(report),
                LocalDate.now()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] generatePdf(UUID tenantId, UUID reportId) {
        log.info("Generating PDF for VAT report {} tenant {}", reportId, tenantId);
        // Verify tenant access
        vatReportRepository.findByIdWithLines(reportId)
                .filter(r -> r.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("VatReport", reportId));

        // TODO: Implement PDF generation using Thymeleaf template
        throw new UnsupportedOperationException("PDF generation not yet implemented");
    }

    // === Validation ===

    @Override
    @Transactional(readOnly = true)
    public List<String> validateReport(UUID tenantId, UUID reportId) {
        log.debug("Validating VAT report {} for tenant {}", reportId, tenantId);
        VatReport report = vatReportRepository.findByIdWithLines(reportId)
                .filter(r -> r.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("VatReport", reportId));
        return validateReportInternal(report);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isPeriodAvailable(UUID tenantId, LocalDate periodStart, LocalDate periodEnd) {
        log.debug("Checking if period {}-{} is available for tenant {}", periodStart, periodEnd, tenantId);
        String vatPeriod = VatReport.formatPeriod(periodStart);
        return vatReportRepository.findByPeriodAndTenant(vatPeriod, tenantId).isEmpty();
    }

    // === Private Helper Methods ===

    private VatReport calculateVatReport(LocalDate periodStart, LocalDate periodEnd, UUID tenantId) {
        VatReport report = VatReport.forPeriod(periodStart, periodEnd, tenantId);
        report.setTenantId(tenantId);

        // Get all posted journal entries for the period and tenant
        List<JournalEntry> entries = journalEntryRepository.findPostedByDateRangeAndTenant(
                periodStart, periodEnd, tenantId);

        // Accumulators for box values
        BigDecimal standardRatedSales = BigDecimal.ZERO;
        BigDecimal zeroRatedSales = BigDecimal.ZERO;
        BigDecimal exemptSales = BigDecimal.ZERO;
        BigDecimal capitalGoodsPurchases = BigDecimal.ZERO;
        BigDecimal capitalGoodsVat = BigDecimal.ZERO;
        BigDecimal otherPurchases = BigDecimal.ZERO;
        BigDecimal otherPurchasesVat = BigDecimal.ZERO;

        // Maps for line aggregation
        Map<String, VatLineAccumulator> lineAccumulators = new HashMap<>();

        for (JournalEntry entry : entries) {
            for (JournalEntryLine line : entry.getLines()) {
                Account account = line.getAccount();
                if (account == null || account.getVatCategory() == null) {
                    continue;
                }

                BigDecimal amount = line.getDebitAmount() != null ? line.getDebitAmount() : BigDecimal.ZERO;
                if (line.getCreditAmount() != null && line.getCreditAmount().compareTo(BigDecimal.ZERO) > 0) {
                    amount = line.getCreditAmount();
                }

                Account.VatCategory vatCategory = account.getVatCategory();
                String vatBox = determineVatBox(account, vatCategory);
                VatReportLine.VatCategory reportCategory = mapVatCategory(vatCategory);

                // Accumulate for box calculations
                switch (vatCategory) {
                    case STANDARD -> {
                        if (isRevenueAccount(account)) {
                            standardRatedSales = standardRatedSales.add(amount);
                        }
                    }
                    case ZERO_RATED -> {
                        if (isRevenueAccount(account)) {
                            zeroRatedSales = zeroRatedSales.add(amount);
                        }
                    }
                    case EXEMPT -> {
                        if (isRevenueAccount(account)) {
                            exemptSales = exemptSales.add(amount);
                        }
                    }
                    case INPUT_VAT -> {
                        // Distinguish capital vs other goods based on account type
                        if (isCapitalGoodsVat(account)) {
                            capitalGoodsVat = capitalGoodsVat.add(amount);
                        } else {
                            otherPurchasesVat = otherPurchasesVat.add(amount);
                        }
                    }
                    case OUTPUT_VAT -> {
                        // Output VAT is calculated, not accumulated
                    }
                    default -> {
                        // OUT_OF_SCOPE - ignore
                    }
                }

                // Accumulate for line items
                String lineKey = account.getAccountCode() + "_" + reportCategory;
                lineAccumulators.computeIfAbsent(lineKey, k ->
                        new VatLineAccumulator(account, reportCategory, vatBox))
                        .addAmount(amount);

                // Create transaction record
                VatReportTransaction txn = VatReportTransaction.fromJournalEntryLine(
                        entry, line, reportCategory, vatBox);
                report.addTransaction(txn);
            }
        }

        // Set box values
        // Section A: Output Tax
        report.setBox1StandardRatedSupplies(standardRatedSales);
        report.setBox1aOutputVat(standardRatedSales.multiply(VAT_RATE).setScale(2, RoundingMode.HALF_UP));
        report.setBox2ZeroRatedSupplies(zeroRatedSales);
        report.setBox3ExemptSupplies(exemptSales);

        // Section B: Input Tax
        // For capital goods purchases, reverse calculate from VAT amount
        report.setBox5CapitalGoods(capitalGoodsVat.divide(VAT_RATE, 2, RoundingMode.HALF_UP));
        report.setBox5aInputVatCapital(capitalGoodsVat);
        report.setBox6OtherGoods(otherPurchasesVat.divide(VAT_RATE, 2, RoundingMode.HALF_UP));
        report.setBox6aInputVatOther(otherPurchasesVat);

        // Calculate all derived totals
        report.calculateTotals();

        // Add line items
        for (VatLineAccumulator accumulator : lineAccumulators.values()) {
            VatReportLine line = accumulator.toVatReportLine();
            report.addLine(line);
        }

        return report;
    }

    private void recalculateReport(VatReport report, UUID tenantId) {
        // Recalculate using existing period
        VatReport calculated = calculateVatReport(
                report.getPeriodStart(),
                report.getPeriodEnd(),
                tenantId);

        // Copy calculated values to existing report
        report.setBox1StandardRatedSupplies(calculated.getBox1StandardRatedSupplies());
        report.setBox1aOutputVat(calculated.getBox1aOutputVat());
        report.setBox2ZeroRatedSupplies(calculated.getBox2ZeroRatedSupplies());
        report.setBox3ExemptSupplies(calculated.getBox3ExemptSupplies());
        report.setBox5CapitalGoods(calculated.getBox5CapitalGoods());
        report.setBox5aInputVatCapital(calculated.getBox5aInputVatCapital());
        report.setBox6OtherGoods(calculated.getBox6OtherGoods());
        report.setBox6aInputVatOther(calculated.getBox6aInputVatOther());

        // Recalculate totals
        report.calculateTotals();

        // Copy lines and transactions
        for (VatReportLine line : calculated.getLines()) {
            report.addLine(line);
        }
        for (VatReportTransaction txn : calculated.getTransactions()) {
            report.addTransaction(txn);
        }
    }

    private List<String> validateReportInternal(VatReport report) {
        List<String> errors = new ArrayList<>();

        if (report.getPeriodStart() == null) {
            errors.add("Period start date is required");
        }
        if (report.getPeriodEnd() == null) {
            errors.add("Period end date is required");
        }
        if (report.getPeriodStart() != null && report.getPeriodEnd() != null &&
                report.getPeriodStart().isAfter(report.getPeriodEnd())) {
            errors.add("Period start must be before period end");
        }

        // Validate box calculations
        BigDecimal expectedBox4 = report.getBox1StandardRatedSupplies()
                .add(report.getBox2ZeroRatedSupplies())
                .add(report.getBox3ExemptSupplies());
        if (report.getBox4TotalSupplies().compareTo(expectedBox4) != 0) {
            errors.add("Box 4 calculation mismatch");
        }

        BigDecimal expectedBox7 = report.getBox5aInputVatCapital()
                .add(report.getBox6aInputVatOther());
        if (report.getBox7TotalInputVat().compareTo(expectedBox7) != 0) {
            errors.add("Box 7 calculation mismatch");
        }

        // Check for negative values where not allowed
        if (report.getBox1StandardRatedSupplies().compareTo(BigDecimal.ZERO) < 0) {
            errors.add("Box 1 cannot be negative");
        }

        return errors;
    }

    private String determineVatBox(Account account, Account.VatCategory vatCategory) {
        return switch (vatCategory) {
            case STANDARD -> isRevenueAccount(account) ? "1" : "6";
            case ZERO_RATED -> "2";
            case EXEMPT -> "3";
            case INPUT_VAT -> isCapitalGoodsVat(account) ? "5a" : "6a";
            case OUTPUT_VAT -> "1a";
            case OUT_OF_SCOPE -> "N/A";
        };
    }

    private VatReportLine.VatCategory mapVatCategory(Account.VatCategory accountCategory) {
        return switch (accountCategory) {
            case STANDARD -> VatReportLine.VatCategory.STANDARD;
            case ZERO_RATED -> VatReportLine.VatCategory.ZERO_RATED;
            case EXEMPT -> VatReportLine.VatCategory.EXEMPT;
            case OUT_OF_SCOPE -> VatReportLine.VatCategory.OUT_OF_SCOPE;
            case INPUT_VAT -> VatReportLine.VatCategory.INPUT_VAT;
            case OUTPUT_VAT -> VatReportLine.VatCategory.OUTPUT_VAT;
        };
    }

    private boolean isRevenueAccount(Account account) {
        return account.getAccountType() == Account.AccountType.REVENUE;
    }

    private boolean isCapitalGoodsVat(Account account) {
        // Capital goods VAT accounts are typically fixed asset related
        return account.getAccountSubtype() == Account.AccountSubtype.FIXED_ASSET ||
                (account.getAccountCode() != null && account.getAccountCode().startsWith("1500"));
    }

    private String getBoxDescription(String boxNumber) {
        return switch (boxNumber) {
            case "1" -> "Standard Rated Supplies (excluding VAT)";
            case "1a" -> "Output VAT on Standard Rated Supplies";
            case "2" -> "Zero-Rated Supplies";
            case "3" -> "Exempt Supplies";
            case "4" -> "Total Supplies";
            case "5" -> "Capital Goods and Services";
            case "5a" -> "Input VAT on Capital Goods";
            case "6" -> "Other Goods and Services";
            case "6a" -> "Input VAT on Other Goods";
            case "7" -> "Total Input VAT";
            case "8" -> "Change in Use - VAT Increase";
            case "9" -> "Change in Use - VAT Decrease";
            case "10" -> "Bad Debts Recovered";
            case "11" -> "Bad Debts Written Off";
            case "12" -> "Other Adjustments";
            case "13" -> "Total Adjustments";
            case "14" -> "Output VAT Payable";
            case "15" -> "Input VAT Deductible";
            case "16" -> "VAT Payable to SARS";
            case "17" -> "VAT Refundable from SARS";
            case "18" -> "Diesel Refund";
            default -> "Unknown Box";
        };
    }

    /**
     * Helper class for accumulating VAT amounts per account/category.
     */
    private static class VatLineAccumulator {
        private final Account account;
        private final VatReportLine.VatCategory category;
        private final String vatBox;
        private BigDecimal taxableAmount = BigDecimal.ZERO;
        private BigDecimal vatAmount = BigDecimal.ZERO;
        private int transactionCount = 0;

        VatLineAccumulator(Account account, VatReportLine.VatCategory category, String vatBox) {
            this.account = account;
            this.category = category;
            this.vatBox = vatBox;
        }

        void addAmount(BigDecimal amount) {
            if (category == VatReportLine.VatCategory.INPUT_VAT ||
                category == VatReportLine.VatCategory.OUTPUT_VAT ||
                category == VatReportLine.VatCategory.CAPITAL_INPUT) {
                this.vatAmount = this.vatAmount.add(amount);
            } else {
                this.taxableAmount = this.taxableAmount.add(amount);
            }
            this.transactionCount++;
        }

        VatReportLine toVatReportLine() {
            return VatReportLine.create(
                    account,
                    category,
                    taxableAmount,
                    vatAmount,
                    vatBox,
                    transactionCount
            );
        }
    }
}
