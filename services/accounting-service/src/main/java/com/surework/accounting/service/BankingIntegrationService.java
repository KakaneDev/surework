package com.surework.accounting.service;

import com.surework.accounting.dto.BankingDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service interface for Open Banking integration via Stitch API.
 * Handles bank account connections, transaction syncing, and rule management.
 * All methods require tenant ID for multi-tenant data isolation.
 */
public interface BankingIntegrationService {

    // === Bank Account Operations ===

    /**
     * Get all bank accounts for the specified tenant.
     */
    List<BankingDto.BankAccountResponse> getBankAccounts(UUID tenantId);

    /**
     * Get a specific bank account.
     */
    Optional<BankingDto.BankAccountResponse> getBankAccount(UUID tenantId, UUID bankAccountId);

    /**
     * Connect a new bank account from Stitch.
     */
    BankingDto.BankAccountResponse connectBankAccount(UUID tenantId, BankingDto.ConnectBankRequest request, UUID userId);

    /**
     * Update bank account settings.
     */
    BankingDto.BankAccountResponse updateBankAccount(UUID tenantId, UUID bankAccountId, BankingDto.UpdateBankAccountRequest request);

    /**
     * Disconnect a bank account.
     */
    void disconnectBankAccount(UUID tenantId, UUID bankAccountId);

    /**
     * Initiate OAuth flow for Stitch.
     */
    BankingDto.StitchOAuthResponse initiateStitchOAuth(UUID tenantId, String redirectUri);

    /**
     * Complete OAuth flow and link accounts.
     */
    List<BankingDto.BankAccountResponse> completeStitchOAuth(UUID tenantId, BankingDto.StitchCallbackRequest callback, UUID userId);

    // === Transaction Sync Operations ===

    /**
     * Sync transactions for a specific bank account.
     */
    BankingDto.SyncResult syncTransactions(UUID tenantId, UUID bankAccountId);

    /**
     * Sync transactions for all active bank accounts.
     */
    List<BankingDto.SyncResult> syncAllAccounts(UUID tenantId);

    /**
     * Import transactions manually (for testing or manual import).
     */
    List<BankingDto.BankTransactionResponse> importTransactions(
            UUID tenantId,
            UUID bankAccountId,
            List<BankingDto.ImportTransactionRequest> transactions);

    // === Transaction Retrieval ===

    /**
     * Get transactions for a bank account.
     */
    List<BankingDto.BankTransactionResponse> getTransactions(UUID tenantId, UUID bankAccountId);

    /**
     * Get transactions with filtering.
     */
    Page<BankingDto.BankTransactionResponse> searchTransactions(
            UUID tenantId,
            UUID bankAccountId,
            String searchTerm,
            BankingDto.ReconciliationStatusFilter status,
            BankingDto.TransactionTypeFilter type,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable);

    /**
     * Get unreconciled transactions.
     */
    List<BankingDto.BankTransactionResponse> getUnreconciledTransactions(UUID tenantId, UUID bankAccountId);

    /**
     * Get a specific transaction.
     */
    Optional<BankingDto.BankTransactionResponse> getTransaction(UUID tenantId, UUID transactionId);

    // === Bank Rule Operations ===

    /**
     * Get all bank rules.
     */
    List<BankingDto.BankRuleResponse> getBankRules(UUID tenantId);

    /**
     * Get a specific bank rule.
     */
    Optional<BankingDto.BankRuleResponse> getBankRule(UUID tenantId, UUID ruleId);

    /**
     * Create a new bank rule.
     */
    BankingDto.BankRuleResponse createBankRule(UUID tenantId, BankingDto.CreateBankRuleRequest request, UUID userId);

    /**
     * Update a bank rule.
     */
    BankingDto.BankRuleResponse updateBankRule(UUID tenantId, UUID ruleId, BankingDto.UpdateBankRuleRequest request);

    /**
     * Delete a bank rule.
     */
    void deleteBankRule(UUID tenantId, UUID ruleId);

    /**
     * Test a rule against a transaction.
     */
    boolean testRule(UUID tenantId, UUID ruleId, UUID transactionId);

    /**
     * Apply rules to unreconciled transactions.
     */
    int applyRulesToTransactions(UUID tenantId, UUID bankAccountId);

    // === Dashboard ===

    /**
     * Get banking dashboard summary.
     */
    BankingDto.BankingDashboard getDashboard(UUID tenantId);

    // === Supported Institutions ===

    /**
     * Get list of supported South African banks/institutions.
     */
    List<BankingDto.InstitutionInfo> getSupportedInstitutions();
}
