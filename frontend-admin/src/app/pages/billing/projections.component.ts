import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillingService } from '@core/services/billing.service';
import { RevenueProjection } from '@core/models/billing.model';
import { CardComponent } from '@core/components/ui/card.component';
import { SelectComponent, SelectOption } from '@core/components/ui/select.component';
import { CurrencyZarPipe } from '@core/pipes/currency-zar.pipe';
import { NgApexchartsModule, ApexChart, ApexXAxis, ApexStroke, ApexDataLabels, ApexFill, ApexAnnotations } from 'ng-apexcharts';

@Component({
  selector: 'app-projections',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, SelectComponent, CurrencyZarPipe, NgApexchartsModule],
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Revenue Projections</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Forecast based on current trends</p>
        </div>
        <app-select
          [options]="periodOptions"
          [(ngModel)]="selectedPeriod"
          (ngModelChange)="loadData()"
        />
      </div>

      <!-- Summary Cards -->
      <div class="grid gap-6 sm:grid-cols-3">
        <div class="stats-card">
          <p class="stats-card-label">Projected MRR (EOY)</p>
          <p class="stats-card-value">{{ endOfYearMrr | currencyZar }}</p>
        </div>
        <div class="stats-card">
          <p class="stats-card-label">Projected ARR (EOY)</p>
          <p class="stats-card-value">{{ endOfYearArr | currencyZar }}</p>
        </div>
        <div class="stats-card">
          <p class="stats-card-label">Projected Growth</p>
          <p class="stats-card-value">+{{ projectedGrowth }}%</p>
        </div>
      </div>

      <!-- Projection Chart -->
      <app-card title="Revenue Projection">
        @if (chartSeries().length > 0) {
          <apx-chart
            [series]="chartSeries()"
            [chart]="chartOptions"
            [xaxis]="xaxis()"
            [stroke]="stroke"
            [dataLabels]="dataLabels"
            [fill]="fill"
            [colors]="['#465FFF', '#8098F9', '#C7D7FE']"
          ></apx-chart>
        } @else {
          <div class="flex items-center justify-center h-[350px] text-gray-400">
            Loading projection data...
          </div>
        }
      </app-card>

      <!-- Projection Table -->
      <app-card title="Monthly Projections">
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead class="border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Month</th>
                <th class="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-400">Projected MRR</th>
                <th class="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-400">Projected ARR</th>
                <th class="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-400">Confidence Range</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              @for (projection of projections(); track projection.month) {
                <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                  <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ projection.month }}</td>
                  <td class="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{{ projection.projectedMrr | currencyZar }}</td>
                  <td class="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{{ projection.projectedArr | currencyZar }}</td>
                  <td class="px-4 py-3 text-right text-sm text-gray-500 dark:text-gray-400">
                    {{ projection.confidenceInterval.low | currencyZar }} - {{ projection.confidenceInterval.high | currencyZar }}
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
export class ProjectionsComponent implements OnInit {
  private billingService = inject(BillingService);

  projections = signal<RevenueProjection[]>([]);
  selectedPeriod = 12;

  chartSeries = signal<any[]>([]);
  xaxis = signal<ApexXAxis>({ categories: [] });
  chartOptions: ApexChart = { type: 'area', height: 350, toolbar: { show: false } };
  stroke: ApexStroke = { curve: 'smooth', width: [3, 1, 1], dashArray: [0, 5, 5] };
  dataLabels: ApexDataLabels = { enabled: false };
  fill: ApexFill = { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0.1 } };

  periodOptions: SelectOption[] = [
    { label: '6 Months', value: 6 },
    { label: '12 Months', value: 12 },
    { label: '24 Months', value: 24 }
  ];

  get endOfYearMrr(): number {
    const p = this.projections();
    return p.length > 0 ? p[p.length - 1].projectedMrr : 0;
  }

  get endOfYearArr(): number {
    const p = this.projections();
    return p.length > 0 ? p[p.length - 1].projectedArr : 0;
  }

  get projectedGrowth(): number {
    const p = this.projections();
    if (p.length < 2) return 0;
    const first = p[0].projectedMrr;
    const last = p[p.length - 1].projectedMrr;
    return Math.round(((last - first) / first) * 100);
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.billingService.getRevenueProjections(this.selectedPeriod).subscribe({
      next: (data) => {
        this.projections.set(data);
        this.updateChart(data);
      },
      error: () => this.setMockData()
    });
  }

  private updateChart(data: RevenueProjection[]): void {
    this.xaxis.set({ categories: data.map(d => d.month) });
    this.chartSeries.set([
      { name: 'Projected MRR', data: data.map(d => d.projectedMrr) },
      { name: 'Low Estimate', data: data.map(d => d.confidenceInterval.low) },
      { name: 'High Estimate', data: data.map(d => d.confidenceInterval.high) }
    ]);
  }

  private setMockData(): void {
    const data: RevenueProjection[] = [];
    let mrr = 156000;
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

    for (let i = 0; i < this.selectedPeriod; i++) {
      const growth = 1.05 + (Math.random() * 0.03);
      mrr = Math.round(mrr * growth);
      data.push({
        month: months[i % 12] + (i >= 12 ? ' 25' : ' 24'),
        projectedMrr: mrr,
        projectedArr: mrr * 12,
        confidenceInterval: {
          low: Math.round(mrr * 0.9),
          high: Math.round(mrr * 1.15)
        }
      });
    }

    this.projections.set(data);
    this.updateChart(data);
  }
}
