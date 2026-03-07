import { Component, Input, OnInit, OnChanges, ViewChild, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ChartComponent, ApexChart, ApexPlotOptions, ApexDataLabels, ApexLegend } from 'ng-apexcharts';
import { OnboardingFunnel } from '@core/models/analytics.model';

@Component({
  selector: 'app-onboarding-funnel-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-6">Onboarding Funnel</h3>
      @if (data.length > 0) {
        <apx-chart
          [series]="chartSeries"
          [chart]="chartOptions"
          [plotOptions]="plotOptions"
          [dataLabels]="dataLabels"
          [legend]="legend"
          [colors]="colors"
        ></apx-chart>
      } @else {
        <div class="h-64 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          No data available
        </div>
      }
    </div>
  `
})
export class OnboardingFunnelChartComponent implements OnInit, OnChanges {
  @Input() data: OnboardingFunnel[] = [];

  chartSeries: any[] = [];
  chartOptions: ApexChart = {
    type: 'bar',
    height: 280,
    toolbar: { show: false }
  };

  plotOptions: ApexPlotOptions = {
    bar: {
      horizontal: true,
      borderRadius: 4,
      distributed: true,
      dataLabels: {
        position: 'top'
      }
    }
  };

  dataLabels: ApexDataLabels = {
    enabled: true,
    textAnchor: 'start',
    formatter: function(val: number, opt: any) {
      return `${val}%`;
    },
    offsetX: 0,
    style: {
      fontSize: '12px',
      colors: ['#fff']
    }
  };

  legend: ApexLegend = {
    show: false
  };

  // TailAdmin brand color gradient
  colors = ['#465FFF', '#8098F9', '#A4BCFD', '#C7D7FE', '#E0EAFF'];

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
      this.chartSeries = [{
        name: 'Conversion',
        data: this.data.map(d => ({
          x: d.stage,
          y: d.percentage,
          goals: [{ name: 'Count', value: d.count, strokeColor: '#fff' }]
        }))
      }];
    }
  }
}
