import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from './accounting.service';
import {
  getInvoiceStatusConfig,
  getVariantClasses,
  getStatusHexColors,
  HexColorPair
} from '@shared/ui/status-config';

// === Enums ===

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'VOID' | 'WRITTEN_OFF';
export type InvoiceType = 'STANDARD' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'PROFORMA';
export type VatCategory = 'STANDARD' | 'ZERO_RATED' | 'EXEMPT' | 'OUT_OF_SCOPE';
export type PaymentMethod = 'EFT' | 'CASH' | 'CARD' | 'CHEQUE' | 'OTHER';

// === Customer DTOs ===

export interface CreateCustomerRequest {
  customerCode: string;
  customerName: string;
  tradingName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  contactPerson?: string;
  contactEmail?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  vatNumber?: string;
  taxExempt?: boolean;
  paymentTerms?: number;
  creditLimit?: number;
  defaultRevenueAccountId?: string;
  defaultReceivableAccountId?: string;
  notes?: string;
}

export interface UpdateCustomerRequest {
  customerName?: string;
  tradingName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  contactPerson?: string;
  contactEmail?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingProvince?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  vatNumber?: string;
  taxExempt?: boolean;
  paymentTerms?: number;
  creditLimit?: number;
  active?: boolean;
  defaultRevenueAccountId?: string;
  defaultReceivableAccountId?: string;
  notes?: string;
}

export interface CustomerResponse {
  id: string;
  customerCode: string;
  customerName: string;
  tradingName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  contactPerson?: string;
  contactEmail?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  fullAddress?: string;
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingProvince?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  fullBillingAddress?: string;
  vatNumber?: string;
  vatRegistered: boolean;
  taxExempt: boolean;
  paymentTerms: number;
  creditLimit?: number;
  currency: string;
  defaultRevenueAccountId?: string;
  defaultReceivableAccountId?: string;
  active: boolean;
  notes?: string;
  createdAt: string;
}

export interface CustomerSummary {
  id: string;
  customerCode: string;
  customerName: string;
  email?: string;
  active: boolean;
}

// === Invoice DTOs ===

export interface CreateInvoiceLineRequest {
  description: string;
  productId?: string;
  productCode?: string;
  productName?: string;
  quantity: number;
  unitOfMeasure?: string;
  unitPrice: number;
  discountPercentage?: number;
  discountAmount?: number;
  vatCategory?: VatCategory;
  revenueAccountId?: string;
}

export interface CreateInvoiceRequest {
  customerId: string;
  invoiceDate: string;
  dueDate?: string;
  reference?: string;
  purchaseOrder?: string;
  invoiceType?: InvoiceType;
  lines: CreateInvoiceLineRequest[];
  discountPercentage?: number;
  discountAmount?: number;
  notes?: string;
  termsAndConditions?: string;
  footerText?: string;
  internalNotes?: string;
}

export interface UpdateInvoiceRequest {
  invoiceDate?: string;
  dueDate?: string;
  reference?: string;
  purchaseOrder?: string;
  lines?: CreateInvoiceLineRequest[];
  discountPercentage?: number;
  discountAmount?: number;
  notes?: string;
  termsAndConditions?: string;
  footerText?: string;
  internalNotes?: string;
}

export interface InvoiceLineResponse {
  id: string;
  lineNumber: number;
  description: string;
  productId?: string;
  productCode?: string;
  productName?: string;
  quantity: number;
  unitOfMeasure?: string;
  unitPrice: number;
  discountPercentage?: number;
  discountAmount?: number;
  vatCategory: VatCategory;
  vatRate: number;
  vatAmount: number;
  lineSubtotal: number;
  lineTotal: number;
  revenueAccountId?: string;
}

export interface InvoicePaymentResponse {
  id: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentMethodDisplay: string;
  reference?: string;
  bankAccountId?: string;
  bankTransactionId?: string;
  journalEntryId?: string;
  notes?: string;
  createdAt: string;
}

export interface InvoiceResponse {
  id: string;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  customerId?: string;
  customerCode?: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  customerVatNumber?: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  reference?: string;
  purchaseOrder?: string;
  subtotal: number;
  discountAmount: number;
  discountPercentage?: number;
  subtotalAfterDiscount: number;
  vatAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  journalEntryId?: string;
  postedAt?: string;
  sentAt?: string;
  sentToEmail?: string;
  reminderCount: number;
  notes?: string;
  termsAndConditions?: string;
  footerText?: string;
  internalNotes?: string;
  lines: InvoiceLineResponse[];
  payments: InvoicePaymentResponse[];
  overdue: boolean;
  daysOverdue: number;
  agingBucket: string;
  createdAt: string;
}

export interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  total: number;
  amountDue: number;
  overdue: boolean;
  agingBucket: string;
}

// === Payment DTOs ===

export interface RecordPaymentRequest {
  paymentDate: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  reference?: string;
  bankAccountId?: string;
  bankTransactionId?: string;
  notes?: string;
}

// === Action DTOs ===

export interface SendInvoiceRequest {
  toEmail: string;
  ccEmail?: string;
  subject?: string;
  message?: string;
  attachPdf?: boolean;
}

export interface VoidInvoiceRequest {
  reason: string;
}

export interface WriteOffInvoiceRequest {
  reason: string;
}

// === Dashboard DTOs ===

export interface AgingSummary {
  current: number;
  days1To30: number;
  days31To60: number;
  days61To90: number;
  days90Plus: number;
  total: number;
}

export interface CustomerAgingReport {
  customerId: string;
  customerCode: string;
  customerName: string;
  current: number;
  days1To30: number;
  days31To60: number;
  days61To90: number;
  days90Plus: number;
  total: number;
}

export interface InvoiceDashboardSummary {
  totalInvoices: number;
  draftCount: number;
  sentCount: number;
  overdueCount: number;
  totalOutstanding: number;
  totalOverdue: number;
  aging: AgingSummary;
  recentInvoices: InvoiceSummary[];
  overdueInvoices: InvoiceSummary[];
}

/**
 * Service for Invoice API operations.
 * Handles invoicing, customers, and accounts receivable management.
 */
@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/accounting/invoices';

  // ==================== Customer Operations ====================

  createCustomer(request: CreateCustomerRequest): Observable<CustomerResponse> {
    return this.http.post<CustomerResponse>(`${this.apiUrl}/customers`, request);
  }

  updateCustomer(customerId: string, request: UpdateCustomerRequest): Observable<CustomerResponse> {
    return this.http.put<CustomerResponse>(`${this.apiUrl}/customers/${customerId}`, request);
  }

  getCustomer(customerId: string): Observable<CustomerResponse> {
    return this.http.get<CustomerResponse>(`${this.apiUrl}/customers/${customerId}`);
  }

  getCustomerByCode(customerCode: string): Observable<CustomerResponse> {
    return this.http.get<CustomerResponse>(`${this.apiUrl}/customers/code/${customerCode}`);
  }

  searchCustomers(
    page = 0,
    size = 20,
    searchTerm?: string,
    activeOnly = false
  ): Observable<PageResponse<CustomerResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('activeOnly', activeOnly.toString());

    if (searchTerm) params = params.set('searchTerm', searchTerm);

    return this.http.get<PageResponse<CustomerResponse>>(`${this.apiUrl}/customers`, { params });
  }

  getAllCustomers(): Observable<CustomerResponse[]> {
    return this.http.get<CustomerResponse[]>(`${this.apiUrl}/customers/all`);
  }

  getActiveCustomers(): Observable<CustomerSummary[]> {
    return this.http.get<CustomerSummary[]>(`${this.apiUrl}/customers/active`);
  }

  deactivateCustomer(customerId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/customers/${customerId}/deactivate`, {});
  }

  activateCustomer(customerId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/customers/${customerId}/activate`, {});
  }

  // ==================== Invoice CRUD Operations ====================

  createInvoice(request: CreateInvoiceRequest): Observable<InvoiceResponse> {
    return this.http.post<InvoiceResponse>(this.apiUrl, request);
  }

  updateInvoice(invoiceId: string, request: UpdateInvoiceRequest): Observable<InvoiceResponse> {
    return this.http.put<InvoiceResponse>(`${this.apiUrl}/${invoiceId}`, request);
  }

  getInvoice(invoiceId: string): Observable<InvoiceResponse> {
    return this.http.get<InvoiceResponse>(`${this.apiUrl}/${invoiceId}`);
  }

  getInvoiceByNumber(invoiceNumber: string): Observable<InvoiceResponse> {
    return this.http.get<InvoiceResponse>(`${this.apiUrl}/number/${invoiceNumber}`);
  }

  searchInvoices(
    page = 0,
    size = 20,
    status?: InvoiceStatus,
    customerId?: string,
    startDate?: string,
    endDate?: string,
    searchTerm?: string
  ): Observable<PageResponse<InvoiceSummary>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) params = params.set('status', status);
    if (customerId) params = params.set('customerId', customerId);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (searchTerm) params = params.set('searchTerm', searchTerm);

    return this.http.get<PageResponse<InvoiceSummary>>(this.apiUrl, { params });
  }

  getInvoicesByCustomer(customerId: string): Observable<InvoiceSummary[]> {
    return this.http.get<InvoiceSummary[]>(`${this.apiUrl}/customer/${customerId}`);
  }

  getOverdueInvoices(): Observable<InvoiceSummary[]> {
    return this.http.get<InvoiceSummary[]>(`${this.apiUrl}/overdue`);
  }

  getUnpaidInvoices(): Observable<InvoiceSummary[]> {
    return this.http.get<InvoiceSummary[]>(`${this.apiUrl}/unpaid`);
  }

  getDraftInvoices(): Observable<InvoiceSummary[]> {
    return this.http.get<InvoiceSummary[]>(`${this.apiUrl}/drafts`);
  }

  getRecentInvoices(limit = 10): Observable<InvoiceSummary[]> {
    return this.http.get<InvoiceSummary[]>(`${this.apiUrl}/recent`, {
      params: { limit: limit.toString() }
    });
  }

  deleteInvoice(invoiceId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${invoiceId}`);
  }

  // ==================== Invoice Actions ====================

  sendInvoice(invoiceId: string, request: SendInvoiceRequest): Observable<InvoiceResponse> {
    return this.http.post<InvoiceResponse>(`${this.apiUrl}/${invoiceId}/send`, request);
  }

  postInvoice(invoiceId: string): Observable<InvoiceResponse> {
    return this.http.post<InvoiceResponse>(`${this.apiUrl}/${invoiceId}/post`, {});
  }

  recordPayment(invoiceId: string, request: RecordPaymentRequest): Observable<InvoiceResponse> {
    return this.http.post<InvoiceResponse>(`${this.apiUrl}/${invoiceId}/payments`, request);
  }

  voidInvoice(invoiceId: string, request: VoidInvoiceRequest): Observable<InvoiceResponse> {
    return this.http.post<InvoiceResponse>(`${this.apiUrl}/${invoiceId}/void`, request);
  }

  writeOffInvoice(invoiceId: string, request: WriteOffInvoiceRequest): Observable<InvoiceResponse> {
    return this.http.post<InvoiceResponse>(`${this.apiUrl}/${invoiceId}/write-off`, request);
  }

  createCreditNote(invoiceId: string, reason: string): Observable<InvoiceResponse> {
    return this.http.post<InvoiceResponse>(`${this.apiUrl}/${invoiceId}/credit-note`, null, {
      params: { reason }
    });
  }

  sendPaymentReminder(invoiceId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${invoiceId}/reminder`, {});
  }

  // ==================== Dashboard and Reporting ====================

  getDashboardSummary(): Observable<InvoiceDashboardSummary> {
    return this.http.get<InvoiceDashboardSummary>(`${this.apiUrl}/dashboard`);
  }

  getAgingSummary(): Observable<AgingSummary> {
    return this.http.get<AgingSummary>(`${this.apiUrl}/reports/aging`);
  }

  getAgingByCustomer(): Observable<CustomerAgingReport[]> {
    return this.http.get<CustomerAgingReport[]>(`${this.apiUrl}/reports/aging/by-customer`);
  }

  // ==================== PDF and Number Generation ====================

  downloadPdf(invoiceId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${invoiceId}/pdf`, {
      responseType: 'blob'
    });
  }

  getNextInvoiceNumber(): Observable<string> {
    return this.http.get(`${this.apiUrl}/next-number`, { responseType: 'text' });
  }

  // ==================== Static Utility Methods ====================

  static getStatusLabel(status: InvoiceStatus): string {
    const labels: Record<InvoiceStatus, string> = {
      DRAFT: 'Draft',
      SENT: 'Sent',
      VIEWED: 'Viewed',
      PARTIALLY_PAID: 'Partial',
      PAID: 'Paid',
      OVERDUE: 'Overdue',
      VOID: 'Void',
      WRITTEN_OFF: 'Written Off'
    };
    return labels[status] || status;
  }

  /**
   * Get Tailwind classes for invoice status (recommended for dark mode support).
   * Uses centralized status config for consistency.
   */
  static getStatusColor(status: InvoiceStatus): string {
    const config = getInvoiceStatusConfig(status);
    return getVariantClasses(config.variant);
  }

  /**
   * Get hex color styles for invoice status (for inline styles).
   */
  static getStatusHexColor(status: InvoiceStatus): HexColorPair {
    const config = getInvoiceStatusConfig(status);
    return getStatusHexColors(config);
  }

  static getInvoiceTypeLabel(type: InvoiceType): string {
    const labels: Record<InvoiceType, string> = {
      STANDARD: 'Invoice',
      CREDIT_NOTE: 'Credit Note',
      DEBIT_NOTE: 'Debit Note',
      PROFORMA: 'Proforma'
    };
    return labels[type] || type;
  }

  static getPaymentMethodLabel(method: PaymentMethod): string {
    const labels: Record<PaymentMethod, string> = {
      EFT: 'EFT',
      CASH: 'Cash',
      CARD: 'Card',
      CHEQUE: 'Cheque',
      OTHER: 'Other'
    };
    return labels[method] || method;
  }

  static getVatCategoryLabel(category: VatCategory): string {
    const labels: Record<VatCategory, string> = {
      STANDARD: 'Standard Rate (15%)',
      ZERO_RATED: 'Zero Rated',
      EXEMPT: 'Exempt',
      OUT_OF_SCOPE: 'Out of Scope'
    };
    return labels[category] || category;
  }

  static getAgingBucketLabel(bucket: string): string {
    const labels: Record<string, string> = {
      'Current': 'Current',
      '1-30 Days': '1-30 Days',
      '31-60 Days': '31-60 Days',
      '61-90 Days': '61-90 Days',
      '90+ Days': '90+ Days'
    };
    return labels[bucket] || bucket;
  }

  static formatCurrency(amount: number): string {
    return amount.toLocaleString('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    });
  }

  static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  static getDaysUntilDue(dueDate: string): number {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  static isOverdue(invoice: InvoiceSummary): boolean {
    if (invoice.status === 'PAID' || invoice.status === 'VOID' || invoice.status === 'WRITTEN_OFF') {
      return false;
    }
    return new Date(invoice.dueDate) < new Date();
  }
}
