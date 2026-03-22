import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillingService } from '@core/services/billing.service';
import { RevenueMetrics, MonthlyRevenue, PlanRevenue } from '@core/models/billing.model';
import { CardComponent } from '@core/components/ui/card.component';
import { CurrencyZarPipe } from '@core/pipes/currency-zar.pipe';
import { NgApexchartsModule, ApexChart, ApexXAxis, ApexStroke, ApexDataLabels, ApexFill, ApexLegend } from 'ng-apexcharts';

@Component({
  selector: 'app-revenue-dashboard',
  standalone: true,
  imports: [CommonModule, CardComponent, CurrencyZarPipe, NgApexchartsModule],
  template: `
    <div class="flex flex-col gap-6">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Revenue Dashboard</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Track MRR, ARR, and revenue by plan</p>
      </div>

      <!-- Key Metrics -->
      <div class="stats-grid">
        <div class="stats-card">
          <p class="stats-card-label">MRR</p>
          <p class="stats-card-value">{{ metrics().mrr | currencyZar }}</p>
          <p class="text-sm mt-2 text-gray-500 dark:text-gray-400">
            {{ metrics().mrrGrowth >= 0 ? '+' : '' }}{{ metrics().mrrGrowth }}% vs last month
          </p>
        </div>
        <div class="stats-card">
          <p class="stats-card-label">ARR</p>
          <p class="stats-card-value">{{ metrics().arr | currencyZar }}</p>
        </div>
        <div class="stats-card">
          <p class="stats-card-label">Avg Revenue/Tenant</p>
          <p class="stats-card-value">{{ metrics().avgRevenuePerTenant | currencyZar }}</p>
        </div>
        <div class="stats-card">
          <p class="stats-card-label">Total Tenants</p>
          <p class="stats-card-value">{{ totalTenants }}</p>
        </div>
      </div>

      <!-- Revenue Trend Chart -->
      <app-card title="Monthly Revenue Trend">
        @if (trendSeries().length > 0) {
          <apx-chart
            [series]="trendSeries()"
            [chart]="trendChart"
            [xaxis]="trendXaxis()"
            [stroke]="trendStroke"
            [dataLabels]="dataLabels"
            [fill]="trendFill"
            [legend]="legend"
            [colors]="['#465FFF', '#12B76A', '#F79009', '#0BA5EC']"
          ></apx-chart>
        } @else {
          <div class="flex items-center justify-center h-[350px] text-gray-400">
            Loading chart data...
          </div>
        }
      </app-card>

      <!-- Revenue by Plan -->
      <div class="grid gap-6 lg:grid-cols-2">
        <app-card title="Revenue by Plan">
          @if (planSeries().length > 0) {
            <apx-chart
              [series]="planSeries()"
              [chart]="planChart"
              [labels]="planLabels()"
              [legend]="donutLegend"
              [colors]="['#465FFF', '#8098F9', '#C7D7FE', '#E0EAFF']"
            ></apx-chart>
          } @else {
            <div class="flex items-center justify-center h-[300px] text-gray-400">
              Loading chart data...
            </div>
          }
        </app-card>

        <app-card title="Plan Breakdown">
          <div class="space-y-4">
            @for (plan of metrics().revenueByPlan; track plan.plan) {
              <div class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div class="flex items-center gap-3">
                  <div
                    class="w-3 h-3 rounded-full"
                    [style.backgroundColor]="getPlanColor(plan.plan)"
                  ></div>
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">{{ plan.plan }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">{{ plan.tenantCount }} tenants</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-semibold text-gray-900 dark:text-white">{{ plan.revenue | currencyZar }}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ plan.percentage }}%</p>
                </div>
              </div>
            }
          </div>
        </app-card>
      </div>
    </div>
  `
})
export class RevenueDashboardComponent implements OnInit {
  private billingService = inject(BillingService);

  metrics = signal<RevenueMetrics>({
    mrr: 0,
    mrrGrowth: 0,
    arr: 0,
    avgRevenuePerTenant: 0,
    revenueByPlan: [],
    monthlyRevenue: []
  });

  trendSeries = signal<any[]>([]);
  trendXaxis = signal<ApexXAxis>({ categories: [] });
  trendChart: ApexChart = { type: 'area', height: 350, toolbar: { show: false }, stacked: false };
  trendStroke: ApexStroke = { curve: 'smooth', width: 2 };
  dataLabels: ApexDataLabels = { enabled: false };
  trendFill: ApexFill = { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0.1 } };
  legend: ApexLegend = { position: 'top', horizontalAlign: 'right' };

  planSeries = signal<number[]>([]);
  planLabels = signal<string[]>([]);
  planChart: ApexChart = { type: 'donut', height: 300 };
  donutLegend: ApexLegend = { position: 'bottom' };

  get totalTenants(): number {
    return this.metrics().revenueByPlan.reduce((sum, p) => sum + p.tenantCount, 0);
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.billingService.getRevenueMetrics().subscribe({
      next: (data) => {
        this.metrics.set(data);
        this.updateCharts(data);
      },
      error: () => this.setMockData()
    });
  }

  private updateCharts(data: RevenueMetrics): void {
    // Trend chart
    this.trendXaxis.set({ categories: data.monthlyRevenue.map(m => m.month) });
    this.trendSeries.set([
      { name: 'MRR', data: data.monthlyRevenue.map(m => m.mrr) },
      { name: 'New MRR', data: data.monthlyRevenue.map(m => m.newMrr) },
      { name: 'Churned MRR', data: data.monthlyRevenue.map(m => m.churnedMrr) },
      { name: 'Expansion MRR', data: data.monthlyRevenue.map(m => m.expansionMrr) }
    ]);

    // Plan chart
    this.planLabels.set(data.revenueByPlan.map(p => p.plan));
    this.planSeries.set(data.revenueByPlan.map(p => p.revenue));
  }

  getPlanColor(plan: string): string {
    const colors: Record<string, string> = {
      STARTER: '#E0EAFF',
      PROFESSIONAL: '#C7D7FE',
      ENTERPRISE: '#465FFF',
      TRIAL: '#8098F9'
    };
    return colors[plan] || '#8098F9';
  }

  private setMockData(): void {
    const data: RevenueMetrics = {
      mrr: 156000,
      mrrGrowth: 8.3,
      arr: 1872000,
      avgRevenuePerTenant: 629,
      revenueByPlan: [
        { plan: 'STARTER', revenue: 25000, tenantCount: 50, percentage: 16 },
        { plan: 'PROFESSIONAL', revenue: 75000, tenantCount: 50, percentage: 48 },
        { plan: 'ENTERPRISE', revenue: 50000, tenantCount: 10, percentage: 32 },
        { plan: 'TRIAL', revenue: 6000, tenantCount: 38, percentage: 4 }
      ],
      monthlyRevenue: [
        { month: 'Jan', mrr: 120000, newMrr: 15000, churnedMrr: 3000, expansionMrr: 2000 },
        { month: 'Feb', mrr: 128000, newMrr: 12000, churnedMrr: 4000, expansionMrr: 3000 },
        { month: 'Mar', mrr: 135000, newMrr: 10000, churnedMrr: 3000, expansionMrr: 2500 },
        { month: 'Apr', mrr: 142000, newMrr: 11000, churnedMrr: 4000, expansionMrr: 3500 },
        { month: 'May', mrr: 150000, newMrr: 13000, churnedMrr: 5000, expansionMrr: 4000 },
        { month: 'Jun', mrr: 156000, newMrr: 10000, churnedMrr: 4000, expansionMrr: 3000 }
      ]
    };
    this.metrics.set(data);
    this.updateCharts(data);
  }
}
