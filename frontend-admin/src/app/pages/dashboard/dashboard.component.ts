import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AnalyticsService } from '@core/services/analytics.service';
import { BillingService } from '@core/services/billing.service';
import { DashboardKpis, OnboardingFunnel } from '@core/models/analytics.model';
import { MonthlyRevenue } from '@core/models/billing.model';
import { KpiStatsComponent } from './widgets/kpi-stats.component';
import { ActivityFeedComponent, ActivityItem } from './widgets/activity-feed.component';
import { OnboardingFunnelChartComponent } from './widgets/onboarding-funnel-chart.component';
import { RevenueChartComponent } from './widgets/revenue-chart.component';
import { CardComponent } from '@core/components/ui/card.component';
import { ButtonComponent } from '@core/components/ui/button.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    KpiStatsComponent,
    ActivityFeedComponent,
    OnboardingFunnelChartComponent,
    RevenueChartComponent,
    CardComponent,
    ButtonComponent
  ],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Page Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Welcome back! Here's what's happening.</p>
        </div>
        <div class="flex gap-3">
          <app-button variant="outline" size="sm" (click)="exportDashboard()">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Export
          </app-button>
          <app-button size="sm" (click)="refreshDashboard()">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Refresh
          </app-button>
        </div>
      </div>

      <!-- KPI Stats -->
      <div class="stats-grid">
        <app-kpi-stats
          label="Total Tenants"
          [value]="kpis().totalTenants"
          [trend]="kpis().tenantGrowth"
          [icon]="tenantIcon"
        />
        <app-kpi-stats
          label="Active Trials"
          [value]="kpis().activeTrials"
          [trend]="kpis().trialConversionRate"
          [icon]="trialIcon"
        />
        <app-kpi-stats
          label="MRR"
          [value]="kpis().mrr"
          [trend]="kpis().mrrGrowth"
          [isCurrency]="true"
          [icon]="revenueIcon"
        />
        <app-kpi-stats
          label="Churn Rate"
          [value]="kpis().churnRate + '%'"
          [trend]="kpis().churnTrend"
          [icon]="churnIcon"
        />
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div class="xl:col-span-2">
          <app-revenue-chart [data]="revenueData()" />
        </div>
        <div>
          <app-onboarding-funnel-chart [data]="onboardingFunnel()" />
        </div>
      </div>

      <!-- Bottom Row -->
      <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <!-- Activity Feed -->
        <div class="xl:col-span-2">
          <app-activity-feed [activities]="activities()" />
        </div>

        <!-- Quick Actions -->
        <div>
          <app-card title="Quick Actions">
            <div class="space-y-3">
              <a
                routerLink="/tenants"
                class="flex items-center gap-3 rounded-md border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div class="flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800">
                  <svg class="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">View Tenants</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Manage all tenants</p>
                </div>
              </a>

              <a
                routerLink="/support"
                class="flex items-center gap-3 rounded-md border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div class="flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800">
                  <svg class="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">Support Tickets</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Handle customer issues</p>
                </div>
              </a>

              <a
                routerLink="/trials"
                class="flex items-center gap-3 rounded-md border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div class="flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800">
                  <svg class="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">Trial Management</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Convert trials to paid</p>
                </div>
              </a>

              <a
                routerLink="/analytics/health"
                class="flex items-center gap-3 rounded-md border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div class="flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800">
                  <svg class="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">Health Scores</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Monitor at-risk tenants</p>
                </div>
              </a>
            </div>
          </app-card>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);
  private billingService = inject(BillingService);

  loading = signal(true);
  hasError = signal(false);
  errorMessage = signal('');
  kpis = signal<DashboardKpis>({
    totalTenants: 0,
    tenantGrowth: 0,
    activeTrials: 0,
    trialConversionRate: 0,
    mrr: 0,
    mrrGrowth: 0,
    churnRate: 0,
    churnTrend: 0,
    avgRevenuePerTenant: 0,
    activeUsers: 0
  });
  activities = signal<ActivityItem[]>([]);
  onboardingFunnel = signal<OnboardingFunnel[]>([]);
  revenueData = signal<MonthlyRevenue[]>([]);

  // Icons - monochrome gray for Vercel-inspired design
  tenantIcon = '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>';
  trialIcon = '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
  revenueIcon = '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
  churnIcon = '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/></svg>';

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.hasError.set(false);
    forkJoin({
      kpis: this.analyticsService.getDashboardKpis(),
      activities: this.analyticsService.getRecentActivity(10),
      funnel: this.analyticsService.getOnboardingFunnel(),
      revenue: this.billingService.getRevenueMetrics()
    }).subscribe({
      next: (data) => {
        this.kpis.set(data.kpis);
        this.activities.set(data.activities);
        this.onboardingFunnel.set(data.funnel);
        this.revenueData.set(data.revenue.monthlyRevenue);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load dashboard data:', err);
        this.loading.set(false);
        this.hasError.set(true);
        this.errorMessage.set('Failed to load dashboard data. Please try again.');
      }
    });
  }

  refreshDashboard(): void {
    this.loading.set(true);
    this.loadDashboardData();
  }

  exportDashboard(): void {
    const kpisData = this.kpis();
    const activitiesData = this.activities();
    const revenueDataArray = this.revenueData();
    const funnelData = this.onboardingFunnel();

    // Build CSV content
    let csv = '';

    // KPIs Section
    csv += 'DASHBOARD REPORT\n';
    csv += `Generated: ${new Date().toLocaleString()}\n\n`;

    csv += 'KEY PERFORMANCE INDICATORS\n';
    csv += 'Metric,Value,Trend\n';
    csv += `Total Tenants,${kpisData.totalTenants},${kpisData.tenantGrowth >= 0 ? '+' : ''}${kpisData.tenantGrowth}%\n`;
    csv += `Active Trials,${kpisData.activeTrials},${kpisData.trialConversionRate >= 0 ? '+' : ''}${kpisData.trialConversionRate}%\n`;
    csv += `MRR,R${kpisData.mrr.toLocaleString()},${kpisData.mrrGrowth >= 0 ? '+' : ''}${kpisData.mrrGrowth}%\n`;
    csv += `Churn Rate,${kpisData.churnRate}%,${kpisData.churnTrend >= 0 ? '+' : ''}${kpisData.churnTrend}%\n`;
    csv += `Avg Revenue Per Tenant,R${kpisData.avgRevenuePerTenant.toLocaleString()},\n`;
    csv += `Active Users,${kpisData.activeUsers},\n`;

    // Revenue Section
    csv += '\nMONTHLY REVENUE\n';
    csv += 'Month,MRR,New MRR,Churned MRR,Expansion MRR\n';
    revenueDataArray.forEach(r => {
      csv += `${r.month},R${r.mrr.toLocaleString()},R${r.newMrr.toLocaleString()},R${r.churnedMrr.toLocaleString()},R${r.expansionMrr.toLocaleString()}\n`;
    });

    // Onboarding Funnel Section
    csv += '\nONBOARDING FUNNEL\n';
    csv += 'Stage,Count,Percentage,Drop-off Rate\n';
    funnelData.forEach(f => {
      csv += `${f.stage},${f.count},${f.percentage}%,${f.dropOffRate}%\n`;
    });

    // Recent Activity Section
    csv += '\nRECENT ACTIVITY\n';
    csv += 'Type,Description,Tenant,Timestamp\n';
    activitiesData.forEach(a => {
      csv += `${a.type},"${a.description}",${a.tenantName || ''},${new Date(a.timestamp).toLocaleString()}\n`;
    });

    // Create and download the file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `dashboard-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  retryLoad(): void {
    this.loading.set(true);
    this.loadDashboardData();
  }
}
