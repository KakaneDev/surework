import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeColor = 'gray' | 'brand' | 'success' | 'warning' | 'error' | 'info' | 'outline';
export type BadgeSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="badgeClasses">
      @if (dot) {
        <span class="h-1.5 w-1.5 rounded-full" [class]="dotClasses"></span>
      }
      <ng-content></ng-content>
    </span>
  `
})
export class BadgeComponent {
  @Input() color: BadgeColor = 'gray';
  @Input() size: BadgeSize = 'md';
  @Input() dot = false;

  get badgeClasses(): string {
    const baseClasses = 'inline-flex items-center gap-1.5 rounded-full font-medium';

    const sizeClasses: Record<BadgeSize, string> = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-0.5 text-xs',
      lg: 'px-3 py-1 text-sm'
    };

    // TailAdmin badge colors
    const colorClasses: Record<BadgeColor, string> = {
      gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
      success: 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400',
      warning: 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400',
      error: 'bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400',
      info: 'bg-info-50 text-info-700 dark:bg-info-500/10 dark:text-info-400',
      outline: 'border border-gray-200 text-gray-700 bg-transparent dark:border-gray-700 dark:text-gray-300'
    };

    return `${baseClasses} ${sizeClasses[this.size]} ${colorClasses[this.color]}`;
  }

  get dotClasses(): string {
    const dotColorClasses: Record<BadgeColor, string> = {
      gray: 'bg-gray-500',
      brand: 'bg-brand-500',
      success: 'bg-success-500',
      warning: 'bg-warning-500',
      error: 'bg-error-500',
      info: 'bg-info-500',
      outline: 'bg-gray-500'
    };

    return dotColorClasses[this.color];
  }
}
