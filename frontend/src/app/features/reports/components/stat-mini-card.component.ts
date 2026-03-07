import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { SemanticColor } from './analytics-card.component';

const COLOR_MAP: Record<SemanticColor, { bg: string; text: string; bgLight: string }> = {
  primary: { bg: 'bg-primary-500', text: 'text-primary-500', bgLight: 'bg-primary-100 dark:bg-primary-900/30' },
  success: { bg: 'bg-success-500', text: 'text-success-500', bgLight: 'bg-success-100 dark:bg-success-900/30' },
  warning: { bg: 'bg-warning-500', text: 'text-warning-500', bgLight: 'bg-warning-100 dark:bg-warning-900/30' },
  error: { bg: 'bg-error-500', text: 'text-error-500', bgLight: 'bg-error-100 dark:bg-error-900/30' },
  info: { bg: 'bg-blue-500', text: 'text-blue-500', bgLight: 'bg-blue-100 dark:bg-blue-900/30' },
  purple: { bg: 'bg-purple-500', text: 'text-purple-500', bgLight: 'bg-purple-100 dark:bg-purple-900/30' },
  orange: { bg: 'bg-orange-500', text: 'text-orange-500', bgLight: 'bg-orange-100 dark:bg-orange-900/30' },
  cyan: { bg: 'bg-cyan-500', text: 'text-cyan-500', bgLight: 'bg-cyan-100 dark:bg-cyan-900/30' },
  pink: { bg: 'bg-pink-500', text: 'text-pink-500', bgLight: 'bg-pink-100 dark:bg-pink-900/30' }
};

@Component({
  selector: 'app-stat-mini-card',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    <div
      class="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-dark-border/50 border border-neutral-100 dark:border-dark-border"
    >
      <!-- Icon -->
      @if (icon) {
        <div
          class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          [class]="getIconBgClasses()"
        >
          <span class="material-icons text-lg" [class]="getIconTextClasses()">{{ icon }}</span>
        </div>
      }

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-baseline gap-2">
          <span class="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            @if (isNumber(value)) {
              {{ value | number }}
            } @else {
              {{ value }}
            }
          </span>
          @if (suffix) {
            <span class="text-sm text-neutral-500 dark:text-neutral-400">{{ suffix }}</span>
          }
        </div>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 truncate">{{ label }}</p>
      </div>

      <!-- Trend -->
      @if (trend) {
        <div [class]="getTrendClasses()">
          @if (trend === 'up') {
            <span class="material-icons text-sm">arrow_upward</span>
          } @else if (trend === 'down') {
            <span class="material-icons text-sm">arrow_downward</span>
          } @else {
            <span class="material-icons text-sm">remove</span>
          }
          @if (trendValue) {
            <span class="text-xs font-medium">{{ trendValue }}</span>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatMiniCardComponent {
  @Input() label = '';
  @Input() value: string | number = '';
  @Input() suffix?: string;
  @Input() icon?: string;
  @Input() iconColor: SemanticColor = 'info';
  @Input() trend?: 'up' | 'down' | 'stable';
  @Input() trendValue?: string;

  getIconBgClasses(): string {
    return COLOR_MAP[this.iconColor].bgLight;
  }

  getIconTextClasses(): string {
    return COLOR_MAP[this.iconColor].text;
  }

  isNumber(value: string | number): boolean {
    return typeof value === 'number';
  }

  getTrendClasses(): string {
    const baseClasses = 'flex items-center gap-0.5 px-1.5 py-0.5 rounded-full';
    switch (this.trend) {
      case 'up':
        return `${baseClasses} bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400`;
      case 'down':
        return `${baseClasses} bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400`;
      default:
        return `${baseClasses} bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400`;
    }
  }
}
