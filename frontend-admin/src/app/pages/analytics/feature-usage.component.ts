import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '@core/services/analytics.service';
import { FeatureUsage } from '@core/models/analytics.model';
import { CardComponent } from '@core/components/ui/card.component';
import { SelectComponent, SelectOption } from '@core/components/ui/select.component';
import { NgApexchartsModule, ApexChart, ApexXAxis, ApexDataLabels, ApexPlotOptions } from 'ng-apexcharts';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-feature-usage',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, SelectComponent, NgApexchartsModule],
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Feature Usage</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Understand which features are most popular</p>
        </div>
        <app-select
          [options]="periodOptions"
          [(ngModel)]="selectedPeriod"
          (ngModelChange)="loadData()"
        />
      </div>

      <!-- Usage Chart -->
      <app-card title="Feature Usage Heatmap">
        @if (chartSeries().length > 0) {
          <apx-chart
            [series]="chartSeries()"
            [chart]="chartOptions"
            [xaxis]="xaxis()"
            [dataLabels]="dataLabels"
            [plotOptions]="plotOptions"
            [colors]="['#465FFF']"
          ></apx-chart>
        } @else {
          <div class="flex items-center justify-center h-[350px] text-gray-400">
            Loading chart data...
          </div>
        }
      </app-card>

      <!-- Feature Table -->
      <app-card title="Detailed Breakdown">
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead class="border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Feature</th>
                <th class="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-400">Total Events</th>
                <th class="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-400">Unique Users</th>
                <th class="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-400">Unique Tenants</th>
                <th class="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-400">Trend</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              @for (feature of features(); track feature.featureCode) {
                <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                  <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ feature.featureName }}</td>
                  <td class="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{{ feature.totalEvents | number }}</td>
                  <td class="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{{ feature.uniqueUsers | number }}</td>
                  <td class="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{{ feature.uniqueTenants | number }}</td>
                  <td class="px-4 py-3 text-right">
                    <span class="font-medium text-gray-900 dark:text-white">
                      {{ feature.trend >= 0 ? '+' : '' }}{{ feature.trend }}%
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-card>
    </div>
  `
})
export class FeatureUsageComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);

  features = signal<FeatureUsage[]>([]);
  selectedPeriod: 'week' | 'month' | 'quarter' = 'month';

  chartSeries = signal<any[]>([]);
  xaxis = signal<ApexXAxis>({ categories: [] });
  chartOptions: ApexChart = { type: 'bar', height: 350, toolbar: { show: false } };
  dataLabels: ApexDataLabels = { enabled: false };
  plotOptions: ApexPlotOptions = { bar: { horizontal: true, borderRadius: 4 } };

  periodOptions: SelectOption[] = [
    { label: 'Last Week', value: 'week' },
    { label: 'Last Month', value: 'month' },
    { label: 'Last Quarter', value: 'quarter' }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.analyticsService.getFeatureUsage(this.selectedPeriod).subscribe({
      next: (data) => {
        this.features.set(data);
        this.updateChart(data);
      },
      error: () => this.setMockData()
    });
  }

  private updateChart(data: FeatureUsage[]): void {
    const sorted = [...data].sort((a, b) => b.totalEvents - a.totalEvents).slice(0, 10);
    this.xaxis.set({ categories: sorted.map(f => f.featureName) });
    this.chartSeries.set([{ name: 'Events', data: sorted.map(f => f.totalEvents) }]);
  }

  private setMockData(): void {
    const data: FeatureUsage[] = [
      { featureCode: 'payroll', featureName: 'Payroll Processing', totalEvents: 15234, uniqueUsers: 892, uniqueTenants: 198, trend: 12 },
      { featureCode: 'leave', featureName: 'Leave Management', totalEvents: 12456, uniqueUsers: 1024, uniqueTenants: 205, trend: 8 },
      { featureCode: 'employees', featureName: 'Employee Records', totalEvents: 9876, uniqueUsers: 756, uniqueTenants: 195, trend: 5 },
      { featureCode: 'reports', featureName: 'Reporting', totalEvents: 7654, uniqueUsers: 432, uniqueTenants: 156, trend: -3 },
      { featureCode: 'time', featureName: 'Time Tracking', totalEvents: 6543, uniqueUsers: 567, uniqueTenants: 134, trend: 15 },
      { featureCode: 'documents', featureName: 'Documents', totalEvents: 4321, uniqueUsers: 345, uniqueTenants: 112, trend: 2 }
    ];
    this.features.set(data);
    this.updateChart(data);
  }
}
