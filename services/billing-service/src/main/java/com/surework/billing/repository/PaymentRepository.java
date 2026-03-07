package com.surework.billing.repository;

import com.surework.billing.entity.Payment;
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
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Page<Payment> findByTenantId(UUID tenantId, Pageable pageable);

    List<Payment> findByTenantIdAndStatus(UUID tenantId, Payment.PaymentStatus status);

    Optional<Payment> findByExternalId(String externalId);

    Page<Payment> findByStatus(Payment.PaymentStatus status, Pageable pageable);

    Optional<Payment> findByInvoiceId(UUID invoiceId);

    @Query("SELECT p FROM Payment p WHERE p.tenantId = :tenantId ORDER BY p.createdAt DESC")
    List<Payment> findRecentPayments(@Param("tenantId") UUID tenantId, Pageable pageable);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = 'COMPLETED' AND p.processedAt >= :startDate AND p.processedAt < :endDate")
    BigDecimal sumCompletedPaymentsBetween(@Param("startDate") Instant startDate, @Param("endDate") Instant endDate);

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.status = 'COMPLETED' AND p.processedAt >= :startDate AND p.processedAt < :endDate")
    Long countCompletedPaymentsBetween(@Param("startDate") Instant startDate, @Param("endDate") Instant endDate);

    @Query("SELECT p FROM Payment p WHERE p.status = 'FAILED' AND p.createdAt >= :since ORDER BY p.createdAt DESC")
    Page<Payment> findRecentFailedPayments(@Param("since") Instant since, Pageable pageable);

    @Query("SELECT p.paymentMethod, COUNT(p), SUM(p.amount) FROM Payment p " +
           "WHERE p.status = 'COMPLETED' AND p.processedAt >= :startDate " +
           "GROUP BY p.paymentMethod")
    List<Object[]> getPaymentMethodStats(@Param("startDate") Instant startDate);

    @Query("SELECT FUNCTION('DATE', p.processedAt) as paymentDate, SUM(p.amount) as totalAmount " +
           "FROM Payment p WHERE p.status = 'COMPLETED' " +
           "AND p.processedAt >= :startDate AND p.processedAt < :endDate " +
           "GROUP BY FUNCTION('DATE', p.processedAt) " +
           "ORDER BY paymentDate")
    List<Object[]> getDailyPaymentTotals(@Param("startDate") Instant startDate, @Param("endDate") Instant endDate);
}
