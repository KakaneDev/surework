import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  PortalAdminService,
  ExternalPostingStats,
  PortalHealthSummary,
  JobPortal
} from '@core/services/portal-admin.service';
import { BadgeComponent, BadgeColor } from '@core/components/ui/badge.component';
import { ButtonComponent } from '@core/components/ui/button.component';
import { CardComponent } from '@core/components/ui/card.component';

@Component({
  selector: 'app-external-posting-stats',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BadgeComponent,
    ButtonComponent,
    CardComponent
  ],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">External Posting Analytics</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitor job distribution across external portals
          </p>
        </div>
        <div class="flex items-center gap-3">
        </div>
      </div>

      <!-- Overview Stats -->
      @if (stats()) {
        <div class="stats-grid">
          <div class="stats-card">
            <p class="stats-card-label">Total Requests</p>
            <p class="stats-card-value">{{ stats()?.totalRequests | number }}</p>
          </div>
          <div class="stats-card">
            <p class="stats-card-label">Successfully Posted</p>
            <p class="stats-card-value text-green-600 dark:text-green-400">{{ stats()?.successfulPostings | number }}</p>
          </div>
          <div class="stats-card">
            <p class="stats-card-label">Success Rate</p>
            <p class="stats-card-value" [class]="getSuccessRateClass()">{{ stats()?.successRate | number:'1.1-1' }}%</p>
          </div>
          <div class="stats-card">
            <p class="stats-card-label">Pending</p>
            <p class="stats-card-value text-blue-600 dark:text-blue-400">{{ stats()?.pendingPostings | number }}</p>
          </div>
        </div>
      }

      <!-- Alert Banners -->
      @if ((stats()?.requiresManualCount ?? 0) > 0) {
        <div class="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <svg class="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span class="text-sm text-amber-800 dark:text-amber-200">
            {{ stats()?.requiresManualCount }} posting(s) require manual intervention.
            <a routerLink="/portals/failed" class="font-medium underline">View queue</a>
          </span>
        </div>
      }

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Portal Status Cards -->
        <app-card>
          <div class="p-5">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Portal Status</h3>
            @if (healthSummary()) {
              <div class="space-y-3">
                @for (portal of healthSummary()!.portals; track portal.portal) {
                  <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div class="flex items-center gap-3">
                      <div class="w-3 h-3 rounded-full" [class]="getStatusDotClass(portal.status)"></div>
                      <span class="font-medium text-gray-900 dark:text-white">{{ getPortalLabel(portal.portal) }}</span>
                    </div>
                    <div class="flex items-center gap-4">
                      <div class="text-right">
                        <span class="text-sm font-medium text-gray-900 dark:text-white">{{ portal.postsToday }}</span>
                        <span class="text-sm text-gray-500 dark:text-gray-400">/{{ portal.dailyLimit }}</span>
                      </div>
                      <app-badge [color]="portal.active ? 'success' : 'gray'" size="sm">
                        {{ portal.active ? 'Active' : 'Inactive' }}
                      </app-badge>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="animate-pulse space-y-3">
                @for (i of [1,2,3,4]; track i) {
                  <div class="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                }
              </div>
            }
          </div>
        </app-card>

        <!-- Posts by Portal -->
        <app-card>
          <div class="p-5">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Posts by Portal</h3>
            @if (stats()) {
              <div class="space-y-4">
                @for (portal of portals; track portal) {
                  @let count = getPortalCount(portal);
                  @let percentage = getPortalPercentage(portal);
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ getPortalLabel(portal) }}</span>
                      <span class="text-sm text-gray-500 dark:text-gray-400">{{ count | number }}</span>
                    </div>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        class="h-2 rounded-full transition-all duration-500"
                        [class]="getPortalBarClass(portal)"
                        [style.width.%]="percentage"
                      ></div>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="animate-pulse space-y-4">
                @for (i of [1,2,3,4]; track i) {
                  <div>
                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                    <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  </div>
                }
              </div>
            }
          </div>
        </app-card>

        <!-- Status Breakdown -->
        <app-card>
          <div class="p-5">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status Breakdown</h3>
            @if (stats()) {
              <div class="grid grid-cols-2 gap-4">
                <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                  <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ stats()?.byStatus?.['POSTED'] || 0 }}</p>
                  <p class="text-sm text-green-700 dark:text-green-300">Posted</p>
                </div>
                <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                  <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ stats()?.pendingPostings || 0 }}</p>
                  <p class="text-sm text-blue-700 dark:text-blue-300">Pending</p>
                </div>
                <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                  <p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ stats()?.failedPostings || 0 }}</p>
                  <p class="text-sm text-red-700 dark:text-red-300">Failed</p>
                </div>
                <div class="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center">
                  <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ stats()?.requiresManualCount || 0 }}</p>
                  <p class="text-sm text-amber-700 dark:text-amber-300">Manual</p>
                </div>
              </div>
            } @else {
              <div class="animate-pulse grid grid-cols-2 gap-4">
                @for (i of [1,2,3,4]; track i) {
                  <div class="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                }
              </div>
            }
          </div>
        </app-card>

        <!-- Quick Actions -->
        <app-card>
          <div class="p-5">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div class="space-y-3">
              <a
                routerLink="/portals/credentials"
                class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <svg class="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                  </svg>
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Manage Portal Credentials</span>
                </div>
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </a>
              <a
                routerLink="/portals/failed"
                class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <svg class="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Review Failed Postings</span>
                </div>
                @if ((stats()?.requiresManualCount ?? 0) > 0) {
                  <app-badge color="warning">{{ stats()?.requiresManualCount }}</app-badge>
                } @else {
                  <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                }
              </a>
              <button
                (click)="refreshData()"
                class="flex items-center justify-between w-full p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <svg class="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Refresh Statistics</span>
                </div>
                @if (loading()) {
                  <div class="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                } @else {
                  <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                }
              </button>
            </div>
          </div>
        </app-card>
      </div>
    </div>
  `
})
export class ExternalPostingStatsComponent implements OnInit {
  private portalService = inject(PortalAdminService);

  loading = signal(false);
  stats = signal<ExternalPostingStats | null>(null);
  healthSummary = signal<PortalHealthSummary | null>(null);

  portals: JobPortal[] = ['PNET', 'LINKEDIN', 'INDEED', 'CAREERS24'];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    this.portalService.getStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.setMockStats();
      }
    });

    this.portalService.getHealthSummary().subscribe({
      next: (summary) => this.healthSummary.set(summary),
      error: () => this.setMockHealthSummary()
    });
  }

  refreshData(): void {
    this.loadData();
  }

  getPortalLabel(portal: JobPortal): string {
    return this.portalService.getPortalLabel(portal);
  }

  getPortalCount(portal: JobPortal): number {
    return this.stats()?.byPortal?.[portal] ?? 0;
  }

  getPortalPercentage(portal: JobPortal): number {
    const total = this.stats()?.totalRequests ?? 0;
    if (total === 0) return 0;
    return (this.getPortalCount(portal) / total) * 100;
  }

  getPortalBarClass(portal: JobPortal): string {
    const colors: Record<JobPortal, string> = {
      PNET: 'bg-blue-500',
      LINKEDIN: 'bg-sky-500',
      INDEED: 'bg-purple-500',
      CAREERS24: 'bg-emerald-500'
    };
    return colors[portal] || 'bg-gray-500';
  }

  getStatusDotClass(status: string): string {
    const classes: Record<string, string> = {
      CONNECTED: 'bg-green-500',
      SESSION_EXPIRED: 'bg-amber-500',
      INVALID_CREDENTIALS: 'bg-red-500',
      RATE_LIMITED: 'bg-amber-500',
      CAPTCHA_REQUIRED: 'bg-amber-500',
      ERROR: 'bg-red-500',
      NOT_CONFIGURED: 'bg-gray-400'
    };
    return classes[status] || 'bg-gray-400';
  }

  getSuccessRateClass(): string {
    const rate = this.stats()?.successRate ?? 0;
    if (rate >= 90) return 'text-green-600 dark:text-green-400';
    if (rate >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  }

  private setMockStats(): void {
    this.stats.set({
      totalRequests: 156,
      successfulPostings: 142,
      failedPostings: 6,
      pendingPostings: 5,
      requiresManualCount: 3,
      successRate: 91.0,
      byPortal: {
        PNET: 45,
        LINKEDIN: 38,
        INDEED: 41,
        CAREERS24: 32
      },
      byStatus: {
        POSTED: 142,
        FAILED: 6,
        PENDING: 5,
        REQUIRES_MANUAL: 3
      }
    });
  }

  private setMockHealthSummary(): void {
    this.healthSummary.set({
      totalPortals: 4,
      activePortals: 3,
      portalsNeedingAttention: 1,
      totalPostsToday: 25,
      portals: [
        { portal: 'PNET', status: 'CONNECTED', active: true, postsToday: 12, dailyLimit: 50 },
        { portal: 'LINKEDIN', status: 'SESSION_EXPIRED', active: true, postsToday: 8, dailyLimit: 25 },
        { portal: 'INDEED', status: 'CONNECTED', active: true, postsToday: 5, dailyLimit: 40 },
        { portal: 'CAREERS24', status: 'NOT_CONFIGURED', active: false, postsToday: 0, dailyLimit: 50 }
      ]
    });
  }
}
