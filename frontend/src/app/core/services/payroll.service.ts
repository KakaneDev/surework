import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';
import {
  getPayrollRunStatusConfig,
  getPayslipStatusConfig,
  getStatusHexColors,
  getVariantClasses,
  HexColorPair
} from '@shared/ui/status-config';

// === Enums / Types ===

export type PayrollRunStatus = 'DRAFT' | 'PROCESSING' | 'PENDING_APPROVAL' | 'APPROVED' | 'PAID' | 'CANCELLED';
export type PayslipStatus = 'DRAFT' | 'CALCULATED' | 'APPROVED' | 'PAID' | 'EXCLUDED' | 'VOID';

// === Page Response ===

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// === Payroll Run DTOs ===

export interface CreatePayrollRunRequest {
  periodYear: number;
  periodMonth: number;
  paymentDate: string;
  notes?: string;
}

export interface PayrollRun {
  id: string;
  periodYear: number;
  periodMonth: number;
  paymentDate: string;
  status: PayrollRunStatus;
  employeeCount: number;
  totalGross: number;
  totalPaye: number;
  totalUifEmployee: number;
  totalUifEmployer: number;
  totalNet: number;
  totalEmployerCost: number;
  notes?: string;
  processedAt?: string;
  processedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  paidAt?: string;
  paidBy?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  createdAt: string;
  createdBy?: string;
}

export interface PayrollRunSummary {
  id: string;
  periodYear: number;
  periodMonth: number;
  paymentDate: string;
  status: PayrollRunStatus;
  employeeCount: number;
  totalNet: number;
  createdAt: string;
}

// === Payslip DTOs ===

export interface Payslip {
  id: string;
  payrollRunId?: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  payslipNumber?: string;
  department?: string;
  jobTitle?: string;
  periodYear?: number;
  periodMonth?: number;
  paymentDate?: string;
  basicSalary: number;
  overtime?: number;
  bonuses?: number;
  commission?: number;
  allowances?: number;
  grossPay?: number;        // Legacy/calculated
  grossEarnings: number;    // API field name
  paye: number;
  uif?: number;
  uifEmployee?: number;
  uifEmployer?: number;
  pension?: number;
  pensionFund?: number;
  medicalAid: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  employerUif?: number;
  employerPension?: number;
  employerCost?: number;
  totalEmployerCost?: number;
  status: PayslipStatus;
  calculatedAt?: string;
  createdAt: string;
}

export interface PayslipSummary {
  id: string;
  payslipNumber: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  department?: string;
  grossPay?: number;        // Legacy field
  grossEarnings: number;    // API field name
  totalDeductions: number;
  netPay: number;
  status: PayslipStatus;
}

// === Summary DTOs ===

export interface PayrollPeriodSummary {
  periodYear: number;
  periodMonth: number;
  employeeCount: number;
  totalGross: number;
  totalPaye: number;
  totalUif: number;
  totalNet: number;
  totalEmployerCost: number;
  runStatus?: PayrollRunStatus;
}

export interface PayrollAnnualSummary {
  year: number;
  totalRuns: number;
  totalEmployees: number;
  totalGross: number;
  totalPaye: number;
  totalUif: number;
  totalNet: number;
  totalEmployerCost: number;
  monthlySummaries: PayrollPeriodSummary[];
}

// === Tax Calculator DTOs ===

export interface TaxCalculationRequest {
  annualGross: number;
  age?: number;
  medicalAidMembers?: number;
}

export interface TaxCalculationResponse {
  annualGross: number;
  annualPaye: number;
  monthlyPaye: number;
  effectiveRate: number;
  marginalRate: number;
  taxBracket: string;
}

// === Dashboard DTO ===

export interface PayrollDashboard {
  currentRun?: PayrollRunSummary;
  employeesOnPayroll: number;
  nextPaymentDate?: string;
  ytdTotalGross: number;
  ytdTotalPaye: number;
  ytdTotalNet: number;
  recentRuns: PayrollRunSummary[];
}

/**
 * Service for payroll API operations.
 */
@Injectable({
  providedIn: 'root'
})
export class PayrollService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/v1/payroll`;

  // === Payroll Run Methods ===

  /**
   * Create a new payroll run.
   */
  createPayrollRun(request: CreatePayrollRunRequest): Observable<PayrollRun> {
    return this.http.post<PayrollRun>(`${this.apiUrl}/runs`, request);
  }

  /**
   * Get a payroll run by ID.
   */
  getPayrollRun(runId: string): Observable<PayrollRun> {
    return this.http.get<PayrollRun>(`${this.apiUrl}/runs/${runId}`);
  }

  /**
   * Search payroll runs.
   */
  searchPayrollRuns(
    page: number = 0,
    size: number = 10,
    status?: PayrollRunStatus,
    year?: number,
    month?: number
  ): Observable<PageResponse<PayrollRunSummary>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) params = params.set('status', status);
    if (year) params = params.set('year', year.toString());
    if (month) params = params.set('month', month.toString());

    return this.http.get<PageResponse<PayrollRunSummary>>(`${this.apiUrl}/runs`, { params });
  }

  /**
   * Process/calculate payroll for a run.
   */
  processPayrollRun(runId: string): Observable<PayrollRun> {
    return this.http.post<PayrollRun>(`${this.apiUrl}/runs/${runId}/process`, null);
  }

  /**
   * Approve a payroll run.
   */
  approvePayrollRun(runId: string): Observable<PayrollRun> {
    return this.http.post<PayrollRun>(`${this.apiUrl}/runs/${runId}/approve`, null);
  }

  /**
   * Mark a payroll run as paid.
   */
  markPayrollRunAsPaid(runId: string): Observable<PayrollRun> {
    return this.http.post<PayrollRun>(`${this.apiUrl}/runs/${runId}/mark-paid`, null);
  }

  /**
   * Cancel a payroll run.
   */
  cancelPayrollRun(runId: string, reason: string): Observable<PayrollRun> {
    const params = new HttpParams().set('reason', reason);
    return this.http.post<PayrollRun>(`${this.apiUrl}/runs/${runId}/cancel`, null, { params });
  }

  // === Payslip Methods ===

  /**
   * Get payslips for a payroll run.
   */
  getPayslipsForRun(
    runId: string,
    page: number = 0,
    size: number = 20,
    searchTerm?: string
  ): Observable<PageResponse<PayslipSummary>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('runId', runId);

    if (searchTerm) params = params.set('searchTerm', searchTerm);

    return this.http.get<PageResponse<PayslipSummary>>(`${this.apiUrl}/payslips`, { params });
  }

  /**
   * Get a payslip by ID.
   */
  getPayslip(payslipId: string): Observable<Payslip> {
    return this.http.get<Payslip>(`${this.apiUrl}/payslips/${payslipId}`);
  }

  /**
   * Search all payslips.
   */
  searchPayslips(
    page: number = 0,
    size: number = 20,
    employeeId?: string,
    runId?: string,
    status?: PayslipStatus
  ): Observable<PageResponse<PayslipSummary>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (employeeId) params = params.set('employeeId', employeeId);
    if (runId) params = params.set('runId', runId);
    if (status) params = params.set('status', status);

    return this.http.get<PageResponse<PayslipSummary>>(`${this.apiUrl}/payslips`, { params });
  }

  /**
   * Get payslips for an employee.
   */
  getEmployeePayslips(
    employeeId: string,
    page: number = 0,
    size: number = 12
  ): Observable<PageResponse<PayslipSummary>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PageResponse<PayslipSummary>>(
      `${this.apiUrl}/employees/${employeeId}/payslips`,
      { params }
    );
  }

  /**
   * Download payslip PDF.
   */
  downloadPayslipPdf(payslipId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/payslips/${payslipId}/pdf`, {
      responseType: 'blob'
    });
  }

  // === Summary Methods ===

  /**
   * Get payroll summary for a specific period.
   */
  getPeriodSummary(year: number, month: number): Observable<PayrollPeriodSummary> {
    return this.http.get<PayrollPeriodSummary>(`${this.apiUrl}/summary/${year}/${month}`);
  }

  /**
   * Get annual payroll summary.
   */
  getAnnualSummary(year: number): Observable<PayrollAnnualSummary> {
    return this.http.get<PayrollAnnualSummary>(`${this.apiUrl}/summary/${year}`);
  }

  /**
   * Get dashboard data by aggregating from available endpoints.
   * Since there's no dedicated /dashboard endpoint, we build it from /runs and /summary.
   */
  getDashboard(): Observable<PayrollDashboard> {
    // Get recent runs to build dashboard data
    return this.searchPayrollRuns(0, 10).pipe(
      map(response => {
        const runs = response.content;
        const currentRun = runs.find(r =>
          r.status !== 'PAID' && r.status !== 'CANCELLED'
        ) || runs[0];

        // Calculate YTD totals from paid runs this year
        const currentYear = new Date().getFullYear();
        const paidRuns = runs.filter(r =>
          r.status === 'PAID' && r.periodYear === currentYear
        );

        return {
          currentRun: currentRun || undefined,
          employeesOnPayroll: currentRun?.employeeCount || 0,
          nextPaymentDate: currentRun?.paymentDate,
          ytdTotalGross: 0, // Would need summary endpoint for accurate data
          ytdTotalPaye: 0,
          ytdTotalNet: paidRuns.reduce((sum, r) => sum + (r.totalNet || 0), 0),
          recentRuns: runs.slice(0, 5)
        } as PayrollDashboard;
      })
    );
  }

  // === Tax Calculator ===

  /**
   * Calculate tax for given income.
   */
  calculateTax(request: TaxCalculationRequest): Observable<TaxCalculationResponse> {
    return this.http.post<TaxCalculationResponse>(`${this.apiUrl}/calculate-tax`, request);
  }

  // === Self-Service Methods (Any Authenticated User) ===

  /**
   * Get MY payslips (employee self-service).
   * Backend uses JWT token to identify the employee.
   */
  getMyPayslips(page: number = 0, size: number = 12): Observable<PageResponse<PayslipSummary>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<PayslipSummary>>(
      `${this.apiUrl}/my-payslips`,
      { params }
    );
  }

  /**
   * Download my payslip PDF (employee self-service).
   * Backend uses JWT token to verify ownership.
   */
  downloadMyPayslip(payslipId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/my-payslips/${payslipId}/download`, {
      responseType: 'blob'
    });
  }

  /**
   * Get a specific payslip for myself.
   * Backend uses JWT token to verify ownership.
   */
  getMyPayslip(payslipId: string): Observable<Payslip> {
    return this.http.get<Payslip>(`${this.apiUrl}/my-payslips/${payslipId}`);
  }

  // === Static Utility Methods ===

  /**
   * Get label for payroll run status.
   */
  static getRunStatusLabel(status: PayrollRunStatus): string {
    const labels: Record<PayrollRunStatus, string> = {
      DRAFT: 'Draft',
      PROCESSING: 'Processing',
      PENDING_APPROVAL: 'Pending Approval',
      APPROVED: 'Approved',
      PAID: 'Paid',
      CANCELLED: 'Cancelled'
    };
    return labels[status] || status;
  }

  /**
   * Get hex color styles for payroll run status (for inline styles).
   * Uses centralized status config for consistency.
   */
  static getRunStatusColor(status: PayrollRunStatus): HexColorPair {
    const config = getPayrollRunStatusConfig(status);
    // Use dark variant for "paid" status to differentiate from "approved"
    return getStatusHexColors(config, status === 'PAID');
  }

  /**
   * Get Tailwind classes for payroll run status (recommended for dark mode support).
   */
  static getRunStatusClasses(status: PayrollRunStatus): string {
    const config = getPayrollRunStatusConfig(status);
    return getVariantClasses(config.variant);
  }

  /**
   * Get label for payslip status.
   */
  static getPayslipStatusLabel(status: PayslipStatus): string {
    const labels: Record<PayslipStatus, string> = {
      DRAFT: 'Draft',
      CALCULATED: 'Calculated',
      APPROVED: 'Approved',
      PAID: 'Paid',
      EXCLUDED: 'Excluded',
      VOID: 'Void'
    };
    return labels[status] || status;
  }

  /**
   * Get hex color styles for payslip status (for inline styles).
   * Uses centralized status config for consistency.
   */
  static getPayslipStatusColor(status: PayslipStatus): HexColorPair {
    const config = getPayslipStatusConfig(status);
    // Use dark variant for "paid" status to differentiate from "approved"
    return getStatusHexColors(config, status === 'PAID');
  }

  /**
   * Get Tailwind classes for payslip status (recommended for dark mode support).
   */
  static getPayslipStatusClasses(status: PayslipStatus): string {
    const config = getPayslipStatusConfig(status);
    return getVariantClasses(config.variant);
  }

  /**
   * Get month name from month number (1-12).
   */
  static getMonthName(month: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || '';
  }

  /**
   * Format currency amount (South African Rand).
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Get period label (e.g., "January 2026").
   */
  static getPeriodLabel(year: number, month: number): string {
    return `${PayrollService.getMonthName(month)} ${year}`;
  }
}
