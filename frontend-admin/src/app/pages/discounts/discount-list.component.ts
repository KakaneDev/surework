import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BillingService } from '@core/services/billing.service';
import { Discount, DiscountStatus, DiscountType } from '@core/models/billing.model';
import { BadgeComponent, BadgeColor } from '@core/components/ui/badge.component';
import { ButtonComponent } from '@core/components/ui/button.component';
import { TableComponent, TableColumn } from '@core/components/ui/table.component';
import { PaginationComponent } from '@core/components/ui/pagination.component';
import { CurrencyZarPipe } from '@core/pipes/currency-zar.pipe';
import { RelativeTimePipe } from '@core/pipes/relative-time.pipe';

@Component({
  selector: 'app-discount-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BadgeComponent,
    ButtonComponent,
    TableComponent,
    PaginationComponent,
    CurrencyZarPipe,
    RelativeTimePipe
  ],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Discount Codes</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage promotional discount codes</p>
        </div>
        <app-button routerLink="/discounts/create">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Create Discount
        </app-button>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stats-card">
          <p class="stats-card-label">Total Discounts</p>
          <p class="stats-card-value">{{ discounts().length }}</p>
        </div>
        <div class="stats-card">
          <p class="stats-card-label">Active</p>
          <p class="stats-card-value">{{ activeCount }}</p>
        </div>
        <div class="stats-card">
          <p class="stats-card-label">Total Uses</p>
          <p class="stats-card-value">{{ totalUses }}</p>
        </div>
        <div class="stats-card">
          <p class="stats-card-label">Expired</p>
          <p class="stats-card-value">{{ expiredCount }}</p>
        </div>
      </div>

      <!-- Table -->
      <div>
        <app-table [columns]="columns" [data]="discounts()" [loading]="loading()">
          @for (discount of discounts(); track discount.id) {
            <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
              <td class="px-4 py-3">
                <span class="font-mono font-medium text-gray-900 dark:text-white">{{ discount.code }}</span>
              </td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
                @if (discount.type === 'PERCENTAGE') {
                  {{ discount.value }}% off
                } @else {
                  {{ discount.value | currencyZar }} off
                }
              </td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
                {{ discount.durationMonths ? discount.durationMonths + ' months' : 'Forever' }}
              </td>
              <td class="px-4 py-3">
                <app-badge [color]="getStatusColor(discount.status)">{{ discount.status }}</app-badge>
              </td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
                {{ discount.currentUses }}{{ discount.maxUses ? '/' + discount.maxUses : '' }}
              </td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400">
                {{ discount.validUntil ? (discount.validUntil | relativeTime) : 'No expiry' }}
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-3">
                  <a
                    [routerLink]="['/discounts', discount.id, 'edit']"
                    class="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    Edit
                  </a>
                  @if (discount.status === 'ACTIVE') {
                    <button
                      class="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                      (click)="disableDiscount(discount.id)"
                    >
                      Disable
                    </button>
                  }
                </div>
              </td>
            </tr>
          }
        </app-table>
      </div>

      <!-- Pagination -->
      <div>
        <app-pagination
          [currentPage]="page"
          [pageSize]="size"
          [totalElements]="totalElements()"
          (pageChange)="onPageChange($event)"
        />
      </div>
    </div>
  `
})
export class DiscountListComponent implements OnInit {
  private billingService = inject(BillingService);

  loading = signal(true);
  discounts = signal<Discount[]>([]);
  totalElements = signal(0);

  page = 0;
  size = 20;

  columns: TableColumn[] = [
    { key: 'code', label: 'Code' },
    { key: 'value', label: 'Discount' },
    { key: 'duration', label: 'Duration' },
    { key: 'status', label: 'Status' },
    { key: 'uses', label: 'Uses' },
    { key: 'expiry', label: 'Expires' },
    { key: 'actions', label: '' }
  ];

  get activeCount(): number {
    return this.discounts().filter(d => d.status === 'ACTIVE').length;
  }

  get expiredCount(): number {
    return this.discounts().filter(d => d.status === 'EXPIRED' || d.status === 'EXHAUSTED').length;
  }

  get totalUses(): number {
    return this.discounts().reduce((sum, d) => sum + d.currentUses, 0);
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.billingService.getDiscounts(this.page, this.size).subscribe({
      next: (response) => {
        this.discounts.set(response.content);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.setMockData();
      }
    });
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadData();
  }

  disableDiscount(id: string): void {
    if (confirm('Are you sure you want to disable this discount?')) {
      this.billingService.disableDiscount(id).subscribe({
        next: () => this.loadData()
      });
    }
  }

  getStatusColor(status: DiscountStatus): BadgeColor {
    // Use muted colors - outline for most, semantic only when important
    const colors: Record<DiscountStatus, BadgeColor> = {
      ACTIVE: 'success',
      EXPIRED: 'gray',
      EXHAUSTED: 'outline',
      DISABLED: 'gray'
    };
    return colors[status] || 'gray';
  }

  private setMockData(): void {
    this.discounts.set([
      { id: '1', code: 'WELCOME20', type: 'PERCENTAGE', value: 20, durationMonths: 3, validFrom: '2024-01-01', validUntil: '2024-12-31', maxUses: 100, currentUses: 45, status: 'ACTIVE', createdBy: 'admin', createdAt: '2024-01-01' },
      { id: '2', code: 'ANNUAL50', type: 'PERCENTAGE', value: 50, durationMonths: 12, validFrom: '2024-01-01', validUntil: '2024-06-30', currentUses: 12, status: 'ACTIVE', createdBy: 'admin', createdAt: '2024-01-01' },
      { id: '3', code: 'FLAT500', type: 'FIXED_AMOUNT', value: 500, durationMonths: 1, validFrom: '2024-01-01', validUntil: '2024-03-31', maxUses: 50, currentUses: 50, status: 'EXHAUSTED', createdBy: 'admin', createdAt: '2024-01-01' }
    ]);
    this.totalElements.set(3);
  }
}
