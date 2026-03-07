import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  RecruitmentService,
  ExternalPostingStats,
  JobPortal,
  PortalStats
} from '../../../../core/services/recruitment.service';
import { SpinnerComponent } from '@shared/ui';

@Component({
  selector: 'app-portal-status-widget',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    SpinnerComponent
  ],
  template: `
    <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-neutral-200 dark:border-dark-border flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="material-icons text-primary-500">share</span>
          <h3 class="font-semibold text-neutral-800 dark:text-neutral-200">External Portals</h3>
        </div>
        <a routerLink="/recruitment/external-postings" class="text-sm text-primary-500 hover:text-primary-600 font-medium">
          View All
        </a>
      </div>

      @if (loading()) {
        <div class="flex justify-center items-center py-12">
          <sw-spinner size="md" />
        </div>
      } @else {
        <div class="p-6">
          <!-- Failed Postings Alert -->
          @if (stats()?.totalFailed && stats()!.totalFailed > 0) {
            <div class="mb-4 p-3 bg-error-50 dark:bg-error-900/20 rounded-lg border border-error-200 dark:border-error-800">
              <div class="flex items-center gap-2">
                <span class="material-icons text-error-500 text-lg">warning</span>
                <span class="text-sm font-medium text-error-700 dark:text-error-400">
                  {{ stats()!.totalFailed }} posting(s) failed
                </span>
                <a routerLink="/recruitment/external-postings" [queryParams]="{status: 'FAILED'}"
                   class="ml-auto text-xs text-error-600 hover:text-error-700 font-medium">
                  View
                </a>
              </div>
            </div>
          }

          <!-- Requires Manual Alert -->
          @if (stats()?.totalRequiresManual && stats()!.totalRequiresManual > 0) {
            <div class="mb-4 p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800">
              <div class="flex items-center gap-2">
                <span class="material-icons text-warning-500 text-lg">touch_app</span>
                <span class="text-sm font-medium text-warning-700 dark:text-warning-400">
                  {{ stats()!.totalRequiresManual }} need manual action
                </span>
                <a routerLink="/recruitment/external-postings" [queryParams]="{status: 'REQUIRES_MANUAL'}"
                   class="ml-auto text-xs text-warning-600 hover:text-warning-700 font-medium">
                  View
                </a>
              </div>
            </div>
          }

          <!-- Summary Cards -->
          <div class="grid grid-cols-2 gap-3 mb-6">
            <div class="p-3 rounded-lg bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800">
              <div class="flex items-center gap-2 mb-1">
                <span class="material-icons text-success-500 text-lg">check_circle</span>
                <span class="text-2xl font-bold text-success-700 dark:text-success-400">{{ stats()?.totalPosted || 0 }}</span>
              </div>
              <span class="text-xs text-success-600 dark:text-success-500">Posted</span>
            </div>
            <div class="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div class="flex items-center gap-2 mb-1">
                <span class="material-icons text-amber-500 text-lg">pending</span>
                <span class="text-2xl font-bold text-amber-700 dark:text-amber-400">{{ stats()?.totalPending || 0 }}</span>
              </div>
              <span class="text-xs text-amber-600 dark:text-amber-500">Pending</span>
            </div>
            <div class="p-3 rounded-lg bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800">
              <div class="flex items-center gap-2 mb-1">
                <span class="material-icons text-error-500 text-lg">error</span>
                <span class="text-2xl font-bold text-error-700 dark:text-error-400">{{ stats()?.totalFailed || 0 }}</span>
              </div>
              <span class="text-xs text-error-600 dark:text-error-500">Failed</span>
            </div>
            <div class="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <div class="flex items-center gap-2 mb-1">
                <span class="material-icons text-purple-500 text-lg">touch_app</span>
                <span class="text-2xl font-bold text-purple-700 dark:text-purple-400">{{ stats()?.totalRequiresManual || 0 }}</span>
              </div>
              <span class="text-xs text-purple-600 dark:text-purple-500">Manual</span>
            </div>
          </div>

          <!-- Queue Status -->
          @if (totalQueued() > 0) {
            <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div class="flex items-center gap-2">
                <span class="material-icons text-blue-500 text-lg animate-pulse">schedule</span>
                <span class="text-sm text-blue-700 dark:text-blue-400">
                  {{ totalQueued() }} job(s) waiting in queue
                </span>
              </div>
            </div>
          }

          <!-- Per-Portal Status -->
          <div class="space-y-3">
            <h4 class="text-sm font-medium text-neutral-600 dark:text-neutral-400">Portal Status</h4>
            @for (portal of portalStatuses(); track portal.portal) {
              <div class="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-dark-elevated">
                <div class="flex items-center gap-3">
                  <span class="material-icons" [ngClass]="getPortalIconClass(portal.portal)">{{ getPortalIcon(portal.portal) }}</span>
                  <div>
                    <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ getPortalLabel(portal.portal) }}</span>
                    <div class="flex items-center gap-2 text-xs text-neutral-500">
                      @if (portal.postedToday > 0) {
                        <span>{{ portal.postedToday }} posted today</span>
                      }
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  @if (portal.failed > 0) {
                    <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400">
                      {{ portal.failed }} failed
                    </span>
                  }
                  @if (portal.pending > 0) {
                    <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      {{ portal.pending }} pending
                    </span>
                  }
                  @if (portal.posted > 0) {
                    <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400">
                      {{ portal.posted }} active
                    </span>
                  }
                  @if (portal.posted === 0 && portal.pending === 0 && portal.failed === 0) {
                    <span class="text-xs text-neutral-400">No postings</span>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PortalStatusWidgetComponent implements OnInit {
  private readonly recruitmentService = inject(RecruitmentService);
  private readonly translate = inject(TranslateService);

  // State
  stats = signal<ExternalPostingStats | null>(null);
  loading = signal(true);

  // Computed values
  portalStatuses = computed<PortalStats[]>(() => {
    return this.stats()?.byPortal || [];
  });

  totalQueued = computed(() => {
    return this.stats()?.totalPending || 0;
  });

  ngOnInit(): void {
    this.loadStats();
  }

  private loadStats(): void {
    this.loading.set(true);
    this.recruitmentService.getExternalPostingStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load portal stats', err);
        this.loading.set(false);
      }
    });
  }

  refresh(): void {
    this.loadStats();
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
}
