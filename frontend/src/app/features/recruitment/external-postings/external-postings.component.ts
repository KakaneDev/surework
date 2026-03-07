import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  RecruitmentService,
  ExternalJobPosting,
  ExternalPostingStatus,
  JobPortal,
  PageResponse
} from '../../../core/services/recruitment.service';
import {
  SpinnerComponent,
  DropdownComponent,
  DropdownItemComponent,
  ToastService,
  TableSkeletonComponent,
  ButtonComponent
} from '@shared/ui';

@Component({
  selector: 'app-external-postings',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    TranslateModule,
    SpinnerComponent,
    DropdownComponent,
    DropdownItemComponent,
    DatePipe,
    TableSkeletonComponent,
    ButtonComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="sw-page-header">
        <div class="flex items-center gap-3">
          <a routerLink="/recruitment" class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors" [attr.aria-label]="'common.back' | translate">
            <span class="material-icons" aria-hidden="true">arrow_back</span>
          </a>
          <span class="material-icons text-3xl text-primary-500">share</span>
          <div>
            <h1 class="sw-page-title">{{ 'recruitment.externalPostings.title' | translate }}</h1>
            <p class="sw-page-description">{{ 'recruitment.externalPostings.subtitle' | translate }}</p>
          </div>
        </div>
        <button (click)="refreshPostings()" class="sw-btn sw-btn-outline sw-btn-md">
          <span class="material-icons text-lg">refresh</span>
          {{ 'common.refresh' | translate }}
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <span class="material-icons text-white text-xl">pending</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{{ stats()?.totalPending || 0 }}</p>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'recruitment.externalPostings.stats.pending' | translate }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
              <span class="material-icons text-white text-xl">check_circle</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{{ stats()?.totalPosted || 0 }}</p>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'recruitment.externalPostings.stats.posted' | translate }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center">
              <span class="material-icons text-white text-xl">error</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{{ stats()?.totalFailed || 0 }}</p>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'recruitment.externalPostings.stats.failed' | translate }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
              <span class="material-icons text-white text-xl">touch_app</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{{ stats()?.totalRequiresManual || 0 }}</p>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'recruitment.externalPostings.stats.requiresManual' | translate }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex items-center gap-4 flex-wrap">
        <div class="relative flex-1 min-w-[250px]">
          <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">search</span>
          <input
            type="text"
            [formControl]="searchControl"
            [placeholder]="'recruitment.externalPostings.searchPlaceholder' | translate"
            class="sw-input pl-10 w-full"
          />
        </div>

        <select [formControl]="portalControl" class="sw-input w-40">
          <option value="">{{ 'recruitment.externalPostings.allPortals' | translate }}</option>
          @for (portal of portals; track portal) {
            <option [value]="portal">{{ getPortalLabel(portal) }}</option>
          }
        </select>

        <select [formControl]="statusControl" class="sw-input w-44">
          <option value="">{{ 'common.allStatuses' | translate }}</option>
          @for (status of statuses; track status) {
            <option [value]="status">{{ getStatusLabel(status) }}</option>
          }
        </select>

        <button (click)="clearFilters()" [disabled]="!hasFilters()"
                class="sw-btn sw-btn-ghost sw-btn-sm">
          <span class="material-icons text-lg">clear</span>
          {{ 'common.clear' | translate }}
        </button>
      </div>

      <!-- Content -->
      @if (loading()) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          <sw-table-skeleton [columns]="7" [rows]="10" [showAvatar]="false" [showActions]="true" />
        </div>
      } @else if (filteredPostings().length === 0) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">share</span>
          <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">{{ 'recruitment.externalPostings.noPostings' | translate }}</h3>
          @if (hasFilters()) {
            <p class="text-neutral-500 dark:text-neutral-400 mb-4">{{ 'recruitment.externalPostings.adjustFilters' | translate }}</p>
            <button (click)="clearFilters()" class="px-4 py-2 text-primary-500 hover:text-primary-600 font-medium">
              {{ 'common.clearFilters' | translate }}
            </button>
          } @else {
            <p class="text-neutral-500 dark:text-neutral-400 mb-4">{{ 'recruitment.externalPostings.emptyState' | translate }}</p>
          }
        </div>
      } @else {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          <div class="overflow-x-auto">
            <table class="sw-table">
              <thead>
                <tr>
                  <th>{{ 'recruitment.externalPostings.table.job' | translate }}</th>
                  <th>{{ 'recruitment.externalPostings.table.portal' | translate }}</th>
                  <th>{{ 'recruitment.externalPostings.table.status' | translate }}</th>
                  <th>{{ 'recruitment.externalPostings.table.postedAt' | translate }}</th>
                  <th>{{ 'recruitment.externalPostings.table.expiresAt' | translate }}</th>
                  <th>{{ 'recruitment.externalPostings.table.retries' | translate }}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (posting of filteredPostings(); track posting.id) {
                  <tr class="cursor-pointer hover:bg-neutral-50 dark:hover:bg-dark-elevated" [routerLink]="['/recruitment/external-postings', posting.id]">
                    <td>
                      <div class="flex flex-col">
                        <a [routerLink]="['/recruitment/jobs', posting.jobPostingId]" class="text-primary-500 hover:text-primary-600 font-medium" (click)="$event.stopPropagation()">
                          {{ posting.jobTitle }}
                        </a>
                        <span class="text-xs text-neutral-500 font-mono">{{ posting.jobReference }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="flex items-center gap-2">
                        <span class="material-icons text-lg" [ngClass]="getPortalIconClass(posting.portal)">{{ getPortalIcon(posting.portal) }}</span>
                        <span>{{ getPortalLabel(posting.portal) }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="inline-block px-3 py-1 rounded-full text-xs font-medium"
                            [style.background]="getStatusColor(posting.status).background"
                            [style.color]="getStatusColor(posting.status).color">
                        {{ getStatusLabel(posting.status) }}
                      </span>
                    </td>
                    <td>
                      @if (posting.postedAt) {
                        {{ posting.postedAt | date:'mediumDate' }}
                      } @else {
                        <span class="text-neutral-400">-</span>
                      }
                    </td>
                    <td>
                      @if (posting.expiresAt) {
                        <span [class.text-error-600]="isExpiringSoon(posting.expiresAt)">
                          {{ posting.expiresAt | date:'mediumDate' }}
                        </span>
                      } @else {
                        <span class="text-neutral-400">-</span>
                      }
                    </td>
                    <td class="text-center">
                      @if (posting.retryCount > 0) {
                        <span class="px-2 py-1 bg-warning-100 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400 rounded text-xs font-medium">
                          {{ posting.retryCount }}
                        </span>
                      } @else {
                        <span class="text-neutral-400">0</span>
                      }
                    </td>
                    <td (click)="$event.stopPropagation()">
                      <sw-dropdown position="bottom-end">
                        <button trigger class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated" [attr.aria-label]="'common.moreOptions' | translate">
                          <span class="material-icons">more_vert</span>
                        </button>
                        <sw-dropdown-item icon="visibility" [routerLink]="['/recruitment/external-postings', posting.id]">{{ 'common.view' | translate }}</sw-dropdown-item>
                        @if (posting.externalUrl) {
                          <sw-dropdown-item icon="open_in_new" (click)="openExternalUrl(posting)">{{ 'recruitment.externalPostings.viewOnPortal' | translate }}</sw-dropdown-item>
                        }
                        @if (posting.status === 'FAILED' || posting.status === 'REQUIRES_MANUAL') {
                          <sw-dropdown-item icon="refresh" (click)="retryPosting(posting)">{{ 'recruitment.externalPostings.retry' | translate }}</sw-dropdown-item>
                        }
                        @if (posting.status === 'POSTED' || posting.status === 'FAILED') {
                          <sw-dropdown-item icon="delete" (click)="removePosting(posting)" class="text-error-600">{{ 'recruitment.externalPostings.remove' | translate }}</sw-dropdown-item>
                        }
                      </sw-dropdown>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-dark-border">
            <div class="text-sm text-neutral-500 dark:text-neutral-400">
              {{ 'common.showing' | translate: { from: (pageIndex() * pageSize()) + 1, to: Math.min((pageIndex() + 1) * pageSize(), totalElements()), total: totalElements() } }}
            </div>
            <div class="flex items-center gap-2">
              <button (click)="goToPage(0)" [disabled]="pageIndex() === 0"
                      [title]="'common.firstPage' | translate"
                      class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed">
                <span class="material-icons">first_page</span>
              </button>
              <button (click)="goToPage(pageIndex() - 1)" [disabled]="pageIndex() === 0"
                      [title]="'common.previousPage' | translate"
                      class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed">
                <span class="material-icons">chevron_left</span>
              </button>
              <span class="px-3 text-sm text-neutral-600 dark:text-neutral-400">
                {{ 'common.page' | translate: { current: pageIndex() + 1, total: Math.ceil(totalElements() / pageSize()) || 1 } }}
              </span>
              <button (click)="goToPage(pageIndex() + 1)" [disabled]="(pageIndex() + 1) * pageSize() >= totalElements()"
                      [title]="'common.nextPage' | translate"
                      class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed">
                <span class="material-icons">chevron_right</span>
              </button>
              <button (click)="goToPage(Math.ceil(totalElements() / pageSize()) - 1)" [disabled]="(pageIndex() + 1) * pageSize() >= totalElements()"
                      [title]="'common.lastPage' | translate"
                      class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed">
                <span class="material-icons">last_page</span>
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExternalPostingsComponent implements OnInit, OnDestroy {
  private readonly recruitmentService = inject(RecruitmentService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly destroy$ = new Subject<void>();

  // Expose Math for template use
  Math = Math;

  // State
  postings = signal<ExternalJobPosting[]>([]);
  stats = signal<{ totalPending: number; totalPosted: number; totalFailed: number; totalRequiresManual: number } | null>(null);
  loading = signal(true);
  totalElements = signal(0);
  pageSize = signal(10);
  pageIndex = signal(0);

  // Form controls
  searchControl = new FormControl('');
  portalControl = new FormControl('');
  statusControl = new FormControl('');

  // Options
  portals: JobPortal[] = ['LINKEDIN', 'PNET', 'CAREERS24', 'INDEED'];
  statuses: ExternalPostingStatus[] = ['PENDING', 'QUEUED', 'POSTING', 'POSTED', 'FAILED', 'REQUIRES_MANUAL', 'EXPIRED', 'REMOVED'];

  // Computed filtered postings (client-side filtering for search)
  filteredPostings = computed(() => {
    const searchTerm = this.searchControl.value?.toLowerCase() || '';
    if (!searchTerm) return this.postings();
    return this.postings().filter(p =>
      p.jobTitle.toLowerCase().includes(searchTerm) ||
      p.jobReference.toLowerCase().includes(searchTerm)
    );
  });

  ngOnInit(): void {
    this.loadPostings();
    this.loadStats();
    this.setupFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFilters(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Client-side filtering via computed signal
      });

    this.portalControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex.set(0);
        this.loadPostings();
      });

    this.statusControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex.set(0);
        this.loadPostings();
      });
  }

  loadPostings(): void {
    this.loading.set(true);

    const status = this.statusControl.value as ExternalPostingStatus | undefined;
    const portal = this.portalControl.value as JobPortal | undefined;

    this.recruitmentService.searchExternalPostings(
      this.pageIndex(),
      this.pageSize(),
      status || undefined,
      portal || undefined
    ).subscribe({
      next: (response) => {
        this.postings.set(response.content);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load external postings', err);
        this.toast.error(this.translate.instant('recruitment.externalPostings.loadError'));
        this.loading.set(false);
      }
    });
  }

  loadStats(): void {
    this.recruitmentService.getExternalPostingStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
      },
      error: (err) => {
        console.error('Failed to load stats', err);
      }
    });
  }

  refreshPostings(): void {
    this.loadPostings();
    this.loadStats();
  }

  goToPage(page: number): void {
    if (page < 0 || page * this.pageSize() >= this.totalElements()) return;
    this.pageIndex.set(page);
    this.loadPostings();
  }

  hasFilters(): boolean {
    return !!(this.searchControl.value || this.portalControl.value || this.statusControl.value);
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.portalControl.setValue('');
    this.statusControl.setValue('');
  }

  isExpiringSoon(dateStr: string): boolean {
    const date = new Date(dateStr);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
  }

  retryPosting(posting: ExternalJobPosting): void {
    this.recruitmentService.retryExternalPosting(posting.id).subscribe({
      next: () => {
        this.toast.success(this.translate.instant('recruitment.externalPostings.retryQueued'));
        this.loadPostings();
        this.loadStats();
      },
      error: (err) => {
        console.error('Failed to retry posting', err);
        this.toast.error(this.translate.instant('recruitment.externalPostings.retryError'));
      }
    });
  }

  removePosting(posting: ExternalJobPosting): void {
    const message = this.translate.instant('recruitment.externalPostings.confirmRemove', { portal: this.getPortalLabel(posting.portal) });
    if (confirm(message)) {
      this.recruitmentService.removeExternalPosting(posting.id).subscribe({
        next: () => {
          this.toast.success(this.translate.instant('recruitment.externalPostings.removeSuccess'));
          this.loadPostings();
          this.loadStats();
        },
        error: (err) => {
          console.error('Failed to remove posting', err);
          this.toast.error(this.translate.instant('recruitment.externalPostings.removeError'));
        }
      });
    }
  }

  openExternalUrl(posting: ExternalJobPosting): void {
    if (posting.externalUrl) {
      window.open(posting.externalUrl, '_blank');
    }
  }

  getPortalLabel(portal: JobPortal): string {
    return RecruitmentService.getJobPortalLabel(portal);
  }

  getPortalIcon(portal: JobPortal): string {
    const icons: Record<JobPortal, string> = {
      LINKEDIN: 'work',
      PNET: 'public',
      CAREERS24: 'language',
      INDEED: 'search'
    };
    return icons[portal] || 'public';
  }

  getPortalIconClass(portal: JobPortal): string {
    const classes: Record<JobPortal, string> = {
      LINKEDIN: 'text-blue-600',
      PNET: 'text-orange-500',
      CAREERS24: 'text-green-600',
      INDEED: 'text-purple-600'
    };
    return classes[portal] || 'text-neutral-500';
  }

  getStatusLabel(status: ExternalPostingStatus): string {
    return RecruitmentService.getExternalPostingStatusLabel(status);
  }

  getStatusColor(status: ExternalPostingStatus): { background: string; color: string } {
    return RecruitmentService.getExternalPostingStatusColor(status);
  }
}
