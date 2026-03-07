package com.surework.accounting.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Represents a bank account linked via Open Banking (Stitch API).
 * Stores connection details and synchronization status.
 */
@Entity
@Table(name = "bank_accounts", indexes = {
        @Index(name = "idx_bank_accounts_stitch_id", columnList = "stitch_account_id"),
        @Index(name = "idx_bank_accounts_status", columnList = "status"),
        @Index(name = "idx_bank_accounts_gl_account", columnList = "gl_account_id")
})
@Getter
@Setter
@NoArgsConstructor
public class BankAccount extends BaseEntity {

    @Column(name = "account_name", nullable = false, length = 100)
    private String accountName;

    @Column(name = "account_number", length = 50)
    private String accountNumber;

    @Column(name = "account_number_masked", length = 20)
    private String accountNumberMasked;

    @Column(name = "institution_id", nullable = false, length = 50)
    private String institutionId;

    @Column(name = "institution_name", nullable = false, length = 100)
    private String institutionName;

    @Column(name = "institution_logo", length = 500)
    private String institutionLogo;

    @Column(name = "currency", length = 10)
    private String currency = "ZAR";

    @Column(name = "account_type", length = 50)
    private String accountType;

    // Stitch API integration fields
    @Column(name = "stitch_account_id", nullable = false, unique = true, length = 100)
    private String stitchAccountId;

    @Column(name = "stitch_user_id", length = 100)
    private String stitchUserId;

    @Column(name = "stitch_consent_id", length = 100)
    private String stitchConsentId;

    // Connection status
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ConnectionStatus status = ConnectionStatus.PENDING;

    @Column(name = "last_sync_at")
    private Instant lastSyncAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "last_sync_status")
    private SyncStatus lastSyncStatus;

    @Column(name = "sync_error_message", length = 500)
    private String syncErrorMessage;

    @Column(name = "next_sync_at")
    private Instant nextSyncAt;

    // Link to Chart of Accounts
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gl_account_id")
    private Account glAccount;

    // Balance tracking
    @Column(name = "current_balance", precision = 15, scale = 2)
    private BigDecimal currentBalance;

    @Column(name = "available_balance", precision = 15, scale = 2)
    private BigDecimal availableBalance;

    @Column(name = "balance_updated_at")
    private Instant balanceUpdatedAt;

    // Multi-tenant
    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "created_by")
    private UUID createdBy;

    // Transactions
    @OneToMany(mappedBy = "bankAccount", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BankTransaction> transactions = new ArrayList<>();

    /**
     * Connection status for Open Banking link.
     */
    public enum ConnectionStatus {
        PENDING,           // Initial connection in progress
        ACTIVE,            // Successfully connected and syncing
        DISCONNECTED,      // User disconnected or revoked consent
        ERROR,             // Connection error (retryable)
        REAUTH_REQUIRED    // User needs to re-authenticate
    }

    /**
     * Sync status for last synchronization attempt.
     */
    public enum SyncStatus {
        SUCCESS,   // All transactions synced successfully
        PARTIAL,   // Some transactions synced, others failed
        FAILED     // Sync completely failed
    }

    /**
     * Create a new bank account from Stitch data.
     */
    public static BankAccount fromStitchData(
            String stitchAccountId,
            String accountName,
            String institutionId,
            String institutionName) {
        BankAccount account = new BankAccount();
        account.setStitchAccountId(stitchAccountId);
        account.setAccountName(accountName);
        account.setInstitutionId(institutionId);
        account.setInstitutionName(institutionName);
        account.setStatus(ConnectionStatus.PENDING);
        return account;
    }

    /**
     * Mark the connection as active after successful verification.
     */
    public void activate() {
        this.status = ConnectionStatus.ACTIVE;
    }

    /**
     * Mark the connection as requiring re-authentication.
     */
    public void requireReauth() {
        this.status = ConnectionStatus.REAUTH_REQUIRED;
    }

    /**
     * Disconnect this bank account.
     */
    public void disconnect() {
        this.status = ConnectionStatus.DISCONNECTED;
    }

    /**
     * Record a successful sync.
     */
    public void recordSyncSuccess() {
        this.lastSyncAt = Instant.now();
        this.lastSyncStatus = SyncStatus.SUCCESS;
        this.syncErrorMessage = null;
        scheduleNextSync();
    }

    /**
     * Record a partial sync (some transactions failed).
     */
    public void recordSyncPartial(String errorMessage) {
        this.lastSyncAt = Instant.now();
        this.lastSyncStatus = SyncStatus.PARTIAL;
        this.syncErrorMessage = errorMessage;
        scheduleNextSync();
    }

    /**
     * Record a failed sync.
     */
    public void recordSyncFailed(String errorMessage) {
        this.lastSyncAt = Instant.now();
        this.lastSyncStatus = SyncStatus.FAILED;
        this.syncErrorMessage = errorMessage;
        // Schedule retry sooner for failed syncs
        this.nextSyncAt = Instant.now().plusSeconds(300); // 5 minutes
    }

    /**
     * Update balance from bank feed.
     */
    public void updateBalance(BigDecimal currentBalance, BigDecimal availableBalance) {
        this.currentBalance = currentBalance;
        this.availableBalance = availableBalance;
        this.balanceUpdatedAt = Instant.now();
    }

    /**
     * Schedule the next sync (default 4 hours).
     */
    private void scheduleNextSync() {
        this.nextSyncAt = Instant.now().plusSeconds(14400); // 4 hours
    }

    /**
     * Check if sync is due.
     */
    public boolean isSyncDue() {
        return nextSyncAt == null || Instant.now().isAfter(nextSyncAt);
    }

    /**
     * Check if account is connected and can sync.
     */
    public boolean canSync() {
        return status == ConnectionStatus.ACTIVE;
    }

    /**
     * Get masked account number for display.
     */
    public String getDisplayAccountNumber() {
        if (accountNumberMasked != null) {
            return accountNumberMasked;
        }
        if (accountNumber != null && accountNumber.length() > 4) {
            return "****" + accountNumber.substring(accountNumber.length() - 4);
        }
        return "****";
    }
}
