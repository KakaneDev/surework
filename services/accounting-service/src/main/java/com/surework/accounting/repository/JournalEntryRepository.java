package com.surework.accounting.repository;

import com.surework.accounting.domain.JournalEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for JournalEntry entities.
 */
@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, UUID> {

    /**
     * Find by entry number.
     */
    Optional<JournalEntry> findByEntryNumber(String entryNumber);

    /**
     * Find by status.
     */
    @Query("SELECT je FROM JournalEntry je WHERE je.status = :status AND je.deleted = false " +
            "ORDER BY je.transactionDate DESC")
    List<JournalEntry> findByStatus(@Param("status") JournalEntry.EntryStatus status);

    /**
     * Find by date range.
     */
    @Query("SELECT je FROM JournalEntry je WHERE je.transactionDate BETWEEN :startDate AND :endDate " +
            "AND je.deleted = false ORDER BY je.transactionDate, je.entryNumber")
    List<JournalEntry> findByDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Find posted entries by date range.
     */
    @Query("SELECT je FROM JournalEntry je WHERE je.status = 'POSTED' " +
            "AND je.transactionDate BETWEEN :startDate AND :endDate " +
            "AND je.deleted = false ORDER BY je.transactionDate, je.entryNumber")
    List<JournalEntry> findPostedByDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Find by fiscal period.
     */
    @Query("SELECT je FROM JournalEntry je WHERE je.fiscalPeriod.id = :periodId " +
            "AND je.deleted = false ORDER BY je.transactionDate, je.entryNumber")
    List<JournalEntry> findByFiscalPeriod(@Param("periodId") UUID periodId);

    /**
     * Find by entry type.
     */
    @Query("SELECT je FROM JournalEntry je WHERE je.entryType = :type AND je.deleted = false " +
            "ORDER BY je.transactionDate DESC")
    List<JournalEntry> findByEntryType(@Param("type") JournalEntry.EntryType type);

    /**
     * Find by source document.
     */
    @Query("SELECT je FROM JournalEntry je WHERE je.sourceDocument = :sourceDoc " +
            "AND je.sourceId = :sourceId AND je.deleted = false")
    Optional<JournalEntry> findBySource(
            @Param("sourceDoc") String sourceDocument,
            @Param("sourceId") UUID sourceId);

    /**
     * Search journal entries.
     */
    @Query("SELECT je FROM JournalEntry je WHERE je.deleted = false " +
            "AND (:startDate IS NULL OR je.transactionDate >= :startDate) " +
            "AND (:endDate IS NULL OR je.transactionDate <= :endDate) " +
            "AND (:status IS NULL OR je.status = :status) " +
            "AND (:type IS NULL OR je.entryType = :type) " +
            "AND (:searchTerm IS NULL OR LOWER(je.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "    OR LOWER(je.entryNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "ORDER BY je.transactionDate DESC, je.entryNumber DESC")
    Page<JournalEntry> search(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("status") JournalEntry.EntryStatus status,
            @Param("type") JournalEntry.EntryType type,
            @Param("searchTerm") String searchTerm,
            Pageable pageable);

    /**
     * Count entries by status.
     */
    @Query("SELECT COUNT(je) FROM JournalEntry je WHERE je.status = :status AND je.deleted = false")
    long countByStatus(@Param("status") JournalEntry.EntryStatus status);

    /**
     * Find draft entries for a user.
     */
    @Query("SELECT je FROM JournalEntry je WHERE je.status = 'DRAFT' " +
            "AND je.deleted = false ORDER BY je.createdAt DESC")
    List<JournalEntry> findDraftEntries();

    /**
     * Get total debit/credit for a period.
     */
    @Query("SELECT COALESCE(SUM(je.totalDebit), 0) FROM JournalEntry je " +
            "WHERE je.status = 'POSTED' AND je.transactionDate BETWEEN :startDate AND :endDate " +
            "AND je.deleted = false")
    java.math.BigDecimal getTotalDebitForPeriod(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(je.totalCredit), 0) FROM JournalEntry je " +
            "WHERE je.status = 'POSTED' AND je.transactionDate BETWEEN :startDate AND :endDate " +
            "AND je.deleted = false")
    java.math.BigDecimal getTotalCreditForPeriod(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
