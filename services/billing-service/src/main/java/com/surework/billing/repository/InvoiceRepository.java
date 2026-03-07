package com.surework.billing.repository;

import com.surework.billing.entity.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    Page<Invoice> findByTenantId(UUID tenantId, Pageable pageable);

    Page<Invoice> findByStatus(Invoice.InvoiceStatus status, Pageable pageable);

    List<Invoice> findByTenantIdAndStatus(UUID tenantId, Invoice.InvoiceStatus status);

    @Query("SELECT i FROM Invoice i WHERE i.status = 'PENDING' AND i.dueDate < :today")
    List<Invoice> findOverdueInvoices(@Param("today") LocalDate today);

    @Query("SELECT i FROM Invoice i WHERE i.tenantId = :tenantId ORDER BY i.createdAt DESC")
    List<Invoice> findRecentInvoices(@Param("tenantId") UUID tenantId, Pageable pageable);

    @Query("SELECT SUM(i.amount) FROM Invoice i WHERE i.status = 'PAID' AND i.paidAt >= :startDate AND i.paidAt < :endDate")
    BigDecimal sumPaidInvoicesBetween(@Param("startDate") Instant startDate, @Param("endDate") Instant endDate);

    @Query("SELECT SUM(i.amount) FROM Invoice i WHERE i.status = 'PENDING'")
    BigDecimal sumPendingInvoices();

    @Query("SELECT SUM(i.amount) FROM Invoice i WHERE i.status = 'OVERDUE'")
    BigDecimal sumOverdueInvoices();

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.status = :status")
    Long countByStatus(@Param("status") Invoice.InvoiceStatus status);

    @Query("SELECT i.status, COUNT(i), SUM(i.amount) FROM Invoice i " +
           "WHERE i.createdAt >= :startDate GROUP BY i.status")
    List<Object[]> getInvoiceStatsByStatus(@Param("startDate") Instant startDate);

    @Query("SELECT FUNCTION('YEAR', i.createdAt) as year, FUNCTION('MONTH', i.createdAt) as month, " +
           "SUM(i.amount) as totalAmount, COUNT(i) as invoiceCount " +
           "FROM Invoice i WHERE i.status = 'PAID' " +
           "GROUP BY FUNCTION('YEAR', i.createdAt), FUNCTION('MONTH', i.createdAt) " +
           "ORDER BY year DESC, month DESC")
    List<Object[]> getMonthlyInvoiceTotals(Pageable pageable);

    boolean existsByInvoiceNumber(String invoiceNumber);
}
