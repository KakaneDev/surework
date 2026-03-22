package com.surework.accounting.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Represents a single line in a journal entry.
 * Each line affects one account with either a debit or credit.
 */
@Entity
@Table(name = "journal_entry_lines", indexes = {
        @Index(name = "idx_journal_lines_entry", columnList = "journal_entry_id"),
        @Index(name = "idx_journal_lines_account", columnList = "account_id")
})
@Getter
@Setter
@NoArgsConstructor
public class JournalEntryLine extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_entry_id", nullable = false)
    private JournalEntry journalEntry;

    @Column(name = "line_number", nullable = false)
    private int lineNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "description")
    private String description;

    @Column(name = "debit_amount", precision = 15, scale = 2)
    private BigDecimal debitAmount;

    @Column(name = "credit_amount", precision = 15, scale = 2)
    private BigDecimal creditAmount;

    // Cost center/dimension tracking
    @Column(name = "cost_center")
    private String costCenter;

    @Column(name = "department")
    private String department;

    @Column(name = "project")
    private String project;

    // VAT-related fields
    @Column(name = "vat_amount", precision = 15, scale = 2)
    private BigDecimal vatAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "vat_category")
    private Account.VatCategory vatCategory;

    @Column(name = "net_amount", precision = 15, scale = 2)
    private BigDecimal netAmount;

    // Reference fields
    @Column(name = "reference")
    private String reference;

    @Column(name = "external_reference")
    private String externalReference;

    /**
     * Create a debit line.
     */
    public static JournalEntryLine debit(Account account, BigDecimal amount, String description) {
        JournalEntryLine line = new JournalEntryLine();
        line.setAccount(account);
        line.setDebitAmount(amount);
        line.setCreditAmount(null);
        line.setDescription(description);
        return line;
    }

    /**
     * Create a credit line.
     */
    public static JournalEntryLine credit(Account account, BigDecimal amount, String description) {
        JournalEntryLine line = new JournalEntryLine();
        line.setAccount(account);
        line.setDebitAmount(null);
        line.setCreditAmount(amount);
        line.setDescription(description);
        return line;
    }

    /**
     * Create a line with VAT calculation.
     */
    public static JournalEntryLine withVat(Account account, BigDecimal grossAmount,
                                            BigDecimal vatRate, boolean isDebit, String description) {
        JournalEntryLine line = new JournalEntryLine();
        line.setAccount(account);
        line.setDescription(description);

        // Calculate VAT and net amounts
        BigDecimal vatDivisor = BigDecimal.ONE.add(vatRate);
        BigDecimal netAmount = grossAmount.divide(vatDivisor, 2, java.math.RoundingMode.HALF_UP);
        BigDecimal vatAmount = grossAmount.subtract(netAmount);

        line.setVatAmount(vatAmount);
        line.setNetAmount(netAmount);

        if (isDebit) {
            line.setDebitAmount(grossAmount);
        } else {
            line.setCreditAmount(grossAmount);
        }

        return line;
    }

    /**
     * Get the amount (positive for debit, negative for credit).
     */
    public BigDecimal getAmount() {
        if (debitAmount != null && debitAmount.compareTo(BigDecimal.ZERO) > 0) {
            return debitAmount;
        }
        if (creditAmount != null && creditAmount.compareTo(BigDecimal.ZERO) > 0) {
            return creditAmount.negate();
        }
        return BigDecimal.ZERO;
    }

    /**
     * Check if this is a debit line.
     */
    public boolean isDebit() {
        return debitAmount != null && debitAmount.compareTo(BigDecimal.ZERO) > 0;
    }

    /**
     * Check if this is a credit line.
     */
    public boolean isCredit() {
        return creditAmount != null && creditAmount.compareTo(BigDecimal.ZERO) > 0;
    }

    /**
     * Get display amount (always positive).
     */
    public BigDecimal getDisplayAmount() {
        if (isDebit()) {
            return debitAmount;
        }
        if (isCredit()) {
            return creditAmount;
        }
        return BigDecimal.ZERO;
    }
}
