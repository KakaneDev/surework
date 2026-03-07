import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BankingService, BankAccount, BankTransaction, ReconciliationStatus, ReconciliationSummary, SuggestedMatch } from '../../../core/services/banking.service';
import { AccountingService, Account } from '../../../core/services/accounting.service';
import { SpinnerComponent } from '@shared/ui';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-bank-reconciliation',
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
          <a routerLink="/accounting/banking" class="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300">
            <span class="material-icons">arrow_back</span>
          </a>
          <div>
            <h1 class="sw-page-title">{{ 'accounting.banking.reconciliation.title' | translate }}</h1>
            <p class="sw-page-description">{{ 'accounting.banking.reconciliation.subtitle' | translate }}</p>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center items-center py-24">
          <sw-spinner size="lg" />
        </div>
      } @else {
        <!-- Bank Account Selector and Summary -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
          <div class="flex flex-wrap items-center gap-4">
            <div class="flex-1 min-w-[250px]">
              <label class="sw-label">{{ 'accounting.banking.reconciliation.bankAccountLabel' | translate }}</label>
              <select [(ngModel)]="selectedBankAccountId" (ngModelChange)="onBankAccountChange()" class="sw-input w-full">
                @for (account of bankAccounts(); track account.id) {
                  <option [value]="account.id">{{ account.institutionName }} - {{ account.accountName }}</option>
                }
              </select>
            </div>

            @if (summary()) {
              <div class="flex gap-6 text-sm">
                <div class="text-center">
                  <p class="text-neutral-500 dark:text-neutral-400">{{ 'accounting.banking.reconciliation.unreconciledLabel' | translate }}</p>
                  <p class="text-xl font-bold text-amber-600">{{ summary()!.unreconciledCount + summary()!.suggestedCount }}</p>
                </div>
                <div class="text-center">
                  <p class="text-neutral-500 dark:text-neutral-400">{{ 'accounting.banking.reconciliation.matchedLabel' | translate }}</p>
                  <p class="text-xl font-bold text-purple-600">{{ summary()!.matchedCount }}</p>
                </div>
                <div class="text-center">
                  <p class="text-neutral-500 dark:text-neutral-400">{{ 'accounting.banking.reconciliation.reconciledLabel' | translate }}</p>
                  <p class="text-xl font-bold text-green-600">{{ summary()!.reconciledCount }}</p>
                </div>
              </div>
            }

            <button (click)="autoMatch()" [disabled]="autoMatching()" class="sw-btn sw-btn-outline sw-btn-md" [title]="'accounting.banking.reconciliation.autoMatchTitle' | translate">
              @if (autoMatching()) {
                <sw-spinner size="sm" />
              } @else {
                <span class="material-icons text-lg">auto_fix_high</span>
              }
              {{ 'accounting.banking.reconciliation.autoMatchButton' | translate }}
            </button>
          </div>
        </div>

        <!-- Filters -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
          <div class="flex flex-wrap items-center gap-4">
            <div>
              <label class="sw-label">{{ 'accounting.banking.reconciliation.statusLabel' | translate }}</label>
              <select [(ngModel)]="statusFilter" (ngModelChange)="loadTransactions()" class="sw-input">
                <option value="ALL">{{ 'common.all' | translate }}</option>
                <option value="UNRECONCILED">{{ 'accounting.banking.reconciliation.statusUnreconciled' | translate }}</option>
                <option value="SUGGESTED">{{ 'accounting.banking.reconciliation.statusSuggested' | translate }}</option>
                <option value="MATCHED">{{ 'accounting.banking.reconciliation.statusMatched' | translate }}</option>
                <option value="RECONCILED">{{ 'accounting.banking.reconciliation.statusReconciled' | translate }}</option>
                <option value="EXCLUDED">{{ 'accounting.banking.reconciliation.statusExcluded' | translate }}</option>
              </select>
            </div>
            <div>
              <label class="sw-label">{{ 'accounting.banking.reconciliation.typeLabel' | translate }}</label>
              <select [(ngModel)]="typeFilter" (ngModelChange)="loadTransactions()" class="sw-input">
                <option value="ALL">{{ 'common.all' | translate }}</option>
                <option value="CREDIT">{{ 'accounting.banking.reconciliation.typeCredit' | translate }}</option>
                <option value="DEBIT">{{ 'accounting.banking.reconciliation.typeDebit' | translate }}</option>
              </select>
            </div>
            <div class="flex-1 min-w-[200px]">
              <label class="sw-label">{{ 'common.search' | translate }}</label>
              <input type="text" [(ngModel)]="searchTerm" (input)="onSearch()" class="sw-input w-full" [placeholder]="'accounting.banking.reconciliation.searchPlaceholder' | translate">
            </div>
          </div>
        </div>

        <!-- Transactions Table -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          @if (loadingTransactions()) {
            <div class="flex justify-center items-center py-12">
              <sw-spinner size="md" />
            </div>
          } @else if (transactions().length > 0) {
            <div class="overflow-x-auto">
              <table class="sw-table">
                <thead>
                  <tr>
                    <th class="w-10">
                      <input type="checkbox" [(ngModel)]="selectAll" (ngModelChange)="onSelectAllChange()" class="rounded border-neutral-300">
                    </th>
                    <th>{{ 'common.date' | translate }}</th>
                    <th>{{ 'common.description' | translate }}</th>
                    <th>{{ 'common.status' | translate }}</th>
                    <th>{{ 'accounting.banking.reconciliation.suggestedAccountHeader' | translate }}</th>
                    <th class="text-right">{{ 'common.amount' | translate }}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (txn of transactions(); track txn.id) {
                    <tr class="hover:bg-neutral-50 dark:hover:bg-dark-elevated"
                        [ngClass]="{'bg-purple-50 dark:bg-purple-900/10': selectedTransactions.has(txn.id)}">
                      <td>
                        <input type="checkbox" [checked]="selectedTransactions.has(txn.id)"
                               (change)="toggleSelection(txn.id)" class="rounded border-neutral-300"
                               [disabled]="txn.reconciliationStatus === 'RECONCILED' || txn.reconciliationStatus === 'EXCLUDED'">
                      </td>
                      <td class="text-neutral-600 dark:text-neutral-400 whitespace-nowrap">{{ txn.transactionDate | date:'mediumDate' }}</td>
                      <td>
                        <div class="max-w-[250px]">
                          <div class="font-medium text-neutral-900 dark:text-white truncate">{{ txn.description }}</div>
                          @if (txn.payeeName) {
                            <div class="text-sm text-neutral-500 dark:text-neutral-400 truncate">{{ txn.payeeName }}</div>
                          }
                        </div>
                      </td>
                      <td>
                        <span class="px-2 py-0.5 text-xs font-medium rounded-full" [class]="getReconciliationStatusColor(txn.reconciliationStatus)">
                          {{ getReconciliationStatusLabel(txn.reconciliationStatus) }}
                        </span>
                      </td>
                      <td>
                        @if (txn.suggestedAccountId) {
                          <div class="text-sm">
                            <div class="font-mono">{{ txn.suggestedAccountCode }}</div>
                            <div class="text-neutral-500 dark:text-neutral-400">
                              {{ txn.suggestionConfidence! * 100 | number:'1.0-0' }}% {{ 'accounting.banking.reconciliation.confidenceLabel' | translate }}
                            </div>
                          </div>
                        } @else if (txn.matchedAccountId) {
                          <div class="text-sm font-mono">{{ txn.matchedAccountCode }}</div>
                        } @else {
                          <span class="text-neutral-400 dark:text-neutral-500">-</span>
                        }
                      </td>
                      <td class="text-right font-mono whitespace-nowrap" [class]="txn.transactionType === 'CREDIT' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                        {{ formatAmount(txn.amount, txn.transactionType) }}
                      </td>
                      <td>
                        <div class="flex gap-1">
                          @if (txn.reconciliationStatus === 'SUGGESTED') {
                            <button (click)="acceptSuggestion(txn)" class="p-1 text-green-600 hover:text-green-700" [title]="'accounting.banking.reconciliation.acceptSuggestionTitle' | translate">
                              <span class="material-icons text-lg">check</span>
                            </button>
                          }
                          @if (txn.reconciliationStatus !== 'RECONCILED' && txn.reconciliationStatus !== 'EXCLUDED') {
                            <button (click)="openMatchDialog(txn)" class="p-1 text-primary-600 hover:text-primary-700" [title]="'accounting.banking.reconciliation.matchTitle' | translate">
                              <span class="material-icons text-lg">compare_arrows</span>
                            </button>
                            <button (click)="excludeTransaction(txn)" class="p-1 text-neutral-400 hover:text-neutral-600" [title]="'accounting.banking.reconciliation.excludeTitle' | translate">
                              <span class="material-icons text-lg">block</span>
                            </button>
                          }
                          @if (txn.reconciliationStatus === 'RECONCILED' || txn.reconciliationStatus === 'MATCHED') {
                            <button (click)="unreconcile(txn)" class="p-1 text-amber-600 hover:text-amber-700" [title]="'accounting.banking.reconciliation.undoTitle' | translate">
                              <span class="material-icons text-lg">undo</span>
                            </button>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Bulk Actions -->
            @if (selectedTransactions.size > 0) {
              <div class="p-4 border-t border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-elevated flex items-center justify-between">
                <span class="text-sm text-neutral-600 dark:text-neutral-400">
                  {{ selectedTransactions.size }} {{ 'accounting.banking.reconciliation.transactionsSelected' | translate }}
                </span>
                <div class="flex gap-2">
                  <button (click)="openBulkMatchDialog()" class="sw-btn sw-btn-primary sw-btn-sm">
                    <span class="material-icons text-lg">compare_arrows</span>
                    {{ 'accounting.banking.reconciliation.matchSelectedButton' | translate }}
                  </button>
                  <button (click)="clearSelection()" class="sw-btn sw-btn-outline sw-btn-sm">
                    {{ 'accounting.banking.reconciliation.clearSelectionButton' | translate }}
                  </button>
                </div>
              </div>
            }
          } @else {
            <div class="p-12 text-center">
              <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">check_circle</span>
              <p class="text-neutral-500 dark:text-neutral-400">{{ 'accounting.banking.reconciliation.noTransactions' | translate }}</p>
            </div>
          }
        </div>
      }

      <!-- Match Dialog -->
      @if (showMatchDialog()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" (click)="closeMatchDialog()">
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-xl w-full max-w-lg mx-4" (click)="$event.stopPropagation()">
            <div class="p-4 border-b border-neutral-200 dark:border-dark-border">
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">
                {{ selectedTransactions.size > 1 ? ('accounting.banking.reconciliation.matchTransactionsDialogTitle' | translate) : ('accounting.banking.reconciliation.matchTransactionDialogTitle' | translate) }}
              </h2>
            </div>
            <div class="p-4 space-y-4">
              @if (matchingTransaction()) {
                <div class="p-3 bg-neutral-50 dark:bg-dark-elevated rounded-lg">
                  <div class="text-sm text-neutral-500 dark:text-neutral-400">{{ matchingTransaction()!.transactionDate | date:'mediumDate' }}</div>
                  <div class="font-medium">{{ matchingTransaction()!.description }}</div>
                  <div class="font-mono" [class]="matchingTransaction()!.transactionType === 'CREDIT' ? 'text-green-600' : 'text-red-600'">
                    {{ formatAmount(matchingTransaction()!.amount, matchingTransaction()!.transactionType) }}
                  </div>
                </div>
              }

              <!-- Suggested Matches -->
              @if (suggestedMatches().length > 0) {
                <div>
                  <label class="sw-label">{{ 'accounting.banking.reconciliation.suggestedAccountsLabel' | translate }}</label>
                  <div class="space-y-2">
                    @for (match of suggestedMatches(); track match.suggestedAccountId) {
                      <button (click)="selectMatchAccount(match.suggestedAccountId)"
                              class="w-full p-3 text-left rounded-lg border transition-colors"
                              [class]="matchAccountId === match.suggestedAccountId ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-neutral-200 dark:border-dark-border hover:bg-neutral-50 dark:hover:bg-dark-elevated'">
                        <div class="flex items-center justify-between">
                          <div>
                            <div class="font-mono text-sm">{{ match.suggestedAccountCode }}</div>
                            <div class="text-sm text-neutral-600 dark:text-neutral-400">{{ match.suggestedAccountName }}</div>
                          </div>
                          <div class="text-right">
                            <div class="text-sm font-medium text-primary-600">{{ match.confidence * 100 | number:'1.0-0' }}%</div>
                            <div class="text-xs text-neutral-500">{{ match.source }}</div>
                          </div>
                        </div>
                      </button>
                    }
                  </div>
                </div>
              }

              <!-- Manual Account Selection -->
              <div>
                <label class="sw-label">{{ 'accounting.banking.reconciliation.selectAccountLabel' | translate }}</label>
                <select [(ngModel)]="matchAccountId" class="sw-input w-full">
                  <option [ngValue]="null">{{ 'accounting.banking.reconciliation.selectAccountPlaceholder' | translate }}</option>
                  @for (account of accounts(); track account.id) {
                    <option [value]="account.id">{{ account.accountCode }} - {{ account.accountName }}</option>
                  }
                </select>
              </div>

              <div>
                <label class="flex items-center gap-2">
                  <input type="checkbox" [(ngModel)]="createJournalEntry" class="rounded border-neutral-300">
                  <span class="text-sm text-neutral-600 dark:text-neutral-400">{{ 'accounting.banking.reconciliation.createJournalEntryCheckbox' | translate }}</span>
                </label>
              </div>
            </div>
            <div class="p-4 border-t border-neutral-200 dark:border-dark-border flex justify-end gap-3">
              <button (click)="closeMatchDialog()" class="sw-btn sw-btn-outline sw-btn-md">{{ 'common.cancel' | translate }}</button>
              <button (click)="confirmMatch()" [disabled]="!matchAccountId" class="sw-btn sw-btn-primary sw-btn-md">
                {{ 'accounting.banking.reconciliation.matchButton' | translate }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankReconciliationComponent implements OnInit {
  private readonly bankingService = inject(BankingService);
  private readonly accountingService = inject(AccountingService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);

  bankAccounts = signal<BankAccount[]>([]);
  accounts = signal<Account[]>([]);
  transactions = signal<BankTransaction[]>([]);
  summary = signal<ReconciliationSummary | null>(null);
  suggestedMatches = signal<SuggestedMatch[]>([]);
  loading = signal(true);
  loadingTransactions = signal(false);
  autoMatching = signal(false);
  showMatchDialog = signal(false);
  matchingTransaction = signal<BankTransaction | null>(null);

  selectedBankAccountId: string | null = null;
  statusFilter: ReconciliationStatus | 'ALL' = 'ALL';
  typeFilter: string = 'ALL';
  searchTerm = '';
  selectAll = false;
  selectedTransactions = new Set<string>();
  matchAccountId: string | null = null;
  createJournalEntry = true;

  private searchTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    forkJoin({
      bankAccounts: this.bankingService.getBankAccounts(),
      accounts: this.accountingService.getPostableAccounts()
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ bankAccounts, accounts }) => {
        this.bankAccounts.set(bankAccounts.filter(a => a.status === 'ACTIVE'));
        this.accounts.set(accounts);

        if (this.bankAccounts().length > 0) {
          this.selectedBankAccountId = this.bankAccounts()[0].id;
          this.loadTransactions();
          this.loadSummary();
        }

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load data', err);
        this.loading.set(false);
      }
    });
  }

  onBankAccountChange(): void {
    this.selectedTransactions.clear();
    this.selectAll = false;
    this.loadTransactions();
    this.loadSummary();
  }

  loadTransactions(): void {
    if (!this.selectedBankAccountId) return;

    this.loadingTransactions.set(true);
    this.bankingService.getTransactions(
      this.selectedBankAccountId,
      0,
      100,
      this.searchTerm || undefined,
      this.statusFilter as any,
      this.typeFilter as any
    ).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (page) => {
        this.transactions.set(page.content);
        this.loadingTransactions.set(false);
      },
      error: (err) => {
        console.error('Failed to load transactions', err);
        this.loadingTransactions.set(false);
      }
    });
  }

  private loadSummary(): void {
    if (!this.selectedBankAccountId) return;

    this.bankingService.getReconciliationSummary(this.selectedBankAccountId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (summary) => this.summary.set(summary),
      error: (err) => console.error('Failed to load summary', err)
    });
  }

  onSearch(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadTransactions(), 300);
  }

  autoMatch(): void {
    if (!this.selectedBankAccountId) return;

    this.autoMatching.set(true);
    this.bankingService.autoMatchTransactions(this.selectedBankAccountId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (matched) => {
        this.loadTransactions();
        this.loadSummary();
        this.autoMatching.set(false);
        const message = this.translate.instant('accounting.banking.reconciliation.autoMatchSuccess', { count: matched });
        alert(message);
      },
      error: (err) => {
        console.error('Failed to auto-match', err);
        this.autoMatching.set(false);
      }
    });
  }

  onSelectAllChange(): void {
    if (this.selectAll) {
      this.transactions()
        .filter(t => t.reconciliationStatus !== 'RECONCILED' && t.reconciliationStatus !== 'EXCLUDED')
        .forEach(t => this.selectedTransactions.add(t.id));
    } else {
      this.selectedTransactions.clear();
    }
  }

  toggleSelection(transactionId: string): void {
    if (this.selectedTransactions.has(transactionId)) {
      this.selectedTransactions.delete(transactionId);
    } else {
      this.selectedTransactions.add(transactionId);
    }
  }

  clearSelection(): void {
    this.selectedTransactions.clear();
    this.selectAll = false;
  }

  openMatchDialog(txn: BankTransaction): void {
    this.matchingTransaction.set(txn);
    this.matchAccountId = txn.suggestedAccountId || txn.matchedAccountId || null;
    this.loadSuggestedMatches(txn.id);
    this.showMatchDialog.set(true);
  }

  openBulkMatchDialog(): void {
    this.matchingTransaction.set(null);
    this.matchAccountId = null;
    this.suggestedMatches.set([]);
    this.showMatchDialog.set(true);
  }

  closeMatchDialog(): void {
    this.showMatchDialog.set(false);
    this.matchingTransaction.set(null);
    this.suggestedMatches.set([]);
  }

  private loadSuggestedMatches(transactionId: string): void {
    this.bankingService.getSuggestedMatches(transactionId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (matches) => this.suggestedMatches.set(matches),
      error: (err) => console.error('Failed to load suggested matches', err)
    });
  }

  selectMatchAccount(accountId: string): void {
    this.matchAccountId = accountId;
  }

  confirmMatch(): void {
    if (!this.matchAccountId) return;

    if (this.matchingTransaction()) {
      // Single transaction
      this.bankingService.reconcileTransaction(this.matchingTransaction()!.id, {
        accountId: this.matchAccountId,
        createJournalEntry: this.createJournalEntry
      }).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: () => {
          this.closeMatchDialog();
          this.loadTransactions();
          this.loadSummary();
        },
        error: (err) => console.error('Failed to reconcile', err)
      });
    } else {
      // Bulk reconciliation
      this.bankingService.bulkReconcile({
        transactionIds: Array.from(this.selectedTransactions),
        accountId: this.matchAccountId,
        createJournalEntries: this.createJournalEntry
      }).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: () => {
          this.closeMatchDialog();
          this.clearSelection();
          this.loadTransactions();
          this.loadSummary();
        },
        error: (err) => console.error('Failed to bulk reconcile', err)
      });
    }
  }

  acceptSuggestion(txn: BankTransaction): void {
    this.bankingService.acceptSuggestion(txn.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.loadTransactions();
        this.loadSummary();
      },
      error: (err) => console.error('Failed to accept suggestion', err)
    });
  }

  excludeTransaction(txn: BankTransaction): void {
    const confirmMessage = this.translate.instant('accounting.banking.reconciliation.excludeConfirmation');
    if (!confirm(confirmMessage)) return;

    this.bankingService.excludeTransaction(txn.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.loadTransactions();
        this.loadSummary();
      },
      error: (err) => console.error('Failed to exclude', err)
    });
  }

  unreconcile(txn: BankTransaction): void {
    const confirmMessage = this.translate.instant('accounting.banking.reconciliation.unreconcileConfirmation');
    if (!confirm(confirmMessage)) return;

    this.bankingService.unreconcile(txn.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.loadTransactions();
        this.loadSummary();
      },
      error: (err) => console.error('Failed to unreconcile', err)
    });
  }

  getReconciliationStatusLabel(status: ReconciliationStatus): string {
    return BankingService.getReconciliationStatusLabel(status);
  }

  getReconciliationStatusColor(status: ReconciliationStatus): string {
    return BankingService.getReconciliationStatusColor(status);
  }

  formatAmount(amount: number, type: string): string {
    return BankingService.formatAmount(amount, type as any);
  }
}
