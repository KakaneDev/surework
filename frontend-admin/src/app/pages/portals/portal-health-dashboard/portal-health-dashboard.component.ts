import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  PortalAdminService,
  PortalCredentials,
  PortalHealthSummary,
  PortalStatusSummary,
  JobPortal,
  ConnectionStatus,
  ExternalPostingStats,
  PostingStats,
  DailyPostingStats,
  SuccessRateTrendPoint
} from '@shared/services/portal-admin.service';
import { BadgeComponent, BadgeColor } from '@shared/components/ui/badge.component';
import { ButtonComponent } from '@shared/components/ui/button.component';
import { CardComponent } from '@shared/components/ui/card.component';
import { RelativeTimePipe } from '@shared/pipes/relative-time.pipe';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

declare var ApexCharts: any;

interface PortalHealthCard {
  portal: JobPortal;
  name: string;
  logoUrl: string;
  connectionStatus: ConnectionStatus;
  active: boolean;
  postsToday: number;
  dailyLimit: number;
  lastSuccessfulPost: string | null;
  lastError: string | null;
  totalPosts: number;
  failedPosts: number;
}

interface DailyPostingData {
  date: string;
  portal: JobPortal;
  count: number;
}

@Component({
  selector: 'app-portal-health-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    BadgeComponent,
    ButtonComponent,
    CardComponent,
    RelativeTimePipe
  ],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Portal Health Dashboard</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitor the health and performance of all external job portals
          </p>
        </div>
        <div class="flex items-center gap-3">
          <app-button variant="outline" (click)="refreshAll()" [loading]="refreshing()">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Refresh
          </app-button>
        </div>
      </div>

      <!-- Overview Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div class="stats-card">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
              <svg class="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
            </div>
            <div>
              <p class="stats-card-label">Total Portals</p>
              <p class="stats-card-value">{{ healthSummary()?.totalPortals || 0 }}</p>
            </div>
          </div>
        </div>

        <div class="stats-card">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <svg class="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <div>
              <p class="stats-card-label">Active Portals</p>
              <p class="stats-card-value text-green-600 dark:text-green-400">{{ healthSummary()?.activePortals || 0 }}</p>
            </div>
          </div>
        </div>

        <div class="stats-card">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg class="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <div>
              <p class="stats-card-label">Posts Today</p>
              <p class="stats-card-value text-blue-600 dark:text-blue-400">{{ healthSummary()?.totalPostsToday || 0 }}</p>
            </div>
          </div>
        </div>

        <div class="stats-card">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <svg class="h-5 w-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <div>
              <p class="stats-card-label">Failed Today</p>
              <p class="stats-card-value text-red-600 dark:text-red-400">{{ stats()?.failedPostings || 0 }}</p>
            </div>
          </div>
        </div>

        <div class="stats-card">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg" [class]="getSuccessRateBgClass()">
              <svg class="h-5 w-5" [class]="getSuccessRateIconClass()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <div>
              <p class="stats-card-label">Success Rate</p>
              <p class="stats-card-value" [class]="getSuccessRateClass()">{{ stats()?.successRate || 0 | number:'1.1-1' }}%</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Alerts Section -->
      @if (alerts().length > 0) {
        <div class="space-y-3">
          @for (alert of alerts(); track alert.portal) {
            <div [class]="getAlertClass(alert.type)">
              <div class="flex items-center gap-3">
                <svg [class]="getAlertIconClass(alert.type)" class="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  @if (alert.type === 'error') {
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  } @else if (alert.type === 'warning') {
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  } @else {
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  }
                </svg>
                <div class="flex-1">
                  <p class="font-medium">{{ alert.title }}</p>
                  <p class="text-sm mt-0.5">{{ alert.message }}</p>
                </div>
                @if (alert.action) {
                  <a [routerLink]="alert.action.route" class="text-sm font-medium underline">
                    {{ alert.action.label }}
                  </a>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Posts Per Day Chart -->
        <app-card>
          <div class="p-5">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Posts Per Day (Last 7 Days)</h3>
            <div #postsChart id="postsChart" class="h-72"></div>
          </div>
        </app-card>

        <!-- Success Rate Trend Chart -->
        <app-card>
          <div class="p-5">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Success/Failure Rate Trend</h3>
            <div #rateChart id="rateChart" class="h-72"></div>
          </div>
        </app-card>
      </div>

      <!-- Portal Cards Grid -->
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Portal Status</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (card of portalCards(); track card.portal) {
            <app-card [noPadding]="true">
              <div class="p-5">
                <!-- Portal Header -->
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                      <img
                        [src]="card.logoUrl"
                        [alt]="card.name"
                        class="w-8 h-8 object-contain"
                        (error)="onLogoError($event)"
                      />
                    </div>
                    <div>
                      <h3 class="font-semibold text-gray-900 dark:text-white">{{ card.name }}</h3>
                      <div class="flex items-center gap-2 mt-1">
                        <span class="w-2 h-2 rounded-full" [class]="getStatusDotClass(card.connectionStatus)"></span>
                        <span class="text-sm text-gray-500 dark:text-gray-400">{{ formatConnectionStatus(card.connectionStatus) }}</span>
                      </div>
                    </div>
                  </div>
                  <app-badge [color]="card.active ? 'success' : 'gray'">
                    {{ card.active ? 'Active' : 'Inactive' }}
                  </app-badge>
                </div>

                <!-- Usage Progress -->
                <div class="mb-4">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Daily Usage</span>
                    <span class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ card.postsToday }} / {{ card.dailyLimit }}
                    </span>
                  </div>
                  <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      class="h-2 rounded-full transition-all duration-500"
                      [class]="getUsageBarClass(card.postsToday, card.dailyLimit)"
                      [style.width.%]="(card.postsToday / card.dailyLimit) * 100"
                    ></div>
                  </div>
                </div>

                <!-- Stats Row -->
                <div class="grid grid-cols-3 gap-3 mb-4 text-center">
                  <div class="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ card.totalPosts }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Total Posts</p>
                  </div>
                  <div class="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p class="text-lg font-semibold text-red-600 dark:text-red-400">{{ card.failedPosts }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Failed</p>
                  </div>
                  <div class="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ card.dailyLimit - card.postsToday }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Remaining</p>
                  </div>
                </div>

                <!-- Last Activity -->
                <div class="space-y-2 text-sm mb-4">
                  @if (card.lastSuccessfulPost) {
                    <div class="flex items-center justify-between">
                      <span class="text-gray-500 dark:text-gray-400">Last successful post</span>
                      <span class="text-gray-900 dark:text-white">{{ card.lastSuccessfulPost | relativeTime }}</span>
                    </div>
                  }
                  @if (card.lastError) {
                    <div class="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <p class="text-xs text-red-700 dark:text-red-400 truncate" [title]="card.lastError">
                        {{ card.lastError }}
                      </p>
                    </div>
                  }
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <app-button
                    variant="outline"
                    size="sm"
                    (click)="testConnection(card.portal)"
                    [loading]="testingPortal() === card.portal"
                  >
                    Test Connection
                  </app-button>
                  <a [routerLink]="['/portals/credentials']" [queryParams]="{portal: card.portal}">
                    <app-button variant="outline" size="sm">
                      View Credentials
                    </app-button>
                  </a>
                  @if (card.active) {
                    <app-button variant="ghost" size="sm" (click)="togglePortal(card.portal, false)">
                      Deactivate
                    </app-button>
                  } @else {
                    <app-button variant="primary" size="sm" (click)="togglePortal(card.portal, true)">
                      Activate
                    </app-button>
                  }
                </div>
              </div>
            </app-card>
          }
        </div>
      </div>
    </div>
  `
})
export class PortalHealthDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  private portalService = inject(PortalAdminService);
  private destroy$ = new Subject<void>();

  @ViewChild('postsChart') postsChartEl!: ElementRef;
  @ViewChild('rateChart') rateChartEl!: ElementRef;

  private postsChart: any;
  private rateChart: any;

  // State
  loading = signal(true);
  refreshing = signal(false);
  testingPortal = signal<JobPortal | null>(null);
  healthSummary = signal<PortalHealthSummary | null>(null);
  credentials = signal<PortalCredentials[]>([]);
  stats = signal<ExternalPostingStats | null>(null);
  postingStats = signal<PostingStats | null>(null);
  private chartsInitialized = false;

  // Computed
  portalCards = computed(() => this.buildPortalCards());
  alerts = computed(() => this.buildAlerts());

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    // Charts are initialized after postingStats data loads (see loadData)
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.postsChart?.destroy();
    this.rateChart?.destroy();
  }

  loadData(): void {
    this.loading.set(true);

    this.portalService.getHealthSummary().subscribe({
      next: (summary) => {
        this.healthSummary.set(summary);
        this.loading.set(false);
      },
      error: () => {
        this.setMockHealthSummary();
        this.loading.set(false);
      }
    });

    this.portalService.getCredentials().subscribe({
      next: (creds) => this.credentials.set(creds),
      error: () => this.setMockCredentials()
    });

    this.portalService.getStats().subscribe({
      next: (stats) => this.stats.set(stats),
      error: () => this.setMockStats()
    });

    // Fetch posting stats for the last 7 days (for charts)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    this.portalService.getPostingStats(startStr, endStr).subscribe({
      next: (postingStats) => {
        this.postingStats.set(postingStats);
        // Initialize or update charts once data is available
        setTimeout(() => {
          if (this.chartsInitialized) {
            this.updateCharts();
          } else {
            this.initCharts();
          }
        }, 0);
      },
      error: () => {
        this.postingStats.set({ dailyData: [], successRateTrend: [] });
        setTimeout(() => {
          if (!this.chartsInitialized) {
            this.initCharts();
          }
        }, 0);
      }
    });
  }

  refreshAll(): void {
    this.refreshing.set(true);
    this.loadData();
    setTimeout(() => {
      this.refreshing.set(false);
      this.updateCharts();
    }, 1000);
  }

  testConnection(portal: JobPortal): void {
    this.testingPortal.set(portal);
    this.portalService.testConnection(portal).subscribe({
      next: (result) => {
        this.testingPortal.set(null);
        alert(result.success ? `Connection successful: ${result.message}` : `Connection failed: ${result.message}`);
        this.loadData();
      },
      error: (err) => {
        this.testingPortal.set(null);
        alert(`Test failed: ${err.message}`);
      }
    });
  }

  togglePortal(portal: JobPortal, activate: boolean): void {
    const action = activate
      ? this.portalService.activatePortal(portal)
      : this.portalService.deactivatePortal(portal);

    action.subscribe({
      next: () => this.loadData(),
      error: (err) => alert(`Failed to ${activate ? 'activate' : 'deactivate'}: ${err.message}`)
    });
  }

  onLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  // Chart initialization
  private initCharts(): void {
    if (typeof ApexCharts === 'undefined') {
      console.warn('ApexCharts not loaded');
      return;
    }

    this.initPostsChart();
    this.initRateChart();
    this.chartsInitialized = true;
  }

  private initPostsChart(): void {
    const { categories, series } = this.buildPostsChartData();

    const options = {
      chart: {
        type: 'bar',
        height: 280,
        stacked: true,
        toolbar: { show: false },
        fontFamily: 'inherit'
      },
      series,
      xaxis: {
        categories,
        labels: { style: { colors: '#64748b', fontSize: '12px' } }
      },
      yaxis: {
        labels: { style: { colors: '#64748b', fontSize: '12px' } }
      },
      colors: ['#0ea5e9', '#3b82f6', '#8b5cf6', '#10b981'],
      plotOptions: {
        bar: { borderRadius: 4, columnWidth: '60%' }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        labels: { colors: '#64748b' }
      },
      grid: {
        borderColor: '#e2e8f0',
        strokeDashArray: 4
      },
      dataLabels: { enabled: false }
    };

    if (this.postsChartEl) {
      this.postsChart = new ApexCharts(this.postsChartEl.nativeElement, options);
      this.postsChart.render();
    }
  }

  private buildPostsChartData(): { categories: string[]; series: { name: string; data: number[] }[] } {
    const stats = this.postingStats();
    const days = this.getLast7Days();
    const dates = this.getLast7Dates();

    if (!stats || !stats.dailyData || stats.dailyData.length === 0) {
      return {
        categories: days,
        series: [
          { name: 'LinkedIn', data: new Array(7).fill(0) },
          { name: 'Pnet', data: new Array(7).fill(0) },
          { name: 'Indeed', data: new Array(7).fill(0) },
          { name: 'Careers24', data: new Array(7).fill(0) }
        ]
      };
    }

    const portals: { key: JobPortal; label: string }[] = [
      { key: 'LINKEDIN', label: 'LinkedIn' },
      { key: 'PNET', label: 'Pnet' },
      { key: 'INDEED', label: 'Indeed' },
      { key: 'CAREERS24', label: 'Careers24' }
    ];

    const series = portals.map(({ key, label }) => {
      const data = dates.map(date => {
        const match = stats.dailyData.find(d => d.date === date && d.portal === key);
        return match ? match.count : 0;
      });
      return { name: label, data };
    });

    return { categories: days, series };
  }

  private initRateChart(): void {
    const { categories, successData, failureData } = this.buildRateChartData();

    const options = {
      chart: {
        type: 'area',
        height: 280,
        toolbar: { show: false },
        fontFamily: 'inherit'
      },
      series: [
        { name: 'Success Rate', data: successData },
        { name: 'Failure Rate', data: failureData }
      ],
      xaxis: {
        categories,
        labels: { style: { colors: '#64748b', fontSize: '12px' } }
      },
      yaxis: {
        min: 0,
        max: 100,
        labels: {
          style: { colors: '#64748b', fontSize: '12px' },
          formatter: (val: number) => `${val}%`
        }
      },
      colors: ['#10b981', '#ef4444'],
      stroke: { curve: 'smooth', width: 2 },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.1
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        labels: { colors: '#64748b' }
      },
      grid: {
        borderColor: '#e2e8f0',
        strokeDashArray: 4
      },
      dataLabels: { enabled: false }
    };

    if (this.rateChartEl) {
      this.rateChart = new ApexCharts(this.rateChartEl.nativeElement, options);
      this.rateChart.render();
    }
  }

  private buildRateChartData(): { categories: string[]; successData: number[]; failureData: number[] } {
    const stats = this.postingStats();
    const days = this.getLast7Days();
    const dates = this.getLast7Dates();

    if (!stats || !stats.successRateTrend || stats.successRateTrend.length === 0) {
      return {
        categories: days,
        successData: new Array(7).fill(0),
        failureData: new Array(7).fill(0)
      };
    }

    const successData = dates.map(date => {
      const match = stats.successRateTrend.find(d => d.date === date);
      return match ? Math.round(match.successRate * 10) / 10 : 0;
    });

    const failureData = dates.map(date => {
      const match = stats.successRateTrend.find(d => d.date === date);
      return match ? Math.round(match.failureRate * 10) / 10 : 0;
    });

    return { categories: days, successData, failureData };
  }

  private updateCharts(): void {
    if (!this.chartsInitialized) return;

    const { series: postsSeries } = this.buildPostsChartData();
    const { successData, failureData } = this.buildRateChartData();

    if (this.postsChart) {
      this.postsChart.updateSeries(postsSeries);
    }
    if (this.rateChart) {
      this.rateChart.updateSeries([
        { name: 'Success Rate', data: successData },
        { name: 'Failure Rate', data: failureData }
      ]);
    }
  }

  private getLast7Days(): string[] {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
    }
    return days;
  }

  /** Returns last 7 dates as ISO date strings (YYYY-MM-DD) for matching API data. */
  private getLast7Dates(): string[] {
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }

  // Data building
  private buildPortalCards(): PortalHealthCard[] {
    const creds = this.credentials();
    const summary = this.healthSummary();

    const portals: JobPortal[] = ['LINKEDIN', 'PNET', 'INDEED', 'CAREERS24'];
    return portals.map(portal => {
      const cred = creds.find(c => c.portal === portal);
      const portalStatus = summary?.portals?.find(p => p.portal === portal);

      return {
        portal,
        name: this.portalService.getPortalLabel(portal),
        logoUrl: `/assets/icons/portals/${portal.toLowerCase()}.svg`,
        connectionStatus: cred?.connectionStatus || 'NOT_CONFIGURED',
        active: cred?.active || false,
        postsToday: portalStatus?.postsToday || cred?.postsToday || 0,
        dailyLimit: portalStatus?.dailyLimit || cred?.dailyRateLimit || 50,
        lastSuccessfulPost: (cred as any)?.lastSuccessfulPostAt || null,
        lastError: cred?.lastError || null,
        totalPosts: (cred as any)?.totalPostsCount || 0,
        failedPosts: (cred as any)?.failedPostsCount || 0
      };
    });
  }

  private buildAlerts(): Array<{
    portal: JobPortal;
    type: 'error' | 'warning' | 'info';
    title: string;
    message: string;
    action?: { label: string; route: string };
  }> {
    const alerts: any[] = [];
    const cards = this.portalCards();

    cards.forEach(card => {
      // Connection errors
      if (card.connectionStatus === 'INVALID_CREDENTIALS') {
        alerts.push({
          portal: card.portal,
          type: 'error',
          title: `${card.name} - Invalid Credentials`,
          message: 'The stored credentials are no longer valid. Please update them.',
          action: { label: 'Update Credentials', route: '/portals/credentials' }
        });
      } else if (card.connectionStatus === 'SESSION_EXPIRED') {
        alerts.push({
          portal: card.portal,
          type: 'warning',
          title: `${card.name} - Session Expired`,
          message: 'The session has expired and needs to be refreshed.',
          action: { label: 'Refresh Session', route: '/portals/credentials' }
        });
      } else if (card.connectionStatus === 'CAPTCHA_REQUIRED') {
        alerts.push({
          portal: card.portal,
          type: 'warning',
          title: `${card.name} - CAPTCHA Required`,
          message: 'Manual verification is needed to continue posting.',
          action: { label: 'View Details', route: '/portals/credentials' }
        });
      }

      // Rate limit warnings
      const usagePercent = (card.postsToday / card.dailyLimit) * 100;
      if (usagePercent >= 90 && card.active) {
        alerts.push({
          portal: card.portal,
          type: 'warning',
          title: `${card.name} - Rate Limit Warning`,
          message: `${card.postsToday}/${card.dailyLimit} posts used today (${usagePercent.toFixed(0)}%). Consider spreading posts across portals.`
        });
      }
    });

    return alerts;
  }

  // Helpers
  getStatusDotClass(status: ConnectionStatus): string {
    const classes: Record<ConnectionStatus, string> = {
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

  formatConnectionStatus(status: ConnectionStatus): string {
    const labels: Record<ConnectionStatus, string> = {
      NOT_CONFIGURED: 'Not Configured',
      CONNECTED: 'Connected',
      SESSION_EXPIRED: 'Session Expired',
      INVALID_CREDENTIALS: 'Invalid Credentials',
      RATE_LIMITED: 'Rate Limited',
      CAPTCHA_REQUIRED: 'CAPTCHA Required',
      ERROR: 'Error'
    };
    return labels[status] || status;
  }

  getUsageBarClass(used: number, limit: number): string {
    const percent = (used / limit) * 100;
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 70) return 'bg-amber-500';
    return 'bg-brand-500';
  }

  getSuccessRateBgClass(): string {
    const rate = this.stats()?.successRate ?? 0;
    if (rate >= 90) return 'bg-green-100 dark:bg-green-900/30';
    if (rate >= 70) return 'bg-amber-100 dark:bg-amber-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  }

  getSuccessRateIconClass(): string {
    const rate = this.stats()?.successRate ?? 0;
    if (rate >= 90) return 'text-green-600 dark:text-green-400';
    if (rate >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  }

  getSuccessRateClass(): string {
    const rate = this.stats()?.successRate ?? 0;
    if (rate >= 90) return 'text-green-600 dark:text-green-400';
    if (rate >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  }

  getAlertClass(type: 'error' | 'warning' | 'info'): string {
    const classes = {
      error: 'flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200',
      warning: 'flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-200',
      info: 'flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-800 dark:text-blue-200'
    };
    return classes[type];
  }

  getAlertIconClass(type: 'error' | 'warning' | 'info'): string {
    const classes = {
      error: 'text-red-600 dark:text-red-400',
      warning: 'text-amber-600 dark:text-amber-400',
      info: 'text-blue-600 dark:text-blue-400'
    };
    return classes[type];
  }

  // Mock data
  private setMockHealthSummary(): void {
    this.healthSummary.set({
      totalPortals: 4,
      activePortals: 3,
      portalsNeedingAttention: 1,
      totalPostsToday: 45,
      portals: [
        { portal: 'PNET', status: 'CONNECTED', active: true, postsToday: 18, dailyLimit: 50 },
        { portal: 'LINKEDIN', status: 'SESSION_EXPIRED', active: true, postsToday: 12, dailyLimit: 25 },
        { portal: 'INDEED', status: 'CONNECTED', active: true, postsToday: 15, dailyLimit: 40 },
        { portal: 'CAREERS24', status: 'NOT_CONFIGURED', active: false, postsToday: 0, dailyLimit: 50 }
      ]
    });
  }

  private setMockCredentials(): void {
    this.credentials.set([
      {
        id: '1',
        portal: 'PNET',
        username: 'sur****@surework.co.za',
        hasPassword: true,
        active: true,
        connectionStatus: 'CONNECTED',
        dailyRateLimit: 50,
        postsToday: 18,
        remainingPosts: 32,
        lastVerifiedAt: '2026-01-31T10:30:00Z',
        lastError: null,
        rateLimitResetAt: null
      },
      {
        id: '2',
        portal: 'LINKEDIN',
        username: 'job****@surework.co.za',
        hasPassword: true,
        active: true,
        connectionStatus: 'SESSION_EXPIRED',
        dailyRateLimit: 25,
        postsToday: 12,
        remainingPosts: 13,
        lastVerifiedAt: '2026-01-30T14:00:00Z',
        lastError: 'Session expired - need to re-authenticate',
        rateLimitResetAt: null
      },
      {
        id: '3',
        portal: 'INDEED',
        username: 'car****@surework.co.za',
        hasPassword: true,
        active: true,
        connectionStatus: 'CONNECTED',
        dailyRateLimit: 40,
        postsToday: 15,
        remainingPosts: 25,
        lastVerifiedAt: '2026-01-31T09:00:00Z',
        lastError: null,
        rateLimitResetAt: null
      },
      {
        id: '4',
        portal: 'CAREERS24',
        username: null,
        hasPassword: false,
        active: false,
        connectionStatus: 'NOT_CONFIGURED',
        dailyRateLimit: 50,
        postsToday: 0,
        remainingPosts: 0,
        lastVerifiedAt: null,
        lastError: null,
        rateLimitResetAt: null
      }
    ]);
  }

  private setMockStats(): void {
    this.stats.set({
      totalRequests: 256,
      successfulPostings: 232,
      failedPostings: 12,
      pendingPostings: 8,
      requiresManualCount: 4,
      successRate: 90.6,
      byPortal: {
        PNET: 75,
        LINKEDIN: 58,
        INDEED: 68,
        CAREERS24: 55
      },
      byStatus: {
        POSTED: 232,
        FAILED: 12,
        PENDING: 8,
        REQUIRES_MANUAL: 4
      }
    });
  }
}
