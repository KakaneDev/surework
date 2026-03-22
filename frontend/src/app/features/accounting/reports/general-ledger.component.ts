import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AccountingService, Account, GeneralLedgerReport } from '../../../core/services/accounting.service';
import { SpinnerComponent } from '@shared/ui';

@Component({
  selector: 'app-general-ledger',
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
            <h1 class="sw-page-title">{{ 'accounting.reports.generalLedger.title' | translate }}</h1>
            <p class="sw-page-description">{{ 'accounting.reports.generalLedger.subtitle' | translate }}</p>
          </div>
        </div>
        <div class="flex gap-3">
          <button (click)="exportToPdf()" [disabled]="!report()" class="sw-btn sw-btn-outline sw-btn-md">
            <span class="material-icons text-lg">picture_as_pdf</span>
            {{ 'accounting.reports.generalLedger.exportPdf' | translate }}
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
        <div class="flex flex-wrap items-end gap-4">
          <div class="flex-1 min-w-[250px]">
            <label class="sw-label">{{ 'accounting.reports.generalLedger.filters.account' | translate }}</label>
            <select [(ngModel)]="selectedAccountId" class="sw-input w-full">
              <option [ngValue]="null">{{ 'accounting.reports.generalLedger.filters.selectAccount' | translate }}</option>
              @for (account of accounts(); track account.id) {
                <option [ngValue]="account.id">{{ account.accountCode }} - {{ account.accountName }}</option>
              }
            </select>
          </div>
          <div>
            <label class="sw-label">{{ 'accounting.reports.generalLedger.filters.startDate' | translate }}</label>
            <input type="date" [(ngModel)]="startDate" class="sw-input">
          </div>
          <div>
            <label class="sw-label">{{ 'accounting.reports.generalLedger.filters.endDate' | translate }}</label>
            <input type="date" [(ngModel)]="endDate" class="sw-input">
          </div>
          <button (click)="generateReport()" [disabled]="!selectedAccountId" class="sw-btn sw-btn-primary sw-btn-md">
            <span class="material-icons text-lg">refresh</span>
            {{ 'accounting.reports.generalLedger.generateReport' | translate }}
          </button>
        </div>
      </div>

      @if (loadingAccounts()) {
        <div class="flex justify-center items-center py-12">
          <sw-spinner size="md" />
          <span class="ml-2 text-neutral-500">{{ 'accounting.reports.generalLedger.loadingAccounts' | translate }}</span>
        </div>
      } @else if (loading()) {
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
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
          <div class="text-center mb-4">
            <h2 class="text-xl font-bold text-neutral-900 dark:text-white">{{ 'accounting.reports.generalLedger.title' | translate }}</h2>
            <p class="text-neutral-600 dark:text-neutral-400">
              {{ report()!.startDate | date:'longDate' }} {{ 'common.to' | translate }} {{ report()!.endDate | date:'longDate' }}
            </p>
          </div>
          <div class="flex items-center justify-center gap-4 p-4 bg-neutral-50 dark:bg-dark-elevated rounded-lg">
            <div class="text-center">
              <span class="font-mono text-sm text-neutral-500 dark:text-neutral-400">{{ report()!.accountCode }}</span>
              <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200">{{ report()!.accountName }}</h3>
            </div>
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border border-l-4 border-l-blue-500 p-4">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.reports.generalLedger.summaryCards.openingBalance' | translate }}</p>
            <p class="text-xl font-bold font-mono text-neutral-800 dark:text-neutral-200">{{ report()!.openingBalance | currency:'ZAR':'symbol':'1.2-2' }}</p>
          </div>
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border border-l-4 border-l-green-500 p-4">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.reports.generalLedger.summaryCards.totalDebits' | translate }}</p>
            <p class="text-xl font-bold font-mono text-green-600 dark:text-green-400">{{ report()!.totalDebits | currency:'ZAR':'symbol':'1.2-2' }}</p>
          </div>
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border border-l-4 border-l-red-500 p-4">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.reports.generalLedger.summaryCards.totalCredits' | translate }}</p>
            <p class="text-xl font-bold font-mono text-red-600 dark:text-red-400">{{ report()!.totalCredits | currency:'ZAR':'symbol':'1.2-2' }}</p>
          </div>
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border border-l-4 border-l-purple-500 p-4">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.reports.generalLedger.summaryCards.closingBalance' | translate }}</p>
            <p class="text-xl font-bold font-mono text-neutral-800 dark:text-neutral-200">{{ report()!.closingBalance | currency:'ZAR':'symbol':'1.2-2' }}</p>
          </div>
        </div>

        <!-- Transactions Table -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          <div class="p-4 border-b border-neutral-200 dark:border-dark-border">
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ 'accounting.reports.generalLedger.transactions' | translate }} ({{ report()!.entries.length }})</h3>
          </div>
          @if (report()!.entries.length > 0) {
            <div class="overflow-x-auto">
              <table class="sw-table">
                <thead>
                  <tr>
                    <th>{{ 'common.date' | translate }}</th>
                    <th>{{ 'accounting.reports.generalLedger.table.entryNumber' | translate }}</th>
                    <th>{{ 'common.description' | translate }}</th>
                    <th>{{ 'accounting.reports.generalLedger.table.reference' | translate }}</th>
                    <th class="text-right">{{ 'accounting.reports.generalLedger.table.debit' | translate }}</th>
                    <th class="text-right">{{ 'accounting.reports.generalLedger.table.credit' | translate }}</th>
                    <th class="text-right">{{ 'accounting.reports.generalLedger.table.balance' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Opening Balance Row -->
                  <tr class="bg-neutral-50 dark:bg-dark-elevated">
                    <td></td>
                    <td></td>
                    <td class="font-medium text-neutral-600 dark:text-neutral-400">{{ 'accounting.reports.generalLedger.table.openingBalance' | translate }}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td class="text-right font-mono font-medium">{{ report()!.openingBalance | currency:'ZAR':'symbol':'1.2-2' }}</td>
                  </tr>
                  @for (entry of report()!.entries; track entry.entryId) {
                    <tr class="hover:bg-neutral-50 dark:hover:bg-dark-elevated">
                      <td class="text-neutral-600 dark:text-neutral-400">{{ entry.transactionDate | date:'mediumDate' }}</td>
                      <td>
                        <a [routerLink]="['/accounting/journals', entry.entryId]" class="text-primary-500 hover:text-primary-600 font-medium">
                          {{ entry.entryNumber }}
                        </a>
                      </td>
                      <td class="max-w-[200px] truncate" [title]="entry.description">{{ entry.description }}</td>
                      <td class="text-sm text-neutral-500 dark:text-neutral-400">{{ entry.reference || '-' }}</td>
                      <td class="text-right font-mono">
                        @if (entry.debitAmount) {
                          <span class="text-green-600 dark:text-green-400">{{ entry.debitAmount | currency:'ZAR':'symbol':'1.2-2' }}</span>
                        }
                      </td>
                      <td class="text-right font-mono">
                        @if (entry.creditAmount) {
                          <span class="text-red-600 dark:text-red-400">{{ entry.creditAmount | currency:'ZAR':'symbol':'1.2-2' }}</span>
                        }
                      </td>
                      <td class="text-right font-mono font-medium">{{ entry.runningBalance | currency:'ZAR':'symbol':'1.2-2' }}</td>
                    </tr>
                  }
                </tbody>
                <tfoot>
                  <tr class="bg-neutral-100 dark:bg-dark-elevated font-bold">
                    <td colspan="4" class="text-right">{{ 'accounting.reports.generalLedger.table.periodTotals' | translate }}</td>
                    <td class="text-right font-mono text-green-600 dark:text-green-400">{{ report()!.totalDebits | currency:'ZAR':'symbol':'1.2-2' }}</td>
                    <td class="text-right font-mono text-red-600 dark:text-red-400">{{ report()!.totalCredits | currency:'ZAR':'symbol':'1.2-2' }}</td>
                    <td></td>
                  </tr>
                  <tr class="bg-neutral-50 dark:bg-dark-elevated font-bold">
                    <td colspan="6" class="text-right">{{ 'accounting.reports.generalLedger.table.closingBalance' | translate }}</td>
                    <td class="text-right font-mono">{{ report()!.closingBalance | currency:'ZAR':'symbol':'1.2-2' }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          } @else {
            <div class="p-12 text-center">
              <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">receipt_long</span>
              <p class="text-neutral-500 dark:text-neutral-400">{{ 'accounting.reports.generalLedger.noTransactions' | translate }}</p>
            </div>
          }
        </div>
      } @else {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">menu_book</span>
          <p class="text-neutral-500 dark:text-neutral-400">{{ 'accounting.reports.generalLedger.selectAccountPrompt' | translate }}</p>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneralLedgerComponent implements OnInit {
  private readonly accountingService = inject(AccountingService);
  private readonly translateService = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  accounts = signal<Account[]>([]);
  report = signal<GeneralLedgerReport | null>(null);
  loadingAccounts = signal(true);
  loading = signal(false);
  error = signal<string | null>(null);

  selectedAccountId: string | null = null;
  startDate = this.getFirstDayOfYear();
  endDate = this.getTodayDate();

  ngOnInit(): void {
    this.loadAccounts();
  }

  private loadAccounts(): void {
    this.accountingService.getPostableAccounts().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (accounts) => {
        accounts.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
        this.accounts.set(accounts);
        this.loadingAccounts.set(false);
      },
      error: (err) => {
        console.error('Failed to load accounts', err);
        this.loadingAccounts.set(false);
      }
    });
  }

  generateReport(): void {
    if (!this.selectedAccountId) return;

    this.loading.set(true);
    this.error.set(null);

    this.accountingService.getGeneralLedger(this.selectedAccountId, this.startDate, this.endDate).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (report) => {
        this.report.set(report);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to generate general ledger', err);
        this.error.set(this.translateService.instant('accounting.reports.generalLedger.generateError'));
        this.loading.set(false);
      }
    });
  }

  exportToPdf(): void {
    alert(this.translateService.instant('accounting.reports.generalLedger.pdfExportComingSoon'));
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getFirstDayOfYear(): string {
    const now = new Date();
    return new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
  }
}
