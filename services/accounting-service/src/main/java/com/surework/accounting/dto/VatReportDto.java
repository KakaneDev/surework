package com.surework.accounting.dto;

import com.surework.accounting.domain.VatReport;
import com.surework.accounting.domain.VatReportLine;
import com.surework.accounting.domain.VatReportTransaction;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * DTOs for VAT201 reporting operations.
 * Implements SARS VAT201 form structure for South African VAT reporting.
 */
public sealed interface VatReportDto {

    // === Request DTOs ===

    /**
     * Request to generate a VAT report for a specific period.
     */
    record GenerateVatReportRequest(
            @NotNull(message = "Period start date is required")
            LocalDate periodStart,

            @NotNull(message = "Period end date is required")
            LocalDate periodEnd,

            UUID tenantId
    ) implements VatReportDto {}

    /**
     * Request to preview VAT report without persisting.
     */
    record PreviewVatReportRequest(
            @NotNull(message = "Period start date is required")
            LocalDate periodStart,

            @NotNull(message = "Period end date is required")
            LocalDate periodEnd,

            UUID tenantId
    ) implements VatReportDto {}

    /**
     * Request to submit VAT report to SARS.
     */
    record SubmitVatReportRequest(
            @NotNull(message = "Report ID is required")
            UUID reportId,

            String sarsReference,

            String notes
    ) implements VatReportDto {}

    /**
     * Request to record VAT payment.
     */
    record RecordPaymentRequest(
            @NotNull(message = "Report ID is required")
            UUID reportId,

            @NotNull(message = "Payment amount is required")
            BigDecimal amount,

            String paymentReference,

            String notes
    ) implements VatReportDto {}

    /**
     * Request for manual VAT adjustment.
     */
    record VatAdjustmentRequest(
            String boxNumber,

            @NotNull(message = "Amount is required")
            BigDecimal amount,

            String description,

            AdjustmentType type
    ) implements VatReportDto {
        public enum AdjustmentType {
            INCREASE, DECREASE
        }
    }

    // === Response DTOs ===

    /**
     * Complete VAT201 report response.
     */
    record VatReportResponse(
            UUID id,
            String vatPeriod,
            LocalDate periodStart,
            LocalDate periodEnd,
            VatReport.ReportStatus status,

            // Section A: Output Tax
            BigDecimal box1StandardRatedSupplies,
            BigDecimal box1aOutputVat,
            BigDecimal box2ZeroRatedSupplies,
            BigDecimal box3ExemptSupplies,
            BigDecimal box4TotalSupplies,

            // Section B: Input Tax
            BigDecimal box5CapitalGoods,
            BigDecimal box5aInputVatCapital,
            BigDecimal box6OtherGoods,
            BigDecimal box6aInputVatOther,
            BigDecimal box7TotalInputVat,

            // Section C: Adjustments
            BigDecimal box8ChangeInUseIncrease,
            BigDecimal box9ChangeInUseDecrease,
            BigDecimal box10BadDebtsRecovered,
            BigDecimal box11BadDebtsWrittenOff,
            BigDecimal box12OtherAdjustments,
            BigDecimal box13TotalAdjustments,

            // Section D: Calculation
            BigDecimal box14OutputVatPayable,
            BigDecimal box15InputVatDeductible,
            BigDecimal box16VatPayable,
            BigDecimal box17VatRefundable,

            // Section E: Diesel Refund
            BigDecimal box18DieselRefund,

            // Payment details
            LocalDate paymentDueDate,
            String paymentReference,
            Instant paidAt,
            BigDecimal paidAmount,

            // Submission details
            Instant submittedAt,
            UUID submittedBy,
            String sarsReference,
            String acknowledgmentNumber,

            // Generation details
            Instant generatedAt,
            UUID generatedBy,
            String notes,

            // Line items
            List<VatReportLineResponse> lines,

            Instant createdAt
    ) implements VatReportDto {

        public static VatReportResponse fromEntity(VatReport report) {
            return new VatReportResponse(
                    report.getId(),
                    report.getVatPeriod(),
                    report.getPeriodStart(),
                    report.getPeriodEnd(),
                    report.getStatus(),
                    report.getBox1StandardRatedSupplies(),
                    report.getBox1aOutputVat(),
                    report.getBox2ZeroRatedSupplies(),
                    report.getBox3ExemptSupplies(),
                    report.getBox4TotalSupplies(),
                    report.getBox5CapitalGoods(),
                    report.getBox5aInputVatCapital(),
                    report.getBox6OtherGoods(),
                    report.getBox6aInputVatOther(),
                    report.getBox7TotalInputVat(),
                    report.getBox8ChangeInUseIncrease(),
                    report.getBox9ChangeInUseDecrease(),
                    report.getBox10BadDebtsRecovered(),
                    report.getBox11BadDebtsWrittenOff(),
                    report.getBox12OtherAdjustments(),
                    report.getBox13TotalAdjustments(),
                    report.getBox14OutputVatPayable(),
                    report.getBox15InputVatDeductible(),
                    report.getBox16VatPayable(),
                    report.getBox17VatRefundable(),
                    report.getBox18DieselRefund(),
                    report.getPaymentDueDate(),
                    report.getPaymentReference(),
                    report.getPaidAt(),
                    report.getPaidAmount(),
                    report.getSubmittedAt(),
                    report.getSubmittedBy(),
                    report.getSarsReference(),
                    report.getAcknowledgmentNumber(),
                    report.getGeneratedAt(),
                    report.getGeneratedBy(),
                    report.getNotes(),
                    report.getLines().stream()
                            .map(VatReportLineResponse::fromEntity)
                            .toList(),
                    report.getCreatedAt()
            );
        }
    }

    /**
     * Summary response for VAT report list.
     */
    record VatReportSummary(
            UUID id,
            String vatPeriod,
            LocalDate periodStart,
            LocalDate periodEnd,
            VatReport.ReportStatus status,
            BigDecimal netVat,
            boolean isPayable,
            LocalDate paymentDueDate,
            boolean isPaid,
            Instant createdAt
    ) implements VatReportDto {

        public static VatReportSummary fromEntity(VatReport report) {
            BigDecimal netVat = report.getBox16VatPayable().subtract(report.getBox17VatRefundable());
            return new VatReportSummary(
                    report.getId(),
                    report.getVatPeriod(),
                    report.getPeriodStart(),
                    report.getPeriodEnd(),
                    report.getStatus(),
                    netVat.abs(),
                    report.isVatPayable(),
                    report.getPaymentDueDate(),
                    report.getStatus() == VatReport.ReportStatus.PAID,
                    report.getCreatedAt()
            );
        }
    }

    /**
     * VAT report line response.
     */
    record VatReportLineResponse(
            UUID id,
            UUID accountId,
            String accountCode,
            String accountName,
            VatReportLine.VatCategory vatCategory,
            BigDecimal taxableAmount,
            BigDecimal vatAmount,
            BigDecimal grossAmount,
            String vatBox,
            int transactionCount
    ) implements VatReportDto {

        public static VatReportLineResponse fromEntity(VatReportLine line) {
            return new VatReportLineResponse(
                    line.getId(),
                    line.getAccount() != null ? line.getAccount().getId() : null,
                    line.getAccountCode(),
                    line.getAccountName(),
                    line.getVatCategory(),
                    line.getTaxableAmount(),
                    line.getVatAmount(),
                    line.getGrossAmount(),
                    line.getVatBox(),
                    line.getTransactionCount()
            );
        }
    }

    /**
     * VAT transaction detail response.
     */
    record VatTransactionResponse(
            UUID id,
            UUID journalEntryId,
            String journalEntryNumber,
            LocalDate transactionDate,
            String accountCode,
            VatReportLine.VatCategory vatCategory,
            BigDecimal netAmount,
            BigDecimal vatAmount,
            BigDecimal grossAmount,
            String description,
            String reference,
            String vatBox
    ) implements VatReportDto {

        public static VatTransactionResponse fromEntity(VatReportTransaction txn) {
            return new VatTransactionResponse(
                    txn.getId(),
                    txn.getJournalEntry() != null ? txn.getJournalEntry().getId() : null,
                    txn.getJournalEntryNumber(),
                    txn.getTransactionDate(),
                    txn.getAccountCode(),
                    txn.getVatCategory(),
                    txn.getNetAmount(),
                    txn.getVatAmount(),
                    txn.getGrossAmount(),
                    txn.getDescription(),
                    txn.getReference(),
                    txn.getVatBox()
            );
        }
    }

    // === Dashboard DTOs ===

    /**
     * VAT dashboard summary.
     */
    record VatDashboardSummary(
            VatReportSummary currentPeriod,
            VatReportSummary previousPeriod,
            BigDecimal ytdVatPayable,
            BigDecimal ytdVatRefundable,
            BigDecimal ytdNetVat,
            int pendingReportsCount,
            int overdueReportsCount,
            LocalDate nextDueDate,
            List<VatReportSummary> recentReports
    ) implements VatReportDto {}

    /**
     * VAT period comparison.
     */
    record VatPeriodComparison(
            String period,
            BigDecimal outputVat,
            BigDecimal inputVat,
            BigDecimal netVat,
            BigDecimal standardRatedSales,
            BigDecimal zeroRatedSales
    ) implements VatReportDto {}

    /**
     * VAT box breakdown for drill-down.
     */
    record VatBoxBreakdown(
            String boxNumber,
            String boxDescription,
            BigDecimal amount,
            int transactionCount,
            List<VatTransactionResponse> transactions
    ) implements VatReportDto {}

    // === Export DTOs ===

    /**
     * SARS VAT201 export format.
     */
    record SarsVat201Export(
            String vendorVatNumber,
            String taxPeriod,
            String submissionType,
            VatReportResponse reportData,
            LocalDate generatedDate
    ) implements VatReportDto {}
}
