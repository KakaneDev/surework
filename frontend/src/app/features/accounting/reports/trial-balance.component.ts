import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  AccountingService,
  TrialBalanceReport,
  AccountType
} from '../../../core/services/accounting.service';
import { SpinnerComponent } from '@shared/ui';

@Component({
  selector: 'app-trial-balance',
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
            <h1 class="sw-page-title">{{ 'accounting.reports.trialBalance.title' | translate }}</h1>
            <p class="sw-page-description">{{ 'accounting.reports.trialBalance.description' | translate }}</p>
          </div>
        </div>
        <div class="flex gap-3">
          <button (click)="exportToPdf()" [disabled]="!report()" class="sw-btn sw-btn-outline sw-btn-md">
            <span class="material-icons text-lg">picture_as_pdf</span>
            {{ 'accounting.reports.trialBalance.exportPdf' | translate }}
          </button>
          <button (click)="exportToExcel()" [disabled]="!report()" class="sw-btn sw-btn-outline sw-btn-md">
            <span class="material-icons text-lg">table_chart</span>
            {{ 'accounting.reports.trialBalance.exportExcel' | translate }}
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
        <div class="flex flex-wrap items-end gap-4">
          <div>
            <label class="sw-label">{{ 'accounting.reports.trialBalance.asOfDate' | translate }}</label>
            <input type="date" [(ngModel)]="asOfDate" class="sw-input">
          </div>
          <button (click)="generateReport()" class="sw-btn sw-btn-primary sw-btn-md">
            <span class="material-icons text-lg">refresh</span>
            {{ 'accounting.reports.trialBalance.generateReport' | translate }}
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
          <h2 class="text-xl font-bold text-neutral-900 dark:text-white">{{ 'accounting.reports.trialBalance.title' | translate }}</h2>
          <p class="text-neutral-600 dark:text-neutral-400">{{ 'accounting.reports.trialBalance.asOf' | translate }} {{ report()!.asOfDate | date:'longDate' }}</p>
          @if (report()!.isBalanced) {
            <span class="inline-flex items-center gap-1 mt-2 text-green-600 dark:text-green-400">
              <span class="material-icons text-lg">check_circle</span>
              {{ 'accounting.reports.trialBalance.balanced' | translate }}
            </span>
          } @else {
            <span class="inline-flex items-center gap-1 mt-2 text-red-600 dark:text-red-400">
              <span class="material-icons text-lg">error</span>
              {{ 'accounting.reports.trialBalance.unbalanced' | translate }}
            </span>
          }
        </div>

        <!-- Report Table -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          <div class="overflow-x-auto">
            <table class="sw-table">
              <thead>
                <tr>
                  <th>{{ 'accounting.reports.trialBalance.accountCode' | translate }}</th>
                  <th>{{ 'accounting.reports.trialBalance.accountName' | translate }}</th>
                  <th>{{ 'accounting.reports.trialBalance.type' | translate }}</th>
                  <th class="text-right">{{ 'accounting.reports.trialBalance.debit' | translate }}</th>
                  <th class="text-right">{{ 'accounting.reports.trialBalance.credit' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                @for (type of accountTypes; track type) {
                  @if (getEntriesForType(type).length > 0) {
                    <tr class="bg-neutral-100 dark:bg-dark-elevated">
                      <td colspan="5" class="font-semibold text-neutral-700 dark:text-neutral-300">
                        <span class="flex items-center gap-2">
                          <span class="w-3 h-3 rounded-full" [style.background]="accountTypeColorMap[type].color"></span>
                          {{ accountTypeLabelMap[type] }}
                        </span>
                      </td>
                    </tr>
                    @for (entry of getEntriesForType(type); track entry.accountId) {
                      <tr>
                        <td class="font-mono text-sm text-neutral-500 dark:text-neutral-400">{{ entry.accountCode }}</td>
                        <td class="text-neutral-800 dark:text-neutral-200">{{ entry.accountName }}</td>
                        <td class="text-sm text-neutral-500 dark:text-neutral-400">{{ accountTypeLabelMap[entry.accountType] }}</td>
                        <td class="text-right font-mono">
                          @if (entry.debitBalance > 0) {
                            {{ entry.debitBalance | currency:'ZAR':'symbol':'1.2-2' }}
                          }
                        </td>
                        <td class="text-right font-mono">
                          @if (entry.creditBalance > 0) {
                            {{ entry.creditBalance | currency:'ZAR':'symbol':'1.2-2' }}
                          }
                        </td>
                      </tr>
                    }
                    <tr class="border-t border-neutral-300 dark:border-neutral-600">
                      <td colspan="3" class="text-right font-medium text-neutral-600 dark:text-neutral-400">
                        {{ accountTypeLabelMap[type] }} {{ 'accounting.reports.trialBalance.subtotal' | translate }}:
                      </td>
                      <td class="text-right font-mono font-medium">{{ getTypeDebitTotal(type) | currency:'ZAR':'symbol':'1.2-2' }}</td>
                      <td class="text-right font-mono font-medium">{{ getTypeCreditTotal(type) | currency:'ZAR':'symbol':'1.2-2' }}</td>
                    </tr>
                  }
                }
              </tbody>
              <tfoot>
                <tr class="bg-neutral-50 dark:bg-dark-elevated font-bold text-lg">
                  <td colspan="3" class="text-right">{{ 'accounting.reports.trialBalance.grandTotal' | translate }}:</td>
                  <td class="text-right font-mono">{{ report()!.totalDebits | currency:'ZAR':'symbol':'1.2-2' }}</td>
                  <td class="text-right font-mono">{{ report()!.totalCredits | currency:'ZAR':'symbol':'1.2-2' }}</td>
                </tr>
                <tr class="font-bold">
                  <td colspan="3" class="text-right">{{ 'accounting.reports.trialBalance.difference' | translate }}:</td>
                  <td colspan="2" class="text-center">
                    @if (report()!.isBalanced) {
                      <span class="text-green-600 dark:text-green-400">R0.00</span>
                    } @else {
                      <span class="text-red-600 dark:text-red-400">
                        {{ (report()!.totalDebits - report()!.totalCredits) | currency:'ZAR':'symbol':'1.2-2' }}
                      </span>
                    }
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      } @else {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">assessment</span>
          <p class="text-neutral-500 dark:text-neutral-400">{{ 'accounting.reports.trialBalance.emptyState' | translate }}</p>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrialBalanceComponent implements OnInit {
  private readonly accountingService = inject(AccountingService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);

  readonly accountTypes: AccountType[] = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

  readonly accountTypeLabelMap: Record<AccountType, string> = {
    ASSET: this.translate.instant('accounting.common.accountType.asset'),
    LIABILITY: this.translate.instant('accounting.common.accountType.liability'),
    EQUITY: this.translate.instant('accounting.common.accountType.equity'),
    REVENUE: this.translate.instant('accounting.common.accountType.revenue'),
    EXPENSE: this.translate.instant('accounting.common.accountType.expense')
  };

  readonly accountTypeColorMap: Record<AccountType, { background: string; color: string }> = {
    ASSET: { background: '#e3f2fd', color: '#1565c0' },
    LIABILITY: { background: '#ffebee', color: '#c62828' },
    EQUITY: { background: '#e8f5e9', color: '#2e7d32' },
    REVENUE: { background: '#fff3e0', color: '#ef6c00' },
    EXPENSE: { background: '#fce4ec', color: '#c2185b' }
  };

  report = signal<TrialBalanceReport | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  asOfDate = this.getTodayDate();

  ngOnInit(): void {
    this.generateReport();
  }

  generateReport(): void {
    this.loading.set(true);
    this.error.set(null);

    this.accountingService.getTrialBalance(this.asOfDate).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (report) => {
        this.report.set(report);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to generate trial balance', err);
        this.error.set(this.translate.instant('accounting.reports.trialBalance.errorGeneratingReport'));
        this.loading.set(false);
      }
    });
  }

  getEntriesForType(type: AccountType) {
    return this.report()?.entries.filter(e => e.accountType === type) || [];
  }

  getTypeDebitTotal(type: AccountType): number {
    return this.getEntriesForType(type).reduce((sum, e) => sum + e.debitBalance, 0);
  }

  getTypeCreditTotal(type: AccountType): number {
    return this.getEntriesForType(type).reduce((sum, e) => sum + e.creditBalance, 0);
  }

  exportToPdf(): void {
    // TODO: Implement PDF export
    alert(this.translate.instant('accounting.reports.trialBalance.pdfExportComingSoon'));
  }

  exportToExcel(): void {
    // TODO: Implement Excel export
    alert(this.translate.instant('accounting.reports.trialBalance.excelExportComingSoon'));
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
