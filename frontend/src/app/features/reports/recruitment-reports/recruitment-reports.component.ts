import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe, PercentPipe } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ReportsService,
  RecruitmentSummary,
  ReportListItem,
  ScheduleResponse,
  GenerateReportRequest,
  CreateScheduleRequest
} from '../../../core/services/reports.service';
import {
  AnalyticsCardComponent,
  ReportGeneratorComponent,
  ReportTypeOption,
  ReportListComponent,
  ScheduleFormComponent,
  ScheduleListComponent
} from '../components';

@Component({
  selector: 'app-recruitment-reports',
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    PercentPipe,
    MatTabsModule,
    MatButtonModule,
    MatSnackBarModule,
    TranslateModule,
    AnalyticsCardComponent,
    ReportGeneratorComponent,
    ReportListComponent,
    ScheduleFormComponent,
    ScheduleListComponent
  ],
  template: `
    <div class="space-y-6">
      <div class="sw-page-header">
        <div>
          <h1 class="sw-page-title">{{ 'reports.recruitment.title' | translate }}</h1>
          <p class="sw-page-description">{{ 'reports.recruitment.subtitle' | translate }}</p>
        </div>
      </div>

      <mat-tab-group animationDuration="200ms" class="sw-tabs">
        <!-- Overview Tab -->
        <mat-tab><ng-template mat-tab-label><span class="flex items-center gap-2"><span class="material-icons text-lg">insights</span>{{ 'reports.recruitment.tabs.overview' | translate }}</span></ng-template>
          <div class="pt-6 space-y-6">
            <!-- KPI Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <app-analytics-card
                [title]="'reports.recruitment.openPositions' | translate"
                [value]="recruitment()?.openPositions ?? 0"
                [subtitle]="'reports.recruitment.currentlyHiring' | translate"
                icon="work"
                iconColor="purple"
                [loading]="loadingAnalytics()"
              />
              <app-analytics-card
                [title]="'reports.recruitment.totalApplications' | translate"
                [value]="recruitment()?.totalApplications ?? 0"
                [subtitle]="'reports.recruitment.thisPeriod' | translate"
                icon="description"
                iconColor="info"
                [loading]="loadingAnalytics()"
              />
              <app-analytics-card
                [title]="'reports.recruitment.interviewsScheduled' | translate"
                [value]="recruitment()?.interviewsScheduled ?? 0"
                [subtitle]="'reports.recruitment.upcomingInterviews' | translate"
                icon="event"
                iconColor="orange"
                [loading]="loadingAnalytics()"
              />
              <app-analytics-card
                [title]="'reports.recruitment.hiresMade' | translate"
                [value]="recruitment()?.hiresMade ?? 0"
                [subtitle]="'reports.recruitment.thisPeriod' | translate"
                icon="person_add"
                iconColor="success"
                [loading]="loadingAnalytics()"
              />
            </div>

            <!-- Performance Metrics -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <app-analytics-card
                [title]="'reports.recruitment.avgDaysToHire' | translate"
                [value]="formatDays(recruitment()?.averageDaysToHire ?? 0)"
                [subtitle]="'reports.recruitment.timeToFill' | translate"
                icon="schedule"
                iconColor="cyan"
                [loading]="loadingAnalytics()"
              />
              <app-analytics-card
                [title]="'reports.recruitment.offerAcceptanceRate' | translate"
                [value]="formatPercent(recruitment()?.offerAcceptanceRatePercent ?? 0)"
                [subtitle]="'reports.recruitment.acceptedOffers' | translate"
                icon="thumb_up"
                iconColor="success"
                [loading]="loadingAnalytics()"
              />
              <app-analytics-card
                [title]="'reports.recruitment.offersExtended' | translate"
                [value]="recruitment()?.offersExtended ?? 0"
                [subtitle]="'reports.recruitment.thisPeriod' | translate"
                icon="local_offer"
                iconColor="info"
                [loading]="loadingAnalytics()"
              />
            </div>

            <!-- Pipeline & Source Analysis -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Source Effectiveness -->
              <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
                <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{{ 'reports.recruitment.applicationsBySource' | translate }}</h3>
                @if (loadingAnalytics()) {
                  <div class="space-y-3">
                    @for (i of [1, 2, 3, 4]; track i) {
                      <div class="animate-pulse h-8 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                    }
                  </div>
                } @else if (sourceData().length > 0) {
                  <div class="space-y-3">
                    @for (source of sourceData(); track source.name) {
                      <div>
                        <div class="flex justify-between text-sm mb-1">
                          <span class="text-neutral-700 dark:text-neutral-300">{{ source.name }}</span>
                          <span class="font-medium text-neutral-900 dark:text-neutral-100">{{ source.count }}</span>
                        </div>
                        <div class="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                          <div
                            class="bg-purple-600 h-2 rounded-full transition-all duration-300"
                            [style.width.%]="source.percent"
                          ></div>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <p class="text-neutral-500 text-center py-4">{{ 'reports.recruitment.noSourceData' | translate }}</p>
                }
              </div>

              <!-- Department Breakdown -->
              <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
                <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{{ 'reports.recruitment.hiringByDepartment' | translate }}</h3>
                @if (loadingAnalytics()) {
                  <div class="space-y-3">
                    @for (i of [1, 2, 3, 4]; track i) {
                      <div class="animate-pulse h-8 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                    }
                  </div>
                } @else if (departmentData().length > 0) {
                  <div class="space-y-3">
                    @for (dept of departmentData(); track dept.name) {
                      <div>
                        <div class="flex justify-between text-sm mb-1">
                          <span class="text-neutral-700 dark:text-neutral-300">{{ dept.name }}</span>
                          <span class="font-medium text-neutral-900 dark:text-neutral-100">{{ dept.count }}</span>
                        </div>
                        <div class="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                          <div
                            class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            [style.width.%]="dept.percent"
                          ></div>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <p class="text-neutral-500 text-center py-4">{{ 'reports.recruitment.noDepartmentData' | translate }}</p>
                }
              </div>
            </div>

            <!-- Monthly Trend -->
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
              <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{{ 'reports.recruitment.pipelineTrend' | translate }}</h3>
              @if (loadingAnalytics()) {
                <div class="animate-pulse h-40 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
              } @else if (pipelineTrendData().length > 0) {
                <div class="overflow-x-auto">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="border-b border-neutral-200 dark:border-dark-border">
                        <th class="text-left py-2 text-neutral-600 dark:text-neutral-400">{{ 'reports.recruitment.table.month' | translate }}</th>
                        <th class="text-right py-2 text-neutral-600 dark:text-neutral-400">{{ 'reports.recruitment.table.applications' | translate }}</th>
                        <th class="text-right py-2 text-neutral-600 dark:text-neutral-400">{{ 'reports.recruitment.table.interviews' | translate }}</th>
                        <th class="text-right py-2 text-neutral-600 dark:text-neutral-400">{{ 'reports.recruitment.table.offers' | translate }}</th>
                        <th class="text-right py-2 text-neutral-600 dark:text-neutral-400">{{ 'reports.recruitment.table.hires' | translate }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (row of pipelineTrendData(); track row.month) {
                        <tr class="border-b border-neutral-100 dark:border-dark-border">
                          <td class="py-2 text-neutral-900 dark:text-neutral-100">{{ row.month }}</td>
                          <td class="py-2 text-right text-blue-600">{{ row.applications }}</td>
                          <td class="py-2 text-right text-orange-600">{{ row.interviews }}</td>
                          <td class="py-2 text-right text-purple-600">{{ row.offers }}</td>
                          <td class="py-2 text-right text-green-600">{{ row.hires }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <p class="text-neutral-500 text-center py-4">{{ 'reports.recruitment.noTrendData' | translate }}</p>
              }
            </div>

            <!-- Funnel Visualization -->
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
              <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{{ 'reports.recruitment.funnel.title' | translate }}</h3>
              @if (loadingAnalytics()) {
                <div class="animate-pulse h-32 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
              } @else {
                <div class="flex items-end justify-center gap-4 h-40">
                  @for (stage of funnelData(); track stage.name) {
                    <div class="flex flex-col items-center">
                      <div
                        class="w-20 rounded-t-lg transition-all duration-300"
                        [style.height.px]="stage.height"
                        [style.background-color]="stage.color"
                      ></div>
                      <p class="text-xs text-neutral-500 mt-2 text-center">{{ stage.name }}</p>
                      <p class="text-sm font-bold text-neutral-900 dark:text-neutral-100">{{ stage.count }}</p>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </mat-tab>

        <!-- Generate Reports Tab -->
        <mat-tab><ng-template mat-tab-label><span class="flex items-center gap-2"><span class="material-icons text-lg">add_chart</span>{{ 'reports.recruitment.tabs.generate' | translate }}</span></ng-template>
          <div class="pt-6">
            <app-report-generator
              [reportTypes]="recruitmentReportTypes"
              [generating]="generatingReport()"
              (generate)="onGenerateReport($event)"
              (cancel)="onCancelGenerate()"
            />
          </div>
        </mat-tab>

        <!-- Report History Tab -->
        <mat-tab><ng-template mat-tab-label><span class="flex items-center gap-2"><span class="material-icons text-lg">history</span>{{ 'reports.recruitment.tabs.history' | translate }}</span></ng-template>
          <div class="pt-6">
            <app-report-list
              [title]="'reports.recruitment.history.title' | translate"
              [subtitle]="'reports.recruitment.history.subtitle' | translate"
              [reports]="reports()"
              [loading]="loadingReports()"
              [totalElements]="totalReports()"
              [pageSize]="reportsPageSize()"
              [pageIndex]="reportsPageIndex()"
              (download)="onDownloadReport($event)"
              (view)="onViewReport($event)"
              (retry)="onRetryReport($event)"
              (cancelReport)="onCancelReport($event)"
              (delete)="onDeleteReport($event)"
              (pageChange)="onReportsPageChange($event)"
            />
          </div>
        </mat-tab>

        <!-- Scheduled Reports Tab -->
        <mat-tab><ng-template mat-tab-label><span class="flex items-center gap-2"><span class="material-icons text-lg">schedule</span>{{ 'reports.recruitment.tabs.scheduled' | translate }}</span></ng-template>
          <div class="pt-6 space-y-6">
            @if (showScheduleForm()) {
              <app-schedule-form
                [reportTypes]="recruitmentReportTypes"
                [isEdit]="!!editingSchedule()"
                [schedule]="editingSchedule() ?? undefined"
                [saving]="savingSchedule()"
                (save)="onSaveSchedule($event)"
                (cancel)="onCancelScheduleForm()"
              />
            } @else {
              <app-schedule-list
                [schedules]="schedules()"
                [loading]="loadingSchedules()"
                [totalElements]="totalSchedules()"
                [pageSize]="schedulesPageSize()"
                [pageIndex]="schedulesPageIndex()"
                (create)="onCreateSchedule()"
                (edit)="onEditSchedule($event)"
                (toggleActive)="onToggleScheduleActive($event)"
                (runNow)="onRunScheduleNow($event)"
                (viewHistory)="onViewScheduleHistory($event)"
                (delete)="onDeleteSchedule($event)"
                (pageChange)="onSchedulesPageChange($event)"
              />
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    :host ::ng-deep .sw-tabs.mat-mdc-tab-group {
      --mat-tab-header-divider-color: transparent !important;
      --mat-tab-header-divider-height: 0 !important;
    }
    :host ::ng-deep .sw-tabs .mat-mdc-tab-header {
      border-bottom: none !important;
    }
    :host ::ng-deep .sw-tabs .mdc-tab-indicator {
      display: none !important;
    }
    :host ::ng-deep .sw-tabs .mat-mdc-tab-labels {
      gap: 8px;
    }
    :host ::ng-deep .sw-tabs .mat-mdc-tab {
      border-radius: 8px !important;
      min-width: auto !important;
      padding: 0 24px !important;
      height: 44px !important;
      border: 2px solid #0d9488 !important;
      background-color: transparent !important;
      transition: all 0.2s ease !important;
      opacity: 1 !important;
    }
    :host ::ng-deep .sw-tabs .mdc-tab__text-label {
      color: #0d9488 !important;
      transition: color 0.2s ease !important;
    }
    :host ::ng-deep .sw-tabs .mat-mdc-tab:not(.mdc-tab--active):hover {
      background-color: rgba(13, 148, 136, 0.1) !important;
    }
    :host ::ng-deep .sw-tabs .mat-mdc-tab.mdc-tab--active {
      background-color: #14b8a6 !important;
      border-color: #14b8a6 !important;
    }
    :host ::ng-deep .sw-tabs .mdc-tab--active .mdc-tab__text-label {
      color: white !important;
    }
    :host ::ng-deep .sw-tabs .mat-mdc-tab .mat-ripple,
    :host ::ng-deep .sw-tabs .mat-mdc-tab-ripple {
      display: none !important;
    }
    :host-context(.dark) ::ng-deep .sw-tabs .mat-mdc-tab {
      border-color: #2dd4bf !important;
      background-color: transparent !important;
    }
    :host-context(.dark) ::ng-deep .sw-tabs .mdc-tab__text-label {
      color: #2dd4bf !important;
    }
    :host-context(.dark) ::ng-deep .sw-tabs .mat-mdc-tab:not(.mdc-tab--active):hover {
      background-color: rgba(45, 212, 191, 0.1) !important;
    }
    :host-context(.dark) ::ng-deep .sw-tabs .mat-mdc-tab.mdc-tab--active {
      background-color: #14b8a6 !important;
      border-color: #14b8a6 !important;
    }
    :host-context(.dark) ::ng-deep .sw-tabs .mdc-tab--active .mdc-tab__text-label {
      color: white !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecruitmentReportsComponent implements OnInit {
  private readonly reportsService = inject(ReportsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly userId = '00000000-0000-0000-0000-000000000100'; // Dev user

  // Analytics state
  loadingAnalytics = signal(true);
  recruitment = signal<RecruitmentSummary | null>(null);

  // Reports state
  loadingReports = signal(false);
  generatingReport = signal(false);
  reports = signal<ReportListItem[]>([]);
  totalReports = signal(0);
  reportsPageSize = signal(10);
  reportsPageIndex = signal(0);

  // Schedules state
  loadingSchedules = signal(false);
  savingSchedule = signal(false);
  showScheduleForm = signal(false);
  editingSchedule = signal<ScheduleResponse | null>(null);
  schedules = signal<ScheduleResponse[]>([]);
  totalSchedules = signal(0);
  schedulesPageSize = signal(10);
  schedulesPageIndex = signal(0);

  // Computed data
  sourceData = computed(() => {
    const data = this.recruitment()?.applicationsBySource ?? {};
    const total = Object.values(data).reduce((sum, count) => sum + count, 0);
    return Object.entries(data)
      .map(([name, count]) => ({
        name,
        count,
        percent: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  });

  departmentData = computed(() => {
    const data = this.recruitment()?.byDepartment ?? {};
    const total = Object.values(data).reduce((sum, count) => sum + count, 0);
    return Object.entries(data)
      .map(([name, count]) => ({
        name,
        count,
        percent: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  });

  pipelineTrendData = computed(() => {
    return this.recruitment()?.monthlyTrend ?? [];
  });

  funnelData = computed(() => {
    const r = this.recruitment();
    if (!r) return [];

    const maxCount = Math.max(r.totalApplications || 1, 1);
    return [
      { name: this.translate.instant('reports.recruitment.funnel.applications'), count: r.totalApplications, height: 140, color: '#1976d2' },
      { name: this.translate.instant('reports.recruitment.funnel.interviews'), count: r.interviewsScheduled, height: (r.interviewsScheduled / maxCount) * 140 || 20, color: '#f57c00' },
      { name: this.translate.instant('reports.recruitment.funnel.offers'), count: r.offersExtended, height: (r.offersExtended / maxCount) * 140 || 20, color: '#7b1fa2' },
      { name: this.translate.instant('reports.recruitment.funnel.hires'), count: r.hiresMade, height: (r.hiresMade / maxCount) * 140 || 20, color: '#2e7d32' }
    ];
  });

  // Recruitment Report Types
  recruitmentReportTypes: ReportTypeOption[] = [];

  private initReportTypes(): void {
    this.recruitmentReportTypes = [
      { value: 'RECRUITMENT_PIPELINE', label: this.translate.instant('reports.recruitment.reportTypes.pipeline.label'), description: this.translate.instant('reports.recruitment.reportTypes.pipeline.description') },
      { value: 'TIME_TO_HIRE', label: this.translate.instant('reports.recruitment.reportTypes.timeToHire.label'), description: this.translate.instant('reports.recruitment.reportTypes.timeToHire.description') },
      { value: 'SOURCE_EFFECTIVENESS', label: this.translate.instant('reports.recruitment.reportTypes.sourceEffectiveness.label'), description: this.translate.instant('reports.recruitment.reportTypes.sourceEffectiveness.description') },
      { value: 'OFFER_ACCEPTANCE', label: this.translate.instant('reports.recruitment.reportTypes.offerAcceptance.label'), description: this.translate.instant('reports.recruitment.reportTypes.offerAcceptance.description') }
    ];
  }

  ngOnInit(): void {
    this.initReportTypes();
    this.loadAnalytics();
    this.loadReports();
    this.loadSchedules();
  }

  // === Data Loading ===

  private loadAnalytics(): void {
    this.loadingAnalytics.set(true);

    this.reportsService.getRecruitmentSummary().subscribe({
      next: (data) => {
        this.recruitment.set(data);
        this.loadingAnalytics.set(false);
      },
      error: (err) => {
        console.error('Failed to load recruitment analytics:', err);
        this.loadingAnalytics.set(false);
        this.showError(this.translate.instant('reports.recruitment.messages.loadAnalyticsFailed'));
      }
    });
  }

  private loadReports(): void {
    this.loadingReports.set(true);

    this.reportsService.searchReports(
      this.reportsPageIndex(),
      this.reportsPageSize(),
      'RECRUITMENT'
    ).subscribe({
      next: (response) => {
        this.reports.set(response.content);
        this.totalReports.set(response.totalElements);
        this.loadingReports.set(false);
      },
      error: (err) => {
        console.error('Failed to load reports:', err);
        this.loadingReports.set(false);
        this.showError(this.translate.instant('reports.recruitment.messages.loadReportsFailed'));
      }
    });
  }

  private loadSchedules(): void {
    this.loadingSchedules.set(true);

    this.reportsService.listSchedules(
      this.schedulesPageIndex(),
      this.schedulesPageSize()
    ).subscribe({
      next: (response) => {
        const recruitmentSchedules = response.content.filter(s =>
          this.recruitmentReportTypes.some(rt => rt.value === s.reportType)
        );
        this.schedules.set(recruitmentSchedules);
        this.totalSchedules.set(recruitmentSchedules.length);
        this.loadingSchedules.set(false);
      },
      error: (err) => {
        console.error('Failed to load schedules:', err);
        this.loadingSchedules.set(false);
        this.showError(this.translate.instant('reports.recruitment.messages.loadSchedulesFailed'));
      }
    });
  }

  // === Utility Methods ===

  formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  formatDays(value: number): string {
    const daysLabel = this.translate.instant('reports.recruitment.days');
    return `${value.toFixed(0)} ${daysLabel}`;
  }

  private showError(message: string): void {
    this.snackBar.open(message, this.translate.instant('common.close'), {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, this.translate.instant('common.close'), {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  // === Report Generation Handlers ===

  onGenerateReport(request: GenerateReportRequest): void {
    this.generatingReport.set(true);

    this.reportsService.generateReport(request, this.userId).subscribe({
      next: (response) => {
        this.generatingReport.set(false);
        this.showSuccess(this.translate.instant('reports.recruitment.messages.reportGenerated'));
        this.loadReports();

        if (response.status === 'COMPLETED') {
          this.downloadReport(response.id);
        }
      },
      error: (err) => {
        console.error('Failed to generate report:', err);
        this.generatingReport.set(false);
        this.showError(this.translate.instant('reports.recruitment.messages.generateFailed'));
      }
    });
  }

  onCancelGenerate(): void {
    // Reset form - handled by component
  }

  // === Report List Handlers ===

  onDownloadReport(report: ReportListItem): void {
    this.downloadReport(report.id);
  }

  private downloadReport(reportId: string): void {
    this.reportsService.getDownloadUrl(reportId).subscribe({
      next: (response) => {
        window.open(response.downloadUrl, '_blank');
      },
      error: (err) => {
        console.error('Failed to get download URL:', err);
        this.showError(this.translate.instant('reports.recruitment.messages.downloadFailed'));
      }
    });
  }

  onViewReport(report: ReportListItem): void {
    console.log('View report:', report);
  }

  onRetryReport(report: ReportListItem): void {
    this.reportsService.retryReport(report.id).subscribe({
      next: () => {
        this.showSuccess(this.translate.instant('reports.recruitment.messages.retryStarted'));
        this.loadReports();
      },
      error: (err) => {
        console.error('Failed to retry report:', err);
        this.showError(this.translate.instant('reports.recruitment.messages.retryFailed'));
      }
    });
  }

  onCancelReport(report: ReportListItem): void {
    this.reportsService.cancelReport(report.id).subscribe({
      next: () => {
        this.showSuccess(this.translate.instant('reports.recruitment.messages.reportCancelled'));
        this.loadReports();
      },
      error: (err) => {
        console.error('Failed to cancel report:', err);
        this.showError(this.translate.instant('reports.recruitment.messages.cancelFailed'));
      }
    });
  }

  onDeleteReport(report: ReportListItem): void {
    if (!confirm(this.translate.instant('reports.recruitment.messages.confirmDeleteReport'))) return;

    this.reportsService.deleteReport(report.id).subscribe({
      next: () => {
        this.showSuccess(this.translate.instant('reports.recruitment.messages.reportDeleted'));
        this.loadReports();
      },
      error: (err) => {
        console.error('Failed to delete report:', err);
        this.showError(this.translate.instant('reports.recruitment.messages.deleteFailed'));
      }
    });
  }

  onReportsPageChange(event: PageEvent): void {
    this.reportsPageIndex.set(event.pageIndex);
    this.reportsPageSize.set(event.pageSize);
    this.loadReports();
  }

  // === Schedule Handlers ===

  onCreateSchedule(): void {
    this.editingSchedule.set(null);
    this.showScheduleForm.set(true);
  }

  onEditSchedule(schedule: ScheduleResponse): void {
    this.editingSchedule.set(schedule);
    this.showScheduleForm.set(true);
  }

  onCancelScheduleForm(): void {
    this.showScheduleForm.set(false);
    this.editingSchedule.set(null);
  }

  onSaveSchedule(request: CreateScheduleRequest): void {
    this.savingSchedule.set(true);

    const editing = this.editingSchedule();

    if (editing) {
      this.reportsService.updateSchedule(editing.id, request).subscribe({
        next: () => {
          this.savingSchedule.set(false);
          this.showScheduleForm.set(false);
          this.editingSchedule.set(null);
          this.showSuccess(this.translate.instant('reports.recruitment.messages.scheduleUpdated'));
          this.loadSchedules();
        },
        error: (err) => {
          console.error('Failed to update schedule:', err);
          this.savingSchedule.set(false);
          this.showError(this.translate.instant('reports.recruitment.messages.updateScheduleFailed'));
        }
      });
    } else {
      this.reportsService.createSchedule(request, this.userId).subscribe({
        next: () => {
          this.savingSchedule.set(false);
          this.showScheduleForm.set(false);
          this.showSuccess(this.translate.instant('reports.recruitment.messages.scheduleCreated'));
          this.loadSchedules();
        },
        error: (err) => {
          console.error('Failed to create schedule:', err);
          this.savingSchedule.set(false);
          this.showError(this.translate.instant('reports.recruitment.messages.createScheduleFailed'));
        }
      });
    }
  }

  onToggleScheduleActive(schedule: ScheduleResponse): void {
    const action = schedule.active
      ? this.reportsService.deactivateSchedule(schedule.id)
      : this.reportsService.activateSchedule(schedule.id);

    action.subscribe({
      next: () => {
        this.showSuccess(schedule.active
          ? this.translate.instant('reports.recruitment.messages.scheduleDeactivated')
          : this.translate.instant('reports.recruitment.messages.scheduleActivated'));
        this.loadSchedules();
      },
      error: (err) => {
        console.error('Failed to toggle schedule:', err);
        this.showError(this.translate.instant('reports.recruitment.messages.toggleScheduleFailed'));
      }
    });
  }

  onRunScheduleNow(schedule: ScheduleResponse): void {
    this.reportsService.runScheduleNow(schedule.id, this.userId).subscribe({
      next: () => {
        this.showSuccess(this.translate.instant('reports.recruitment.messages.generationStarted'));
        this.loadReports();
      },
      error: (err) => {
        console.error('Failed to run schedule:', err);
        this.showError(this.translate.instant('reports.recruitment.messages.runScheduleFailed'));
      }
    });
  }

  onViewScheduleHistory(schedule: ScheduleResponse): void {
    console.log('View schedule history:', schedule);
  }

  onDeleteSchedule(schedule: ScheduleResponse): void {
    if (!confirm(this.translate.instant('reports.recruitment.messages.confirmDeleteSchedule'))) return;

    this.reportsService.deleteSchedule(schedule.id).subscribe({
      next: () => {
        this.showSuccess(this.translate.instant('reports.recruitment.messages.scheduleDeleted'));
        this.loadSchedules();
      },
      error: (err) => {
        console.error('Failed to delete schedule:', err);
        this.showError(this.translate.instant('reports.recruitment.messages.deleteScheduleFailed'));
      }
    });
  }

  onSchedulesPageChange(event: PageEvent): void {
    this.schedulesPageIndex.set(event.pageIndex);
    this.schedulesPageSize.set(event.pageSize);
    this.loadSchedules();
  }
}
