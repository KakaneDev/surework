import { Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ChartComponent, ApexChart, ApexDataLabels, ApexLegend, ApexPlotOptions, ApexResponsive, ApexStroke, ApexTheme } from 'ng-apexcharts';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export type ChartOptions = {
  series: number[];
  chart: ApexChart;
  labels: string[];
  colors: string[];
  plotOptions: ApexPlotOptions;
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  stroke: ApexStroke;
  responsive: ApexResponsive[];
  theme: ApexTheme;
};

/**
 * ApexCharts Donut Chart wrapper component.
 * TailAdmin style donut chart with teal color scheme.
 */
@Component({
  selector: 'app-apex-donut-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="flex flex-col items-center">
      @if (segments.length > 0) {
        <apx-chart
          #chartRef
          [series]="chartOptions.series"
          [chart]="chartOptions.chart"
          [labels]="chartOptions.labels"
          [colors]="chartOptions.colors"
          [plotOptions]="chartOptions.plotOptions"
          [dataLabels]="chartOptions.dataLabels"
          [legend]="chartOptions.legend"
          [stroke]="chartOptions.stroke"
          [responsive]="chartOptions.responsive"
          [theme]="chartOptions.theme"
        />
      } @else {
        <!-- Empty state -->
        <div
          class="rounded-full bg-neutral-100 dark:bg-dark-elevated flex items-center justify-center"
          [style.width.px]="size"
          [style.height.px]="size"
        >
          <span class="text-neutral-400 dark:text-neutral-500 text-sm">No data</span>
        </div>
      }

      <!-- Custom Legend (if enabled) -->
      @if (showLegend && segments.length > 0) {
        <div class="mt-4 grid gap-2" [class]="getLegendGridClass()">
          @for (segment of segments; track segment.label) {
            <div class="flex items-center gap-2 text-sm">
              <div
                class="w-3 h-3 rounded-full flex-shrink-0"
                [style.background-color]="segment.color"
              ></div>
              <span class="text-neutral-600 dark:text-neutral-400 truncate">{{ segment.label }}</span>
              <span class="font-medium text-neutral-900 dark:text-neutral-100 ml-auto">
                {{ segment.value }}
              </span>
              <span class="text-neutral-400 dark:text-neutral-500 text-xs">
                ({{ getPercentage(segment.value) | number:'1.0-1' }}%)
              </span>
            </div>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApexDonutChartComponent implements OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('chartRef') chartRef!: ChartComponent;

  @Input() segments: DonutSegment[] = [];
  @Input() size = 160;
  @Input() centerLabel = 'Total';
  @Input() showLegend = true;
  @Input() legendColumns: 1 | 2 = 1;
  @Input() showApexLegend = false;

  chartOptions: ChartOptions = this.getDefaultOptions();

  private isDarkMode = false;

  ngAfterViewInit(): void {
    // Check for dark mode
    this.isDarkMode = document.documentElement.classList.contains('dark');
    this.updateChartOptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['segments'] || changes['size'] || changes['centerLabel']) {
      this.updateChartOptions();
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  get total(): number {
    return this.segments.reduce((sum, s) => sum + s.value, 0);
  }

  getPercentage(value: number): number {
    return this.total > 0 ? (value / this.total) * 100 : 0;
  }

  getLegendGridClass(): string {
    return this.legendColumns === 2 ? 'grid-cols-2' : 'grid-cols-1';
  }

  private getDefaultOptions(): ChartOptions {
    return {
      series: [],
      chart: {
        type: 'donut',
        width: this.size,
        height: this.size,
        fontFamily: 'Inter, sans-serif',
        background: 'transparent',
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 300
        }
      },
      labels: [],
      colors: [],
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '12px',
                fontWeight: 500,
                color: this.isDarkMode ? '#94a3b8' : '#64748b'
              },
              value: {
                show: true,
                fontSize: '24px',
                fontWeight: 700,
                color: this.isDarkMode ? '#f1f5f9' : '#0f172a',
                formatter: (val: string) => val
              },
              total: {
                show: true,
                label: this.centerLabel,
                fontSize: '12px',
                fontWeight: 500,
                color: this.isDarkMode ? '#94a3b8' : '#64748b',
                formatter: () => this.total.toString()
              }
            }
          }
        }
      },
      dataLabels: {
        enabled: false
      },
      legend: {
        show: this.showApexLegend,
        position: 'bottom',
        fontSize: '13px',
        fontWeight: 500,
        labels: {
          colors: this.isDarkMode ? '#94a3b8' : '#475569'
        },
        markers: {
          width: 6,
          height: 6,
          radius: 12
        }
      },
      stroke: {
        show: true,
        width: 2,
        colors: [this.isDarkMode ? '#1e293b' : '#ffffff']
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 280
            }
          }
        }
      ],
      theme: {
        mode: this.isDarkMode ? 'dark' : 'light'
      }
    };
  }

  private updateChartOptions(): void {
    this.isDarkMode = document.documentElement.classList.contains('dark');

    const series = this.segments.map(s => s.value);
    const labels = this.segments.map(s => s.label);
    const colors = this.segments.map(s => s.color);

    this.chartOptions = {
      ...this.getDefaultOptions(),
      series,
      labels,
      colors,
      chart: {
        ...this.getDefaultOptions().chart,
        width: this.size,
        height: this.size
      }
    };

    // Update chart if already rendered
    if (this.chartRef) {
      this.chartRef.updateOptions(this.chartOptions);
    }
  }
}
