import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass, NgFor } from '@angular/common';

/**
 * Skeleton loading component for creating placeholder content during loading states.
 * Provides visual feedback that content is loading while maintaining layout stability.
 *
 * @example
 * // Basic text skeleton
 * <sw-skeleton width="200px" height="16px" />
 *
 * // Circle avatar skeleton
 * <sw-skeleton variant="circular" width="40px" height="40px" />
 *
 * // Full-width paragraph
 * <sw-skeleton variant="text" />
 */
@Component({
  selector: 'sw-skeleton',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      [ngClass]="skeletonClasses"
      [style.width]="width"
      [style.height]="height"
      role="presentation"
      aria-hidden="true"
    ></div>
  `,
  styles: [`
    :host {
      display: block;
    }

    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }

    .skeleton-shimmer {
      background: linear-gradient(
        90deg,
        var(--skeleton-base) 25%,
        var(--skeleton-highlight) 50%,
        var(--skeleton-base) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
    }
  `]
})
export class SkeletonComponent {
  @Input() variant: 'text' | 'circular' | 'rectangular' | 'rounded' = 'text';
  @Input() width = '100%';
  @Input() height = '1em';
  @Input() animation: 'pulse' | 'shimmer' | 'none' = 'shimmer';

  get skeletonClasses(): string {
    const base = '[--skeleton-base:theme(colors.neutral.200)] [--skeleton-highlight:theme(colors.neutral.100)] dark:[--skeleton-base:theme(colors.neutral.700)] dark:[--skeleton-highlight:theme(colors.neutral.600)]';

    const variants: Record<string, string> = {
      text: 'rounded',
      circular: 'rounded-full',
      rectangular: 'rounded-none',
      rounded: 'rounded-lg'
    };

    const animations: Record<string, string> = {
      pulse: 'animate-pulse bg-neutral-200 dark:bg-neutral-700',
      shimmer: 'skeleton-shimmer',
      none: 'bg-neutral-200 dark:bg-neutral-700'
    };

    return `${base} ${variants[this.variant]} ${animations[this.animation]}`;
  }
}

/**
 * Table skeleton component for displaying loading state in data tables.
 * Creates a realistic placeholder that matches table structure.
 *
 * @example
 * <sw-table-skeleton [columns]="5" [rows]="10" />
 */
@Component({
  selector: 'sw-table-skeleton',
  standalone: true,
  imports: [NgFor, SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overflow-hidden" role="presentation" aria-label="Loading table data">
      <!-- Header skeleton -->
      <div class="flex gap-4 px-4 py-3 bg-neutral-50 dark:bg-dark-elevated border-b border-neutral-200 dark:border-dark-border">
        @for (col of columnArray; track col) {
          <div [style.flex]="getColumnFlex(col)" class="flex items-center">
            <sw-skeleton variant="text" [width]="getHeaderWidth(col)" height="14px" />
          </div>
        }
      </div>

      <!-- Row skeletons -->
      @for (row of rowArray; track row) {
        <div class="flex gap-4 px-4 py-4 border-b border-neutral-100 dark:border-dark-border last:border-b-0">
          @for (col of columnArray; track col) {
            <div [style.flex]="getColumnFlex(col)" class="flex items-center">
              @if (col === 0 && showAvatar) {
                <div class="flex items-center gap-3">
                  <sw-skeleton variant="circular" width="36px" height="36px" />
                  <div class="space-y-2">
                    <sw-skeleton variant="text" width="120px" height="14px" />
                    <sw-skeleton variant="text" width="160px" height="12px" />
                  </div>
                </div>
              } @else if (col === columnArray.length - 1 && showActions) {
                <sw-skeleton variant="rounded" width="28px" height="28px" />
              } @else {
                <sw-skeleton variant="text" [width]="getCellWidth(col)" height="14px" />
              }
            </div>
          }
        </div>
      }
    </div>
  `
})
export class TableSkeletonComponent {
  @Input() columns = 5;
  @Input() rows = 5;
  @Input() showAvatar = true;
  @Input() showActions = true;

  get columnArray(): number[] {
    return Array.from({ length: this.columns }, (_, i) => i);
  }

  get rowArray(): number[] {
    return Array.from({ length: this.rows }, (_, i) => i);
  }

  getColumnFlex(col: number): string {
    // First column (usually name) gets more space
    if (col === 0) return '2';
    // Last column (actions) gets less space
    if (col === this.columns - 1) return '0.5';
    return '1';
  }

  getHeaderWidth(col: number): string {
    const widths = ['80px', '100px', '90px', '70px', '60px', '80px', '100px'];
    return widths[col % widths.length];
  }

  getCellWidth(col: number): string {
    const widths = ['100%', '80%', '60%', '70%', '90%', '75%', '85%'];
    return widths[col % widths.length];
  }
}

/**
 * Card skeleton component for loading states in card-based layouts.
 *
 * @example
 * <sw-card-skeleton [showImage]="true" />
 */
@Component({
  selector: 'sw-card-skeleton',
  standalone: true,
  imports: [SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200 dark:border-dark-border overflow-hidden"
         role="presentation" aria-label="Loading content">
      @if (showImage) {
        <sw-skeleton variant="rectangular" width="100%" height="160px" />
      }
      <div class="p-4 space-y-3">
        <sw-skeleton variant="text" width="70%" height="20px" />
        <sw-skeleton variant="text" width="100%" height="14px" />
        <sw-skeleton variant="text" width="85%" height="14px" />
        @if (showFooter) {
          <div class="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-dark-border mt-4">
            <sw-skeleton variant="text" width="80px" height="14px" />
            <sw-skeleton variant="rounded" width="100px" height="32px" />
          </div>
        }
      </div>
    </div>
  `
})
export class CardSkeletonComponent {
  @Input() showImage = false;
  @Input() showFooter = true;
}

/**
 * List skeleton component for loading states in list-based layouts.
 *
 * @example
 * <sw-list-skeleton [items]="5" [showAvatar]="true" />
 */
@Component({
  selector: 'sw-list-skeleton',
  standalone: true,
  imports: [NgFor, SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="divide-y divide-neutral-100 dark:divide-dark-border" role="presentation" aria-label="Loading list">
      @for (item of itemArray; track item) {
        <div class="flex items-center gap-4 py-4">
          @if (showAvatar) {
            <sw-skeleton variant="circular" width="40px" height="40px" />
          }
          <div class="flex-1 space-y-2">
            <sw-skeleton variant="text" width="60%" height="16px" />
            <sw-skeleton variant="text" width="80%" height="14px" />
          </div>
          @if (showAction) {
            <sw-skeleton variant="rounded" width="80px" height="32px" />
          }
        </div>
      }
    </div>
  `
})
export class ListSkeletonComponent {
  @Input() items = 5;
  @Input() showAvatar = true;
  @Input() showAction = false;

  get itemArray(): number[] {
    return Array.from({ length: this.items }, (_, i) => i);
  }
}

/**
 * Stats card skeleton for dashboard stat cards.
 *
 * @example
 * <sw-stats-skeleton />
 */
@Component({
  selector: 'sw-stats-skeleton',
  standalone: true,
  imports: [SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200 dark:border-dark-border p-5"
         role="presentation" aria-label="Loading statistics">
      <div class="flex items-start justify-between mb-4">
        <sw-skeleton variant="circular" width="40px" height="40px" />
        <sw-skeleton variant="text" width="60px" height="20px" />
      </div>
      <sw-skeleton variant="text" width="50%" height="28px" />
      <sw-skeleton variant="text" width="70%" height="14px" class="mt-2" />
    </div>
  `
})
export class StatsSkeletonComponent {}
