package com.surework.billing.service;

import com.surework.billing.dto.BillingDto.*;
import com.surework.billing.entity.Invoice;
import com.surework.billing.entity.Payment;
import com.surework.billing.repository.InvoiceRepository;
import com.surework.billing.repository.PaymentRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;

    public PaymentService(PaymentRepository paymentRepository, InvoiceRepository invoiceRepository) {
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
    }

    public PaymentResponse createPayment(CreatePaymentRequest request) {
        Payment payment = new Payment();
        payment.setTenantId(request.tenantId());
        payment.setAmount(request.amount());
        payment.setCurrency(request.currency() != null ? request.currency() : "ZAR");
        payment.setPaymentMethod(request.paymentMethod());
        payment.setInvoiceId(request.invoiceId());
        payment.setExternalId(request.externalId());
        payment.setStatus(Payment.PaymentStatus.PENDING);

        payment = paymentRepository.save(payment);
        log.info("Created payment {} for tenant {}", payment.getId(), request.tenantId());

        return PaymentResponse.from(payment);
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPayment(UUID id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Payment not found: " + id));
        return PaymentResponse.from(payment);
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByExternalId(String externalId) {
        Payment payment = paymentRepository.findByExternalId(externalId)
                .orElseThrow(() -> new EntityNotFoundException("Payment not found with external ID: " + externalId));
        return PaymentResponse.from(payment);
    }

    @Transactional(readOnly = true)
    public PagedResponse<PaymentResponse> listPayments(UUID tenantId, Payment.PaymentStatus status, Pageable pageable) {
        Page<Payment> page;
        if (tenantId != null) {
            page = paymentRepository.findByTenantId(tenantId, pageable);
        } else if (status != null) {
            page = paymentRepository.findByStatus(status, pageable);
        } else {
            page = paymentRepository.findAll(pageable);
        }

        List<PaymentResponse> content = page.getContent().stream()
                .map(PaymentResponse::from)
                .toList();

        return new PagedResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast()
        );
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getRecentPayments(UUID tenantId, int limit) {
        return paymentRepository.findRecentPayments(tenantId, PageRequest.of(0, limit))
                .stream()
                .map(PaymentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public PagedResponse<PaymentResponse> getFailedPayments(int days, Pageable pageable) {
        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);
        Page<Payment> page = paymentRepository.findRecentFailedPayments(since, pageable);

        List<PaymentResponse> content = page.getContent().stream()
                .map(PaymentResponse::from)
                .toList();

        return new PagedResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast()
        );
    }

    public PaymentResponse updatePaymentStatus(UUID id, UpdatePaymentStatusRequest request) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Payment not found: " + id));

        Payment.PaymentStatus oldStatus = payment.getStatus();
        payment.setStatus(request.status());

        if (request.status() == Payment.PaymentStatus.COMPLETED) {
            payment.setProcessedAt(Instant.now());
            // Update associated invoice if exists
            if (payment.getInvoiceId() != null) {
                invoiceRepository.findById(payment.getInvoiceId()).ifPresent(invoice -> {
                    invoice.setStatus(Invoice.InvoiceStatus.PAID);
                    invoice.setPaidAt(Instant.now());
                    invoiceRepository.save(invoice);
                });
            }
        } else if (request.status() == Payment.PaymentStatus.FAILED) {
            payment.setFailureReason(request.failureReason());
            payment.setProcessedAt(Instant.now());
        }

        payment = paymentRepository.save(payment);
        log.info("Updated payment {} status from {} to {}", id, oldStatus, request.status());

        return PaymentResponse.from(payment);
    }

    public PaymentResponse processRefund(UUID id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Payment not found: " + id));

        if (payment.getStatus() != Payment.PaymentStatus.COMPLETED) {
            throw new IllegalArgumentException("Can only refund completed payments");
        }

        payment.setStatus(Payment.PaymentStatus.REFUNDED);
        payment.setProcessedAt(Instant.now());

        payment = paymentRepository.save(payment);
        log.info("Refunded payment {}", id);

        return PaymentResponse.from(payment);
    }

    /**
     * Retry a failed payment by creating a new payment attempt.
     * The original failed payment is preserved for audit purposes.
     */
    public PaymentResponse retryPayment(UUID id) {
        Payment originalPayment = paymentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Payment not found: " + id));

        if (originalPayment.getStatus() != Payment.PaymentStatus.FAILED) {
            throw new IllegalArgumentException("Can only retry failed payments");
        }

        // Create a new payment attempt
        Payment retryPayment = new Payment();
        retryPayment.setTenantId(originalPayment.getTenantId());
        retryPayment.setAmount(originalPayment.getAmount());
        retryPayment.setCurrency(originalPayment.getCurrency());
        retryPayment.setPaymentMethod(originalPayment.getPaymentMethod());
        retryPayment.setInvoiceId(originalPayment.getInvoiceId());
        retryPayment.setStatus(Payment.PaymentStatus.PENDING);
        // Link to original payment in external ID for tracking
        retryPayment.setExternalId("retry_" + originalPayment.getId().toString());

        retryPayment = paymentRepository.save(retryPayment);
        log.info("Created retry payment {} for failed payment {}", retryPayment.getId(), id);

        // TODO: Integrate with payment gateway to actually process the retry
        // For now, we return the new pending payment

        return PaymentResponse.from(retryPayment);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalPayments(Instant startDate, Instant endDate) {
        BigDecimal total = paymentRepository.sumCompletedPaymentsBetween(startDate, endDate);
        return total != null ? total : BigDecimal.ZERO;
    }

    @Transactional(readOnly = true)
    public Long getPaymentCount(Instant startDate, Instant endDate) {
        Long count = paymentRepository.countCompletedPaymentsBetween(startDate, endDate);
        return count != null ? count : 0L;
    }

    @Transactional(readOnly = true)
    public List<PaymentMethodStats> getPaymentMethodStats(int days) {
        Instant startDate = Instant.now().minus(days, ChronoUnit.DAYS);
        return paymentRepository.getPaymentMethodStats(startDate).stream()
                .map(row -> new PaymentMethodStats(
                        (String) row[0],
                        (Long) row[1],
                        (BigDecimal) row[2]
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RevenueTrend> getDailyPaymentTrends(int days) {
        Instant startDate = Instant.now().minus(days, ChronoUnit.DAYS);
        Instant endDate = Instant.now();
        return paymentRepository.getDailyPaymentTotals(startDate, endDate).stream()
                .map(row -> new RevenueTrend(
                        row[0].toString(),
                        (BigDecimal) row[1],
                        0L
                ))
                .toList();
    }
}
