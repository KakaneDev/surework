import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  PortalAdminService,
  ExternalPosting,
  JobPortal,
  ExternalPostingStatus,
  PagedResponse
} from '@shared/services/portal-admin.service';
import { BadgeComponent, BadgeColor } from '@shared/components/ui/badge.component';
import { ButtonComponent } from '@shared/components/ui/button.component';
import { CardComponent } from '@shared/components/ui/card.component';
import { TableComponent, TableColumn } from '@shared/components/ui/table.component';
import { PaginationComponent } from '@shared/components/ui/pagination.component';
import { SelectComponent, SelectOption } from '@shared/components/ui/select.component';
import { RelativeTimePipe } from '@shared/pipes/relative-time.pipe';
import { environment } from '@env/environment';

@Component({
  selector: 'app-posting-queue',
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
    RelativeTimePipe
  ],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Portal Posting Queue</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            All external job postings across portals with their current status
          </p>
        </div>
        <app-button variant="outline" (click)="loadData()" [loading]="loading()">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Refresh
        </app-button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="stats-card">
          <p class="stats-card-label">Total Postings</p>
          <p class="stats-card-value">{{ totalElements() }}</p>
        </div>
        <div class="stats-card border-l-4 border-green-500">
          <p class="stats-card-label">Posted</p>
          <p class="stats-card-value text-green-600 dark:text-green-400">{{ statusCounts().posted }}</p>
        </div>
        <div class="stats-card border-l-4 border-gray-400">
          <p class="stats-card-label">Pending / Queued</p>
          <p class="stats-card-value text-gray-600 dark:text-gray-400">{{ statusCounts().pending }}</p>
        </div>
        <div class="stats-card border-l-4 border-red-500">
          <p class="stats-card-label">Failed</p>
          <p class="stats-card-value text-red-600 dark:text-red-400">{{ statusCounts().failed }}</p>
        </div>
      </div>

      <!-- Filters + Table -->
      <app-card [noPadding]="true">
        <div class="p-4 border-b border-gray-200 dark:border-gray-800">
          <div class="flex flex-wrap items-end gap-4">
            <!-- Search -->
            <div class="flex-1 min-w-[200px]">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
              <input
                type="text"
                [(ngModel)]="filters.search"
                (keyup.enter)="onFilterChange()"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                placeholder="Job title or reference..."
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

            <!-- Filter Actions -->
            <app-button variant="outline" size="sm" (click)="onFilterChange()">
              Search
            </app-button>
            <app-button variant="ghost" size="sm" (click)="clearFilters()">
              Clear Filters
            </app-button>
          </div>
        </div>

        <!-- Table -->
        <app-table [columns]="columns" [data]="postings()" [loading]="loading()">
          @for (posting of postings(); track posting.id) {
            <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
              <!-- Job Title -->
              <td class="px-4 py-3">
                <div>
                  <p class="font-medium text-gray-900 dark:text-white truncate max-w-xs" [title]="posting.jobTitle">
                    {{ posting.jobTitle }}
                  </p>
                </div>
              </td>
              <!-- Reference -->
              <td class="px-4 py-3">
                <span class="text-sm font-mono text-gray-600 dark:text-gray-300">{{ posting.jobReference }}</span>
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
              <!-- External Link -->
              <td class="px-4 py-3">
                @if (posting.externalUrl) {
                  <a
                    [href]="posting.externalUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                    View
                  </a>
                } @else {
                  <span class="text-sm text-gray-400">-</span>
                }
              </td>
              <!-- Careers Link -->
              <td class="px-4 py-3">
                <a
                  [href]="getCareersLink(posting.jobReference)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  Careers
                </a>
              </td>
              <!-- Posted At -->
              <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                @if (posting.postedAt) {
                  {{ posting.postedAt | relativeTime }}
                } @else {
                  <span class="text-gray-400">-</span>
                }
              </td>
              <!-- Expires At -->
              <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                @if (posting.expiresAt) {
                  {{ posting.expiresAt | relativeTime }}
                } @else {
                  <span class="text-gray-400">-</span>
                }
              </td>
            </tr>
          }
        </app-table>

        <!-- Empty State -->
        @if (!loading() && postings().length === 0) {
          <div class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No postings found</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              @if (hasActiveFilters()) {
                No postings match your current filters.
              } @else {
                No external postings have been created yet.
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
  `
})
export class PostingQueueComponent implements OnInit {
  private portalService = inject(PortalAdminService);

  // State
  loading = signal(true);
  postings = signal<ExternalPosting[]>([]);
  totalElements = signal(0);
  statusCounts = signal<{ posted: number; pending: number; failed: number }>({
    posted: 0,
    pending: 0,
    failed: 0
  });

  // Pagination
  page = 0;
  size = 20;

  // Filters
  filters = {
    portal: '' as JobPortal | '',
    status: '' as ExternalPostingStatus | '',
    search: ''
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
    { label: 'Pending', value: 'PENDING' },
    { label: 'Queued', value: 'QUEUED' },
    { label: 'Posting', value: 'POSTING' },
    { label: 'Posted', value: 'POSTED' },
    { label: 'Failed', value: 'FAILED' },
    { label: 'Requires Manual', value: 'REQUIRES_MANUAL' },
    { label: 'Expired', value: 'EXPIRED' },
    { label: 'Removed', value: 'REMOVED' }
  ];

  // Table columns
  columns: TableColumn[] = [
    { key: 'jobTitle', label: 'Job Title', sortable: true },
    { key: 'jobReference', label: 'Reference', sortable: true },
    { key: 'portal', label: 'Portal', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'externalLink', label: 'External Link' },
    { key: 'careersLink', label: 'Careers Link' },
    { key: 'postedAt', label: 'Posted At', sortable: true },
    { key: 'expiresAt', label: 'Expires At', sortable: true }
  ];

  private careersBaseUrl = (environment as any).careersUrl || '';

  ngOnInit(): void {
    this.loadData();
    this.loadStatusCounts();
  }

  loadData(): void {
    this.loading.set(true);

    const filters: { status?: string; portal?: string; search?: string } = {};
    if (this.filters.status) filters.status = this.filters.status;
    if (this.filters.portal) filters.portal = this.filters.portal;
    if (this.filters.search) filters.search = this.filters.search;

    this.portalService.getAllPostings(this.page, this.size, filters).subscribe({
      next: (response: PagedResponse<ExternalPosting>) => {
        this.postings.set(response.content);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load postings:', err);
        this.loading.set(false);
      }
    });
  }

  loadStatusCounts(): void {
    this.portalService.getStats().subscribe({
      next: (stats) => {
        this.statusCounts.set({
          posted: stats.successfulPostings,
          pending: stats.pendingPostings,
          failed: stats.failedPostings
        });
      },
      error: () => {
        // Counts will stay at 0
      }
    });
  }

  onFilterChange(): void {
    this.page = 0;
    this.loadData();
  }

  clearFilters(): void {
    this.filters = { portal: '', status: '', search: '' };
    this.page = 0;
    this.loadData();
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.portal || this.filters.status || this.filters.search);
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadData();
  }

  getCareersLink(jobReference: string): string {
    return `${this.careersBaseUrl}/careers/jobs/${jobReference}`;
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

}
