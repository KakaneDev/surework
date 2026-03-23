import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '@env/environment';
import { getTenantId } from '@core/utils/tenant.util';
import {
  getReportStatusConfig,
  getStatusHexColors,
  getVariantClasses,
  HexColorPair
} from '@shared/ui/status-config';

// === Enums ===

export type ReportCategory = 'HR' | 'PAYROLL' | 'LEAVE' | 'TIME_ATTENDANCE' | 'RECRUITMENT' | 'STATUTORY' | 'FINANCIAL' | 'COMPLIANCE' | 'CUSTOM';

export type ReportType =
  // HR Reports
  | 'HEADCOUNT' | 'TURNOVER' | 'DEMOGRAPHICS' | 'SKILLS_MATRIX' | 'TRAINING_SUMMARY' | 'PROBATION_STATUS' | 'EMPLOYEE_DIRECTORY'
  // Payroll Reports
  | 'PAYROLL_REGISTER' | 'PAYROLL_SUMMARY' | 'PAYSLIP_BATCH' | 'STATUTORY_DEDUCTIONS' | 'COST_TO_COMPANY' | 'PAYROLL_VARIANCE' | 'YEAR_TO_DATE' | 'PAYROLL_JOURNAL'
  // Leave Reports
  | 'LEAVE_BALANCE' | 'LEAVE_UTILIZATION' | 'LEAVE_LIABILITY' | 'SICK_LEAVE_ANALYSIS' | 'ABSENCE_TRENDS'
  // Time & Attendance
  | 'ATTENDANCE_SUMMARY' | 'OVERTIME_REPORT' | 'LATE_ARRIVALS' | 'TIMESHEET_COMPLIANCE' | 'HOURS_WORKED'
  // Recruitment
  | 'RECRUITMENT_PIPELINE' | 'TIME_TO_HIRE' | 'SOURCE_EFFECTIVENESS' | 'OFFER_ACCEPTANCE' | 'EXTERNAL_PORTAL_PERFORMANCE' | 'JOB_ADVERT_EFFECTIVENESS'
  // Statutory
  | 'EMP201' | 'EMP501' | 'UI19' | 'IRP5' | 'IT3A' | 'EEA2' | 'EEA4'
  // Financial
  | 'LABOR_COST_ANALYSIS' | 'DEPARTMENT_BUDGET' | 'HEADCOUNT_FORECAST'
  // Custom
  | 'AD_HOC' | 'CUSTOM_QUERY';

export type ReportStatus = 'PENDING' | 'QUEUED' | 'GENERATING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';

export type OutputFormat = 'PDF' | 'EXCEL' | 'CSV' | 'JSON' | 'HTML';

export type ReportVisibility = 'PRIVATE' | 'DEPARTMENT' | 'COMPANY' | 'PUBLIC';

export type ScheduleFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';

export type DateRangeType = 'PREVIOUS_DAY' | 'PREVIOUS_WEEK' | 'PREVIOUS_MONTH' | 'PREVIOUS_QUARTER' | 'PREVIOUS_YEAR' | 'MONTH_TO_DATE' | 'YEAR_TO_DATE' | 'CUSTOM';

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

// === Report DTOs ===

export interface GenerateReportRequest {
  reportType: ReportType;
  outputFormat: OutputFormat;
  dateFrom?: string;
  dateTo?: string;
  parameters?: Record<string, unknown>;
  visibility?: ReportVisibility;
  name?: string;
  description?: string;
}

export interface ReportResponse {
  id: string;
  reference: string;
  name: string;
  description?: string;
  category: ReportCategory;
  reportType: ReportType;
  status: ReportStatus;
  outputFormat: OutputFormat;
  dateFrom?: string;
  dateTo?: string;
  parameters?: Record<string, unknown>;
  filePath?: string;
  fileSize?: number;
  contentType?: string;
  rowCount?: number;
  pageCount?: number;
  generationTimeMs?: number;
  errorMessage?: string;
  visibility: ReportVisibility;
  expiresAt?: string;
  scheduled: boolean;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

export interface ReportListItem {
  id: string;
  reference: string;
  name: string;
  category: ReportCategory;
  reportType: ReportType;
  status: ReportStatus;
  outputFormat: OutputFormat;
  fileSize?: number;
  createdAt: string;
  completedAt?: string;
}

export interface DownloadResponse {
  reportId: string;
  downloadUrl: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  expiresAt: string;
}

// === Schedule DTOs ===

export interface DistributionSettings {
  emailRecipients: string[];
  emailSubject?: string;
  emailBody?: string;
  attachReport: boolean;
  includeDownloadLink: boolean;
}

export interface CreateScheduleRequest {
  name: string;
  description?: string;
  reportType: ReportType;
  outputFormat: OutputFormat;
  parameters?: Record<string, unknown>;
  frequency: ScheduleFrequency;
  runTime?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  cronExpression?: string;
  dateRangeType: DateRangeType;
  distribution?: DistributionSettings;
}

export interface UpdateScheduleRequest {
  name?: string;
  description?: string;
  outputFormat?: OutputFormat;
  parameters?: Record<string, unknown>;
  frequency?: ScheduleFrequency;
  runTime?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  cronExpression?: string;
  dateRangeType?: DateRangeType;
  distribution?: DistributionSettings;
  active?: boolean;
}

export interface ScheduleResponse {
  id: string;
  name: string;
  description?: string;
  reportType: ReportType;
  outputFormat: OutputFormat;
  parameters?: Record<string, unknown>;
  frequency: ScheduleFrequency;
  runTime?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  cronExpression?: string;
  dateRangeType: DateRangeType;
  lastRunAt?: string;
  nextRunAt?: string;
  lastRunStatus?: ReportStatus;
  runCount: number;
  failureCount: number;
  emailRecipients?: string[];
  attachReport: boolean;
  active: boolean;
  createdBy: string;
  createdAt: string;
}

// === Analytics DTOs ===

export interface HeadcountSummary {
  totalHeadcount: number;
  activeEmployees: number;
  onLeave: number;
  onProbation: number;
  newHiresThisMonth: number;
  terminationsThisMonth: number;
  turnoverRatePercent: number;
  byDepartment: Record<string, number>;
  byLocation: Record<string, number>;
  byEmploymentType: Record<string, number>;
}

export interface DemographicsSummary {
  byGender: Record<string, number>;
  byRace: Record<string, number>;
  byAgeGroup: Record<string, number>;
  byTenure: Record<string, number>;
  byDisabilityStatus: Record<string, number>;
  averageAge: number;
  averageTenureYears: number;
}

export interface TurnoverTrend {
  month: string;
  hires: number;
  terminations: number;
  turnoverRate: number;
}

export interface TurnoverAnalysis {
  totalTerminations: number;
  turnoverRatePercent: number;
  voluntaryRatePercent: number;
  involuntaryRatePercent: number;
  byReason: Record<string, number>;
  byDepartment: Record<string, number>;
  byTenure: Record<string, number>;
  monthlyTrend: TurnoverTrend[];
}

export interface PayrollTrend {
  month: string;
  grossPay: number;
  netPay: number;
  costToCompany: number;
}

export interface PayrollSummary {
  totalGrossPay: number;
  totalNetPay: number;
  totalDeductions: number;
  totalPAYE: number;
  totalUIF: number;
  totalSDL: number;
  totalEmployerContributions: number;
  totalCostToCompany: number;
  employeesProcessed: number;
  byDepartment: Record<string, number>;
  monthlyTrend: PayrollTrend[];
}

export interface LeaveTrend {
  month: string;
  totalDaysTaken: number;
  sickDays: number;
  annualDays: number;
  otherDays: number;
}

export interface LeaveSummary {
  totalLeaveRequestsThisMonth: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  averageLeaveBalance: number;
  sickLeaveUtilizationPercent: number;
  byLeaveType: Record<string, number>;
  byDepartment: Record<string, number>;
  monthlyTrend: LeaveTrend[];
}

export interface AttendanceTrend {
  week: string;
  attendanceRate: number;
  overtimeHours: number;
  lateCount: number;
}

export interface AttendanceSummary {
  attendanceRatePercent: number;
  lateArrivals: number;
  earlyDepartures: number;
  absences: number;
  totalOvertimeHours: number;
  averageHoursWorked: number;
  attendanceByDepartment: Record<string, number>;
  weeklyTrend: AttendanceTrend[];
}

export interface RecruitmentTrend {
  month: string;
  applications: number;
  interviews: number;
  offers: number;
  hires: number;
}

export interface RecruitmentSummary {
  openPositions: number;
  totalApplications: number;
  interviewsScheduled: number;
  offersExtended: number;
  hiresMade: number;
  averageDaysToHire: number;
  offerAcceptanceRatePercent: number;
  applicationsBySource: Record<string, number>;
  byDepartment: Record<string, number>;
  monthlyTrend: RecruitmentTrend[];
}

// === Statutory DTOs ===

export interface EMP201Summary {
  taxPeriod: string;
  employeeCount: number;
  totalRemuneration: number;
  paye: number;
  sdl: number;
  uif: number;
  uifEmployer: number;
  totalPayable: number;
  dueDate: string;
  submitted: boolean;
  submittedAt?: string;
}

export interface EMP501Summary {
  taxYear: string;
  period: 'Interim' | 'Annual';
  employeeCount: number;
  totalRemuneration: number;
  totalPAYE: number;
  totalUIF: number;
  totalSDL: number;
  irp5sGenerated: number;
  dueDate: string;
  submitted: boolean;
}

// === Compliance & Executive DTOs ===

export interface ComplianceAlert {
  type: string;
  severity: string;
  message: string;
  dueDate?: string;
  actionRequired: string;
}

export interface ComplianceDashboard {
  documentsExpiringSoon: number;
  expiredDocuments: number;
  pendingAcknowledgments: number;
  overdueTraining: number;
  overallComplianceScore: number;
  alerts: ComplianceAlert[];
  complianceByCategory: Record<string, number>;
}

export interface KeyMetric {
  name: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  period: string;
}

export interface Alert {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: string;
}

export interface ExecutiveDashboard {
  headcount: HeadcountSummary;
  payroll: PayrollSummary;
  leave: LeaveSummary;
  attendance: AttendanceSummary;
  recruitment: RecruitmentSummary;
  compliance: ComplianceDashboard;
  keyMetrics: KeyMetric[];
  alerts: Alert[];
}

/**
 * Service for reports and analytics API operations.
 */
@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/reporting`;
  private readonly tenantId = getTenantId();

  // === Analytics Methods ===

  /**
   * Get headcount summary analytics.
   */
  getHeadcountSummary(): Observable<HeadcountSummary> {
    const params = new HttpParams().set('tenantId', this.tenantId);
    return this.http.get<HeadcountSummary>(`${this.apiUrl}/analytics/headcount`, { params });
  }

  /**
   * Get demographics summary analytics.
   */
  getDemographicsSummary(): Observable<DemographicsSummary> {
    const params = new HttpParams().set('tenantId', this.tenantId);
    return this.http.get<DemographicsSummary>(`${this.apiUrl}/analytics/demographics`, { params });
  }

  /**
   * Get turnover analysis.
   */
  getTurnoverAnalysis(from?: string, to?: string): Observable<TurnoverAnalysis> {
    let params = new HttpParams().set('tenantId', this.tenantId);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<TurnoverAnalysis>(`${this.apiUrl}/analytics/turnover`, { params });
  }

  /**
   * Get payroll summary analytics.
   */
  getPayrollSummary(from?: string, to?: string): Observable<PayrollSummary> {
    let params = new HttpParams().set('tenantId', this.tenantId);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<PayrollSummary>(`${this.apiUrl}/analytics/payroll`, { params });
  }

  /**
   * Get leave summary analytics.
   */
  getLeaveSummary(from?: string, to?: string): Observable<LeaveSummary> {
    let params = new HttpParams().set('tenantId', this.tenantId);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<LeaveSummary>(`${this.apiUrl}/analytics/leave`, { params });
  }

  /**
   * Get attendance summary analytics.
   */
  getAttendanceSummary(from?: string, to?: string): Observable<AttendanceSummary> {
    let params = new HttpParams().set('tenantId', this.tenantId);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<AttendanceSummary>(`${this.apiUrl}/analytics/attendance`, { params });
  }

  /**
   * Get recruitment summary analytics.
   */
  getRecruitmentSummary(from?: string, to?: string): Observable<RecruitmentSummary> {
    let params = new HttpParams().set('tenantId', this.tenantId);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<RecruitmentSummary>(`${this.apiUrl}/analytics/recruitment`, { params });
  }

  /**
   * Get compliance dashboard.
   */
  getComplianceDashboard(): Observable<ComplianceDashboard> {
    const params = new HttpParams().set('tenantId', this.tenantId);
    return this.http.get<ComplianceDashboard>(`${this.apiUrl}/analytics/compliance`, { params });
  }

  /**
   * Get executive dashboard (aggregated view).
   */
  getExecutiveDashboard(): Observable<ExecutiveDashboard> {
    const params = new HttpParams().set('tenantId', this.tenantId);
    return this.http.get<ExecutiveDashboard>(`${this.apiUrl}/analytics/executive`, { params });
  }

  // === Report Generation Methods ===

  /**
   * Generate a report synchronously.
   */
  generateReport(request: GenerateReportRequest, userId: string): Observable<ReportResponse> {
    const params = new HttpParams()
      .set('tenantId', this.tenantId)
      .set('userId', userId);
    return this.http.post<ReportResponse>(`${this.apiUrl}/reports`, request, { params });
  }

  /**
   * Generate a report asynchronously.
   */
  generateReportAsync(request: GenerateReportRequest, userId: string): Observable<ReportResponse> {
    const params = new HttpParams()
      .set('tenantId', this.tenantId)
      .set('userId', userId);
    return this.http.post<ReportResponse>(`${this.apiUrl}/reports/async`, request, { params });
  }

  /**
   * Get a report by ID.
   */
  getReport(reportId: string): Observable<ReportResponse> {
    return this.http.get<ReportResponse>(`${this.apiUrl}/reports/${reportId}`);
  }

  /**
   * Get a report by reference.
   */
  getReportByReference(reference: string): Observable<ReportResponse> {
    return this.http.get<ReportResponse>(`${this.apiUrl}/reports/reference/${reference}`);
  }

  /**
   * Search reports with filters.
   */
  searchReports(
    page: number = 0,
    size: number = 10,
    category?: ReportCategory,
    status?: ReportStatus,
    reportType?: ReportType,
    createdBy?: string
  ): Observable<PageResponse<ReportListItem>> {
    let params = new HttpParams()
      .set('tenantId', this.tenantId)
      .set('page', page.toString())
      .set('size', size.toString());

    if (category) params = params.set('category', category);
    if (status) params = params.set('status', status);
    if (reportType) params = params.set('reportType', reportType);
    if (createdBy) params = params.set('createdBy', createdBy);

    return this.http.get<PageResponse<ReportListItem>>(`${this.apiUrl}/reports`, { params });
  }

  /**
   * Get recent reports.
   */
  getRecentReports(limit: number = 10): Observable<ReportListItem[]> {
    const params = new HttpParams()
      .set('tenantId', this.tenantId)
      .set('limit', limit.toString());
    return this.http.get<ReportListItem[]>(`${this.apiUrl}/reports/recent`, { params });
  }

  /**
   * Get download URL for a report.
   */
  getDownloadUrl(reportId: string): Observable<DownloadResponse> {
    return this.http.get<DownloadResponse>(`${this.apiUrl}/reports/${reportId}/download-url`);
  }

  /**
   * Download a report file as a blob via HttpClient (works with proxy auth headers).
   */
  downloadReportFile(reportId: string): Observable<{ blob: Blob; fileName: string }> {
    return this.getDownloadUrl(reportId).pipe(
      switchMap(response => {
        return this.http.get(response.downloadUrl, { responseType: 'blob' }).pipe(
          map(blob => ({ blob, fileName: response.fileName }))
        );
      })
    );
  }

  /**
   * Cancel a report generation.
   */
  cancelReport(reportId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/reports/${reportId}/cancel`, null);
  }

  /**
   * Retry a failed report.
   */
  retryReport(reportId: string): Observable<ReportResponse> {
    return this.http.post<ReportResponse>(`${this.apiUrl}/reports/${reportId}/retry`, null);
  }

  /**
   * Delete a report.
   */
  deleteReport(reportId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/reports/${reportId}`);
  }

  // === Schedule Methods ===

  /**
   * Create a report schedule.
   */
  createSchedule(request: CreateScheduleRequest, userId: string): Observable<ScheduleResponse> {
    const params = new HttpParams()
      .set('tenantId', this.tenantId)
      .set('userId', userId);
    return this.http.post<ScheduleResponse>(`${this.apiUrl}/schedules`, request, { params });
  }

  /**
   * Update a report schedule.
   */
  updateSchedule(scheduleId: string, request: UpdateScheduleRequest): Observable<ScheduleResponse> {
    return this.http.put<ScheduleResponse>(`${this.apiUrl}/schedules/${scheduleId}`, request);
  }

  /**
   * Get a schedule by ID.
   */
  getSchedule(scheduleId: string): Observable<ScheduleResponse> {
    return this.http.get<ScheduleResponse>(`${this.apiUrl}/schedules/${scheduleId}`);
  }

  /**
   * List all schedules.
   */
  listSchedules(
    page: number = 0,
    size: number = 10,
    active?: boolean
  ): Observable<PageResponse<ScheduleResponse>> {
    let params = new HttpParams()
      .set('tenantId', this.tenantId)
      .set('page', page.toString())
      .set('size', size.toString());

    if (active !== undefined) params = params.set('active', active.toString());

    return this.http.get<PageResponse<ScheduleResponse>>(`${this.apiUrl}/schedules`, { params });
  }

  /**
   * Activate a schedule.
   */
  activateSchedule(scheduleId: string): Observable<ScheduleResponse> {
    return this.http.post<ScheduleResponse>(`${this.apiUrl}/schedules/${scheduleId}/activate`, null);
  }

  /**
   * Deactivate a schedule.
   */
  deactivateSchedule(scheduleId: string): Observable<ScheduleResponse> {
    return this.http.post<ScheduleResponse>(`${this.apiUrl}/schedules/${scheduleId}/deactivate`, null);
  }

  /**
   * Run a schedule immediately.
   */
  runScheduleNow(scheduleId: string, userId: string): Observable<ReportResponse> {
    const params = new HttpParams().set('userId', userId);
    return this.http.post<ReportResponse>(`${this.apiUrl}/schedules/${scheduleId}/run`, null, { params });
  }

  /**
   * Delete a schedule.
   */
  deleteSchedule(scheduleId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/schedules/${scheduleId}`);
  }

  // === Statutory Reports Methods ===

  /**
   * Get EMP201 summary for a specific month.
   */
  getEMP201Summary(year: number, month: number): Observable<EMP201Summary> {
    const params = new HttpParams()
      .set('tenantId', this.tenantId)
      .set('year', year.toString())
      .set('month', month.toString());
    return this.http.get<EMP201Summary>(`${this.apiUrl}/statutory/emp201`, { params });
  }

  /**
   * Get EMP501 summary for a tax year.
   */
  getEMP501Summary(taxYear: number, isInterim: boolean = false): Observable<EMP501Summary> {
    const params = new HttpParams()
      .set('tenantId', this.tenantId)
      .set('taxYear', taxYear.toString())
      .set('isInterim', isInterim.toString());
    return this.http.get<EMP501Summary>(`${this.apiUrl}/statutory/emp501`, { params });
  }

  // === Utility Methods ===

  /**
   * Get display label for report type.
   */
  static getReportTypeLabel(type: ReportType): string {
    const labels: Record<ReportType, string> = {
      // HR
      HEADCOUNT: 'Headcount Report',
      TURNOVER: 'Turnover Report',
      DEMOGRAPHICS: 'Demographics Report',
      SKILLS_MATRIX: 'Skills Matrix',
      TRAINING_SUMMARY: 'Training Summary',
      PROBATION_STATUS: 'Probation Status',
      EMPLOYEE_DIRECTORY: 'Employee Directory',
      // Payroll
      PAYROLL_REGISTER: 'Payroll Register',
      PAYROLL_SUMMARY: 'Payroll Summary',
      PAYSLIP_BATCH: 'Payslip Batch',
      STATUTORY_DEDUCTIONS: 'Statutory Deductions',
      COST_TO_COMPANY: 'Cost to Company',
      PAYROLL_VARIANCE: 'Payroll Variance',
      YEAR_TO_DATE: 'Year to Date',
      PAYROLL_JOURNAL: 'Payroll Journal',
      // Leave
      LEAVE_BALANCE: 'Leave Balance',
      LEAVE_UTILIZATION: 'Leave Utilization',
      LEAVE_LIABILITY: 'Leave Liability',
      SICK_LEAVE_ANALYSIS: 'Sick Leave Analysis',
      ABSENCE_TRENDS: 'Absence Trends',
      // Time
      ATTENDANCE_SUMMARY: 'Attendance Summary',
      OVERTIME_REPORT: 'Overtime Report',
      LATE_ARRIVALS: 'Late Arrivals',
      TIMESHEET_COMPLIANCE: 'Timesheet Compliance',
      HOURS_WORKED: 'Hours Worked',
      // Recruitment
      RECRUITMENT_PIPELINE: 'Recruitment Pipeline',
      TIME_TO_HIRE: 'Time to Hire',
      SOURCE_EFFECTIVENESS: 'Source Effectiveness',
      OFFER_ACCEPTANCE: 'Offer Acceptance',
      EXTERNAL_PORTAL_PERFORMANCE: 'Portal Performance',
      JOB_ADVERT_EFFECTIVENESS: 'Job Advert Effectiveness',
      // Statutory
      EMP201: 'EMP201 Monthly',
      EMP501: 'EMP501 Reconciliation',
      UI19: 'UI-19 UIF Certificate',
      IRP5: 'IRP5 Tax Certificate',
      IT3A: 'IT3(a) Third Party',
      EEA2: 'EEA2 Employment Equity',
      EEA4: 'EEA4 Income Differentials',
      // Financial
      LABOR_COST_ANALYSIS: 'Labor Cost Analysis',
      DEPARTMENT_BUDGET: 'Department Budget',
      HEADCOUNT_FORECAST: 'Headcount Forecast',
      // Custom
      AD_HOC: 'Ad-hoc Report',
      CUSTOM_QUERY: 'Custom Query'
    };
    return labels[type] || type;
  }

  /**
   * Get display label for report status.
   */
  static getStatusLabel(status: ReportStatus): string {
    const labels: Record<ReportStatus, string> = {
      PENDING: 'Pending',
      QUEUED: 'Queued',
      GENERATING: 'Generating',
      COMPLETED: 'Completed',
      FAILED: 'Failed',
      CANCELLED: 'Cancelled',
      EXPIRED: 'Expired'
    };
    return labels[status] || status;
  }

  /**
   * Get hex color styles for report status (for inline styles).
   * Uses centralized status config for consistency.
   */
  static getStatusColor(status: ReportStatus): HexColorPair {
    const config = getReportStatusConfig(status);
    return getStatusHexColors(config);
  }

  /**
   * Get Tailwind classes for report status (recommended for dark mode support).
   */
  static getStatusClasses(status: ReportStatus): string {
    const config = getReportStatusConfig(status);
    return getVariantClasses(config.variant);
  }

  /**
   * Get display label for output format.
   */
  static getFormatLabel(format: OutputFormat): string {
    const labels: Record<OutputFormat, string> = {
      PDF: 'PDF',
      EXCEL: 'Excel',
      CSV: 'CSV',
      JSON: 'JSON',
      HTML: 'HTML'
    };
    return labels[format] || format;
  }

  /**
   * Get icon for output format.
   */
  static getFormatIcon(format: OutputFormat): string {
    const icons: Record<OutputFormat, string> = {
      PDF: 'picture_as_pdf',
      EXCEL: 'table_chart',
      CSV: 'description',
      JSON: 'data_object',
      HTML: 'code'
    };
    return icons[format] || 'description';
  }

  /**
   * Get display label for schedule frequency.
   */
  static getFrequencyLabel(frequency: ScheduleFrequency): string {
    const labels: Record<ScheduleFrequency, string> = {
      DAILY: 'Daily',
      WEEKLY: 'Weekly',
      MONTHLY: 'Monthly',
      QUARTERLY: 'Quarterly',
      YEARLY: 'Yearly',
      CUSTOM: 'Custom'
    };
    return labels[frequency] || frequency;
  }

  /**
   * Format file size for display.
   */
  static formatFileSize(bytes?: number): string {
    if (!bytes) return '-';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Format currency (South African Rand).
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Format percentage.
   */
  static formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
  }
}
