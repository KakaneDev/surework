import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { ToastService, Toast } from './toast.service';

@Component({
  selector: 'sw-toast-container',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          [ngClass]="getToastClasses(toast.type)"
          class="pointer-events-auto animate-slide-down shadow-xl"
          role="alert"
        >
          <div class="flex items-start gap-3">
            <!-- Icon -->
            <div [ngClass]="getIconClasses(toast.type)">
              @switch (toast.type) {
                @case ('success') {
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                }
                @case ('error') {
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                }
                @case ('warning') {
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                }
                @case ('info') {
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              }
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              @if (toast.title) {
                <p [ngClass]="getTitleClasses(toast.type)">
                  {{ toast.title }}
                </p>
              }
              <p [ngClass]="getMessageClasses(toast.type, !!toast.title)">
                {{ toast.message }}
              </p>
            </div>

            <!-- Dismiss button -->
            @if (toast.dismissible) {
              <button
                type="button"
                (click)="dismiss(toast.id)"
                [ngClass]="getDismissClasses(toast.type)"
                aria-label="Dismiss notification"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);

  getToastClasses(type: Toast['type']): string {
    // Solid background colors for better visibility
    const styles: Record<Toast['type'], string> = {
      success: 'p-4 rounded-xl bg-success-50 dark:bg-success-900 border-2 border-success-500',
      error: 'p-4 rounded-xl bg-error-50 dark:bg-error-900 border-2 border-error-500',
      warning: 'p-4 rounded-xl bg-warning-50 dark:bg-warning-900 border-2 border-warning-500',
      info: 'p-4 rounded-xl bg-primary-50 dark:bg-primary-900 border-2 border-primary-500'
    };

    return styles[type];
  }

  getIconClasses(type: Toast['type']): string {
    const base = 'flex-shrink-0 p-1.5 rounded-full';

    const colors: Record<Toast['type'], string> = {
      success: 'bg-success-500 text-white',
      error: 'bg-error-500 text-white',
      warning: 'bg-warning-500 text-white',
      info: 'bg-primary-500 text-white'
    };

    return `${base} ${colors[type]}`;
  }

  getTitleClasses(type: Toast['type']): string {
    const colors: Record<Toast['type'], string> = {
      success: 'font-semibold text-success-800 dark:text-success-100',
      error: 'font-semibold text-error-800 dark:text-error-100',
      warning: 'font-semibold text-warning-800 dark:text-warning-100',
      info: 'font-semibold text-primary-800 dark:text-primary-100'
    };
    return colors[type];
  }

  getMessageClasses(type: Toast['type'], hasTitle: boolean): string {
    const colors: Record<Toast['type'], string> = {
      success: hasTitle ? 'text-sm text-success-700 dark:text-success-200' : 'text-success-800 dark:text-success-100',
      error: hasTitle ? 'text-sm text-error-700 dark:text-error-200' : 'text-error-800 dark:text-error-100',
      warning: hasTitle ? 'text-sm text-warning-700 dark:text-warning-200' : 'text-warning-800 dark:text-warning-100',
      info: hasTitle ? 'text-sm text-primary-700 dark:text-primary-200' : 'text-primary-800 dark:text-primary-100'
    };
    return colors[type];
  }

  getDismissClasses(type: Toast['type']): string {
    const base = 'flex-shrink-0 p-1 rounded-lg transition-colors';
    const colors: Record<Toast['type'], string> = {
      success: 'text-success-600 hover:text-success-800 hover:bg-success-100 dark:text-success-300 dark:hover:bg-success-800',
      error: 'text-error-600 hover:text-error-800 hover:bg-error-100 dark:text-error-300 dark:hover:bg-error-800',
      warning: 'text-warning-600 hover:text-warning-800 hover:bg-warning-100 dark:text-warning-300 dark:hover:bg-warning-800',
      info: 'text-primary-600 hover:text-primary-800 hover:bg-primary-100 dark:text-primary-300 dark:hover:bg-primary-800'
    };
    return `${base} ${colors[type]}`;
  }

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}
