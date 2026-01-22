package com.surework.accounting.service;

import com.surework.accounting.domain.Account;
import com.surework.accounting.domain.FiscalPeriod;
import com.surework.accounting.domain.JournalEntry;
import com.surework.accounting.domain.JournalEntryLine;
import com.surework.accounting.dto.AccountingDto;
import com.surework.accounting.repository.AccountRepository;
import com.surework.accounting.repository.FiscalPeriodRepository;
import com.surework.accounting.repository.JournalEntryRepository;
import com.surework.common.messaging.DomainEventPublisher;
import com.surework.common.web.exception.BusinessRuleException;
import com.surework.common.web.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of AccountingService.
 * Implements double-entry bookkeeping with South African compliance.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AccountingServiceImpl implements AccountingService {

    private final AccountRepository accountRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final FiscalPeriodRepository fiscalPeriodRepository;
    private final DomainEventPublisher eventPublisher;

    // === Account Operations ===

    @Override
    @Transactional
    public AccountingDto.AccountResponse createAccount(AccountingDto.CreateAccountRequest request) {
        if (accountRepository.existsByAccountCode(request.accountCode())) {
            throw new BusinessRuleException("Account code already exists: " + request.accountCode());
        }

        Account account = Account.create(
                request.accountCode(),
                request.accountName(),
                request.accountType()
        );

        account.setDescription(request.description());
        account.setAccountSubtype(request.accountSubtype());
        account.setHeader(request.header());
        account.setVatCategory(request.vatCategory());
        account.setVatRate(request.vatRate());

        if (request.parentId() != null) {
            Account parent = accountRepository.findById(request.parentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Account", request.parentId()));
            account.setParent(parent);
        }

        account = accountRepository.save(account);
        log.info("Created account: {} - {}", account.getAccountCode(), account.getAccountName());

        return AccountingDto.AccountResponse.fromEntity(account);
    }

    @Override
    @Transactional
    public AccountingDto.AccountResponse updateAccount(UUID accountId, AccountingDto.UpdateAccountRequest request) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account", accountId));

        if (account.isSystemAccount()) {
            throw new BusinessRuleException("System accounts cannot be modified");
        }

        if (request.accountName() != null) {
            account.setAccountName(request.accountName());
        }
        if (request.description() != null) {
            account.setDescription(request.description());
        }
        if (request.accountSubtype() != null) {
            account.setAccountSubtype(request.accountSubtype());
        }
        account.setActive(request.active());
        if (request.vatCategory() != null) {
            account.setVatCategory(request.vatCategory());
        }
        if (request.vatRate() != null) {
            account.setVatRate(request.vatRate());
        }

        account = accountRepository.save(account);
        log.info("Updated account: {}", account.getAccountCode());

        return AccountingDto.AccountResponse.fromEntity(account);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<AccountingDto.AccountResponse> getAccount(UUID accountId) {
        return accountRepository.findById(accountId)
                .filter(a -> !a.isDeleted())
                .map(AccountingDto.AccountResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<AccountingDto.AccountResponse> getAccountByCode(String accountCode) {
        return accountRepository.findByAccountCode(accountCode)
                .filter(a -> !a.isDeleted())
                .map(AccountingDto.AccountResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AccountingDto.AccountResponse> getAllAccounts() {
        return accountRepository.findAllActive().stream()
                .map(AccountingDto.AccountResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AccountingDto.AccountResponse> getAccountsByType(Account.AccountType type) {
        return accountRepository.findByAccountType(type).stream()
                .map(AccountingDto.AccountResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AccountingDto.AccountResponse> getPostableAccounts() {
        return accountRepository.findAllPostable().stream()
                .map(AccountingDto.AccountResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AccountingDto.AccountResponse> searchAccounts(
            String searchTerm,
            Account.AccountType type,
            boolean activeOnly,
            Pageable pageable) {
        return accountRepository.search(searchTerm, type, activeOnly, pageable)
                .map(AccountingDto.AccountResponse::fromEntity);
    }

    @Override
    @Transactional
    public void deactivateAccount(UUID accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account", accountId));

        if (account.getCurrentBalance().compareTo(BigDecimal.ZERO) != 0) {
            throw new BusinessRuleException("Cannot deactivate account with non-zero balance");
        }

        account.setActive(false);
        accountRepository.save(account);
        log.info("Deactivated account: {}", account.getAccountCode());
    }

    @Override
    @Transactional
    public void activateAccount(UUID accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account", accountId));

        account.setActive(true);
        accountRepository.save(account);
        log.info("Activated account: {}", account.getAccountCode());
    }

    // === Journal Entry Operations ===

    @Override
    @Transactional
    public AccountingDto.JournalEntryResponse createJournalEntry(AccountingDto.CreateJournalEntryRequest request) {
        JournalEntry entry = JournalEntry.create(
                request.transactionDate(),
                request.description(),
                request.entryType()
        );

        entry.setReference(request.reference());
        entry.setNotes(request.notes());

        for (AccountingDto.JournalEntryLineRequest lineRequest : request.lines()) {
            Account account = accountRepository.findById(lineRequest.accountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Account", lineRequest.accountId()));

            if (!account.isPostable()) {
                throw new BusinessRuleException("Account " + account.getAccountCode() + " is not postable");
            }

            JournalEntryLine line;
            if (lineRequest.debitAmount() != null && lineRequest.debitAmount().compareTo(BigDecimal.ZERO) > 0) {
                line = JournalEntryLine.debit(account, lineRequest.debitAmount(), lineRequest.description());
            } else if (lineRequest.creditAmount() != null && lineRequest.creditAmount().compareTo(BigDecimal.ZERO) > 0) {
                line = JournalEntryLine.credit(account, lineRequest.creditAmount(), lineRequest.description());
            } else {
                throw new BusinessRuleException("Each line must have either a debit or credit amount");
            }

            line.setCostCenter(lineRequest.costCenter());
            line.setDepartment(lineRequest.department());
            line.setProject(lineRequest.project());

            entry.addLine(line);
        }

        List<String> errors = entry.validate();
        if (!errors.isEmpty()) {
            throw new BusinessRuleException("Invalid journal entry: " + String.join(", ", errors));
        }

        entry = journalEntryRepository.save(entry);
        log.info("Created journal entry: {}", entry.getEntryNumber());

        return AccountingDto.JournalEntryResponse.fromEntity(entry);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<AccountingDto.JournalEntryResponse> getJournalEntry(UUID entryId) {
        return journalEntryRepository.findById(entryId)
                .filter(e -> !e.isDeleted())
                .map(AccountingDto.JournalEntryResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<AccountingDto.JournalEntryResponse> getJournalEntryByNumber(String entryNumber) {
        return journalEntryRepository.findByEntryNumber(entryNumber)
                .filter(e -> !e.isDeleted())
                .map(AccountingDto.JournalEntryResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AccountingDto.JournalEntryResponse> searchJournalEntries(
            LocalDate startDate,
            LocalDate endDate,
            JournalEntry.EntryStatus status,
            JournalEntry.EntryType type,
            String searchTerm,
            Pageable pageable) {
        return journalEntryRepository.search(startDate, endDate, status, type, searchTerm, pageable)
                .map(AccountingDto.JournalEntryResponse::fromEntity);
    }

    @Override
    @Transactional
    public AccountingDto.JournalEntryResponse postJournalEntry(UUID entryId, UUID postedBy) {
        JournalEntry entry = journalEntryRepository.findById(entryId)
                .orElseThrow(() -> new ResourceNotFoundException("JournalEntry", entryId));

        var transactionDate = entry.getTransactionDate();
        FiscalPeriod period = fiscalPeriodRepository.findByDate(transactionDate)
                .orElseThrow(() -> new BusinessRuleException("No fiscal period found for date: " +
                        transactionDate));

        if (!period.isPostingAllowed()) {
            throw new BusinessRuleException("Fiscal period is not open for posting");
        }

        entry.post(postedBy, period);

        // Save updated accounts (balances are updated in entity)
        for (JournalEntryLine line : entry.getLines()) {
            accountRepository.save(line.getAccount());
        }

        entry = journalEntryRepository.save(entry);
        log.info("Posted journal entry: {}", entry.getEntryNumber());

        return AccountingDto.JournalEntryResponse.fromEntity(entry);
    }

    @Override
    @Transactional
    public AccountingDto.JournalEntryResponse reverseJournalEntry(
            UUID entryId, LocalDate reversalDate, String reason, UUID reversedBy) {
        JournalEntry original = journalEntryRepository.findById(entryId)
                .orElseThrow(() -> new ResourceNotFoundException("JournalEntry", entryId));

        JournalEntry reversal = original.createReversal(reversalDate, reason);
        reversal = journalEntryRepository.save(reversal);

        // Post the reversal
        FiscalPeriod period = fiscalPeriodRepository.findByDate(reversalDate)
                .orElseThrow(() -> new BusinessRuleException("No fiscal period found for date: " + reversalDate));

        reversal.post(reversedBy, period);

        // Save updated accounts
        for (JournalEntryLine line : reversal.getLines()) {
            accountRepository.save(line.getAccount());
        }

        reversal = journalEntryRepository.save(reversal);

        // Mark original as reversed
        original.markAsReversed(reversal.getId(), reversedBy);
        journalEntryRepository.save(original);

        log.info("Reversed journal entry: {} with reversal: {}", original.getEntryNumber(), reversal.getEntryNumber());

        return AccountingDto.JournalEntryResponse.fromEntity(reversal);
    }

    @Override
    @Transactional
    public void deleteJournalEntry(UUID entryId) {
        JournalEntry entry = journalEntryRepository.findById(entryId)
                .orElseThrow(() -> new ResourceNotFoundException("JournalEntry", entryId));

        if (entry.getStatus() != JournalEntry.EntryStatus.DRAFT) {
            throw new BusinessRuleException("Only draft entries can be deleted");
        }

        entry.setDeleted(true);
        journalEntryRepository.save(entry);
        log.info("Deleted journal entry: {}", entry.getEntryNumber());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AccountingDto.JournalEntryResponse> getDraftEntries() {
        return journalEntryRepository.findDraftEntries().stream()
                .map(AccountingDto.JournalEntryResponse::fromEntity)
                .toList();
    }

    // === Fiscal Period Operations ===

    @Override
    @Transactional
    public List<AccountingDto.FiscalPeriodResponse> generateFiscalYear(int fiscalYear) {
        if (fiscalPeriodRepository.existsByFiscalYear(fiscalYear)) {
            throw new BusinessRuleException("Fiscal periods already exist for year: " + fiscalYear);
        }

        List<FiscalPeriod> periods = FiscalPeriod.generateFiscalYear(fiscalYear, 2); // February year-end
        periods = fiscalPeriodRepository.saveAll(periods);

        log.info("Generated fiscal periods for year: {}", fiscalYear);

        return periods.stream()
                .map(AccountingDto.FiscalPeriodResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AccountingDto.FiscalPeriodResponse> getFiscalPeriodsForYear(int fiscalYear) {
        return fiscalPeriodRepository.findByFiscalYear(fiscalYear).stream()
                .map(AccountingDto.FiscalPeriodResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<AccountingDto.FiscalPeriodResponse> getCurrentPeriod() {
        return fiscalPeriodRepository.findCurrentOpenPeriod()
                .map(AccountingDto.FiscalPeriodResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<AccountingDto.FiscalPeriodResponse> getPeriodForDate(LocalDate date) {
        return fiscalPeriodRepository.findByDate(date)
                .map(AccountingDto.FiscalPeriodResponse::fromEntity);
    }

    @Override
    @Transactional
    public AccountingDto.FiscalPeriodResponse openPeriod(UUID periodId) {
        FiscalPeriod period = fiscalPeriodRepository.findById(periodId)
                .orElseThrow(() -> new ResourceNotFoundException("FiscalPeriod", periodId));

        period.open();
        period = fiscalPeriodRepository.save(period);
        log.info("Opened fiscal period: {}", period.getPeriodName());

        return AccountingDto.FiscalPeriodResponse.fromEntity(period);
    }

    @Override
    @Transactional
    public AccountingDto.FiscalPeriodResponse closePeriod(UUID periodId, UUID closedBy) {
        FiscalPeriod period = fiscalPeriodRepository.findById(periodId)
                .orElseThrow(() -> new ResourceNotFoundException("FiscalPeriod", periodId));

        period.close(closedBy);
        period = fiscalPeriodRepository.save(period);
        log.info("Closed fiscal period: {}", period.getPeriodName());

        return AccountingDto.FiscalPeriodResponse.fromEntity(period);
    }

    @Override
    @Transactional
    public AccountingDto.FiscalPeriodResponse reopenPeriod(UUID periodId, UUID reopenedBy) {
        FiscalPeriod period = fiscalPeriodRepository.findById(periodId)
                .orElseThrow(() -> new ResourceNotFoundException("FiscalPeriod", periodId));

        period.reopen(reopenedBy);
        period = fiscalPeriodRepository.save(period);
        log.info("Reopened fiscal period: {}", period.getPeriodName());

        return AccountingDto.FiscalPeriodResponse.fromEntity(period);
    }

    @Override
    @Transactional
    public AccountingDto.FiscalPeriodResponse lockPeriod(UUID periodId) {
        FiscalPeriod period = fiscalPeriodRepository.findById(periodId)
                .orElseThrow(() -> new ResourceNotFoundException("FiscalPeriod", periodId));

        period.lock();
        period = fiscalPeriodRepository.save(period);
        log.info("Locked fiscal period: {}", period.getPeriodName());

        return AccountingDto.FiscalPeriodResponse.fromEntity(period);
    }

    // === Financial Reports ===

    @Override
    @Transactional(readOnly = true)
    public AccountingDto.TrialBalanceReport generateTrialBalance(LocalDate asOfDate) {
        List<Account> accounts = accountRepository.findAccountsWithBalance();

        List<AccountingDto.TrialBalanceEntry> entries = accounts.stream()
                .map(a -> new AccountingDto.TrialBalanceEntry(
                        a.getAccountCode(),
                        a.getAccountName(),
                        a.getAccountType(),
                        a.getNormalBalance() == Account.NormalBalance.DEBIT ?
                                a.getCurrentBalance() : BigDecimal.ZERO,
                        a.getNormalBalance() == Account.NormalBalance.CREDIT ?
                                a.getCurrentBalance() : BigDecimal.ZERO
                ))
                .toList();

        BigDecimal totalDebit = entries.stream()
                .map(AccountingDto.TrialBalanceEntry::debit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCredit = entries.stream()
                .map(AccountingDto.TrialBalanceEntry::credit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new AccountingDto.TrialBalanceReport(
                asOfDate,
                entries,
                totalDebit,
                totalCredit,
                totalDebit.compareTo(totalCredit) == 0
        );
    }

    @Override
    @Transactional(readOnly = true)
    public AccountingDto.BalanceSheetReport generateBalanceSheet(LocalDate asOfDate) {
        List<Account> balanceSheetAccounts = accountRepository.findBalanceSheetAccounts();

        Map<Account.AccountType, List<Account>> accountsByType = balanceSheetAccounts.stream()
                .collect(Collectors.groupingBy(Account::getAccountType));

        // Assets
        List<Account> assets = accountsByType.getOrDefault(Account.AccountType.ASSET, List.of());
        List<AccountingDto.AccountBalance> currentAssets = assets.stream()
                .filter(a -> isCurrentAsset(a))
                .map(a -> new AccountingDto.AccountBalance(a.getAccountCode(), a.getAccountName(), a.getCurrentBalance()))
                .toList();
        List<AccountingDto.AccountBalance> nonCurrentAssets = assets.stream()
                .filter(a -> !isCurrentAsset(a))
                .map(a -> new AccountingDto.AccountBalance(a.getAccountCode(), a.getAccountName(), a.getCurrentBalance()))
                .toList();

        // Liabilities
        List<Account> liabilities = accountsByType.getOrDefault(Account.AccountType.LIABILITY, List.of());
        List<AccountingDto.AccountBalance> currentLiabilities = liabilities.stream()
                .filter(a -> isCurrentLiability(a))
                .map(a -> new AccountingDto.AccountBalance(a.getAccountCode(), a.getAccountName(), a.getCurrentBalance()))
                .toList();
        List<AccountingDto.AccountBalance> nonCurrentLiabilities = liabilities.stream()
                .filter(a -> !isCurrentLiability(a))
                .map(a -> new AccountingDto.AccountBalance(a.getAccountCode(), a.getAccountName(), a.getCurrentBalance()))
                .toList();

        // Equity
        List<Account> equity = accountsByType.getOrDefault(Account.AccountType.EQUITY, List.of());
        List<AccountingDto.AccountBalance> equityBalances = equity.stream()
                .map(a -> new AccountingDto.AccountBalance(a.getAccountCode(), a.getAccountName(), a.getCurrentBalance()))
                .toList();

        BigDecimal totalCurrentAssets = sumBalances(currentAssets);
        BigDecimal totalNonCurrentAssets = sumBalances(nonCurrentAssets);
        BigDecimal totalAssets = totalCurrentAssets.add(totalNonCurrentAssets);

        BigDecimal totalCurrentLiabilities = sumBalances(currentLiabilities);
        BigDecimal totalNonCurrentLiabilities = sumBalances(nonCurrentLiabilities);
        BigDecimal totalLiabilities = totalCurrentLiabilities.add(totalNonCurrentLiabilities);

        BigDecimal totalEquity = sumBalances(equityBalances);

        return new AccountingDto.BalanceSheetReport(
                asOfDate,
                new AccountingDto.BalanceSheetSection("Current Assets", currentAssets, totalCurrentAssets),
                new AccountingDto.BalanceSheetSection("Non-Current Assets", nonCurrentAssets, totalNonCurrentAssets),
                totalAssets,
                new AccountingDto.BalanceSheetSection("Current Liabilities", currentLiabilities, totalCurrentLiabilities),
                new AccountingDto.BalanceSheetSection("Non-Current Liabilities", nonCurrentLiabilities, totalNonCurrentLiabilities),
                totalLiabilities,
                new AccountingDto.BalanceSheetSection("Equity", equityBalances, totalEquity),
                totalEquity,
                totalLiabilities.add(totalEquity)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public AccountingDto.IncomeStatementReport generateIncomeStatement(LocalDate startDate, LocalDate endDate) {
        List<Account> incomeStatementAccounts = accountRepository.findIncomeStatementAccounts();

        Map<Account.AccountType, List<Account>> accountsByType = incomeStatementAccounts.stream()
                .collect(Collectors.groupingBy(Account::getAccountType));

        List<Account> revenueAccounts = accountsByType.getOrDefault(Account.AccountType.REVENUE, List.of());
        List<Account> expenseAccounts = accountsByType.getOrDefault(Account.AccountType.EXPENSE, List.of());

        List<AccountingDto.AccountBalance> revenue = revenueAccounts.stream()
                .filter(a -> a.getAccountSubtype() != Account.AccountSubtype.OTHER_INCOME)
                .map(a -> new AccountingDto.AccountBalance(a.getAccountCode(), a.getAccountName(), a.getCurrentBalance()))
                .toList();

        List<AccountingDto.AccountBalance> costOfSales = expenseAccounts.stream()
                .filter(a -> a.getAccountSubtype() == Account.AccountSubtype.COST_OF_SALES)
                .map(a -> new AccountingDto.AccountBalance(a.getAccountCode(), a.getAccountName(), a.getCurrentBalance()))
                .toList();

        List<AccountingDto.AccountBalance> operatingExpenses = expenseAccounts.stream()
                .filter(a -> a.getAccountSubtype() != Account.AccountSubtype.COST_OF_SALES &&
                        a.getAccountSubtype() != Account.AccountSubtype.TAX_EXPENSE)
                .map(a -> new AccountingDto.AccountBalance(a.getAccountCode(), a.getAccountName(), a.getCurrentBalance()))
                .toList();

        List<AccountingDto.AccountBalance> otherIncome = revenueAccounts.stream()
                .filter(a -> a.getAccountSubtype() == Account.AccountSubtype.OTHER_INCOME)
                .map(a -> new AccountingDto.AccountBalance(a.getAccountCode(), a.getAccountName(), a.getCurrentBalance()))
                .toList();

        BigDecimal totalRevenue = sumBalances(revenue);
        BigDecimal totalCostOfSales = sumBalances(costOfSales);
        BigDecimal grossProfit = totalRevenue.subtract(totalCostOfSales);
        BigDecimal totalOperatingExpenses = sumBalances(operatingExpenses);
        BigDecimal operatingIncome = grossProfit.subtract(totalOperatingExpenses);
        BigDecimal otherNet = sumBalances(otherIncome);
        BigDecimal netIncomeBeforeTax = operatingIncome.add(otherNet);

        BigDecimal taxExpense = expenseAccounts.stream()
                .filter(a -> a.getAccountSubtype() == Account.AccountSubtype.TAX_EXPENSE)
                .map(Account::getCurrentBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netIncome = netIncomeBeforeTax.subtract(taxExpense);

        return new AccountingDto.IncomeStatementReport(
                startDate,
                endDate,
                revenue,
                totalRevenue,
                costOfSales,
                totalCostOfSales,
                grossProfit,
                operatingExpenses,
                totalOperatingExpenses,
                operatingIncome,
                otherIncome,
                netIncomeBeforeTax,
                taxExpense,
                netIncome
        );
    }

    @Override
    @Transactional(readOnly = true)
    public AccountingDto.GeneralLedgerReport generateGeneralLedger(
            UUID accountId, LocalDate startDate, LocalDate endDate) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account", accountId));

        // This would need a more complex query to get all journal entry lines for the account
        // For now, returning a simplified structure
        return new AccountingDto.GeneralLedgerReport(
                account.getAccountCode(),
                account.getAccountName(),
                startDate,
                endDate,
                account.getOpeningBalance(),
                List.of(), // Would populate with actual entries
                account.getCurrentBalance()
        );
    }

    @Override
    @Transactional
    public void performYearEndClose(int fiscalYear, UUID performedBy) {
        // This would implement the year-end closing process:
        // 1. Close all income/expense accounts to retained earnings
        // 2. Create opening balances for new year
        log.info("Performing year-end close for fiscal year: {}", fiscalYear);

        // Implementation would be more complex in production
        throw new UnsupportedOperationException("Year-end close not yet implemented");
    }

    // === Helper Methods ===

    private boolean isCurrentAsset(Account account) {
        return account.getAccountSubtype() != null &&
                (account.getAccountSubtype() == Account.AccountSubtype.CASH ||
                        account.getAccountSubtype() == Account.AccountSubtype.BANK ||
                        account.getAccountSubtype() == Account.AccountSubtype.ACCOUNTS_RECEIVABLE ||
                        account.getAccountSubtype() == Account.AccountSubtype.INVENTORY ||
                        account.getAccountSubtype() == Account.AccountSubtype.PREPAID_EXPENSE ||
                        account.getAccountSubtype() == Account.AccountSubtype.OTHER_CURRENT_ASSET);
    }

    private boolean isCurrentLiability(Account account) {
        return account.getAccountSubtype() != null &&
                (account.getAccountSubtype() == Account.AccountSubtype.ACCOUNTS_PAYABLE ||
                        account.getAccountSubtype() == Account.AccountSubtype.VAT_PAYABLE ||
                        account.getAccountSubtype() == Account.AccountSubtype.PAYE_PAYABLE ||
                        account.getAccountSubtype() == Account.AccountSubtype.UIF_PAYABLE ||
                        account.getAccountSubtype() == Account.AccountSubtype.ACCRUED_EXPENSE ||
                        account.getAccountSubtype() == Account.AccountSubtype.OTHER_CURRENT_LIABILITY);
    }

    private BigDecimal sumBalances(List<AccountingDto.AccountBalance> balances) {
        return balances.stream()
                .map(AccountingDto.AccountBalance::balance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
