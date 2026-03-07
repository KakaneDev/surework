import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BillingService } from '@core/services/billing.service';
import { Payment, PaymentStatus } from '@core/models/billing.model';
import { BadgeComponent, BadgeColor } from '@core/components/ui/badge.component';
import { ButtonComponent } from '@core/components/ui/button.component';
import { SelectComponent, SelectOption } from '@core/components/ui/select.component';
import { TableComponent, TableColumn } from '@core/components/ui/table.component';
import { PaginationComponent } from '@core/components/ui/pagination.component';
import { CurrencyZarPipe } from '@core/pipes/currency-zar.pipe';
import { RelativeTimePipe } from '@core/pipes/relative-time.pipe';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    BadgeComponent,
    ButtonComponent,
    SelectComponent,
    TableComponent,
    PaginationComponent,
    CurrencyZarPipe,
    RelativeTimePipe
  ],
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Payment History</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Track all payment transactions</p>
        </div>
        <app-select
          [options]="statusOptions"
          [(ngModel)]="selectedStatus"
          (ngModelChange)="loadData()"
        />
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stats-card">
          <p class="stats-card-label">Total Processed</p>
          <p class="stats-card-value">{{ stats().totalProcessed | currencyZar }}</p>
        </div>
        <div class="stats-card">
          <p class="stats-card-label">Successful</p>
          <p class="stats-card-value">{{ stats().successful }}</p>
        </div>
        <div class="stats-card">
          <p class="stats-card-label">Failed</p>
          <p class="stats-card-value">{{ stats().failed }}</p>
        </div>
        <div class="stats-card">
          <p class="stats-card-label">Pending</p>
          <p class="stats-card-value">{{ stats().pending }}</p>
        </div>
      </div>

      <!-- Payments Table -->
      <app-table [columns]="columns" [data]="payments()" [loading]="loading()">
        @for (payment of payments(); track payment.id) {
          <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
            <td class="px-4 py-3">
              <a
                [routerLink]="['/tenants', payment.tenantId]"
                class="font-medium text-gray-900 hover:text-gray-600 dark:text-white dark:hover:text-gray-300"
              >
                {{ payment.tenantName }}
              </a>
            </td>
            <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
              {{ payment.amount | currencyZar }}
            </td>
            <td class="px-4 py-3">
              <app-badge [color]="getStatusColor(payment.status)">{{ payment.status }}</app-badge>
            </td>
            <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
              {{ payment.paymentMethod }}
            </td>
            <td class="px-4 py-3 text-gray-500 dark:text-gray-400">
              {{ payment.createdAt | relativeTime }}
            </td>
            <td class="px-4 py-3">
              @if (payment.status === 'FAILED') {
                <app-button size="sm" variant="outline" (onClick)="retryPayment(payment.id)">
                  Retry
                </app-button>
              }
              @if (payment.failureReason) {
                <span class="text-xs text-red-600 dark:text-red-400 ml-2" [title]="payment.failureReason">
                  {{ payment.failureReason | slice:0:30 }}...
                </span>
              }
            </td>
          </tr>
        }
      </app-table>

      <app-pagination
        [currentPage]="page"
        [pageSize]="size"
        [totalElements]="totalElements()"
        (pageChange)="onPageChange($event)"
      />
    </div>
  `
})
export class PaymentHistoryComponent implements OnInit {
  private billingService = inject(BillingService);

  loading = signal(true);
  payments = signal<Payment[]>([]);
  totalElements = signal(0);
  stats = signal({ totalProcessed: 0, successful: 0, failed: 0, pending: 0 });
  hasError = signal(false);
  errorMessage = signal('');

  page = 0;
  size = 20;
  selectedStatus = '';

  columns: TableColumn[] = [
    { key: 'tenant', label: 'Tenant' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
    { key: 'method', label: 'Method' },
    { key: 'date', label: 'Date' },
    { key: 'actions', label: '' }
  ];

  statusOptions: SelectOption[] = [
    { label: 'All Statuses', value: '' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Failed', value: 'FAILED' },
    { label: 'Refunded', value: 'REFUNDED' }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.hasError.set(false);
    this.billingService.getPayments(this.page, this.size, this.selectedStatus || undefined).subscribe({
      next: (response) => {
        this.payments.set(response.content);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
        this.calculateStats();
      },
      error: () => {
        this.loading.set(false);
        this.hasError.set(true);
        this.errorMessage.set('Failed to load payments. Please try again.');
      }
    });
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadData();
  }

  retryPayment(paymentId: string): void {
    this.billingService.retryPayment(paymentId).subscribe({
      next: () => this.loadData()
    });
  }

  getStatusColor(status: PaymentStatus): BadgeColor {
    const colors: Record<PaymentStatus, BadgeColor> = {
      COMPLETED: 'success',
      PENDING: 'warning',
      FAILED: 'error',
      REFUNDED: 'outline'
    };
    return colors[status] || 'gray';
  }

  private calculateStats(): void {
    const payments = this.payments();
    this.stats.set({
      totalProcessed: payments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0),
      successful: payments.filter(p => p.status === 'COMPLETED').length,
      failed: payments.filter(p => p.status === 'FAILED').length,
      pending: payments.filter(p => p.status === 'PENDING').length
    });
  }

  retryLoad(): void {
    this.loadData();
  }
}
