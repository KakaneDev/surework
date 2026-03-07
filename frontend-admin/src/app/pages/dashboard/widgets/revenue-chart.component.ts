import { Component, Input, OnInit, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ApexChart, ApexXAxis, ApexStroke, ApexTooltip, ApexDataLabels, ApexYAxis, ApexGrid, ApexFill } from 'ng-apexcharts';
import { MonthlyRevenue } from '@core/models/billing.model';

@Component({
  selector: 'app-revenue-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">Revenue Overview</h3>
        <div class="flex gap-4 text-sm">
          <div class="flex items-center gap-2">
            <span class="h-2 w-2 rounded-full bg-brand-500"></span>
            <span class="text-gray-500 dark:text-gray-400">MRR</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="h-2 w-2 rounded-full bg-success-500"></span>
            <span class="text-gray-500 dark:text-gray-400">New MRR</span>
          </div>
        </div>
      </div>
      @if (chartSeries().length > 0) {
        <apx-chart
          [series]="chartSeries()"
          [chart]="chartOptions"
          [xaxis]="xaxis()"
          [yaxis]="yaxis"
          [stroke]="stroke"
          [tooltip]="tooltip"
          [dataLabels]="dataLabels"
          [grid]="grid"
          [fill]="fill"
          [colors]="colors"
        ></apx-chart>
      } @else {
        <div class="flex items-center justify-center h-[320px] text-gray-400">
          Loading chart data...
        </div>
      }
    </div>
  `
})
export class RevenueChartComponent implements OnInit, OnChanges {
  @Input() data: MonthlyRevenue[] = [];

  chartSeries = signal<any[]>([]);

  chartOptions: ApexChart = {
    type: 'area',
    height: 320,
    toolbar: { show: false },
    zoom: { enabled: false }
  };

  xaxis = signal<ApexXAxis>({
    categories: [],
    labels: {
      style: {
        colors: '#6B7280',
        fontSize: '12px'
      }
    },
    axisBorder: { show: false },
    axisTicks: { show: false }
  });

  yaxis: ApexYAxis = {
    labels: {
      formatter: (val: number) => `R${(val / 1000).toFixed(0)}k`,
      style: {
        colors: '#6B7280',
        fontSize: '12px'
      }
    }
  };

  stroke: ApexStroke = {
    curve: 'smooth',
    width: 2
  };

  tooltip: ApexTooltip = {
    y: {
      formatter: (val: number) => `R${val.toLocaleString('en-ZA')}`
    }
  };

  dataLabels: ApexDataLabels = {
    enabled: false
  };

  grid: ApexGrid = {
    borderColor: '#E5E5E5',
    strokeDashArray: 0,
    xaxis: { lines: { show: false } }
  };

  fill: ApexFill = {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.4,
      opacityTo: 0.1,
      stops: [0, 90, 100]
    }
  };

  // TailAdmin brand colors
  colors = ['#465FFF', '#12B76A'];

  ngOnInit(): void {
    this.updateChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.updateChart();
    }
  }

  private updateChart(): void {
    if (this.data.length > 0) {
      this.xaxis.set({
        categories: this.data.map(d => d.month),
        labels: {
          style: {
            colors: '#6B7280',
            fontSize: '12px'
          }
        },
        axisBorder: { show: false },
        axisTicks: { show: false }
      });

      this.chartSeries.set([
        {
          name: 'MRR',
          data: this.data.map(d => d.mrr)
        },
        {
          name: 'New MRR',
          data: this.data.map(d => d.newMrr)
        }
      ]);
    }
  }
}
