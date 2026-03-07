import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BankingService, BankingDashboard, BankAccountSummary, BankTransaction, ConnectionStatus } from '../../../core/services/banking.service';
import { SpinnerComponent, EmptyStateComponent, ToastService } from '@shared/ui';

@Component({
  selector: 'app-banking-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    SpinnerComponent,
    EmptyStateComponent,
    CurrencyPipe,
    DatePipe
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="sw-page-header">
        <div class="flex items-center gap-3">
          <a routerLink="/accounting" class="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300">
            <span class="material-icons">arrow_back</span>
          </a>
          <div>
            <h1 class="sw-page-title">{{ 'accounting.banking.dashboard.title' | translate }}</h1>
            <p class="sw-page-description">{{ 'accounting.banking.dashboard.subtitle' | translate }}</p>
          </div>
        </div>
        <div class="flex gap-3">
          <a routerLink="rules" class="sw-btn sw-btn-outline sw-btn-md">
            <span class="material-icons text-lg">rule</span>
            {{ 'accounting.banking.dashboard.bankRulesBtn' | translate }}
          </a>
          <button (click)="connectNewBank()" class="sw-btn sw-btn-primary sw-btn-md">
            <span class="material-icons text-lg">add_link</span>
            {{ 'accounting.banking.dashboard.connectBankBtn' | translate }}
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center items-center py-24">
          <sw-spinner size="lg" />
        </div>
      } @else if (dashboard()) {
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border border-l-4 border-l-blue-500 p-5">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.banking.dashboard.connectedAccounts' | translate }}</p>
            <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{{ dashboard()!.connectedAccounts }}</p>
          </div>
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border border-l-4 border-l-amber-500 p-5">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.banking.dashboard.needsAttention' | translate }}</p>
            <p class="text-2xl font-bold" [class]="dashboard()!.accountsNeedingReauth > 0 ? 'text-amber-600' : 'text-neutral-800 dark:text-neutral-200'">
              {{ dashboard()!.accountsNeedingReauth }}
            </p>
          </div>
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border border-l-4 border-l-purple-500 p-5">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.banking.dashboard.unreconciled' | translate }}</p>
            <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{{ dashboard()!.totalUnreconciled }}</p>
          </div>
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border border-l-4 border-l-green-500 p-5">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.banking.dashboard.netUnreconciled' | translate }}</p>
            <p class="text-2xl font-bold font-mono" [class]="dashboard()!.unreconciledInflow - dashboard()!.unreconciledOutflow >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ dashboard()!.unreconciledInflow - dashboard()!.unreconciledOutflow | currency:'ZAR':'symbol':'1.2-2' }}
            </p>
          </div>
        </div>

        <!-- Bank Accounts -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border">
          <div class="p-4 border-b border-neutral-200 dark:border-dark-border flex items-center justify-between">
            <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ 'accounting.banking.dashboard.connectedBankAccounts' | translate }}</h2>
            <button (click)="syncAllAccounts()" [disabled]="syncing()" class="sw-btn sw-btn-outline sw-btn-sm">
              @if (syncing()) {
                <sw-spinner size="sm" />
              } @else {
                <span class="material-icons text-lg">sync</span>
              }
              {{ 'accounting.banking.dashboard.syncAllBtn' | translate }}
            </button>
          </div>

          @if (dashboard()!.accountSummaries.length > 0) {
            <div class="divide-y divide-neutral-200 dark:divide-dark-border">
              @for (account of dashboard()!.accountSummaries; track account.id) {
                <a [routerLink]="['accounts', account.id]" class="flex items-center p-4 hover:bg-neutral-50 dark:hover:bg-dark-elevated transition-colors">
                  <div class="flex-shrink-0 w-12 h-12 rounded-lg bg-neutral-100 dark:bg-dark-elevated flex items-center justify-center mr-4">
                    @if (account.institutionLogo) {
                      <img [src]="account.institutionLogo" [alt]="account.institutionName" class="w-8 h-8 object-contain">
                    } @else {
                      <span class="material-icons text-neutral-400">account_balance</span>
                    }
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <h3 class="font-medium text-neutral-900 dark:text-white truncate">{{ account.accountName }}</h3>
                      <span class="px-2 py-0.5 text-xs font-medium rounded-full" [class]="getStatusColor(account.status)">
                        {{ getStatusLabel(account.status) }}
                      </span>
                    </div>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ account.institutionName }}</p>
                  </div>
                  <div class="text-right mr-4">
                    <p class="font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                      {{ account.currentBalance != null ? (account.currentBalance | currency:'ZAR':'symbol':'1.2-2') : '-' }}
                    </p>
                    @if (account.unreconciledCount > 0) {
                      <p class="text-sm text-amber-600 dark:text-amber-400">{{ account.unreconciledCount }} {{ 'accounting.banking.dashboard.unreconciled' | translate }}</p>
                    } @else {
                      <p class="text-sm text-green-600 dark:text-green-400">{{ 'accounting.banking.dashboard.allReconciled' | translate }}</p>
                    }
                  </div>
                  <span class="material-icons text-neutral-400">chevron_right</span>
                </a>
              }
            </div>
          } @else {
            <sw-empty-state
              icon="account_balance_wallet"
              [title]="'accounting.banking.dashboard.noAccountsTitle' | translate"
              [description]="'accounting.banking.dashboard.noAccountsDesc' | translate"
              [actionLabel]="'accounting.banking.dashboard.connectFirstBankBtn' | translate"
              actionIcon="add_link"
              (actionClick)="connectNewBank()" />
          }
        </div>

        <!-- Recent Unreconciled Transactions -->
        @if (dashboard()!.recentTransactions.length > 0) {
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border">
            <div class="p-4 border-b border-neutral-200 dark:border-dark-border flex items-center justify-between">
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ 'accounting.banking.dashboard.recentTransactions' | translate }}</h2>
              <a routerLink="reconciliation" class="text-primary-500 hover:text-primary-600 text-sm font-medium">
                {{ 'accounting.banking.dashboard.viewAll' | translate }}
              </a>
            </div>
            <div class="overflow-x-auto">
              <table class="sw-table">
                <thead>
                  <tr>
                    <th>{{ 'accounting.banking.dashboard.dateHeader' | translate }}</th>
                    <th>{{ 'accounting.banking.dashboard.accountHeader' | translate }}</th>
                    <th>{{ 'accounting.banking.dashboard.descriptionHeader' | translate }}</th>
                    <th>{{ 'accounting.banking.dashboard.statusHeader' | translate }}</th>
                    <th class="text-right">{{ 'accounting.banking.dashboard.amountHeader' | translate }}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (txn of dashboard()!.recentTransactions; track txn.id) {
                    <tr class="hover:bg-neutral-50 dark:hover:bg-dark-elevated">
                      <td class="text-neutral-600 dark:text-neutral-400">{{ txn.transactionDate | date:'mediumDate' }}</td>
                      <td>{{ txn.bankAccountName }}</td>
                      <td class="max-w-[200px] truncate" [title]="txn.description">{{ txn.description }}</td>
                      <td>
                        <span class="px-2 py-0.5 text-xs font-medium rounded-full" [class]="getReconciliationStatusColor(txn.reconciliationStatus)">
                          {{ getReconciliationStatusLabel(txn.reconciliationStatus) }}
                        </span>
                      </td>
                      <td class="text-right font-mono" [class]="txn.transactionType === 'CREDIT' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                        {{ formatAmount(txn.amount, txn.transactionType) }}
                      </td>
                      <td>
                        <a [routerLink]="['accounts', txn.bankAccountId, 'transactions', txn.id]" class="text-primary-500 hover:text-primary-600">
                          <span class="material-icons text-lg">chevron_right</span>
                        </a>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a routerLink="reconciliation" class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6 hover:shadow-lg transition-shadow group">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <span class="material-icons text-purple-600 dark:text-purple-400">compare_arrows</span>
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-neutral-900 dark:text-white group-hover:text-primary-600">{{ 'accounting.banking.dashboard.reconciliationTitle' | translate }}</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.banking.dashboard.reconciliationDesc' | translate }}</p>
              </div>
              <span class="material-icons text-neutral-400 group-hover:text-primary-600">arrow_forward</span>
            </div>
          </a>

          <a routerLink="rules" class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6 hover:shadow-lg transition-shadow group">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <span class="material-icons text-blue-600 dark:text-blue-400">rule</span>
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-neutral-900 dark:text-white group-hover:text-primary-600">{{ 'accounting.banking.dashboard.rulesTitle' | translate }}</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.banking.dashboard.rulesDesc' | translate }}</p>
              </div>
              <span class="material-icons text-neutral-400 group-hover:text-primary-600">arrow_forward</span>
            </div>
          </a>

          <a routerLink="statements" class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6 hover:shadow-lg transition-shadow group">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <span class="material-icons text-green-600 dark:text-green-400">summarize</span>
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-neutral-900 dark:text-white group-hover:text-primary-600">{{ 'accounting.banking.dashboard.statementsTitle' | translate }}</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.banking.dashboard.statementsDesc' | translate }}</p>
              </div>
              <span class="material-icons text-neutral-400 group-hover:text-primary-600">arrow_forward</span>
            </div>
          </a>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankingDashboardComponent implements OnInit {
  private readonly bankingService = inject(BankingService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  dashboard = signal<BankingDashboard | null>(null);
  loading = signal(true);
  syncing = signal(false);

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.bankingService.getDashboard().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (dashboard) => {
        this.dashboard.set(dashboard);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load banking dashboard', err);
        this.loading.set(false);
      }
    });
  }

  syncAllAccounts(): void {
    this.syncing.set(true);
    this.bankingService.syncAllAccounts().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.loadDashboard();
        this.syncing.set(false);
      },
      error: (err) => {
        console.error('Failed to sync accounts', err);
        this.syncing.set(false);
      }
    });
  }

  connectNewBank(): void {
    // In production, this would initiate the Stitch OAuth flow
    this.toast.info('Bank connection via Stitch coming soon');
  }

  getStatusLabel(status: ConnectionStatus): string {
    return BankingService.getStatusLabel(status);
  }

  getStatusColor(status: ConnectionStatus): string {
    return BankingService.getStatusColor(status);
  }

  getReconciliationStatusLabel(status: string): string {
    return BankingService.getReconciliationStatusLabel(status as any);
  }

  getReconciliationStatusColor(status: string): string {
    return BankingService.getReconciliationStatusColor(status as any);
  }

  formatAmount(amount: number, type: string): string {
    return BankingService.formatAmount(amount, type as any);
  }
}
