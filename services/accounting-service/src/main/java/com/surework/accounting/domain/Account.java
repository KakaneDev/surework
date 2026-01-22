package com.surework.accounting.domain;

import com.surework.common.persistence.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents an account in the Chart of Accounts.
 * Implements double-entry bookkeeping principles.
 */
@Entity
@Table(name = "accounts", indexes = {
        @Index(name = "idx_accounts_code", columnList = "account_code"),
        @Index(name = "idx_accounts_type", columnList = "account_type"),
        @Index(name = "idx_accounts_parent", columnList = "parent_id")
})
@Getter
@Setter
@NoArgsConstructor
public class Account extends BaseEntity {

    @Column(name = "account_code", nullable = false, unique = true, length = 20)
    private String accountCode;

    @Column(name = "account_name", nullable = false)
    private String accountName;

    @Column(name = "description", length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false)
    private AccountType accountType;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_subtype")
    private AccountSubtype accountSubtype;

    @Enumerated(EnumType.STRING)
    @Column(name = "normal_balance", nullable = false)
    private NormalBalance normalBalance;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Account parent;

    @OneToMany(mappedBy = "parent")
    private List<Account> children = new ArrayList<>();

    @Column(name = "is_header")
    private boolean header = false;

    @Column(name = "is_active")
    private boolean active = true;

    @Column(name = "is_system")
    private boolean systemAccount = false;

    @Column(name = "current_balance", precision = 15, scale = 2)
    private BigDecimal currentBalance = BigDecimal.ZERO;

    @Column(name = "ytd_debit", precision = 15, scale = 2)
    private BigDecimal ytdDebit = BigDecimal.ZERO;

    @Column(name = "ytd_credit", precision = 15, scale = 2)
    private BigDecimal ytdCredit = BigDecimal.ZERO;

    @Column(name = "opening_balance", precision = 15, scale = 2)
    private BigDecimal openingBalance = BigDecimal.ZERO;

    // VAT-related fields
    @Enumerated(EnumType.STRING)
    @Column(name = "vat_category")
    private VatCategory vatCategory;

    @Column(name = "vat_rate", precision = 5, scale = 4)
    private BigDecimal vatRate;

    // Bank account fields
    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "bank_account_number")
    private String bankAccountNumber;

    @Column(name = "bank_branch_code")
    private String bankBranchCode;

    /**
     * Account types following standard accounting principles.
     */
    public enum AccountType {
        ASSET,          // Debit balance normally
        LIABILITY,      // Credit balance normally
        EQUITY,         // Credit balance normally
        REVENUE,        // Credit balance normally
        EXPENSE         // Debit balance normally
    }

    /**
     * Account subtypes for detailed classification.
     */
    public enum AccountSubtype {
        // Asset subtypes
        CASH,
        BANK,
        ACCOUNTS_RECEIVABLE,
        INVENTORY,
        PREPAID_EXPENSE,
        FIXED_ASSET,
        ACCUMULATED_DEPRECIATION,
        OTHER_CURRENT_ASSET,
        OTHER_NONCURRENT_ASSET,

        // Liability subtypes
        ACCOUNTS_PAYABLE,
        VAT_PAYABLE,
        PAYE_PAYABLE,
        UIF_PAYABLE,
        ACCRUED_EXPENSE,
        LOANS_PAYABLE,
        OTHER_CURRENT_LIABILITY,
        LONG_TERM_LIABILITY,

        // Equity subtypes
        SHARE_CAPITAL,
        RETAINED_EARNINGS,
        DRAWINGS,
        CURRENT_YEAR_EARNINGS,

        // Revenue subtypes
        SALES_REVENUE,
        SERVICE_REVENUE,
        INTEREST_INCOME,
        OTHER_INCOME,

        // Expense subtypes
        COST_OF_SALES,
        SALARIES_WAGES,
        RENT_EXPENSE,
        UTILITIES,
        DEPRECIATION,
        INTEREST_EXPENSE,
        TAX_EXPENSE,
        OTHER_EXPENSE
    }

    /**
     * Normal balance side for account types.
     */
    public enum NormalBalance {
        DEBIT,
        CREDIT
    }

    /**
     * VAT category for South African VAT.
     */
    public enum VatCategory {
        STANDARD,       // Standard rate (15%)
        ZERO_RATED,     // 0% (exports, basic food)
        EXEMPT,         // Exempt supplies
        OUT_OF_SCOPE,   // Outside VAT scope
        INPUT_VAT,      // VAT on purchases
        OUTPUT_VAT      // VAT on sales
    }

    /**
     * Create a new account.
     */
    public static Account create(String code, String name, AccountType type) {
        Account account = new Account();
        account.setAccountCode(code);
        account.setAccountName(name);
        account.setAccountType(type);
        account.setNormalBalance(getDefaultNormalBalance(type));
        account.setActive(true);
        return account;
    }

    private static NormalBalance getDefaultNormalBalance(AccountType type) {
        return switch (type) {
            case ASSET, EXPENSE -> NormalBalance.DEBIT;
            case LIABILITY, EQUITY, REVENUE -> NormalBalance.CREDIT;
        };
    }

    /**
     * Apply a debit to this account.
     */
    public void debit(BigDecimal amount) {
        this.ytdDebit = this.ytdDebit.add(amount);
        recalculateBalance();
    }

    /**
     * Apply a credit to this account.
     */
    public void credit(BigDecimal amount) {
        this.ytdCredit = this.ytdCredit.add(amount);
        recalculateBalance();
    }

    /**
     * Recalculate the current balance.
     */
    public void recalculateBalance() {
        if (this.normalBalance == NormalBalance.DEBIT) {
            this.currentBalance = this.openingBalance.add(this.ytdDebit).subtract(this.ytdCredit);
        } else {
            this.currentBalance = this.openingBalance.add(this.ytdCredit).subtract(this.ytdDebit);
        }
    }

    /**
     * Get the full account path (for hierarchical accounts).
     */
    public String getFullPath() {
        if (parent == null) {
            return accountName;
        }
        return parent.getFullPath() + " > " + accountName;
    }

    /**
     * Check if this account can have transactions posted to it.
     */
    public boolean isPostable() {
        return !header && active && !isDeleted();
    }

    /**
     * Check if this is a balance sheet account.
     */
    public boolean isBalanceSheetAccount() {
        return accountType == AccountType.ASSET ||
                accountType == AccountType.LIABILITY ||
                accountType == AccountType.EQUITY;
    }

    /**
     * Check if this is an income statement account.
     */
    public boolean isIncomeStatementAccount() {
        return accountType == AccountType.REVENUE ||
                accountType == AccountType.EXPENSE;
    }
}
