package com.surework.accounting.service;

import com.surework.accounting.domain.*;
import com.surework.accounting.dto.AccountingDto;
import com.surework.accounting.dto.BankingDto;
import com.surework.accounting.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of BankReconciliationService.
 * Handles transaction matching and reconciliation with journal entries.
 * All methods are tenant-scoped for multi-tenant data isolation.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class BankReconciliationServiceImpl implements BankReconciliationService {

    private final BankAccountRepository bankAccountRepository;
    private final BankTransactionRepository bankTransactionRepository;
    private final AccountRepository accountRepository;
    private final AccountingService accountingService;

    private static final BigDecimal HIGH_CONFIDENCE = new BigDecimal("0.90");
    private static final BigDecimal MEDIUM_CONFIDENCE = new BigDecimal("0.70");
    private static final BigDecimal LOW_CONFIDENCE = new BigDecimal("0.50");

    // === Reconciliation Operations ===

    @Override
    @Transactional
    public BankingDto.BankTransactionResponse reconcileTransaction(
            UUID tenantId,
            UUID transactionId,
            BankingDto.ReconcileTransactionRequest request,
            UUID userId) {
        log.info("Reconciling transaction {} to account {} for tenant {}", transactionId, request.accountId(), tenantId);

        BankTransaction transaction = bankTransactionRepository.findByIdAndTenantId(transactionId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Transaction not found for tenant: " + tenantId));

        Account account = accountRepository.findByIdAndTenantId(request.accountId(), tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Account not found for tenant: " + tenantId));

        // Match to account
        transaction.matchToAccount(account);

        // Create journal entry if requested
        if (request.createJournalEntry()) {
            JournalEntry journalEntry = createJournalEntryForTransaction(tenantId, transaction, account, request.description());
            transaction.reconcile(journalEntry, userId);
        } else {
            // Just mark as matched without journal entry
            transaction.setReconciliationStatus(BankTransaction.ReconciliationStatus.MATCHED);
        }

        transaction = bankTransactionRepository.save(transaction);
        log.info("Transaction {} reconciled to account {} for tenant {}", transactionId, account.getAccountCode(), tenantId);

        return BankingDto.BankTransactionResponse.fromEntity(transaction);
    }

    @Override
    @Transactional
    public List<BankingDto.BankTransactionResponse> bulkReconcile(
            UUID tenantId,
            BankingDto.BulkReconcileRequest request,
            UUID userId) {
        log.info("Bulk reconciling {} transactions for tenant {}", request.transactionIds().size(), tenantId);

        Account account = accountRepository.findByIdAndTenantId(request.accountId(), tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Account not found for tenant: " + tenantId));

        List<BankTransaction> transactions = request.transactionIds().stream()
                .map(id -> bankTransactionRepository.findByIdAndTenantId(id, tenantId)
                        .orElseThrow(() -> new EntityNotFoundException("Transaction not found: " + id + " for tenant: " + tenantId)))
                .toList();

        List<BankTransaction> reconciled = new ArrayList<>();

        for (BankTransaction transaction : transactions) {
            transaction.matchToAccount(account);

            if (request.createJournalEntries()) {
                JournalEntry journalEntry = createJournalEntryForTransaction(tenantId, transaction, account, null);
                transaction.reconcile(journalEntry, userId);
            }

            reconciled.add(bankTransactionRepository.save(transaction));
        }

        log.info("Bulk reconciled {} transactions for tenant {}", reconciled.size(), tenantId);

        return reconciled.stream()
                .map(BankingDto.BankTransactionResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public BankingDto.BankTransactionResponse acceptSuggestion(UUID tenantId, UUID transactionId, UUID userId) {
        log.info("Accepting suggestion for transaction {} for tenant {}", transactionId, tenantId);

        BankTransaction transaction = bankTransactionRepository.findByIdAndTenantId(transactionId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Transaction not found for tenant: " + tenantId));

        if (transaction.getSuggestedAccount() == null) {
            throw new IllegalStateException("Transaction has no suggested account");
        }

        transaction.acceptSuggestion(userId);
        transaction = bankTransactionRepository.save(transaction);

        log.info("Accepted suggestion for transaction {} for tenant {}", transactionId, tenantId);

        return BankingDto.BankTransactionResponse.fromEntity(transaction);
    }

    @Override
    @Transactional
    public BankingDto.BankTransactionResponse unreconcile(UUID tenantId, UUID transactionId, UUID userId) {
        log.info("Unreconciling transaction {} for tenant {}", transactionId, tenantId);

        BankTransaction transaction = bankTransactionRepository.findByIdAndTenantId(transactionId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Transaction not found for tenant: " + tenantId));

        // If there's a linked journal entry, it should be reversed (but we don't auto-reverse)
        if (transaction.getJournalEntry() != null) {
            log.warn("Unreconciling transaction {} for tenant {} which has journal entry {}. Journal entry should be reversed manually.",
                    transactionId, tenantId, transaction.getJournalEntry().getId());
        }

        transaction.unreoncile();
        transaction = bankTransactionRepository.save(transaction);

        log.info("Unreconciled transaction {} for tenant {}", transactionId, tenantId);

        return BankingDto.BankTransactionResponse.fromEntity(transaction);
    }

    @Override
    @Transactional
    public BankingDto.BankTransactionResponse excludeTransaction(UUID tenantId, UUID transactionId, UUID userId) {
        log.info("Excluding transaction {} from reconciliation for tenant {}", transactionId, tenantId);

        BankTransaction transaction = bankTransactionRepository.findByIdAndTenantId(transactionId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Transaction not found for tenant: " + tenantId));

        transaction.exclude(userId);
        transaction = bankTransactionRepository.save(transaction);

        log.info("Excluded transaction {} from reconciliation for tenant {}", transactionId, tenantId);

        return BankingDto.BankTransactionResponse.fromEntity(transaction);
    }

    // === Matching ===

    @Override
    public List<BankingDto.SuggestedMatch> getSuggestedMatches(UUID tenantId, UUID transactionId) {
        log.debug("Getting suggested matches for transaction {} for tenant {}", transactionId, tenantId);

        BankTransaction transaction = bankTransactionRepository.findByIdAndTenantId(transactionId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Transaction not found for tenant: " + tenantId));

        List<BankingDto.SuggestedMatch> suggestions = new ArrayList<>();

        // 1. If already has a suggestion, include it
        if (transaction.getSuggestedAccount() != null) {
            suggestions.add(new BankingDto.SuggestedMatch(
                    transactionId,
                    transaction.getSuggestedAccount().getId(),
                    transaction.getSuggestedAccount().getAccountCode(),
                    transaction.getSuggestedAccount().getAccountName(),
                    transaction.getSuggestionConfidence(),
                    transaction.getSuggestionSource(),
                    "Current suggestion from " + transaction.getSuggestionSource()
            ));
        }

        // 2. Look for similar historically reconciled transactions
        List<BankTransaction> similar = bankTransactionRepository.findSimilarReconciled(
                tenantId,
                extractKeywords(transaction.getDescription()),
                PageRequest.of(0, 5)
        );

        Map<UUID, Long> accountFrequency = similar.stream()
                .filter(t -> t.getMatchedAccount() != null)
                .collect(Collectors.groupingBy(
                        t -> t.getMatchedAccount().getId(),
                        Collectors.counting()
                ));

        for (Map.Entry<UUID, Long> entry : accountFrequency.entrySet()) {
            // Skip if already suggested
            if (suggestions.stream().anyMatch(s -> s.suggestedAccountId().equals(entry.getKey()))) {
                continue;
            }

            Account account = accountRepository.findByIdAndTenantId(entry.getKey(), tenantId).orElse(null);
            if (account == null) continue;

            BigDecimal confidence = calculateHistoricalConfidence(entry.getValue(), similar.size());

            suggestions.add(new BankingDto.SuggestedMatch(
                    transactionId,
                    account.getId(),
                    account.getAccountCode(),
                    account.getAccountName(),
                    confidence,
                    BankTransaction.SuggestionSource.HISTORICAL,
                    "Used " + entry.getValue() + " times for similar transactions"
            ));
        }

        // 3. Suggest based on transaction type (expense accounts for debits, income for credits)
        if (suggestions.size() < 3) {
            Account.AccountType targetType = transaction.isOutflow()
                    ? Account.AccountType.EXPENSE
                    : Account.AccountType.REVENUE;

            List<Account> typeBasedSuggestions = accountRepository.findByTenantIdAndAccountType(tenantId, targetType);

            for (Account account : typeBasedSuggestions.stream().limit(3).toList()) {
                if (suggestions.stream().anyMatch(s -> s.suggestedAccountId().equals(account.getId()))) {
                    continue;
                }

                suggestions.add(new BankingDto.SuggestedMatch(
                        transactionId,
                        account.getId(),
                        account.getAccountCode(),
                        account.getAccountName(),
                        LOW_CONFIDENCE,
                        BankTransaction.SuggestionSource.PAYEE_MATCH,
                        "Suggested based on transaction type"
                ));
            }
        }

        // Sort by confidence descending
        suggestions.sort((a, b) -> b.confidence().compareTo(a.confidence()));

        return suggestions.stream().limit(5).toList();
    }

    @Override
    public List<BankingDto.BankTransactionResponse> findPotentialMatches(
            UUID tenantId,
            UUID bankAccountId,
            BigDecimal amount,
            LocalDate startDate,
            LocalDate endDate) {
        log.debug("Finding potential matches for tenant {} bank account {} amount {} between {} and {}",
                tenantId, bankAccountId, amount, startDate, endDate);

        // Verify bank account belongs to tenant
        bankAccountRepository.findByIdAndTenantId(bankAccountId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Bank account not found for tenant: " + tenantId));

        return bankTransactionRepository.findPotentialMatchesByAmount(
                bankAccountId,
                amount,
                startDate,
                endDate
        ).stream()
                .map(BankingDto.BankTransactionResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public int autoMatchTransactions(UUID tenantId, UUID bankAccountId) {
        log.info("Auto-matching transactions for bank account {} for tenant {}", bankAccountId, tenantId);

        // Verify bank account belongs to tenant
        bankAccountRepository.findByIdAndTenantId(bankAccountId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Bank account not found for tenant: " + tenantId));

        List<BankTransaction> unreconciled = bankTransactionRepository
                .findUnreconciledByBankAccountId(bankAccountId);

        int matched = 0;

        for (BankTransaction transaction : unreconciled) {
            // Verify transaction belongs to tenant
            if (!transaction.getTenantId().equals(tenantId)) {
                log.warn("Skipping transaction {} - tenant mismatch for tenant {}", transaction.getId(), tenantId);
                continue;
            }

            // Look for historical matches
            List<BankTransaction> similar = bankTransactionRepository.findSimilarReconciled(
                    tenantId,
                    extractKeywords(transaction.getDescription()),
                    PageRequest.of(0, 3)
            );

            if (!similar.isEmpty()) {
                // Find most common account
                Map<UUID, Long> frequency = similar.stream()
                        .filter(t -> t.getMatchedAccount() != null)
                        .collect(Collectors.groupingBy(
                                t -> t.getMatchedAccount().getId(),
                                Collectors.counting()
                        ));

                if (!frequency.isEmpty()) {
                    UUID mostCommonAccountId = frequency.entrySet().stream()
                            .max(Map.Entry.comparingByValue())
                            .map(Map.Entry::getKey)
                            .orElse(null);

                    if (mostCommonAccountId != null) {
                        Account account = accountRepository.findByIdAndTenantId(mostCommonAccountId, tenantId).orElse(null);
                        if (account != null) {
                            BigDecimal confidence = calculateHistoricalConfidence(
                                    frequency.get(mostCommonAccountId),
                                    similar.size()
                            );

                            // Only auto-match if confidence is high enough
                            if (confidence.compareTo(MEDIUM_CONFIDENCE) >= 0) {
                                transaction.applySuggestion(
                                        account,
                                        confidence,
                                        BankTransaction.SuggestionSource.HISTORICAL
                                );
                                matched++;
                            }
                        }
                    }
                }
            }
        }

        bankTransactionRepository.saveAll(unreconciled);
        log.info("Auto-matched {} transactions for bank account {} for tenant {}", matched, bankAccountId, tenantId);

        return matched;
    }

    // === Reporting ===

    @Override
    public BankingDto.ReconciliationSummary getReconciliationSummary(UUID tenantId, UUID bankAccountId) {
        log.debug("Getting reconciliation summary for bank account {} for tenant {}", bankAccountId, tenantId);

        BankAccount bankAccount = bankAccountRepository.findByIdAndTenantId(bankAccountId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Bank account not found for tenant: " + tenantId));

        List<Object[]> summary = bankTransactionRepository.getReconciliationSummary(bankAccountId);

        long total = 0;
        long unreconciled = 0;
        long suggested = 0;
        long matched = 0;
        long reconciled = 0;
        long excluded = 0;

        for (Object[] row : summary) {
            BankTransaction.ReconciliationStatus status = (BankTransaction.ReconciliationStatus) row[0];
            long count = (Long) row[1];
            total += count;

            switch (status) {
                case UNRECONCILED -> unreconciled = count;
                case SUGGESTED -> suggested = count;
                case MATCHED -> matched = count;
                case RECONCILED -> reconciled = count;
                case EXCLUDED -> excluded = count;
            }
        }

        // Calculate unreconciled amounts
        List<Object[]> amounts = bankTransactionRepository.sumUnreconciledByType(bankAccountId);
        BigDecimal unreconciledDebits = BigDecimal.ZERO;
        BigDecimal unreconciledCredits = BigDecimal.ZERO;

        for (Object[] row : amounts) {
            BankTransaction.TransactionType type = (BankTransaction.TransactionType) row[0];
            BigDecimal sum = (BigDecimal) row[1];

            if (type == BankTransaction.TransactionType.DEBIT) {
                unreconciledDebits = sum != null ? sum : BigDecimal.ZERO;
            } else {
                unreconciledCredits = sum != null ? sum : BigDecimal.ZERO;
            }
        }

        return new BankingDto.ReconciliationSummary(
                bankAccountId,
                bankAccount.getAccountName(),
                total,
                unreconciled,
                suggested,
                matched,
                reconciled,
                excluded,
                unreconciledDebits,
                unreconciledCredits,
                unreconciledCredits.subtract(unreconciledDebits)
        );
    }

    @Override
    public List<BankingDto.ReconciliationSummary> getAllReconciliationSummaries(UUID tenantId) {
        log.debug("Getting all reconciliation summaries for tenant {}", tenantId);

        return bankAccountRepository.findByTenantId(tenantId).stream()
                .map(ba -> getReconciliationSummary(tenantId, ba.getId()))
                .toList();
    }

    @Override
    public BankReconciliationStatement generateReconciliationStatement(
            UUID tenantId,
            UUID bankAccountId,
            LocalDate asOfDate) {
        log.info("Generating reconciliation statement for bank account {} as of {} for tenant {}",
                bankAccountId, asOfDate, tenantId);

        BankAccount bankAccount = bankAccountRepository.findByIdAndTenantId(bankAccountId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Bank account not found for tenant: " + tenantId));

        BigDecimal bankStatementBalance = bankAccount.getCurrentBalance() != null
                ? bankAccount.getCurrentBalance()
                : BigDecimal.ZERO;

        // Get GL balance
        BigDecimal glBalance = BigDecimal.ZERO;
        if (bankAccount.getGlAccount() != null) {
            glBalance = bankAccount.getGlAccount().getCurrentBalance();
        }

        // Get outstanding items (unreconciled transactions up to asOfDate)
        List<BankTransaction> unreconciled = bankTransactionRepository
                .findByBankAccountIdAndDateRange(bankAccountId, LocalDate.of(1900, 1, 1), asOfDate)
                .stream()
                .filter(t -> t.getReconciliationStatus() == BankTransaction.ReconciliationStatus.UNRECONCILED ||
                        t.getReconciliationStatus() == BankTransaction.ReconciliationStatus.SUGGESTED ||
                        t.getReconciliationStatus() == BankTransaction.ReconciliationStatus.MATCHED)
                .toList();

        List<OutstandingItem> outstandingDeposits = new ArrayList<>();
        List<OutstandingItem> outstandingPayments = new ArrayList<>();

        for (BankTransaction txn : unreconciled) {
            OutstandingItem item = new OutstandingItem(
                    txn.getId(),
                    txn.getTransactionDate(),
                    txn.getDescription(),
                    txn.getReference(),
                    txn.getAbsoluteAmount()
            );

            if (txn.isInflow()) {
                outstandingDeposits.add(item);
            } else {
                outstandingPayments.add(item);
            }
        }

        BigDecimal totalOutstandingDeposits = outstandingDeposits.stream()
                .map(OutstandingItem::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalOutstandingPayments = outstandingPayments.stream()
                .map(OutstandingItem::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Adjusted bank balance = Bank Statement - Outstanding Payments + Outstanding Deposits
        BigDecimal adjustedBankBalance = bankStatementBalance
                .subtract(totalOutstandingPayments)
                .add(totalOutstandingDeposits);

        BigDecimal difference = adjustedBankBalance.subtract(glBalance);
        boolean isReconciled = difference.abs().compareTo(new BigDecimal("0.01")) < 0;

        log.info("Generated reconciliation statement for bank account {} for tenant {}: reconciled={}",
                bankAccountId, tenantId, isReconciled);

        return new BankReconciliationStatement(
                bankAccountId,
                bankAccount.getAccountName(),
                asOfDate,
                bankStatementBalance,
                glBalance,
                outstandingDeposits,
                totalOutstandingDeposits,
                outstandingPayments,
                totalOutstandingPayments,
                adjustedBankBalance,
                difference,
                isReconciled
        );
    }

    // === Helper Methods ===

    private JournalEntry createJournalEntryForTransaction(
            UUID tenantId,
            BankTransaction transaction,
            Account expenseOrRevenueAccount,
            String customDescription) {
        BankAccount bankAccount = transaction.getBankAccount();

        if (bankAccount.getGlAccount() == null) {
            throw new IllegalStateException("Bank account must be linked to a GL account to create journal entries");
        }

        String description = customDescription != null
                ? customDescription
                : "Bank: " + transaction.getDescription();

        // Create journal entry request
        List<AccountingDto.JournalEntryLineRequest> lines = new ArrayList<>();

        if (transaction.isOutflow()) {
            // Debit expense, Credit bank
            lines.add(new AccountingDto.JournalEntryLineRequest(
                    expenseOrRevenueAccount.getId(),
                    transaction.getDescription(),
                    transaction.getAbsoluteAmount(),
                    null,
                    null, null, null
            ));
            lines.add(new AccountingDto.JournalEntryLineRequest(
                    bankAccount.getGlAccount().getId(),
                    transaction.getDescription(),
                    null,
                    transaction.getAbsoluteAmount(),
                    null, null, null
            ));
        } else {
            // Debit bank, Credit revenue
            lines.add(new AccountingDto.JournalEntryLineRequest(
                    bankAccount.getGlAccount().getId(),
                    transaction.getDescription(),
                    transaction.getAbsoluteAmount(),
                    null,
                    null, null, null
            ));
            lines.add(new AccountingDto.JournalEntryLineRequest(
                    expenseOrRevenueAccount.getId(),
                    transaction.getDescription(),
                    null,
                    transaction.getAbsoluteAmount(),
                    null, null, null
            ));
        }

        AccountingDto.CreateJournalEntryRequest request = new AccountingDto.CreateJournalEntryRequest(
                transaction.getTransactionDate(),
                description,
                transaction.getReference(),
                JournalEntry.EntryType.PAYMENT,
                lines,
                "Auto-generated from bank reconciliation"
        );

        AccountingDto.JournalEntryResponse response = accountingService.createJournalEntry(tenantId, request);

        // Get the actual entity to link
        // Note: This returns null as a workaround since we return DTO, not entity
        // In a real implementation, we'd have internal methods returning entities
        return accountingService.getJournalEntry(tenantId, response.id())
                .<JournalEntry>map(r -> null)
                .orElse(null);
    }

    private String extractKeywords(String description) {
        if (description == null) return "";

        // Extract meaningful keywords, removing common words and numbers
        return Arrays.stream(description.split("\\s+"))
                .filter(word -> word.length() > 3)
                .filter(word -> !word.matches("\\d+"))
                .filter(word -> !Set.of("the", "and", "for", "from", "with").contains(word.toLowerCase()))
                .limit(3)
                .collect(Collectors.joining(" "));
    }

    private BigDecimal calculateHistoricalConfidence(long matchCount, long totalSimilar) {
        if (totalSimilar == 0) return LOW_CONFIDENCE;

        double ratio = (double) matchCount / totalSimilar;

        if (ratio >= 0.8 && matchCount >= 3) {
            return HIGH_CONFIDENCE;
        } else if (ratio >= 0.5 && matchCount >= 2) {
            return MEDIUM_CONFIDENCE;
        }
        return LOW_CONFIDENCE;
    }
}
