package com.surework.accounting.service;

import com.surework.accounting.domain.*;
import com.surework.accounting.dto.InvoiceDto;
import com.surework.accounting.repository.*;
import com.surework.common.web.exception.BusinessRuleException;
import com.surework.common.web.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementation of InvoiceService.
 * Handles invoice lifecycle, payments, and auto-journaling.
 * All methods enforce tenant isolation for multi-tenant security.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class InvoiceServiceImpl implements InvoiceService {

    private final CustomerRepository customerRepository;
    private final InvoiceRepository invoiceRepository;
    private final AccountRepository accountRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final FiscalPeriodRepository fiscalPeriodRepository;
    private final InvoiceNumberService invoiceNumberService;

    // Default account codes for auto-journaling
    private static final String ACCOUNTS_RECEIVABLE_CODE = "1200";
    private static final String SALES_REVENUE_CODE = "4000";
    private static final String VAT_OUTPUT_CODE = "2200";

    // === Customer Operations ===

    @Override
    @Transactional
    public InvoiceDto.CustomerResponse createCustomer(UUID tenantId, InvoiceDto.CreateCustomerRequest request) {
        if (customerRepository.existsByTenantIdAndCustomerCode(tenantId, request.customerCode())) {
            throw new BusinessRuleException("Customer code already exists: " + request.customerCode());
        }

        Customer customer = Customer.create(request.customerCode(), request.customerName());
        customer.setTenantId(tenantId);
        customer.setTradingName(request.tradingName());
        customer.setEmail(request.email());
        customer.setPhone(request.phone());
        customer.setMobile(request.mobile());
        customer.setContactPerson(request.contactPerson());
        customer.setContactEmail(request.contactEmail());
        customer.setAddressLine1(request.addressLine1());
        customer.setAddressLine2(request.addressLine2());
        customer.setCity(request.city());
        customer.setProvince(request.province());
        customer.setPostalCode(request.postalCode());
        customer.setCountry(request.country() != null ? request.country() : "South Africa");
        customer.setVatNumber(request.vatNumber());
        customer.setTaxExempt(request.taxExempt());
        customer.setPaymentTerms(request.paymentTerms() != null ? request.paymentTerms() : 30);
        customer.setCreditLimit(request.creditLimit() != null ? request.creditLimit() : BigDecimal.ZERO);
        customer.setNotes(request.notes());

        if (request.defaultRevenueAccountId() != null) {
            Account revenueAccount = accountRepository.findByIdAndTenantId(request.defaultRevenueAccountId(), tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Account", request.defaultRevenueAccountId()));
            customer.setDefaultRevenueAccount(revenueAccount);
        }

        if (request.defaultReceivableAccountId() != null) {
            Account receivableAccount = accountRepository.findByIdAndTenantId(request.defaultReceivableAccountId(), tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Account", request.defaultReceivableAccountId()));
            customer.setDefaultReceivableAccount(receivableAccount);
        }

        customer = customerRepository.save(customer);
        log.info("Created customer: {} - {} for tenant: {}", customer.getCustomerCode(), customer.getCustomerName(), tenantId);

        return InvoiceDto.CustomerResponse.fromEntity(customer);
    }

    @Override
    @Transactional
    public InvoiceDto.CustomerResponse updateCustomer(UUID tenantId, UUID customerId, InvoiceDto.UpdateCustomerRequest request) {
        Customer customer = customerRepository.findByIdAndTenantId(customerId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", customerId));

        if (request.customerName() != null) customer.setCustomerName(request.customerName());
        if (request.tradingName() != null) customer.setTradingName(request.tradingName());
        if (request.email() != null) customer.setEmail(request.email());
        if (request.phone() != null) customer.setPhone(request.phone());
        if (request.mobile() != null) customer.setMobile(request.mobile());
        if (request.contactPerson() != null) customer.setContactPerson(request.contactPerson());
        if (request.contactEmail() != null) customer.setContactEmail(request.contactEmail());
        if (request.addressLine1() != null) customer.setAddressLine1(request.addressLine1());
        if (request.addressLine2() != null) customer.setAddressLine2(request.addressLine2());
        if (request.city() != null) customer.setCity(request.city());
        if (request.province() != null) customer.setProvince(request.province());
        if (request.postalCode() != null) customer.setPostalCode(request.postalCode());
        if (request.country() != null) customer.setCountry(request.country());
        if (request.billingAddressLine1() != null) customer.setBillingAddressLine1(request.billingAddressLine1());
        if (request.billingAddressLine2() != null) customer.setBillingAddressLine2(request.billingAddressLine2());
        if (request.billingCity() != null) customer.setBillingCity(request.billingCity());
        if (request.billingProvince() != null) customer.setBillingProvince(request.billingProvince());
        if (request.billingPostalCode() != null) customer.setBillingPostalCode(request.billingPostalCode());
        if (request.billingCountry() != null) customer.setBillingCountry(request.billingCountry());
        if (request.vatNumber() != null) customer.setVatNumber(request.vatNumber());
        customer.setTaxExempt(request.taxExempt());
        if (request.paymentTerms() != null) customer.setPaymentTerms(request.paymentTerms());
        if (request.creditLimit() != null) customer.setCreditLimit(request.creditLimit());
        if (request.active() != null) customer.setActive(request.active());
        if (request.notes() != null) customer.setNotes(request.notes());

        customer = customerRepository.save(customer);
        log.info("Updated customer: {} for tenant: {}", customer.getCustomerCode(), tenantId);

        return InvoiceDto.CustomerResponse.fromEntity(customer);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<InvoiceDto.CustomerResponse> getCustomer(UUID tenantId, UUID customerId) {
        return customerRepository.findByIdAndTenantId(customerId, tenantId)
                .filter(c -> !c.isDeleted())
                .map(InvoiceDto.CustomerResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<InvoiceDto.CustomerResponse> getCustomerByCode(UUID tenantId, String customerCode) {
        return customerRepository.findByTenantIdAndCustomerCodeAndDeletedFalse(tenantId, customerCode)
                .map(InvoiceDto.CustomerResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceDto.CustomerResponse> getAllCustomers(UUID tenantId) {
        return customerRepository.findAllActiveByTenantId(tenantId).stream()
                .map(InvoiceDto.CustomerResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceDto.CustomerSummary> getActiveCustomers(UUID tenantId) {
        return customerRepository.findAllActiveByTenantId(tenantId).stream()
                .map(InvoiceDto.CustomerSummary::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InvoiceDto.CustomerResponse> searchCustomers(UUID tenantId, String searchTerm, boolean activeOnly, Pageable pageable) {
        return customerRepository.searchByTenantId(tenantId, searchTerm, activeOnly, pageable)
                .map(InvoiceDto.CustomerResponse::fromEntity);
    }

    @Override
    @Transactional
    public void deactivateCustomer(UUID tenantId, UUID customerId) {
        Customer customer = customerRepository.findByIdAndTenantId(customerId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", customerId));
        customer.setActive(false);
        customerRepository.save(customer);
        log.info("Deactivated customer: {} for tenant: {}", customer.getCustomerCode(), tenantId);
    }

    @Override
    @Transactional
    public void activateCustomer(UUID tenantId, UUID customerId) {
        Customer customer = customerRepository.findByIdAndTenantId(customerId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", customerId));
        customer.setActive(true);
        customerRepository.save(customer);
        log.info("Activated customer: {} for tenant: {}", customer.getCustomerCode(), tenantId);
    }

    // === Invoice Operations ===

    @Override
    @Transactional
    public InvoiceDto.InvoiceResponse createInvoice(UUID tenantId, InvoiceDto.CreateInvoiceRequest request) {
        Customer customer = customerRepository.findByIdAndTenantId(request.customerId(), tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", request.customerId()));

        Invoice invoice = Invoice.create(customer, request.invoiceDate());
        invoice.setTenantId(tenantId);
        invoice.setInvoiceNumber(generateInvoiceNumber(tenantId));

        if (request.dueDate() != null) {
            invoice.setDueDate(request.dueDate());
        }
        if (request.invoiceType() != null) {
            invoice.setInvoiceType(request.invoiceType());
        }
        invoice.setReference(request.reference());
        invoice.setPurchaseOrder(request.purchaseOrder());
        invoice.setNotes(request.notes());
        invoice.setTermsAndConditions(request.termsAndConditions());
        invoice.setFooterText(request.footerText());
        invoice.setInternalNotes(request.internalNotes());

        if (request.discountPercentage() != null) {
            invoice.setDiscountPercentage(request.discountPercentage());
        }
        if (request.discountAmount() != null) {
            invoice.setDiscountAmount(request.discountAmount());
        }

        // Add line items
        for (InvoiceDto.CreateInvoiceLineRequest lineRequest : request.lines()) {
            InvoiceLine line = createInvoiceLine(tenantId, lineRequest, customer);
            invoice.addLine(line);
        }

        invoice = invoiceRepository.save(invoice);
        log.info("Created invoice: {} for customer {} in tenant: {}", invoice.getInvoiceNumber(), customer.getCustomerCode(), tenantId);

        return InvoiceDto.InvoiceResponse.fromEntity(invoice);
    }

    private InvoiceLine createInvoiceLine(UUID tenantId, InvoiceDto.CreateInvoiceLineRequest request, Customer customer) {
        InvoiceLine.VatCategory vatCategory = request.vatCategory() != null
                ? request.vatCategory()
                : (customer.isTaxExempt() ? InvoiceLine.VatCategory.EXEMPT : InvoiceLine.VatCategory.STANDARD);

        InvoiceLine line = InvoiceLine.create(
                request.description(),
                request.quantity(),
                request.unitPrice(),
                vatCategory
        );

        line.setProductId(request.productId());
        line.setProductCode(request.productCode());
        line.setProductName(request.productName());
        line.setUnitOfMeasure(request.unitOfMeasure());

        if (request.discountPercentage() != null) {
            line.applyDiscountPercentage(request.discountPercentage());
        } else if (request.discountAmount() != null) {
            line.applyDiscountAmount(request.discountAmount());
        }

        if (request.revenueAccountId() != null) {
            Account revenueAccount = accountRepository.findByIdAndTenantId(request.revenueAccountId(), tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Account", request.revenueAccountId()));
            line.setRevenueAccount(revenueAccount);
        } else if (customer.getDefaultRevenueAccount() != null) {
            line.setRevenueAccount(customer.getDefaultRevenueAccount());
        }

        return line;
    }

    @Override
    @Transactional
    public InvoiceDto.InvoiceResponse updateInvoice(UUID tenantId, UUID invoiceId, InvoiceDto.UpdateInvoiceRequest request) {
        Invoice invoice = invoiceRepository.findByIdAndTenantIdWithLines(invoiceId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", invoiceId));

        if (!invoice.isEditable()) {
            throw new BusinessRuleException("Invoice cannot be edited in status: " + invoice.getStatus());
        }

        if (request.invoiceDate() != null) invoice.setInvoiceDate(request.invoiceDate());
        if (request.dueDate() != null) invoice.setDueDate(request.dueDate());
        if (request.reference() != null) invoice.setReference(request.reference());
        if (request.purchaseOrder() != null) invoice.setPurchaseOrder(request.purchaseOrder());
        if (request.notes() != null) invoice.setNotes(request.notes());
        if (request.termsAndConditions() != null) invoice.setTermsAndConditions(request.termsAndConditions());
        if (request.footerText() != null) invoice.setFooterText(request.footerText());
        if (request.internalNotes() != null) invoice.setInternalNotes(request.internalNotes());
        if (request.discountPercentage() != null) invoice.setDiscountPercentage(request.discountPercentage());
        if (request.discountAmount() != null) invoice.setDiscountAmount(request.discountAmount());

        // Update lines if provided
        if (request.lines() != null) {
            invoice.getLines().clear();
            for (InvoiceDto.CreateInvoiceLineRequest lineRequest : request.lines()) {
                InvoiceLine line = createInvoiceLine(tenantId, lineRequest, invoice.getCustomer());
                invoice.addLine(line);
            }
        }

        invoice.recalculateTotals();
        invoice = invoiceRepository.save(invoice);
        log.info("Updated invoice: {} for tenant: {}", invoice.getInvoiceNumber(), tenantId);

        return InvoiceDto.InvoiceResponse.fromEntity(invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<InvoiceDto.InvoiceResponse> getInvoice(UUID tenantId, UUID invoiceId) {
        return invoiceRepository.findByIdAndTenantIdWithDetails(invoiceId, tenantId)
                .map(InvoiceDto.InvoiceResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<InvoiceDto.InvoiceResponse> getInvoiceByNumber(UUID tenantId, String invoiceNumber) {
        return invoiceRepository.findByTenantIdAndInvoiceNumberAndDeletedFalse(tenantId, invoiceNumber)
                .map(InvoiceDto.InvoiceResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceDto.InvoiceSummary> getInvoicesByCustomer(UUID tenantId, UUID customerId) {
        return invoiceRepository.findByTenantIdAndCustomer(tenantId, customerId).stream()
                .map(InvoiceDto.InvoiceSummary::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InvoiceDto.InvoiceSummary> searchInvoices(
            UUID tenantId,
            Invoice.InvoiceStatus status,
            UUID customerId,
            LocalDate startDate,
            LocalDate endDate,
            String searchTerm,
            Pageable pageable) {
        return invoiceRepository.searchByTenantId(tenantId, status, customerId, startDate, endDate, searchTerm, pageable)
                .map(InvoiceDto.InvoiceSummary::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceDto.InvoiceSummary> getOverdueInvoices(UUID tenantId) {
        return invoiceRepository.findOverdueByTenantId(tenantId, LocalDate.now()).stream()
                .map(InvoiceDto.InvoiceSummary::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceDto.InvoiceSummary> getUnpaidInvoices(UUID tenantId) {
        return invoiceRepository.findUnpaidByTenantId(tenantId).stream()
                .map(InvoiceDto.InvoiceSummary::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceDto.InvoiceSummary> getDraftInvoices(UUID tenantId) {
        return invoiceRepository.findDraftsByTenantId(tenantId).stream()
                .map(InvoiceDto.InvoiceSummary::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceDto.InvoiceSummary> getRecentInvoices(UUID tenantId, int limit) {
        return invoiceRepository.findRecentByTenantId(tenantId, limit).stream()
                .map(InvoiceDto.InvoiceSummary::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public void deleteInvoice(UUID tenantId, UUID invoiceId) {
        Invoice invoice = invoiceRepository.findByIdAndTenantId(invoiceId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", invoiceId));

        if (!invoice.isEditable()) {
            throw new BusinessRuleException("Cannot delete invoice in status: " + invoice.getStatus());
        }

        invoice.setDeleted(true);
        invoice.setDeletedAt(Instant.now());
        invoiceRepository.save(invoice);
        log.info("Deleted invoice: {} for tenant: {}", invoice.getInvoiceNumber(), tenantId);
    }

    // === Invoice Actions ===

    @Override
    @Transactional
    public InvoiceDto.InvoiceResponse sendInvoice(UUID tenantId, UUID invoiceId, InvoiceDto.SendInvoiceRequest request, UUID sentBy) {
        Invoice invoice = invoiceRepository.findByIdAndTenantIdWithLines(invoiceId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", invoiceId));

        // Post to accounting if not already posted
        if (invoice.getJournalEntry() == null) {
            createJournalEntryForInvoice(tenantId, invoice, sentBy);
        }

        invoice.markAsSent(sentBy, request.toEmail());

        // TODO: Actually send email via notification service

        invoice = invoiceRepository.save(invoice);
        log.info("Sent invoice {} to {} for tenant: {}", invoice.getInvoiceNumber(), request.toEmail(), tenantId);

        return InvoiceDto.InvoiceResponse.fromEntity(invoice);
    }

    @Override
    @Transactional
    public InvoiceDto.InvoiceResponse postInvoice(UUID tenantId, UUID invoiceId, UUID postedBy) {
        Invoice invoice = invoiceRepository.findByIdAndTenantIdWithLines(invoiceId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", invoiceId));

        if (invoice.getJournalEntry() != null) {
            throw new BusinessRuleException("Invoice has already been posted");
        }

        createJournalEntryForInvoice(tenantId, invoice, postedBy);
        invoice = invoiceRepository.save(invoice);

        log.info("Posted invoice {} to accounting for tenant: {}", invoice.getInvoiceNumber(), tenantId);
        return InvoiceDto.InvoiceResponse.fromEntity(invoice);
    }

    private void createJournalEntryForInvoice(UUID tenantId, Invoice invoice, UUID postedBy) {
        // Create journal entry: DR Accounts Receivable, CR Sales Revenue, CR VAT Output
        JournalEntry entry = JournalEntry.create(
                invoice.getInvoiceDate(),
                "Invoice " + invoice.getInvoiceNumber() + " - " + invoice.getCustomerName(),
                JournalEntry.EntryType.INVOICE
        );
        entry.setTenantId(tenantId);

        entry.setReference(invoice.getInvoiceNumber());
        entry.setSourceDocument("INVOICE");
        entry.setSourceId(invoice.getId());

        // Debit: Accounts Receivable
        Account receivableAccount = getReceivableAccount(tenantId, invoice.getCustomer());
        entry.addDebit(receivableAccount, invoice.getTotal(), "Accounts Receivable - " + invoice.getCustomerName());

        // Credit: Revenue (by line if multiple accounts, or total if single)
        Account defaultRevenueAccount = getRevenueAccount(tenantId, invoice.getCustomer());
        BigDecimal totalRevenue = invoice.getSubtotalAfterDiscount();
        entry.addCredit(defaultRevenueAccount, totalRevenue, "Sales Revenue");

        // Credit: VAT Output
        if (invoice.getVatAmount().compareTo(BigDecimal.ZERO) > 0) {
            Account vatAccount = getVatOutputAccount(tenantId);
            entry.addCredit(vatAccount, invoice.getVatAmount(), "VAT Output");
        }

        // Get current fiscal period
        FiscalPeriod period = fiscalPeriodRepository.findByTenantIdAndDate(tenantId, invoice.getInvoiceDate())
                .orElseThrow(() -> new BusinessRuleException("No fiscal period found for date: " + invoice.getInvoiceDate()));

        // Post the entry
        entry.post(postedBy, period);
        entry = journalEntryRepository.save(entry);

        invoice.setJournalEntry(entry);
        invoice.setPostedAt(Instant.now());
        invoice.setPostedBy(postedBy);
    }

    @Override
    @Transactional
    public InvoiceDto.InvoiceResponse recordPayment(UUID tenantId, UUID invoiceId, InvoiceDto.RecordPaymentRequest request) {
        Invoice invoice = invoiceRepository.findByIdAndTenantIdWithPayments(invoiceId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", invoiceId));

        if (invoice.getStatus() == Invoice.InvoiceStatus.VOID ||
            invoice.getStatus() == Invoice.InvoiceStatus.WRITTEN_OFF) {
            throw new BusinessRuleException("Cannot record payment on voided/written-off invoice");
        }

        if (request.amount().compareTo(invoice.getAmountDue()) > 0) {
            throw new BusinessRuleException("Payment amount exceeds amount due");
        }

        InvoicePayment payment = InvoicePayment.create(
                request.paymentDate(),
                request.amount(),
                request.paymentMethod(),
                request.reference()
        );
        payment.setNotes(request.notes());

        if (request.bankAccountId() != null) {
            // TODO: Link bank account
        }

        invoice.recordPayment(payment);

        // Create payment journal entry: DR Cash/Bank, CR Accounts Receivable
        JournalEntry paymentEntry = JournalEntry.create(
                request.paymentDate(),
                "Payment received - Invoice " + invoice.getInvoiceNumber(),
                JournalEntry.EntryType.PAYMENT
        );
        paymentEntry.setTenantId(tenantId);

        Account cashAccount = getCashAccount(tenantId);
        Account receivableAccount = getReceivableAccount(tenantId, invoice.getCustomer());

        paymentEntry.addDebit(cashAccount, request.amount(), "Cash received");
        paymentEntry.addCredit(receivableAccount, request.amount(), "Accounts Receivable - " + invoice.getCustomerName());

        FiscalPeriod period = fiscalPeriodRepository.findByTenantIdAndDate(tenantId, request.paymentDate())
                .orElseThrow(() -> new BusinessRuleException("No fiscal period found for date: " + request.paymentDate()));
        paymentEntry.post(null, period);
        paymentEntry = journalEntryRepository.save(paymentEntry);

        payment.setJournalEntry(paymentEntry);

        invoice = invoiceRepository.save(invoice);
        log.info("Recorded payment of {} for invoice {} in tenant: {}", request.amount(), invoice.getInvoiceNumber(), tenantId);

        return InvoiceDto.InvoiceResponse.fromEntity(invoice);
    }

    @Override
    @Transactional
    public InvoiceDto.InvoiceResponse voidInvoice(UUID tenantId, UUID invoiceId, InvoiceDto.VoidInvoiceRequest request) {
        Invoice invoice = invoiceRepository.findByIdAndTenantId(invoiceId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", invoiceId));

        invoice.voidInvoice(request.reason());

        // Reverse journal entry if posted
        if (invoice.getJournalEntry() != null) {
            JournalEntry reversal = invoice.getJournalEntry().createReversal(
                    LocalDate.now(), "Void invoice: " + request.reason());
            reversal.setTenantId(tenantId);
            FiscalPeriod period = fiscalPeriodRepository.findByTenantIdAndDate(tenantId, LocalDate.now())
                    .orElseThrow(() -> new BusinessRuleException("No fiscal period found for current date"));
            reversal.post(null, period);
            journalEntryRepository.save(reversal);
        }

        invoice = invoiceRepository.save(invoice);
        log.info("Voided invoice {} for tenant: {}: {}", invoice.getInvoiceNumber(), tenantId, request.reason());

        return InvoiceDto.InvoiceResponse.fromEntity(invoice);
    }

    @Override
    @Transactional
    public InvoiceDto.InvoiceResponse writeOffInvoice(UUID tenantId, UUID invoiceId, InvoiceDto.WriteOffInvoiceRequest request) {
        Invoice invoice = invoiceRepository.findByIdAndTenantId(invoiceId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", invoiceId));

        BigDecimal writeOffAmount = invoice.getAmountDue();
        invoice.writeOff(request.reason());

        // Create bad debt journal entry: DR Bad Debt Expense, CR Accounts Receivable
        if (writeOffAmount.compareTo(BigDecimal.ZERO) > 0) {
            JournalEntry entry = JournalEntry.create(
                    LocalDate.now(),
                    "Write off - Invoice " + invoice.getInvoiceNumber() + ": " + request.reason(),
                    JournalEntry.EntryType.ADJUSTMENT
            );
            entry.setTenantId(tenantId);

            Account badDebtAccount = getBadDebtAccount(tenantId);
            Account receivableAccount = getReceivableAccount(tenantId, invoice.getCustomer());

            entry.addDebit(badDebtAccount, writeOffAmount, "Bad debt expense");
            entry.addCredit(receivableAccount, writeOffAmount, "Write off - " + invoice.getCustomerName());

            FiscalPeriod period = fiscalPeriodRepository.findByTenantIdAndDate(tenantId, LocalDate.now())
                    .orElseThrow(() -> new BusinessRuleException("No fiscal period found for current date"));
            entry.post(null, period);
            journalEntryRepository.save(entry);
        }

        invoice = invoiceRepository.save(invoice);
        log.info("Wrote off invoice {} for tenant: {}: {}", invoice.getInvoiceNumber(), tenantId, request.reason());

        return InvoiceDto.InvoiceResponse.fromEntity(invoice);
    }

    @Override
    @Transactional
    public InvoiceDto.InvoiceResponse createCreditNote(UUID tenantId, UUID invoiceId, String reason) {
        Invoice originalInvoice = invoiceRepository.findByIdAndTenantIdWithLines(invoiceId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", invoiceId));

        Invoice creditNote = originalInvoice.createCreditNote(reason);
        creditNote.setTenantId(tenantId);
        creditNote.setInvoiceNumber(generateInvoiceNumber(tenantId));

        // Copy lines with negated amounts
        for (InvoiceLine originalLine : originalInvoice.getLines()) {
            InvoiceLine creditLine = InvoiceLine.create(
                    "Credit: " + originalLine.getDescription(),
                    originalLine.getQuantity(),
                    originalLine.getUnitPrice().negate(),
                    originalLine.getVatCategory()
            );
            creditNote.addLine(creditLine);
        }

        creditNote = invoiceRepository.save(creditNote);
        log.info("Created credit note {} for invoice {} in tenant: {}", creditNote.getInvoiceNumber(), originalInvoice.getInvoiceNumber(), tenantId);

        return InvoiceDto.InvoiceResponse.fromEntity(creditNote);
    }

    @Override
    @Transactional
    public void sendPaymentReminder(UUID tenantId, UUID invoiceId) {
        Invoice invoice = invoiceRepository.findByIdAndTenantId(invoiceId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", invoiceId));

        // TODO: Send reminder via notification service

        invoice.setLastReminderAt(Instant.now());
        invoice.setReminderCount(invoice.getReminderCount() + 1);
        invoiceRepository.save(invoice);

        log.info("Sent payment reminder for invoice {} in tenant: {}", invoice.getInvoiceNumber(), tenantId);
    }

    // === Dashboard and Reporting ===

    @Override
    @Transactional(readOnly = true)
    public InvoiceDto.InvoiceDashboardSummary getDashboardSummary(UUID tenantId) {
        LocalDate today = LocalDate.now();

        int totalInvoices = (int) invoiceRepository.countByTenantId(tenantId);
        int draftCount = (int) invoiceRepository.countByTenantIdAndStatus(tenantId, Invoice.InvoiceStatus.DRAFT);
        int sentCount = (int) invoiceRepository.countByTenantIdAndStatus(tenantId, Invoice.InvoiceStatus.SENT);
        int overdueCount = (int) invoiceRepository.countOverdueByTenantId(tenantId, today);

        BigDecimal totalOutstanding = invoiceRepository.sumOutstandingByTenantId(tenantId);
        BigDecimal totalOverdue = invoiceRepository.sumOverdueByTenantId(tenantId, today);

        InvoiceDto.AgingSummary aging = getAgingSummary(tenantId);

        List<InvoiceDto.InvoiceSummary> recentInvoices = getRecentInvoices(tenantId, 5);
        List<InvoiceDto.InvoiceSummary> overdueInvoices = getOverdueInvoices(tenantId).stream()
                .limit(5).toList();

        return new InvoiceDto.InvoiceDashboardSummary(
                totalInvoices,
                draftCount,
                sentCount,
                overdueCount,
                totalOutstanding,
                totalOverdue,
                aging,
                recentInvoices,
                overdueInvoices
        );
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceDto.AgingSummary getAgingSummary(UUID tenantId) {
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysAgo = today.minusDays(30);
        LocalDate sixtyDaysAgo = today.minusDays(60);
        LocalDate ninetyDaysAgo = today.minusDays(90);

        BigDecimal current = invoiceRepository.sumCurrentByTenantId(tenantId, today);
        BigDecimal days1To30 = invoiceRepository.sum1To30DaysOverdueByTenantId(tenantId, today, thirtyDaysAgo);
        BigDecimal days31To60 = invoiceRepository.sum31To60DaysOverdueByTenantId(tenantId, thirtyDaysAgo, sixtyDaysAgo);
        BigDecimal days61To90 = invoiceRepository.sum61To90DaysOverdueByTenantId(tenantId, sixtyDaysAgo, ninetyDaysAgo);
        BigDecimal days90Plus = invoiceRepository.sum90PlusDaysOverdueByTenantId(tenantId, ninetyDaysAgo);

        BigDecimal total = current.add(days1To30).add(days31To60).add(days61To90).add(days90Plus);

        return new InvoiceDto.AgingSummary(current, days1To30, days31To60, days61To90, days90Plus, total);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceDto.CustomerAgingReport> getAgingByCustomer(UUID tenantId) {
        // This would require more complex queries - simplified for now
        return List.of();
    }

    @Override
    @Transactional
    public void updateOverdueStatuses(UUID tenantId) {
        LocalDate today = LocalDate.now();
        List<Invoice> overdueInvoices = invoiceRepository.findOverdueByTenantId(tenantId, today);

        for (Invoice invoice : overdueInvoices) {
            if (invoice.getStatus() == Invoice.InvoiceStatus.SENT ||
                invoice.getStatus() == Invoice.InvoiceStatus.VIEWED ||
                invoice.getStatus() == Invoice.InvoiceStatus.PARTIALLY_PAID) {
                invoice.setStatus(Invoice.InvoiceStatus.OVERDUE);
            }
        }

        invoiceRepository.saveAll(overdueInvoices);
        log.info("Updated {} invoices to OVERDUE status for tenant: {}", overdueInvoices.size(), tenantId);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] generatePdf(UUID tenantId, UUID invoiceId) {
        // Verify invoice belongs to tenant
        invoiceRepository.findByIdAndTenantId(invoiceId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", invoiceId));

        // TODO: Implement PDF generation using Thymeleaf template
        throw new UnsupportedOperationException("PDF generation not yet implemented");
    }

    @Override
    public String generateInvoiceNumber(UUID tenantId) {
        return invoiceNumberService.generateInvoiceNumber(tenantId);
    }

    // === Helper methods to get accounts ===

    private Account getReceivableAccount(UUID tenantId, Customer customer) {
        if (customer.getDefaultReceivableAccount() != null) {
            return customer.getDefaultReceivableAccount();
        }
        return accountRepository.findByTenantIdAndAccountCode(tenantId, ACCOUNTS_RECEIVABLE_CODE)
                .orElseThrow(() -> new BusinessRuleException("Accounts Receivable account not found"));
    }

    private Account getRevenueAccount(UUID tenantId, Customer customer) {
        if (customer.getDefaultRevenueAccount() != null) {
            return customer.getDefaultRevenueAccount();
        }
        return accountRepository.findByTenantIdAndAccountCode(tenantId, SALES_REVENUE_CODE)
                .orElseThrow(() -> new BusinessRuleException("Sales Revenue account not found"));
    }

    private Account getVatOutputAccount(UUID tenantId) {
        return accountRepository.findByTenantIdAndAccountCode(tenantId, VAT_OUTPUT_CODE)
                .orElseThrow(() -> new BusinessRuleException("VAT Output account not found"));
    }

    private Account getCashAccount(UUID tenantId) {
        return accountRepository.findByTenantIdAndAccountCode(tenantId, "1000")
                .orElseThrow(() -> new BusinessRuleException("Cash account not found"));
    }

    private Account getBadDebtAccount(UUID tenantId) {
        return accountRepository.findByTenantIdAndAccountCode(tenantId, "5900")
                .orElseGet(() -> accountRepository.findByTenantIdAndAccountCode(tenantId, "5000")
                        .orElseThrow(() -> new BusinessRuleException("Bad debt account not found")));
    }
}
