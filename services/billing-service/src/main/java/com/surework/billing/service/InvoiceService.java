package com.surework.billing.service;

import com.surework.billing.dto.BillingDto.*;
import com.surework.billing.entity.Invoice;
import com.surework.billing.repository.InvoiceRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

@Service
@Transactional
public class InvoiceService {

    private static final Logger log = LoggerFactory.getLogger(InvoiceService.class);

    private final InvoiceRepository invoiceRepository;
    private final AtomicLong invoiceCounter = new AtomicLong(1000);

    public InvoiceService(InvoiceRepository invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
    }

    public InvoiceResponse createInvoice(CreateInvoiceRequest request) {
        Invoice invoice = new Invoice();
        invoice.setTenantId(request.tenantId());
        invoice.setInvoiceNumber(generateInvoiceNumber());
        invoice.setAmount(request.amount());
        invoice.setCurrency(request.currency() != null ? request.currency() : "ZAR");
        invoice.setStatus(Invoice.InvoiceStatus.DRAFT);
        invoice.setDueDate(request.dueDate());

        invoice = invoiceRepository.save(invoice);
        log.info("Created invoice {} for tenant {}", invoice.getInvoiceNumber(), request.tenantId());

        return InvoiceResponse.from(invoice);
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoice(UUID id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Invoice not found: " + id));
        return InvoiceResponse.from(invoice);
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceByNumber(String invoiceNumber) {
        Invoice invoice = invoiceRepository.findByInvoiceNumber(invoiceNumber)
                .orElseThrow(() -> new EntityNotFoundException("Invoice not found: " + invoiceNumber));
        return InvoiceResponse.from(invoice);
    }

    @Transactional(readOnly = true)
    public PagedResponse<InvoiceResponse> listInvoices(UUID tenantId, Invoice.InvoiceStatus status, Pageable pageable) {
        Page<Invoice> page;
        if (tenantId != null) {
            page = invoiceRepository.findByTenantId(tenantId, pageable);
        } else if (status != null) {
            page = invoiceRepository.findByStatus(status, pageable);
        } else {
            page = invoiceRepository.findAll(pageable);
        }

        List<InvoiceResponse> content = page.getContent().stream()
                .map(InvoiceResponse::from)
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
    public List<InvoiceResponse> getRecentInvoices(UUID tenantId, int limit) {
        return invoiceRepository.findRecentInvoices(tenantId, PageRequest.of(0, limit))
                .stream()
                .map(InvoiceResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getOverdueInvoices() {
        return invoiceRepository.findOverdueInvoices(LocalDate.now())
                .stream()
                .map(InvoiceResponse::from)
                .toList();
    }

    public InvoiceResponse updateInvoiceStatus(UUID id, UpdateInvoiceStatusRequest request) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Invoice not found: " + id));

        Invoice.InvoiceStatus oldStatus = invoice.getStatus();
        invoice.setStatus(request.status());

        if (request.status() == Invoice.InvoiceStatus.PAID) {
            invoice.setPaidAt(Instant.now());
        }

        invoice = invoiceRepository.save(invoice);
        log.info("Updated invoice {} status from {} to {}", invoice.getInvoiceNumber(), oldStatus, request.status());

        return InvoiceResponse.from(invoice);
    }

    public InvoiceResponse sendInvoice(UUID id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Invoice not found: " + id));

        if (invoice.getStatus() != Invoice.InvoiceStatus.DRAFT) {
            throw new IllegalArgumentException("Can only send draft invoices");
        }

        invoice.setStatus(Invoice.InvoiceStatus.PENDING);
        invoice = invoiceRepository.save(invoice);

        // TODO: Send invoice email notification
        log.info("Sent invoice {} to tenant {}", invoice.getInvoiceNumber(), invoice.getTenantId());

        return InvoiceResponse.from(invoice);
    }

    public InvoiceResponse cancelInvoice(UUID id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Invoice not found: " + id));

        if (invoice.getStatus() == Invoice.InvoiceStatus.PAID) {
            throw new IllegalArgumentException("Cannot cancel paid invoice");
        }

        invoice.setStatus(Invoice.InvoiceStatus.CANCELLED);
        invoice = invoiceRepository.save(invoice);

        log.info("Cancelled invoice {}", invoice.getInvoiceNumber());

        return InvoiceResponse.from(invoice);
    }

    @Transactional(readOnly = true)
    public RevenueMetrics getRevenueMetrics() {
        Instant startOfMonth = YearMonth.now().atDay(1).atStartOfDay().toInstant(java.time.ZoneOffset.UTC);
        Instant now = Instant.now();

        BigDecimal monthlyRevenue = invoiceRepository.sumPaidInvoicesBetween(startOfMonth, now);
        BigDecimal pendingRevenue = invoiceRepository.sumPendingInvoices();
        BigDecimal overdueRevenue = invoiceRepository.sumOverdueInvoices();

        Long paidCount = invoiceRepository.countByStatus(Invoice.InvoiceStatus.PAID);
        Long pendingCount = invoiceRepository.countByStatus(Invoice.InvoiceStatus.PENDING);
        Long overdueCount = invoiceRepository.countByStatus(Invoice.InvoiceStatus.OVERDUE);

        BigDecimal mrr = monthlyRevenue != null ? monthlyRevenue : BigDecimal.ZERO;
        BigDecimal arr = mrr.multiply(BigDecimal.valueOf(12));

        return new RevenueMetrics(
                mrr,
                arr,
                mrr,
                pendingRevenue != null ? pendingRevenue : BigDecimal.ZERO,
                overdueRevenue != null ? overdueRevenue : BigDecimal.ZERO,
                paidCount + pendingCount + overdueCount,
                paidCount,
                pendingCount,
                overdueCount
        );
    }

    @Transactional(readOnly = true)
    public List<RevenueTrend> getMonthlyRevenueTrends(int months) {
        return invoiceRepository.getMonthlyInvoiceTotals(PageRequest.of(0, months)).stream()
                .map(row -> new RevenueTrend(
                        row[0] + "-" + String.format("%02d", row[1]),
                        (BigDecimal) row[2],
                        ((Number) row[3]).longValue()
                ))
                .toList();
    }

    private String generateInvoiceNumber() {
        String prefix = "INV";
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        long sequence = invoiceCounter.getAndIncrement();
        return String.format("%s-%s-%05d", prefix, date, sequence);
    }

    // Scheduled job to mark overdue invoices
    @Scheduled(cron = "0 0 0 * * *") // Every day at midnight
    public void markOverdueInvoices() {
        LocalDate today = LocalDate.now();
        List<Invoice> overdueInvoices = invoiceRepository.findOverdueInvoices(today);

        for (Invoice invoice : overdueInvoices) {
            invoice.setStatus(Invoice.InvoiceStatus.OVERDUE);
            invoiceRepository.save(invoice);
            log.info("Marked invoice {} as overdue", invoice.getInvoiceNumber());
        }
    }
}
