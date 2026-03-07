import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    <div class="flex flex-col items-center">
      <!-- Donut Chart -->
      <div class="relative" [style.width.px]="size" [style.height.px]="size">
        <!-- Chart Background -->
        <div
          class="absolute inset-0 rounded-full"
          [style]="getConicGradientStyle()"
        ></div>

        <!-- Center Hole -->
        <div
          class="absolute rounded-full bg-white dark:bg-dark-surface flex flex-col items-center justify-center"
          [style]="getCenterHoleStyle()"
        >
          <span class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ total | number }}</span>
          @if (centerLabel) {
            <span class="text-xs text-neutral-500 dark:text-neutral-400">{{ centerLabel }}</span>
          }
        </div>
      </div>

      <!-- Legend -->
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
                {{ segment.value | number }}
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
export class DonutChartComponent {
  @Input() segments: DonutSegment[] = [];
  @Input() size = 160;
  @Input() thickness = 24;
  @Input() centerLabel = 'Total';
  @Input() showLegend = true;
  @Input() legendColumns: 1 | 2 = 1;

  get total(): number {
    return this.segments.reduce((sum, s) => sum + s.value, 0);
  }

  getConicGradientStyle(): { [key: string]: string } {
    if (this.segments.length === 0 || this.total === 0) {
      return {
        background: '#e5e7eb' // neutral-200
      };
    }

    const gradientParts: string[] = [];
    let currentAngle = 0;

    this.segments.forEach((segment) => {
      const percentage = (segment.value / this.total) * 100;
      const endAngle = currentAngle + percentage;
      gradientParts.push(`${segment.color} ${currentAngle}% ${endAngle}%`);
      currentAngle = endAngle;
    });

    return {
      background: `conic-gradient(from 0deg, ${gradientParts.join(', ')})`
    };
  }

  getCenterHoleStyle(): { [key: string]: string } {
    const holeSize = this.size - (this.thickness * 2);
    const offset = this.thickness;
    return {
      width: `${holeSize}px`,
      height: `${holeSize}px`,
      top: `${offset}px`,
      left: `${offset}px`
    };
  }

  getLegendGridClass(): string {
    return this.legendColumns === 2 ? 'grid-cols-2' : 'grid-cols-1';
  }

  getPercentage(value: number): number {
    return this.total > 0 ? (value / this.total) * 100 : 0;
  }
}
