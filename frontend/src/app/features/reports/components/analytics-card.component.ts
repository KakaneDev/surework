import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

export type SemanticColor = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'orange' | 'cyan' | 'pink';

export interface AnalyticsCardData {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  icon?: string;
  iconColor?: SemanticColor;
  loading?: boolean;
}

const COLOR_MAP: Record<SemanticColor, { bg: string; gradient: string }> = {
  primary: { bg: 'bg-primary-500', gradient: 'from-primary-500 to-primary-700' },
  success: { bg: 'bg-success-500', gradient: 'from-success-500 to-success-700' },
  warning: { bg: 'bg-warning-500', gradient: 'from-warning-500 to-warning-700' },
  error: { bg: 'bg-error-500', gradient: 'from-error-500 to-error-700' },
  info: { bg: 'bg-blue-500', gradient: 'from-blue-500 to-blue-700' },
  purple: { bg: 'bg-purple-500', gradient: 'from-purple-500 to-purple-700' },
  orange: { bg: 'bg-orange-500', gradient: 'from-orange-500 to-orange-700' },
  cyan: { bg: 'bg-cyan-500', gradient: 'from-cyan-500 to-cyan-700' },
  pink: { bg: 'bg-pink-500', gradient: 'from-pink-500 to-pink-700' }
};

@Component({
  selector: 'app-analytics-card',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    <div
      class="group relative overflow-hidden rounded-2xl border transition-gpu-shadow duration-normal"
      [class]="getCardClasses()"
      [class.cursor-pointer]="clickable"
      [class.hover:scale-[1.02]]="clickable"
      (click)="onClick()"
    >
      <!-- Gradient background overlay for highlight variant -->
      @if (variant === 'highlight') {
        <div class="absolute inset-0 bg-gradient-to-br opacity-5" [class]="getGradientClasses()"></div>
      }

      @if (loading) {
        <div class="animate-pulse p-6">
          <div class="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24 mb-4"></div>
          <div class="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-32 mb-2"></div>
          <div class="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-20"></div>
        </div>
      } @else {
        <div [class]="getContentPadding()">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <p [class]="getTitleClasses()">{{ title }}</p>
              <p [class]="getValueClasses()">
                @if (isNumber(value)) {
                  {{ value | number }}
                } @else {
                  {{ value }}
                }
              </p>
              @if (subtitle) {
                <p [class]="getSubtitleClasses()">{{ subtitle }}</p>
              }
              @if (trend && trendValue) {
                <div class="flex items-center mt-3">
                  <span [class]="getTrendClasses()">
                    @if (trend === 'up') {
                      <span class="material-icons text-sm">trending_up</span>
                    } @else if (trend === 'down') {
                      <span class="material-icons text-sm">trending_down</span>
                    } @else {
                      <span class="material-icons text-sm">trending_flat</span>
                    }
                    <span class="ml-1">{{ trendValue }}</span>
                  </span>
                </div>
              }
            </div>
            @if (icon) {
              <div [class]="getIconContainerClasses()">
                <span class="material-icons text-white" [class]="getIconSize()">{{ icon }}</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Hover glow effect -->
      @if (clickable) {
        <div
          class="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-fast pointer-events-none rounded-2xl"
          [class]="getHoverGlowClasses()"
        ></div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnalyticsCardComponent {
  @Input() title = '';
  @Input() value: string | number = '';
  @Input() subtitle?: string;
  @Input() trend?: 'up' | 'down' | 'stable';
  @Input() trendValue?: string;
  @Input() icon?: string;
  @Input() iconColor: SemanticColor = 'info';
  @Input() loading = false;
  @Input() variant: 'default' | 'highlight' | 'accent' = 'default';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() clickable = false;

  @Output() cardClick = new EventEmitter<void>();

  getGradientClasses(): string {
    return `bg-gradient-to-br ${COLOR_MAP[this.iconColor].gradient}`;
  }

  getHoverGlowClasses(): string {
    return COLOR_MAP[this.iconColor].bg;
  }

  getCardClasses(): string {
    const baseClasses = 'bg-white dark:bg-dark-surface shadow-card';

    let borderClasses = 'border-neutral-200 dark:border-dark-border';
    let hoverClasses = '';

    if (this.variant === 'highlight') {
      borderClasses = 'border-transparent';
      hoverClasses = 'hover:shadow-lg';
    } else if (this.variant === 'accent') {
      borderClasses = 'border-l-4';
      hoverClasses = 'hover:shadow-md';
    }

    if (this.clickable) {
      hoverClasses += ' hover:shadow-lg active:scale-[0.98]';
    }

    return `${baseClasses} ${borderClasses} ${hoverClasses}`;
  }

  getContentPadding(): string {
    switch (this.size) {
      case 'sm':
        return 'p-4';
      case 'lg':
        return 'p-8';
      default:
        return 'p-6';
    }
  }

  getTitleClasses(): string {
    const base = 'font-medium text-neutral-500 dark:text-neutral-400';
    switch (this.size) {
      case 'sm':
        return `${base} text-xs`;
      case 'lg':
        return `${base} text-base`;
      default:
        return `${base} text-sm`;
    }
  }

  getValueClasses(): string {
    const base = 'font-bold text-neutral-900 dark:text-neutral-100 mt-2';
    switch (this.size) {
      case 'sm':
        return `${base} text-xl`;
      case 'lg':
        return `${base} text-4xl`;
      default:
        return `${base} text-2xl`;
    }
  }

  getSubtitleClasses(): string {
    const base = 'text-neutral-500 dark:text-neutral-400 mt-1';
    switch (this.size) {
      case 'sm':
        return `${base} text-xs`;
      case 'lg':
        return `${base} text-base`;
      default:
        return `${base} text-sm`;
    }
  }

  getTrendClasses(): string {
    let colorClasses = '';
    switch (this.trend) {
      case 'up':
        colorClasses = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        break;
      case 'down':
        colorClasses = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        break;
      default:
        colorClasses = 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
    }
    return `inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colorClasses}`;
  }

  getIconContainerClasses(): string {
    let sizeClasses = '';
    switch (this.size) {
      case 'sm':
        sizeClasses = 'w-10 h-10';
        break;
      case 'lg':
        sizeClasses = 'w-16 h-16';
        break;
      default:
        sizeClasses = 'w-12 h-12';
    }
    const gradientClasses = `bg-gradient-to-br ${COLOR_MAP[this.iconColor].gradient}`;
    return `${sizeClasses} rounded-xl flex items-center justify-center shadow-lg transition-transform duration-fast group-hover:scale-110 ${gradientClasses}`;
  }

  getIconSize(): string {
    switch (this.size) {
      case 'sm':
        return 'text-lg';
      case 'lg':
        return 'text-3xl';
      default:
        return 'text-2xl';
    }
  }

  isNumber(value: string | number): boolean {
    return typeof value === 'number';
  }

  onClick(): void {
    if (this.clickable) {
      this.cardClick.emit();
    }
  }
}
