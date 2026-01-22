package com.surework.accounting.dto;

import com.surework.accounting.domain.Account;
import com.surework.accounting.domain.FiscalPeriod;
import com.surework.accounting.domain.JournalEntry;
import com.surework.accounting.domain.JournalEntryLine;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * DTOs for Accounting operations.
 */
public sealed interface AccountingDto {

    // === Account DTOs ===

    record CreateAccountRequest(
            @NotBlank(message = "Account code is required")
            @Size(max = 20, message = "Account code must not exceed 20 characters")
            String accountCode,

            @NotBlank(message = "Account name is required")
            String accountName,

            String description,

            @NotNull(message = "Account type is required")
            Account.AccountType accountType,

            Account.AccountSubtype accountSubtype,

            UUID parentId,

            boolean header,

            Account.VatCategory vatCategory,

            BigDecimal vatRate
    ) implements AccountingDto {}

    record UpdateAccountRequest(
            String accountName,
            String description,
            Account.AccountSubtype accountSubtype,
            boolean active,
            Account.VatCategory vatCategory,
            BigDecimal vatRate
    ) implements AccountingDto {}

    record AccountResponse(
            UUID id,
            String accountCode,
            String accountName,
            String description,
            Account.AccountType accountType,
            Account.AccountSubtype accountSubtype,
            Account.NormalBalance normalBalance,
            UUID parentId,
            String parentName,
            boolean header,
            boolean active,
            boolean systemAccount,
            BigDecimal currentBalance,
            BigDecimal ytdDebit,
            BigDecimal ytdCredit,
            BigDecimal openingBalance,
            Account.VatCategory vatCategory,
            BigDecimal vatRate,
            Instant createdAt
    ) implements AccountingDto {

        public static AccountResponse fromEntity(Account account) {
            return new AccountResponse(
                    account.getId(),
                    account.getAccountCode(),
                    account.getAccountName(),
                    account.getDescription(),
                    account.getAccountType(),
                    account.getAccountSubtype(),
                    account.getNormalBalance(),
                    account.getParent() != null ? account.getParent().getId() : null,
                    account.getParent() != null ? account.getParent().getAccountName() : null,
                    account.isHeader(),
                    account.isActive(),
                    account.isSystemAccount(),
                    account.getCurrentBalance(),
                    account.getYtdDebit(),
                    account.getYtdCredit(),
                    account.getOpeningBalance(),
                    account.getVatCategory(),
                    account.getVatRate(),
                    account.getCreatedAt()
            );
        }
    }

    // === Journal Entry DTOs ===

    record CreateJournalEntryRequest(
            @NotNull(message = "Transaction date is required")
            LocalDate transactionDate,

            @NotBlank(message = "Description is required")
            @Size(max = 500, message = "Description must not exceed 500 characters")
            String description,

            String reference,

            @NotNull(message = "Entry type is required")
            JournalEntry.EntryType entryType,

            @NotNull(message = "Lines are required")
            @Size(min = 2, message = "At least 2 lines are required")
            List<JournalEntryLineRequest> lines,

            String notes
    ) implements AccountingDto {}

    record JournalEntryLineRequest(
            @NotNull(message = "Account ID is required")
            UUID accountId,

            String description,

            BigDecimal debitAmount,

            BigDecimal creditAmount,

            String costCenter,
            String department,
            String project
    ) implements AccountingDto {}

    record JournalEntryResponse(
            UUID id,
            String entryNumber,
            LocalDate transactionDate,
            LocalDate postingDate,
            String description,
            String reference,
            JournalEntry.EntryType entryType,
            JournalEntry.EntryStatus status,
            BigDecimal totalDebit,
            BigDecimal totalCredit,
            UUID fiscalPeriodId,
            String fiscalPeriodName,
            UUID postedBy,
            Instant postedAt,
            UUID reversedBy,
            Instant reversedAt,
            UUID reversalEntryId,
            String notes,
            List<JournalEntryLineResponse> lines,
            Instant createdAt
    ) implements AccountingDto {

        public static JournalEntryResponse fromEntity(JournalEntry entry) {
            return new JournalEntryResponse(
                    entry.getId(),
                    entry.getEntryNumber(),
                    entry.getTransactionDate(),
                    entry.getPostingDate(),
                    entry.getDescription(),
                    entry.getReference(),
                    entry.getEntryType(),
                    entry.getStatus(),
                    entry.getTotalDebit(),
                    entry.getTotalCredit(),
                    entry.getFiscalPeriod() != null ? entry.getFiscalPeriod().getId() : null,
                    entry.getFiscalPeriod() != null ? entry.getFiscalPeriod().getPeriodName() : null,
                    entry.getPostedBy(),
                    entry.getPostedAt(),
                    entry.getReversedBy(),
                    entry.getReversedAt(),
                    entry.getReversalEntryId(),
                    entry.getNotes(),
                    entry.getLines().stream()
                            .map(JournalEntryLineResponse::fromEntity)
                            .toList(),
                    entry.getCreatedAt()
            );
        }
    }

    record JournalEntryLineResponse(
            UUID id,
            int lineNumber,
            UUID accountId,
            String accountCode,
            String accountName,
            String description,
            BigDecimal debitAmount,
            BigDecimal creditAmount,
            String costCenter,
            String department,
            String project
    ) implements AccountingDto {

        public static JournalEntryLineResponse fromEntity(JournalEntryLine line) {
            return new JournalEntryLineResponse(
                    line.getId(),
                    line.getLineNumber(),
                    line.getAccount().getId(),
                    line.getAccount().getAccountCode(),
                    line.getAccount().getAccountName(),
                    line.getDescription(),
                    line.getDebitAmount(),
                    line.getCreditAmount(),
                    line.getCostCenter(),
                    line.getDepartment(),
                    line.getProject()
            );
        }
    }

    // === Fiscal Period DTOs ===

    record FiscalPeriodResponse(
            UUID id,
            int fiscalYear,
            int periodNumber,
            String periodName,
            LocalDate startDate,
            LocalDate endDate,
            FiscalPeriod.PeriodStatus status,
            boolean adjustmentPeriod,
            boolean yearEnd,
            Instant closedAt,
            UUID closedBy
    ) implements AccountingDto {

        public static FiscalPeriodResponse fromEntity(FiscalPeriod period) {
            return new FiscalPeriodResponse(
                    period.getId(),
                    period.getFiscalYear(),
                    period.getPeriodNumber(),
                    period.getPeriodName(),
                    period.getStartDate(),
                    period.getEndDate(),
                    period.getStatus(),
                    period.isAdjustmentPeriod(),
                    period.isYearEnd(),
                    period.getClosedAt(),
                    period.getClosedBy()
            );
        }
    }

    // === Reporting DTOs ===

    record TrialBalanceEntry(
            String accountCode,
            String accountName,
            Account.AccountType accountType,
            BigDecimal debit,
            BigDecimal credit
    ) implements AccountingDto {}

    record TrialBalanceReport(
            LocalDate asOfDate,
            List<TrialBalanceEntry> entries,
            BigDecimal totalDebit,
            BigDecimal totalCredit,
            boolean isBalanced
    ) implements AccountingDto {}

    record BalanceSheetSection(
            String sectionName,
            List<AccountBalance> accounts,
            BigDecimal total
    ) implements AccountingDto {}

    record AccountBalance(
            String accountCode,
            String accountName,
            BigDecimal balance
    ) implements AccountingDto {}

    record BalanceSheetReport(
            LocalDate asOfDate,
            BalanceSheetSection currentAssets,
            BalanceSheetSection nonCurrentAssets,
            BigDecimal totalAssets,
            BalanceSheetSection currentLiabilities,
            BalanceSheetSection nonCurrentLiabilities,
            BigDecimal totalLiabilities,
            BalanceSheetSection equity,
            BigDecimal totalEquity,
            BigDecimal totalLiabilitiesAndEquity
    ) implements AccountingDto {}

    record IncomeStatementReport(
            LocalDate startDate,
            LocalDate endDate,
            List<AccountBalance> revenue,
            BigDecimal totalRevenue,
            List<AccountBalance> costOfSales,
            BigDecimal totalCostOfSales,
            BigDecimal grossProfit,
            List<AccountBalance> operatingExpenses,
            BigDecimal totalOperatingExpenses,
            BigDecimal operatingIncome,
            List<AccountBalance> otherIncomeExpenses,
            BigDecimal netIncomeBeforeTax,
            BigDecimal taxExpense,
            BigDecimal netIncome
    ) implements AccountingDto {}

    record GeneralLedgerEntry(
            LocalDate date,
            String entryNumber,
            String description,
            BigDecimal debit,
            BigDecimal credit,
            BigDecimal runningBalance
    ) implements AccountingDto {}

    record GeneralLedgerReport(
            String accountCode,
            String accountName,
            LocalDate startDate,
            LocalDate endDate,
            BigDecimal openingBalance,
            List<GeneralLedgerEntry> entries,
            BigDecimal closingBalance
    ) implements AccountingDto {}
}
