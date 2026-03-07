import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from './accounting.service';
import {
  getBankConnectionStatusConfig,
  getReconciliationStatusConfig,
  getVariantClasses
} from '@shared/ui/status-config';

// === Enums ===

export type ConnectionStatus = 'PENDING' | 'ACTIVE' | 'DISCONNECTED' | 'ERROR' | 'REAUTH_REQUIRED';
export type SyncStatus = 'SUCCESS' | 'PARTIAL' | 'FAILED';
export type TransactionType = 'DEBIT' | 'CREDIT';
export type ReconciliationStatus = 'UNRECONCILED' | 'SUGGESTED' | 'MATCHED' | 'RECONCILED' | 'EXCLUDED';
export type SuggestionSource = 'BANK_RULE' | 'ML_MODEL' | 'HISTORICAL' | 'PAYEE_MATCH';
export type ConditionField = 'DESCRIPTION' | 'PAYEE_NAME' | 'AMOUNT' | 'REFERENCE' | 'CATEGORY' | 'MCC';
export type ConditionOperator = 'CONTAINS' | 'STARTS_WITH' | 'ENDS_WITH' | 'EQUALS' | 'NOT_CONTAINS' | 'GREATER_THAN' | 'LESS_THAN' | 'BETWEEN' | 'REGEX';

// === Bank Account DTOs ===

export interface BankAccount {
  id: string;
  accountName: string;
  accountNumberMasked: string;
  institutionId: string;
  institutionName: string;
  institutionLogo?: string;
  currency: string;
  accountType?: string;
  status: ConnectionStatus;
  lastSyncAt?: string;
  lastSyncStatus?: SyncStatus;
  syncErrorMessage?: string;
  glAccountId?: string;
  glAccountCode?: string;
  glAccountName?: string;
  currentBalance?: number;
  availableBalance?: number;
  balanceUpdatedAt?: string;
  unreconciledCount: number;
  createdAt: string;
}

export interface ConnectBankRequest {
  stitchAccountId: string;
  accountName: string;
  accountNumber?: string;
  institutionId: string;
  institutionName: string;
  institutionLogo?: string;
  currency?: string;
  accountType?: string;
  stitchUserId?: string;
  stitchConsentId?: string;
  glAccountId?: string;
}

export interface UpdateBankAccountRequest {
  accountName?: string;
  glAccountId?: string;
}

export interface StitchOAuthResponse {
  authorizationUrl: string;
  state: string;
  codeVerifier: string;
}

export interface StitchCallbackRequest {
  code: string;
  state: string;
}

// === Bank Transaction DTOs ===

export interface BankTransaction {
  id: string;
  bankAccountId: string;
  bankAccountName: string;
  externalId: string;
  reference?: string;
  transactionDate: string;
  postedDate?: string;
  description: string;
  payeeName?: string;
  amount: number;
  transactionType: TransactionType;
  runningBalance?: number;
  category?: string;
  reconciliationStatus: ReconciliationStatus;
  reconciledAt?: string;
  journalEntryId?: string;
  journalEntryNumber?: string;
  matchedAccountId?: string;
  matchedAccountCode?: string;
  matchedAccountName?: string;
  suggestedAccountId?: string;
  suggestedAccountCode?: string;
  suggestedAccountName?: string;
  suggestionConfidence?: number;
  suggestionSource?: SuggestionSource;
  createdAt: string;
}

export interface ImportTransactionRequest {
  externalId: string;
  transactionDate: string;
  postedDate?: string;
  description: string;
  payeeName?: string;
  amount: number;
  transactionType: TransactionType;
  runningBalance?: number;
  category?: string;
  merchantCategoryCode?: string;
  reference?: string;
}

// === Bank Rule DTOs ===

export interface BankRule {
  id: string;
  name: string;
  description?: string;
  conditionField: ConditionField;
  conditionOperator: ConditionOperator;
  conditionValue: string;
  conditionValueSecondary?: string;
  conditionDescription: string;
  targetAccountId: string;
  targetAccountCode: string;
  targetAccountName: string;
  payeeNameOverride?: string;
  active: boolean;
  priority: number;
  matchCount: number;
  lastMatchedAt?: string;
  bankAccountId?: string;
  bankAccountName?: string;
  createdAt: string;
}

export interface CreateBankRuleRequest {
  name: string;
  description?: string;
  conditionField: ConditionField;
  conditionOperator: ConditionOperator;
  conditionValue: string;
  conditionValueSecondary?: string;
  targetAccountId: string;
  payeeNameOverride?: string;
  priority?: number;
  bankAccountId?: string;
}

export interface UpdateBankRuleRequest {
  name?: string;
  description?: string;
  conditionField?: ConditionField;
  conditionOperator?: ConditionOperator;
  conditionValue?: string;
  conditionValueSecondary?: string;
  targetAccountId?: string;
  payeeNameOverride?: string;
  active?: boolean;
  priority?: number;
  bankAccountId?: string;
}

// === Reconciliation DTOs ===

export interface ReconcileTransactionRequest {
  accountId: string;
  description?: string;
  createJournalEntry: boolean;
}

export interface BulkReconcileRequest {
  transactionIds: string[];
  accountId: string;
  createJournalEntries: boolean;
}

export interface ReconciliationSummary {
  bankAccountId: string;
  bankAccountName: string;
  totalTransactions: number;
  unreconciledCount: number;
  suggestedCount: number;
  matchedCount: number;
  reconciledCount: number;
  excludedCount: number;
  unreconciledDebits: number;
  unreconciledCredits: number;
  unreconciledNet: number;
}

export interface SuggestedMatch {
  transactionId: string;
  suggestedAccountId: string;
  suggestedAccountCode: string;
  suggestedAccountName: string;
  confidence: number;
  source: SuggestionSource;
  reason: string;
}

// === Sync DTOs ===

export interface SyncResult {
  bankAccountId: string;
  transactionsImported: number;
  transactionsDuplicate: number;
  transactionsFailed: number;
  rulesApplied: number;
  syncStartedAt: string;
  syncCompletedAt: string;
  success: boolean;
  errorMessage?: string;
}

// === Dashboard DTOs ===

export interface BankingDashboard {
  connectedAccounts: number;
  accountsNeedingReauth: number;
  totalUnreconciled: number;
  unreconciledInflow: number;
  unreconciledOutflow: number;
  accountSummaries: BankAccountSummary[];
  recentTransactions: BankTransaction[];
}

export interface BankAccountSummary {
  id: string;
  accountName: string;
  institutionName: string;
  institutionLogo?: string;
  currentBalance?: number;
  unreconciledCount: number;
  status: ConnectionStatus;
  lastSyncAt?: string;
}

// === Institution DTOs ===

export interface InstitutionInfo {
  id: string;
  name: string;
  logo?: string;
  country: string;
  supportsAccountLinking: boolean;
  supportsPayments: boolean;
}

// === Reconciliation Statement ===

export interface BankReconciliationStatement {
  bankAccountId: string;
  bankAccountName: string;
  asOfDate: string;
  bankStatementBalance: number;
  glBalance: number;
  outstandingDeposits: OutstandingItem[];
  totalOutstandingDeposits: number;
  outstandingPayments: OutstandingItem[];
  totalOutstandingPayments: number;
  adjustedBankBalance: number;
  difference: number;
  isReconciled: boolean;
}

export interface OutstandingItem {
  transactionId: string;
  date: string;
  description: string;
  reference?: string;
  amount: number;
}

/**
 * Service for bank integration API operations.
 */
@Injectable({
  providedIn: 'root'
})
export class BankingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/accounting/banking';

  // === Bank Account Methods ===

  getBankAccounts(): Observable<BankAccount[]> {
    return this.http.get<BankAccount[]>(`${this.apiUrl}/accounts`);
  }

  getBankAccount(bankAccountId: string): Observable<BankAccount> {
    return this.http.get<BankAccount>(`${this.apiUrl}/accounts/${bankAccountId}`);
  }

  connectBankAccount(request: ConnectBankRequest): Observable<BankAccount> {
    return this.http.post<BankAccount>(`${this.apiUrl}/accounts`, request);
  }

  updateBankAccount(bankAccountId: string, request: UpdateBankAccountRequest): Observable<BankAccount> {
    return this.http.put<BankAccount>(`${this.apiUrl}/accounts/${bankAccountId}`, request);
  }

  disconnectBankAccount(bankAccountId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/accounts/${bankAccountId}/disconnect`, {});
  }

  // === OAuth Methods ===

  initiateOAuth(redirectUri: string): Observable<StitchOAuthResponse> {
    return this.http.post<StitchOAuthResponse>(`${this.apiUrl}/oauth/initiate`, null, {
      params: { redirectUri }
    });
  }

  completeOAuth(callback: StitchCallbackRequest): Observable<BankAccount[]> {
    return this.http.post<BankAccount[]>(`${this.apiUrl}/oauth/callback`, callback);
  }

  // === Sync Methods ===

  syncTransactions(bankAccountId: string): Observable<SyncResult> {
    return this.http.post<SyncResult>(`${this.apiUrl}/accounts/${bankAccountId}/sync`, {});
  }

  syncAllAccounts(): Observable<SyncResult[]> {
    return this.http.post<SyncResult[]>(`${this.apiUrl}/sync-all`, {});
  }

  importTransactions(bankAccountId: string, transactions: ImportTransactionRequest[]): Observable<BankTransaction[]> {
    return this.http.post<BankTransaction[]>(`${this.apiUrl}/accounts/${bankAccountId}/import`, transactions);
  }

  // === Transaction Methods ===

  getTransactions(
    bankAccountId: string,
    page = 0,
    size = 50,
    searchTerm?: string,
    status?: ReconciliationStatus | 'ALL',
    type?: TransactionType | 'ALL',
    startDate?: string,
    endDate?: string
  ): Observable<PageResponse<BankTransaction>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (searchTerm) params = params.set('searchTerm', searchTerm);
    if (status && status !== 'ALL') params = params.set('status', status);
    if (type && type !== 'ALL') params = params.set('type', type);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<PageResponse<BankTransaction>>(`${this.apiUrl}/accounts/${bankAccountId}/transactions`, { params });
  }

  getUnreconciledTransactions(bankAccountId: string): Observable<BankTransaction[]> {
    return this.http.get<BankTransaction[]>(`${this.apiUrl}/accounts/${bankAccountId}/transactions/unreconciled`);
  }

  getTransaction(transactionId: string): Observable<BankTransaction> {
    return this.http.get<BankTransaction>(`${this.apiUrl}/transactions/${transactionId}`);
  }

  // === Bank Rule Methods ===

  getBankRules(): Observable<BankRule[]> {
    return this.http.get<BankRule[]>(`${this.apiUrl}/rules`);
  }

  getBankRule(ruleId: string): Observable<BankRule> {
    return this.http.get<BankRule>(`${this.apiUrl}/rules/${ruleId}`);
  }

  createBankRule(request: CreateBankRuleRequest): Observable<BankRule> {
    return this.http.post<BankRule>(`${this.apiUrl}/rules`, request);
  }

  updateBankRule(ruleId: string, request: UpdateBankRuleRequest): Observable<BankRule> {
    return this.http.put<BankRule>(`${this.apiUrl}/rules/${ruleId}`, request);
  }

  deleteBankRule(ruleId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/rules/${ruleId}`);
  }

  testRule(ruleId: string, transactionId: string): Observable<boolean> {
    return this.http.post<boolean>(`${this.apiUrl}/rules/${ruleId}/test/${transactionId}`, {});
  }

  applyRulesToTransactions(bankAccountId: string): Observable<number> {
    return this.http.post<number>(`${this.apiUrl}/accounts/${bankAccountId}/apply-rules`, {});
  }

  // === Reconciliation Methods ===

  reconcileTransaction(transactionId: string, request: ReconcileTransactionRequest): Observable<BankTransaction> {
    return this.http.post<BankTransaction>(`${this.apiUrl}/transactions/${transactionId}/reconcile`, request);
  }

  bulkReconcile(request: BulkReconcileRequest): Observable<BankTransaction[]> {
    return this.http.post<BankTransaction[]>(`${this.apiUrl}/reconcile/bulk`, request);
  }

  acceptSuggestion(transactionId: string): Observable<BankTransaction> {
    return this.http.post<BankTransaction>(`${this.apiUrl}/transactions/${transactionId}/accept-suggestion`, {});
  }

  unreconcile(transactionId: string): Observable<BankTransaction> {
    return this.http.post<BankTransaction>(`${this.apiUrl}/transactions/${transactionId}/unreconcile`, {});
  }

  excludeTransaction(transactionId: string): Observable<BankTransaction> {
    return this.http.post<BankTransaction>(`${this.apiUrl}/transactions/${transactionId}/exclude`, {});
  }

  // === Matching Methods ===

  getSuggestedMatches(transactionId: string): Observable<SuggestedMatch[]> {
    return this.http.get<SuggestedMatch[]>(`${this.apiUrl}/transactions/${transactionId}/suggested-matches`);
  }

  findPotentialMatches(bankAccountId: string, amount: number, startDate: string, endDate: string): Observable<BankTransaction[]> {
    const params = new HttpParams()
      .set('amount', amount.toString())
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<BankTransaction[]>(`${this.apiUrl}/accounts/${bankAccountId}/potential-matches`, { params });
  }

  autoMatchTransactions(bankAccountId: string): Observable<number> {
    return this.http.post<number>(`${this.apiUrl}/accounts/${bankAccountId}/auto-match`, {});
  }

  // === Reconciliation Report Methods ===

  getReconciliationSummary(bankAccountId: string): Observable<ReconciliationSummary> {
    return this.http.get<ReconciliationSummary>(`${this.apiUrl}/accounts/${bankAccountId}/reconciliation-summary`);
  }

  getAllReconciliationSummaries(): Observable<ReconciliationSummary[]> {
    return this.http.get<ReconciliationSummary[]>(`${this.apiUrl}/reconciliation-summaries`);
  }

  getReconciliationStatement(bankAccountId: string, asOfDate?: string): Observable<BankReconciliationStatement> {
    let params = new HttpParams();
    if (asOfDate) params = params.set('asOfDate', asOfDate);

    return this.http.get<BankReconciliationStatement>(`${this.apiUrl}/accounts/${bankAccountId}/reconciliation-statement`, { params });
  }

  // === Dashboard Methods ===

  getDashboard(): Observable<BankingDashboard> {
    return this.http.get<BankingDashboard>(`${this.apiUrl}/dashboard`);
  }

  // === Institution Methods ===

  getSupportedInstitutions(): Observable<InstitutionInfo[]> {
    return this.http.get<InstitutionInfo[]>(`${this.apiUrl}/institutions`);
  }

  // === Static Utility Methods ===

  static getStatusLabel(status: ConnectionStatus): string {
    const labels: Record<ConnectionStatus, string> = {
      PENDING: 'Connecting',
      ACTIVE: 'Connected',
      DISCONNECTED: 'Disconnected',
      ERROR: 'Error',
      REAUTH_REQUIRED: 'Reconnect Required'
    };
    return labels[status] || status;
  }

  /**
   * Get Tailwind classes for connection status.
   * Uses centralized status config for consistency.
   */
  static getStatusColor(status: ConnectionStatus): string {
    const config = getBankConnectionStatusConfig(status);
    return getVariantClasses(config.variant);
  }

  static getReconciliationStatusLabel(status: ReconciliationStatus): string {
    const labels: Record<ReconciliationStatus, string> = {
      UNRECONCILED: 'Unreconciled',
      SUGGESTED: 'Suggested',
      MATCHED: 'Matched',
      RECONCILED: 'Reconciled',
      EXCLUDED: 'Excluded'
    };
    return labels[status] || status;
  }

  /**
   * Get Tailwind classes for reconciliation status.
   * Uses centralized status config for consistency.
   */
  static getReconciliationStatusColor(status: ReconciliationStatus): string {
    const config = getReconciliationStatusConfig(status);
    return getVariantClasses(config.variant);
  }

  static getConditionFieldLabel(field: ConditionField): string {
    const labels: Record<ConditionField, string> = {
      DESCRIPTION: 'Description',
      PAYEE_NAME: 'Payee Name',
      AMOUNT: 'Amount',
      REFERENCE: 'Reference',
      CATEGORY: 'Category',
      MCC: 'Merchant Code'
    };
    return labels[field] || field;
  }

  static getConditionOperatorLabel(operator: ConditionOperator): string {
    const labels: Record<ConditionOperator, string> = {
      CONTAINS: 'contains',
      STARTS_WITH: 'starts with',
      ENDS_WITH: 'ends with',
      EQUALS: 'equals',
      NOT_CONTAINS: 'does not contain',
      GREATER_THAN: 'greater than',
      LESS_THAN: 'less than',
      BETWEEN: 'between',
      REGEX: 'matches pattern'
    };
    return labels[operator] || operator;
  }

  static formatAmount(amount: number, type: TransactionType): string {
    const formatted = Math.abs(amount).toLocaleString('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    });
    return type === 'CREDIT' ? `+${formatted}` : `-${formatted}`;
  }
}
