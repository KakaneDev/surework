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
 */
public interface AccountingService {

    // === Account Operations ===

    AccountingDto.AccountResponse createAccount(AccountingDto.CreateAccountRequest request);

    AccountingDto.AccountResponse updateAccount(UUID accountId, AccountingDto.UpdateAccountRequest request);

    Optional<AccountingDto.AccountResponse> getAccount(UUID accountId);

    Optional<AccountingDto.AccountResponse> getAccountByCode(String accountCode);

    List<AccountingDto.AccountResponse> getAllAccounts();

    List<AccountingDto.AccountResponse> getAccountsByType(Account.AccountType type);

    List<AccountingDto.AccountResponse> getPostableAccounts();

    Page<AccountingDto.AccountResponse> searchAccounts(
            String searchTerm,
            Account.AccountType type,
            boolean activeOnly,
            Pageable pageable);

    void deactivateAccount(UUID accountId);

    void activateAccount(UUID accountId);

    // === Journal Entry Operations ===

    AccountingDto.JournalEntryResponse createJournalEntry(AccountingDto.CreateJournalEntryRequest request);

    Optional<AccountingDto.JournalEntryResponse> getJournalEntry(UUID entryId);

    Optional<AccountingDto.JournalEntryResponse> getJournalEntryByNumber(String entryNumber);

    Page<AccountingDto.JournalEntryResponse> searchJournalEntries(
            LocalDate startDate,
            LocalDate endDate,
            JournalEntry.EntryStatus status,
            JournalEntry.EntryType type,
            String searchTerm,
            Pageable pageable);

    AccountingDto.JournalEntryResponse postJournalEntry(UUID entryId, UUID postedBy);

    AccountingDto.JournalEntryResponse reverseJournalEntry(UUID entryId, LocalDate reversalDate, String reason, UUID reversedBy);

    void deleteJournalEntry(UUID entryId);

    List<AccountingDto.JournalEntryResponse> getDraftEntries();

    // === Fiscal Period Operations ===

    List<AccountingDto.FiscalPeriodResponse> generateFiscalYear(int fiscalYear);

    List<AccountingDto.FiscalPeriodResponse> getFiscalPeriodsForYear(int fiscalYear);

    Optional<AccountingDto.FiscalPeriodResponse> getCurrentPeriod();

    Optional<AccountingDto.FiscalPeriodResponse> getPeriodForDate(LocalDate date);

    AccountingDto.FiscalPeriodResponse openPeriod(UUID periodId);

    AccountingDto.FiscalPeriodResponse closePeriod(UUID periodId, UUID closedBy);

    AccountingDto.FiscalPeriodResponse reopenPeriod(UUID periodId, UUID reopenedBy);

    AccountingDto.FiscalPeriodResponse lockPeriod(UUID periodId);

    // === Financial Reports ===

    AccountingDto.TrialBalanceReport generateTrialBalance(LocalDate asOfDate);

    AccountingDto.BalanceSheetReport generateBalanceSheet(LocalDate asOfDate);

    AccountingDto.IncomeStatementReport generateIncomeStatement(LocalDate startDate, LocalDate endDate);

    AccountingDto.GeneralLedgerReport generateGeneralLedger(
            UUID accountId, LocalDate startDate, LocalDate endDate);

    // === Year-End Processing ===

    void performYearEndClose(int fiscalYear, UUID performedBy);
}
