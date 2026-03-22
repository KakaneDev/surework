import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe, PercentPipe } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import {
  ReportsService,
  RecruitmentSummary,
  ReportListItem,
  ScheduleResponse,
  GenerateReportRequest,
  CreateScheduleRequest
} from '../../../core/services/reports.service';
import {
  RecruitmentService,
  PortalPerformanceStats,
  AdvertPerformanceStats,
  AdvertDetail,
  SourceEffectivenessStats,
  OfferAcceptanceStats,
  ExternalJobPosting
} from '../../../core/services/recruitment.service';
import { ThemeService } from '../../../core/services/theme.service';
import {
  AnalyticsCardComponent,
  ReportGeneratorComponent,
  ReportTypeOption,
  ReportListComponent,
  ScheduleFormComponent,
  ScheduleListComponent
} from '../../reports/components';

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexDataLabels,
  ApexPlotOptions,
  ApexStroke,
  ApexFill,
  ApexTooltip,
  ApexLegend,
  ApexGrid,
  ApexTheme,
  NgApexchartsModule
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis | ApexYAxis[];
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  stroke: ApexStroke;
  fill: ApexFill;
  tooltip: ApexTooltip;
  legend: ApexLegend;
  grid: ApexGrid;
  theme: ApexTheme;
  colors: string[];
};

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
    NgApexchartsModule,
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

            <!-- Portal Performance Cards -->
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Portal Performance</h3>
                @if (portalPerformance()) {
                  <span class="text-sm text-neutral-500 dark:text-neutral-400">
                    {{ portalPerformance()!.totalPosted }} total postings
                  </span>
                }
              </div>
              @if (loadingPortalPerformance()) {
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  @for (i of [1, 2, 3, 4]; track i) {
                    <div class="animate-pulse h-36 bg-neutral-200 dark:bg-neutral-700 rounded-xl"></div>
                  }
                </div>
              } @else if (portalPerformance()?.portals?.length) {
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  @for (portal of portalPerformance()!.portals; track portal.portal) {
                    <div
                      class="rounded-xl border p-4 cursor-pointer transition-all duration-200 hover:shadow-md"
                      [class]="expandedPortal() === portal.portal
                        ? 'border-purple-400 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-purple-300 dark:hover:border-purple-600'"
                      (click)="togglePortalExpand(portal.portal)"
                    >
                      <div class="flex items-center gap-2 mb-3">
                        <span class="material-icons text-purple-600 dark:text-purple-400">language</span>
                        <span class="font-semibold text-neutral-900 dark:text-neutral-100">{{ portal.portal }}</span>
                      </div>
                      <div class="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span class="text-neutral-500 dark:text-neutral-400 text-xs">Active</span>
                          <p class="font-bold text-green-600 dark:text-green-400">{{ portal.activePostings }}</p>
                        </div>
                        <div>
                          <span class="text-neutral-500 dark:text-neutral-400 text-xs">Failed</span>
                          <p class="font-bold" [class]="portal.failedPostings > 0 ? 'text-red-600 dark:text-red-400' : 'text-neutral-400 dark:text-neutral-500'">{{ portal.failedPostings }}</p>
                        </div>
                        <div>
                          <span class="text-neutral-500 dark:text-neutral-400 text-xs">Avg Days Live</span>
                          <p class="font-bold text-neutral-700 dark:text-neutral-300">{{ portal.avgDaysLive | number:'1.0-0' }}</p>
                        </div>
                        <div>
                          <span class="text-neutral-500 dark:text-neutral-400 text-xs">Posts Today</span>
                          <p class="font-bold text-blue-600 dark:text-blue-400">{{ portal.postsToday }}</p>
                        </div>
                      </div>
                    </div>
                  }
                </div>

                <!-- Portal Drill-Down Panel -->
                @if (expandedPortal()) {
                  <div class="mt-4 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10 p-4">
                    <div class="flex items-center justify-between mb-3">
                      <h4 class="font-semibold text-neutral-900 dark:text-neutral-100">
                        {{ expandedPortal() }} — Job Postings
                      </h4>
                      <button
                        class="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                        (click)="expandedPortal.set(null)"
                      >
                        <span class="material-icons text-lg">close</span>
                      </button>
                    </div>
                    @if (loadingPortalJobs()) {
                      <div class="space-y-2">
                        @for (i of [1, 2, 3]; track i) {
                          <div class="animate-pulse h-10 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                        }
                      </div>
                    } @else if (portalJobs().length > 0) {
                      <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                          <thead>
                            <tr class="border-b border-purple-200 dark:border-purple-800">
                              <th class="text-left py-2 text-neutral-600 dark:text-neutral-400 font-medium">Job Title</th>
                              <th class="text-left py-2 text-neutral-600 dark:text-neutral-400 font-medium">Status</th>
                              <th class="text-left py-2 text-neutral-600 dark:text-neutral-400 font-medium">Posted</th>
                              <th class="text-left py-2 text-neutral-600 dark:text-neutral-400 font-medium">Expires</th>
                              <th class="text-right py-2 text-neutral-600 dark:text-neutral-400 font-medium">External URL</th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (job of portalJobs(); track job.id) {
                              <tr class="border-b border-purple-100 dark:border-purple-900/30">
                                <td class="py-2 text-neutral-900 dark:text-neutral-100">{{ job.jobTitle }}</td>
                                <td class="py-2">
                                  <span
                                    class="px-2 py-0.5 rounded-full text-xs font-medium"
                                    [class]="getPostingStatusClasses(job.status)"
                                  >{{ job.status }}</span>
                                </td>
                                <td class="py-2 text-neutral-600 dark:text-neutral-400">{{ job.postedAt ? (job.postedAt | date:'mediumDate') : '-' }}</td>
                                <td class="py-2 text-neutral-600 dark:text-neutral-400">{{ job.expiresAt ? (job.expiresAt | date:'mediumDate') : '-' }}</td>
                                <td class="py-2 text-right">
                                  @if (job.externalUrl) {
                                    <a [href]="job.externalUrl" target="_blank" rel="noopener" class="text-purple-600 dark:text-purple-400 hover:underline text-xs">View</a>
                                  } @else {
                                    <span class="text-neutral-400 text-xs">-</span>
                                  }
                                </td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    } @else {
                      <p class="text-neutral-500 text-center py-4">No postings found for this portal.</p>
                    }
                  </div>
                }
              } @else {
                <p class="text-neutral-500 text-center py-4">No portal performance data available.</p>
              }
            </div>

            <!-- Advert Performance Table -->
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Job Advert Performance</h3>
                @if (advertPerformance()) {
                  <div class="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                    <span>{{ advertPerformance()!.totalViews | number }} views</span>
                    <span>{{ advertPerformance()!.totalApplications | number }} applications</span>
                    <span>{{ advertPerformance()!.avgConversionRate | number:'1.1-1' }}% avg conversion</span>
                  </div>
                }
              </div>
              @if (loadingAdvertPerformance()) {
                <div class="animate-pulse space-y-3">
                  <div class="h-10 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                  @for (i of [1, 2, 3, 4, 5]; track i) {
                    <div class="h-8 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                  }
                </div>
              } @else if (displayAdverts().length > 0) {
                <div class="overflow-x-auto">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="border-b border-neutral-200 dark:border-dark-border">
                        <th class="text-left py-2 text-neutral-600 dark:text-neutral-400 cursor-pointer hover:text-neutral-900 dark:hover:text-neutral-100"
                            (click)="sortAdverts('title')">
                          Job Title
                          @if (advertSortField() === 'title') {
                            <span class="material-icons text-sm align-middle">{{ advertSortAsc() ? 'arrow_upward' : 'arrow_downward' }}</span>
                          }
                        </th>
                        <th class="text-left py-2 text-neutral-600 dark:text-neutral-400 cursor-pointer hover:text-neutral-900 dark:hover:text-neutral-100"
                            (click)="sortAdverts('departmentName')">
                          Department
                          @if (advertSortField() === 'departmentName') {
                            <span class="material-icons text-sm align-middle">{{ advertSortAsc() ? 'arrow_upward' : 'arrow_downward' }}</span>
                          }
                        </th>
                        <th class="text-right py-2 text-neutral-600 dark:text-neutral-400 cursor-pointer hover:text-neutral-900 dark:hover:text-neutral-100"
                            (click)="sortAdverts('views')">
                          Views
                          @if (advertSortField() === 'views') {
                            <span class="material-icons text-sm align-middle">{{ advertSortAsc() ? 'arrow_upward' : 'arrow_downward' }}</span>
                          }
                        </th>
                        <th class="text-right py-2 text-neutral-600 dark:text-neutral-400 cursor-pointer hover:text-neutral-900 dark:hover:text-neutral-100"
                            (click)="sortAdverts('applications')">
                          Applications
                          @if (advertSortField() === 'applications') {
                            <span class="material-icons text-sm align-middle">{{ advertSortAsc() ? 'arrow_upward' : 'arrow_downward' }}</span>
                          }
                        </th>
                        <th class="text-right py-2 text-neutral-600 dark:text-neutral-400 cursor-pointer hover:text-neutral-900 dark:hover:text-neutral-100"
                            (click)="sortAdverts('conversionRate')">
                          Conversion
                          @if (advertSortField() === 'conversionRate') {
                            <span class="material-icons text-sm align-middle">{{ advertSortAsc() ? 'arrow_upward' : 'arrow_downward' }}</span>
                          }
                        </th>
                        <th class="text-right py-2 text-neutral-600 dark:text-neutral-400 cursor-pointer hover:text-neutral-900 dark:hover:text-neutral-100"
                            (click)="sortAdverts('daysLive')">
                          Days Live
                          @if (advertSortField() === 'daysLive') {
                            <span class="material-icons text-sm align-middle">{{ advertSortAsc() ? 'arrow_upward' : 'arrow_downward' }}</span>
                          }
                        </th>
                        <th class="text-left py-2 text-neutral-600 dark:text-neutral-400">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (ad of displayAdverts(); track ad.jobId) {
                        <tr class="border-b border-neutral-100 dark:border-dark-border hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                          <td class="py-2 text-neutral-900 dark:text-neutral-100 font-medium">{{ ad.title }}</td>
                          <td class="py-2 text-neutral-600 dark:text-neutral-400">{{ ad.departmentName || '-' }}</td>
                          <td class="py-2 text-right text-neutral-900 dark:text-neutral-100">{{ ad.views | number }}</td>
                          <td class="py-2 text-right text-neutral-900 dark:text-neutral-100">{{ ad.applications | number }}</td>
                          <td class="py-2 text-right">
                            <span
                              class="px-2 py-0.5 rounded-full text-xs font-medium"
                              [class]="getConversionRateClasses(ad.conversionRate)"
                            >{{ ad.conversionRate | number:'1.1-1' }}%</span>
                          </td>
                          <td class="py-2 text-right text-neutral-700 dark:text-neutral-300">{{ ad.daysLive }}</td>
                          <td class="py-2">
                            <span
                              class="px-2 py-0.5 rounded-full text-xs font-medium"
                              [class]="getJobStatusClasses(ad.status)"
                            >{{ ad.status }}</span>
                          </td>
                        </tr>
                      }
                    </tbody>
                    <!-- Summary row -->
                    <tfoot>
                      <tr class="border-t-2 border-neutral-300 dark:border-neutral-600 font-semibold">
                        <td class="py-2 text-neutral-900 dark:text-neutral-100" colspan="2">Totals</td>
                        <td class="py-2 text-right text-neutral-900 dark:text-neutral-100">{{ advertPerformance()!.totalViews | number }}</td>
                        <td class="py-2 text-right text-neutral-900 dark:text-neutral-100">{{ advertPerformance()!.totalApplications | number }}</td>
                        <td class="py-2 text-right">
                          <span
                            class="px-2 py-0.5 rounded-full text-xs font-medium"
                            [class]="getConversionRateClasses(advertPerformance()!.avgConversionRate)"
                          >{{ advertPerformance()!.avgConversionRate | number:'1.1-1' }}%</span>
                        </td>
                        <td class="py-2 text-right text-neutral-700 dark:text-neutral-300">{{ advertPerformance()!.avgDaysLive | number:'1.0-0' }}</td>
                        <td class="py-2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                @if (!showAllAdverts() && (advertPerformance()?.adverts?.length ?? 0) > 10) {
                  <button
                    class="mt-3 text-sm text-purple-600 dark:text-purple-400 hover:underline"
                    (click)="showAllAdverts.set(true)"
                  >
                    View All ({{ advertPerformance()!.adverts.length }})
                  </button>
                }
              } @else {
                <p class="text-neutral-500 text-center py-4">No advert performance data available.</p>
              }
            </div>

            <!-- Source Effectiveness & Offer Acceptance Charts -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Source Effectiveness Chart -->
              <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
                <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Source Effectiveness</h3>
                @if (loadingSourceEffectiveness()) {
                  <div class="animate-pulse h-64 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                } @else if (sourceChartSeries().length > 0) {
                  <apx-chart
                    [series]="sourceChartSeries()"
                    [chart]="sourceChartOptions()"
                    [xaxis]="sourceChartXaxis()"
                    [yaxis]="sourceChartYaxis()"
                    [plotOptions]="sourceChartPlotOptions()"
                    [dataLabels]="sourceChartDataLabels()"
                    [legend]="sourceChartLegend()"
                    [tooltip]="sourceChartTooltip()"
                    [grid]="chartGrid()"
                    [colors]="sourceChartColors"
                  ></apx-chart>
                  <!-- Source conversion rate labels below chart -->
                  @if (sourceEffectiveness()) {
                    <div class="mt-4 flex flex-wrap gap-2">
                      @for (source of sourceKeys(); track source) {
                        <div class="text-xs bg-neutral-100 dark:bg-neutral-800 rounded-full px-3 py-1">
                          <span class="text-neutral-600 dark:text-neutral-400">{{ source }}:</span>
                          <span class="font-semibold text-neutral-900 dark:text-neutral-100 ml-1">
                            {{ sourceEffectiveness()!.conversionRateBySource[source] | number:'1.1-1' }}%
                          </span>
                        </div>
                      }
                    </div>
                  }
                } @else {
                  <p class="text-neutral-500 text-center py-4">No source effectiveness data available.</p>
                }
              </div>

              <!-- Offer Acceptance Trend Chart -->
              <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
                <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Offer Acceptance Trend</h3>
                @if (loadingOfferAcceptance()) {
                  <div class="animate-pulse h-64 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                } @else if (offerTrendSeries().length > 0) {
                  <apx-chart
                    [series]="offerTrendSeries()"
                    [chart]="offerTrendChartOptions()"
                    [xaxis]="offerTrendXaxis()"
                    [yaxis]="offerTrendYaxis()"
                    [stroke]="offerTrendStroke()"
                    [fill]="offerTrendFill()"
                    [dataLabels]="offerTrendDataLabels()"
                    [legend]="offerTrendLegend()"
                    [tooltip]="offerTrendTooltip()"
                    [grid]="chartGrid()"
                    [colors]="offerTrendColors"
                  ></apx-chart>
                  <!-- Summary KPIs -->
                  @if (offerAcceptance()) {
                    <div class="mt-4 grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p class="text-xs text-neutral-500 dark:text-neutral-400">Total Offers</p>
                        <p class="text-lg font-bold text-neutral-900 dark:text-neutral-100">{{ offerAcceptance()!.totalOffersMade }}</p>
                      </div>
                      <div>
                        <p class="text-xs text-neutral-500 dark:text-neutral-400">Accepted</p>
                        <p class="text-lg font-bold text-green-600 dark:text-green-400">{{ offerAcceptance()!.totalAccepted }}</p>
                      </div>
                      <div>
                        <p class="text-xs text-neutral-500 dark:text-neutral-400">Acceptance Rate</p>
                        <p class="text-lg font-bold text-purple-600 dark:text-purple-400">{{ offerAcceptance()!.acceptanceRatePercent | number:'1.1-1' }}%</p>
                      </div>
                    </div>
                  }
                } @else {
                  <p class="text-neutral-500 text-center py-4">No offer acceptance data available.</p>
                }
              </div>
            </div>

            <!-- Pipeline & Department Analysis -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Recruitment Funnel Chart -->
              <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
                <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{{ 'reports.recruitment.funnel.title' | translate }}</h3>
                @if (loadingAnalytics()) {
                  <div class="animate-pulse h-64 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                } @else if (funnelChartSeries().length > 0) {
                  <apx-chart
                    [series]="funnelChartSeries()"
                    [chart]="funnelChartOptions()"
                    [xaxis]="funnelChartXaxis()"
                    [plotOptions]="funnelChartPlotOptions()"
                    [dataLabels]="funnelChartDataLabels()"
                    [grid]="chartGrid()"
                    [colors]="funnelChartColors"
                  ></apx-chart>
                } @else {
                  <p class="text-neutral-500 text-center py-4">No funnel data available.</p>
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

            <!-- Monthly Pipeline Trend Chart -->
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
              <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{{ 'reports.recruitment.pipelineTrend' | translate }}</h3>
              @if (loadingAnalytics()) {
                <div class="animate-pulse h-64 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
              } @else if (pipelineTrendSeries().length > 0) {
                <apx-chart
                  [series]="pipelineTrendSeries()"
                  [chart]="pipelineTrendChartOptions()"
                  [xaxis]="pipelineTrendXaxis()"
                  [stroke]="pipelineTrendStroke()"
                  [dataLabels]="pipelineTrendDataLabels()"
                  [legend]="pipelineTrendLegend()"
                  [tooltip]="pipelineTrendTooltip()"
                  [grid]="chartGrid()"
                  [colors]="pipelineTrendColors"
                ></apx-chart>
              } @else {
                <p class="text-neutral-500 text-center py-4">{{ 'reports.recruitment.noTrendData' | translate }}</p>
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
    :host ::ng-deep .apexcharts-tooltip {
      border-radius: 8px !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    }
    :host-context(.dark) ::ng-deep .apexcharts-tooltip {
      background: #1f2937 !important;
      border-color: #374151 !important;
      color: #e5e7eb !important;
    }
    :host-context(.dark) ::ng-deep .apexcharts-tooltip-title {
      background: #111827 !important;
      border-color: #374151 !important;
      color: #e5e7eb !important;
    }
    :host-context(.dark) ::ng-deep .apexcharts-xaxis-label,
    :host-context(.dark) ::ng-deep .apexcharts-yaxis-label {
      fill: #9ca3af !important;
    }
    :host-context(.dark) ::ng-deep .apexcharts-gridline {
      stroke: #374151 !important;
    }
    :host-context(.dark) ::ng-deep .apexcharts-legend-text {
      color: #d1d5db !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecruitmentReportsComponent implements OnInit {
  private readonly reportsService = inject(ReportsService);
  private readonly recruitmentService = inject(RecruitmentService);
  private readonly themeService = inject(ThemeService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly userId = '00000000-0000-0000-0000-000000000100'; // Dev user

  // Analytics state
  loadingAnalytics = signal(true);
  recruitment = signal<RecruitmentSummary | null>(null);

  // Portal performance state
  loadingPortalPerformance = signal(true);
  portalPerformance = signal<PortalPerformanceStats | null>(null);
  expandedPortal = signal<string | null>(null);
  loadingPortalJobs = signal(false);
  portalJobs = signal<ExternalJobPosting[]>([]);

  // Advert performance state
  loadingAdvertPerformance = signal(true);
  advertPerformance = signal<AdvertPerformanceStats | null>(null);
  showAllAdverts = signal(false);
  advertSortField = signal<keyof AdvertDetail>('conversionRate');
  advertSortAsc = signal(false);

  // Source effectiveness state
  loadingSourceEffectiveness = signal(true);
  sourceEffectiveness = signal<SourceEffectivenessStats | null>(null);

  // Offer acceptance state
  loadingOfferAcceptance = signal(true);
  offerAcceptance = signal<OfferAcceptanceStats | null>(null);

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

  // Chart colors
  readonly sourceChartColors = ['#3b82f6', '#22c55e'];
  readonly offerTrendColors = ['#8b5cf6', '#22c55e', '#ef4444'];
  readonly funnelChartColors = ['#1976d2', '#f57c00', '#7b1fa2', '#2e7d32'];
  readonly pipelineTrendColors = ['#3b82f6', '#f97316', '#a855f7', '#22c55e'];

  // Computed data
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

  sourceKeys = computed(() => {
    const se = this.sourceEffectiveness();
    if (!se) return [];
    return Object.keys(se.applicationsBySource);
  });

  displayAdverts = computed(() => {
    const stats = this.advertPerformance();
    if (!stats?.adverts?.length) return [];

    const sorted = [...stats.adverts].sort((a, b) => {
      const field = this.advertSortField();
      const aVal = a[field] ?? '';
      const bVal = b[field] ?? '';
      const cmp = typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal));
      return this.advertSortAsc() ? cmp : -cmp;
    });

    return this.showAllAdverts() ? sorted : sorted.slice(0, 10);
  });

  // === Source Effectiveness Chart ===
  sourceChartSeries = computed<ApexAxisChartSeries>(() => {
    const se = this.sourceEffectiveness();
    if (!se) return [];
    const sources = Object.keys(se.applicationsBySource);
    return [
      { name: 'Applications', data: sources.map(s => se.applicationsBySource[s] || 0) },
      { name: 'Hires', data: sources.map(s => se.hiredBySource[s] || 0) }
    ];
  });

  sourceChartOptions = computed<ApexChart>(() => ({
    type: 'bar',
    height: 280,
    toolbar: { show: false },
    fontFamily: 'inherit',
    background: 'transparent'
  }));

  sourceChartXaxis = computed<ApexXAxis>(() => ({
    categories: this.sourceKeys(),
    labels: {
      style: { colors: this.themeService.isDark() ? '#9ca3af' : '#6b7280', fontSize: '11px' }
    }
  }));

  sourceChartYaxis = computed<ApexYAxis>(() => ({
    labels: {
      style: { colors: this.themeService.isDark() ? '#9ca3af' : '#6b7280' }
    }
  }));

  sourceChartPlotOptions = computed<ApexPlotOptions>(() => ({
    bar: { horizontal: false, columnWidth: '60%', borderRadius: 4 }
  }));

  sourceChartDataLabels = computed<ApexDataLabels>(() => ({
    enabled: false
  }));

  sourceChartLegend = computed<ApexLegend>(() => ({
    position: 'top',
    horizontalAlign: 'right',
    labels: { colors: this.themeService.isDark() ? '#d1d5db' : '#374151' }
  }));

  sourceChartTooltip = computed<ApexTooltip>(() => ({
    theme: this.themeService.isDark() ? 'dark' : 'light'
  }));

  chartGrid = computed<ApexGrid>(() => ({
    borderColor: this.themeService.isDark() ? '#374151' : '#e5e7eb',
    strokeDashArray: 4
  }));

  // === Offer Acceptance Trend Chart ===
  offerTrendSeries = computed<ApexAxisChartSeries>(() => {
    const oa = this.offerAcceptance();
    if (!oa?.monthlyTrend?.length) return [];
    return [
      { name: 'Offers', type: 'line', data: oa.monthlyTrend.map(t => t.offers) },
      { name: 'Accepted', type: 'area', data: oa.monthlyTrend.map(t => t.accepted) },
      { name: 'Declined', type: 'area', data: oa.monthlyTrend.map(t => t.declined) }
    ];
  });

  offerTrendChartOptions = computed<ApexChart>(() => ({
    type: 'line',
    height: 280,
    toolbar: { show: false },
    fontFamily: 'inherit',
    background: 'transparent'
  }));

  offerTrendXaxis = computed<ApexXAxis>(() => ({
    categories: this.offerAcceptance()?.monthlyTrend?.map(t => t.month) ?? [],
    labels: {
      style: { colors: this.themeService.isDark() ? '#9ca3af' : '#6b7280', fontSize: '11px' }
    }
  }));

  offerTrendYaxis = computed<ApexYAxis>(() => ({
    labels: {
      style: { colors: this.themeService.isDark() ? '#9ca3af' : '#6b7280' }
    }
  }));

  offerTrendStroke = computed<ApexStroke>(() => ({
    curve: 'smooth',
    width: [3, 2, 2]
  }));

  offerTrendFill = computed<ApexFill>(() => ({
    type: ['solid', 'gradient', 'gradient'],
    gradient: { opacityFrom: 0.4, opacityTo: 0.1 }
  }));

  offerTrendDataLabels = computed<ApexDataLabels>(() => ({
    enabled: false
  }));

  offerTrendLegend = computed<ApexLegend>(() => ({
    position: 'top',
    horizontalAlign: 'right',
    labels: { colors: this.themeService.isDark() ? '#d1d5db' : '#374151' }
  }));

  offerTrendTooltip = computed<ApexTooltip>(() => ({
    theme: this.themeService.isDark() ? 'dark' : 'light'
  }));

  // === Funnel Chart ===
  funnelChartSeries = computed<ApexAxisChartSeries>(() => {
    const r = this.recruitment();
    if (!r) return [];
    return [{
      name: 'Count',
      data: [
        r.totalApplications,
        r.interviewsScheduled,
        r.offersExtended,
        r.hiresMade
      ]
    }];
  });

  funnelChartOptions = computed<ApexChart>(() => ({
    type: 'bar',
    height: 280,
    toolbar: { show: false },
    fontFamily: 'inherit',
    background: 'transparent'
  }));

  funnelChartXaxis = computed<ApexXAxis>(() => ({
    categories: [
      this.translate.instant('reports.recruitment.funnel.applications'),
      this.translate.instant('reports.recruitment.funnel.interviews'),
      this.translate.instant('reports.recruitment.funnel.offers'),
      this.translate.instant('reports.recruitment.funnel.hires')
    ],
    labels: {
      style: { colors: this.themeService.isDark() ? '#9ca3af' : '#6b7280', fontSize: '11px' }
    }
  }));

  funnelChartPlotOptions = computed<ApexPlotOptions>(() => ({
    bar: {
      horizontal: true,
      barHeight: '60%',
      borderRadius: 6,
      distributed: true
    }
  }));

  funnelChartDataLabels = computed<ApexDataLabels>(() => ({
    enabled: true,
    style: { colors: ['#fff'], fontSize: '13px', fontWeight: 600 }
  }));

  // === Pipeline Trend Chart ===
  pipelineTrendSeries = computed<ApexAxisChartSeries>(() => {
    const trend = this.recruitment()?.monthlyTrend;
    if (!trend?.length) return [];
    return [
      { name: 'Applications', data: trend.map(t => t.applications) },
      { name: 'Interviews', data: trend.map(t => t.interviews) },
      { name: 'Offers', data: trend.map(t => t.offers) },
      { name: 'Hires', data: trend.map(t => t.hires) }
    ];
  });

  pipelineTrendChartOptions = computed<ApexChart>(() => ({
    type: 'line',
    height: 300,
    toolbar: { show: false },
    fontFamily: 'inherit',
    background: 'transparent'
  }));

  pipelineTrendXaxis = computed<ApexXAxis>(() => ({
    categories: this.recruitment()?.monthlyTrend?.map(t => t.month) ?? [],
    labels: {
      style: { colors: this.themeService.isDark() ? '#9ca3af' : '#6b7280', fontSize: '11px' }
    }
  }));

  pipelineTrendStroke = computed<ApexStroke>(() => ({
    curve: 'smooth',
    width: 2
  }));

  pipelineTrendDataLabels = computed<ApexDataLabels>(() => ({
    enabled: false
  }));

  pipelineTrendLegend = computed<ApexLegend>(() => ({
    position: 'top',
    horizontalAlign: 'right',
    labels: { colors: this.themeService.isDark() ? '#d1d5db' : '#374151' }
  }));

  pipelineTrendTooltip = computed<ApexTooltip>(() => ({
    theme: this.themeService.isDark() ? 'dark' : 'light'
  }));

  // Recruitment Report Types
  recruitmentReportTypes: ReportTypeOption[] = [];

  private initReportTypes(): void {
    this.recruitmentReportTypes = [
      { value: 'RECRUITMENT_PIPELINE', label: this.translate.instant('reports.recruitment.reportTypes.pipeline.label'), description: this.translate.instant('reports.recruitment.reportTypes.pipeline.description') },
      { value: 'TIME_TO_HIRE', label: this.translate.instant('reports.recruitment.reportTypes.timeToHire.label'), description: this.translate.instant('reports.recruitment.reportTypes.timeToHire.description') },
      { value: 'SOURCE_EFFECTIVENESS', label: this.translate.instant('reports.recruitment.reportTypes.sourceEffectiveness.label'), description: this.translate.instant('reports.recruitment.reportTypes.sourceEffectiveness.description') },
      { value: 'OFFER_ACCEPTANCE', label: this.translate.instant('reports.recruitment.reportTypes.offerAcceptance.label'), description: this.translate.instant('reports.recruitment.reportTypes.offerAcceptance.description') },
      { value: 'EXTERNAL_PORTAL_PERFORMANCE', label: 'Portal Performance', description: 'Analyse how job postings perform across external portals (LinkedIn, Pnet, Indeed, Careers24).' },
      { value: 'JOB_ADVERT_EFFECTIVENESS', label: 'Job Advert Effectiveness', description: 'Measure views, applications, and conversion rates for each job advertisement.' }
    ];
  }

  ngOnInit(): void {
    this.initReportTypes();
    this.loadAnalytics();
    this.loadPortalPerformance();
    this.loadAdvertPerformance();
    this.loadSourceEffectiveness();
    this.loadOfferAcceptance();
    this.loadReports();
    this.loadSchedules();
  }

  // === Data Loading ===

  private loadAnalytics(): void {
    this.loadingAnalytics.set(true);

    // Build RecruitmentSummary from recruitment service endpoints directly
    // (bypasses the reporting service which may not be running)
    forkJoin({
      dashboard: this.recruitmentService.getDashboard(),
      offerAcceptance: this.recruitmentService.getOfferAcceptance(),
      sourceEffectiveness: this.recruitmentService.getSourceEffectiveness()
    }).subscribe({
      next: ({ dashboard, offerAcceptance, sourceEffectiveness }) => {
        const summary: RecruitmentSummary = {
          openPositions: dashboard.openJobs,
          totalApplications: dashboard.totalApplications,
          interviewsScheduled: dashboard.interviewsThisWeek,
          offersExtended: dashboard.offersPending,
          hiresMade: offerAcceptance.totalAccepted,
          averageDaysToHire: offerAcceptance.avgDaysToAccept,
          offerAcceptanceRatePercent: offerAcceptance.acceptanceRatePercent,
          applicationsBySource: sourceEffectiveness.applicationsBySource,
          byDepartment: offerAcceptance.acceptanceRateByDepartment ?? {},
          monthlyTrend: (offerAcceptance.monthlyTrend ?? []).map(t => ({
            month: t.month,
            applications: t.offers,
            interviews: t.accepted,
            offers: t.offers,
            hires: t.accepted
          }))
        };
        this.recruitment.set(summary);
        this.loadingAnalytics.set(false);
      },
      error: (err) => {
        console.error('Failed to load recruitment analytics:', err);
        this.loadingAnalytics.set(false);
        this.showError(this.translate.instant('reports.recruitment.messages.loadAnalyticsFailed'));
      }
    });
  }

  private loadPortalPerformance(): void {
    this.loadingPortalPerformance.set(true);

    this.recruitmentService.getPortalPerformance().subscribe({
      next: (data) => {
        this.portalPerformance.set(data);
        this.loadingPortalPerformance.set(false);
      },
      error: (err) => {
        console.error('Failed to load portal performance:', err);
        this.loadingPortalPerformance.set(false);
      }
    });
  }

  private loadAdvertPerformance(): void {
    this.loadingAdvertPerformance.set(true);

    this.recruitmentService.getAdvertPerformance().subscribe({
      next: (data) => {
        this.advertPerformance.set(data);
        this.loadingAdvertPerformance.set(false);
      },
      error: (err) => {
        console.error('Failed to load advert performance:', err);
        this.loadingAdvertPerformance.set(false);
      }
    });
  }

  private loadSourceEffectiveness(): void {
    this.loadingSourceEffectiveness.set(true);

    this.recruitmentService.getSourceEffectiveness().subscribe({
      next: (data) => {
        this.sourceEffectiveness.set(data);
        this.loadingSourceEffectiveness.set(false);
      },
      error: (err) => {
        console.error('Failed to load source effectiveness:', err);
        this.loadingSourceEffectiveness.set(false);
      }
    });
  }

  private loadOfferAcceptance(): void {
    this.loadingOfferAcceptance.set(true);

    this.recruitmentService.getOfferAcceptance().subscribe({
      next: (data) => {
        this.offerAcceptance.set(data);
        this.loadingOfferAcceptance.set(false);
      },
      error: (err) => {
        console.error('Failed to load offer acceptance:', err);
        this.loadingOfferAcceptance.set(false);
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

  // === Portal Drill-Down ===

  togglePortalExpand(portal: string): void {
    if (this.expandedPortal() === portal) {
      this.expandedPortal.set(null);
      this.portalJobs.set([]);
      return;
    }

    this.expandedPortal.set(portal);
    this.loadingPortalJobs.set(true);

    this.recruitmentService.getPortalJobs(portal, 0, 20).subscribe({
      next: (response) => {
        this.portalJobs.set(response.content);
        this.loadingPortalJobs.set(false);
      },
      error: (err) => {
        console.error('Failed to load portal jobs:', err);
        this.portalJobs.set([]);
        this.loadingPortalJobs.set(false);
      }
    });
  }

  // === Advert Sorting ===

  sortAdverts(field: keyof AdvertDetail): void {
    if (this.advertSortField() === field) {
      this.advertSortAsc.set(!this.advertSortAsc());
    } else {
      this.advertSortField.set(field);
      this.advertSortAsc.set(false);
    }
  }

  // === Utility Methods ===

  formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  formatDays(value: number): string {
    const daysLabel = this.translate.instant('reports.recruitment.days');
    return `${value.toFixed(0)} ${daysLabel}`;
  }

  getConversionRateClasses(rate: number): string {
    if (rate >= 10) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (rate >= 5) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  }

  getJobStatusClasses(status: string): string {
    switch (status) {
      case 'OPEN': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'CLOSED': return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400';
      case 'FILLED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'ON_HOLD': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'DRAFT': return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
      case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
    }
  }

  getPostingStatusClasses(status: string): string {
    switch (status) {
      case 'POSTED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'FAILED':
      case 'REQUIRES_MANUAL': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'EXPIRED': return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400';
      case 'PENDING':
      case 'QUEUED': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'POSTING': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'REMOVED': return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
      default: return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
    }
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
    this.reportsService.downloadReportFile(reportId).subscribe({
      next: ({ blob, fileName }) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Failed to download report:', err);
        this.showError(this.translate.instant('reports.recruitment.messages.downloadFailed'));
      }
    });
  }

  onViewReport(report: ReportListItem): void {
    if (report.status !== 'COMPLETED') return;
    this.reportsService.downloadReportFile(report.id).subscribe({
      next: ({ blob }) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      },
      error: (err) => {
        console.error('Failed to view report:', err);
        this.showError(this.translate.instant('reports.recruitment.messages.downloadFailed'));
      }
    });
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
