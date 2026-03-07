import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  InvoiceService,
  InvoiceSummary,
  InvoiceStatus,
  CustomerSummary
} from '../../../core/services/invoice.service';
import { SpinnerComponent } from '@shared/ui';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    TranslateModule,
    SpinnerComponent,
    CurrencyPipe,
    DatePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="sw-page-header">
        <div class="flex items-center gap-3">
          <a routerLink="/accounting/invoicing" class="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300">
            <span class="material-icons">arrow_back</span>
          </a>
          <div>
            <h1 class="sw-page-title">{{ 'accounting.invoicing.list.title' | translate }}</h1>
            <p class="sw-page-description">{{ 'accounting.invoicing.list.subtitle' | translate }}</p>
          </div>
        </div>
        <button (click)="createNewInvoice()" class="sw-btn sw-btn-primary sw-btn-md">
          <span class="material-icons text-lg">add</span>
          {{ 'accounting.invoicing.list.newInvoiceButton' | translate }}
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
        <div class="flex flex-wrap gap-4 items-end">
          <!-- Search -->
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.list.filters.search' | translate }}</label>
            <input type="text"
                   [(ngModel)]="searchTerm"
                   (ngModelChange)="onSearchChange()"
                   [placeholder]="'accounting.invoicing.list.filters.searchPlaceholder' | translate"
                   class="sw-input w-full">
          </div>

          <!-- Status Filter -->
          <div class="w-40">
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.list.filters.status' | translate }}</label>
            <select [(ngModel)]="selectedStatus" (ngModelChange)="loadInvoices()" class="sw-select w-full">
              <option [ngValue]="null">{{ 'accounting.invoicing.list.filters.allStatuses' | translate }}</option>
              @for (status of statuses; track status) {
                <option [ngValue]="status">{{ getStatusLabel(status) }}</option>
              }
            </select>
          </div>

          <!-- Customer Filter -->
          <div class="w-48">
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.list.filters.customer' | translate }}</label>
            <select [(ngModel)]="selectedCustomerId" (ngModelChange)="loadInvoices()" class="sw-select w-full">
              <option [ngValue]="null">{{ 'accounting.invoicing.list.filters.allCustomers' | translate }}</option>
              @for (customer of customers(); track customer.id) {
                <option [ngValue]="customer.id">{{ customer.customerName }}</option>
              }
            </select>
          </div>

          <!-- Date Range -->
          <div class="w-36">
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.list.filters.fromDate' | translate }}</label>
            <input type="date" [(ngModel)]="startDate" (ngModelChange)="loadInvoices()" class="sw-input w-full">
          </div>
          <div class="w-36">
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.list.filters.toDate' | translate }}</label>
            <input type="date" [(ngModel)]="endDate" (ngModelChange)="loadInvoices()" class="sw-input w-full">
          </div>

          <!-- Clear Filters -->
          <button (click)="clearFilters()" class="sw-btn sw-btn-outline sw-btn-sm">
            <span class="material-icons text-sm">clear</span>
            {{ 'accounting.invoicing.list.filters.clear' | translate }}
          </button>
        </div>
      </div>

      <!-- Invoice List -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border">
        @if (loading()) {
          <div class="flex justify-center items-center py-24">
            <sw-spinner size="lg" />
          </div>
        } @else if (invoices().length > 0) {
          <div class="overflow-x-auto">
            <table class="sw-table">
              <thead>
                <tr>
                  <th>{{ 'accounting.invoicing.list.table.invoiceNumber' | translate }}</th>
                  <th>{{ 'accounting.invoicing.list.table.customer' | translate }}</th>
                  <th>{{ 'accounting.invoicing.list.table.date' | translate }}</th>
                  <th>{{ 'accounting.invoicing.list.table.dueDate' | translate }}</th>
                  <th>{{ 'accounting.invoicing.list.table.status' | translate }}</th>
                  <th class="text-right">{{ 'accounting.invoicing.list.table.total' | translate }}</th>
                  <th class="text-right">{{ 'accounting.invoicing.list.table.due' | translate }}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (invoice of invoices(); track invoice.id) {
                  <tr class="hover:bg-neutral-50 dark:hover:bg-dark-elevated cursor-pointer" (click)="viewInvoice(invoice.id)">
                    <td class="font-medium text-primary-600">{{ invoice.invoiceNumber }}</td>
                    <td>{{ invoice.customerName }}</td>
                    <td class="text-sm text-neutral-600 dark:text-neutral-400">{{ invoice.invoiceDate | date:'mediumDate' }}</td>
                    <td class="text-sm" [class]="isOverdue(invoice) ? 'text-red-600 font-medium' : 'text-neutral-600 dark:text-neutral-400'">
                      {{ invoice.dueDate | date:'mediumDate' }}
                      @if (isOverdue(invoice)) {
                        <span class="material-icons text-sm ml-1 align-middle">warning</span>
                      }
                    </td>
                    <td>
                      <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full" [class]="getStatusColor(invoice.status)">
                        {{ getStatusLabel(invoice.status) }}
                      </span>
                    </td>
                    <td class="text-right font-mono">{{ invoice.total | currency:'ZAR':'symbol':'1.2-2' }}</td>
                    <td class="text-right font-mono" [class]="invoice.amountDue > 0 ? 'text-red-600 font-medium' : 'text-green-600'">
                      {{ invoice.amountDue | currency:'ZAR':'symbol':'1.2-2' }}
                    </td>
                    <td class="text-right">
                      <div class="flex items-center justify-end gap-2">
                        <button (click)="downloadPdf(invoice, $event)" class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300" [title]="'accounting.invoicing.list.table.downloadPdf' | translate">
                          <span class="material-icons text-lg">download</span>
                        </button>
                        <button class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300" [title]="'accounting.invoicing.list.table.viewDetails' | translate">
                          <span class="material-icons">chevron_right</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="p-4 border-t border-neutral-200 dark:border-dark-border flex items-center justify-between">
              <p class="text-sm text-neutral-600 dark:text-neutral-400">
                {{ 'accounting.invoicing.list.pagination.showing' | translate: { start: (currentPage() * pageSize) + 1, end: Math.min((currentPage() + 1) * pageSize, totalElements()), total: totalElements() } }}
              </p>
              <div class="flex gap-2">
                <button (click)="goToPage(currentPage() - 1)"
                        [disabled]="currentPage() === 0"
                        class="sw-btn sw-btn-outline sw-btn-sm"
                        [class.opacity-50]="currentPage() === 0">
                  <span class="material-icons text-sm">chevron_left</span>
                </button>
                @for (page of visiblePages(); track page) {
                  <button (click)="goToPage(page)"
                          class="sw-btn sw-btn-sm"
                          [class]="page === currentPage() ? 'sw-btn-primary' : 'sw-btn-outline'">
                    {{ page + 1 }}
                  </button>
                }
                <button (click)="goToPage(currentPage() + 1)"
                        [disabled]="currentPage() >= totalPages() - 1"
                        class="sw-btn sw-btn-outline sw-btn-sm"
                        [class.opacity-50]="currentPage() >= totalPages() - 1">
                  <span class="material-icons text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          }
        } @else {
          <div class="p-12 text-center">
            <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">receipt_long</span>
            <p class="text-neutral-500 dark:text-neutral-400 mb-4">{{ 'accounting.invoicing.list.empty.message' | translate }}</p>
            <button (click)="createNewInvoice()" class="sw-btn sw-btn-primary sw-btn-md">
              <span class="material-icons text-lg">add</span>
              {{ 'accounting.invoicing.list.empty.createButton' | translate }}
            </button>
          </div>
        }
      </div>
    </div>
  `
})
export class InvoiceListComponent implements OnInit {
  private readonly invoiceService = inject(InvoiceService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);

  Math = Math;

  loading = signal(true);
  invoices = signal<InvoiceSummary[]>([]);
  customers = signal<CustomerSummary[]>([]);
  currentPage = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  pageSize = 20;

  // Filters
  searchTerm = '';
  selectedStatus: InvoiceStatus | null = null;
  selectedCustomerId: string | null = null;
  startDate: string | null = null;
  endDate: string | null = null;

  private searchDebounce: ReturnType<typeof setTimeout> | null = null;

  statuses: InvoiceStatus[] = ['DRAFT', 'SENT', 'VIEWED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID', 'WRITTEN_OFF'];

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    let start = Math.max(0, current - 2);
    let end = Math.min(total - 1, current + 2);

    if (end - start < 4) {
      if (start === 0) {
        end = Math.min(4, total - 1);
      } else {
        start = Math.max(0, end - 4);
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  });

  ngOnInit(): void {
    // Load customers for filter dropdown
    this.loadCustomers();

    // Check for status filter from query params
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        if (params['status']) {
          this.selectedStatus = params['status'] as InvoiceStatus;
        }
        this.loadInvoices();
      });
  }

  loadCustomers(): void {
    this.invoiceService.getActiveCustomers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (customers) => this.customers.set(customers),
        error: (err) => console.error(this.translate.instant('accounting.invoicing.list.errors.loadCustomers'), err)
      });
  }

  loadInvoices(): void {
    this.loading.set(true);
    this.invoiceService.searchInvoices(
      this.currentPage(),
      this.pageSize,
      this.selectedStatus ?? undefined,
      this.selectedCustomerId ?? undefined,
      this.startDate ?? undefined,
      this.endDate ?? undefined,
      this.searchTerm || undefined
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.invoices.set(response.content);
          this.totalPages.set(response.totalPages);
          this.totalElements.set(response.totalElements);
          this.loading.set(false);
        },
        error: (err) => {
          console.error(this.translate.instant('accounting.invoicing.list.errors.loadInvoices'), err);
          this.loading.set(false);
        }
      });
  }

  onSearchChange(): void {
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }
    this.searchDebounce = setTimeout(() => {
      this.currentPage.set(0);
      this.loadInvoices();
    }, 300);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = null;
    this.selectedCustomerId = null;
    this.startDate = null;
    this.endDate = null;
    this.currentPage.set(0);
    this.loadInvoices();
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadInvoices();
    }
  }

  createNewInvoice(): void {
    this.router.navigate(['/accounting/invoicing/new']);
  }

  viewInvoice(invoiceId: string): void {
    this.router.navigate(['/accounting/invoicing', invoiceId]);
  }

  downloadPdf(invoice: InvoiceSummary, event: Event): void {
    event.stopPropagation();
    this.invoiceService.downloadPdf(invoice.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${invoice.invoiceNumber}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error(this.translate.instant('accounting.invoicing.list.errors.downloadPdf'), err)
    });
  }

  getStatusLabel(status: InvoiceStatus): string {
    const statusLabels: Record<InvoiceStatus, string> = {
      'DRAFT': this.translate.instant('accounting.invoicing.status.draft'),
      'SENT': this.translate.instant('accounting.invoicing.status.sent'),
      'VIEWED': this.translate.instant('accounting.invoicing.status.viewed'),
      'PARTIALLY_PAID': this.translate.instant('accounting.invoicing.status.partiallyPaid'),
      'PAID': this.translate.instant('accounting.invoicing.status.paid'),
      'OVERDUE': this.translate.instant('accounting.invoicing.status.overdue'),
      'VOID': this.translate.instant('accounting.invoicing.status.void'),
      'WRITTEN_OFF': this.translate.instant('accounting.invoicing.status.writtenOff')
    };
    return statusLabels[status] || status;
  }

  getStatusColor(status: InvoiceStatus): string {
    return InvoiceService.getStatusColor(status);
  }

  isOverdue(invoice: InvoiceSummary): boolean {
    return InvoiceService.isOverdue(invoice);
  }
}
