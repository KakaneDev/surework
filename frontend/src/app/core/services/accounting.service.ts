import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';
import {
  getJournalStatusConfig,
  getPeriodStatusConfig,
  getPayrollJournalStatusConfig,
  getAccountTypeConfig,
  getStatusHexColors,
  getVariantHexColors,
  getVariantClasses,
  HexColorPair
} from '@shared/ui/status-config';

// === Enums ===

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type AccountSubtype =
  | 'CASH' | 'BANK' | 'ACCOUNTS_RECEIVABLE' | 'INVENTORY' | 'PREPAID_EXPENSE' | 'OTHER_CURRENT_ASSET'
  | 'FIXED_ASSET' | 'ACCUMULATED_DEPRECIATION' | 'OTHER_NON_CURRENT_ASSET'
  | 'ACCOUNTS_PAYABLE' | 'ACCRUED_LIABILITY' | 'TAX_PAYABLE' | 'OTHER_CURRENT_LIABILITY'
  | 'LONG_TERM_LIABILITY'
  | 'SHARE_CAPITAL' | 'RETAINED_EARNINGS' | 'CURRENT_YEAR_EARNINGS' | 'DRAWINGS';
export type NormalBalance = 'DEBIT' | 'CREDIT';
export type VatCategory = 'STANDARD' | 'ZERO_RATED' | 'EXEMPT' | 'OUT_OF_SCOPE' | 'INPUT_VAT' | 'OUTPUT_VAT';
export type JournalEntryType = 'MANUAL' | 'SYSTEM' | 'PAYROLL' | 'INVOICE' | 'BILL' | 'PAYMENT' | 'RECEIPT' | 'TRANSFER' | 'ADJUSTMENT' | 'CLOSING' | 'OPENING' | 'REVERSAL';
export type JournalEntryStatus = 'DRAFT' | 'POSTED' | 'REVERSED' | 'VOID';
export type FiscalPeriodStatus = 'FUTURE' | 'OPEN' | 'CLOSED' | 'LOCKED';

// === Payroll Accounting Types ===

export type PayrollMappingType =
  | 'SALARY_EXPENSE' | 'UIF_EMPLOYER_EXPENSE' | 'SDL_EXPENSE' | 'PENSION_EMPLOYER_EXPENSE' | 'MEDICAL_EMPLOYER_EXPENSE'
  | 'PAYE_LIABILITY' | 'UIF_EMPLOYEE_LIABILITY' | 'UIF_EMPLOYER_LIABILITY' | 'SDL_LIABILITY'
  | 'PENSION_EMPLOYEE_LIABILITY' | 'PENSION_EMPLOYER_LIABILITY'
  | 'MEDICAL_EMPLOYEE_LIABILITY' | 'MEDICAL_EMPLOYER_LIABILITY'
  | 'OTHER_DEDUCTIONS_LIABILITY' | 'NET_PAY_LIABILITY' | 'BANK_ACCOUNT';

export type PayrollJournalStatus = 'CREATED' | 'POSTED' | 'REVERSED' | 'FAILED';

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

// === Account DTOs ===

export interface Account {
  id: string;
  accountCode: string;
  accountName: string;
  description?: string;
  accountType: AccountType;
  accountSubtype?: AccountSubtype;
  normalBalance: NormalBalance;
  parentId?: string;
  parentName?: string;
  isHeader: boolean;
  isActive: boolean;
  isSystemAccount: boolean;
  currentBalance: number;
  ytdDebit: number;
  ytdCredit: number;
  openingBalance: number;
  vatCategory?: VatCategory;
  vatRate?: number;
  bankName?: string;
  bankAccountNumber?: string;
  bankBranchCode?: string;
  createdAt: string;
}

export interface CreateAccountRequest {
  accountCode: string;
  accountName: string;
  description?: string;
  accountType: AccountType;
  accountSubtype?: AccountSubtype;
  parentId?: string;
  isHeader: boolean;
  vatCategory?: VatCategory;
  vatRate?: number;
}

export interface UpdateAccountRequest {
  accountName?: string;
  description?: string;
  accountSubtype?: AccountSubtype;
  isActive?: boolean;
  vatCategory?: VatCategory;
  vatRate?: number;
}

// === Journal Entry DTOs ===

export interface JournalEntryLine {
  id?: string;
  lineNumber?: number;
  accountId: string;
  accountCode?: string;
  accountName?: string;
  description?: string;
  debitAmount?: number;
  creditAmount?: number;
  costCenter?: string;
  department?: string;
  project?: string;
  vatAmount?: number;
  vatCategory?: VatCategory;
  netAmount?: number;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  transactionDate: string;
  postingDate?: string;
  description: string;
  reference?: string;
  entryType: JournalEntryType;
  status: JournalEntryStatus;
  totalDebit: number;
  totalCredit: number;
  fiscalPeriodId?: string;
  fiscalPeriodName?: string;
  sourceDocument?: string;
  sourceId?: string;
  postedBy?: string;
  postedAt?: string;
  reversedBy?: string;
  reversedAt?: string;
  reversalEntryId?: string;
  notes?: string;
  lines: JournalEntryLine[];
  createdAt: string;
}

export interface CreateJournalEntryRequest {
  transactionDate: string;
  description: string;
  reference?: string;
  entryType: JournalEntryType;
  notes?: string;
  lines: JournalEntryLineRequest[];
}

export interface JournalEntryLineRequest {
  accountId: string;
  description?: string;
  debitAmount?: number;
  creditAmount?: number;
  costCenter?: string;
  department?: string;
  project?: string;
}

// === Fiscal Period DTOs ===

export interface FiscalPeriod {
  id: string;
  fiscalYear: number;
  periodNumber: number;
  periodName: string;
  startDate: string;
  endDate: string;
  status: FiscalPeriodStatus;
  isAdjustmentPeriod: boolean;
  isYearEnd: boolean;
  closedAt?: string;
  closedBy?: string;
  reopenedAt?: string;
  reopenedBy?: string;
  notes?: string;
}

// === Report DTOs ===

export interface TrialBalanceEntry {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  debitBalance: number;
  creditBalance: number;
}

export interface TrialBalanceReport {
  asOfDate: string;
  entries: TrialBalanceEntry[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
}

export interface AccountBalance {
  accountId: string;
  accountCode: string;
  accountName: string;
  balance: number;
  isHeader: boolean;
  children?: AccountBalance[];
}

export interface BalanceSheetSection {
  title: string;
  accounts: AccountBalance[];
  total: number;
}

export interface BalanceSheetReport {
  asOfDate: string;
  currentAssets: BalanceSheetSection;
  nonCurrentAssets: BalanceSheetSection;
  totalAssets: number;
  currentLiabilities: BalanceSheetSection;
  nonCurrentLiabilities: BalanceSheetSection;
  totalLiabilities: number;
  equity: BalanceSheetSection;
  totalEquity: number;
  totalLiabilitiesAndEquity: number;
}

export interface IncomeStatementReport {
  startDate: string;
  endDate: string;
  revenue: BalanceSheetSection;
  totalRevenue: number;
  expenses: BalanceSheetSection;
  totalExpenses: number;
  netIncome: number;
}

export interface GeneralLedgerEntry {
  entryId: string;
  entryNumber: string;
  transactionDate: string;
  description: string;
  reference?: string;
  debitAmount?: number;
  creditAmount?: number;
  runningBalance: number;
}

export interface GeneralLedgerReport {
  accountId: string;
  accountCode: string;
  accountName: string;
  startDate: string;
  endDate: string;
  openingBalance: number;
  entries: GeneralLedgerEntry[];
  closingBalance: number;
  totalDebits: number;
  totalCredits: number;
}

// === Dashboard DTOs ===

export interface AccountingDashboard {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  netIncome: number;
  currentRatio: number;
  recentTransactions: JournalEntry[];
  accountsByType: { type: AccountType; count: number; balance: number }[];
  currentPeriod?: FiscalPeriod;
}

// === Payroll Accounting DTOs ===

export interface PayrollAccountMapping {
  id: string;
  mappingType: PayrollMappingType;
  mappingTypeDisplay: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  departmentId?: string;
  departmentName?: string;
  isDefault: boolean;
  active: boolean;
  createdAt: string;
}

export interface CreateAccountMappingRequest {
  mappingType: PayrollMappingType;
  accountId: string;
  departmentId?: string;
  isDefault: boolean;
}

export interface UpdateAccountMappingRequest {
  accountId?: string;
  departmentId?: string;
  isDefault?: boolean;
  active?: boolean;
}

export interface PayrollIntegrationSettings {
  id: string;
  tenantId?: string;
  autoJournalEnabled: boolean;
  journalOnApproval: boolean;
  createPaymentEntry: boolean;
  defaultExpenseAccountId?: string;
  defaultExpenseAccountCode?: string;
  defaultExpenseAccountName?: string;
  defaultLiabilityAccountId?: string;
  defaultLiabilityAccountCode?: string;
  defaultLiabilityAccountName?: string;
  defaultBankAccountId?: string;
  defaultBankAccountCode?: string;
  defaultBankAccountName?: string;
  journalDescriptionTemplate: string;
  updatedAt: string;
}

export interface UpdateIntegrationSettingsRequest {
  autoJournalEnabled?: boolean;
  journalOnApproval?: boolean;
  createPaymentEntry?: boolean;
  defaultExpenseAccountId?: string;
  defaultLiabilityAccountId?: string;
  defaultBankAccountId?: string;
  journalDescriptionTemplate?: string;
}

export interface PayrollJournalEntry {
  id: string;
  payrollRunId: string;
  payrollRunNumber: string;
  journalEntryId: string;
  journalEntryNumber: string;
  periodYear: number;
  periodMonth: number;
  periodDisplay: string;
  totalGross: number;
  totalPaye: number;
  totalUif: number;
  totalSdl: number;
  totalPension: number;
  totalMedical: number;
  totalNet: number;
  totalEmployerCost: number;
  employeeCount: number;
  status: PayrollJournalStatus;
  statusDisplay: string;
  createdAt: string;
}

export interface PayrollAccountingDashboard {
  integrationEnabled: boolean;
  currentYear: number;
  ytdGross: number;
  ytdPaye: number;
  ytdEmployerCost: number;
  journaledRunsCount: number;
  recentJournals: PayrollJournalEntry[];
  accountMappings: PayrollAccountMapping[];
}

export interface PayrollYearSummary {
  year: number;
  totalGross: number;
  totalPaye: number;
  totalUif: number;
  totalSdl: number;
  totalNet: number;
  totalEmployerCost: number;
  employeeCount: number;
  runCount: number;
}

export interface MappingTypeInfo {
  code: PayrollMappingType;
  display: string;
  category: 'EXPENSE' | 'LIABILITY' | 'ASSET';
}

/**
 * Service for accounting API operations.
 */
@Injectable({
  providedIn: 'root'
})
export class AccountingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/accounting';

  // Cached observables
  private accountsCache$?: Observable<Account[]>;

  // === Dashboard Methods ===

  /**
   * Get accounting dashboard data.
   */
  getDashboard(): Observable<AccountingDashboard> {
    return forkJoin({
      trialBalance: this.getTrialBalance(),
      incomeStatement: this.getIncomeStatement(),
      recentJournals: this.searchJournalEntries(0, 5, undefined, 'POSTED'),
      currentPeriod: this.getCurrentPeriod().pipe(catchError(() => of(null)))
    }).pipe(
      map(({ trialBalance, incomeStatement, recentJournals, currentPeriod }) => {
        // Calculate totals from trial balance
        let totalAssets = 0;
        let totalLiabilities = 0;
        let totalEquity = 0;

        const accountsByType: { type: AccountType; count: number; balance: number }[] = [];

        for (const entry of trialBalance.entries) {
          const balance = entry.debitBalance - entry.creditBalance;
          const absBalance = entry.accountType === 'ASSET' || entry.accountType === 'EXPENSE'
            ? entry.debitBalance - entry.creditBalance
            : entry.creditBalance - entry.debitBalance;

          switch (entry.accountType) {
            case 'ASSET':
              totalAssets += absBalance;
              break;
            case 'LIABILITY':
              totalLiabilities += absBalance;
              break;
            case 'EQUITY':
              totalEquity += absBalance;
              break;
          }

          const existing = accountsByType.find(a => a.type === entry.accountType);
          if (existing) {
            existing.count++;
            existing.balance += absBalance;
          } else {
            accountsByType.push({ type: entry.accountType, count: 1, balance: absBalance });
          }
        }

        // Calculate current ratio
        const currentAssets = trialBalance.entries
          .filter(e => e.accountType === 'ASSET' && e.accountCode.startsWith('1'))
          .reduce((sum, e) => sum + (e.debitBalance - e.creditBalance), 0);
        const currentLiabilities = trialBalance.entries
          .filter(e => e.accountType === 'LIABILITY' && e.accountCode.startsWith('2'))
          .reduce((sum, e) => sum + (e.creditBalance - e.debitBalance), 0);
        const currentRatio = currentLiabilities !== 0 ? currentAssets / currentLiabilities : 0;

        return {
          totalAssets,
          totalLiabilities,
          totalEquity,
          netIncome: incomeStatement.netIncome,
          currentRatio,
          recentTransactions: recentJournals.content,
          accountsByType,
          currentPeriod: currentPeriod || undefined
        };
      }),
      catchError(() => of({
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0,
        netIncome: 0,
        currentRatio: 0,
        recentTransactions: [],
        accountsByType: [],
        currentPeriod: undefined
      }))
    );
  }

  // === Account Methods ===

  /**
   * Create a new account.
   */
  createAccount(request: CreateAccountRequest): Observable<Account> {
    this.clearCache();
    return this.http.post<Account>(`${this.apiUrl}/accounts`, request);
  }

  /**
   * Update an account.
   */
  updateAccount(accountId: string, request: UpdateAccountRequest): Observable<Account> {
    this.clearCache();
    return this.http.put<Account>(`${this.apiUrl}/accounts/${accountId}`, request);
  }

  /**
   * Get account by ID.
   */
  getAccount(accountId: string): Observable<Account> {
    return this.http.get<Account>(`${this.apiUrl}/accounts/${accountId}`);
  }

  /**
   * Get account by code.
   */
  getAccountByCode(accountCode: string): Observable<Account> {
    return this.http.get<Account>(`${this.apiUrl}/accounts/code/${accountCode}`);
  }

  /**
   * Search accounts.
   */
  searchAccounts(
    page: number = 0,
    size: number = 50,
    searchTerm?: string,
    accountType?: AccountType,
    active?: boolean
  ): Observable<PageResponse<Account>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (searchTerm) params = params.set('search', searchTerm);
    if (accountType) params = params.set('type', accountType);
    if (active !== undefined) params = params.set('active', active.toString());

    return this.http.get<PageResponse<Account>>(`${this.apiUrl}/accounts`, { params });
  }

  /**
   * Get all accounts (cached).
   */
  getAllAccounts(): Observable<Account[]> {
    if (!this.accountsCache$) {
      this.accountsCache$ = this.searchAccounts(0, 1000, undefined, undefined, true).pipe(
        map(response => response.content),
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
    return this.accountsCache$;
  }

  /**
   * Get accounts by type.
   */
  getAccountsByType(accountType: AccountType): Observable<Account[]> {
    return this.http.get<Account[]>(`${this.apiUrl}/accounts/type/${accountType}`);
  }

  /**
   * Get postable accounts (non-header).
   */
  getPostableAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(`${this.apiUrl}/accounts/postable`);
  }

  /**
   * Deactivate an account.
   */
  deactivateAccount(accountId: string): Observable<void> {
    this.clearCache();
    return this.http.post<void>(`${this.apiUrl}/accounts/${accountId}/deactivate`, null);
  }

  /**
   * Activate an account.
   */
  activateAccount(accountId: string): Observable<void> {
    this.clearCache();
    return this.http.post<void>(`${this.apiUrl}/accounts/${accountId}/activate`, null);
  }

  /**
   * Get account hierarchy for tree view.
   */
  getAccountHierarchy(): Observable<Account[]> {
    return this.getAllAccounts();
  }

  // === Journal Entry Methods ===

  /**
   * Create a new journal entry.
   */
  createJournalEntry(request: CreateJournalEntryRequest): Observable<JournalEntry> {
    return this.http.post<JournalEntry>(`${this.apiUrl}/journal-entries`, request);
  }

  /**
   * Get journal entry by ID.
   */
  getJournalEntry(entryId: string): Observable<JournalEntry> {
    return this.http.get<JournalEntry>(`${this.apiUrl}/journal-entries/${entryId}`);
  }

  /**
   * Get journal entry by number.
   */
  getJournalEntryByNumber(entryNumber: string): Observable<JournalEntry> {
    return this.http.get<JournalEntry>(`${this.apiUrl}/journal-entries/number/${entryNumber}`);
  }

  /**
   * Search journal entries.
   */
  searchJournalEntries(
    page: number = 0,
    size: number = 20,
    entryType?: JournalEntryType,
    status?: JournalEntryStatus,
    startDate?: string,
    endDate?: string,
    searchTerm?: string
  ): Observable<PageResponse<JournalEntry>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (entryType) params = params.set('entryType', entryType);
    if (status) params = params.set('status', status);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (searchTerm) params = params.set('search', searchTerm);

    return this.http.get<PageResponse<JournalEntry>>(`${this.apiUrl}/journal-entries`, { params });
  }

  /**
   * Get draft journal entries.
   */
  getDraftEntries(): Observable<JournalEntry[]> {
    return this.http.get<JournalEntry[]>(`${this.apiUrl}/journal-entries/drafts`);
  }

  /**
   * Post a journal entry.
   */
  postJournalEntry(entryId: string): Observable<JournalEntry> {
    return this.http.post<JournalEntry>(`${this.apiUrl}/journal-entries/${entryId}/post`, null);
  }

  /**
   * Reverse a journal entry.
   */
  reverseJournalEntry(entryId: string, reason: string): Observable<JournalEntry> {
    const params = new HttpParams().set('reason', reason);
    return this.http.post<JournalEntry>(`${this.apiUrl}/journal-entries/${entryId}/reverse`, null, { params });
  }

  /**
   * Delete a draft journal entry.
   */
  deleteJournalEntry(entryId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/journal-entries/${entryId}`);
  }

  // === Fiscal Period Methods ===

  /**
   * Generate fiscal year periods.
   */
  generateFiscalYear(fiscalYear: number): Observable<FiscalPeriod[]> {
    return this.http.post<FiscalPeriod[]>(`${this.apiUrl}/fiscal-periods/generate/${fiscalYear}`, null);
  }

  /**
   * Get fiscal periods for a year.
   */
  getFiscalPeriodsForYear(fiscalYear: number): Observable<FiscalPeriod[]> {
    return this.http.get<FiscalPeriod[]>(`${this.apiUrl}/fiscal-periods/year/${fiscalYear}`);
  }

  /**
   * Get current open period.
   */
  getCurrentPeriod(): Observable<FiscalPeriod> {
    return this.http.get<FiscalPeriod>(`${this.apiUrl}/fiscal-periods/current`);
  }

  /**
   * Open a fiscal period.
   */
  openPeriod(periodId: string): Observable<FiscalPeriod> {
    return this.http.post<FiscalPeriod>(`${this.apiUrl}/fiscal-periods/${periodId}/open`, null);
  }

  /**
   * Close a fiscal period.
   */
  closePeriod(periodId: string): Observable<FiscalPeriod> {
    return this.http.post<FiscalPeriod>(`${this.apiUrl}/fiscal-periods/${periodId}/close`, null);
  }

  /**
   * Reopen a fiscal period.
   */
  reopenPeriod(periodId: string): Observable<FiscalPeriod> {
    return this.http.post<FiscalPeriod>(`${this.apiUrl}/fiscal-periods/${periodId}/reopen`, null);
  }

  /**
   * Lock a fiscal period.
   */
  lockPeriod(periodId: string): Observable<FiscalPeriod> {
    return this.http.post<FiscalPeriod>(`${this.apiUrl}/fiscal-periods/${periodId}/lock`, null);
  }

  // === Report Methods ===

  /**
   * Get trial balance report.
   */
  getTrialBalance(asOfDate?: string): Observable<TrialBalanceReport> {
    let params = new HttpParams();
    if (asOfDate) params = params.set('asOfDate', asOfDate);
    return this.http.get<TrialBalanceReport>(`${this.apiUrl}/reports/trial-balance`, { params });
  }

  /**
   * Get balance sheet report.
   */
  getBalanceSheet(asOfDate?: string): Observable<BalanceSheetReport> {
    let params = new HttpParams();
    if (asOfDate) params = params.set('asOfDate', asOfDate);
    return this.http.get<BalanceSheetReport>(`${this.apiUrl}/reports/balance-sheet`, { params });
  }

  /**
   * Get income statement report.
   */
  getIncomeStatement(startDate?: string, endDate?: string): Observable<IncomeStatementReport> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<IncomeStatementReport>(`${this.apiUrl}/reports/income-statement`, { params });
  }

  /**
   * Get general ledger report for an account.
   */
  getGeneralLedger(accountId: string, startDate?: string, endDate?: string): Observable<GeneralLedgerReport> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<GeneralLedgerReport>(`${this.apiUrl}/reports/general-ledger/${accountId}`, { params });
  }

  // === Year-End Processing ===

  /**
   * Perform year-end close.
   */
  performYearEndClose(fiscalYear: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/year-end-close/${fiscalYear}`, null);
  }

  // === Payroll Accounting Methods ===

  /**
   * Get payroll accounting dashboard.
   */
  getPayrollDashboard(): Observable<PayrollAccountingDashboard> {
    return this.http.get<PayrollAccountingDashboard>(`${this.apiUrl}/payroll/dashboard`);
  }

  /**
   * Get payroll year summary.
   */
  getPayrollYearSummary(year: number): Observable<PayrollYearSummary> {
    return this.http.get<PayrollYearSummary>(`${this.apiUrl}/payroll/summary/${year}`);
  }

  /**
   * Get recent payroll journals.
   */
  getRecentPayrollJournals(limit: number = 20): Observable<PayrollJournalEntry[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<PayrollJournalEntry[]>(`${this.apiUrl}/payroll/journals`, { params });
  }

  /**
   * Get payroll journals for a year.
   */
  getPayrollJournalsForYear(year: number): Observable<PayrollJournalEntry[]> {
    return this.http.get<PayrollJournalEntry[]>(`${this.apiUrl}/payroll/journals/year/${year}`);
  }

  /**
   * Get journal for a payroll run.
   */
  getPayrollJournalByRun(payrollRunId: string): Observable<PayrollJournalEntry> {
    return this.http.get<PayrollJournalEntry>(`${this.apiUrl}/payroll/journals/run/${payrollRunId}`);
  }

  /**
   * Check if payroll run has been journaled.
   */
  isPayrollRunJournaled(payrollRunId: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/payroll/journals/run/${payrollRunId}/exists`);
  }

  /**
   * Get all payroll account mappings.
   */
  getPayrollMappings(): Observable<PayrollAccountMapping[]> {
    return this.http.get<PayrollAccountMapping[]>(`${this.apiUrl}/payroll/mappings`);
  }

  /**
   * Get default payroll account mappings.
   */
  getDefaultPayrollMappings(): Observable<PayrollAccountMapping[]> {
    return this.http.get<PayrollAccountMapping[]>(`${this.apiUrl}/payroll/mappings/defaults`);
  }

  /**
   * Get payroll mappings by type.
   */
  getPayrollMappingsByType(type: PayrollMappingType): Observable<PayrollAccountMapping[]> {
    return this.http.get<PayrollAccountMapping[]>(`${this.apiUrl}/payroll/mappings/type/${type}`);
  }

  /**
   * Create payroll account mapping.
   */
  createPayrollMapping(request: CreateAccountMappingRequest): Observable<PayrollAccountMapping> {
    return this.http.post<PayrollAccountMapping>(`${this.apiUrl}/payroll/mappings`, request);
  }

  /**
   * Update payroll account mapping.
   */
  updatePayrollMapping(mappingId: string, request: UpdateAccountMappingRequest): Observable<PayrollAccountMapping> {
    return this.http.put<PayrollAccountMapping>(`${this.apiUrl}/payroll/mappings/${mappingId}`, request);
  }

  /**
   * Delete payroll account mapping.
   */
  deletePayrollMapping(mappingId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/payroll/mappings/${mappingId}`);
  }

  /**
   * Get payroll integration settings.
   */
  getPayrollSettings(): Observable<PayrollIntegrationSettings> {
    return this.http.get<PayrollIntegrationSettings>(`${this.apiUrl}/payroll/settings`);
  }

  /**
   * Update payroll integration settings.
   */
  updatePayrollSettings(request: UpdateIntegrationSettingsRequest): Observable<PayrollIntegrationSettings> {
    return this.http.put<PayrollIntegrationSettings>(`${this.apiUrl}/payroll/settings`, request);
  }

  /**
   * Check if auto-journaling is enabled.
   */
  isAutoJournalEnabled(): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/payroll/settings/auto-journal-enabled`);
  }

  /**
   * Get available mapping types.
   */
  getPayrollMappingTypes(): Observable<MappingTypeInfo[]> {
    return this.http.get<MappingTypeInfo[]>(`${this.apiUrl}/payroll/mapping-types`);
  }

  // === Utility Methods ===

  /**
   * Clear cached data.
   */
  clearCache(): void {
    this.accountsCache$ = undefined;
  }

  /**
   * Format currency for display.
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Get label for account type.
   */
  static getAccountTypeLabel(type: AccountType): string {
    const labels: Record<AccountType, string> = {
      ASSET: 'Assets',
      LIABILITY: 'Liabilities',
      EQUITY: 'Equity',
      REVENUE: 'Revenue',
      EXPENSE: 'Expenses'
    };
    return labels[type] || type;
  }

  /**
   * Get color for account type.
   * Uses centralized status config for consistency.
   */
  static getAccountTypeColor(type: AccountType): HexColorPair {
    const config = getAccountTypeConfig(type);
    return getVariantHexColors(config.variant);
  }

  /**
   * Get label for journal entry status.
   */
  static getJournalStatusLabel(status: JournalEntryStatus): string {
    const labels: Record<JournalEntryStatus, string> = {
      DRAFT: 'Draft',
      POSTED: 'Posted',
      REVERSED: 'Reversed',
      VOID: 'Void'
    };
    return labels[status] || status;
  }

  /**
   * Get hex color styles for journal entry status (for inline styles).
   * Uses centralized status config for consistency.
   */
  static getJournalStatusColor(status: JournalEntryStatus): HexColorPair {
    const config = getJournalStatusConfig(status);
    return getStatusHexColors(config);
  }

  /**
   * Get Tailwind classes for journal entry status (recommended for dark mode support).
   */
  static getJournalStatusClasses(status: JournalEntryStatus): string {
    const config = getJournalStatusConfig(status);
    return getVariantClasses(config.variant);
  }

  /**
   * Get label for journal entry type.
   */
  static getJournalTypeLabel(type: JournalEntryType): string {
    const labels: Record<JournalEntryType, string> = {
      MANUAL: 'Manual',
      SYSTEM: 'System',
      PAYROLL: 'Payroll',
      INVOICE: 'Invoice',
      BILL: 'Bill',
      PAYMENT: 'Payment',
      RECEIPT: 'Receipt',
      TRANSFER: 'Transfer',
      ADJUSTMENT: 'Adjustment',
      CLOSING: 'Closing',
      OPENING: 'Opening',
      REVERSAL: 'Reversal'
    };
    return labels[type] || type;
  }

  /**
   * Get label for fiscal period status.
   */
  static getPeriodStatusLabel(status: FiscalPeriodStatus): string {
    const labels: Record<FiscalPeriodStatus, string> = {
      FUTURE: 'Future',
      OPEN: 'Open',
      CLOSED: 'Closed',
      LOCKED: 'Locked'
    };
    return labels[status] || status;
  }

  /**
   * Get hex color styles for fiscal period status (for inline styles).
   * Uses centralized status config for consistency.
   */
  static getPeriodStatusColor(status: FiscalPeriodStatus): HexColorPair {
    const config = getPeriodStatusConfig(status);
    return getStatusHexColors(config);
  }

  /**
   * Get Tailwind classes for fiscal period status (recommended for dark mode support).
   */
  static getPeriodStatusClasses(status: FiscalPeriodStatus): string {
    const config = getPeriodStatusConfig(status);
    return getVariantClasses(config.variant);
  }

  /**
   * Get label for VAT category.
   */
  static getVatCategoryLabel(category: VatCategory): string {
    const labels: Record<VatCategory, string> = {
      STANDARD: 'Standard (15%)',
      ZERO_RATED: 'Zero Rated (0%)',
      EXEMPT: 'Exempt',
      OUT_OF_SCOPE: 'Out of Scope',
      INPUT_VAT: 'Input VAT',
      OUTPUT_VAT: 'Output VAT'
    };
    return labels[category] || category;
  }

  /**
   * Get label for payroll mapping type.
   */
  static getPayrollMappingTypeLabel(type: PayrollMappingType): string {
    const labels: Record<PayrollMappingType, string> = {
      SALARY_EXPENSE: 'Salary Expense',
      UIF_EMPLOYER_EXPENSE: 'UIF Employer Expense',
      SDL_EXPENSE: 'SDL Expense',
      PENSION_EMPLOYER_EXPENSE: 'Pension Employer Expense',
      MEDICAL_EMPLOYER_EXPENSE: 'Medical Aid Employer Expense',
      PAYE_LIABILITY: 'PAYE Liability',
      UIF_EMPLOYEE_LIABILITY: 'UIF Employee Liability',
      UIF_EMPLOYER_LIABILITY: 'UIF Employer Liability',
      SDL_LIABILITY: 'SDL Liability',
      PENSION_EMPLOYEE_LIABILITY: 'Pension Employee Liability',
      PENSION_EMPLOYER_LIABILITY: 'Pension Employer Liability',
      MEDICAL_EMPLOYEE_LIABILITY: 'Medical Aid Employee Liability',
      MEDICAL_EMPLOYER_LIABILITY: 'Medical Aid Employer Liability',
      OTHER_DEDUCTIONS_LIABILITY: 'Other Deductions Liability',
      NET_PAY_LIABILITY: 'Net Pay Liability',
      BANK_ACCOUNT: 'Bank Account'
    };
    return labels[type] || type;
  }

  /**
   * Get category for payroll mapping type.
   */
  static getPayrollMappingCategory(type: PayrollMappingType): 'EXPENSE' | 'LIABILITY' | 'ASSET' {
    const expenseTypes: PayrollMappingType[] = [
      'SALARY_EXPENSE', 'UIF_EMPLOYER_EXPENSE', 'SDL_EXPENSE',
      'PENSION_EMPLOYER_EXPENSE', 'MEDICAL_EMPLOYER_EXPENSE'
    ];
    const assetTypes: PayrollMappingType[] = ['BANK_ACCOUNT'];

    if (expenseTypes.includes(type)) return 'EXPENSE';
    if (assetTypes.includes(type)) return 'ASSET';
    return 'LIABILITY';
  }

  /**
   * Get hex color styles for payroll journal status (for inline styles).
   * Uses centralized status config for consistency.
   */
  static getPayrollJournalStatusColor(status: PayrollJournalStatus): HexColorPair {
    const config = getPayrollJournalStatusConfig(status);
    return getStatusHexColors(config);
  }

  /**
   * Get Tailwind classes for payroll journal status (recommended for dark mode support).
   */
  static getPayrollJournalStatusClasses(status: PayrollJournalStatus): string {
    const config = getPayrollJournalStatusConfig(status);
    return getVariantClasses(config.variant);
  }

  /**
   * Format period display.
   */
  static formatPayrollPeriod(year: number, month: number): string {
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long' });
  }

  /**
   * Build account tree from flat list.
   */
  static buildAccountTree(accounts: Account[]): Account[] {
    const accountMap = new Map<string, Account & { children?: Account[] }>();
    const roots: (Account & { children?: Account[] })[] = [];

    // First pass: create map
    for (const account of accounts) {
      accountMap.set(account.id, { ...account, children: [] });
    }

    // Second pass: build tree
    for (const account of accounts) {
      const node = accountMap.get(account.id)!;
      if (account.parentId && accountMap.has(account.parentId)) {
        accountMap.get(account.parentId)!.children!.push(node);
      } else {
        roots.push(node);
      }
    }

    // Sort by account code
    const sortByCode = (a: Account, b: Account) => a.accountCode.localeCompare(b.accountCode);
    roots.sort(sortByCode);
    for (const node of accountMap.values()) {
      node.children?.sort(sortByCode);
    }

    return roots;
  }
}
