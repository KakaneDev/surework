package com.surework.accounting.service;

import com.surework.accounting.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Service for generating unique, tenant-scoped invoice numbers.
 * Uses database queries to ensure uniqueness instead of in-memory counters.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class InvoiceNumberService {

    private final InvoiceRepository invoiceRepository;

    /**
     * Generate a unique invoice number for a tenant.
     * Format: INV-YYYYMM-NNNN where NNNN is sequential within tenant/month.
     *
     * <p>Thread-safe via database constraints and transaction isolation.
     */
    @Transactional
    public String generateInvoiceNumber(UUID tenantId) {
        LocalDate now = LocalDate.now();
        String prefix = String.format("INV-%d%02d-", now.getYear(), now.getMonthValue());

        // Get the next sequence number for this tenant/month
        Long maxNumber = invoiceRepository.getMaxInvoiceNumberForTenantAndPrefix(tenantId, prefix);
        long nextNumber = (maxNumber != null ? maxNumber : 0) + 1;

        String invoiceNumber = prefix + String.format("%04d", nextNumber);
        log.debug("Generated invoice number {} for tenant {}", invoiceNumber, tenantId);

        return invoiceNumber;
    }
}
