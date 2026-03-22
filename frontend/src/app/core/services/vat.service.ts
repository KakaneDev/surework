import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from './accounting.service';
import {
  getVatReportStatusConfig,
  getVariantClasses,
  getStatusHexColors,
  HexColorPair
} from '@shared/ui/status-config';

// === Enums ===

export type ReportStatus = 'DRAFT' | 'PREVIEW' | 'GENERATED' | 'SUBMITTED' | 'PAID' | 'AMENDED';
export type VatCategory = 'STANDARD' | 'ZERO_RATED' | 'EXEMPT' | 'OUT_OF_SCOPE' | 'INPUT_VAT' | 'OUTPUT_VAT' | 'CAPITAL_INPUT';
export type AdjustmentType = 'INCREASE' | 'DECREASE';

// === Request DTOs ===

export interface GenerateVatReportRequest {
  periodStart: string;
  periodEnd: string;
  tenantId?: string;
}

export interface PreviewVatReportRequest {
  periodStart: string;
  periodEnd: string;
  tenantId?: string;
}

export interface SubmitVatReportRequest {
  reportId: string;
  sarsReference?: string;
  notes?: string;
}

export interface RecordPaymentRequest {
  reportId: string;
  amount: number;
  paymentReference?: string;
  notes?: string;
}

export interface VatAdjustmentRequest {
  boxNumber: string;
  amount: number;
  description?: string;
  type: AdjustmentType;
}

// === Response DTOs ===

export interface VatReportResponse {
  id: string;
  vatPeriod: string;
  periodStart: string;
  periodEnd: string;
  status: ReportStatus;

  // Section A: Output Tax
  box1StandardRatedSupplies: number;
  box1aOutputVat: number;
  box2ZeroRatedSupplies: number;
  box3ExemptSupplies: number;
  box4TotalSupplies: number;

  // Section B: Input Tax
  box5CapitalGoods: number;
  box5aInputVatCapital: number;
  box6OtherGoods: number;
  box6aInputVatOther: number;
  box7TotalInputVat: number;

  // Section C: Adjustments
  box8ChangeInUseIncrease: number;
  box9ChangeInUseDecrease: number;
  box10BadDebtsRecovered: number;
  box11BadDebtsWrittenOff: number;
  box12OtherAdjustments: number;
  box13TotalAdjustments: number;

  // Section D: Calculation
  box14OutputVatPayable: number;
  box15InputVatDeductible: number;
  box16VatPayable: number;
  box17VatRefundable: number;

  // Section E: Diesel Refund
  box18DieselRefund: number;

  // Payment details
  paymentDueDate?: string;
  paymentReference?: string;
  paidAt?: string;
  paidAmount?: number;

  // Submission details
  submittedAt?: string;
  submittedBy?: string;
  sarsReference?: string;
  acknowledgmentNumber?: string;

  // Generation details
  generatedAt?: string;
  generatedBy?: string;
  notes?: string;

  // Line items
  lines: VatReportLineResponse[];

  createdAt: string;
}

export interface VatReportSummary {
  id: string;
  vatPeriod: string;
  periodStart: string;
  periodEnd: string;
  status: ReportStatus;
  netVat: number;
  isPayable: boolean;
  paymentDueDate?: string;
  isPaid: boolean;
  createdAt: string;
}

export interface VatReportLineResponse {
  id: string;
  accountId?: string;
  accountCode?: string;
  accountName?: string;
  vatCategory: VatCategory;
  taxableAmount: number;
  vatAmount: number;
  grossAmount: number;
  vatBox: string;
  transactionCount: number;
}

export interface VatTransactionResponse {
  id: string;
  journalEntryId?: string;
  journalEntryNumber?: string;
  transactionDate: string;
  accountCode?: string;
  vatCategory: VatCategory;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  description?: string;
  reference?: string;
  vatBox: string;
}

// === Dashboard DTOs ===

export interface VatDashboardSummary {
  currentPeriod?: VatReportSummary;
  previousPeriod?: VatReportSummary;
  ytdVatPayable: number;
  ytdVatRefundable: number;
  ytdNetVat: number;
  pendingReportsCount: number;
  overdueReportsCount: number;
  nextDueDate?: string;
  recentReports: VatReportSummary[];
}

export interface VatPeriodComparison {
  period: string;
  outputVat: number;
  inputVat: number;
  netVat: number;
  standardRatedSales: number;
  zeroRatedSales: number;
}

export interface VatBoxBreakdown {
  boxNumber: string;
  boxDescription: string;
  amount: number;
  transactionCount: number;
  transactions: VatTransactionResponse[];
}

// === Export DTOs ===

export interface SarsVat201Export {
  vendorVatNumber: string;
  taxPeriod: string;
  submissionType: string;
  reportData: VatReportResponse;
  generatedDate: string;
}

/**
 * Service for VAT201 report API operations.
 * Implements SARS VAT reporting for South African businesses.
 */
@Injectable({
  providedIn: 'root'
})
export class VatService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/accounting/vat';

  // === Report Generation ===

  previewVatReport(request: PreviewVatReportRequest): Observable<VatReportResponse> {
    return this.http.post<VatReportResponse>(`${this.apiUrl}/preview`, request);
  }

  generateVatReport(request: GenerateVatReportRequest): Observable<VatReportResponse> {
    return this.http.post<VatReportResponse>(`${this.apiUrl}/generate`, request);
  }

  regenerateVatReport(reportId: string): Observable<VatReportResponse> {
    return this.http.post<VatReportResponse>(`${this.apiUrl}/${reportId}/regenerate`, {});
  }

  finalizeReport(reportId: string): Observable<VatReportResponse> {
    return this.http.post<VatReportResponse>(`${this.apiUrl}/${reportId}/finalize`, {});
  }

  // === Report Retrieval ===

  getReport(reportId: string): Observable<VatReportResponse> {
    return this.http.get<VatReportResponse>(`${this.apiUrl}/${reportId}`);
  }

  getReportByPeriod(vatPeriod: string): Observable<VatReportResponse> {
    return this.http.get<VatReportResponse>(`${this.apiUrl}/period/${vatPeriod}`);
  }

  getReportWithTransactions(reportId: string): Observable<VatReportResponse> {
    return this.http.get<VatReportResponse>(`${this.apiUrl}/${reportId}/transactions`);
  }

  searchReports(
    page = 0,
    size = 20,
    status?: ReportStatus,
    year?: number
  ): Observable<PageResponse<VatReportSummary>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) params = params.set('status', status);
    if (year) params = params.set('year', year.toString());

    return this.http.get<PageResponse<VatReportSummary>>(this.apiUrl, { params });
  }

  getReportsForYear(year: number): Observable<VatReportSummary[]> {
    return this.http.get<VatReportSummary[]>(`${this.apiUrl}/year/${year}`);
  }

  getRecentReports(limit = 6): Observable<VatReportSummary[]> {
    return this.http.get<VatReportSummary[]>(`${this.apiUrl}/recent`, {
      params: { limit: limit.toString() }
    });
  }

  getOverdueReports(): Observable<VatReportSummary[]> {
    return this.http.get<VatReportSummary[]>(`${this.apiUrl}/overdue`);
  }

  getPendingSubmissionReports(): Observable<VatReportSummary[]> {
    return this.http.get<VatReportSummary[]>(`${this.apiUrl}/pending`);
  }

  // === Submission and Payment ===

  submitToSars(reportId: string, request: Omit<SubmitVatReportRequest, 'reportId'>): Observable<VatReportResponse> {
    return this.http.post<VatReportResponse>(`${this.apiUrl}/${reportId}/submit`, request);
  }

  recordPayment(reportId: string, request: Omit<RecordPaymentRequest, 'reportId'>): Observable<VatReportResponse> {
    return this.http.post<VatReportResponse>(`${this.apiUrl}/${reportId}/payment`, request);
  }

  // === Adjustments ===

  applyAdjustment(reportId: string, request: VatAdjustmentRequest): Observable<VatReportResponse> {
    return this.http.post<VatReportResponse>(`${this.apiUrl}/${reportId}/adjustments`, request);
  }

  // === Dashboard and Analytics ===

  getDashboardSummary(): Observable<VatDashboardSummary> {
    return this.http.get<VatDashboardSummary>(`${this.apiUrl}/dashboard`);
  }

  getPeriodComparison(year: number): Observable<VatPeriodComparison[]> {
    return this.http.get<VatPeriodComparison[]>(`${this.apiUrl}/comparison/${year}`);
  }

  getBoxBreakdown(reportId: string, boxNumber: string): Observable<VatBoxBreakdown> {
    return this.http.get<VatBoxBreakdown>(`${this.apiUrl}/${reportId}/box/${boxNumber}`);
  }

  // === Export ===

  exportForSars(reportId: string): Observable<SarsVat201Export> {
    return this.http.get<SarsVat201Export>(`${this.apiUrl}/${reportId}/export/sars`);
  }

  downloadPdf(reportId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${reportId}/export/pdf`, {
      responseType: 'blob'
    });
  }

  // === Validation ===

  validateReport(reportId: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/${reportId}/validate`);
  }

  checkPeriodAvailability(periodStart: string, periodEnd: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/check-period`, {
      params: { periodStart, periodEnd }
    });
  }

  // === Static Utility Methods ===

  static getStatusLabel(status: ReportStatus): string {
    const labels: Record<ReportStatus, string> = {
      DRAFT: 'Draft',
      PREVIEW: 'Preview',
      GENERATED: 'Ready to Submit',
      SUBMITTED: 'Submitted',
      PAID: 'Paid',
      AMENDED: 'Amended'
    };
    return labels[status] || status;
  }

  /**
   * Get Tailwind classes for VAT report status (recommended for dark mode support).
   * Uses centralized status config for consistency.
   */
  static getStatusColor(status: ReportStatus): string {
    const config = getVatReportStatusConfig(status);
    return getVariantClasses(config.variant);
  }

  /**
   * Get hex color styles for VAT report status (for inline styles).
   */
  static getStatusHexColor(status: ReportStatus): HexColorPair {
    const config = getVatReportStatusConfig(status);
    return getStatusHexColors(config);
  }

  static getVatCategoryLabel(category: VatCategory): string {
    const labels: Record<VatCategory, string> = {
      STANDARD: 'Standard Rate (15%)',
      ZERO_RATED: 'Zero Rated',
      EXEMPT: 'Exempt',
      OUT_OF_SCOPE: 'Out of Scope',
      INPUT_VAT: 'Input VAT',
      OUTPUT_VAT: 'Output VAT',
      CAPITAL_INPUT: 'Capital Goods Input VAT'
    };
    return labels[category] || category;
  }

  static getBoxLabel(boxNumber: string): string {
    const labels: Record<string, string> = {
      '1': 'Standard Rated Supplies',
      '1a': 'Output VAT (15%)',
      '2': 'Zero-Rated Supplies',
      '3': 'Exempt Supplies',
      '4': 'Total Supplies',
      '5': 'Capital Goods',
      '5a': 'Input VAT on Capital',
      '6': 'Other Goods & Services',
      '6a': 'Input VAT on Other',
      '7': 'Total Input VAT',
      '8': 'Change in Use (Increase)',
      '9': 'Change in Use (Decrease)',
      '10': 'Bad Debts Recovered',
      '11': 'Bad Debts Written Off',
      '12': 'Other Adjustments',
      '13': 'Total Adjustments',
      '14': 'Output VAT Payable',
      '15': 'Input VAT Deductible',
      '16': 'VAT Payable to SARS',
      '17': 'VAT Refundable',
      '18': 'Diesel Refund'
    };
    return labels[boxNumber] || `Box ${boxNumber}`;
  }

  static formatCurrency(amount: number): string {
    return amount.toLocaleString('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    });
  }

  static formatPeriod(periodStart: string): string {
    const date = new Date(periodStart);
    return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long' });
  }

  static getPeriodRange(periodStart: string, periodEnd: string): string {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    return `${start.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }

  static isOverdue(report: VatReportSummary): boolean {
    if (!report.paymentDueDate || report.isPaid) return false;
    return new Date(report.paymentDueDate) < new Date();
  }

  static getDaysUntilDue(paymentDueDate: string): number {
    const due = new Date(paymentDueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
