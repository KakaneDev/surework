import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AnalyticsService } from '@core/services/analytics.service';
import { ChurnMetrics, CohortAnalysis, ChurnedTenant } from '@core/models/analytics.model';
import { CardComponent } from '@core/components/ui/card.component';
import { BadgeComponent } from '@core/components/ui/badge.component';
import { CurrencyZarPipe } from '@core/pipes/currency-zar.pipe';
import { RelativeTimePipe } from '@core/pipes/relative-time.pipe';
import { NgApexchartsModule, ApexChart, ApexXAxis, ApexStroke, ApexDataLabels, ApexYAxis } from 'ng-apexcharts';

@Component({
  selector: 'app-churn-analysis',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent, BadgeComponent, CurrencyZarPipe, RelativeTimePipe, NgApexchartsModule],
  template: `
    <div class="flex flex-col gap-6">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Churn Analysis</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Track and understand customer churn</p>
      </div>

      <!-- Churn Stats -->
      <div class="stats-grid">
        <div class="stats-card">
          <p class="stats-card-label">Current Churn Rate</p>
          <p class="stats-card-value">{{ metrics().currentChurnRate }}%</p>
          <p class="text-sm mt-2 text-gray-500 dark:text-gray-400">
            {{ metrics().churnTrend > 0 ? '+' : '' }}{{ metrics().churnTrend }}% vs last month
          </p>
        </div>
        <div class="stats-card">
          <p class="stats-card-label">Previous Month</p>
          <p class="stats-card-value">{{ metrics().previousChurnRate }}%</p>
        </div>
        <div class="stats-card">
          <p class="stats-card-label">At Risk Tenants</p>
          <p class="stats-card-value">{{ metrics().atRiskTenants }}</p>
        </div>
        <div class="stats-card">
          <p class="stats-card-label">Churned MRR</p>
          <p class="stats-card-value">{{ churnedMrr | currencyZar }}</p>
        </div>
      </div>

      <!-- Cohort Analysis -->
      <app-card title="Cohort Retention Analysis">
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead class="border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th class="px-3 py-2 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Cohort</th>
                <th class="px-3 py-2 text-center text-sm font-semibold text-gray-600 dark:text-gray-400">Initial</th>
                @for (i of [1,2,3,4,5,6]; track i) {
                  <th class="px-3 py-2 text-center text-sm font-semibold text-gray-600 dark:text-gray-400">Month {{ i }}</th>
                }
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              @for (cohort of cohorts(); track cohort.cohortMonth) {
                <tr>
                  <td class="px-3 py-2 font-medium text-gray-900 dark:text-white">{{ cohort.cohortMonth }}</td>
                  <td class="px-3 py-2 text-center text-gray-600 dark:text-gray-300">{{ cohort.initialTenants }}</td>
                  @for (rate of cohort.retentionRates; track $index) {
                    <td class="px-3 py-2 text-center">
                      <span
                        class="inline-block w-12 rounded px-2 py-1 text-xs font-medium"
                        [class]="getRetentionClass(rate)"
                      >
                        {{ rate }}%
                      </span>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-card>

      <!-- Recently Churned -->
      <app-card title="Recently Churned Tenants">
        <div class="space-y-3">
          @for (tenant of metrics().recentlyChurned; track tenant.tenantId) {
            <div class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div>
                <a
                  [routerLink]="['/tenants', tenant.tenantId]"
                  class="font-medium text-gray-900 hover:text-gray-600 dark:text-white dark:hover:text-gray-300"
                >
                  {{ tenant.tenantName }}
                </a>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ tenant.reason || 'No reason provided' }}
                </p>
              </div>
              <div class="text-right">
                <p class="font-medium text-gray-900 dark:text-white">-{{ tenant.mrr | currencyZar }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ tenant.churnedAt | relativeTime }}</p>
              </div>
            </div>
          } @empty {
            <p class="text-center text-gray-500 dark:text-gray-400 py-4">No recent churn</p>
          }
        </div>
      </app-card>
    </div>
  `
})
export class ChurnAnalysisComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);

  metrics = signal<ChurnMetrics>({
    currentChurnRate: 0,
    previousChurnRate: 0,
    churnTrend: 0,
    atRiskTenants: 0,
    recentlyChurned: []
  });
  cohorts = signal<CohortAnalysis[]>([]);

  get churnedMrr(): number {
    return this.metrics().recentlyChurned.reduce((sum, t) => sum + t.mrr, 0);
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.analyticsService.getChurnMetrics().subscribe({
      next: (data) => this.metrics.set(data),
      error: () => this.setMockMetrics()
    });

    this.analyticsService.getCohortAnalysis().subscribe({
      next: (data) => this.cohorts.set(data),
      error: () => this.setMockCohorts()
    });
  }

  getRetentionClass(rate: number): string {
    if (rate >= 90) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400';
    if (rate >= 70) return 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';
    return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400';
  }

  private setMockMetrics(): void {
    this.metrics.set({
      currentChurnRate: 2.4,
      previousChurnRate: 2.8,
      churnTrend: -0.4,
      atRiskTenants: 12,
      recentlyChurned: [
        { tenantId: '1', tenantName: 'Old Corp', churnedAt: new Date(Date.now() - 86400000).toISOString(), reason: 'Budget constraints', mrr: 1500 },
        { tenantId: '2', tenantName: 'Legacy Ltd', churnedAt: new Date(Date.now() - 3 * 86400000).toISOString(), reason: 'Switched to competitor', mrr: 2500 }
      ]
    });
  }

  private setMockCohorts(): void {
    this.cohorts.set([
      { cohortMonth: 'Jan 2024', initialTenants: 45, retentionRates: [100, 92, 88, 85, 82, 80] },
      { cohortMonth: 'Feb 2024', initialTenants: 52, retentionRates: [100, 94, 90, 87, 84] },
      { cohortMonth: 'Mar 2024', initialTenants: 48, retentionRates: [100, 91, 86, 83] },
      { cohortMonth: 'Apr 2024', initialTenants: 55, retentionRates: [100, 93, 89] },
      { cohortMonth: 'May 2024', initialTenants: 60, retentionRates: [100, 95] },
      { cohortMonth: 'Jun 2024', initialTenants: 58, retentionRates: [100] }
    ]);
  }
}
