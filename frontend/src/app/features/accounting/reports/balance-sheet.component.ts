import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AccountingService, BalanceSheetReport } from '../../../core/services/accounting.service';
import { SpinnerComponent } from '@shared/ui';

@Component({
  selector: 'app-balance-sheet',
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
            <h1 class="sw-page-title">{{ 'accounting.reports.balanceSheet.title' | translate }}</h1>
            <p class="sw-page-description">{{ 'accounting.reports.balanceSheet.description' | translate }}</p>
          </div>
        </div>
        <div class="flex gap-3">
          <button (click)="exportToPdf()" [disabled]="!report()" class="sw-btn sw-btn-outline sw-btn-md">
            <span class="material-icons text-lg">picture_as_pdf</span>
            {{ 'accounting.reports.balanceSheet.exportPdf' | translate }}
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
        <div class="flex flex-wrap items-end gap-4">
          <div>
            <label class="sw-label">{{ 'accounting.reports.balanceSheet.asOfDate' | translate }}</label>
            <input type="date" [(ngModel)]="asOfDate" class="sw-input">
          </div>
          <button (click)="generateReport()" class="sw-btn sw-btn-primary sw-btn-md">
            <span class="material-icons text-lg">refresh</span>
            {{ 'accounting.reports.balanceSheet.generateReport' | translate }}
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
          <button (click)="generateReport()" class="px-4 py-2 text-primary-500 hover:text-primary-600 font-medium">{{ 'accounting.reports.balanceSheet.retry' | translate }}</button>
        </div>
      } @else if (report()) {
        <!-- Report Header -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6 text-center">
          <h2 class="text-xl font-bold text-neutral-900 dark:text-white">{{ 'accounting.reports.balanceSheet.reportTitle' | translate }}</h2>
          <p class="text-neutral-600 dark:text-neutral-400">{{ 'accounting.reports.balanceSheet.asOfLabel' | translate }} {{ report()!.asOfDate | date:'longDate' }}</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Assets Side -->
          <div class="space-y-4">
            <!-- Current Assets -->
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
              <div class="p-4 border-b border-neutral-200 dark:border-dark-border border-l-4 border-l-blue-500">
                <h3 class="font-semibold text-neutral-900 dark:text-white">{{ report()!.currentAssets.title }}</h3>
              </div>
              <div class="p-4">
                @for (account of report()!.currentAssets.accounts; track account.accountId) {
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border last:border-0">
                    <span class="text-neutral-700 dark:text-neutral-300">{{ account.accountName }}</span>
                    <span class="font-mono text-neutral-800 dark:text-neutral-200">{{ account.balance | currency:'ZAR':'symbol':'1.2-2' }}</span>
                  </div>
                }
                <div class="flex justify-between py-3 mt-2 border-t-2 border-neutral-300 dark:border-neutral-600 font-semibold">
                  <span class="text-neutral-800 dark:text-neutral-200">{{ 'accounting.reports.balanceSheet.totalCurrentAssets' | translate }}</span>
                  <span class="font-mono text-blue-600 dark:text-blue-400">{{ report()!.currentAssets.total | currency:'ZAR':'symbol':'1.2-2' }}</span>
                </div>
              </div>
            </div>

            <!-- Non-Current Assets -->
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
              <div class="p-4 border-b border-neutral-200 dark:border-dark-border border-l-4 border-l-blue-700">
                <h3 class="font-semibold text-neutral-900 dark:text-white">{{ report()!.nonCurrentAssets.title }}</h3>
              </div>
              <div class="p-4">
                @for (account of report()!.nonCurrentAssets.accounts; track account.accountId) {
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border last:border-0">
                    <span class="text-neutral-700 dark:text-neutral-300">{{ account.accountName }}</span>
                    <span class="font-mono text-neutral-800 dark:text-neutral-200">{{ account.balance | currency:'ZAR':'symbol':'1.2-2' }}</span>
                  </div>
                }
                <div class="flex justify-between py-3 mt-2 border-t-2 border-neutral-300 dark:border-neutral-600 font-semibold">
                  <span class="text-neutral-800 dark:text-neutral-200">{{ 'accounting.reports.balanceSheet.totalNonCurrentAssets' | translate }}</span>
                  <span class="font-mono text-blue-700 dark:text-blue-300">{{ report()!.nonCurrentAssets.total | currency:'ZAR':'symbol':'1.2-2' }}</span>
                </div>
              </div>
            </div>

            <!-- Total Assets -->
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl shadow-card border border-blue-200 dark:border-blue-800 p-4">
              <div class="flex justify-between font-bold text-lg">
                <span class="text-blue-800 dark:text-blue-200">{{ 'accounting.reports.balanceSheet.totalAssets' | translate }}</span>
                <span class="font-mono text-blue-700 dark:text-blue-300">{{ report()!.totalAssets | currency:'ZAR':'symbol':'1.2-2' }}</span>
              </div>
            </div>
          </div>

          <!-- Liabilities & Equity Side -->
          <div class="space-y-4">
            <!-- Current Liabilities -->
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
              <div class="p-4 border-b border-neutral-200 dark:border-dark-border border-l-4 border-l-red-500">
                <h3 class="font-semibold text-neutral-900 dark:text-white">{{ report()!.currentLiabilities.title }}</h3>
              </div>
              <div class="p-4">
                @for (account of report()!.currentLiabilities.accounts; track account.accountId) {
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border last:border-0">
                    <span class="text-neutral-700 dark:text-neutral-300">{{ account.accountName }}</span>
                    <span class="font-mono text-neutral-800 dark:text-neutral-200">{{ account.balance | currency:'ZAR':'symbol':'1.2-2' }}</span>
                  </div>
                }
                <div class="flex justify-between py-3 mt-2 border-t-2 border-neutral-300 dark:border-neutral-600 font-semibold">
                  <span class="text-neutral-800 dark:text-neutral-200">{{ 'accounting.reports.balanceSheet.totalCurrentLiabilities' | translate }}</span>
                  <span class="font-mono text-red-600 dark:text-red-400">{{ report()!.currentLiabilities.total | currency:'ZAR':'symbol':'1.2-2' }}</span>
                </div>
              </div>
            </div>

            <!-- Non-Current Liabilities -->
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
              <div class="p-4 border-b border-neutral-200 dark:border-dark-border border-l-4 border-l-red-700">
                <h3 class="font-semibold text-neutral-900 dark:text-white">{{ report()!.nonCurrentLiabilities.title }}</h3>
              </div>
              <div class="p-4">
                @for (account of report()!.nonCurrentLiabilities.accounts; track account.accountId) {
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border last:border-0">
                    <span class="text-neutral-700 dark:text-neutral-300">{{ account.accountName }}</span>
                    <span class="font-mono text-neutral-800 dark:text-neutral-200">{{ account.balance | currency:'ZAR':'symbol':'1.2-2' }}</span>
                  </div>
                }
                <div class="flex justify-between py-3 mt-2 border-t-2 border-neutral-300 dark:border-neutral-600 font-semibold">
                  <span class="text-neutral-800 dark:text-neutral-200">{{ 'accounting.reports.balanceSheet.totalNonCurrentLiabilities' | translate }}</span>
                  <span class="font-mono text-red-700 dark:text-red-300">{{ report()!.nonCurrentLiabilities.total | currency:'ZAR':'symbol':'1.2-2' }}</span>
                </div>
              </div>
            </div>

            <!-- Total Liabilities -->
            <div class="bg-red-50 dark:bg-red-900/20 rounded-xl shadow-card border border-red-200 dark:border-red-800 p-4">
              <div class="flex justify-between font-bold text-lg">
                <span class="text-red-800 dark:text-red-200">{{ 'accounting.reports.balanceSheet.totalLiabilities' | translate }}</span>
                <span class="font-mono text-red-700 dark:text-red-300">{{ report()!.totalLiabilities | currency:'ZAR':'symbol':'1.2-2' }}</span>
              </div>
            </div>

            <!-- Equity -->
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
              <div class="p-4 border-b border-neutral-200 dark:border-dark-border border-l-4 border-l-green-500">
                <h3 class="font-semibold text-neutral-900 dark:text-white">{{ report()!.equity.title }}</h3>
              </div>
              <div class="p-4">
                @for (account of report()!.equity.accounts; track account.accountId) {
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border last:border-0">
                    <span class="text-neutral-700 dark:text-neutral-300">{{ account.accountName }}</span>
                    <span class="font-mono text-neutral-800 dark:text-neutral-200">{{ account.balance | currency:'ZAR':'symbol':'1.2-2' }}</span>
                  </div>
                }
                <div class="flex justify-between py-3 mt-2 border-t-2 border-neutral-300 dark:border-neutral-600 font-semibold">
                  <span class="text-neutral-800 dark:text-neutral-200">{{ 'accounting.reports.balanceSheet.totalEquity' | translate }}</span>
                  <span class="font-mono text-green-600 dark:text-green-400">{{ report()!.totalEquity | currency:'ZAR':'symbol':'1.2-2' }}</span>
                </div>
              </div>
            </div>

            <!-- Total Liabilities & Equity -->
            <div class="bg-green-50 dark:bg-green-900/20 rounded-xl shadow-card border border-green-200 dark:border-green-800 p-4">
              <div class="flex justify-between font-bold text-lg">
                <span class="text-green-800 dark:text-green-200">{{ 'accounting.reports.balanceSheet.totalLiabilitiesAndEquity' | translate }}</span>
                <span class="font-mono text-green-700 dark:text-green-300">{{ report()!.totalLiabilitiesAndEquity | currency:'ZAR':'symbol':'1.2-2' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Balance Check -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
          <div class="flex items-center justify-center gap-4">
            @if (isBalanced()) {
              <span class="material-icons text-3xl text-green-500">check_circle</span>
              <span class="text-lg font-semibold text-green-600 dark:text-green-400">{{ 'accounting.reports.balanceSheet.isBalanced' | translate }}</span>
            } @else {
              <span class="material-icons text-3xl text-red-500">error</span>
              <span class="text-lg font-semibold text-red-600 dark:text-red-400">
                {{ 'accounting.reports.balanceSheet.outOfBalance' | translate: {amount: (report()!.totalAssets - report()!.totalLiabilitiesAndEquity) | currency:'ZAR':'symbol':'1.2-2'} }}
              </span>
            }
          </div>
        </div>
      } @else {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">account_balance</span>
          <p class="text-neutral-500 dark:text-neutral-400">{{ 'accounting.reports.balanceSheet.noReport' | translate }}</p>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BalanceSheetComponent implements OnInit {
  private readonly accountingService = inject(AccountingService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);

  report = signal<BalanceSheetReport | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  asOfDate = this.getTodayDate();

  ngOnInit(): void {
    this.generateReport();
  }

  generateReport(): void {
    this.loading.set(true);
    this.error.set(null);

    this.accountingService.getBalanceSheet(this.asOfDate).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (report) => {
        this.report.set(report);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to generate balance sheet', err);
        this.error.set(this.translate.instant('accounting.reports.balanceSheet.error'));
        this.loading.set(false);
      }
    });
  }

  isBalanced(): boolean {
    const report = this.report();
    if (!report) return false;
    return Math.abs(report.totalAssets - report.totalLiabilitiesAndEquity) < 0.01;
  }

  exportToPdf(): void {
    alert(this.translate.instant('accounting.reports.balanceSheet.pdfComingSoon'));
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
