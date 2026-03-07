package com.surework.accounting.repository;

import com.surework.accounting.domain.Invoice;
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
 * Repository for Invoice entities.
 */
@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

    /**
     * Find by invoice number.
     */
    Optional<Invoice> findByInvoiceNumberAndDeletedFalse(String invoiceNumber);

    /**
     * Check if invoice number exists.
     */
    @Query("SELECT COUNT(i) > 0 FROM Invoice i WHERE i.invoiceNumber = :number AND i.deleted = false")
    boolean existsByInvoiceNumber(@Param("number") String invoiceNumber);

    /**
     * Find by customer.
     */
    @Query("SELECT i FROM Invoice i WHERE i.customer.id = :customerId AND i.deleted = false " +
            "ORDER BY i.invoiceDate DESC")
    List<Invoice> findByCustomer(@Param("customerId") UUID customerId);

    /**
     * Find by customer with pagination.
     */
    @Query("SELECT i FROM Invoice i WHERE i.customer.id = :customerId AND i.deleted = false " +
            "ORDER BY i.invoiceDate DESC")
    Page<Invoice> findByCustomer(@Param("customerId") UUID customerId, Pageable pageable);

    /**
     * Find by status.
     */
    @Query("SELECT i FROM Invoice i WHERE i.status = :status AND i.deleted = false " +
            "ORDER BY i.invoiceDate DESC")
    List<Invoice> findByStatus(@Param("status") Invoice.InvoiceStatus status);

    /**
     * Find by date range.
     */
    @Query("SELECT i FROM Invoice i WHERE i.invoiceDate BETWEEN :startDate AND :endDate " +
            "AND i.deleted = false ORDER BY i.invoiceDate DESC")
    List<Invoice> findByDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Find overdue invoices.
     */
    @Query("SELECT i FROM Invoice i WHERE i.dueDate < :today AND i.amountDue > 0 " +
            "AND i.status NOT IN ('VOID', 'WRITTEN_OFF', 'PAID') AND i.deleted = false " +
            "ORDER BY i.dueDate")
    List<Invoice> findOverdue(@Param("today") LocalDate today);

    /**
     * Find unpaid invoices.
     */
    @Query("SELECT i FROM Invoice i WHERE i.amountDue > 0 " +
            "AND i.status NOT IN ('VOID', 'WRITTEN_OFF', 'DRAFT') AND i.deleted = false " +
            "ORDER BY i.dueDate")
    List<Invoice> findUnpaid();

    /**
     * Search invoices with filters.
     */
    @Query("SELECT i FROM Invoice i WHERE i.deleted = false " +
            "AND (:status IS NULL OR i.status = :status) " +
            "AND (:customerId IS NULL OR i.customer.id = :customerId) " +
            "AND (:startDate IS NULL OR i.invoiceDate >= :startDate) " +
            "AND (:endDate IS NULL OR i.invoiceDate <= :endDate) " +
            "AND (:searchTerm IS NULL OR " +
            "    LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "    LOWER(i.customerName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "    LOWER(i.reference) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "ORDER BY i.invoiceDate DESC")
    Page<Invoice> search(
            @Param("status") Invoice.InvoiceStatus status,
            @Param("customerId") UUID customerId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("searchTerm") String searchTerm,
            Pageable pageable);

    /**
     * Find with lines (fetch join).
     */
    @Query("SELECT DISTINCT i FROM Invoice i LEFT JOIN FETCH i.lines WHERE i.id = :id AND i.deleted = false")
    Optional<Invoice> findByIdWithLines(@Param("id") UUID id);

    /**
     * Find with payments (fetch join).
     */
    @Query("SELECT DISTINCT i FROM Invoice i LEFT JOIN FETCH i.payments WHERE i.id = :id AND i.deleted = false")
    Optional<Invoice> findByIdWithPayments(@Param("id") UUID id);

    /**
     * Find with all details (fetch join).
     */
    @Query("SELECT DISTINCT i FROM Invoice i " +
            "LEFT JOIN FETCH i.lines " +
            "LEFT JOIN FETCH i.payments " +
            "LEFT JOIN FETCH i.customer " +
            "WHERE i.id = :id AND i.deleted = false")
    Optional<Invoice> findByIdWithDetails(@Param("id") UUID id);

    // === Aggregation Queries ===

    /**
     * Sum total for status.
     */
    @Query("SELECT COALESCE(SUM(i.total), 0) FROM Invoice i " +
            "WHERE i.status = :status AND i.deleted = false")
    BigDecimal sumTotalByStatus(@Param("status") Invoice.InvoiceStatus status);

    /**
     * Sum amount due (outstanding).
     */
    @Query("SELECT COALESCE(SUM(i.amountDue), 0) FROM Invoice i " +
            "WHERE i.amountDue > 0 AND i.status NOT IN ('VOID', 'WRITTEN_OFF', 'DRAFT') " +
            "AND i.deleted = false")
    BigDecimal sumOutstanding();

    /**
     * Sum overdue amount.
     */
    @Query("SELECT COALESCE(SUM(i.amountDue), 0) FROM Invoice i " +
            "WHERE i.dueDate < :today AND i.amountDue > 0 " +
            "AND i.status NOT IN ('VOID', 'WRITTEN_OFF', 'PAID') " +
            "AND i.deleted = false")
    BigDecimal sumOverdue(@Param("today") LocalDate today);

    /**
     * Sum by date range.
     */
    @Query("SELECT COALESCE(SUM(i.total), 0) FROM Invoice i " +
            "WHERE i.invoiceDate BETWEEN :startDate AND :endDate " +
            "AND i.status NOT IN ('VOID', 'DRAFT') AND i.deleted = false")
    BigDecimal sumTotalByDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Count by status.
     */
    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.status = :status AND i.deleted = false")
    long countByStatus(@Param("status") Invoice.InvoiceStatus status);

    /**
     * Count overdue.
     */
    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.dueDate < :today AND i.amountDue > 0 " +
            "AND i.status NOT IN ('VOID', 'WRITTEN_OFF', 'PAID') AND i.deleted = false")
    long countOverdue(@Param("today") LocalDate today);

    // === Aging Report Queries ===

    /**
     * Sum current (not overdue).
     */
    @Query("SELECT COALESCE(SUM(i.amountDue), 0) FROM Invoice i " +
            "WHERE i.dueDate >= :today AND i.amountDue > 0 " +
            "AND i.status NOT IN ('VOID', 'WRITTEN_OFF', 'DRAFT') " +
            "AND i.deleted = false")
    BigDecimal sumCurrent(@Param("today") LocalDate today);

    /**
     * Sum 1-30 days overdue.
     */
    @Query("SELECT COALESCE(SUM(i.amountDue), 0) FROM Invoice i " +
            "WHERE i.dueDate < :today AND i.dueDate >= :thirtyDaysAgo AND i.amountDue > 0 " +
            "AND i.status NOT IN ('VOID', 'WRITTEN_OFF', 'PAID') " +
            "AND i.deleted = false")
    BigDecimal sum1To30DaysOverdue(
            @Param("today") LocalDate today,
            @Param("thirtyDaysAgo") LocalDate thirtyDaysAgo);

    /**
     * Sum 31-60 days overdue.
     */
    @Query("SELECT COALESCE(SUM(i.amountDue), 0) FROM Invoice i " +
            "WHERE i.dueDate < :thirtyDaysAgo AND i.dueDate >= :sixtyDaysAgo AND i.amountDue > 0 " +
            "AND i.status NOT IN ('VOID', 'WRITTEN_OFF', 'PAID') " +
            "AND i.deleted = false")
    BigDecimal sum31To60DaysOverdue(
            @Param("thirtyDaysAgo") LocalDate thirtyDaysAgo,
            @Param("sixtyDaysAgo") LocalDate sixtyDaysAgo);

    /**
     * Sum 61-90 days overdue.
     */
    @Query("SELECT COALESCE(SUM(i.amountDue), 0) FROM Invoice i " +
            "WHERE i.dueDate < :sixtyDaysAgo AND i.dueDate >= :ninetyDaysAgo AND i.amountDue > 0 " +
            "AND i.status NOT IN ('VOID', 'WRITTEN_OFF', 'PAID') " +
            "AND i.deleted = false")
    BigDecimal sum61To90DaysOverdue(
            @Param("sixtyDaysAgo") LocalDate sixtyDaysAgo,
            @Param("ninetyDaysAgo") LocalDate ninetyDaysAgo);

    /**
     * Sum 90+ days overdue.
     */
    @Query("SELECT COALESCE(SUM(i.amountDue), 0) FROM Invoice i " +
            "WHERE i.dueDate < :ninetyDaysAgo AND i.amountDue > 0 " +
            "AND i.status NOT IN ('VOID', 'WRITTEN_OFF', 'PAID') " +
            "AND i.deleted = false")
    BigDecimal sum90PlusDaysOverdue(@Param("ninetyDaysAgo") LocalDate ninetyDaysAgo);

    /**
     * Get recent invoices.
     */
    @Query("SELECT i FROM Invoice i WHERE i.deleted = false ORDER BY i.createdAt DESC LIMIT :limit")
    List<Invoice> findRecent(@Param("limit") int limit);

    /**
     * Find draft invoices.
     */
    @Query("SELECT i FROM Invoice i WHERE i.status = 'DRAFT' AND i.deleted = false ORDER BY i.createdAt DESC")
    List<Invoice> findDrafts();

    // === Tenant-Scoped Methods ===

    /**
     * Get max invoice number suffix for tenant and prefix (for number generation).
     * Extracts the numeric suffix from invoice numbers matching the prefix.
     */
    @Query("SELECT MAX(CAST(SUBSTRING(i.invoiceNumber, LENGTH(:prefix) + 1) AS long)) FROM Invoice i " +
            "WHERE i.tenantId = :tenantId AND i.invoiceNumber LIKE CONCAT(:prefix, '%') AND i.deleted = false")
    Long getMaxInvoiceNumberForTenantAndPrefix(@Param("tenantId") UUID tenantId, @Param("prefix") String prefix);

    /**
     * Find by ID and tenant with lines.
     */
    @Query("SELECT DISTINCT i FROM Invoice i LEFT JOIN FETCH i.lines WHERE i.id = :id AND i.tenantId = :tenantId AND i.deleted = false")
    Optional<Invoice> findByIdAndTenantIdWithLines(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

    /**
     * Find by ID and tenant with all details.
     */
    @Query("SELECT DISTINCT i FROM Invoice i " +
            "LEFT JOIN FETCH i.lines " +
            "LEFT JOIN FETCH i.payments " +
            "LEFT JOIN FETCH i.customer " +
            "WHERE i.id = :id AND i.tenantId = :tenantId AND i.deleted = false")
    Optional<Invoice> findByIdAndTenantIdWithDetails(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

    /**
     * Find by tenant and invoice number.
     */
    @Query("SELECT i FROM Invoice i WHERE i.tenantId = :tenantId AND i.invoiceNumber = :invoiceNumber AND i.deleted = false")
    Optional<Invoice> findByTenantIdAndInvoiceNumberAndDeletedFalse(@Param("tenantId") UUID tenantId, @Param("invoiceNumber") String invoiceNumber);

    /**
     * Find by tenant and customer.
     */
    @Query("SELECT i FROM Invoice i WHERE i.tenantId = :tenantId AND i.customer.id = :customerId AND i.deleted = false ORDER BY i.invoiceDate DESC")
    List<Invoice> findByTenantIdAndCustomer(@Param("tenantId") UUID tenantId, @Param("customerId") UUID customerId);

    /**
     * Search invoices by tenant.
     */
    @Query("SELECT i FROM Invoice i WHERE i.tenantId = :tenantId AND i.deleted = false " +
            "AND (:status IS NULL OR i.status = :status) " +
            "AND (:customerId IS NULL OR i.customer.id = :customerId) " +
            "AND (:startDate IS NULL OR i.invoiceDate >= :startDate) " +
            "AND (:endDate IS NULL OR i.invoiceDate <= :endDate) " +
            "AND (:searchTerm IS NULL OR " +
            "    LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "    LOWER(i.customerName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "    LOWER(i.reference) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "ORDER BY i.invoiceDate DESC")
    Page<Invoice> searchByTenantId(
            @Param("tenantId") UUID tenantId,
            @Param("status") Invoice.InvoiceStatus status,
            @Param("customerId") UUID customerId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("searchTerm") String searchTerm,
            Pageable pageable);

    /**
     * Find overdue invoices by tenant.
     */
    @Query("SELECT i FROM Invoice i WHERE i.tenantId = :tenantId AND i.dueDate < :today AND i.amountDue > 0 " +
            "AND i.status NOT IN ('VOID', 'WRITTEN_OFF', 'PAID') AND i.deleted = false " +
            "ORDER BY i.dueDate")
    List<Invoice> findOverdueByTenantId(@Param("tenantId") UUID tenantId, @Param("today") LocalDate today);

    /**
     * Find by ID and tenant ID.
     */
    @Query("SELECT i FROM Invoice i WHERE i.id = :id AND i.tenantId = :tenantId AND i.deleted = false")
    Optional<Invoice> findByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

    /**
     * Find by ID and tenant with payments.
     */
    @Query("SELECT DISTINCT i FROM Invoice i LEFT JOIN FETCH i.payments WHERE i.id = :id AND i.tenantId = :tenantId AND i.deleted = false")
    Optional<Invoice> findByIdAndTenantIdWithPayments(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

    /**
     * Find unpaid invoices by tenant.
     */
    @Query("SELECT i FROM Invoice i WHERE i.tenantId = :tenantId AND i.amountDue > 0 " +
            "AND i.status NOT IN ('VOID', 'WRITTEN_OFF', 'DRAFT') AND i.deleted = false " +
            "ORDER BY i.dueDate")
    List<Invoice> findUnpaidByTenantId(@Param("tenantId") UUID tenantId);

    /**
     * Find draft invoices by tenant.
     */
    @Query("SELECT i FROM Invoice i WHERE i.tenantId = :tenantId AND i.status = 'DRAFT' AND i.deleted = false ORDER BY i.createdAt DESC")
    List<Invoice> findDraftsByTenantId(@Param("tenantId") UUID tenantId);

    /**
     * Find recent invoices by tenant.
     */
    @Query("SELECT i FROM Invoice i WHERE i.tenantId = :tenantId AND i.deleted = false ORDER BY i.createdAt DESC LIMIT :limit")
    List<Invoice> findRecentByTenantId(@Param("tenantId") UUID tenantId, @Param("limit") int limit);

    /**
     * Count all invoices by tenant.
     */
    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.tenantId = :tenantId AND i.deleted = false")
    long countByTenantId(@Param("tenantId") UUID tenantId);

    /**
     * Count invoices by tenant and status.
     */
    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.tenantId = :tenantId AND i.status = :status AND i.deleted = false")
    long countByTenantIdAndStatus(@Param("tenantId") UUID tenantId, @Param("status") Invoice.InvoiceStatus status);

    /**
     * Count overdue invoices by tenant.
     */
    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.tenantId = :tenantId AND i.dueDate < :today AND i.amountDue > 0 " +
            "AND i.status NOT IN ('VOID', 'WRITTEN_OFF', 'PAID') AND i.deleted = false")
    long countOverdueByTenantId(@Param("tenantId") UUID tenantId, @Param("today") LocalDate today);

    /**
     * Sum outstanding amount by tenant.
     */
    @Query("SELECT COALESCE(SUM(i.amountDue), 0) FROM Invoice i " +
            "WHERE i.tenantId = :tenantId AND i.amountDue > 0 AND i.status NOT IN ('VOID', 'WRITTEN_OFF', 'DRAFT') " +
            "AND i.deleted = false")
    BigDecimal sumOutstandingByTenantId(@Param("tenantId") UUID tenantId);

    /**
     * Sum overdue amount by tenant.
     */
    @Query("SELECT COALESCE(SUM(i.amountDue), 0) FROM Invoice i " +
            "WHERE i.tenantId = :tenantId AND i.dueDate < :today AND i.amountDue > 0 " +
            "AND i.status NOT IN ('VOID', 'WRITTEN_OFF', 'PAID') " +
            "AND i.deleted = false")
    BigDecimal sumOverdueByTenantId(@Param("tenantId") UUID tenantId, @Param("today") LocalDate today);

    /**
     * Sum current (not overdue) by tenant.
     */
    @Query("SELECT COALESCE(SUM(i.amountDue), 0) FROM Invoice i " +
            "WHERE i.tenantId = :tenantId AND i.dueDate >= :today AND i.amountDue > 0 " +
            "AND i.status NOT IN ('VOID', 'WRITTEN_OFF', 'DRAFT') " +
            "AND i.deleted = false")
    BigDecimal sumCurrentByTenantId(@Param("tenantId") UUID tenantId, @Param("today") LocalDate today);

    /**
     * Sum 1-30 days overdue by tenant.
     */
    @Query("SELECT COALESCE(SUM(i.amountDue), 0) FROM Invoice i " +
            "WHERE i.tenantId = :tenantId AND i.dueDate < :today AND i.dueDate >= :thirtyDaysAgo AND i.amountDue > 0 " +
            "AND i.status NOT IN ('VOID', 'WRITTEN_OFF', 'PAID') " +
            "AND i.deleted = false")
    BigDecimal sum1To30DaysOverdueByTenantId(
            @Param("tenantId") UUID tenantId,
            @Param("today") LocalDate today,
            @Param("thirtyDaysAgo") LocalDate thirtyDaysAgo);

    /**
     * Sum 31-60 days overdue by tenant.
     */
    @Query("SELECT COALESCE(SUM(i.amountDue), 0) FROM Invoice i " +
            "WHERE i.tenantId = :tenantId AND i.dueDate < :thirtyDaysAgo AND i.dueDate >= :sixtyDaysAgo AND i.amountDue > 0 " +
            "AND i.status NOT IN ('VOID', 'WRITTEN_OFF', 'PAID') " +
            "AND i.deleted = false")
    BigDecimal sum31To60DaysOverdueByTenantId(
            @Param("tenantId") UUID tenantId,
            @Param("thirtyDaysAgo") LocalDate thirtyDaysAgo,
            @Param("sixtyDaysAgo") LocalDate sixtyDaysAgo);

    /**
     * Sum 61-90 days overdue by tenant.
     */
    @Query("SELECT COALESCE(SUM(i.amountDue), 0) FROM Invoice i " +
            "WHERE i.tenantId = :tenantId AND i.dueDate < :sixtyDaysAgo AND i.dueDate >= :ninetyDaysAgo AND i.amountDue > 0 " +
            "AND i.status NOT IN ('VOID', 'WRITTEN_OFF', 'PAID') " +
            "AND i.deleted = false")
    BigDecimal sum61To90DaysOverdueByTenantId(
            @Param("tenantId") UUID tenantId,
            @Param("sixtyDaysAgo") LocalDate sixtyDaysAgo,
            @Param("ninetyDaysAgo") LocalDate ninetyDaysAgo);

    /**
     * Sum 90+ days overdue by tenant.
     */
    @Query("SELECT COALESCE(SUM(i.amountDue), 0) FROM Invoice i " +
            "WHERE i.tenantId = :tenantId AND i.dueDate < :ninetyDaysAgo AND i.amountDue > 0 " +
            "AND i.status NOT IN ('VOID', 'WRITTEN_OFF', 'PAID') " +
            "AND i.deleted = false")
    BigDecimal sum90PlusDaysOverdueByTenantId(@Param("tenantId") UUID tenantId, @Param("ninetyDaysAgo") LocalDate ninetyDaysAgo);
}
