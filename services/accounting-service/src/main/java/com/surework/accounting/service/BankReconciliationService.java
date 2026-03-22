package com.surework.accounting.service;

import com.surework.accounting.dto.BankingDto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Service interface for bank reconciliation operations.
 * Handles matching transactions to accounts and creating journal entries.
 * All methods require tenant ID for multi-tenant data isolation.
 */
public interface BankReconciliationService {

    // === Reconciliation Operations ===

    /**
     * Reconcile a single transaction to an account.
     */
    BankingDto.BankTransactionResponse reconcileTransaction(
            UUID tenantId,
            UUID transactionId,
            BankingDto.ReconcileTransactionRequest request,
            UUID userId);

    /**
     * Reconcile multiple transactions in bulk.
     */
    List<BankingDto.BankTransactionResponse> bulkReconcile(
            UUID tenantId,
            BankingDto.BulkReconcileRequest request,
            UUID userId);

    /**
     * Accept the suggested match for a transaction.
     */
    BankingDto.BankTransactionResponse acceptSuggestion(UUID tenantId, UUID transactionId, UUID userId);

    /**
     * Undo reconciliation for a transaction.
     */
    BankingDto.BankTransactionResponse unreconcile(UUID tenantId, UUID transactionId, UUID userId);

    /**
     * Exclude a transaction from reconciliation.
     */
    BankingDto.BankTransactionResponse excludeTransaction(UUID tenantId, UUID transactionId, UUID userId);

    // === Matching ===

    /**
     * Get suggested matches for a transaction.
     */
    List<BankingDto.SuggestedMatch> getSuggestedMatches(UUID tenantId, UUID transactionId);

    /**
     * Find potential matches by amount and date range.
     */
    List<BankingDto.BankTransactionResponse> findPotentialMatches(
            UUID tenantId,
            UUID bankAccountId,
            java.math.BigDecimal amount,
            LocalDate startDate,
            LocalDate endDate);

    /**
     * Auto-match transactions using smart matching algorithm.
     */
    int autoMatchTransactions(UUID tenantId, UUID bankAccountId);

    // === Reporting ===

    /**
     * Get reconciliation summary for a bank account.
     */
    BankingDto.ReconciliationSummary getReconciliationSummary(UUID tenantId, UUID bankAccountId);

    /**
     * Get reconciliation summary for all bank accounts.
     */
    List<BankingDto.ReconciliationSummary> getAllReconciliationSummaries(UUID tenantId);

    /**
     * Generate bank reconciliation statement.
     */
    BankReconciliationStatement generateReconciliationStatement(
            UUID tenantId,
            UUID bankAccountId,
            LocalDate asOfDate);

    // === Statement DTO ===

    record BankReconciliationStatement(
            UUID bankAccountId,
            String bankAccountName,
            LocalDate asOfDate,
            java.math.BigDecimal bankStatementBalance,
            java.math.BigDecimal glBalance,
            List<OutstandingItem> outstandingDeposits,
            java.math.BigDecimal totalOutstandingDeposits,
            List<OutstandingItem> outstandingPayments,
            java.math.BigDecimal totalOutstandingPayments,
            java.math.BigDecimal adjustedBankBalance,
            java.math.BigDecimal difference,
            boolean isReconciled
    ) {}

    record OutstandingItem(
            UUID transactionId,
            LocalDate date,
            String description,
            String reference,
            java.math.BigDecimal amount
    ) {}
}
