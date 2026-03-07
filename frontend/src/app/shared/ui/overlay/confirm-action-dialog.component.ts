import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DialogComponent } from './dialog.component';
import { SpinnerComponent } from '../feedback/spinner.component';

/**
 * Dialog data interface for ConfirmActionDialog
 */
export interface ConfirmActionDialogData {
  /** Dialog title */
  title: string;
  /** Confirmation message */
  message: string;
  /** Text for confirm button */
  confirmText?: string;
  /** Text for cancel button */
  cancelText?: string;
  /** Dialog type affecting styling */
  type?: 'info' | 'warning' | 'danger';
  /** Icon name (Material Icons) */
  icon?: string;
  /** Item name being acted upon (for display) */
  itemName?: string;
  /** Additional context or warning message */
  additionalInfo?: string;
}

/**
 * Reusable confirmation dialog component for destructive or important actions.
 * Use this instead of browser confirm() for consistent UX and accessibility.
 *
 * @example
 * // In component
 * const dialogRef = this.dialogService.open(ConfirmActionDialogComponent, {
 *   data: {
 *     title: 'Delete Document',
 *     message: 'This action cannot be undone.',
 *     confirmText: 'Delete',
 *     type: 'danger',
 *     itemName: 'Contract.pdf'
 *   }
 * });
 *
 * dialogRef.afterClosed().then(confirmed => {
 *   if (confirmed) {
 *     // Perform action
 *   }
 * });
 */
@Component({
  selector: 'app-confirm-action-dialog',
  standalone: true,
  imports: [CommonModule, TranslateModule, DialogComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sw-dialog [title]="data.title" [showFooter]="false">
      <div class="min-w-[24rem] max-w-md">
        <!-- Icon and Message -->
        <div class="flex items-start gap-4">
          <div [class]="iconContainerClasses" class="flex-shrink-0 p-2.5 rounded-full">
            <span class="material-icons text-xl">{{ iconName }}</span>
          </div>
          <div class="flex-1 pt-0.5">
            <p class="text-neutral-700 dark:text-neutral-300">
              {{ data.message }}
            </p>
            @if (data.itemName) {
              <p class="mt-2 font-medium text-neutral-900 dark:text-neutral-100">
                "{{ data.itemName }}"
              </p>
            }
            @if (data.additionalInfo) {
              <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                {{ data.additionalInfo }}
              </p>
            }
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            (click)="onCancel()"
            [disabled]="loading()"
            class="sw-btn sw-btn-md sw-btn-outline"
          >
            {{ data.cancelText || defaultCancelText }}
          </button>
          <button
            type="button"
            (click)="onConfirm()"
            [disabled]="loading()"
            [class]="confirmButtonClasses"
          >
            @if (loading()) {
              <sw-spinner size="sm" />
              <span>{{ 'common.processing' | translate }}</span>
            } @else {
              <span class="material-icons text-lg">{{ confirmIconName }}</span>
              <span>{{ data.confirmText || defaultConfirmText }}</span>
            }
          </button>
        </div>
      </div>
    </sw-dialog>
  `
})
export class ConfirmActionDialogComponent {
  private readonly dialogRef = inject<{ close: (result?: boolean) => void }>('DIALOG_REF' as any);
  private readonly translate = inject(TranslateService);
  readonly data = inject<ConfirmActionDialogData>('DIALOG_DATA' as any);

  loading = signal(false);

  get defaultCancelText(): string {
    return this.translate.instant('common.cancel');
  }

  get defaultConfirmText(): string {
    return this.translate.instant('common.confirm');
  }

  get iconName(): string {
    if (this.data.icon) return this.data.icon;

    const icons: Record<string, string> = {
      info: 'help_outline',
      warning: 'warning_amber',
      danger: 'error_outline'
    };
    return icons[this.data.type || 'info'];
  }

  get confirmIconName(): string {
    const icons: Record<string, string> = {
      info: 'check',
      warning: 'check',
      danger: 'delete'
    };
    return icons[this.data.type || 'info'];
  }

  get iconContainerClasses(): string {
    // TailAdmin style with teal primary
    const classes: Record<string, string> = {
      info: 'bg-primary-100 text-primary-500 dark:bg-primary-900/30 dark:text-primary-400',
      warning: 'bg-warning-100 text-warning-500 dark:bg-warning-900/30 dark:text-warning-400',
      danger: 'bg-error-100 text-error-500 dark:bg-error-900/30 dark:text-error-400'
    };
    return classes[this.data.type || 'info'];
  }

  get confirmButtonClasses(): string {
    // TailAdmin style buttons with teal primary
    const base = 'sw-btn sw-btn-md inline-flex items-center gap-2 transition-colors duration-200';
    const typeClasses: Record<string, string> = {
      info: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500/50',
      warning: 'bg-warning-500 text-white hover:bg-warning-600 focus:ring-warning-500/50',
      danger: 'bg-error-500 text-white hover:bg-error-600 focus:ring-error-500/50'
    };
    return `${base} ${typeClasses[this.data.type || 'info']}`;
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  /** Set loading state (call from parent when async operation is in progress) */
  setLoading(value: boolean): void {
    this.loading.set(value);
  }
}
