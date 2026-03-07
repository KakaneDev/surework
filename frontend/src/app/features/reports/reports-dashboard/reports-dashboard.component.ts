import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { ReportsService, ReportListItem, ScheduleResponse } from '../../../core/services/reports.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, MatProgressSpinnerModule, TranslateModule],
  template: `
    <div class="space-y-6">
      <div class="sw-page-header">
        <div>
          <h1 class="sw-page-title">{{ 'reports.dashboard.title' | translate }}</h1>
          <p class="sw-page-description">{{ 'reports.dashboard.description' | translate }}</p>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <span class="material-icons text-primary-600 dark:text-primary-400">description</span>
            </div>
            <div>
              @if (loadingStats()) {
                <div class="animate-pulse h-6 w-16 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
              } @else {
                <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ reportsThisMonth() }}</p>
              }
              <p class="text-sm text-neutral-500">{{ 'reports.dashboard.stats.reportsThisMonth' | translate }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <span class="material-icons text-green-600 dark:text-green-400">schedule</span>
            </div>
            <div>
              @if (loadingStats()) {
                <div class="animate-pulse h-6 w-16 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
              } @else {
                <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ activeSchedules() }}</p>
              }
              <p class="text-sm text-neutral-500">{{ 'reports.dashboard.stats.activeSchedules' | translate }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <span class="material-icons text-purple-600 dark:text-purple-400">pending_actions</span>
            </div>
            <div>
              @if (loadingStats()) {
                <div class="animate-pulse h-6 w-16 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
              } @else {
                <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ pendingReports() }}</p>
              }
              <p class="text-sm text-neutral-500">{{ 'reports.dashboard.stats.pendingReports' | translate }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Report Categories -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <a routerLink="/reports/hr" class="block bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <span class="material-icons text-primary-600 dark:text-primary-400">people</span>
            </div>
            <div>
              <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">{{ 'reports.dashboard.categories.hr.title' | translate }}</h3>
              <p class="text-sm text-neutral-500">{{ 'reports.dashboard.categories.hr.description' | translate }}</p>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t border-neutral-200 dark:border-dark-border">
            <div class="flex flex-wrap gap-2">
              <span class="text-xs px-2 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded">{{ 'reports.dashboard.categories.hr.tags.headcount' | translate }}</span>
              <span class="text-xs px-2 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded">{{ 'reports.dashboard.categories.hr.tags.turnover' | translate }}</span>
              <span class="text-xs px-2 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded">{{ 'reports.dashboard.categories.hr.tags.demographics' | translate }}</span>
            </div>
          </div>
        </a>

        <a routerLink="/reports/financial" class="block bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <span class="material-icons text-green-600 dark:text-green-400">payments</span>
            </div>
            <div>
              <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">{{ 'reports.dashboard.categories.financial.title' | translate }}</h3>
              <p class="text-sm text-neutral-500">{{ 'reports.dashboard.categories.financial.description' | translate }}</p>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t border-neutral-200 dark:border-dark-border">
            <div class="flex flex-wrap gap-2">
              <span class="text-xs px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded">{{ 'reports.dashboard.categories.financial.tags.payroll' | translate }}</span>
              <span class="text-xs px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded">{{ 'reports.dashboard.categories.financial.tags.emp201' | translate }}</span>
              <span class="text-xs px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded">{{ 'reports.dashboard.categories.financial.tags.emp501' | translate }}</span>
            </div>
          </div>
        </a>

        <a routerLink="/reports/recruitment" class="block bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <span class="material-icons text-purple-600 dark:text-purple-400">work</span>
            </div>
            <div>
              <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">{{ 'reports.dashboard.categories.recruitment.title' | translate }}</h3>
              <p class="text-sm text-neutral-500">{{ 'reports.dashboard.categories.recruitment.description' | translate }}</p>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t border-neutral-200 dark:border-dark-border">
            <div class="flex flex-wrap gap-2">
              <span class="text-xs px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded">{{ 'reports.dashboard.categories.recruitment.tags.pipeline' | translate }}</span>
              <span class="text-xs px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded">{{ 'reports.dashboard.categories.recruitment.tags.timeToHire' | translate }}</span>
              <span class="text-xs px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded">{{ 'reports.dashboard.categories.recruitment.tags.sources' | translate }}</span>
            </div>
          </div>
        </a>
      </div>

      <!-- Recent Reports -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border">
        <div class="p-4 border-b border-neutral-200 dark:border-dark-border">
          <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{{ 'reports.dashboard.recent.title' | translate }}</h3>
          <p class="text-sm text-neutral-500">{{ 'reports.dashboard.recent.subtitle' | translate }}</p>
        </div>

        @if (loadingRecentReports()) {
          <div class="p-8 flex justify-center">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
        } @else if (recentReports().length === 0) {
          <div class="p-8 text-center">
            <span class="material-icons text-4xl text-neutral-300 dark:text-neutral-600 mb-2">description</span>
            <p class="text-neutral-500 dark:text-neutral-400">{{ 'reports.dashboard.recent.empty' | translate }}</p>
            <p class="text-sm text-neutral-400 mt-1">{{ 'reports.dashboard.recent.emptyCta' | translate }}</p>
          </div>
        } @else {
          <div class="divide-y divide-neutral-200 dark:divide-dark-border">
            @for (report of recentReports(); track report.id) {
              <div class="p-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-dark-border/50 transition-colors">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center"
                    [style.background-color]="getCategoryColor(report.category) + '20'">
                    <span class="material-icons text-lg" [style.color]="getCategoryColor(report.category)">
                      {{ getFormatIcon(report.outputFormat) }}
                    </span>
                  </div>
                  <div>
                    <p class="font-medium text-neutral-900 dark:text-neutral-100">{{ report.name }}</p>
                    <div class="flex items-center gap-2 text-sm text-neutral-500">
                      <span>{{ getReportTypeLabel(report.reportType) }}</span>
                      <span class="text-neutral-300 dark:text-neutral-600">&#8226;</span>
                      <span>{{ report.createdAt | date:'short' }}</span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <span
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    [style.background-color]="getStatusColor(report.status).background"
                    [style.color]="getStatusColor(report.status).color"
                  >
                    {{ getStatusLabel(report.status) }}
                  </span>
                  @if (report.status === 'COMPLETED') {
                    <button
                      class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      (click)="downloadReport(report)"
                    >
                      <span class="material-icons text-lg">download</span>
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsDashboardComponent implements OnInit {
  private readonly reportsService = inject(ReportsService);

  // State
  loadingStats = signal(true);
  loadingRecentReports = signal(true);
  reportsThisMonth = signal(0);
  activeSchedules = signal(0);
  pendingReports = signal(0);
  recentReports = signal<ReportListItem[]>([]);

  // Static methods
  getReportTypeLabel = ReportsService.getReportTypeLabel;
  getStatusLabel = ReportsService.getStatusLabel;
  getStatusColor = ReportsService.getStatusColor;

  ngOnInit(): void {
    this.loadStats();
    this.loadRecentReports();
  }

  private loadStats(): void {
    this.loadingStats.set(true);

    forkJoin({
      reports: this.reportsService.searchReports(0, 100),
      schedules: this.reportsService.listSchedules(0, 100)
    }).subscribe({
      next: ({ reports, schedules }) => {
        // Count reports this month
        const now = new Date();
        const thisMonth = reports.content.filter(r => {
          const created = new Date(r.createdAt);
          return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
        });
        this.reportsThisMonth.set(thisMonth.length);

        // Count active schedules
        const active = schedules.content.filter(s => s.active);
        this.activeSchedules.set(active.length);

        // Count pending reports
        const pending = reports.content.filter(r =>
          r.status === 'PENDING' || r.status === 'QUEUED' || r.status === 'GENERATING'
        );
        this.pendingReports.set(pending.length);

        this.loadingStats.set(false);
      },
      error: (err) => {
        console.error('Failed to load stats:', err);
        this.loadingStats.set(false);
      }
    });
  }

  private loadRecentReports(): void {
    this.loadingRecentReports.set(true);

    this.reportsService.getRecentReports(5).subscribe({
      next: (reports) => {
        this.recentReports.set(reports);
        this.loadingRecentReports.set(false);
      },
      error: (err) => {
        console.error('Failed to load recent reports:', err);
        this.loadingRecentReports.set(false);
      }
    });
  }

  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      HR: '#1976d2',
      PAYROLL: '#2e7d32',
      RECRUITMENT: '#7b1fa2',
      STATUTORY: '#d32f2f',
      LEAVE: '#f57c00',
      FINANCIAL: '#00897b'
    };
    return colors[category] || '#546e7a';
  }

  getFormatIcon(format: string): string {
    return ReportsService.getFormatIcon(format as any);
  }

  downloadReport(report: ReportListItem): void {
    this.reportsService.getDownloadUrl(report.id).subscribe({
      next: (response) => {
        window.open(response.downloadUrl, '_blank');
      },
      error: (err) => {
        console.error('Failed to download report:', err);
      }
    });
  }
}
