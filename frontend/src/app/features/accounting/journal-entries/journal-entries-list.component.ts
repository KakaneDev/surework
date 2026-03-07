import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef, ViewChild } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import {
  AccountingService,
  JournalEntry,
  JournalEntryStatus,
  JournalEntryType,
  PageResponse
} from '../../../core/services/accounting.service';
import {
  SpinnerComponent,
  ToastService,
  PaginationComponent,
  JournalStatusBadgeComponent,
  AccountingConfirmDialogComponent,
  EmptyStateComponent
} from '@shared/ui';

@Component({
  selector: 'app-journal-entries-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslateModule,
    SpinnerComponent,
    PaginationComponent,
    JournalStatusBadgeComponent,
    AccountingConfirmDialogComponent,
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
            <h1 class="sw-page-title">{{ 'accounting.journals.title' | translate }}</h1>
            <p class="sw-page-description">{{ 'accounting.journals.subtitle' | translate }}</p>
          </div>
        </div>
        <a routerLink="/accounting/journals/new" class="sw-btn sw-btn-primary sw-btn-md">
          <span class="material-icons text-lg">add</span>
          {{ 'accounting.journals.newButton' | translate }}
        </a>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
        <div class="flex flex-wrap gap-4">
          <div class="flex-1 min-w-[200px]">
            <input type="text"
                   [(ngModel)]="searchTerm"
                   (ngModelChange)="onFilterChange()"
                   [placeholder]="'accounting.journals.searchPlaceholder' | translate"
                   class="sw-input w-full">
          </div>
          <select [(ngModel)]="selectedStatus" (ngModelChange)="onFilterChange()" class="sw-input w-40">
            <option [ngValue]="null">{{ 'accounting.journals.allStatuses' | translate }}</option>
            @for (status of statuses; track status) {
              <option [ngValue]="status">{{ statusLabelMap[status] }}</option>
            }
          </select>
          <select [(ngModel)]="selectedType" (ngModelChange)="onFilterChange()" class="sw-input w-40">
            <option [ngValue]="null">{{ 'accounting.journals.allTypes' | translate }}</option>
            @for (type of entryTypes; track type) {
              <option [ngValue]="type">{{ typeLabelMap[type] }}</option>
            }
          </select>
          <div class="flex items-center gap-2">
            <input type="date" [(ngModel)]="startDate" (ngModelChange)="onFilterChange()" class="sw-input">
            <span class="text-neutral-400">{{ 'accounting.journals.dateRangeTo' | translate }}</span>
            <input type="date" [(ngModel)]="endDate" (ngModelChange)="onFilterChange()" class="sw-input">
          </div>
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
          <h3 class="text-lg font-semibold text-error-600 dark:text-error-400 mb-2">{{ 'accounting.journals.errorLoading' | translate }}</h3>
          <p class="text-neutral-600 dark:text-neutral-400 mb-4">{{ error() }}</p>
          <button (click)="loadEntries()" class="sw-btn sw-btn-primary sw-btn-md">
            <span class="material-icons text-lg" aria-hidden="true">refresh</span>
            {{ 'accounting.journals.tryAgain' | translate }}
          </button>
        </div>
      } @else {
        <!-- Journal Entries Table -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          @if (entries().length > 0) {
            <div class="overflow-x-auto">
              <table class="sw-table">
                <thead>
                  <tr>
                    <th>{{ 'accounting.journals.tableHeaders.entryNumber' | translate }}</th>
                    <th>{{ 'accounting.journals.tableHeaders.date' | translate }}</th>
                    <th>{{ 'accounting.journals.tableHeaders.description' | translate }}</th>
                    <th>{{ 'accounting.journals.tableHeaders.type' | translate }}</th>
                    <th class="text-right">{{ 'accounting.journals.tableHeaders.debit' | translate }}</th>
                    <th class="text-right">{{ 'accounting.journals.tableHeaders.credit' | translate }}</th>
                    <th>{{ 'accounting.journals.tableHeaders.status' | translate }}</th>
                    <th class="w-[100px]">{{ 'accounting.journals.tableHeaders.actions' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (entry of entries(); track entry.id) {
                    <tr class="cursor-pointer hover:bg-neutral-50 dark:hover:bg-dark-elevated" [routerLink]="['/accounting/journals', entry.id]">
                      <td>
                        <a [routerLink]="['/accounting/journals', entry.id]" class="text-primary-500 hover:text-primary-600 font-medium">
                          {{ entry.entryNumber }}
                        </a>
                      </td>
                      <td class="text-neutral-600 dark:text-neutral-400">{{ entry.transactionDate | date:'mediumDate' }}</td>
                      <td class="max-w-[250px] truncate" [title]="entry.description">{{ entry.description }}</td>
                      <td>
                        <span class="text-xs text-neutral-500 dark:text-neutral-400">{{ typeLabelMap[entry.entryType] || entry.entryType }}</span>
                      </td>
                      <td class="text-right font-mono">{{ entry.totalDebit | currency:'ZAR':'symbol':'1.2-2' }}</td>
                      <td class="text-right font-mono">{{ entry.totalCredit | currency:'ZAR':'symbol':'1.2-2' }}</td>
                      <td>
                        <sw-journal-status-badge [status]="entry.status" />
                      </td>
                      <td (click)="$event.stopPropagation()">
                        <div class="flex items-center gap-1">
                          <a [routerLink]="['/accounting/journals', entry.id]"
                             class="p-1.5 text-neutral-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded"
                             [title]="'accounting.journals.actions.view' | translate">
                            <span class="material-icons text-lg">visibility</span>
                          </a>
                          @if (entry.status === 'DRAFT') {
                            <a [routerLink]="['/accounting/journals', entry.id, 'edit']"
                               class="p-1.5 text-neutral-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded"
                               [title]="'accounting.journals.actions.edit' | translate">
                              <span class="material-icons text-lg">edit</span>
                            </a>
                            <button (click)="showPostDialog(entry)"
                                    class="p-1.5 text-neutral-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                    [title]="'accounting.journals.actions.post' | translate"
                                    [attr.aria-label]="('accounting.journals.ariaLabels.post' | translate) + ' ' + entry.entryNumber">
                              <span class="material-icons text-lg" aria-hidden="true">check_circle</span>
                            </button>
                            <button (click)="showDeleteDialog(entry)"
                                    class="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                    [title]="'accounting.journals.actions.delete' | translate"
                                    [attr.aria-label]="('accounting.journals.ariaLabels.delete' | translate) + ' ' + entry.entryNumber">
                              <span class="material-icons text-lg" aria-hidden="true">delete</span>
                            </button>
                          }
                          @if (entry.status === 'POSTED') {
                            <button (click)="showReverseDialog(entry)"
                                    class="p-1.5 text-neutral-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded"
                                    [title]="'accounting.journals.actions.reverse' | translate"
                                    [attr.aria-label]="('accounting.journals.ariaLabels.reverse' | translate) + ' ' + entry.entryNumber">
                              <span class="material-icons text-lg" aria-hidden="true">undo</span>
                            </button>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            @if (totalPages() > 1) {
              <div class="p-4 border-t border-neutral-200 dark:border-dark-border">
                <sw-pagination
                  [page]="currentPage()"
                  [total]="totalItems()"
                  [pageSize]="pageSize"
                  (pageChange)="onPageChange($event)" />
              </div>
            }
          } @else {
            <sw-empty-state
              icon="receipt_long"
              [title]="'accounting.journals.emptyState.title' | translate"
              [description]="'accounting.journals.emptyState.description' | translate"
              [actionLabel]="'accounting.journals.emptyState.actionLabel' | translate"
              actionIcon="add"
              [actionRoute]="['/accounting/journals/new']" />
          }
        </div>
      }

      <!-- Post Confirmation Dialog -->
      <sw-accounting-confirm-dialog
        [open]="postDialogOpen()"
        type="post"
        [title]="'accounting.journals.dialogs.post.title' | translate"
        [message]="'accounting.journals.dialogs.post.message' | translate"
        [entryNumber]="selectedEntry()?.entryNumber || ''"
        [entryDescription]="selectedEntry()?.description || ''"
        [amount]="selectedEntry()?.totalDebit || null"
        [additionalInfoLabel]="'accounting.journals.dialogs.post.typeLabel' | translate"
        [additionalInfo]="selectedEntry()?.entryType ? typeLabelMap[selectedEntry()!.entryType] : ''"
        [warningMessage]="'accounting.journals.dialogs.post.warningMessage' | translate"
        [confirmText]="'accounting.journals.dialogs.post.confirmText' | translate"
        (confirm)="confirmPost()"
        (cancel)="closeDialogs()" />

      <!-- Delete Confirmation Dialog -->
      <sw-accounting-confirm-dialog
        [open]="deleteDialogOpen()"
        type="delete"
        [title]="'accounting.journals.dialogs.delete.title' | translate"
        [message]="'accounting.journals.dialogs.delete.message' | translate"
        [entryNumber]="selectedEntry()?.entryNumber || ''"
        [entryDescription]="selectedEntry()?.description || ''"
        [amount]="selectedEntry()?.totalDebit || null"
        [warningMessage]="'accounting.journals.dialogs.delete.warningMessage' | translate"
        [confirmText]="'accounting.journals.dialogs.delete.confirmText' | translate"
        (confirm)="confirmDelete()"
        (cancel)="closeDialogs()" />

      <!-- Reverse Confirmation Dialog -->
      <sw-accounting-confirm-dialog
        [open]="reverseDialogOpen()"
        type="reverse"
        [title]="'accounting.journals.dialogs.reverse.title' | translate"
        [message]="'accounting.journals.dialogs.reverse.message' | translate"
        [entryNumber]="selectedEntry()?.entryNumber || ''"
        [entryDescription]="selectedEntry()?.description || ''"
        [amount]="selectedEntry()?.totalDebit || null"
        [showReasonInput]="true"
        [reasonLabel]="'accounting.journals.dialogs.reverse.reasonLabel' | translate"
        [reasonPlaceholder]="'accounting.journals.dialogs.reverse.reasonPlaceholder' | translate"
        [confirmText]="'accounting.journals.dialogs.reverse.confirmText' | translate"
        (confirm)="confirmReverse($event)"
        (cancel)="closeDialogs()" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JournalEntriesListComponent implements OnInit {
  private readonly accountingService = inject(AccountingService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly statuses: JournalEntryStatus[] = ['DRAFT', 'POSTED', 'REVERSED', 'VOID'];
  readonly entryTypes: JournalEntryType[] = ['MANUAL', 'SYSTEM', 'PAYROLL', 'INVOICE', 'BILL', 'PAYMENT', 'RECEIPT', 'TRANSFER', 'ADJUSTMENT', 'CLOSING', 'OPENING', 'REVERSAL'];

  readonly statusLabelMap: Record<JournalEntryStatus, string> = {
    DRAFT: 'Draft',
    POSTED: 'Posted',
    REVERSED: 'Reversed',
    VOID: 'Void'
  };

  readonly typeLabelMap: Record<JournalEntryType, string> = {
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

  entries = signal<JournalEntry[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  currentPage = signal(0);
  totalPages = signal(0);
  totalItems = signal(0);
  pageSize = 20;

  searchTerm = '';
  selectedStatus: JournalEntryStatus | null = null;
  selectedType: JournalEntryType | null = null;
  startDate = '';
  endDate = '';

  // Dialog state
  postDialogOpen = signal(false);
  deleteDialogOpen = signal(false);
  reverseDialogOpen = signal(false);
  selectedEntry = signal<JournalEntry | null>(null);

  private searchTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.loadEntries();
  }

  loadEntries(): void {
    this.loading.set(true);
    this.error.set(null);

    this.accountingService.searchJournalEntries(
      this.currentPage(),
      this.pageSize,
      this.selectedType || undefined,
      this.selectedStatus || undefined,
      this.startDate || undefined,
      this.endDate || undefined,
      this.searchTerm || undefined
    ).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.entries.set(response.content);
        this.totalPages.set(response.totalPages);
        this.totalItems.set(response.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load journal entries', err);
        this.error.set('Failed to load journal entries. Please try again.');
        this.loading.set(false);
      }
    });
  }

  onFilterChange(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(0);
      this.loadEntries();
    }, 300);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadEntries();
  }

  // Dialog methods
  showPostDialog(entry: JournalEntry): void {
    this.selectedEntry.set(entry);
    this.postDialogOpen.set(true);
  }

  showDeleteDialog(entry: JournalEntry): void {
    this.selectedEntry.set(entry);
    this.deleteDialogOpen.set(true);
  }

  showReverseDialog(entry: JournalEntry): void {
    this.selectedEntry.set(entry);
    this.reverseDialogOpen.set(true);
  }

  closeDialogs(): void {
    this.postDialogOpen.set(false);
    this.deleteDialogOpen.set(false);
    this.reverseDialogOpen.set(false);
    this.selectedEntry.set(null);
  }

  confirmPost(): void {
    const entry = this.selectedEntry();
    if (!entry) return;

    this.accountingService.postJournalEntry(entry.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success('Journal entry posted successfully');
        this.closeDialogs();
        this.loadEntries();
      },
      error: (err) => {
        console.error('Failed to post entry', err);
        this.toast.error('Failed to post journal entry');
        this.closeDialogs();
      }
    });
  }

  confirmDelete(): void {
    const entry = this.selectedEntry();
    if (!entry) return;

    this.accountingService.deleteJournalEntry(entry.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success('Journal entry deleted');
        this.closeDialogs();
        this.loadEntries();
      },
      error: (err) => {
        console.error('Failed to delete entry', err);
        this.toast.error('Failed to delete journal entry');
        this.closeDialogs();
      }
    });
  }

  confirmReverse(reason: string): void {
    const entry = this.selectedEntry();
    if (!entry || !reason) return;

    this.accountingService.reverseJournalEntry(entry.id, reason).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success('Journal entry reversed successfully');
        this.closeDialogs();
        this.loadEntries();
      },
      error: (err) => {
        console.error('Failed to reverse entry', err);
        this.toast.error('Failed to reverse journal entry');
        this.closeDialogs();
      }
    });
  }
}
