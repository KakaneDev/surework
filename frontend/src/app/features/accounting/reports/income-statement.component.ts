import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AccountingService, IncomeStatementReport } from '../../../core/services/accounting.service';
import { SpinnerComponent } from '@shared/ui';

@Component({
  selector: 'app-income-statement',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslateModule,
    SpinnerComponent,
    CurrencyPipe,
    DatePipe
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="sw-page-header">
        <div class="flex items-center gap-3">
          <a routerLink="/accounting/reports" class="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300">
            <span class="material-icons">arrow_back</span>
          </a>
          <div>
            <h1 class="sw-page-title">{{ 'accounting.reports.incomeStatement.title' | translate }}</h1>
            <p class="sw-page-description">{{ 'accounting.reports.incomeStatement.subtitle' | translate }}</p>
          </div>
        </div>
        <div class="flex gap-3">
          <button (click)="exportToPdf()" [disabled]="!report()" class="sw-btn sw-btn-outline sw-btn-md">
            <span class="material-icons text-lg">picture_as_pdf</span>
            {{ 'accounting.reports.incomeStatement.exportPdf' | translate }}
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
        <div class="flex flex-wrap items-end gap-4">
          <div>
            <label class="sw-label">{{ 'accounting.reports.incomeStatement.startDate' | translate }}</label>
            <input type="date" [(ngModel)]="startDate" class="sw-input">
          </div>
          <div>
            <label class="sw-label">{{ 'accounting.reports.incomeStatement.endDate' | translate }}</label>
            <input type="date" [(ngModel)]="endDate" class="sw-input">
          </div>
          <div class="flex gap-2">
            <button (click)="setThisMonth()" class="sw-btn sw-btn-outline sw-btn-sm">{{ 'accounting.reports.incomeStatement.thisMonth' | translate }}</button>
            <button (click)="setThisQuarter()" class="sw-btn sw-btn-outline sw-btn-sm">{{ 'accounting.reports.incomeStatement.thisQuarter' | translate }}</button>
            <button (click)="setThisYear()" class="sw-btn sw-btn-outline sw-btn-sm">{{ 'accounting.reports.incomeStatement.thisYear' | translate }}</button>
          </div>
          <button (click)="generateReport()" class="sw-btn sw-btn-primary sw-btn-md">
            <span class="material-icons text-lg">refresh</span>
            {{ 'accounting.reports.incomeStatement.generateReport' | translate }}
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center items-center py-24">
          <sw-spinner size="lg" />
        </div>
      } @else if (error()) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <span class="material-icons text-5xl text-error-500 mb-4">error</span>
          <p class="text-neutral-600 dark:text-neutral-400 mb-4">{{ error() }}</p>
          <button (click)="generateReport()" class="px-4 py-2 text-primary-500 hover:text-primary-600 font-medium">{{ 'common.retry' | translate }}</button>
        </div>
      } @else if (report()) {
        <!-- Report Header -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6 text-center">
          <h2 class="text-xl font-bold text-neutral-900 dark:text-white">{{ 'accounting.reports.incomeStatement.title' | translate }}</h2>
          <p class="text-neutral-600 dark:text-neutral-400">
            {{ 'accounting.reports.incomeStatement.periodLabel' | translate:{ startDate: (report()!.startDate | date:'longDate'), endDate: (report()!.endDate | date:'longDate') } }}
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Revenue -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
            <div class="p-4 border-b border-neutral-200 dark:border-dark-border border-l-4 border-l-green-500">
              <h3 class="font-semibold text-neutral-900 dark:text-white">{{ report()!.revenue.title }}</h3>
            </div>
            <div class="p-4">
              @if (report()!.revenue.accounts.length > 0) {
                @for (account of report()!.revenue.accounts; track account.accountId) {
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border last:border-0">
                    <span class="text-neutral-700 dark:text-neutral-300">{{ account.accountName }}</span>
                    <span class="font-mono text-neutral-800 dark:text-neutral-200">{{ account.balance | currency:'ZAR':'symbol':'1.2-2' }}</span>
                  </div>
                }
              } @else {
                <p class="text-neutral-500 dark:text-neutral-400 text-center py-4">{{ 'accounting.reports.incomeStatement.noRevenue' | translate }}</p>
              }
              <div class="flex justify-between py-3 mt-2 border-t-2 border-neutral-300 dark:border-neutral-600 font-semibold">
                <span class="text-neutral-800 dark:text-neutral-200">{{ 'accounting.reports.incomeStatement.totalRevenue' | translate }}</span>
                <span class="font-mono text-green-600 dark:text-green-400">{{ report()!.totalRevenue | currency:'ZAR':'symbol':'1.2-2' }}</span>
              </div>
            </div>
          </div>

          <!-- Expenses -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
            <div class="p-4 border-b border-neutral-200 dark:border-dark-border border-l-4 border-l-red-500">
              <h3 class="font-semibold text-neutral-900 dark:text-white">{{ report()!.expenses.title }}</h3>
            </div>
            <div class="p-4">
              @if (report()!.expenses.accounts.length > 0) {
                @for (account of report()!.expenses.accounts; track account.accountId) {
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border last:border-0">
                    <span class="text-neutral-700 dark:text-neutral-300">{{ account.accountName }}</span>
                    <span class="font-mono text-neutral-800 dark:text-neutral-200">{{ account.balance | currency:'ZAR':'symbol':'1.2-2' }}</span>
                  </div>
                }
              } @else {
                <p class="text-neutral-500 dark:text-neutral-400 text-center py-4">{{ 'accounting.reports.incomeStatement.noExpenses' | translate }}</p>
              }
              <div class="flex justify-between py-3 mt-2 border-t-2 border-neutral-300 dark:border-neutral-600 font-semibold">
                <span class="text-neutral-800 dark:text-neutral-200">{{ 'accounting.reports.incomeStatement.totalExpenses' | translate }}</span>
                <span class="font-mono text-red-600 dark:text-red-400">{{ report()!.totalExpenses | currency:'ZAR':'symbol':'1.2-2' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Net Income -->
        <div class="rounded-xl shadow-card border overflow-hidden"
             [class]="report()!.netIncome >= 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'">
          <div class="p-6">
            <div class="grid grid-cols-3 gap-4 text-center">
              <div>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.reports.incomeStatement.totalRevenue' | translate }}</p>
                <p class="text-xl font-bold text-green-600 dark:text-green-400">{{ report()!.totalRevenue | currency:'ZAR':'symbol':'1.2-2' }}</p>
              </div>
              <div class="flex items-center justify-center">
                <span class="text-3xl text-neutral-400">-</span>
              </div>
              <div>
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.reports.incomeStatement.totalExpenses' | translate }}</p>
                <p class="text-xl font-bold text-red-600 dark:text-red-400">{{ report()!.totalExpenses | currency:'ZAR':'symbol':'1.2-2' }}</p>
              </div>
            </div>
            <div class="mt-6 pt-4 border-t-2 text-center"
                 [class]="report()!.netIncome >= 0 ? 'border-green-300 dark:border-green-700' : 'border-red-300 dark:border-red-700'">
              <p class="text-lg font-medium mb-2"
                 [class]="report()!.netIncome >= 0 ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'">
                {{ report()!.netIncome >= 0 ? ('accounting.reports.incomeStatement.netProfit' | translate) : ('accounting.reports.incomeStatement.netLoss' | translate) }}
              </p>
              <p class="text-3xl font-bold"
                 [class]="report()!.netIncome >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'">
                {{ report()!.netIncome | currency:'ZAR':'symbol':'1.2-2' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border border-l-4 border-l-green-500 p-5">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.reports.incomeStatement.grossMargin' | translate }}</p>
            <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
              {{ getGrossMargin() | number:'1.1-1' }}%
            </p>
          </div>
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border border-l-4 border-l-amber-500 p-5">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.reports.incomeStatement.expenseRatio' | translate }}</p>
            <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
              {{ getExpenseRatio() | number:'1.1-1' }}%
            </p>
          </div>
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border border-l-4 p-5"
               [class.border-l-emerald-500]="report()!.netIncome >= 0"
               [class.border-l-red-500]="report()!.netIncome < 0">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.reports.incomeStatement.netProfitMargin' | translate }}</p>
            <p class="text-2xl font-bold"
               [class.text-emerald-600]="report()!.netIncome >= 0"
               [class.text-red-600]="report()!.netIncome < 0">
              {{ getNetProfitMargin() | number:'1.1-1' }}%
            </p>
          </div>
        </div>
      } @else {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">trending_up</span>
          <p class="text-neutral-500 dark:text-neutral-400">{{ 'accounting.reports.incomeStatement.selectDateRange' | translate }}</p>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IncomeStatementComponent implements OnInit {
  private readonly accountingService = inject(AccountingService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);

  report = signal<IncomeStatementReport | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  startDate = this.getFirstDayOfYear();
  endDate = this.getTodayDate();

  ngOnInit(): void {
    this.generateReport();
  }

  generateReport(): void {
    this.loading.set(true);
    this.error.set(null);

    this.accountingService.getIncomeStatement(this.startDate, this.endDate).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (report) => {
        this.report.set(report);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to generate income statement', err);
        const errorMsg = this.translate.instant('accounting.reports.incomeStatement.generateError');
        this.error.set(errorMsg);
        this.loading.set(false);
      }
    });
  }

  setThisMonth(): void {
    const now = new Date();
    this.startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    this.endDate = this.getTodayDate();
  }

  setThisQuarter(): void {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    this.startDate = new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
    this.endDate = this.getTodayDate();
  }

  setThisYear(): void {
    this.startDate = this.getFirstDayOfYear();
    this.endDate = this.getTodayDate();
  }

  getGrossMargin(): number {
    const report = this.report();
    if (!report || report.totalRevenue === 0) return 0;
    return ((report.totalRevenue - report.totalExpenses) / report.totalRevenue) * 100;
  }

  getExpenseRatio(): number {
    const report = this.report();
    if (!report || report.totalRevenue === 0) return 0;
    return (report.totalExpenses / report.totalRevenue) * 100;
  }

  getNetProfitMargin(): number {
    const report = this.report();
    if (!report || report.totalRevenue === 0) return 0;
    return (report.netIncome / report.totalRevenue) * 100;
  }

  exportToPdf(): void {
    alert('PDF export coming soon');
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getFirstDayOfYear(): string {
    const now = new Date();
    return new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
  }
}
