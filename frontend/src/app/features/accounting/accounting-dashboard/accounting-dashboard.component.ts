import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import {
  AccountingService,
  AccountingDashboard,
  JournalEntry,
  JournalEntryStatus,
  JournalEntryType,
  AccountType
} from '../../../core/services/accounting.service';
import {
  SpinnerComponent,
  BadgeComponent,
  JournalStatusBadgeComponent,
  PeriodStatusBadgeComponent,
  AccountTypeDotComponent,
  EmptyStateComponent
} from '@shared/ui';

@Component({
  selector: 'app-accounting-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    SpinnerComponent,
    BadgeComponent,
    JournalStatusBadgeComponent,
    PeriodStatusBadgeComponent,
    AccountTypeDotComponent,
    EmptyStateComponent,
    CurrencyPipe,
    DatePipe,
    DecimalPipe
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="sw-page-header">
        <div class="flex items-center gap-3">
          <span class="material-icons text-3xl text-primary-500">account_balance</span>
          <div>
            <h1 class="sw-page-title">{{ 'accounting.title' | translate }}</h1>
            <p class="sw-page-description">{{ 'accounting.subtitle' | translate }}</p>
          </div>
        </div>
        <div class="flex gap-3">
          <a routerLink="/accounting/reports" class="sw-btn sw-btn-outline sw-btn-md">
            <span class="material-icons text-lg">assessment</span>
            {{ 'accounting.quickActions.reports' | translate }}
          </a>
          <a routerLink="/accounting/journals/new" class="sw-btn sw-btn-primary sw-btn-md">
            <span class="material-icons text-lg">add</span>
            {{ 'accounting.newJournalEntry' | translate }}
          </a>
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center items-center py-24">
          <sw-spinner size="lg" />
        </div>
      } @else if (error()) {
        <div role="alert"
             aria-live="assertive"
             class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <span class="material-icons text-5xl text-error-500 mb-4" aria-hidden="true">error</span>
          <h3 class="text-lg font-semibold text-error-600 dark:text-error-400 mb-2">{{ 'accounting.errorLoading' | translate }}</h3>
          <p class="text-neutral-600 dark:text-neutral-400 mb-4">{{ error() }}</p>
          <button (click)="loadDashboard()" class="sw-btn sw-btn-primary sw-btn-md">
            <span class="material-icons text-lg" aria-hidden="true">refresh</span>
            {{ 'common.retry' | translate }}
          </button>
        </div>
      } @else {
        <!-- Financial Position Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Total Assets -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <span class="material-icons text-white text-2xl">trending_up</span>
              </div>
              <div>
                <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{{ formatCompact(dashboard()?.totalAssets || 0) }}</p>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.cards.totalAssets' | translate }}</p>
              </div>
            </div>
          </div>

          <!-- Total Liabilities -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                <span class="material-icons text-white text-2xl">trending_down</span>
              </div>
              <div>
                <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{{ formatCompact(dashboard()?.totalLiabilities || 0) }}</p>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.cards.totalLiabilities' | translate }}</p>
              </div>
            </div>
          </div>

          <!-- Total Equity -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <span class="material-icons text-white text-2xl">account_balance_wallet</span>
              </div>
              <div>
                <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{{ formatCompact(dashboard()?.totalEquity || 0) }}</p>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.cards.totalEquity' | translate }}</p>
              </div>
            </div>
          </div>

          <!-- Net Income -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-xl flex items-center justify-center"
                   [class]="(dashboard()?.netIncome || 0) >= 0 ? 'bg-gradient-to-br from-teal-500 to-cyan-600' : 'bg-gradient-to-br from-orange-500 to-amber-600'">
                <span class="material-icons text-white text-2xl">{{ (dashboard()?.netIncome || 0) >= 0 ? 'savings' : 'warning' }}</span>
              </div>
              <div>
                <p class="text-2xl font-bold" [class]="(dashboard()?.netIncome || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">
                  {{ formatCompact(dashboard()?.netIncome || 0) }}
                </p>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.cards.netIncomeYtd' | translate }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Financial Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border border-l-4 border-l-blue-500 p-5">
            <div class="flex items-center justify-between mb-2">
              <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.summary.assets' | translate }}</p>
              <span class="material-icons text-blue-500">inventory_2</span>
            </div>
            <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{{ dashboard()?.totalAssets || 0 | currency:'ZAR':'symbol':'1.0-0' }}</p>
            <p class="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{{ 'accounting.summary.assetsDescription' | translate }}</p>
          </div>

          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border border-l-4 border-l-red-500 p-5">
            <div class="flex items-center justify-between mb-2">
              <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.summary.liabilities' | translate }}</p>
              <span class="material-icons text-red-500">receipt_long</span>
            </div>
            <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{{ dashboard()?.totalLiabilities || 0 | currency:'ZAR':'symbol':'1.0-0' }}</p>
            <p class="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{{ 'accounting.summary.liabilitiesDescription' | translate }}</p>
          </div>

          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border border-l-4 border-l-green-500 p-5">
            <div class="flex items-center justify-between mb-2">
              <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.summary.equity' | translate }}</p>
              <span class="material-icons text-green-500">account_balance</span>
            </div>
            <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{{ dashboard()?.totalEquity || 0 | currency:'ZAR':'symbol':'1.0-0' }}</p>
            <p class="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{{ 'accounting.summary.equityDescription' | translate }}</p>
          </div>
        </div>

        <!-- Quick Actions & Current Period -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- Quick Actions -->
          <div class="lg:col-span-2 bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-5">
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-white mb-4">{{ 'accounting.quickActionsTitle' | translate }}</h3>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <a routerLink="/accounting/invoicing" class="flex flex-col items-center gap-2 p-4 rounded-lg bg-neutral-50 dark:bg-dark-elevated hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group">
                <span class="material-icons text-2xl text-neutral-400 group-hover:text-primary-500">receipt_long</span>
                <span class="text-sm text-neutral-600 dark:text-neutral-400 group-hover:text-primary-600 dark:group-hover:text-primary-400">{{ 'accounting.quickActions.invoicing' | translate }}</span>
              </a>
              <a routerLink="/accounting/banking" class="flex flex-col items-center gap-2 p-4 rounded-lg bg-neutral-50 dark:bg-dark-elevated hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group">
                <span class="material-icons text-2xl text-neutral-400 group-hover:text-primary-500">account_balance</span>
                <span class="text-sm text-neutral-600 dark:text-neutral-400 group-hover:text-primary-600 dark:group-hover:text-primary-400">{{ 'accounting.quickActions.banking' | translate }}</span>
              </a>
              <a routerLink="/accounting/vat" class="flex flex-col items-center gap-2 p-4 rounded-lg bg-neutral-50 dark:bg-dark-elevated hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group">
                <span class="material-icons text-2xl text-neutral-400 group-hover:text-primary-500">request_quote</span>
                <span class="text-sm text-neutral-600 dark:text-neutral-400 group-hover:text-primary-600 dark:group-hover:text-primary-400">{{ 'accounting.quickActions.vat201' | translate }}</span>
              </a>
              <a routerLink="/accounting/journals/new" class="flex flex-col items-center gap-2 p-4 rounded-lg bg-neutral-50 dark:bg-dark-elevated hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group">
                <span class="material-icons text-2xl text-neutral-400 group-hover:text-primary-500">edit_note</span>
                <span class="text-sm text-neutral-600 dark:text-neutral-400 group-hover:text-primary-600 dark:group-hover:text-primary-400">{{ 'accounting.quickActions.journalEntry' | translate }}</span>
              </a>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              <a routerLink="/accounting/accounts" class="flex flex-col items-center gap-2 p-4 rounded-lg bg-neutral-50 dark:bg-dark-elevated hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group">
                <span class="material-icons text-2xl text-neutral-400 group-hover:text-primary-500">account_tree</span>
                <span class="text-sm text-neutral-600 dark:text-neutral-400 group-hover:text-primary-600 dark:group-hover:text-primary-400">{{ 'accounting.quickActions.chartOfAccounts' | translate }}</span>
              </a>
              <a routerLink="/accounting/payroll-integration" class="flex flex-col items-center gap-2 p-4 rounded-lg bg-neutral-50 dark:bg-dark-elevated hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group">
                <span class="material-icons text-2xl text-neutral-400 group-hover:text-primary-500">payments</span>
                <span class="text-sm text-neutral-600 dark:text-neutral-400 group-hover:text-primary-600 dark:group-hover:text-primary-400">{{ 'accounting.quickActions.payrollIntegration' | translate }}</span>
              </a>
              <a routerLink="/accounting/reports" class="flex flex-col items-center gap-2 p-4 rounded-lg bg-neutral-50 dark:bg-dark-elevated hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group">
                <span class="material-icons text-2xl text-neutral-400 group-hover:text-primary-500">summarize</span>
                <span class="text-sm text-neutral-600 dark:text-neutral-400 group-hover:text-primary-600 dark:group-hover:text-primary-400">{{ 'accounting.quickActions.reports' | translate }}</span>
              </a>
              <a routerLink="/accounting/periods" class="flex flex-col items-center gap-2 p-4 rounded-lg bg-neutral-50 dark:bg-dark-elevated hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group">
                <span class="material-icons text-2xl text-neutral-400 group-hover:text-primary-500">calendar_month</span>
                <span class="text-sm text-neutral-600 dark:text-neutral-400 group-hover:text-primary-600 dark:group-hover:text-primary-400">{{ 'accounting.quickActions.fiscalPeriods' | translate }}</span>
              </a>
            </div>
          </div>

          <!-- Current Period -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-5">
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-white mb-4">{{ 'accounting.currentPeriod.title' | translate }}</h3>
            @if (dashboard()?.currentPeriod) {
              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.currentPeriod.period' | translate }}</span>
                  <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ dashboard()!.currentPeriod!.periodName }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'common.status' | translate }}</span>
                  <sw-period-status-badge [status]="dashboard()!.currentPeriod!.status" />
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.currentPeriod.startDate' | translate }}</span>
                  <span class="text-neutral-600 dark:text-neutral-400">{{ dashboard()!.currentPeriod!.startDate | date:'mediumDate' }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.currentPeriod.endDate' | translate }}</span>
                  <span class="text-neutral-600 dark:text-neutral-400">{{ dashboard()!.currentPeriod!.endDate | date:'mediumDate' }}</span>
                </div>
              </div>
            } @else {
              <div class="text-center py-4">
                <span class="material-icons text-3xl text-neutral-300 dark:text-neutral-600 mb-2">event_busy</span>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.currentPeriod.noOpenPeriod' | translate }}</p>
                <a routerLink="/accounting/periods" class="text-primary-500 hover:text-primary-600 text-sm font-medium mt-2 inline-block">{{ 'accounting.currentPeriod.managePeriods' | translate }}</a>
              </div>
            }
          </div>
        </div>

        <!-- Account Breakdown by Type -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          <div class="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-dark-border">
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ 'accounting.accountBreakdown.title' | translate }}</h3>
            <a routerLink="/accounting/accounts" class="text-primary-500 hover:text-primary-600 text-sm font-medium">{{ 'common.viewAll' | translate }}</a>
          </div>
          @if (dashboard()?.accountsByType?.length) {
            <div class="p-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                @for (item of dashboard()!.accountsByType; track item.type) {
                  <div class="p-4 rounded-lg border border-neutral-200 dark:border-dark-border">
                    <div class="flex items-center gap-2 mb-2">
                      <sw-account-type-dot [type]="item.type" [showLabel]="true" />
                    </div>
                    <p class="text-lg font-bold text-neutral-800 dark:text-neutral-200">{{ item.balance | currency:'ZAR':'symbol':'1.0-0' }}</p>
                    <p class="text-xs text-neutral-400 dark:text-neutral-500">{{ item.count }} {{ item.count !== 1 ? ('accounting.accountBreakdown.accounts' | translate) : ('accounting.accountBreakdown.account' | translate) }}</p>
                  </div>
                }
              </div>
            </div>
          } @else {
            <div class="p-12 text-center">
              <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">account_tree</span>
              <p class="text-neutral-500 dark:text-neutral-400">{{ 'accounting.accountBreakdown.noData' | translate }}</p>
            </div>
          }
        </div>

        <!-- Recent Transactions -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          <div class="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-dark-border">
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ 'accounting.recentTransactions.title' | translate }}</h3>
            <a routerLink="/accounting/journals" class="text-primary-500 hover:text-primary-600 text-sm font-medium">{{ 'common.viewAll' | translate }}</a>
          </div>
          @if (dashboard()?.recentTransactions?.length) {
            <div class="overflow-x-auto">
              <table class="sw-table">
                <thead>
                  <tr>
                    <th>{{ 'accounting.recentTransactions.entryNumber' | translate }}</th>
                    <th>{{ 'common.date' | translate }}</th>
                    <th>{{ 'common.description' | translate }}</th>
                    <th>{{ 'common.type' | translate }}</th>
                    <th class="text-right">{{ 'accounting.recentTransactions.debit' | translate }}</th>
                    <th class="text-right">{{ 'accounting.recentTransactions.credit' | translate }}</th>
                    <th>{{ 'common.status' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (entry of dashboard()!.recentTransactions; track entry.id) {
                    <tr class="cursor-pointer hover:bg-neutral-50 dark:hover:bg-dark-elevated" [routerLink]="['/accounting/journals', entry.id]">
                      <td>
                        <a [routerLink]="['/accounting/journals', entry.id]" class="text-primary-500 hover:text-primary-600 font-medium">
                          {{ entry.entryNumber }}
                        </a>
                      </td>
                      <td class="text-neutral-600 dark:text-neutral-400">{{ entry.transactionDate | date:'mediumDate' }}</td>
                      <td class="max-w-[200px] truncate" [title]="entry.description">{{ entry.description }}</td>
                      <td>
                        <span class="text-xs text-neutral-500 dark:text-neutral-400">{{ (journalTypeLabelKeyMap[entry.entryType] || entry.entryType) | translate }}</span>
                      </td>
                      <td class="text-right font-mono">{{ entry.totalDebit | currency:'ZAR':'symbol':'1.2-2' }}</td>
                      <td class="text-right font-mono">{{ entry.totalCredit | currency:'ZAR':'symbol':'1.2-2' }}</td>
                      <td>
                        <sw-journal-status-badge [status]="entry.status" />
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <sw-empty-state
              icon="receipt_long"
              [title]="'accounting.recentTransactions.emptyTitle' | translate"
              [description]="'accounting.recentTransactions.emptyDescription' | translate"
              [actionLabel]="'accounting.recentTransactions.createFirst' | translate"
              actionIcon="add"
              [actionRoute]="['/accounting/journals/new']" />
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountingDashboardComponent implements OnInit {
  private readonly accountingService = inject(AccountingService);
  private readonly destroyRef = inject(DestroyRef);

  // Lookup maps for template - using translation keys instead of hardcoded English
  readonly statusLabelKeyMap: Record<JournalEntryStatus, string> = {
    DRAFT: 'accounting.status.draft',
    POSTED: 'accounting.status.posted',
    REVERSED: 'accounting.status.reversed',
    VOID: 'accounting.status.void'
  };

  readonly journalTypeLabelKeyMap: Record<JournalEntryType, string> = {
    MANUAL: 'accounting.journalType.manual',
    SYSTEM: 'accounting.journalType.system',
    PAYROLL: 'accounting.journalType.payroll',
    INVOICE: 'accounting.journalType.invoice',
    BILL: 'accounting.journalType.bill',
    PAYMENT: 'accounting.journalType.payment',
    RECEIPT: 'accounting.journalType.receipt',
    TRANSFER: 'accounting.journalType.transfer',
    ADJUSTMENT: 'accounting.journalType.adjustment',
    CLOSING: 'accounting.journalType.closing',
    OPENING: 'accounting.journalType.opening',
    REVERSAL: 'accounting.journalType.reversal'
  };

  readonly periodStatusLabelKeyMap: Record<string, string> = {
    FUTURE: 'accounting.periodStatus.future',
    OPEN: 'accounting.periodStatus.open',
    CLOSED: 'accounting.periodStatus.closed',
    LOCKED: 'accounting.periodStatus.locked'
  };

  readonly accountTypeLabelKeyMap: Record<AccountType, string> = {
    ASSET: 'accounting.accountType.assets',
    LIABILITY: 'accounting.accountType.liabilities',
    EQUITY: 'accounting.accountType.equity',
    REVENUE: 'accounting.accountType.revenue',
    EXPENSE: 'accounting.accountType.expenses'
  };

  dashboard = signal<AccountingDashboard | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    this.accountingService.getDashboard().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load accounting dashboard', err);
        this.error.set('Failed to load accounting dashboard. Please try again.');
        this.loading.set(false);
      }
    });
  }

  formatCompact(amount: number): string {
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    if (absAmount >= 1000000) {
      return `${sign}R${(absAmount / 1000000).toFixed(1)}M`;
    } else if (absAmount >= 1000) {
      return `${sign}R${(absAmount / 1000).toFixed(0)}K`;
    }
    return `${sign}R${absAmount.toFixed(0)}`;
  }
}
