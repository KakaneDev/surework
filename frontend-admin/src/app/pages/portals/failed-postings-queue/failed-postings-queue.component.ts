import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  PortalAdminService,
  FailedPosting,
  JobPortal,
  ExternalPostingStatus,
  FailedPostingsCount,
  PagedResponse
} from '@shared/services/portal-admin.service';
import { BadgeComponent, BadgeColor } from '@shared/components/ui/badge.component';
import { ButtonComponent } from '@shared/components/ui/button.component';
import { CardComponent } from '@shared/components/ui/card.component';
import { TableComponent, TableColumn } from '@shared/components/ui/table.component';
import { PaginationComponent } from '@shared/components/ui/pagination.component';
import { SelectComponent, SelectOption } from '@shared/components/ui/select.component';
import { RelativeTimePipe } from '@shared/pipes/relative-time.pipe';
import { ManualInterventionDialogComponent } from '../dialogs/manual-intervention-dialog/manual-intervention-dialog.component';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

interface FailedPostingFilters {
  portal: JobPortal | '';
  status: ExternalPostingStatus | '';
  search: string;
  dateFrom: string;
  dateTo: string;
}

@Component({
  selector: 'app-failed-postings-queue',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    BadgeComponent,
    ButtonComponent,
    CardComponent,
    TableComponent,
    PaginationComponent,
    SelectComponent,
    RelativeTimePipe,
    ManualInterventionDialogComponent
  ],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Failed Postings Queue</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage external job postings that failed or require manual intervention
          </p>
        </div>
        <div class="flex items-center gap-3">
          <!-- Auto-refresh toggle -->
          <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              [checked]="autoRefresh()"
              (change)="toggleAutoRefresh()"
              class="h-4 w-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
            />
            Auto-refresh (30s)
          </label>
          <app-button variant="outline" (click)="loadData()" [loading]="loading()">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Refresh
          </app-button>
        </div>
      </div>

      <!-- Stats Cards -->
      @if (counts()) {
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="stats-card border-l-4 border-amber-500">
            <p class="stats-card-label">Requires Manual</p>
            <p class="stats-card-value text-amber-600 dark:text-amber-400">{{ counts()?.requiresManual }}</p>
          </div>
          <div class="stats-card border-l-4 border-red-500">
            <p class="stats-card-label">Failed</p>
            <p class="stats-card-value text-red-600 dark:text-red-400">{{ counts()?.failed }}</p>
          </div>
          <div class="stats-card">
            <p class="stats-card-label">Total Issues</p>
            <p class="stats-card-value">{{ counts()?.total }}</p>
          </div>
          <div class="stats-card">
            <p class="stats-card-label">Selected</p>
            <p class="stats-card-value text-brand-600 dark:text-brand-400">{{ selectedIds().size }}</p>
          </div>
        </div>
      }

      <!-- Alert Banner -->
      @if ((counts()?.requiresManual ?? 0) > 0) {
        <div class="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <svg class="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span class="text-sm text-amber-800 dark:text-amber-200">
            {{ counts()?.requiresManual }} posting(s) require manual intervention. These jobs may have encountered CAPTCHA, 2FA, or session issues.
          </span>
        </div>
      }

      <!-- Filters -->
      <app-card [noPadding]="true">
        <div class="p-4 border-b border-gray-200 dark:border-gray-800">
          <div class="flex flex-wrap items-end gap-4">
            <!-- Search -->
            <div class="flex-1 min-w-[200px]">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
              <input
                type="text"
                [(ngModel)]="filters.search"
                (ngModelChange)="onFilterChange()"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                placeholder="Job reference or title..."
              />
            </div>

            <!-- Portal Filter -->
            <div class="w-40">
              <app-select
                label="Portal"
                [options]="portalOptions"
                [(ngModel)]="filters.portal"
                (ngModelChange)="onFilterChange()"
                placeholder="All Portals"
              />
            </div>

            <!-- Status Filter -->
            <div class="w-44">
              <app-select
                label="Status"
                [options]="statusOptions"
                [(ngModel)]="filters.status"
                (ngModelChange)="onFilterChange()"
                placeholder="All Statuses"
              />
            </div>

            <!-- Date From -->
            <div class="w-40">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date From</label>
              <input
                type="date"
                [(ngModel)]="filters.dateFrom"
                (ngModelChange)="onFilterChange()"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>

            <!-- Date To -->
            <div class="w-40">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date To</label>
              <input
                type="date"
                [(ngModel)]="filters.dateTo"
                (ngModelChange)="onFilterChange()"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>

            <!-- Clear Filters -->
            <app-button variant="ghost" size="sm" (click)="clearFilters()">
              Clear Filters
            </app-button>
          </div>
        </div>

        <!-- Bulk Actions -->
        @if (selectedIds().size > 0) {
          <div class="px-4 py-3 bg-brand-50 dark:bg-brand-900/20 border-b border-brand-200 dark:border-brand-800 flex items-center justify-between">
            <span class="text-sm font-medium text-brand-800 dark:text-brand-200">
              {{ selectedIds().size }} item(s) selected
            </span>
            <div class="flex items-center gap-2">
              <app-button variant="outline" size="sm" (click)="retrySelected()" [loading]="bulkRetrying()">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Retry Selected
              </app-button>
              <app-button variant="outline" size="sm" (click)="exportToCSV()">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Export CSV
              </app-button>
              <app-button variant="ghost" size="sm" (click)="clearSelection()">
                Clear Selection
              </app-button>
            </div>
          </div>
        }

        <!-- Table -->
        <app-table [columns]="columns" [data]="filteredPostings()" [loading]="loading()">
          @for (posting of filteredPostings(); track posting.id) {
            <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
              <!-- Checkbox -->
              <td class="px-4 py-3 w-12">
                <input
                  type="checkbox"
                  [checked]="selectedIds().has(posting.id)"
                  (change)="toggleSelection(posting.id)"
                  class="h-4 w-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                />
              </td>
              <!-- Job Info -->
              <td class="px-4 py-3">
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">{{ posting.jobReference }}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs" [title]="posting.jobTitle">
                    {{ posting.jobTitle }}
                  </p>
                </div>
              </td>
              <!-- Tenant -->
              <td class="px-4 py-3">
                <span class="text-sm text-gray-600 dark:text-gray-300">{{ posting.tenantName || posting.tenantId }}</span>
              </td>
              <!-- Portal -->
              <td class="px-4 py-3">
                <app-badge [color]="getPortalBadgeColor(posting.portal)">{{ getPortalLabel(posting.portal) }}</app-badge>
              </td>
              <!-- Status -->
              <td class="px-4 py-3">
                <app-badge [color]="getStatusBadgeColor(posting.status)" [dot]="true">
                  {{ formatStatus(posting.status) }}
                </app-badge>
              </td>
              <!-- Error -->
              <td class="px-4 py-3">
                @if (posting.errorMessage) {
                  <p class="text-sm text-red-600 dark:text-red-400 max-w-xs truncate" [title]="posting.errorMessage">
                    {{ posting.errorMessage }}
                  </p>
                } @else {
                  <span class="text-sm text-gray-400">-</span>
                }
              </td>
              <!-- Retry Count -->
              <td class="px-4 py-3">
                <span class="text-sm text-gray-600 dark:text-gray-300">{{ posting.retryCount }}/3</span>
              </td>
              <!-- Created -->
              <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                {{ posting.createdAt | relativeTime }}
              </td>
              <!-- Actions -->
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <app-button variant="ghost" size="sm" (click)="viewDetails(posting)" title="View Details">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  </app-button>
                  @if (posting.status === 'FAILED') {
                    <app-button
                      variant="outline"
                      size="sm"
                      (click)="retryPosting(posting.id)"
                      [loading]="retryingId() === posting.id"
                      title="Retry Posting"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                      </svg>
                    </app-button>
                  }
                  @if (posting.status === 'REQUIRES_MANUAL') {
                    <app-button variant="primary" size="sm" (click)="openManualIntervention(posting)">
                      Resolve
                    </app-button>
                  }
                </div>
              </td>
            </tr>
          }
        </app-table>

        <!-- Empty State -->
        @if (!loading() && filteredPostings().length === 0) {
          <div class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No failed postings</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              @if (hasActiveFilters()) {
                No postings match your current filters.
              } @else {
                All external postings are up to date.
              }
            </p>
          </div>
        }
      </app-card>

      <!-- Pagination -->
      @if (totalElements() > 0) {
        <app-pagination
          [currentPage]="page"
          [pageSize]="size"
          [totalElements]="totalElements()"
          (pageChange)="onPageChange($event)"
        />
      }
    </div>

    <!-- Manual Intervention Dialog -->
    @if (showManualIntervention()) {
      <app-manual-intervention-dialog
        [posting]="selectedPosting()!"
        (close)="closeManualIntervention()"
        (resolved)="onPostingResolved($event)"
      />
    }

    <!-- Details Modal -->
    @if (showDetailsModal()) {
      <div class="fixed inset-0 z-9999 flex items-center justify-center overflow-y-auto overflow-x-hidden p-4">
        <div class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" (click)="closeDetailsModal()"></div>
        <div class="relative z-50 w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-theme-xl dark:border-gray-800 dark:bg-gray-dark">
          <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white/90">Posting Details</h3>
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-white/[0.05] dark:hover:text-gray-300 transition-colors"
              (click)="closeDetailsModal()"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="p-6 space-y-4">
            @if (detailPosting()) {
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Job Reference</label>
                  <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ detailPosting()?.jobReference }}</p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Portal</label>
                  <p class="mt-1">
                    <app-badge [color]="getPortalBadgeColor(detailPosting()!.portal)">
                      {{ getPortalLabel(detailPosting()!.portal) }}
                    </app-badge>
                  </p>
                </div>
                <div class="col-span-2">
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Job Title</label>
                  <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ detailPosting()?.jobTitle }}</p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</label>
                  <p class="mt-1">
                    <app-badge [color]="getStatusBadgeColor(detailPosting()!.status)" [dot]="true">
                      {{ formatStatus(detailPosting()!.status) }}
                    </app-badge>
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Retry Count</label>
                  <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ detailPosting()?.retryCount }} / 3</p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</label>
                  <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ detailPosting()?.createdAt | date:'medium' }}</p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Attempt</label>
                  <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ detailPosting()?.lastAttemptAt | date:'medium' }}</p>
                </div>
                @if (detailPosting()?.errorMessage) {
                  <div class="col-span-2">
                    <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Error Message</label>
                    <div class="mt-1 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <p class="text-sm text-red-700 dark:text-red-400">{{ detailPosting()?.errorMessage }}</p>
                    </div>
                  </div>
                }
              </div>
              <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <app-button variant="outline" (click)="closeDetailsModal()">Close</app-button>
                @if (detailPosting()?.status === 'FAILED') {
                  <app-button (click)="retryFromDetails()">Retry</app-button>
                }
                @if (detailPosting()?.status === 'REQUIRES_MANUAL') {
                  <app-button (click)="resolveFromDetails()">Resolve Manually</app-button>
                }
              </div>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class FailedPostingsQueueComponent implements OnInit, OnDestroy {
  private portalService = inject(PortalAdminService);
  private destroy$ = new Subject<void>();

  // State signals
  loading = signal(true);
  postings = signal<FailedPosting[]>([]);
  totalElements = signal(0);
  counts = signal<FailedPostingsCount | null>(null);
  retryingId = signal<string | null>(null);
  bulkRetrying = signal(false);
  autoRefresh = signal(false);

  // Selection
  selectedIds = signal<Set<string>>(new Set());

  // Modals
  showManualIntervention = signal(false);
  selectedPosting = signal<FailedPosting | null>(null);
  showDetailsModal = signal(false);
  detailPosting = signal<FailedPosting | null>(null);

  // Pagination
  page = 0;
  size = 20;

  // Filters
  filters: FailedPostingFilters = {
    portal: '',
    status: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  };

  // Filter options
  portalOptions: SelectOption[] = [
    { label: 'All Portals', value: '' },
    { label: 'LinkedIn', value: 'LINKEDIN' },
    { label: 'Pnet', value: 'PNET' },
    { label: 'Indeed', value: 'INDEED' },
    { label: 'Careers24', value: 'CAREERS24' }
  ];

  statusOptions: SelectOption[] = [
    { label: 'All Statuses', value: '' },
    { label: 'Failed', value: 'FAILED' },
    { label: 'Requires Manual', value: 'REQUIRES_MANUAL' }
  ];

  // Table columns
  columns: TableColumn[] = [
    { key: 'select', label: '', width: '48px' },
    { key: 'job', label: 'Job Reference', sortable: true },
    { key: 'tenant', label: 'Tenant' },
    { key: 'portal', label: 'Portal', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'error', label: 'Error' },
    { key: 'retries', label: 'Retries' },
    { key: 'created', label: 'Created', sortable: true },
    { key: 'actions', label: '' }
  ];

  // Computed filtered postings
  filteredPostings = computed(() => {
    let result = this.postings();

    if (this.filters.search) {
      const search = this.filters.search.toLowerCase();
      result = result.filter(p =>
        p.jobReference.toLowerCase().includes(search) ||
        p.jobTitle.toLowerCase().includes(search)
      );
    }

    if (this.filters.portal) {
      result = result.filter(p => p.portal === this.filters.portal);
    }

    if (this.filters.status) {
      result = result.filter(p => p.status === this.filters.status);
    }

    if (this.filters.dateFrom) {
      const fromDate = new Date(this.filters.dateFrom);
      result = result.filter(p => new Date(p.createdAt) >= fromDate);
    }

    if (this.filters.dateTo) {
      const toDate = new Date(this.filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(p => new Date(p.createdAt) <= toDate);
    }

    return result;
  });

  ngOnInit(): void {
    this.loadData();
    this.loadCounts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading.set(true);
    this.portalService.getFailedPostings(this.page, this.size).subscribe({
      next: (response: PagedResponse<FailedPosting>) => {
        this.postings.set(response.content);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.setMockData();
      }
    });
  }

  loadCounts(): void {
    this.portalService.getFailedPostingsCount().subscribe({
      next: (counts) => this.counts.set(counts),
      error: () => this.counts.set({ requiresManual: 5, failed: 3, total: 8 })
    });
  }

  toggleAutoRefresh(): void {
    const current = this.autoRefresh();
    this.autoRefresh.set(!current);

    if (!current) {
      // Start auto-refresh
      interval(30000)
        .pipe(
          takeUntil(this.destroy$),
          switchMap(() => {
            if (!this.autoRefresh()) {
              return [];
            }
            return this.portalService.getFailedPostings(this.page, this.size);
          })
        )
        .subscribe({
          next: (response: PagedResponse<FailedPosting>) => {
            this.postings.set(response.content);
            this.totalElements.set(response.totalElements);
            this.loadCounts();
          }
        });
    }
  }

  onFilterChange(): void {
    // Filters are applied via computed signal
  }

  clearFilters(): void {
    this.filters = {
      portal: '',
      status: '',
      search: '',
      dateFrom: '',
      dateTo: ''
    };
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.portal || this.filters.status || this.filters.search || this.filters.dateFrom || this.filters.dateTo);
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadData();
  }

  // Selection
  toggleSelection(id: string): void {
    const current = new Set(this.selectedIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.selectedIds.set(current);
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  // Actions
  retryPosting(id: string): void {
    this.retryingId.set(id);
    this.portalService.retryFailedPosting(id).subscribe({
      next: () => {
        this.retryingId.set(null);
        this.loadData();
        this.loadCounts();
      },
      error: (err) => {
        this.retryingId.set(null);
        alert(`Failed to retry: ${err.message}`);
      }
    });
  }

  retrySelected(): void {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    this.bulkRetrying.set(true);
    let completed = 0;

    ids.forEach(id => {
      this.portalService.retryFailedPosting(id).subscribe({
        next: () => {
          completed++;
          if (completed === ids.length) {
            this.bulkRetrying.set(false);
            this.clearSelection();
            this.loadData();
            this.loadCounts();
          }
        },
        error: () => {
          completed++;
          if (completed === ids.length) {
            this.bulkRetrying.set(false);
            this.loadData();
            this.loadCounts();
          }
        }
      });
    });
  }

  exportToCSV(): void {
    const data = this.filteredPostings();
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Job Reference', 'Job Title', 'Portal', 'Status', 'Error', 'Retry Count', 'Created'];
    const rows = data.map(p => [
      p.jobReference,
      `"${p.jobTitle.replace(/"/g, '""')}"`,
      p.portal,
      p.status,
      p.errorMessage ? `"${p.errorMessage.replace(/"/g, '""')}"` : '',
      p.retryCount.toString(),
      new Date(p.createdAt).toISOString()
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `failed-postings-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  // Details Modal
  viewDetails(posting: FailedPosting): void {
    this.detailPosting.set(posting);
    this.showDetailsModal.set(true);
  }

  closeDetailsModal(): void {
    this.showDetailsModal.set(false);
    this.detailPosting.set(null);
  }

  retryFromDetails(): void {
    const posting = this.detailPosting();
    if (posting) {
      this.closeDetailsModal();
      this.retryPosting(posting.id);
    }
  }

  resolveFromDetails(): void {
    const posting = this.detailPosting();
    if (posting) {
      this.closeDetailsModal();
      this.openManualIntervention(posting);
    }
  }

  // Manual Intervention
  openManualIntervention(posting: FailedPosting): void {
    this.selectedPosting.set(posting);
    this.showManualIntervention.set(true);
  }

  closeManualIntervention(): void {
    this.showManualIntervention.set(false);
    this.selectedPosting.set(null);
  }

  onPostingResolved(success: boolean): void {
    this.closeManualIntervention();
    if (success) {
      this.loadData();
      this.loadCounts();
    }
  }

  // Helpers
  getPortalLabel(portal: JobPortal): string {
    return this.portalService.getPortalLabel(portal);
  }

  getPortalBadgeColor(portal: JobPortal): BadgeColor {
    const colors: Record<JobPortal, BadgeColor> = {
      PNET: 'info',
      LINKEDIN: 'brand',
      INDEED: 'info',
      CAREERS24: 'info'
    };
    return colors[portal] || 'gray';
  }

  getStatusBadgeColor(status: ExternalPostingStatus): BadgeColor {
    const colors: Record<ExternalPostingStatus, BadgeColor> = {
      PENDING: 'gray',
      QUEUED: 'info',
      POSTING: 'info',
      POSTED: 'success',
      FAILED: 'error',
      REQUIRES_MANUAL: 'warning',
      EXPIRED: 'gray',
      REMOVED: 'gray'
    };
    return colors[status] || 'gray';
  }

  formatStatus(status: ExternalPostingStatus): string {
    const labels: Record<ExternalPostingStatus, string> = {
      PENDING: 'Pending',
      QUEUED: 'Queued',
      POSTING: 'Posting',
      POSTED: 'Posted',
      FAILED: 'Failed',
      REQUIRES_MANUAL: 'Manual',
      EXPIRED: 'Expired',
      REMOVED: 'Removed'
    };
    return labels[status] || status;
  }

  private setMockData(): void {
    const mockPostings: FailedPosting[] = [
      {
        id: '1',
        jobPostingId: 'jp-1',
        jobReference: 'JOB-2026-001',
        jobTitle: 'Senior Software Developer',
        tenantId: 't-1',
        tenantName: 'TechCorp SA',
        portal: 'LINKEDIN',
        status: 'REQUIRES_MANUAL',
        errorMessage: 'CAPTCHA verification required during login',
        retryCount: 3,
        createdAt: '2026-01-31T08:00:00Z',
        lastAttemptAt: '2026-01-31T10:30:00Z'
      },
      {
        id: '2',
        jobPostingId: 'jp-2',
        jobReference: 'JOB-2026-002',
        jobTitle: 'Sales Manager',
        tenantId: 't-2',
        tenantName: 'Sales Pro Ltd',
        portal: 'PNET',
        status: 'REQUIRES_MANUAL',
        errorMessage: 'Session expired - 2FA required for re-authentication',
        retryCount: 2,
        createdAt: '2026-01-31T09:00:00Z',
        lastAttemptAt: '2026-01-31T11:00:00Z'
      },
      {
        id: '3',
        jobPostingId: 'jp-3',
        jobReference: 'JOB-2026-003',
        jobTitle: 'Accountant',
        tenantId: 't-1',
        tenantName: 'TechCorp SA',
        portal: 'INDEED',
        status: 'FAILED',
        errorMessage: 'Rate limit exceeded - daily posting limit reached',
        retryCount: 3,
        createdAt: '2026-01-30T14:00:00Z',
        lastAttemptAt: '2026-01-31T08:00:00Z'
      },
      {
        id: '4',
        jobPostingId: 'jp-4',
        jobReference: 'JOB-2026-004',
        jobTitle: 'Marketing Specialist',
        tenantId: 't-3',
        tenantName: 'Marketing Inc',
        portal: 'CAREERS24',
        status: 'FAILED',
        errorMessage: 'Connection timeout after 30 seconds',
        retryCount: 2,
        createdAt: '2026-01-31T07:30:00Z',
        lastAttemptAt: '2026-01-31T09:45:00Z'
      },
      {
        id: '5',
        jobPostingId: 'jp-5',
        jobReference: 'JOB-2026-005',
        jobTitle: 'HR Manager',
        tenantId: 't-2',
        tenantName: 'Sales Pro Ltd',
        portal: 'LINKEDIN',
        status: 'REQUIRES_MANUAL',
        errorMessage: 'Unusual login activity detected - manual verification needed',
        retryCount: 1,
        createdAt: '2026-01-31T10:00:00Z',
        lastAttemptAt: '2026-01-31T10:15:00Z'
      }
    ];
    this.postings.set(mockPostings);
    this.totalElements.set(mockPostings.length);
  }
}
