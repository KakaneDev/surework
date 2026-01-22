package com.surework.accounting.repository;

import com.surework.accounting.domain.Account;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Account entities.
 */
@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {

    /**
     * Find by account code.
     */
    Optional<Account> findByAccountCode(String accountCode);

    /**
     * Find by account type.
     */
    @Query("SELECT a FROM Account a WHERE a.accountType = :type AND a.deleted = false " +
            "ORDER BY a.accountCode")
    List<Account> findByAccountType(@Param("type") Account.AccountType type);

    /**
     * Find active accounts.
     */
    @Query("SELECT a FROM Account a WHERE a.active = true AND a.deleted = false " +
            "ORDER BY a.accountCode")
    List<Account> findAllActive();

    /**
     * Find postable accounts (non-header, active).
     */
    @Query("SELECT a FROM Account a WHERE a.active = true AND a.header = false AND a.deleted = false " +
            "ORDER BY a.accountCode")
    List<Account> findAllPostable();

    /**
     * Find top-level accounts (no parent).
     */
    @Query("SELECT a FROM Account a WHERE a.parent IS NULL AND a.deleted = false " +
            "ORDER BY a.accountCode")
    List<Account> findTopLevelAccounts();

    /**
     * Find child accounts.
     */
    @Query("SELECT a FROM Account a WHERE a.parent.id = :parentId AND a.deleted = false " +
            "ORDER BY a.accountCode")
    List<Account> findByParentId(@Param("parentId") UUID parentId);

    /**
     * Find by VAT category.
     */
    @Query("SELECT a FROM Account a WHERE a.vatCategory = :category AND a.deleted = false " +
            "ORDER BY a.accountCode")
    List<Account> findByVatCategory(@Param("category") Account.VatCategory category);

    /**
     * Find bank accounts.
     */
    @Query("SELECT a FROM Account a WHERE a.accountSubtype = 'BANK' AND a.deleted = false " +
            "ORDER BY a.accountCode")
    List<Account> findBankAccounts();

    /**
     * Search accounts.
     */
    @Query("SELECT a FROM Account a WHERE a.deleted = false " +
            "AND (:searchTerm IS NULL OR LOWER(a.accountCode) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "    OR LOWER(a.accountName) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "AND (:type IS NULL OR a.accountType = :type) " +
            "AND (:activeOnly = false OR a.active = true) " +
            "ORDER BY a.accountCode")
    Page<Account> search(
            @Param("searchTerm") String searchTerm,
            @Param("type") Account.AccountType type,
            @Param("activeOnly") boolean activeOnly,
            Pageable pageable);

    /**
     * Get accounts with non-zero balance.
     */
    @Query("SELECT a FROM Account a WHERE a.currentBalance != 0 AND a.deleted = false " +
            "ORDER BY a.accountCode")
    List<Account> findAccountsWithBalance();

    /**
     * Get balance sheet accounts.
     */
    @Query("SELECT a FROM Account a WHERE a.accountType IN ('ASSET', 'LIABILITY', 'EQUITY') " +
            "AND a.header = false AND a.deleted = false ORDER BY a.accountCode")
    List<Account> findBalanceSheetAccounts();

    /**
     * Get income statement accounts.
     */
    @Query("SELECT a FROM Account a WHERE a.accountType IN ('REVENUE', 'EXPENSE') " +
            "AND a.header = false AND a.deleted = false ORDER BY a.accountCode")
    List<Account> findIncomeStatementAccounts();

    /**
     * Check if account code exists.
     */
    boolean existsByAccountCode(String accountCode);
}
