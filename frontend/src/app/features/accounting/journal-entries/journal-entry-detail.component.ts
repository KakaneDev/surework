import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  AccountingService,
  JournalEntry,
  JournalEntryStatus,
  JournalEntryType
} from '../../../core/services/accounting.service';
import { SpinnerComponent, ToastService } from '@shared/ui';

@Component({
  selector: 'app-journal-entry-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    SpinnerComponent,
    CurrencyPipe,
    DatePipe,
    TranslateModule
  ],
  template: `
    <div class="space-y-6">
      @if (loading()) {
        <div class="flex justify-center items-center py-24">
          <sw-spinner size="lg" />
        </div>
      } @else if (error()) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <span class="material-icons text-5xl text-error-500 mb-4">error</span>
          <p class="text-neutral-600 dark:text-neutral-400 mb-4">{{ error() }}</p>
          <a routerLink="/accounting/journals" class="px-4 py-2 text-primary-500 hover:text-primary-600 font-medium">{{ 'common.backToList' | translate }}</a>
        </div>
      } @else if (entry()) {
        <!-- Header -->
        <div class="sw-page-header">
          <div class="flex items-center gap-3">
            <a routerLink="/accounting/journals" class="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300">
              <span class="material-icons">arrow_back</span>
            </a>
            <div>
              <div class="flex items-center gap-3">
                <h1 class="sw-page-title">{{ entry()!.entryNumber }}</h1>
                <span class="inline-block px-3 py-1 rounded-full text-sm font-medium"
                      [style.background]="statusColorMap[entry()!.status].background"
                      [style.color]="statusColorMap[entry()!.status].color">
                  {{ statusLabelMap[entry()!.status] || entry()!.status }}
                </span>
              </div>
              <p class="sw-page-description">{{ entry()!.description }}</p>
            </div>
          </div>
          <div class="flex gap-3">
            @if (entry()!.status === 'DRAFT') {
              <a [routerLink]="['/accounting/journals', entry()!.id, 'edit']" class="sw-btn sw-btn-outline sw-btn-md">
                <span class="material-icons text-lg">edit</span>
                {{ 'common.edit' | translate }}
              </a>
              <button (click)="postEntry()" class="sw-btn sw-btn-primary sw-btn-md">
                <span class="material-icons text-lg">check_circle</span>
                {{ 'accounting.journalEntries.detail.postEntry' | translate }}
              </button>
            }
            @if (entry()!.status === 'POSTED') {
              <button (click)="reverseEntry()" class="sw-btn sw-btn-outline sw-btn-md text-orange-600 border-orange-300 hover:bg-orange-50">
                <span class="material-icons text-lg">undo</span>
                {{ 'accounting.journalEntries.detail.reverseEntry' | translate }}
              </button>
            }
          </div>
        </div>

        <!-- Entry Details -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Main Info -->
          <div class="lg:col-span-2 bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-white mb-4">{{ 'accounting.journalEntries.detail.entryDetails' | translate }}</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.journalEntries.detail.transactionDate' | translate }}</p>
                <p class="font-medium text-neutral-800 dark:text-neutral-200">{{ entry()!.transactionDate | date:'mediumDate' }}</p>
              </div>
              <div>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.journalEntries.detail.entryType' | translate }}</p>
                <p class="font-medium text-neutral-800 dark:text-neutral-200">{{ typeLabelMap[entry()!.entryType] || entry()!.entryType }}</p>
              </div>
              <div>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.journalEntries.detail.reference' | translate }}</p>
                <p class="font-medium text-neutral-800 dark:text-neutral-200">{{ entry()!.reference || '-' }}</p>
              </div>
              <div>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.journalEntries.detail.fiscalPeriod' | translate }}</p>
                <p class="font-medium text-neutral-800 dark:text-neutral-200">{{ entry()!.fiscalPeriodName || '-' }}</p>
              </div>
            </div>
            @if (entry()!.notes) {
              <div class="mt-4 pt-4 border-t border-neutral-200 dark:border-dark-border">
                <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.journalEntries.detail.notes' | translate }}</p>
                <p class="text-neutral-800 dark:text-neutral-200">{{ entry()!.notes }}</p>
              </div>
            }
          </div>

          <!-- Posting Info -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-white mb-4">{{ 'accounting.journalEntries.detail.auditTrail' | translate }}</h3>
            <div class="space-y-3">
              <div>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.journalEntries.detail.created' | translate }}</p>
                <p class="font-medium text-neutral-800 dark:text-neutral-200">{{ entry()!.createdAt | date:'medium' }}</p>
              </div>
              @if (entry()!.postedAt) {
                <div>
                  <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.journalEntries.detail.posted' | translate }}</p>
                  <p class="font-medium text-neutral-800 dark:text-neutral-200">{{ entry()!.postedAt | date:'medium' }}</p>
                </div>
              }
              @if (entry()!.reversedAt) {
                <div>
                  <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.journalEntries.detail.reversed' | translate }}</p>
                  <p class="font-medium text-neutral-800 dark:text-neutral-200">{{ entry()!.reversedAt | date:'medium' }}</p>
                </div>
              }
              @if (entry()!.reversalEntryId) {
                <div>
                  <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.journalEntries.detail.reversalEntry' | translate }}</p>
                  <a [routerLink]="['/accounting/journals', entry()!.reversalEntryId]" class="text-primary-500 hover:text-primary-600">{{ 'accounting.journalEntries.detail.viewReversal' | translate }}</a>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Journal Lines -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          <div class="p-4 border-b border-neutral-200 dark:border-dark-border">
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ 'accounting.journalEntries.detail.journalLines' | translate }}</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="sw-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{{ 'accounting.journalEntries.detail.account' | translate }}</th>
                  <th>{{ 'accounting.journalEntries.detail.description' | translate }}</th>
                  <th class="text-right">{{ 'accounting.journalEntries.detail.debit' | translate }}</th>
                  <th class="text-right">{{ 'accounting.journalEntries.detail.credit' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                @for (line of entry()!.lines; track line.id; let i = $index) {
                  <tr>
                    <td class="text-neutral-500 dark:text-neutral-400">{{ i + 1 }}</td>
                    <td>
                      <div>
                        <span class="font-mono text-sm text-neutral-500 dark:text-neutral-400">{{ line.accountCode }}</span>
                        <span class="ml-2 font-medium text-neutral-800 dark:text-neutral-200">{{ line.accountName }}</span>
                      </div>
                    </td>
                    <td class="text-neutral-600 dark:text-neutral-400">{{ line.description || '-' }}</td>
                    <td class="text-right font-mono">
                      @if (line.debitAmount) {
                        {{ line.debitAmount | currency:'ZAR':'symbol':'1.2-2' }}
                      }
                    </td>
                    <td class="text-right font-mono">
                      @if (line.creditAmount) {
                        {{ line.creditAmount | currency:'ZAR':'symbol':'1.2-2' }}
                      }
                    </td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr class="bg-neutral-50 dark:bg-dark-elevated font-semibold">
                  <td colspan="3" class="text-right">{{ 'accounting.journalEntries.detail.totals' | translate }}:</td>
                  <td class="text-right font-mono">{{ entry()!.totalDebit | currency:'ZAR':'symbol':'1.2-2' }}</td>
                  <td class="text-right font-mono">{{ entry()!.totalCredit | currency:'ZAR':'symbol':'1.2-2' }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- Summary -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border border-l-4 border-l-blue-500 p-5">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.journalEntries.detail.totalDebits' | translate }}</p>
            <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{{ entry()!.totalDebit | currency:'ZAR':'symbol':'1.2-2' }}</p>
          </div>
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border border-l-4 border-l-red-500 p-5">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.journalEntries.detail.totalCredits' | translate }}</p>
            <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{{ entry()!.totalCredit | currency:'ZAR':'symbol':'1.2-2' }}</p>
          </div>
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border border-l-4 p-5"
               [class.border-l-green-500]="isBalanced()"
               [class.border-l-orange-500]="!isBalanced()">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.journalEntries.detail.balance' | translate }}</p>
            <p class="text-2xl font-bold" [class.text-green-600]="isBalanced()" [class.text-orange-600]="!isBalanced()">
              {{ isBalanced() ? ('accounting.journalEntries.detail.balanced' | translate) : ('accounting.journalEntries.detail.unbalanced' | translate) }}
            </p>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JournalEntryDetailComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly accountingService = inject(AccountingService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly statusColorMap: Record<JournalEntryStatus, { background: string; color: string }> = {
    DRAFT: { background: '#fff3e0', color: '#f57c00' },
    POSTED: { background: '#e8f5e9', color: '#2e7d32' },
    REVERSED: { background: '#ffebee', color: '#c62828' },
    VOID: { background: '#eceff1', color: '#546e7a' }
  };

  statusLabelMap!: Record<JournalEntryStatus, string>;
  typeLabelMap!: Record<JournalEntryType, string>;

  entry = signal<JournalEntry | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.initializeTranslations();
    const entryId = this.route.snapshot.params['id'];
    if (entryId) {
      this.loadEntry(entryId);
    } else {
      this.router.navigate(['/accounting/journals']);
    }
  }

  private initializeTranslations(): void {
    this.statusLabelMap = {
      DRAFT: this.translate.instant('accounting.journalEntries.detail.statusDraft'),
      POSTED: this.translate.instant('accounting.journalEntries.detail.statusPosted'),
      REVERSED: this.translate.instant('accounting.journalEntries.detail.statusReversed'),
      VOID: this.translate.instant('accounting.journalEntries.detail.statusVoid')
    };

    this.typeLabelMap = {
      MANUAL: this.translate.instant('accounting.journalEntries.detail.typeManual'),
      SYSTEM: this.translate.instant('accounting.journalEntries.detail.typeSystemGenerated'),
      PAYROLL: this.translate.instant('accounting.journalEntries.detail.typePayroll'),
      INVOICE: this.translate.instant('accounting.journalEntries.detail.typeInvoice'),
      BILL: this.translate.instant('accounting.journalEntries.detail.typeBill'),
      PAYMENT: this.translate.instant('accounting.journalEntries.detail.typePayment'),
      RECEIPT: this.translate.instant('accounting.journalEntries.detail.typeReceipt'),
      TRANSFER: this.translate.instant('accounting.journalEntries.detail.typeTransfer'),
      ADJUSTMENT: this.translate.instant('accounting.journalEntries.detail.typeAdjustment'),
      CLOSING: this.translate.instant('accounting.journalEntries.detail.typeClosing'),
      OPENING: this.translate.instant('accounting.journalEntries.detail.typeOpening'),
      REVERSAL: this.translate.instant('accounting.journalEntries.detail.typeReversal')
    };
  }

  private loadEntry(entryId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.accountingService.getJournalEntry(entryId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (entry) => {
        this.entry.set(entry);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load journal entry', err);
        this.error.set(this.translate.instant('accounting.journalEntries.detail.failedToLoadEntry'));
        this.loading.set(false);
      }
    });
  }

  isBalanced(): boolean {
    const entry = this.entry();
    if (!entry) return false;
    return Math.abs(entry.totalDebit - entry.totalCredit) < 0.01;
  }

  postEntry(): void {
    const entry = this.entry();
    if (!entry) return;

    const message = this.translate.instant('accounting.journalEntries.detail.confirmPostEntry', { entryNumber: entry.entryNumber });
    if (confirm(message)) {
      this.accountingService.postJournalEntry(entry.id).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: (updated) => {
          this.toast.success(this.translate.instant('accounting.journalEntries.detail.entryPostedSuccessfully'));
          this.entry.set(updated);
        },
        error: (err) => {
          console.error('Failed to post entry', err);
          this.toast.error(this.translate.instant('accounting.journalEntries.detail.failedToPostEntry'));
        }
      });
    }
  }

  reverseEntry(): void {
    const entry = this.entry();
    if (!entry) return;

    const reason = prompt(this.translate.instant('accounting.journalEntries.detail.promptReversal'));
    if (reason) {
      this.accountingService.reverseJournalEntry(entry.id, reason).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: (reversal) => {
          this.toast.success(this.translate.instant('accounting.journalEntries.detail.entryReversedSuccessfully'));
          this.router.navigate(['/accounting/journals', reversal.id]);
        },
        error: (err) => {
          console.error('Failed to reverse entry', err);
          this.toast.error(this.translate.instant('accounting.journalEntries.detail.failedToReverseEntry'));
        }
      });
    }
  }
}
