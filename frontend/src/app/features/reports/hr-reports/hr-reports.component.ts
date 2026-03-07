import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe, PercentPipe, DatePipe } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import {
  ReportsService,
  HeadcountSummary,
  DemographicsSummary,
  TurnoverAnalysis,
  ReportListItem,
  ScheduleResponse,
  GenerateReportRequest,
  CreateScheduleRequest,
  ReportType
} from '../../../core/services/reports.service';
import {
  AnalyticsCardComponent,
  ReportGeneratorComponent,
  ReportTypeOption,
  ReportListComponent,
  ScheduleFormComponent,
  ScheduleListComponent,
  QuickActionButtonComponent,
  StatMiniCardComponent
} from '../components';
import { ApexDonutChartComponent, DonutSegment } from '@shared/ui';

@Component({
  selector: 'app-hr-reports',
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    PercentPipe,
    DatePipe,
    MatTabsModule,
    MatButtonModule,
    MatSnackBarModule,
    TranslateModule,
    AnalyticsCardComponent,
    ReportGeneratorComponent,
    ReportListComponent,
    ScheduleFormComponent,
    ScheduleListComponent,
    QuickActionButtonComponent,
    ApexDonutChartComponent,
    StatMiniCardComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Page Header with Action -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ 'reports.hr.title' | translate }}</h1>
          <p class="text-neutral-500 dark:text-neutral-400 mt-1">
            {{ 'reports.hr.subtitle' | translate }}
            @if (lastUpdated()) {
              <span class="text-neutral-400 dark:text-neutral-500"> &bull; {{ 'reports.hr.updated' | translate }} {{ lastUpdated() | date:'short' }}</span>
            }
          </p>
        </div>
        <app-quick-action-button
          [label]="'reports.hr.generateButton' | translate"
          icon="add_chart"
          variant="blue"
          (actionClick)="scrollToGenerate()"
        />
      </div>

      <!-- Tab Navigation with Icons -->
      <mat-tab-group
        animationDuration="200ms"
        class="sw-tabs"
        [(selectedIndex)]="selectedTabIndex"
      >
        <!-- Overview Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <span class="flex items-center gap-2">
              <span class="material-icons text-lg">insights</span>
              {{ 'reports.hr.overviewTab' | translate }}
            </span>
          </ng-template>

          <div class="pt-6 space-y-6">
            <!-- Hero KPI Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <app-analytics-card
                [title]="'reports.hr.totalHeadcount' | translate"
                [value]="headcount()?.totalHeadcount ?? 0"
                [subtitle]="'reports.hr.allEmployees' | translate"
                icon="people"
                iconColor="info"
                variant="highlight"
                size="md"
                [loading]="loadingAnalytics()"
              />
              <app-analytics-card
                [title]="'reports.hr.activeEmployees' | translate"
                [value]="headcount()?.activeEmployees ?? 0"
                [subtitle]="'reports.hr.onLeavePrefix' | translate: {count: headcount()?.onLeave ?? 0}"
                icon="badge"
                iconColor="success"
                [loading]="loadingAnalytics()"
              />
              <app-analytics-card
                [title]="'reports.hr.onProbation' | translate"
                [value]="headcount()?.onProbation ?? 0"
                [subtitle]="'reports.hr.newEmployees' | translate"
                icon="hourglass_empty"
                iconColor="warning"
                [loading]="loadingAnalytics()"
              />
              <app-analytics-card
                [title]="'reports.hr.turnoverRate' | translate"
                [value]="formatPercent(turnover()?.turnoverRatePercent ?? 0)"
                [trend]="getTurnoverTrend()"
                [trendValue]="getTurnoverTrendValue()"
                icon="swap_vert"
                iconColor="purple"
                [loading]="loadingAnalytics()"
              />
            </div>

            <!-- Quick Actions Bar -->
            <div class="bg-white dark:bg-dark-surface rounded-2xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">{{ 'reports.hr.quickReports' | translate }}</h3>
                  <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'reports.hr.quickReportsDescription' | translate }}</p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <app-quick-action-button
                    [label]="'reports.hr.headcountButton' | translate"
                    icon="people"
                    variant="blue"
                    size="sm"
                    (actionClick)="quickGenerate('HEADCOUNT')"
                  />
                  <app-quick-action-button
                    [label]="'reports.hr.turnoverButton' | translate"
                    icon="trending_down"
                    variant="purple"
                    size="sm"
                    (actionClick)="quickGenerate('TURNOVER')"
                  />
                  <app-quick-action-button
                    [label]="'reports.hr.demographicsButton' | translate"
                    icon="pie_chart"
                    variant="green"
                    size="sm"
                    (actionClick)="quickGenerate('DEMOGRAPHICS')"
                  />
                </div>
              </div>
            </div>

            <!-- Monthly Stats -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <app-analytics-card
                [title]="'reports.hr.newHiresThisMonth' | translate"
                [value]="headcount()?.newHiresThisMonth ?? 0"
                [subtitle]="'reports.hr.newEmployeesJoined' | translate"
                icon="person_add"
                iconColor="success"
                [trend]="getHiresTrend()"
                [trendValue]="getHiresTrendValue()"
                [loading]="loadingAnalytics()"
              />
              <app-analytics-card
                [title]="'reports.hr.terminationsThisMonth' | translate"
                [value]="headcount()?.terminationsThisMonth ?? 0"
                [subtitle]="'reports.hr.employeesLeft' | translate"
                icon="person_remove"
                iconColor="error"
                [loading]="loadingAnalytics()"
              />
            </div>

            <!-- Two-Column Analytics -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Department Distribution with Donut Chart -->
              <div class="bg-white dark:bg-dark-surface rounded-2xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
                <div class="flex items-center justify-between mb-6">
                  <div>
                    <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{{ 'reports.hr.departmentDistribution' | translate }}</h3>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'reports.hr.departmentDistributionDesc' | translate }}</p>
                  </div>
                  <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span class="material-icons text-blue-600 dark:text-blue-400">domain</span>
                  </div>
                </div>

                @if (loadingAnalytics()) {
                  <div class="flex justify-center py-8">
                    <div class="w-32 h-32 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse"></div>
                  </div>
                } @else if (departmentChartData().length > 0) {
                  <div class="flex flex-col items-center">
                    <app-apex-donut-chart
                      [segments]="departmentChartData()"
                      [size]="180"
                      [centerLabel]="'reports.hr.total' | translate"
                      [showLegend]="true"
                      [legendColumns]="1"
                    />
                  </div>
                } @else {
                  <div class="text-center py-8">
                    <span class="material-icons text-4xl text-neutral-300 dark:text-neutral-600">pie_chart</span>
                    <p class="text-neutral-500 mt-2">{{ 'reports.hr.noDepartmentData' | translate }}</p>
                  </div>
                }
              </div>

              <!-- Gender Distribution & Demographics -->
              <div class="bg-white dark:bg-dark-surface rounded-2xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
                <div class="flex items-center justify-between mb-6">
                  <div>
                    <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{{ 'reports.hr.demographicsOverview' | translate }}</h3>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'reports.hr.workforceComposition' | translate }}</p>
                  </div>
                  <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <span class="material-icons text-purple-600 dark:text-purple-400">diversity_3</span>
                  </div>
                </div>

                @if (loadingAnalytics()) {
                  <div class="space-y-4">
                    @for (i of [1, 2, 3, 4]; track i) {
                      <div class="animate-pulse h-14 bg-neutral-200 dark:bg-neutral-700 rounded-xl"></div>
                    }
                  </div>
                } @else {
                  <div class="space-y-4">
                    <!-- Gender Distribution Donut -->
                    @if (genderChartData().length > 0) {
                      <div class="flex items-center justify-center pb-4">
                        <app-apex-donut-chart
                          [segments]="genderChartData()"
                          [size]="120"
                          centerLabel=""
                          [showLegend]="false"
                        />
                        <div class="ml-6 space-y-2">
                          @for (gender of genderChartData(); track gender.label) {
                            <div class="flex items-center gap-2">
                              <div class="w-3 h-3 rounded-full" [style.background-color]="gender.color"></div>
                              <span class="text-sm text-neutral-600 dark:text-neutral-400">{{ gender.label }}</span>
                              <span class="font-semibold text-neutral-900 dark:text-neutral-100">{{ gender.value }}</span>
                            </div>
                          }
                        </div>
                      </div>
                    }

                    <!-- Key Stats -->
                    <div class="grid grid-cols-2 gap-3 pt-4 border-t border-neutral-200 dark:border-dark-border">
                      <app-stat-mini-card
                        [label]="'reports.hr.averageAge' | translate"
                        [value]="formatDecimal(demographics()?.averageAge ?? 0)"
                        [suffix]="'reports.hr.years' | translate"
                        icon="cake"
                        iconColor="warning"
                      />
                      <app-stat-mini-card
                        [label]="'reports.hr.averageTenure' | translate"
                        [value]="formatDecimal(demographics()?.averageTenureYears ?? 0)"
                        [suffix]="'reports.hr.years' | translate"
                        icon="work_history"
                        iconColor="info"
                      />
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Turnover Trend Visual -->
            <div class="bg-white dark:bg-dark-surface rounded-2xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{{ 'reports.hr.turnoverTrend' | translate }}</h3>
                  <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'reports.hr.turnoverTrendDesc' | translate }}</p>
                </div>
                <div class="flex items-center gap-4">
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full bg-green-500"></div>
                    <span class="text-sm text-neutral-600 dark:text-neutral-400">{{ 'reports.hr.hires' | translate }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full bg-red-500"></div>
                    <span class="text-sm text-neutral-600 dark:text-neutral-400">{{ 'reports.hr.terminations' | translate }}</span>
                  </div>
                </div>
              </div>

              @if (loadingAnalytics()) {
                <div class="animate-pulse h-48 bg-neutral-200 dark:bg-neutral-700 rounded-xl"></div>
              } @else if (turnoverTrendData().length > 0) {
                <!-- Visual Bar Chart -->
                <div class="space-y-4">
                  @for (row of turnoverTrendData(); track row.month) {
                    <div class="flex items-center gap-4">
                      <span class="w-20 text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate">{{ row.month }}</span>
                      <div class="flex-1 flex items-center gap-2">
                        <!-- Hires bar -->
                        <div class="flex-1 h-8 bg-neutral-100 dark:bg-dark-border rounded-lg overflow-hidden relative">
                          <div
                            class="absolute left-0 top-0 h-full w-full origin-left bg-gradient-to-r from-green-400 to-green-500 rounded-lg progress-bar flex items-center justify-end pr-2"
                            [style.transform]="'scaleX(' + getBarWidth(row.hires) / 100 + ')'"
                          >
                            @if (row.hires > 0) {
                              <span class="text-xs font-medium text-white">+{{ row.hires }}</span>
                            }
                          </div>
                        </div>
                        <!-- Terminations bar -->
                        <div class="flex-1 h-8 bg-neutral-100 dark:bg-dark-border rounded-lg overflow-hidden relative">
                          <div
                            class="absolute left-0 top-0 h-full w-full origin-left bg-gradient-to-r from-red-400 to-red-500 rounded-lg progress-bar flex items-center justify-end pr-2"
                            [style.transform]="'scaleX(' + getBarWidth(row.terminations) / 100 + ')'"
                          >
                            @if (row.terminations > 0) {
                              <span class="text-xs font-medium text-white">-{{ row.terminations }}</span>
                            }
                          </div>
                        </div>
                      </div>
                      <span class="w-16 text-right text-sm font-medium" [class]="getTurnoverRateClass(row.turnoverRate)">
                        {{ row.turnoverRate | number:'1.1-1' }}%
                      </span>
                    </div>
                  }
                </div>
              } @else {
                <div class="text-center py-8">
                  <span class="material-icons text-4xl text-neutral-300 dark:text-neutral-600">show_chart</span>
                  <p class="text-neutral-500 mt-2">{{ 'reports.hr.noTurnoverData' | translate }}</p>
                </div>
              }
            </div>
          </div>
        </mat-tab>

        <!-- Generate Reports Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <span class="flex items-center gap-2">
              <span class="material-icons text-lg">add_chart</span>
              {{ 'reports.hr.generateReportsTab' | translate }}
            </span>
          </ng-template>

          <div class="pt-6" #generateSection>
            <app-report-generator
              [reportTypes]="hrReportTypes"
              [generating]="generatingReport()"
              (generate)="onGenerateReport($event)"
              (cancel)="onCancelGenerate()"
            />
          </div>
        </mat-tab>

        <!-- Report History Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <span class="flex items-center gap-2">
              <span class="material-icons text-lg">history</span>
              {{ 'reports.hr.historyTab' | translate }}
              @if (totalReports() > 0) {
                <span class="ml-1 px-1.5 py-0.5 text-xs font-medium rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400">
                  {{ totalReports() }}
                </span>
              }
            </span>
          </ng-template>

          <div class="pt-6">
            <app-report-list
              [title]="'reports.hr.reportHistoryTitle' | translate"
              [subtitle]="'reports.hr.reportHistorySubtitle' | translate"
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
        <mat-tab>
          <ng-template mat-tab-label>
            <span class="flex items-center gap-2">
              <span class="material-icons text-lg">schedule</span>
              {{ 'reports.hr.scheduledTab' | translate }}
              @if (totalSchedules() > 0) {
                <span class="ml-1 px-1.5 py-0.5 text-xs font-medium rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400">
                  {{ totalSchedules() }}
                </span>
              }
            </span>
          </ng-template>

          <div class="pt-6 space-y-6">
            @if (showScheduleForm()) {
              <app-schedule-form
                [reportTypes]="hrReportTypes"
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
    /* Remove all Material tab dividers/lines */
    :host ::ng-deep .sw-tabs.mat-mdc-tab-group {
      --mat-tab-header-divider-color: transparent !important;
      --mat-tab-header-divider-height: 0 !important;
    }

    :host ::ng-deep .sw-tabs .mat-mdc-tab-header {
      border-bottom: none !important;
    }

    /* Hide the underline indicator completely */
    :host ::ng-deep .sw-tabs .mdc-tab-indicator {
      display: none !important;
    }

    /* Tab label container - add gap between tabs */
    :host ::ng-deep .sw-tabs .mat-mdc-tab-labels {
      gap: 8px;
    }

    /* Base tab styling - rectangular with teal border */
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

    /* Unselected tab text - teal */
    :host ::ng-deep .sw-tabs .mdc-tab__text-label {
      color: #0d9488 !important;
      transition: color 0.2s ease !important;
    }

    /* Unselected tab hover */
    :host ::ng-deep .sw-tabs .mat-mdc-tab:not(.mdc-tab--active):hover {
      background-color: rgba(13, 148, 136, 0.1) !important;
    }

    /* Selected tab styling - solid teal background */
    :host ::ng-deep .sw-tabs .mat-mdc-tab.mdc-tab--active {
      background-color: #14b8a6 !important;
      border-color: #14b8a6 !important;
    }

    :host ::ng-deep .sw-tabs .mdc-tab--active .mdc-tab__text-label {
      color: white !important;
    }

    /* Remove ripple/focus state background */
    :host ::ng-deep .sw-tabs .mat-mdc-tab .mat-ripple,
    :host ::ng-deep .sw-tabs .mat-mdc-tab-ripple {
      display: none !important;
    }

    /* Dark mode styles (class-based) */
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
export class HrReportsComponent implements OnInit {
  private readonly reportsService = inject(ReportsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly userId = '00000000-0000-0000-0000-000000000100'; // Dev user

  selectedTabIndex = 0;
  lastUpdated = signal<Date | null>(null);

  // Analytics state
  loadingAnalytics = signal(true);
  headcount = signal<HeadcountSummary | null>(null);
  demographics = signal<DemographicsSummary | null>(null);
  turnover = signal<TurnoverAnalysis | null>(null);

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

  // Department colors for donut chart
  private readonly departmentColors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ef4444', // red
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#84cc16', // lime
  ];

  private readonly genderColors: Record<string, string> = {
    Male: '#3b82f6',
    Female: '#ec4899',
    Other: '#8b5cf6',
    'Not Specified': '#9ca3af'
  };

  // Computed data for charts
  departmentChartData = computed((): DonutSegment[] => {
    const data = this.headcount()?.byDepartment ?? {};
    return Object.entries(data)
      .map(([name, count], index) => ({
        label: name,
        value: count,
        color: this.departmentColors[index % this.departmentColors.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  });

  genderChartData = computed((): DonutSegment[] => {
    const data = this.demographics()?.byGender ?? {};
    return Object.entries(data).map(([name, count]) => ({
      label: name,
      value: count,
      color: this.genderColors[name] || '#9ca3af'
    }));
  });

  departmentData = computed(() => {
    const data = this.headcount()?.byDepartment ?? {};
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

  genderData = computed(() => {
    const data = this.demographics()?.byGender ?? {};
    return Object.entries(data).map(([name, count]) => ({ name, count }));
  });

  turnoverTrendData = computed(() => {
    return this.turnover()?.monthlyTrend ?? [];
  });

  // HR Report Types - initialized in ngOnInit
  hrReportTypes: ReportTypeOption[] = [];

  ngOnInit(): void {
    this.initializeReportTypes();
    this.loadAnalytics();
    this.loadReports();
    this.loadSchedules();
  }

  private initializeReportTypes(): void {
    this.hrReportTypes = [
      {
        value: 'HEADCOUNT',
        label: this.translate.instant('reports.hr.headcountReportLabel'),
        description: this.translate.instant('reports.hr.headcountReportDesc'),
        badge: 'popular'
      },
      {
        value: 'TURNOVER',
        label: this.translate.instant('reports.hr.turnoverReportLabel'),
        description: this.translate.instant('reports.hr.turnoverReportDesc')
      },
      {
        value: 'DEMOGRAPHICS',
        label: this.translate.instant('reports.hr.demographicsReportLabel'),
        description: this.translate.instant('reports.hr.demographicsReportDesc')
      },
      {
        value: 'PROBATION_STATUS',
        label: this.translate.instant('reports.hr.probationReportLabel'),
        description: this.translate.instant('reports.hr.probationReportDesc')
      },
      {
        value: 'EMPLOYEE_DIRECTORY',
        label: this.translate.instant('reports.hr.directoryLabel'),
        description: this.translate.instant('reports.hr.directoryDesc')
      }
    ];
  }

  // === Navigation ===

  scrollToGenerate(): void {
    this.selectedTabIndex = 1;
  }

  quickGenerate(reportType: ReportType): void {
    const request: GenerateReportRequest = {
      reportType,
      outputFormat: 'PDF'
    };
    this.onGenerateReport(request);
  }

  // === Data Loading ===

  private loadAnalytics(): void {
    this.loadingAnalytics.set(true);

    forkJoin({
      headcount: this.reportsService.getHeadcountSummary(),
      demographics: this.reportsService.getDemographicsSummary(),
      turnover: this.reportsService.getTurnoverAnalysis()
    }).subscribe({
      next: (data) => {
        this.headcount.set(data.headcount);
        this.demographics.set(data.demographics);
        this.turnover.set(data.turnover);
        this.loadingAnalytics.set(false);
        this.lastUpdated.set(new Date());
      },
      error: (err) => {
        console.error('Failed to load HR analytics:', err);
        this.loadingAnalytics.set(false);
        this.showError(this.translate.instant('reports.hr.failedLoadAnalytics'));
      }
    });
  }

  private loadReports(): void {
    this.loadingReports.set(true);

    this.reportsService.searchReports(
      this.reportsPageIndex(),
      this.reportsPageSize(),
      'HR'
    ).subscribe({
      next: (response) => {
        this.reports.set(response.content);
        this.totalReports.set(response.totalElements);
        this.loadingReports.set(false);
      },
      error: (err) => {
        console.error('Failed to load reports:', err);
        this.loadingReports.set(false);
        this.showError(this.translate.instant('reports.hr.failedLoadReports'));
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
        // Filter to HR report types
        const hrSchedules = response.content.filter(s =>
          this.hrReportTypes.some(rt => rt.value === s.reportType)
        );
        this.schedules.set(hrSchedules);
        this.totalSchedules.set(hrSchedules.length);
        this.loadingSchedules.set(false);
      },
      error: (err) => {
        console.error('Failed to load schedules:', err);
        this.loadingSchedules.set(false);
        this.showError(this.translate.instant('reports.hr.failedLoadSchedules'));
      }
    });
  }

  // === Utility Methods ===

  formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  formatDecimal(value: number): string {
    return value.toFixed(1);
  }

  getTurnoverTrend(): 'up' | 'down' | 'stable' {
    const trend = this.turnover()?.monthlyTrend ?? [];
    if (trend.length < 2) return 'stable';
    const latest = trend[trend.length - 1]?.turnoverRate ?? 0;
    const previous = trend[trend.length - 2]?.turnoverRate ?? 0;
    if (latest > previous + 0.5) return 'up';
    if (latest < previous - 0.5) return 'down';
    return 'stable';
  }

  getTurnoverTrendValue(): string {
    const trend = this.turnover()?.monthlyTrend ?? [];
    if (trend.length < 2) return '';
    const latest = trend[trend.length - 1]?.turnoverRate ?? 0;
    const previous = trend[trend.length - 2]?.turnoverRate ?? 0;
    const diff = latest - previous;
    const diffStr = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
    return `${diffStr} ${this.translate.instant('reports.hr.vsLastMonth')}`;
  }

  getHiresTrend(): 'up' | 'down' | 'stable' {
    const trend = this.turnover()?.monthlyTrend ?? [];
    if (trend.length < 2) return 'stable';
    const latest = trend[trend.length - 1]?.hires ?? 0;
    const previous = trend[trend.length - 2]?.hires ?? 0;
    if (latest > previous) return 'up';
    if (latest < previous) return 'down';
    return 'stable';
  }

  getHiresTrendValue(): string {
    const trend = this.turnover()?.monthlyTrend ?? [];
    if (trend.length < 2) return '';
    const latest = trend[trend.length - 1]?.hires ?? 0;
    const previous = trend[trend.length - 2]?.hires ?? 0;
    const diff = latest - previous;
    if (diff === 0) return this.translate.instant('reports.hr.sameAsLastMonth');
    const diffStr = `${diff >= 0 ? '+' : ''}${diff}`;
    return `${diffStr} ${this.translate.instant('reports.hr.vsLastMonth')}`;
  }

  getBarWidth(value: number): number {
    const maxValue = Math.max(
      ...this.turnoverTrendData().map(r => Math.max(r.hires, r.terminations))
    );
    return maxValue > 0 ? (value / maxValue) * 100 : 0;
  }

  getTurnoverRateClass(rate: number): string {
    if (rate >= 5) return 'text-red-600 dark:text-red-400';
    if (rate >= 3) return 'text-orange-600 dark:text-orange-400';
    return 'text-green-600 dark:text-green-400';
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
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
        this.showSuccess(this.translate.instant('reports.hr.reportGeneratedSuccess'));
        this.loadReports();

        // Trigger download if completed
        if (response.status === 'COMPLETED') {
          this.downloadReport(response.id);
        }
      },
      error: (err) => {
        console.error('Failed to generate report:', err);
        this.generatingReport.set(false);
        this.showError(this.translate.instant('reports.hr.failedGenerateReport'));
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
        this.showError(this.translate.instant('reports.hr.failedDownloadReport'));
      }
    });
  }

  onViewReport(report: ReportListItem): void {
    // Could open a detail dialog
    console.log('View report:', report);
  }

  onRetryReport(report: ReportListItem): void {
    this.reportsService.retryReport(report.id).subscribe({
      next: () => {
        this.showSuccess(this.translate.instant('reports.hr.reportRetryStarted'));
        this.loadReports();
      },
      error: (err) => {
        console.error('Failed to retry report:', err);
        this.showError(this.translate.instant('reports.hr.failedRetryReport'));
      }
    });
  }

  onCancelReport(report: ReportListItem): void {
    this.reportsService.cancelReport(report.id).subscribe({
      next: () => {
        this.showSuccess(this.translate.instant('reports.hr.reportCancelled'));
        this.loadReports();
      },
      error: (err) => {
        console.error('Failed to cancel report:', err);
        this.showError(this.translate.instant('reports.hr.failedCancelReport'));
      }
    });
  }

  onDeleteReport(report: ReportListItem): void {
    if (!confirm(this.translate.instant('reports.hr.confirmDeleteReport'))) return;

    this.reportsService.deleteReport(report.id).subscribe({
      next: () => {
        this.showSuccess(this.translate.instant('reports.hr.reportDeleted'));
        this.loadReports();
      },
      error: (err) => {
        console.error('Failed to delete report:', err);
        this.showError(this.translate.instant('reports.hr.failedDeleteReport'));
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
      // Update existing
      this.reportsService.updateSchedule(editing.id, request).subscribe({
        next: () => {
          this.savingSchedule.set(false);
          this.showScheduleForm.set(false);
          this.editingSchedule.set(null);
          this.showSuccess(this.translate.instant('reports.hr.scheduleUpdated'));
          this.loadSchedules();
        },
        error: (err) => {
          console.error('Failed to update schedule:', err);
          this.savingSchedule.set(false);
          this.showError(this.translate.instant('reports.hr.failedUpdateSchedule'));
        }
      });
    } else {
      // Create new
      this.reportsService.createSchedule(request, this.userId).subscribe({
        next: () => {
          this.savingSchedule.set(false);
          this.showScheduleForm.set(false);
          this.showSuccess(this.translate.instant('reports.hr.scheduleCreated'));
          this.loadSchedules();
        },
        error: (err) => {
          console.error('Failed to create schedule:', err);
          this.savingSchedule.set(false);
          this.showError(this.translate.instant('reports.hr.failedCreateSchedule'));
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
        const msg = schedule.active
          ? this.translate.instant('reports.hr.scheduleDeactivated')
          : this.translate.instant('reports.hr.scheduleActivated');
        this.showSuccess(msg);
        this.loadSchedules();
      },
      error: (err) => {
        console.error('Failed to toggle schedule:', err);
        this.showError(this.translate.instant('reports.hr.failedUpdateSchedule'));
      }
    });
  }

  onRunScheduleNow(schedule: ScheduleResponse): void {
    this.reportsService.runScheduleNow(schedule.id, this.userId).subscribe({
      next: (response) => {
        this.showSuccess(this.translate.instant('reports.hr.reportGenerationStarted'));
        this.loadReports();
      },
      error: (err) => {
        console.error('Failed to run schedule:', err);
        this.showError(this.translate.instant('reports.hr.failedRunSchedule'));
      }
    });
  }

  onViewScheduleHistory(schedule: ScheduleResponse): void {
    // Could filter reports by schedule
    console.log('View schedule history:', schedule);
  }

  onDeleteSchedule(schedule: ScheduleResponse): void {
    if (!confirm(this.translate.instant('reports.hr.confirmDeleteSchedule'))) return;

    this.reportsService.deleteSchedule(schedule.id).subscribe({
      next: () => {
        this.showSuccess(this.translate.instant('reports.hr.scheduleDeleted'));
        this.loadSchedules();
      },
      error: (err) => {
        console.error('Failed to delete schedule:', err);
        this.showError(this.translate.instant('reports.hr.failedDeleteSchedule'));
      }
    });
  }

  onSchedulesPageChange(event: PageEvent): void {
    this.schedulesPageIndex.set(event.pageIndex);
    this.schedulesPageSize.set(event.pageSize);
    this.loadSchedules();
  }
}
