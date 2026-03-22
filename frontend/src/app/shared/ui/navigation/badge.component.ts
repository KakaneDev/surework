import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';

/**
 * Generic badge component with accessibility support.
 * Use ariaLabel input to provide screen reader context when the badge
 * conveys status information not clear from visible text alone.
 */
@Component({
  selector: 'sw-badge',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [ngClass]="badgeClasses"
          [attr.role]="ariaLabel ? 'status' : null"
          [attr.aria-label]="ariaLabel || null">
      @if (dot) {
        <span [ngClass]="dotClasses" aria-hidden="true"></span>
      }
      <ng-content />
    </span>
  `,
  styles: [`
    :host {
      display: inline-flex;
    }
  `]
})
export class BadgeComponent {
  @Input() variant: 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'info' = 'neutral';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() dot = false;
  @Input() rounded = false;
  /** Optional ARIA label for screen readers. When set, adds role="status" */
  @Input() ariaLabel?: string;

  get badgeClasses(): string {
    const base = 'inline-flex items-center font-medium';

    const sizes: Record<string, string> = {
      sm: 'px-2 py-0.5 text-xs gap-1',
      md: 'px-2.5 py-0.5 text-xs gap-1.5',
      lg: 'px-3 py-1 text-sm gap-2'
    };

    // TailAdmin style with teal primary and emerald success
    const variants: Record<string, string> = {
      primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
      success: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
      warning: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
      error: 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400',
      neutral: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
      info: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400'
    };

    const roundedClass = this.rounded ? 'rounded-full' : 'rounded-md';

    return `${base} ${sizes[this.size]} ${variants[this.variant]} ${roundedClass}`;
  }

  get dotClasses(): string {
    const variants: Record<string, string> = {
      primary: 'bg-primary-500',
      success: 'bg-success-500',
      warning: 'bg-warning-500',
      error: 'bg-error-500',
      neutral: 'bg-neutral-500',
      info: 'bg-blue-500'
    };

    return `w-1.5 h-1.5 rounded-full ${variants[this.variant]}`;
  }
}

/**
 * Status badge with built-in accessibility.
 * Automatically provides screen reader context for status values.
 */
@Component({
  selector: 'sw-status-badge',
  standalone: true,
  imports: [BadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sw-badge
      [variant]="statusVariant"
      [dot]="showDot"
      [rounded]="true"
      [size]="size"
      [ariaLabel]="computedAriaLabel">
      {{ label || statusLabel }}
    </sw-badge>
  `
})
export class StatusBadgeComponent {
  @Input() status: 'active' | 'pending' | 'inactive' | 'suspended' | 'approved' | 'rejected' | 'draft' = 'pending';
  @Input() label = '';
  @Input() showDot = true;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  /** Optional custom ARIA label. If not provided, uses "Status: {status}" */
  @Input() ariaLabel?: string;

  private readonly labelMap: Record<string, string> = {
    active: 'Active',
    approved: 'Approved',
    pending: 'Pending',
    draft: 'Draft',
    inactive: 'Inactive',
    suspended: 'Suspended',
    rejected: 'Rejected'
  };

  get statusLabel(): string {
    return this.labelMap[this.status] || this.status;
  }

  get computedAriaLabel(): string {
    if (this.ariaLabel) return this.ariaLabel;
    return `Status: ${this.label || this.statusLabel}`;
  }

  get statusVariant(): 'primary' | 'success' | 'warning' | 'error' | 'neutral' {
    const map: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'neutral'> = {
      active: 'success',
      approved: 'success',
      pending: 'warning',
      draft: 'neutral',
      inactive: 'neutral',
      suspended: 'error',
      rejected: 'error'
    };
    return map[this.status] || 'neutral';
  }
}
