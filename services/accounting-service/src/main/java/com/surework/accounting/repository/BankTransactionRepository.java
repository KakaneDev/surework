package com.surework.accounting.repository;

import com.surework.accounting.domain.BankTransaction;
import com.surework.accounting.domain.BankTransaction.ReconciliationStatus;
import com.surework.accounting.domain.BankTransaction.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for BankTransaction entities.
 */
@Repository
public interface BankTransactionRepository extends JpaRepository<BankTransaction, UUID> {

    /**
     * Find by ID and tenant ID for secure tenant-scoped access.
     */
    @Query("SELECT bt FROM BankTransaction bt WHERE bt.id = :id AND bt.tenantId = :tenantId AND bt.deleted = false")
    Optional<BankTransaction> findByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

    /**
     * Find by bank account and external ID.
     */
    Optional<BankTransaction> findByBankAccountIdAndExternalId(UUID bankAccountId, String externalId);

    /**
     * Find all transactions for a bank account.
     */
    @Query("SELECT bt FROM BankTransaction bt WHERE bt.bankAccount.id = :bankAccountId AND bt.deleted = false " +
            "ORDER BY bt.transactionDate DESC, bt.createdAt DESC")
    List<BankTransaction> findByBankAccountId(@Param("bankAccountId") UUID bankAccountId);

    /**
     * Find transactions by reconciliation status.
     */
    @Query("SELECT bt FROM BankTransaction bt WHERE bt.bankAccount.id = :bankAccountId " +
            "AND bt.reconciliationStatus = :status AND bt.deleted = false " +
            "ORDER BY bt.transactionDate DESC")
    List<BankTransaction> findByBankAccountIdAndStatus(
            @Param("bankAccountId") UUID bankAccountId,
            @Param("status") ReconciliationStatus status);

    /**
     * Find unreconciled transactions.
     */
    @Query("SELECT bt FROM BankTransaction bt WHERE bt.bankAccount.id = :bankAccountId " +
            "AND bt.reconciliationStatus IN ('UNRECONCILED', 'SUGGESTED') AND bt.deleted = false " +
            "ORDER BY bt.transactionDate DESC")
    List<BankTransaction> findUnreconciledByBankAccountId(@Param("bankAccountId") UUID bankAccountId);

    /**
     * Find transactions by date range.
     */
    @Query("SELECT bt FROM BankTransaction bt WHERE bt.bankAccount.id = :bankAccountId " +
            "AND bt.transactionDate BETWEEN :startDate AND :endDate AND bt.deleted = false " +
            "ORDER BY bt.transactionDate DESC")
    List<BankTransaction> findByBankAccountIdAndDateRange(
            @Param("bankAccountId") UUID bankAccountId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Find transactions by type.
     */
    @Query("SELECT bt FROM BankTransaction bt WHERE bt.bankAccount.id = :bankAccountId " +
            "AND bt.transactionType = :type AND bt.deleted = false " +
            "ORDER BY bt.transactionDate DESC")
    List<BankTransaction> findByBankAccountIdAndType(
            @Param("bankAccountId") UUID bankAccountId,
            @Param("type") TransactionType type);

    /**
     * Find transactions needing attention (unreconciled or suggested).
     */
    @Query("SELECT bt FROM BankTransaction bt WHERE bt.tenantId = :tenantId " +
            "AND bt.reconciliationStatus IN ('UNRECONCILED', 'SUGGESTED') AND bt.deleted = false " +
            "ORDER BY bt.transactionDate DESC")
    List<BankTransaction> findNeedingAttentionByTenant(@Param("tenantId") UUID tenantId);

    /**
     * Count unreconciled transactions for a bank account.
     */
    @Query("SELECT COUNT(bt) FROM BankTransaction bt WHERE bt.bankAccount.id = :bankAccountId " +
            "AND bt.reconciliationStatus IN ('UNRECONCILED', 'SUGGESTED') AND bt.deleted = false")
    long countUnreconciledByBankAccountId(@Param("bankAccountId") UUID bankAccountId);

    /**
     * Count unreconciled transactions for tenant.
     */
    @Query("SELECT COUNT(bt) FROM BankTransaction bt WHERE bt.tenantId = :tenantId " +
            "AND bt.reconciliationStatus IN ('UNRECONCILED', 'SUGGESTED') AND bt.deleted = false")
    long countUnreconciledByTenant(@Param("tenantId") UUID tenantId);

    /**
     * Get sum of unreconciled amounts by type.
     */
    @Query("SELECT bt.transactionType, SUM(bt.amount) FROM BankTransaction bt " +
            "WHERE bt.bankAccount.id = :bankAccountId " +
            "AND bt.reconciliationStatus IN ('UNRECONCILED', 'SUGGESTED') AND bt.deleted = false " +
            "GROUP BY bt.transactionType")
    List<Object[]> sumUnreconciledByType(@Param("bankAccountId") UUID bankAccountId);

    /**
     * Find potential matches for amount (for reconciliation).
     */
    @Query("SELECT bt FROM BankTransaction bt WHERE bt.bankAccount.id = :bankAccountId " +
            "AND bt.amount = :amount AND bt.reconciliationStatus = 'UNRECONCILED' " +
            "AND bt.transactionDate BETWEEN :startDate AND :endDate AND bt.deleted = false")
    List<BankTransaction> findPotentialMatchesByAmount(
            @Param("bankAccountId") UUID bankAccountId,
            @Param("amount") BigDecimal amount,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Search transactions.
     */
    @Query("SELECT bt FROM BankTransaction bt WHERE bt.deleted = false " +
            "AND (:bankAccountId IS NULL OR bt.bankAccount.id = :bankAccountId) " +
            "AND (:searchTerm IS NULL OR LOWER(bt.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "    OR LOWER(bt.payeeName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "    OR LOWER(bt.reference) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "AND (:status IS NULL OR bt.reconciliationStatus = :status) " +
            "AND (:type IS NULL OR bt.transactionType = :type) " +
            "AND (:startDate IS NULL OR bt.transactionDate >= :startDate) " +
            "AND (:endDate IS NULL OR bt.transactionDate <= :endDate) " +
            "ORDER BY bt.transactionDate DESC, bt.createdAt DESC")
    Page<BankTransaction> search(
            @Param("bankAccountId") UUID bankAccountId,
            @Param("searchTerm") String searchTerm,
            @Param("status") ReconciliationStatus status,
            @Param("type") TransactionType type,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable);

    /**
     * Find by journal entry.
     */
    @Query("SELECT bt FROM BankTransaction bt WHERE bt.journalEntry.id = :journalEntryId AND bt.deleted = false")
    Optional<BankTransaction> findByJournalEntryId(@Param("journalEntryId") UUID journalEntryId);

    /**
     * Check if external ID exists for bank account.
     */
    boolean existsByBankAccountIdAndExternalId(UUID bankAccountId, String externalId);

    /**
     * Get latest transaction date for bank account.
     */
    @Query("SELECT MAX(bt.transactionDate) FROM BankTransaction bt " +
            "WHERE bt.bankAccount.id = :bankAccountId AND bt.deleted = false")
    Optional<LocalDate> findLatestTransactionDate(@Param("bankAccountId") UUID bankAccountId);

    /**
     * Get reconciliation summary for bank account.
     */
    @Query("SELECT bt.reconciliationStatus, COUNT(bt), SUM(bt.amount) " +
            "FROM BankTransaction bt WHERE bt.bankAccount.id = :bankAccountId AND bt.deleted = false " +
            "GROUP BY bt.reconciliationStatus")
    List<Object[]> getReconciliationSummary(@Param("bankAccountId") UUID bankAccountId);

    /**
     * Find similar transactions (for rule learning).
     */
    @Query("SELECT bt FROM BankTransaction bt WHERE bt.tenantId = :tenantId " +
            "AND bt.reconciliationStatus = 'RECONCILED' " +
            "AND LOWER(bt.description) LIKE LOWER(CONCAT('%', :pattern, '%')) " +
            "AND bt.deleted = false " +
            "ORDER BY bt.reconciledAt DESC")
    List<BankTransaction> findSimilarReconciled(
            @Param("tenantId") UUID tenantId,
            @Param("pattern") String pattern,
            Pageable pageable);
}
