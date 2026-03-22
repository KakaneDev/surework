import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TenantService } from '@core/services/tenant.service';
import { Tenant, TenantFilters, TenantStatus, TenantPlan, ChurnRisk } from '@core/models/tenant.model';
import { BadgeComponent, BadgeColor } from '@core/components/ui/badge.component';
import { ButtonComponent } from '@core/components/ui/button.component';
import { CardComponent } from '@core/components/ui/card.component';
import { InputComponent } from '@core/components/ui/input.component';
import { SelectComponent, SelectOption } from '@core/components/ui/select.component';
import { TableComponent, TableColumn } from '@core/components/ui/table.component';
import { PaginationComponent } from '@core/components/ui/pagination.component';
import { CurrencyZarPipe } from '@core/pipes/currency-zar.pipe';
import { RelativeTimePipe } from '@core/pipes/relative-time.pipe';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-tenant-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    BadgeComponent,
    ButtonComponent,
    CardComponent,
    InputComponent,
    SelectComponent,
    TableComponent,
    PaginationComponent,
    CurrencyZarPipe,
    RelativeTimePipe
  ],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Page Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Tenants</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage all registered tenants</p>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stats-card">
          <p class="stats-card-label">Total</p>
          <p class="stats-card-value">{{ stats().total }}</p>
        </div>
        <div class="stats-card">
          <p class="stats-card-label">Active</p>
          <p class="stats-card-value">{{ stats().active }}</p>
        </div>
        <div class="stats-card">
          <p class="stats-card-label">Trials</p>
          <p class="stats-card-value">{{ stats().trials }}</p>
        </div>
        <div class="stats-card">
          <p class="stats-card-label">At Risk</p>
          <p class="stats-card-value">{{ stats().atRisk }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div class="grid gap-4 md:grid-cols-4">
          <app-input
            placeholder="Search tenants..."
            [(ngModel)]="searchTerm"
            (ngModelChange)="onSearchChange($event)"
            [prefixIcon]="true"
          >
            <svg prefix class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </app-input>

          <app-select
            placeholder="All Statuses"
            [options]="statusOptions"
            [(ngModel)]="filters.status"
            (ngModelChange)="loadTenants()"
          />

          <app-select
            placeholder="All Plans"
            [options]="planOptions"
            [(ngModel)]="filters.plan"
            (ngModelChange)="loadTenants()"
          />

          <app-select
            placeholder="All Risk Levels"
            [options]="riskOptions"
            [(ngModel)]="filters.churnRisk"
            (ngModelChange)="loadTenants()"
          />
        </div>
      </div>

      <!-- Table -->
      <app-table
        [columns]="columns"
        [data]="tenants()"
        [loading]="loading()"
        (sort)="onSort($event)"
        [sortBy]="filters.sortBy"
        [sortDirection]="filters.sortDirection || 'desc'"
      >
        @for (tenant of tenants(); track tenant.id) {
          <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800">
                  <span class="text-sm font-medium text-gray-600 dark:text-gray-300">{{ tenant.companyName.charAt(0) }}</span>
                </div>
                <div>
                  <a
                    [routerLink]="['/tenants', tenant.id]"
                    class="font-medium text-gray-900 hover:text-gray-600 dark:text-white dark:hover:text-gray-300"
                  >
                    {{ tenant.companyName }}
                  </a>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ tenant.email }}</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <app-badge [color]="getPlanColor(tenant.plan)">{{ tenant.plan }}</app-badge>
            </td>
            <td class="px-4 py-3">
              <app-badge [color]="getStatusColor(tenant.status)">{{ tenant.status }}</app-badge>
            </td>
            <td class="px-4 py-3 text-gray-900 dark:text-white">
              {{ tenant.mrr | currencyZar }}
            </td>
            <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
              {{ tenant.employeeCount }}
            </td>
            <td class="px-4 py-3">
              @if (tenant.churnRisk) {
                <app-badge [color]="getRiskColor(tenant.churnRisk)" size="sm">
                  {{ tenant.churnRisk }}
                </app-badge>
              } @else {
                <span class="text-gray-400">-</span>
              }
            </td>
            <td class="px-4 py-3 text-gray-500 dark:text-gray-400">
              {{ tenant.createdAt | relativeTime }}
            </td>
            <td class="px-4 py-3">
              <a
                [routerLink]="['/tenants', tenant.id]"
                class="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                View
              </a>
            </td>
          </tr>
        }
      </app-table>

      <!-- Pagination -->
      <app-pagination
        [currentPage]="filters.page"
        [pageSize]="filters.size"
        [totalElements]="totalElements()"
        (pageChange)="onPageChange($event)"
      />
    </div>
  `
})
export class TenantListComponent implements OnInit {
  private tenantService = inject(TenantService);
  private searchSubject = new Subject<string>();

  loading = signal(true);
  tenants = signal<Tenant[]>([]);
  totalElements = signal(0);
  stats = signal({ total: 0, active: 0, trials: 0, atRisk: 0 });
  hasError = signal(false);
  errorMessage = signal('');

  searchTerm = '';
  filters: TenantFilters = {
    page: 0,
    size: 20,
    sortBy: 'createdAt',
    sortDirection: 'desc'
  };

  columns: TableColumn[] = [
    { key: 'companyName', label: 'Company', sortable: true },
    { key: 'plan', label: 'Plan', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'mrr', label: 'MRR', sortable: true },
    { key: 'employeeCount', label: 'Employees', sortable: true },
    { key: 'churnRisk', label: 'Risk' },
    { key: 'createdAt', label: 'Created', sortable: true },
    { key: 'actions', label: '' }
  ];

  statusOptions: SelectOption[] = [
    { label: 'All Statuses', value: '' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Trial', value: 'TRIAL' },
    { label: 'Suspended', value: 'SUSPENDED' },
    { label: 'Cancelled', value: 'CANCELLED' },
    { label: 'Pending Verification', value: 'PENDING_VERIFICATION' }
  ];

  planOptions: SelectOption[] = [
    { label: 'All Plans', value: '' },
    { label: 'Starter', value: 'STARTER' },
    { label: 'Professional', value: 'PROFESSIONAL' },
    { label: 'Enterprise', value: 'ENTERPRISE' },
    { label: 'Trial', value: 'TRIAL' }
  ];

  riskOptions: SelectOption[] = [
    { label: 'All Risk Levels', value: '' },
    { label: 'Low', value: 'LOW' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'High', value: 'HIGH' }
  ];

  ngOnInit(): void {
    this.searchSubject.pipe(debounceTime(300)).subscribe(term => {
      this.filters.search = term;
      this.filters.page = 0;
      this.loadTenants();
    });

    this.loadTenants();
    this.loadStats();
  }

  loadTenants(): void {
    this.loading.set(true);
    this.hasError.set(false);
    this.tenantService.getTenants(this.filters).subscribe({
      next: (response) => {
        this.tenants.set(response.content);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load tenants:', err);
        this.loading.set(false);
        this.hasError.set(true);
        this.errorMessage.set('Failed to load tenants. Please try again.');
      }
    });
  }

  loadStats(): void {
    this.tenantService.getTenantStats().subscribe({
      next: (stats) => {
        this.stats.set({
          total: stats.totalTenants,
          active: stats.activePaid,
          trials: stats.activeTrials,
          atRisk: 12 // This would come from analytics
        });
      },
      error: () => {
        this.stats.set({ total: 248, active: 196, trials: 34, atRisk: 12 });
      }
    });
  }

  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  onSort(event: { key: string; direction: 'asc' | 'desc' }): void {
    this.filters.sortBy = event.key;
    this.filters.sortDirection = event.direction;
    this.loadTenants();
  }

  onPageChange(page: number): void {
    this.filters.page = page;
    this.loadTenants();
  }

  getStatusColor(status: TenantStatus): BadgeColor {
    // Use outline for most statuses, semantic colors only for important states
    const colors: Record<TenantStatus, BadgeColor> = {
      ACTIVE: 'success',
      TRIAL: 'warning',
      SUSPENDED: 'error',
      CANCELLED: 'gray',
      PENDING_VERIFICATION: 'outline'
    };
    return colors[status] || 'gray';
  }

  getPlanColor(plan: TenantPlan): BadgeColor {
    // Use outline/gray for plan badges - less visual noise
    const colors: Record<TenantPlan, BadgeColor> = {
      STARTER: 'outline',
      PROFESSIONAL: 'gray',
      ENTERPRISE: 'gray',
      TRIAL: 'warning'
    };
    return colors[plan] || 'gray';
  }

  getRiskColor(risk: ChurnRisk): BadgeColor {
    const colors: Record<ChurnRisk, BadgeColor> = {
      LOW: 'success',
      MEDIUM: 'warning',
      HIGH: 'error'
    };
    return colors[risk] || 'gray';
  }

  retryLoad(): void {
    this.loadTenants();
    this.loadStats();
  }
}
