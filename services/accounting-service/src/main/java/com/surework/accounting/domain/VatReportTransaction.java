package com.surework.accounting.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Represents a source transaction included in a VAT report.
 * Links journal entries to their VAT report contribution.
 */
@Entity
@Table(name = "vat_report_transactions", indexes = {
        @Index(name = "idx_vat_report_txns_report", columnList = "vat_report_id"),
        @Index(name = "idx_vat_report_txns_journal", columnList = "journal_entry_id")
})
@Getter
@Setter
@NoArgsConstructor
public class VatReportTransaction extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vat_report_id", nullable = false)
    private VatReport vatReport;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_entry_id")
    private JournalEntry journalEntry;

    @Column(name = "journal_entry_number", length = 50)
    private String journalEntryNumber;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id")
    private Account account;

    @Column(name = "account_code", length = 20)
    private String accountCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "vat_category", nullable = false)
    private VatReportLine.VatCategory vatCategory;

    @Column(name = "net_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal netAmount = BigDecimal.ZERO;

    @Column(name = "vat_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal vatAmount = BigDecimal.ZERO;

    @Column(name = "gross_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal grossAmount = BigDecimal.ZERO;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "reference", length = 100)
    private String reference;

    @Column(name = "vat_box", nullable = false, length = 10)
    private String vatBox;

    /**
     * Create a transaction record from a journal entry line.
     */
    public static VatReportTransaction fromJournalEntryLine(
            JournalEntry journalEntry,
            JournalEntryLine line,
            VatReportLine.VatCategory category,
            String vatBox) {

        VatReportTransaction txn = new VatReportTransaction();
        txn.setJournalEntry(journalEntry);
        txn.setJournalEntryNumber(journalEntry.getEntryNumber());
        txn.setTransactionDate(journalEntry.getTransactionDate());
        txn.setAccount(line.getAccount());
        txn.setAccountCode(line.getAccount() != null ? line.getAccount().getAccountCode() : null);
        txn.setVatCategory(category);
        txn.setDescription(line.getDescription());
        txn.setReference(journalEntry.getReference());
        txn.setVatBox(vatBox);

        // Calculate amounts based on debit/credit
        BigDecimal amount = line.getDebitAmount() != null ? line.getDebitAmount() : BigDecimal.ZERO;
        if (line.getCreditAmount() != null && line.getCreditAmount().compareTo(BigDecimal.ZERO) > 0) {
            amount = line.getCreditAmount();
        }

        // For VAT transactions, separate VAT and net amounts
        if (category == VatReportLine.VatCategory.INPUT_VAT ||
            category == VatReportLine.VatCategory.OUTPUT_VAT ||
            category == VatReportLine.VatCategory.CAPITAL_INPUT) {
            txn.setVatAmount(amount);
            txn.setNetAmount(BigDecimal.ZERO);
        } else {
            txn.setNetAmount(amount);
            txn.setVatAmount(BigDecimal.ZERO);
        }

        txn.setGrossAmount(txn.getNetAmount().add(txn.getVatAmount()));

        return txn;
    }

    /**
     * Create a manual transaction record (for adjustments).
     */
    public static VatReportTransaction createManual(
            LocalDate date,
            String description,
            VatReportLine.VatCategory category,
            BigDecimal netAmount,
            BigDecimal vatAmount,
            String vatBox) {

        VatReportTransaction txn = new VatReportTransaction();
        txn.setTransactionDate(date);
        txn.setDescription(description);
        txn.setVatCategory(category);
        txn.setNetAmount(netAmount);
        txn.setVatAmount(vatAmount);
        txn.setGrossAmount(netAmount.add(vatAmount));
        txn.setVatBox(vatBox);

        return txn;
    }
}
