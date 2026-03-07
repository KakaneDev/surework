package com.surework.accounting.dto;

import com.surework.accounting.domain.BankAccount;
import com.surework.accounting.domain.BankRule;
import com.surework.accounting.domain.BankTransaction;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * DTOs for Bank Integration operations.
 */
public sealed interface BankingDto {

    // === Bank Account DTOs ===

    record BankAccountResponse(
            UUID id,
            String accountName,
            String accountNumberMasked,
            String institutionId,
            String institutionName,
            String institutionLogo,
            String currency,
            String accountType,
            BankAccount.ConnectionStatus status,
            Instant lastSyncAt,
            BankAccount.SyncStatus lastSyncStatus,
            String syncErrorMessage,
            UUID glAccountId,
            String glAccountCode,
            String glAccountName,
            BigDecimal currentBalance,
            BigDecimal availableBalance,
            Instant balanceUpdatedAt,
            long unreconciledCount,
            Instant createdAt
    ) implements BankingDto {

        public static BankAccountResponse fromEntity(BankAccount account, long unreconciledCount) {
            return new BankAccountResponse(
                    account.getId(),
                    account.getAccountName(),
                    account.getDisplayAccountNumber(),
                    account.getInstitutionId(),
                    account.getInstitutionName(),
                    account.getInstitutionLogo(),
                    account.getCurrency(),
                    account.getAccountType(),
                    account.getStatus(),
                    account.getLastSyncAt(),
                    account.getLastSyncStatus(),
                    account.getSyncErrorMessage(),
                    account.getGlAccount() != null ? account.getGlAccount().getId() : null,
                    account.getGlAccount() != null ? account.getGlAccount().getAccountCode() : null,
                    account.getGlAccount() != null ? account.getGlAccount().getAccountName() : null,
                    account.getCurrentBalance(),
                    account.getAvailableBalance(),
                    account.getBalanceUpdatedAt(),
                    unreconciledCount,
                    account.getCreatedAt()
            );
        }
    }

    record ConnectBankRequest(
            @NotBlank(message = "Stitch account ID is required")
            String stitchAccountId,

            @NotBlank(message = "Account name is required")
            String accountName,

            String accountNumber,

            @NotBlank(message = "Institution ID is required")
            String institutionId,

            @NotBlank(message = "Institution name is required")
            String institutionName,

            String institutionLogo,

            String currency,

            String accountType,

            String stitchUserId,

            String stitchConsentId,

            UUID glAccountId
    ) implements BankingDto {}

    record UpdateBankAccountRequest(
            String accountName,
            UUID glAccountId
    ) implements BankingDto {}

    record StitchOAuthResponse(
            String authorizationUrl,
            String state,
            String codeVerifier
    ) implements BankingDto {}

    record StitchCallbackRequest(
            @NotBlank String code,
            @NotBlank String state
    ) implements BankingDto {}

    // === Bank Transaction DTOs ===

    record BankTransactionResponse(
            UUID id,
            UUID bankAccountId,
            String bankAccountName,
            String externalId,
            String reference,
            LocalDate transactionDate,
            LocalDate postedDate,
            String description,
            String payeeName,
            BigDecimal amount,
            BankTransaction.TransactionType transactionType,
            BigDecimal runningBalance,
            String category,
            BankTransaction.ReconciliationStatus reconciliationStatus,
            Instant reconciledAt,
            UUID journalEntryId,
            String journalEntryNumber,
            UUID matchedAccountId,
            String matchedAccountCode,
            String matchedAccountName,
            UUID suggestedAccountId,
            String suggestedAccountCode,
            String suggestedAccountName,
            BigDecimal suggestionConfidence,
            BankTransaction.SuggestionSource suggestionSource,
            Instant createdAt
    ) implements BankingDto {

        public static BankTransactionResponse fromEntity(BankTransaction txn) {
            return new BankTransactionResponse(
                    txn.getId(),
                    txn.getBankAccount().getId(),
                    txn.getBankAccount().getAccountName(),
                    txn.getExternalId(),
                    txn.getReference(),
                    txn.getTransactionDate(),
                    txn.getPostedDate(),
                    txn.getDescription(),
                    txn.getPayeeName(),
                    txn.getAmount(),
                    txn.getTransactionType(),
                    txn.getRunningBalance(),
                    txn.getCategory(),
                    txn.getReconciliationStatus(),
                    txn.getReconciledAt(),
                    txn.getJournalEntry() != null ? txn.getJournalEntry().getId() : null,
                    txn.getJournalEntry() != null ? txn.getJournalEntry().getEntryNumber() : null,
                    txn.getMatchedAccount() != null ? txn.getMatchedAccount().getId() : null,
                    txn.getMatchedAccount() != null ? txn.getMatchedAccount().getAccountCode() : null,
                    txn.getMatchedAccount() != null ? txn.getMatchedAccount().getAccountName() : null,
                    txn.getSuggestedAccount() != null ? txn.getSuggestedAccount().getId() : null,
                    txn.getSuggestedAccount() != null ? txn.getSuggestedAccount().getAccountCode() : null,
                    txn.getSuggestedAccount() != null ? txn.getSuggestedAccount().getAccountName() : null,
                    txn.getSuggestionConfidence(),
                    txn.getSuggestionSource(),
                    txn.getCreatedAt()
            );
        }
    }

    record ImportTransactionRequest(
            @NotBlank String externalId,
            @NotNull LocalDate transactionDate,
            LocalDate postedDate,
            @NotBlank String description,
            String payeeName,
            @NotNull BigDecimal amount,
            @NotNull BankTransaction.TransactionType transactionType,
            BigDecimal runningBalance,
            String category,
            String merchantCategoryCode,
            String reference
    ) implements BankingDto {}

    // === Bank Rule DTOs ===

    record BankRuleResponse(
            UUID id,
            String name,
            String description,
            BankRule.ConditionField conditionField,
            BankRule.ConditionOperator conditionOperator,
            String conditionValue,
            String conditionValueSecondary,
            String conditionDescription,
            UUID targetAccountId,
            String targetAccountCode,
            String targetAccountName,
            String payeeNameOverride,
            boolean active,
            int priority,
            int matchCount,
            Instant lastMatchedAt,
            UUID bankAccountId,
            String bankAccountName,
            Instant createdAt
    ) implements BankingDto {

        public static BankRuleResponse fromEntity(BankRule rule) {
            return new BankRuleResponse(
                    rule.getId(),
                    rule.getName(),
                    rule.getDescription(),
                    rule.getConditionField(),
                    rule.getConditionOperator(),
                    rule.getConditionValue(),
                    rule.getConditionValueSecondary(),
                    rule.getConditionDescription(),
                    rule.getTargetAccount().getId(),
                    rule.getTargetAccount().getAccountCode(),
                    rule.getTargetAccount().getAccountName(),
                    rule.getPayeeNameOverride(),
                    rule.isActive(),
                    rule.getPriority(),
                    rule.getMatchCount(),
                    rule.getLastMatchedAt(),
                    rule.getBankAccount() != null ? rule.getBankAccount().getId() : null,
                    rule.getBankAccount() != null ? rule.getBankAccount().getAccountName() : null,
                    rule.getCreatedAt()
            );
        }
    }

    record CreateBankRuleRequest(
            @NotBlank(message = "Rule name is required")
            @Size(max = 100, message = "Name must not exceed 100 characters")
            String name,

            String description,

            @NotNull(message = "Condition field is required")
            BankRule.ConditionField conditionField,

            @NotNull(message = "Condition operator is required")
            BankRule.ConditionOperator conditionOperator,

            @NotBlank(message = "Condition value is required")
            @Size(max = 200, message = "Condition value must not exceed 200 characters")
            String conditionValue,

            String conditionValueSecondary,

            @NotNull(message = "Target account is required")
            UUID targetAccountId,

            String payeeNameOverride,

            int priority,

            UUID bankAccountId
    ) implements BankingDto {}

    record UpdateBankRuleRequest(
            String name,
            String description,
            BankRule.ConditionField conditionField,
            BankRule.ConditionOperator conditionOperator,
            String conditionValue,
            String conditionValueSecondary,
            UUID targetAccountId,
            String payeeNameOverride,
            boolean active,
            int priority,
            UUID bankAccountId
    ) implements BankingDto {}

    // === Reconciliation DTOs ===

    record ReconcileTransactionRequest(
            @NotNull(message = "Account ID is required")
            UUID accountId,

            String description,

            boolean createJournalEntry
    ) implements BankingDto {}

    record BulkReconcileRequest(
            @NotNull List<UUID> transactionIds,

            @NotNull UUID accountId,

            boolean createJournalEntries
    ) implements BankingDto {}

    record ReconciliationSummary(
            UUID bankAccountId,
            String bankAccountName,
            long totalTransactions,
            long unreconciledCount,
            long suggestedCount,
            long matchedCount,
            long reconciledCount,
            long excludedCount,
            BigDecimal unreconciledDebits,
            BigDecimal unreconciledCredits,
            BigDecimal unreconciledNet
    ) implements BankingDto {}

    record SuggestedMatch(
            UUID transactionId,
            UUID suggestedAccountId,
            String suggestedAccountCode,
            String suggestedAccountName,
            BigDecimal confidence,
            BankTransaction.SuggestionSource source,
            String reason
    ) implements BankingDto {}

    // === Sync DTOs ===

    record SyncResult(
            UUID bankAccountId,
            int transactionsImported,
            int transactionsDuplicate,
            int transactionsFailed,
            int rulesApplied,
            Instant syncStartedAt,
            Instant syncCompletedAt,
            boolean success,
            String errorMessage
    ) implements BankingDto {}

    // === Dashboard DTOs ===

    record BankingDashboard(
            int connectedAccounts,
            int accountsNeedingReauth,
            long totalUnreconciled,
            BigDecimal unreconciledInflow,
            BigDecimal unreconciledOutflow,
            List<BankAccountSummary> accountSummaries,
            List<BankTransactionResponse> recentTransactions
    ) implements BankingDto {}

    record BankAccountSummary(
            UUID id,
            String accountName,
            String institutionName,
            String institutionLogo,
            BigDecimal currentBalance,
            long unreconciledCount,
            BankAccount.ConnectionStatus status,
            Instant lastSyncAt
    ) implements BankingDto {}

    // === Institution DTOs ===

    record InstitutionInfo(
            String id,
            String name,
            String logo,
            String country,
            boolean supportsAccountLinking,
            boolean supportsPayments
    ) implements BankingDto {}

    // === Filter Enums ===

    enum ReconciliationStatusFilter {
        ALL,
        UNRECONCILED,
        SUGGESTED,
        MATCHED,
        RECONCILED,
        EXCLUDED
    }

    enum TransactionTypeFilter {
        ALL,
        DEBIT,
        CREDIT
    }
}
