import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  RecruitmentService,
  RecruitmentDashboard,
  JobPostingSummary,
  Interview,
  PipelineStage
} from '../../../core/services/recruitment.service';
import { SpinnerComponent } from '@shared/ui';

@Component({
  selector: 'app-recruitment-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    SpinnerComponent,
    DatePipe
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="sw-page-header">
        <div class="flex items-center gap-3">
          <span class="material-icons text-3xl text-primary-500">diversity_3</span>
          <div>
            <h1 class="sw-page-title">{{ 'recruitment.title' | translate }}</h1>
            <p class="sw-page-description">{{ 'recruitment.dashboardPage.subtitle' | translate }}</p>
          </div>
        </div>
        <div class="flex gap-3">
          <a routerLink="/recruitment/candidates" class="sw-btn sw-btn-outline sw-btn-md">
            <span class="material-icons text-lg">people</span>
            {{ 'recruitment.candidates' | translate }}
          </a>
          <a routerLink="/recruitment/jobs/new" class="sw-btn sw-btn-primary sw-btn-md">
            <span class="material-icons text-lg">add</span>
            {{ 'recruitment.dashboardPage.postJob' | translate }}
          </a>
          <a routerLink="/recruitment/candidates/new" class="sw-btn sw-btn-primary sw-btn-md bg-accent-500 hover:bg-accent-600">
            <span class="material-icons text-lg">person_add</span>
            {{ 'recruitment.candidate.addCandidate' | translate }}
          </a>
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center items-center py-24">
          <sw-spinner size="lg" />
        </div>
      } @else if (error()) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <span class="material-icons text-5xl text-error-500 mb-4">error</span>
          <p class="text-neutral-600 dark:text-neutral-400 mb-4">{{ error() }}</p>
          <button (click)="loadDashboard()" class="px-4 py-2 text-primary-500 hover:text-primary-600 font-medium">{{ 'common.retry' | translate }}</button>
        </div>
      } @else {
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
                <span class="material-icons text-white text-2xl">work</span>
              </div>
              <div>
                <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{{ dashboard()?.openJobs || 0 }}</p>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'recruitment.dashboardPage.stats.openJobs' | translate }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                <span class="material-icons text-white text-2xl">people</span>
              </div>
              <div>
                <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{{ dashboard()?.totalApplications || 0 }}</p>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'recruitment.dashboardPage.stats.totalApplications' | translate }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <span class="material-icons text-white text-2xl">event</span>
              </div>
              <div>
                <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{{ dashboard()?.interviewsThisWeek || 0 }}</p>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'recruitment.dashboardPage.stats.interviewsThisWeek' | translate }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                <span class="material-icons text-white text-2xl">local_offer</span>
              </div>
              <div>
                <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{{ dashboard()?.offersPending || 0 }}</p>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'recruitment.dashboardPage.stats.pendingOffers' | translate }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Pipeline and Interviews -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Pipeline Overview -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
            <div class="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-dark-border">
              <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ 'recruitment.dashboardPage.pipelineOverview' | translate }}</h3>
            </div>
            <div class="p-4">
              @if (dashboard()?.pipeline?.length) {
                <div class="flex items-end justify-around h-48">
                  @for (stage of dashboard()!.pipeline; track stage.stage) {
                    <div class="flex flex-col items-center flex-1">
                      <div class="w-10 rounded-t transition-all duration-300 bg-gradient-to-t from-purple-700 to-violet-500 flex items-start justify-center pt-1"
                           [style.height.%]="getBarHeight(stage.count)">
                        <span class="text-white text-xs font-semibold">{{ stage.count }}</span>
                      </div>
                      <span class="text-xs text-neutral-500 dark:text-neutral-400 mt-2 text-center max-w-[60px] truncate">{{ stage.stageName }}</span>
                    </div>
                  }
                </div>
              } @else {
                <div class="flex flex-col items-center py-12 text-neutral-400">
                  <span class="material-icons text-5xl mb-4 opacity-50">analytics</span>
                  <p>{{ 'recruitment.dashboardPage.noPipelineData' | translate }}</p>
                </div>
              }
            </div>
          </div>

          <!-- Upcoming Interviews -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
            <div class="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-dark-border">
              <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ 'recruitment.dashboardPage.upcomingInterviews' | translate }}</h3>
              <a routerLink="/recruitment/interviews" class="text-primary-500 hover:text-primary-600 text-sm font-medium">{{ 'common.viewAll' | translate }}</a>
            </div>
            <div class="p-4">
              @if (dashboard()?.upcomingInterviews?.length) {
                <div class="space-y-0 divide-y divide-neutral-100 dark:divide-dark-border">
                  @for (interview of dashboard()!.upcomingInterviews.slice(0, 5); track interview.id) {
                    <div class="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div class="flex flex-col">
                        <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ interview.candidateName }}</span>
                        <span class="text-sm text-neutral-500 dark:text-neutral-400">{{ interview.jobTitle }}</span>
                      </div>
                      <div class="flex flex-col items-end gap-1">
                        <span class="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                              [style.background]="getInterviewTypeColor(interview.interviewType).background"
                              [style.color]="getInterviewTypeColor(interview.interviewType).color">
                          {{ getInterviewTypeLabel(interview.interviewType) }}
                        </span>
                        <span class="text-xs text-neutral-500 dark:text-neutral-400">{{ interview.scheduledAt | date:'MMM d, h:mm a' }}</span>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="flex flex-col items-center py-12 text-neutral-400">
                  <span class="material-icons text-5xl mb-4 opacity-50">event_available</span>
                  <p>{{ 'recruitment.dashboardPage.noUpcomingInterviews' | translate }}</p>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Recent Job Postings -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          <div class="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-dark-border">
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ 'recruitment.dashboardPage.recentJobPostings' | translate }}</h3>
            <a routerLink="/recruitment/jobs" class="text-primary-500 hover:text-primary-600 text-sm font-medium">{{ 'recruitment.dashboardPage.viewAllJobs' | translate }}</a>
          </div>
          @if (dashboard()?.recentJobs?.length) {
            <div class="overflow-x-auto">
              <table class="sw-table">
                <thead>
                  <tr>
                    <th>{{ 'recruitment.dashboardPage.table.title' | translate }}</th>
                    <th>{{ 'recruitment.dashboardPage.table.department' | translate }}</th>
                    <th>{{ 'recruitment.dashboardPage.table.status' | translate }}</th>
                    <th>{{ 'recruitment.dashboardPage.table.applications' | translate }}</th>
                    <th>{{ 'recruitment.dashboardPage.table.closingDate' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (job of dashboard()!.recentJobs; track job.id) {
                    <tr class="cursor-pointer hover:bg-neutral-50 dark:hover:bg-dark-elevated" [routerLink]="['/recruitment/jobs', job.id]">
                      <td>
                        <a [routerLink]="['/recruitment/jobs', job.id]" class="text-primary-500 hover:text-primary-600 font-medium">
                          {{ job.title }}
                        </a>
                      </td>
                      <td class="text-neutral-600 dark:text-neutral-400">{{ job.departmentName || '-' }}</td>
                      <td>
                        <span class="inline-block px-3 py-1 rounded-full text-xs font-medium"
                              [style.background]="getJobStatusColor(job.status).background"
                              [style.color]="getJobStatusColor(job.status).color">
                          {{ getJobStatusLabel(job.status) }}
                        </span>
                      </td>
                      <td>{{ job.applicationCount }}</td>
                      <td class="text-neutral-600 dark:text-neutral-400">{{ job.closingDate | date:'mediumDate' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="p-12 text-center">
              <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">work_off</span>
              <p class="text-neutral-500 dark:text-neutral-400 mb-4">{{ 'recruitment.dashboardPage.noJobPostings' | translate }}</p>
              <a routerLink="/recruitment/jobs/new" class="sw-btn sw-btn-primary sw-btn-md">
                {{ 'recruitment.dashboardPage.postJob' | translate }}
              </a>
            </div>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecruitmentDashboardComponent implements OnInit {
  private readonly recruitmentService = inject(RecruitmentService);

  dashboard = signal<RecruitmentDashboard | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  jobColumns = ['title', 'department', 'status', 'applications', 'closingDate'];

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    this.recruitmentService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load dashboard', err);
        this.error.set('Failed to load recruitment dashboard. Please try again.');
        this.loading.set(false);
      }
    });
  }

  getBarHeight(count: number): number {
    const maxCount = Math.max(...(this.dashboard()?.pipeline?.map(s => s.count) || [1]));
    return Math.max(20, (count / maxCount) * 100);
  }

  getJobStatusLabel(status: string): string {
    return RecruitmentService.getJobStatusLabel(status as any);
  }

  getJobStatusColor(status: string): { background: string; color: string } {
    return RecruitmentService.getJobStatusColor(status as any);
  }

  getInterviewTypeLabel(type: string): string {
    return RecruitmentService.getInterviewTypeLabel(type as any);
  }

  getInterviewTypeColor(type: string): { background: string; color: string } {
    // Using stage colors for interview types
    const colors: Record<string, { background: string; color: string }> = {
      PHONE_SCREEN: { background: '#fce4ec', color: '#c2185b' },
      VIDEO_CALL: { background: '#e3f2fd', color: '#1565c0' },
      IN_PERSON: { background: '#e8f5e9', color: '#2e7d32' },
      TECHNICAL: { background: '#f3e5f5', color: '#6a1b9a' },
      BEHAVIORAL: { background: '#fff3e0', color: '#f57c00' },
      PANEL: { background: '#e1bee7', color: '#4a148c' },
      GROUP: { background: '#d1c4e9', color: '#311b92' },
      CASE_STUDY: { background: '#c5cae9', color: '#283593' },
      FINAL: { background: '#c8e6c9', color: '#1b5e20' }
    };
    return colors[type] || { background: '#eceff1', color: '#546e7a' };
  }
}
