package com.surework.accounting.domain;

import com.surework.common.persistence.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Represents a journal entry (transaction) in the general ledger.
 * Implements double-entry bookkeeping - debits must equal credits.
 */
@Entity
@Table(name = "journal_entries", indexes = {
        @Index(name = "idx_journal_entries_number", columnList = "entry_number"),
        @Index(name = "idx_journal_entries_date", columnList = "transaction_date"),
        @Index(name = "idx_journal_entries_status", columnList = "status"),
        @Index(name = "idx_journal_entries_type", columnList = "entry_type")
})
@Getter
@Setter
@NoArgsConstructor
public class JournalEntry extends BaseEntity {

    @Column(name = "entry_number", nullable = false, unique = true)
    private String entryNumber;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @Column(name = "posting_date")
    private LocalDate postingDate;

    @Column(name = "description", nullable = false, length = 500)
    private String description;

    @Column(name = "reference")
    private String reference;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false)
    private EntryType entryType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private EntryStatus status = EntryStatus.DRAFT;

    @Column(name = "total_debit", precision = 15, scale = 2)
    private BigDecimal totalDebit = BigDecimal.ZERO;

    @Column(name = "total_credit", precision = 15, scale = 2)
    private BigDecimal totalCredit = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fiscal_period_id")
    private FiscalPeriod fiscalPeriod;

    @Column(name = "source_document")
    private String sourceDocument;

    @Column(name = "source_id")
    private UUID sourceId;

    @Column(name = "posted_by")
    private UUID postedBy;

    @Column(name = "posted_at")
    private java.time.Instant postedAt;

    @Column(name = "reversed_by")
    private UUID reversedBy;

    @Column(name = "reversed_at")
    private java.time.Instant reversedAt;

    @Column(name = "reversal_entry_id")
    private UUID reversalEntryId;

    @Column(name = "notes", length = 1000)
    private String notes;

    @OneToMany(mappedBy = "journalEntry", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("lineNumber")
    private List<JournalEntryLine> lines = new ArrayList<>();

    /**
     * Types of journal entries.
     */
    public enum EntryType {
        MANUAL,         // Manual journal entry
        SYSTEM,         // System-generated
        PAYROLL,        // Payroll related
        INVOICE,        // Sales invoice
        BILL,           // Purchase bill
        PAYMENT,        // Payment received/made
        RECEIPT,        // Cash receipt
        TRANSFER,       // Bank transfer
        ADJUSTMENT,     // Adjusting entry
        CLOSING,        // Period closing entry
        OPENING,        // Opening balance entry
        REVERSAL        // Reversal of another entry
    }

    /**
     * Status of journal entries.
     */
    public enum EntryStatus {
        DRAFT,          // Not yet posted
        POSTED,         // Posted to ledger
        REVERSED,       // Has been reversed
        VOID            // Cancelled/voided
    }

    /**
     * Create a new journal entry.
     */
    public static JournalEntry create(LocalDate transactionDate, String description, EntryType type) {
        JournalEntry entry = new JournalEntry();
        entry.setTransactionDate(transactionDate);
        entry.setDescription(description);
        entry.setEntryType(type);
        entry.setStatus(EntryStatus.DRAFT);
        entry.setEntryNumber(generateEntryNumber());
        return entry;
    }

    private static String generateEntryNumber() {
        return "JE-" + System.currentTimeMillis() + "-" +
                UUID.randomUUID().toString().substring(0, 4).toUpperCase();
    }

    /**
     * Add a line to this journal entry.
     */
    public void addLine(JournalEntryLine line) {
        line.setLineNumber(lines.size() + 1);
        lines.add(line);
        line.setJournalEntry(this);
        recalculateTotals();
    }

    /**
     * Add a debit line.
     */
    public void addDebit(Account account, BigDecimal amount, String description) {
        JournalEntryLine line = JournalEntryLine.debit(account, amount, description);
        addLine(line);
    }

    /**
     * Add a credit line.
     */
    public void addCredit(Account account, BigDecimal amount, String description) {
        JournalEntryLine line = JournalEntryLine.credit(account, amount, description);
        addLine(line);
    }

    /**
     * Remove a line from this journal entry.
     */
    public void removeLine(JournalEntryLine line) {
        lines.remove(line);
        line.setJournalEntry(null);
        recalculateTotals();
        renumberLines();
    }

    /**
     * Recalculate total debits and credits.
     */
    public void recalculateTotals() {
        this.totalDebit = lines.stream()
                .filter(l -> l.getDebitAmount() != null)
                .map(JournalEntryLine::getDebitAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        this.totalCredit = lines.stream()
                .filter(l -> l.getCreditAmount() != null)
                .map(JournalEntryLine::getCreditAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void renumberLines() {
        for (int i = 0; i < lines.size(); i++) {
            lines.get(i).setLineNumber(i + 1);
        }
    }

    /**
     * Check if the entry is balanced (debits = credits).
     */
    public boolean isBalanced() {
        recalculateTotals();
        return totalDebit.compareTo(totalCredit) == 0;
    }

    /**
     * Validate the entry before posting.
     */
    public List<String> validate() {
        List<String> errors = new ArrayList<>();

        if (lines.isEmpty()) {
            errors.add("Journal entry must have at least one line");
        }

        if (lines.size() < 2) {
            errors.add("Journal entry must have at least two lines (debit and credit)");
        }

        if (!isBalanced()) {
            errors.add(String.format("Entry is not balanced. Debits: %s, Credits: %s",
                    totalDebit, totalCredit));
        }

        if (transactionDate == null) {
            errors.add("Transaction date is required");
        }

        if (description == null || description.isBlank()) {
            errors.add("Description is required");
        }

        // Check that all accounts are postable
        for (JournalEntryLine line : lines) {
            if (line.getAccount() != null && !line.getAccount().isPostable()) {
                errors.add("Account " + line.getAccount().getAccountCode() + " is not postable");
            }
        }

        return errors;
    }

    /**
     * Post the journal entry to the general ledger.
     */
    public void post(UUID postedBy, FiscalPeriod period) {
        if (this.status != EntryStatus.DRAFT) {
            throw new IllegalStateException("Only draft entries can be posted");
        }

        List<String> errors = validate();
        if (!errors.isEmpty()) {
            throw new IllegalStateException("Cannot post invalid entry: " + String.join(", ", errors));
        }

        this.postingDate = LocalDate.now();
        this.postedBy = postedBy;
        this.postedAt = java.time.Instant.now();
        this.fiscalPeriod = period;
        this.status = EntryStatus.POSTED;

        // Update account balances
        for (JournalEntryLine line : lines) {
            if (line.getDebitAmount() != null && line.getDebitAmount().compareTo(BigDecimal.ZERO) > 0) {
                line.getAccount().debit(line.getDebitAmount());
            }
            if (line.getCreditAmount() != null && line.getCreditAmount().compareTo(BigDecimal.ZERO) > 0) {
                line.getAccount().credit(line.getCreditAmount());
            }
        }
    }

    /**
     * Create a reversal of this entry.
     */
    public JournalEntry createReversal(LocalDate reversalDate, String reason) {
        if (this.status != EntryStatus.POSTED) {
            throw new IllegalStateException("Only posted entries can be reversed");
        }

        JournalEntry reversal = JournalEntry.create(
                reversalDate,
                "Reversal of " + this.entryNumber + ": " + reason,
                EntryType.REVERSAL
        );

        // Swap debits and credits
        for (JournalEntryLine originalLine : this.lines) {
            if (originalLine.getDebitAmount() != null &&
                    originalLine.getDebitAmount().compareTo(BigDecimal.ZERO) > 0) {
                reversal.addCredit(originalLine.getAccount(), originalLine.getDebitAmount(),
                        "Reversal: " + originalLine.getDescription());
            }
            if (originalLine.getCreditAmount() != null &&
                    originalLine.getCreditAmount().compareTo(BigDecimal.ZERO) > 0) {
                reversal.addDebit(originalLine.getAccount(), originalLine.getCreditAmount(),
                        "Reversal: " + originalLine.getDescription());
            }
        }

        return reversal;
    }

    /**
     * Mark this entry as reversed.
     */
    public void markAsReversed(UUID reversalEntryId, UUID reversedBy) {
        this.status = EntryStatus.REVERSED;
        this.reversalEntryId = reversalEntryId;
        this.reversedBy = reversedBy;
        this.reversedAt = java.time.Instant.now();
    }
}
