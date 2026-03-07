package com.surework.accounting.service;

import com.surework.accounting.domain.Account;
import com.surework.accounting.domain.FiscalPeriod;
import com.surework.accounting.domain.JournalEntry;
import com.surework.accounting.dto.AccountingDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service interface for accounting operations.
 * All methods require tenant ID for multi-tenant data isolation.
 */
public interface AccountingService {

    // === Account Operations ===

    AccountingDto.AccountResponse createAccount(UUID tenantId, AccountingDto.CreateAccountRequest request);

    AccountingDto.AccountResponse updateAccount(UUID tenantId, UUID accountId, AccountingDto.UpdateAccountRequest request);

    Optional<AccountingDto.AccountResponse> getAccount(UUID tenantId, UUID accountId);

    Optional<AccountingDto.AccountResponse> getAccountByCode(UUID tenantId, String accountCode);

    List<AccountingDto.AccountResponse> getAllAccounts(UUID tenantId);

    List<AccountingDto.AccountResponse> getAccountsByType(UUID tenantId, Account.AccountType type);

    List<AccountingDto.AccountResponse> getPostableAccounts(UUID tenantId);

    Page<AccountingDto.AccountResponse> searchAccounts(
            UUID tenantId,
            String searchTerm,
            Account.AccountType type,
            boolean activeOnly,
            Pageable pageable);

    void deactivateAccount(UUID tenantId, UUID accountId);

    void activateAccount(UUID tenantId, UUID accountId);

    // === Journal Entry Operations ===

    AccountingDto.JournalEntryResponse createJournalEntry(UUID tenantId, AccountingDto.CreateJournalEntryRequest request);

    Optional<AccountingDto.JournalEntryResponse> getJournalEntry(UUID tenantId, UUID entryId);

    Optional<AccountingDto.JournalEntryResponse> getJournalEntryByNumber(UUID tenantId, String entryNumber);

    Page<AccountingDto.JournalEntryResponse> searchJournalEntries(
            UUID tenantId,
            LocalDate startDate,
            LocalDate endDate,
            JournalEntry.EntryStatus status,
            JournalEntry.EntryType type,
            String searchTerm,
            Pageable pageable);

    AccountingDto.JournalEntryResponse postJournalEntry(UUID tenantId, UUID entryId, UUID postedBy);

    AccountingDto.JournalEntryResponse reverseJournalEntry(UUID tenantId, UUID entryId, LocalDate reversalDate, String reason, UUID reversedBy);

    void deleteJournalEntry(UUID tenantId, UUID entryId);

    List<AccountingDto.JournalEntryResponse> getDraftEntries(UUID tenantId);

    // === Fiscal Period Operations ===

    List<AccountingDto.FiscalPeriodResponse> generateFiscalYear(UUID tenantId, int fiscalYear);

    List<AccountingDto.FiscalPeriodResponse> getFiscalPeriodsForYear(UUID tenantId, int fiscalYear);

    Optional<AccountingDto.FiscalPeriodResponse> getCurrentPeriod(UUID tenantId);

    Optional<AccountingDto.FiscalPeriodResponse> getPeriodForDate(UUID tenantId, LocalDate date);

    AccountingDto.FiscalPeriodResponse openPeriod(UUID tenantId, UUID periodId);

    AccountingDto.FiscalPeriodResponse closePeriod(UUID tenantId, UUID periodId, UUID closedBy);

    AccountingDto.FiscalPeriodResponse reopenPeriod(UUID tenantId, UUID periodId, UUID reopenedBy);

    AccountingDto.FiscalPeriodResponse lockPeriod(UUID tenantId, UUID periodId);

    // === Financial Reports ===

    AccountingDto.TrialBalanceReport generateTrialBalance(UUID tenantId, LocalDate asOfDate);

    AccountingDto.BalanceSheetReport generateBalanceSheet(UUID tenantId, LocalDate asOfDate);

    AccountingDto.IncomeStatementReport generateIncomeStatement(UUID tenantId, LocalDate startDate, LocalDate endDate);

    AccountingDto.GeneralLedgerReport generateGeneralLedger(
            UUID tenantId, UUID accountId, LocalDate startDate, LocalDate endDate);

    // === Year-End Processing ===

    void performYearEndClose(UUID tenantId, int fiscalYear, UUID performedBy);
}
