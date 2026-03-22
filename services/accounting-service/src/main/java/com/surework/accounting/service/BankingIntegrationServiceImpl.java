package com.surework.accounting.service;

import com.surework.accounting.domain.Account;
import com.surework.accounting.domain.BankAccount;
import com.surework.accounting.domain.BankRule;
import com.surework.accounting.domain.BankTransaction;
import com.surework.accounting.dto.BankingDto;
import com.surework.accounting.dto.BankingDto.ReconciliationStatusFilter;
import com.surework.accounting.dto.BankingDto.TransactionTypeFilter;
import com.surework.accounting.repository.AccountRepository;
import com.surework.accounting.repository.BankAccountRepository;
import com.surework.accounting.repository.BankRuleRepository;
import com.surework.accounting.repository.BankTransactionRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

/**
 * Implementation of BankingIntegrationService.
 * Handles Open Banking connectivity via Stitch API.
 * All methods are tenant-scoped for multi-tenant data isolation.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class BankingIntegrationServiceImpl implements BankingIntegrationService {

    private final BankAccountRepository bankAccountRepository;
    private final BankTransactionRepository bankTransactionRepository;
    private final BankRuleRepository bankRuleRepository;
    private final AccountRepository accountRepository;

    // Stitch API configuration would be injected via @Value
    // private final StitchApiClient stitchClient;

    private static final String STITCH_AUTH_URL = "https://secure.stitch.money/connect/authorize";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final List<BankingDto.InstitutionInfo> SA_INSTITUTIONS = List.of(
            new BankingDto.InstitutionInfo("fnb", "First National Bank", "https://logo.clearbit.com/fnb.co.za", "ZA", true, false),
            new BankingDto.InstitutionInfo("standard_bank", "Standard Bank", "https://logo.clearbit.com/standardbank.co.za", "ZA", true, false),
            new BankingDto.InstitutionInfo("absa", "Absa Bank", "https://logo.clearbit.com/absa.co.za", "ZA", true, false),
            new BankingDto.InstitutionInfo("nedbank", "Nedbank", "https://logo.clearbit.com/nedbank.co.za", "ZA", true, false),
            new BankingDto.InstitutionInfo("capitec", "Capitec Bank", "https://logo.clearbit.com/capitecbank.co.za", "ZA", true, false),
            new BankingDto.InstitutionInfo("investec", "Investec", "https://logo.clearbit.com/investec.co.za", "ZA", true, false),
            new BankingDto.InstitutionInfo("discovery", "Discovery Bank", "https://logo.clearbit.com/discovery.co.za", "ZA", true, false),
            new BankingDto.InstitutionInfo("tymebank", "TymeBank", "https://logo.clearbit.com/tymebank.co.za", "ZA", true, false)
    );

    // === Bank Account Operations ===

    @Override
    public List<BankingDto.BankAccountResponse> getBankAccounts(UUID tenantId) {
        log.debug("Fetching bank accounts for tenantId={}", tenantId);
        return bankAccountRepository.findByTenantId(tenantId).stream()
                .filter(ba -> !ba.isDeleted())
                .map(this::toBankAccountResponse)
                .toList();
    }

    @Override
    public Optional<BankingDto.BankAccountResponse> getBankAccount(UUID tenantId, UUID bankAccountId) {
        log.debug("Fetching bank account id={} for tenantId={}", bankAccountId, tenantId);
        return bankAccountRepository.findByIdAndTenantId(bankAccountId, tenantId)
                .filter(ba -> !ba.isDeleted())
                .map(this::toBankAccountResponse);
    }

    @Override
    @Transactional
    public BankingDto.BankAccountResponse connectBankAccount(
            UUID tenantId,
            BankingDto.ConnectBankRequest request,
            UUID userId) {
        log.info("Connecting bank account: {} from {} for tenantId={}",
                request.accountName(), request.institutionName(), tenantId);

        // Check if already connected for this tenant
        if (bankAccountRepository.existsByTenantIdAndStitchAccountId(tenantId, request.stitchAccountId())) {
            throw new IllegalStateException("Bank account already connected for this tenant");
        }

        BankAccount bankAccount = new BankAccount();
        bankAccount.setStitchAccountId(request.stitchAccountId());
        bankAccount.setAccountName(request.accountName());
        bankAccount.setAccountNumber(request.accountNumber());
        bankAccount.setAccountNumberMasked(maskAccountNumber(request.accountNumber()));
        bankAccount.setInstitutionId(request.institutionId());
        bankAccount.setInstitutionName(request.institutionName());
        bankAccount.setInstitutionLogo(request.institutionLogo());
        bankAccount.setCurrency(request.currency() != null ? request.currency() : "ZAR");
        bankAccount.setAccountType(request.accountType());
        bankAccount.setStitchUserId(request.stitchUserId());
        bankAccount.setStitchConsentId(request.stitchConsentId());
        bankAccount.setTenantId(tenantId);
        bankAccount.setCreatedBy(userId);
        bankAccount.setStatus(BankAccount.ConnectionStatus.ACTIVE);

        // Link to GL account if provided (must belong to same tenant)
        if (request.glAccountId() != null) {
            Account glAccount = accountRepository.findByIdAndTenantId(request.glAccountId(), tenantId)
                    .orElseThrow(() -> new EntityNotFoundException("GL Account not found for tenant"));
            bankAccount.setGlAccount(glAccount);
        }

        bankAccount = bankAccountRepository.save(bankAccount);
        log.info("Bank account connected successfully: id={} for tenantId={}", bankAccount.getId(), tenantId);

        return toBankAccountResponse(bankAccount);
    }

    @Override
    @Transactional
    public BankingDto.BankAccountResponse updateBankAccount(
            UUID tenantId,
            UUID bankAccountId,
            BankingDto.UpdateBankAccountRequest request) {
        log.debug("Updating bank account id={} for tenantId={}", bankAccountId, tenantId);

        BankAccount bankAccount = bankAccountRepository.findByIdAndTenantId(bankAccountId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Bank account not found for tenant"));

        if (request.accountName() != null) {
            bankAccount.setAccountName(request.accountName());
        }

        if (request.glAccountId() != null) {
            Account glAccount = accountRepository.findByIdAndTenantId(request.glAccountId(), tenantId)
                    .orElseThrow(() -> new EntityNotFoundException("GL Account not found for tenant"));
            bankAccount.setGlAccount(glAccount);
        }

        bankAccount = bankAccountRepository.save(bankAccount);
        log.info("Bank account updated: id={} for tenantId={}", bankAccountId, tenantId);

        return toBankAccountResponse(bankAccount);
    }

    @Override
    @Transactional
    public void disconnectBankAccount(UUID tenantId, UUID bankAccountId) {
        log.info("Disconnecting bank account id={} for tenantId={}", bankAccountId, tenantId);

        BankAccount bankAccount = bankAccountRepository.findByIdAndTenantId(bankAccountId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Bank account not found for tenant"));

        bankAccount.disconnect();
        bankAccountRepository.save(bankAccount);
        log.info("Bank account disconnected: id={} for tenantId={}", bankAccountId, tenantId);
    }

    @Override
    public BankingDto.StitchOAuthResponse initiateStitchOAuth(UUID tenantId, String redirectUri) {
        log.info("Initiating Stitch OAuth for tenantId={}", tenantId);

        // Generate state and code verifier for PKCE
        String state = generateRandomString(32);
        String codeVerifier = generateRandomString(64);

        // In production, build the actual Stitch OAuth URL with tenant context
        String authUrl = STITCH_AUTH_URL + "?response_type=code" +
                "&client_id=${STITCH_CLIENT_ID}" +
                "&redirect_uri=" + redirectUri +
                "&scope=accounts transactions" +
                "&state=" + state;

        return new BankingDto.StitchOAuthResponse(authUrl, state, codeVerifier);
    }

    @Override
    @Transactional
    public List<BankingDto.BankAccountResponse> completeStitchOAuth(
            UUID tenantId,
            BankingDto.StitchCallbackRequest callback,
            UUID userId) {
        // In production, exchange code for tokens and fetch linked accounts
        // For now, return empty list as placeholder
        log.info("Completing Stitch OAuth for tenantId={}, userId={}", tenantId, userId);
        return List.of();
    }

    // === Transaction Sync Operations ===

    @Override
    @Transactional
    public BankingDto.SyncResult syncTransactions(UUID tenantId, UUID bankAccountId) {
        log.info("Syncing transactions for bank account id={}, tenantId={}", bankAccountId, tenantId);

        BankAccount bankAccount = bankAccountRepository.findByIdAndTenantId(bankAccountId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Bank account not found for tenant"));

        Instant syncStart = Instant.now();
        int imported = 0;
        int duplicates = 0;
        int failed = 0;
        int rulesApplied = 0;

        try {
            // In production, fetch transactions from Stitch API
            // List<StitchTransaction> stitchTransactions = stitchClient.getTransactions(bankAccount.getStitchAccountId());

            // Apply rules to new transactions
            rulesApplied = applyRulesToTransactions(tenantId, bankAccountId);

            bankAccount.recordSyncSuccess();
            bankAccountRepository.save(bankAccount);

            log.info("Sync completed for bank account id={}, tenantId={}: imported={}, rulesApplied={}",
                    bankAccountId, tenantId, imported, rulesApplied);

            return new BankingDto.SyncResult(
                    bankAccountId,
                    imported,
                    duplicates,
                    failed,
                    rulesApplied,
                    syncStart,
                    Instant.now(),
                    true,
                    null
            );
        } catch (Exception e) {
            log.error("Failed to sync transactions for bank account id={}, tenantId={}: {}",
                    bankAccountId, tenantId, e.getMessage());
            bankAccount.recordSyncFailed(e.getMessage());
            bankAccountRepository.save(bankAccount);

            return new BankingDto.SyncResult(
                    bankAccountId,
                    imported,
                    duplicates,
                    failed,
                    rulesApplied,
                    syncStart,
                    Instant.now(),
                    false,
                    e.getMessage()
            );
        }
    }

    @Override
    @Transactional
    public List<BankingDto.SyncResult> syncAllAccounts(UUID tenantId) {
        log.info("Syncing all active bank accounts for tenantId={}", tenantId);

        List<BankAccount> activeAccounts = bankAccountRepository.findByTenantIdAndStatus(
                tenantId, BankAccount.ConnectionStatus.ACTIVE);

        return activeAccounts.stream()
                .map(account -> syncTransactions(tenantId, account.getId()))
                .toList();
    }

    @Override
    @Transactional
    public List<BankingDto.BankTransactionResponse> importTransactions(
            UUID tenantId,
            UUID bankAccountId,
            List<BankingDto.ImportTransactionRequest> transactions) {
        log.info("Importing {} transactions for bank account id={}, tenantId={}",
                transactions.size(), bankAccountId, tenantId);

        BankAccount bankAccount = bankAccountRepository.findByIdAndTenantId(bankAccountId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Bank account not found for tenant"));

        List<BankTransaction> imported = new ArrayList<>();

        for (BankingDto.ImportTransactionRequest request : transactions) {
            // Skip duplicates
            if (bankTransactionRepository.existsByBankAccountIdAndExternalId(bankAccountId, request.externalId())) {
                continue;
            }

            BankTransaction txn = BankTransaction.fromBankFeed(
                    bankAccount,
                    request.externalId(),
                    request.transactionDate(),
                    request.description(),
                    request.amount(),
                    request.transactionType()
            );
            txn.setTenantId(tenantId);
            txn.setPostedDate(request.postedDate());
            txn.setPayeeName(request.payeeName());
            txn.setRunningBalance(request.runningBalance());
            txn.setCategory(request.category());
            txn.setMerchantCategoryCode(request.merchantCategoryCode());
            txn.setReference(request.reference());

            imported.add(bankTransactionRepository.save(txn));
        }

        // Apply rules to imported transactions
        applyRulesToNewTransactions(tenantId, imported);

        log.info("Imported {} transactions for bank account id={}, tenantId={}",
                imported.size(), bankAccountId, tenantId);

        return imported.stream()
                .map(BankingDto.BankTransactionResponse::fromEntity)
                .toList();
    }

    // === Transaction Retrieval ===

    @Override
    public List<BankingDto.BankTransactionResponse> getTransactions(UUID tenantId, UUID bankAccountId) {
        log.debug("Fetching transactions for bank account id={}, tenantId={}", bankAccountId, tenantId);

        // Verify bank account belongs to tenant
        bankAccountRepository.findByIdAndTenantId(bankAccountId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Bank account not found for tenant"));

        return bankTransactionRepository.findByBankAccountId(bankAccountId).stream()
                .map(BankingDto.BankTransactionResponse::fromEntity)
                .toList();
    }

    @Override
    public Page<BankingDto.BankTransactionResponse> searchTransactions(
            UUID tenantId,
            UUID bankAccountId,
            String searchTerm,
            ReconciliationStatusFilter status,
            TransactionTypeFilter type,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable) {
        log.debug("Searching transactions for bank account id={}, tenantId={}", bankAccountId, tenantId);

        // Verify bank account belongs to tenant
        bankAccountRepository.findByIdAndTenantId(bankAccountId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Bank account not found for tenant"));

        BankTransaction.ReconciliationStatus reconciliationStatus = switch (status) {
            case ALL -> null;
            case UNRECONCILED -> BankTransaction.ReconciliationStatus.UNRECONCILED;
            case SUGGESTED -> BankTransaction.ReconciliationStatus.SUGGESTED;
            case MATCHED -> BankTransaction.ReconciliationStatus.MATCHED;
            case RECONCILED -> BankTransaction.ReconciliationStatus.RECONCILED;
            case EXCLUDED -> BankTransaction.ReconciliationStatus.EXCLUDED;
        };

        BankTransaction.TransactionType transactionType = switch (type) {
            case ALL -> null;
            case DEBIT -> BankTransaction.TransactionType.DEBIT;
            case CREDIT -> BankTransaction.TransactionType.CREDIT;
        };

        return bankTransactionRepository.search(
                bankAccountId,
                searchTerm,
                reconciliationStatus,
                transactionType,
                startDate,
                endDate,
                pageable
        ).map(BankingDto.BankTransactionResponse::fromEntity);
    }

    @Override
    public List<BankingDto.BankTransactionResponse> getUnreconciledTransactions(UUID tenantId, UUID bankAccountId) {
        log.debug("Fetching unreconciled transactions for bank account id={}, tenantId={}", bankAccountId, tenantId);

        // Verify bank account belongs to tenant
        bankAccountRepository.findByIdAndTenantId(bankAccountId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Bank account not found for tenant"));

        return bankTransactionRepository.findUnreconciledByBankAccountId(bankAccountId).stream()
                .map(BankingDto.BankTransactionResponse::fromEntity)
                .toList();
    }

    @Override
    public Optional<BankingDto.BankTransactionResponse> getTransaction(UUID tenantId, UUID transactionId) {
        log.debug("Fetching transaction id={} for tenantId={}", transactionId, tenantId);

        return bankTransactionRepository.findByIdAndTenantId(transactionId, tenantId)
                .filter(t -> !t.isDeleted())
                .map(BankingDto.BankTransactionResponse::fromEntity);
    }

    // === Bank Rule Operations ===

    @Override
    public List<BankingDto.BankRuleResponse> getBankRules(UUID tenantId) {
        log.debug("Fetching bank rules for tenantId={}", tenantId);

        return bankRuleRepository.findByTenantId(tenantId).stream()
                .filter(r -> !r.isDeleted())
                .map(BankingDto.BankRuleResponse::fromEntity)
                .toList();
    }

    @Override
    public Optional<BankingDto.BankRuleResponse> getBankRule(UUID tenantId, UUID ruleId) {
        log.debug("Fetching bank rule id={} for tenantId={}", ruleId, tenantId);

        return bankRuleRepository.findByIdAndTenantId(ruleId, tenantId)
                .filter(r -> !r.isDeleted())
                .map(BankingDto.BankRuleResponse::fromEntity);
    }

    @Override
    @Transactional
    public BankingDto.BankRuleResponse createBankRule(
            UUID tenantId,
            BankingDto.CreateBankRuleRequest request,
            UUID userId) {
        log.info("Creating bank rule: {} for tenantId={}", request.name(), tenantId);

        // Validate target account exists and belongs to tenant
        Account targetAccount = accountRepository.findByIdAndTenantId(request.targetAccountId(), tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Target account not found for tenant"));

        BankRule rule = new BankRule();
        rule.setName(request.name());
        rule.setDescription(request.description());
        rule.setConditionField(request.conditionField());
        rule.setConditionOperator(request.conditionOperator());
        rule.setConditionValue(request.conditionValue());
        rule.setConditionValueSecondary(request.conditionValueSecondary());
        rule.setTargetAccount(targetAccount);
        rule.setPayeeNameOverride(request.payeeNameOverride());
        rule.setPriority(request.priority() > 0 ? request.priority() : 100);
        rule.setTenantId(tenantId);
        rule.setCreatedBy(userId);

        // Link to specific bank account if provided (must belong to same tenant)
        if (request.bankAccountId() != null) {
            BankAccount bankAccount = bankAccountRepository.findByIdAndTenantId(request.bankAccountId(), tenantId)
                    .orElseThrow(() -> new EntityNotFoundException("Bank account not found for tenant"));
            rule.setBankAccount(bankAccount);
        }

        rule = bankRuleRepository.save(rule);
        log.info("Bank rule created: id={} for tenantId={}", rule.getId(), tenantId);

        return BankingDto.BankRuleResponse.fromEntity(rule);
    }

    @Override
    @Transactional
    public BankingDto.BankRuleResponse updateBankRule(
            UUID tenantId,
            UUID ruleId,
            BankingDto.UpdateBankRuleRequest request) {
        log.debug("Updating bank rule id={} for tenantId={}", ruleId, tenantId);

        BankRule rule = bankRuleRepository.findByIdAndTenantId(ruleId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Bank rule not found for tenant"));

        if (request.name() != null) {
            rule.setName(request.name());
        }
        if (request.description() != null) {
            rule.setDescription(request.description());
        }
        if (request.conditionField() != null) {
            rule.setConditionField(request.conditionField());
        }
        if (request.conditionOperator() != null) {
            rule.setConditionOperator(request.conditionOperator());
        }
        if (request.conditionValue() != null) {
            rule.setConditionValue(request.conditionValue());
        }
        rule.setConditionValueSecondary(request.conditionValueSecondary());
        if (request.targetAccountId() != null) {
            Account targetAccount = accountRepository.findByIdAndTenantId(request.targetAccountId(), tenantId)
                    .orElseThrow(() -> new EntityNotFoundException("Target account not found for tenant"));
            rule.setTargetAccount(targetAccount);
        }
        rule.setPayeeNameOverride(request.payeeNameOverride());
        rule.setActive(request.active());
        if (request.priority() > 0) {
            rule.setPriority(request.priority());
        }
        if (request.bankAccountId() != null) {
            BankAccount bankAccount = bankAccountRepository.findByIdAndTenantId(request.bankAccountId(), tenantId)
                    .orElseThrow(() -> new EntityNotFoundException("Bank account not found for tenant"));
            rule.setBankAccount(bankAccount);
        } else {
            rule.setBankAccount(null); // Apply to all accounts
        }

        rule = bankRuleRepository.save(rule);
        log.info("Bank rule updated: id={} for tenantId={}", ruleId, tenantId);

        return BankingDto.BankRuleResponse.fromEntity(rule);
    }

    @Override
    @Transactional
    public void deleteBankRule(UUID tenantId, UUID ruleId) {
        log.info("Deleting bank rule id={} for tenantId={}", ruleId, tenantId);

        BankRule rule = bankRuleRepository.findByIdAndTenantId(ruleId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Bank rule not found for tenant"));
        rule.softDelete();
        bankRuleRepository.save(rule);
        log.info("Bank rule deleted: id={} for tenantId={}", ruleId, tenantId);
    }

    @Override
    public boolean testRule(UUID tenantId, UUID ruleId, UUID transactionId) {
        log.debug("Testing rule id={} against transaction id={} for tenantId={}", ruleId, transactionId, tenantId);

        BankRule rule = bankRuleRepository.findByIdAndTenantId(ruleId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Bank rule not found for tenant"));
        BankTransaction transaction = bankTransactionRepository.findByIdAndTenantId(transactionId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Transaction not found for tenant"));

        return rule.matches(transaction);
    }

    @Override
    @Transactional
    public int applyRulesToTransactions(UUID tenantId, UUID bankAccountId) {
        log.debug("Applying rules to transactions for bank account id={}, tenantId={}", bankAccountId, tenantId);

        // Verify bank account belongs to tenant
        bankAccountRepository.findByIdAndTenantId(bankAccountId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Bank account not found for tenant"));

        List<BankTransaction> unreconciled = bankTransactionRepository
                .findUnreconciledByBankAccountId(bankAccountId);

        return applyRulesToNewTransactions(tenantId, unreconciled);
    }

    private int applyRulesToNewTransactions(UUID tenantId, List<BankTransaction> transactions) {
        if (transactions.isEmpty()) {
            return 0;
        }

        UUID bankAccountId = transactions.get(0).getBankAccount().getId();

        List<BankRule> rules = bankRuleRepository.findApplicableRules(tenantId, bankAccountId);
        int applied = 0;

        for (BankTransaction txn : transactions) {
            if (txn.getReconciliationStatus() != BankTransaction.ReconciliationStatus.UNRECONCILED) {
                continue;
            }

            for (BankRule rule : rules) {
                if (rule.matches(txn)) {
                    txn.applySuggestion(
                            rule.getTargetAccount(),
                            BigDecimal.valueOf(0.9), // High confidence for rule match
                            BankTransaction.SuggestionSource.BANK_RULE
                    );
                    if (rule.getPayeeNameOverride() != null) {
                        txn.setPayeeName(rule.getPayeeNameOverride());
                    }
                    bankRuleRepository.incrementMatchCount(rule.getId());
                    applied++;
                    break; // First matching rule wins
                }
            }
        }

        bankTransactionRepository.saveAll(transactions);
        log.debug("Applied {} rules to transactions for tenantId={}", applied, tenantId);

        return applied;
    }

    // === Dashboard ===

    @Override
    public BankingDto.BankingDashboard getDashboard(UUID tenantId) {
        log.debug("Fetching banking dashboard for tenantId={}", tenantId);

        List<BankAccount> accounts = bankAccountRepository.findByTenantId(tenantId);

        int connectedAccounts = (int) accounts.stream()
                .filter(a -> a.getStatus() == BankAccount.ConnectionStatus.ACTIVE)
                .count();

        int needingReauth = (int) accounts.stream()
                .filter(a -> a.getStatus() == BankAccount.ConnectionStatus.REAUTH_REQUIRED)
                .count();

        long totalUnreconciled = bankTransactionRepository.countUnreconciledByTenant(tenantId);

        // Calculate unreconciled inflow/outflow
        BigDecimal unreconciledInflow = BigDecimal.ZERO;
        BigDecimal unreconciledOutflow = BigDecimal.ZERO;

        List<BankTransaction> unreconciledTxns = bankTransactionRepository.findNeedingAttentionByTenant(tenantId);
        for (BankTransaction txn : unreconciledTxns) {
            if (txn.isInflow()) {
                unreconciledInflow = unreconciledInflow.add(txn.getAbsoluteAmount());
            } else {
                unreconciledOutflow = unreconciledOutflow.add(txn.getAbsoluteAmount());
            }
        }

        // Account summaries
        List<BankingDto.BankAccountSummary> summaries = accounts.stream()
                .map(a -> new BankingDto.BankAccountSummary(
                        a.getId(),
                        a.getAccountName(),
                        a.getInstitutionName(),
                        a.getInstitutionLogo(),
                        a.getCurrentBalance(),
                        bankTransactionRepository.countUnreconciledByBankAccountId(a.getId()),
                        a.getStatus(),
                        a.getLastSyncAt()
                ))
                .toList();

        // Recent transactions (last 10)
        List<BankingDto.BankTransactionResponse> recentTransactions = unreconciledTxns.stream()
                .limit(10)
                .map(BankingDto.BankTransactionResponse::fromEntity)
                .toList();

        return new BankingDto.BankingDashboard(
                connectedAccounts,
                needingReauth,
                totalUnreconciled,
                unreconciledInflow,
                unreconciledOutflow,
                summaries,
                recentTransactions
        );
    }

    // === Supported Institutions ===

    @Override
    public List<BankingDto.InstitutionInfo> getSupportedInstitutions() {
        return SA_INSTITUTIONS;
    }

    // === Helper Methods ===

    private BankingDto.BankAccountResponse toBankAccountResponse(BankAccount account) {
        long unreconciledCount = bankTransactionRepository.countUnreconciledByBankAccountId(account.getId());
        return BankingDto.BankAccountResponse.fromEntity(account, unreconciledCount);
    }

    private String maskAccountNumber(String accountNumber) {
        if (accountNumber == null || accountNumber.length() < 4) {
            return "****";
        }
        return "****" + accountNumber.substring(accountNumber.length() - 4);
    }

    private String generateRandomString(int length) {
        byte[] bytes = new byte[length];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes).substring(0, length);
    }
}
