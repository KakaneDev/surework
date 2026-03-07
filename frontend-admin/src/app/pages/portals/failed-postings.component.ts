import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  PortalAdminService,
  FailedPosting,
  JobPortal,
  ExternalPostingStatus,
  FailedPostingsCount
} from '@core/services/portal-admin.service';
import { BadgeComponent, BadgeColor } from '@core/components/ui/badge.component';
import { ButtonComponent } from '@core/components/ui/button.component';
import { TableComponent, TableColumn } from '@core/components/ui/table.component';
import { PaginationComponent } from '@core/components/ui/pagination.component';
import { ModalComponent } from '@core/components/ui/modal.component';
import { RelativeTimePipe } from '@core/pipes/relative-time.pipe';

@Component({
  selector: 'app-failed-postings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BadgeComponent,
    ButtonComponent,
    TableComponent,
    PaginationComponent,
    ModalComponent,
    RelativeTimePipe
  ],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Failed Postings Queue</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage external job postings that require manual intervention
          </p>
        </div>
        <app-button (click)="loadData()" [loading]="loading()">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Refresh
        </app-button>
      </div>

      <!-- Stats Cards -->
      @if (counts()) {
        <div class="stats-grid">
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
        </div>
      }

      <!-- Alert Banner -->
      @if ((counts()?.requiresManual ?? 0) > 0) {
        <div class="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <svg class="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span class="text-sm text-amber-800 dark:text-amber-200">
            {{ counts()?.requiresManual }} posting(s) require manual intervention. Please resolve these to complete the job postings.
          </span>
        </div>
      }

      <!-- Table -->
      <div>
        <app-table [columns]="columns" [data]="postings()" [loading]="loading()">
          @for (posting of postings(); track posting.id) {
            <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
              <td class="px-4 py-3">
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">{{ posting.jobTitle }}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ posting.jobReference }}</p>
                </div>
              </td>
              <td class="px-4 py-3">
                <app-badge [color]="getPortalBadgeColor(posting.portal)">{{ getPortalLabel(posting.portal) }}</app-badge>
              </td>
              <td class="px-4 py-3">
                <app-badge [color]="getStatusBadgeColor(posting.status)">{{ posting.status }}</app-badge>
              </td>
              <td class="px-4 py-3">
                <span class="text-sm text-gray-600 dark:text-gray-300">{{ posting.retryCount }}/3</span>
              </td>
              <td class="px-4 py-3">
                @if (posting.errorMessage) {
                  <p class="text-sm text-red-600 dark:text-red-400 max-w-xs truncate" [title]="posting.errorMessage">
                    {{ posting.errorMessage }}
                  </p>
                } @else {
                  <span class="text-sm text-gray-400">-</span>
                }
              </td>
              <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                {{ posting.createdAt | relativeTime }}
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <app-button variant="outline" size="sm" (click)="openResolveModal(posting)">
                    Resolve
                  </app-button>
                  <app-button variant="outline" size="sm" (click)="retryPosting(posting.id)" [loading]="retryingId() === posting.id">
                    Retry
                  </app-button>
                </div>
              </td>
            </tr>
          }
        </app-table>

        <!-- Empty State -->
        @if (!loading() && postings().length === 0) {
          <div class="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No failed postings</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">All external postings are up to date.</p>
          </div>
        }
      </div>

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

    <!-- Resolve Modal -->
    @if (showResolveModal()) {
      <app-modal [isOpen]="true" [title]="'Resolve Posting'" (close)="closeResolveModal()">
        <div class="space-y-4">
          <!-- Job Info -->
          <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedPosting()?.jobTitle }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ selectedPosting()?.jobReference }} - {{ getPortalLabel(selectedPosting()?.portal!) }}
            </p>
          </div>

          <!-- Resolution Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Resolution Type
            </label>
            <div class="flex gap-4">
              <label class="flex items-center gap-2">
                <input type="radio" [(ngModel)]="resolveSuccess" [value]="true"
                  class="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                <span class="text-sm text-gray-700 dark:text-gray-300">Posted Successfully</span>
              </label>
              <label class="flex items-center gap-2">
                <input type="radio" [(ngModel)]="resolveSuccess" [value]="false"
                  class="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                <span class="text-sm text-gray-700 dark:text-gray-300">Mark as Failed</span>
              </label>
            </div>
          </div>

          @if (resolveSuccess) {
            <!-- Success Fields -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                External Job ID
              </label>
              <input
                type="text"
                [(ngModel)]="resolveExternalJobId"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="ID from the portal"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                External URL
              </label>
              <input
                type="url"
                [(ngModel)]="resolveExternalUrl"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://..."
              />
            </div>
          } @else {
            <!-- Failure Fields -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Error Message
              </label>
              <textarea
                [(ngModel)]="resolveErrorMessage"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Reason for permanent failure..."
              ></textarea>
            </div>
          }
        </div>

        <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <app-button type="button" variant="outline" (click)="closeResolveModal()">
            Cancel
          </app-button>
          <app-button (click)="submitResolve()" [loading]="resolving()">
            {{ resolveSuccess ? 'Mark as Posted' : 'Mark as Failed' }}
          </app-button>
        </div>
      </app-modal>
    }
  `
})
export class FailedPostingsComponent implements OnInit {
  private portalService = inject(PortalAdminService);

  loading = signal(true);
  postings = signal<FailedPosting[]>([]);
  totalElements = signal(0);
  counts = signal<FailedPostingsCount | null>(null);
  retryingId = signal<string | null>(null);

  page = 0;
  size = 20;

  // Resolve modal state
  showResolveModal = signal(false);
  selectedPosting = signal<FailedPosting | null>(null);
  resolving = signal(false);
  resolveSuccess = true;
  resolveExternalJobId = '';
  resolveExternalUrl = '';
  resolveErrorMessage = '';

  columns: TableColumn[] = [
    { key: 'job', label: 'Job' },
    { key: 'portal', label: 'Portal' },
    { key: 'status', label: 'Status' },
    { key: 'retries', label: 'Retries' },
    { key: 'error', label: 'Error' },
    { key: 'created', label: 'Requested' },
    { key: 'actions', label: '' }
  ];

  ngOnInit(): void {
    this.loadData();
    this.loadCounts();
  }

  loadData(): void {
    this.loading.set(true);
    this.portalService.getFailedPostings(this.page, this.size).subscribe({
      next: (response) => {
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
      error: () => this.counts.set({ requiresManual: 3, failed: 2, total: 5 })
    });
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadData();
  }

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

  openResolveModal(posting: FailedPosting): void {
    this.selectedPosting.set(posting);
    this.resolveSuccess = true;
    this.resolveExternalJobId = '';
    this.resolveExternalUrl = '';
    this.resolveErrorMessage = '';
    this.showResolveModal.set(true);
  }

  closeResolveModal(): void {
    this.showResolveModal.set(false);
    this.selectedPosting.set(null);
  }

  submitResolve(): void {
    const posting = this.selectedPosting();
    if (!posting) return;

    this.resolving.set(true);
    this.portalService.resolveFailedPosting(posting.id, {
      success: this.resolveSuccess,
      externalJobId: this.resolveSuccess ? this.resolveExternalJobId : undefined,
      externalUrl: this.resolveSuccess ? this.resolveExternalUrl : undefined,
      errorMessage: !this.resolveSuccess ? this.resolveErrorMessage : undefined
    }).subscribe({
      next: () => {
        this.resolving.set(false);
        this.closeResolveModal();
        this.loadData();
        this.loadCounts();
      },
      error: (err) => {
        this.resolving.set(false);
        alert(`Failed to resolve: ${err.message}`);
      }
    });
  }

  getPortalLabel(portal: JobPortal): string {
    return this.portalService.getPortalLabel(portal);
  }

  getPortalBadgeColor(portal: JobPortal): BadgeColor {
    const colors: Record<JobPortal, BadgeColor> = {
      PNET: 'info',
      LINKEDIN: 'info',
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

  private setMockData(): void {
    this.postings.set([
      { id: '1', jobPostingId: 'jp-1', jobReference: 'JOB-2024-001', jobTitle: 'Software Developer', tenantId: 't-1', portal: 'LINKEDIN', status: 'REQUIRES_MANUAL', errorMessage: 'CAPTCHA required', retryCount: 3, createdAt: '2024-01-20T08:00:00Z', lastAttemptAt: '2024-01-20T10:30:00Z' },
      { id: '2', jobPostingId: 'jp-2', jobReference: 'JOB-2024-002', jobTitle: 'Sales Manager', tenantId: 't-2', portal: 'PNET', status: 'REQUIRES_MANUAL', errorMessage: 'Session expired during posting', retryCount: 2, createdAt: '2024-01-20T09:00:00Z', lastAttemptAt: '2024-01-20T11:00:00Z' },
      { id: '3', jobPostingId: 'jp-3', jobReference: 'JOB-2024-003', jobTitle: 'Accountant', tenantId: 't-1', portal: 'INDEED', status: 'FAILED', errorMessage: 'Rate limit exceeded', retryCount: 3, createdAt: '2024-01-19T14:00:00Z', lastAttemptAt: '2024-01-20T08:00:00Z' }
    ]);
    this.totalElements.set(3);
  }
}
