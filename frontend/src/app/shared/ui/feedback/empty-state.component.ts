import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * Reusable empty state component for consistent empty/no-data UI across the app.
 * Provides accessible, styled feedback when lists or dashboards have no content.
 *
 * @example
 * <sw-empty-state
 *   icon="inbox"
 *   title="No invoices yet"
 *   description="Create your first invoice to get started"
 *   actionLabel="Create Invoice"
 *   [actionRoute]="['/accounting/invoicing/new']" />
 */
@Component({
  selector: 'sw-empty-state',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center py-12 text-center"
         role="status"
         [attr.aria-label]="title()">
      <span class="material-icons text-6xl mb-4"
            [class]="iconColorClass()"
            aria-hidden="true">
        {{ icon() }}
      </span>
      <h3 class="text-lg font-semibold text-neutral-700 dark:text-neutral-300">
        {{ title() }}
      </h3>
      @if (description()) {
        <p class="text-neutral-500 mt-2 max-w-md">
          {{ description() }}
        </p>
      }
      @if (actionLabel() && actionRoute().length) {
        <a [routerLink]="actionRoute()"
           class="sw-btn sw-btn-primary sw-btn-md mt-6">
          @if (actionIcon()) {
            <span class="material-icons text-lg" aria-hidden="true">{{ actionIcon() }}</span>
          }
          {{ actionLabel() }}
        </a>
      } @else if (actionLabel()) {
        <button (click)="actionClick.emit()"
                class="sw-btn sw-btn-primary sw-btn-md mt-6">
          @if (actionIcon()) {
            <span class="material-icons text-lg" aria-hidden="true">{{ actionIcon() }}</span>
          }
          {{ actionLabel() }}
        </button>
      }
    </div>
  `
})
export class EmptyStateComponent {
  /** Material icon name to display */
  icon = input<string>('inbox');

  /** Main title text */
  title = input.required<string>();

  /** Optional description text */
  description = input<string>('');

  /** Label for the action button */
  actionLabel = input<string>('');

  /** Route array for action button (uses routerLink) */
  actionRoute = input<string[]>([]);

  /** Icon for the action button */
  actionIcon = input<string>('');

  /** Variant for icon color styling */
  variant = input<'neutral' | 'success' | 'warning' | 'error'>('neutral');

  /** Event emitted when action button is clicked (if no route provided) */
  actionClick = output<void>();

  iconColorClass(): string {
    const colors: Record<string, string> = {
      neutral: 'text-neutral-300 dark:text-neutral-600',
      success: 'text-green-300 dark:text-green-700',
      warning: 'text-amber-300 dark:text-amber-700',
      error: 'text-red-300 dark:text-red-700'
    };
    return colors[this.variant()] || colors['neutral'];
  }
}
