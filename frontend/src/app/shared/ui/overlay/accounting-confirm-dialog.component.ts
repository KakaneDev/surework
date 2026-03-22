import { Component, ChangeDetectionStrategy, inject, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yModule, FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';
import { SpinnerComponent } from '../feedback/spinner.component';

let dialogIdCounter = 0;

/**
 * Specialized confirmation dialog for accounting actions.
 * Provides loading state, entry details preview, and proper accessibility.
 *
 * @example
 * <sw-accounting-confirm-dialog
 *   [open]="showPostDialog"
 *   type="post"
 *   title="Post Journal Entry"
 *   message="This action is permanent and cannot be undone."
 *   [entryNumber]="entry.entryNumber"
 *   [entryDescription]="entry.description"
 *   [amount]="entry.totalDebit"
 *   confirmText="Post Entry"
 *   (confirm)="onPostConfirmed()"
 *   (cancel)="showPostDialog = false" />
 */
@Component({
  selector: 'sw-accounting-confirm-dialog',
  standalone: true,
  imports: [CommonModule, A11yModule, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/50 dark:bg-black/70 z-40 animate-fade-in"
           (click)="onBackdropClick($event)"
           aria-hidden="true"></div>

      <!-- Dialog -->
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div role="alertdialog"
             aria-modal="true"
             [attr.aria-labelledby]="dialogTitleId"
             [attr.aria-describedby]="dialogDescId"
             class="bg-white dark:bg-dark-surface rounded-xl shadow-dropdown w-full max-w-md animate-scale-in">

          <div class="p-6">
            <!-- Header with Icon -->
            <div class="flex items-start gap-4">
              <div [class]="iconContainerClasses()" class="flex-shrink-0 p-2.5 rounded-full" aria-hidden="true">
                <span class="material-icons text-xl">{{ iconName() }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <h3 [id]="dialogTitleId" class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {{ title() }}
                </h3>
                <p [id]="dialogDescId" class="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                  {{ message() }}
                </p>
              </div>
            </div>

            <!-- Entry Details Preview -->
            @if (entryNumber()) {
              <div class="mt-4 p-4 bg-neutral-50 dark:bg-dark-elevated rounded-lg border border-neutral-200 dark:border-dark-border">
                <dl class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <dt class="text-neutral-500 dark:text-neutral-400">Entry Number</dt>
                    <dd class="font-mono font-medium text-neutral-800 dark:text-neutral-200">{{ entryNumber() }}</dd>
                  </div>
                  @if (entryDescription()) {
                    <div class="flex justify-between gap-4">
                      <dt class="text-neutral-500 dark:text-neutral-400 flex-shrink-0">Description</dt>
                      <dd class="text-neutral-800 dark:text-neutral-200 text-right truncate">{{ entryDescription() }}</dd>
                    </div>
                  }
                  @if (amount() !== null && amount() !== undefined) {
                    <div class="flex justify-between">
                      <dt class="text-neutral-500 dark:text-neutral-400">Amount</dt>
                      <dd class="font-mono font-medium text-neutral-800 dark:text-neutral-200">
                        R {{ amount()!.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                      </dd>
                    </div>
                  }
                  @if (additionalInfo()) {
                    <div class="flex justify-between">
                      <dt class="text-neutral-500 dark:text-neutral-400">{{ additionalInfoLabel() }}</dt>
                      <dd class="text-neutral-800 dark:text-neutral-200">{{ additionalInfo() }}</dd>
                    </div>
                  }
                </dl>
              </div>
            }

            <!-- Warning Message -->
            @if (warningMessage()) {
              <div class="mt-4 flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
                   role="alert">
                <span class="material-icons text-amber-600 text-lg flex-shrink-0" aria-hidden="true">warning</span>
                <p class="text-sm text-amber-800 dark:text-amber-200">{{ warningMessage() }}</p>
              </div>
            }

            <!-- Reason Input (for reversal) -->
            @if (showReasonInput()) {
              <div class="mt-4">
                <label [for]="reasonInputId" class="sw-label">{{ reasonLabel() }} <span class="text-red-500">*</span></label>
                <textarea [id]="reasonInputId"
                          [value]="reasonValue()"
                          (input)="onReasonInput($event)"
                          rows="3"
                          class="sw-input w-full"
                          [placeholder]="reasonPlaceholder()"
                          [attr.aria-required]="true"></textarea>
              </div>
            }

            <!-- Actions -->
            <div class="mt-6 flex justify-end gap-3">
              <button type="button"
                      (click)="onCancelClick()"
                      [disabled]="loading()"
                      class="sw-btn sw-btn-md sw-btn-outline">
                {{ cancelText() }}
              </button>
              <button type="button"
                      (click)="onConfirmClick()"
                      [disabled]="loading() || (showReasonInput() && !reasonValue())"
                      [class]="confirmButtonClasses()">
                @if (loading()) {
                  <sw-spinner size="sm" />
                  <span>Processing...</span>
                } @else {
                  <span class="material-icons text-lg" aria-hidden="true">{{ confirmIcon() }}</span>
                  <span>{{ confirmText() }}</span>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class AccountingConfirmDialogComponent {
  readonly dialogTitleId = `accounting-dialog-title-${++dialogIdCounter}`;
  readonly dialogDescId = `accounting-dialog-desc-${dialogIdCounter}`;
  readonly reasonInputId = `accounting-dialog-reason-${dialogIdCounter}`;

  // Dialog state
  open = input.required<boolean>();
  loading = signal(false);
  reasonValue = signal('');

  // Content
  type = input<'post' | 'reverse' | 'void' | 'delete' | 'approve'>('post');
  title = input<string>('Confirm Action');
  message = input<string>('Are you sure you want to proceed?');
  warningMessage = input<string>('');

  // Entry details
  entryNumber = input<string>('');
  entryDescription = input<string>('');
  amount = input<number | null>(null);
  additionalInfo = input<string>('');
  additionalInfoLabel = input<string>('Status');

  // Reason input (for reversals)
  showReasonInput = input<boolean>(false);
  reasonLabel = input<string>('Reason for action');
  reasonPlaceholder = input<string>('Enter the reason...');

  // Button text
  confirmText = input<string>('Confirm');
  cancelText = input<string>('Cancel');

  // Events
  confirm = output<string>();
  cancel = output<void>();

  iconName(): string {
    const icons: Record<string, string> = {
      post: 'check_circle',
      reverse: 'undo',
      void: 'cancel',
      delete: 'delete',
      approve: 'thumb_up'
    };
    return icons[this.type()] || 'help';
  }

  confirmIcon(): string {
    const icons: Record<string, string> = {
      post: 'check',
      reverse: 'undo',
      void: 'block',
      delete: 'delete',
      approve: 'check'
    };
    return icons[this.type()] || 'check';
  }

  iconContainerClasses(): string {
    const classes: Record<string, string> = {
      post: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      reverse: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
      void: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800/50 dark:text-neutral-400',
      delete: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
      approve: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
    };
    return classes[this.type()] || classes['post'];
  }

  confirmButtonClasses(): string {
    const base = 'sw-btn sw-btn-md inline-flex items-center gap-2';
    const typeClasses: Record<string, string> = {
      post: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
      reverse: 'bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500',
      void: 'bg-neutral-600 text-white hover:bg-neutral-700 focus:ring-neutral-500',
      delete: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      approve: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500'
    };
    return `${base} ${typeClasses[this.type()] || typeClasses['post']}`;
  }

  onReasonInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.reasonValue.set(target.value);
  }

  onConfirmClick(): void {
    this.confirm.emit(this.reasonValue());
  }

  onCancelClick(): void {
    this.reasonValue.set('');
    this.cancel.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (!this.loading()) {
      this.cancel.emit();
    }
  }

  setLoading(value: boolean): void {
    this.loading.set(value);
  }
}
