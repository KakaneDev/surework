package com.surework.accounting.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Represents a bank transaction imported from Open Banking feed.
 * Tracks reconciliation status and links to journal entries.
 */
@Entity
@Table(name = "bank_transactions", indexes = {
        @Index(name = "idx_bank_transactions_account", columnList = "bank_account_id"),
        @Index(name = "idx_bank_transactions_date", columnList = "transaction_date"),
        @Index(name = "idx_bank_transactions_status", columnList = "reconciliation_status"),
        @Index(name = "idx_bank_transactions_external", columnList = "external_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_bank_transaction_external", columnNames = {"bank_account_id", "external_id"})
})
@Getter
@Setter
@NoArgsConstructor
public class BankTransaction extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_account_id", nullable = false)
    private BankAccount bankAccount;

    // Transaction identifiers
    @Column(name = "external_id", nullable = false, length = 100)
    private String externalId;

    @Column(name = "reference", length = 200)
    private String reference;

    // Transaction details
    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @Column(name = "posted_date")
    private LocalDate postedDate;

    @Column(name = "description", nullable = false, length = 500)
    private String description;

    @Column(name = "payee_name", length = 200)
    private String payeeName;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false)
    private TransactionType transactionType;

    @Column(name = "running_balance", precision = 15, scale = 2)
    private BigDecimal runningBalance;

    // Categorization from bank
    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "merchant_category_code", length = 10)
    private String merchantCategoryCode;

    // Reconciliation status
    @Enumerated(EnumType.STRING)
    @Column(name = "reconciliation_status", nullable = false)
    private ReconciliationStatus reconciliationStatus = ReconciliationStatus.UNRECONCILED;

    @Column(name = "reconciled_at")
    private Instant reconciledAt;

    @Column(name = "reconciled_by")
    private UUID reconciledBy;

    // Link to journal entry (when reconciled)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_entry_id")
    private JournalEntry journalEntry;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "matched_account_id")
    private Account matchedAccount;

    // Suggested match (from auto-categorization or bank rules)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "suggested_account_id")
    private Account suggestedAccount;

    @Column(name = "suggestion_confidence", precision = 5, scale = 2)
    private BigDecimal suggestionConfidence;

    @Enumerated(EnumType.STRING)
    @Column(name = "suggestion_source")
    private SuggestionSource suggestionSource;

    // Multi-tenant
    @Column(name = "tenant_id")
    private UUID tenantId;

    /**
     * Transaction type (money in or out).
     */
    public enum TransactionType {
        DEBIT,   // Money out (expense/payment)
        CREDIT   // Money in (income/receipt)
    }

    /**
     * Reconciliation workflow status.
     */
    public enum ReconciliationStatus {
        UNRECONCILED,  // Not yet processed
        SUGGESTED,     // System suggested a match
        MATCHED,       // User accepted a match, pending journal creation
        RECONCILED,    // Fully reconciled with journal entry
        EXCLUDED       // Manually excluded (e.g., transfer between own accounts)
    }

    /**
     * Source of the account suggestion.
     */
    public enum SuggestionSource {
        BANK_RULE,     // Matched by user-defined bank rule
        ML_MODEL,      // Machine learning prediction
        HISTORICAL,    // Based on previous similar transactions
        PAYEE_MATCH    // Matched by payee name
    }

    /**
     * Create transaction from bank feed data.
     */
    public static BankTransaction fromBankFeed(
            BankAccount bankAccount,
            String externalId,
            LocalDate transactionDate,
            String description,
            BigDecimal amount,
            TransactionType type) {
        BankTransaction txn = new BankTransaction();
        txn.setBankAccount(bankAccount);
        txn.setExternalId(externalId);
        txn.setTransactionDate(transactionDate);
        txn.setDescription(description);
        txn.setAmount(amount);
        txn.setTransactionType(type);
        txn.setReconciliationStatus(ReconciliationStatus.UNRECONCILED);
        txn.setTenantId(bankAccount.getTenantId());
        return txn;
    }

    /**
     * Apply a suggestion from bank rules or ML.
     */
    public void applySuggestion(Account account, BigDecimal confidence, SuggestionSource source) {
        this.suggestedAccount = account;
        this.suggestionConfidence = confidence;
        this.suggestionSource = source;
        this.reconciliationStatus = ReconciliationStatus.SUGGESTED;
    }

    /**
     * Accept the current suggestion.
     */
    public void acceptSuggestion(UUID userId) {
        if (this.suggestedAccount != null) {
            this.matchedAccount = this.suggestedAccount;
            this.reconciliationStatus = ReconciliationStatus.MATCHED;
        }
    }

    /**
     * Match to a specific account (override suggestion).
     */
    public void matchToAccount(Account account) {
        this.matchedAccount = account;
        this.reconciliationStatus = ReconciliationStatus.MATCHED;
    }

    /**
     * Complete reconciliation with journal entry.
     */
    public void reconcile(JournalEntry journalEntry, UUID userId) {
        this.journalEntry = journalEntry;
        this.reconciledAt = Instant.now();
        this.reconciledBy = userId;
        this.reconciliationStatus = ReconciliationStatus.RECONCILED;
    }

    /**
     * Exclude from reconciliation.
     */
    public void exclude(UUID userId) {
        this.reconciledAt = Instant.now();
        this.reconciledBy = userId;
        this.reconciliationStatus = ReconciliationStatus.EXCLUDED;
    }

    /**
     * Undo reconciliation.
     */
    public void unreoncile() {
        this.journalEntry = null;
        this.matchedAccount = null;
        this.reconciledAt = null;
        this.reconciledBy = null;
        if (this.suggestedAccount != null) {
            this.reconciliationStatus = ReconciliationStatus.SUGGESTED;
        } else {
            this.reconciliationStatus = ReconciliationStatus.UNRECONCILED;
        }
    }

    /**
     * Check if this transaction needs attention.
     */
    public boolean needsAttention() {
        return reconciliationStatus == ReconciliationStatus.UNRECONCILED ||
                reconciliationStatus == ReconciliationStatus.SUGGESTED;
    }

    /**
     * Get absolute amount (always positive).
     */
    public BigDecimal getAbsoluteAmount() {
        return amount.abs();
    }

    /**
     * Get signed amount (positive for credits, negative for debits).
     */
    public BigDecimal getSignedAmount() {
        return transactionType == TransactionType.CREDIT ? amount.abs() : amount.abs().negate();
    }

    /**
     * Check if this is money coming in.
     */
    public boolean isInflow() {
        return transactionType == TransactionType.CREDIT;
    }

    /**
     * Check if this is money going out.
     */
    public boolean isOutflow() {
        return transactionType == TransactionType.DEBIT;
    }
}
