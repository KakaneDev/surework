import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, inject, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { NgClass } from '@angular/common';
import { A11yModule, FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';

let dialogIdCounter = 0;

@Component({
  selector: 'sw-dialog',
  standalone: true,
  imports: [NgClass, A11yModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="p-6"
      role="dialog"
      [attr.aria-modal]="true"
      [attr.aria-labelledby]="title ? dialogTitleId : null"
      [attr.aria-describedby]="subtitle ? dialogDescId : null"
    >
      @if (title) {
        <div class="mb-4">
          <h2
            [id]="dialogTitleId"
            class="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
          >
            {{ title }}
          </h2>
          @if (subtitle) {
            <p
              [id]="dialogDescId"
              class="text-sm text-neutral-500 dark:text-neutral-400 mt-1"
            >
              {{ subtitle }}
            </p>
          }
        </div>
      }

      <div class="text-neutral-700 dark:text-neutral-300">
        <ng-content />
      </div>

      @if (showFooter) {
        <div class="mt-6 flex justify-end gap-3">
          <ng-content select="[dialogFooter]" />
        </div>
      }
    </div>
  `
})
export class DialogComponent implements AfterViewInit, OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private readonly focusTrapFactory = inject(FocusTrapFactory);
  private focusTrap: FocusTrap | null = null;

  @Input() title = '';
  @Input() subtitle = '';
  @Input() showFooter = true;
  @Input() trapFocus = true;

  readonly dialogTitleId = `sw-dialog-title-${++dialogIdCounter}`;
  readonly dialogDescId = `sw-dialog-desc-${dialogIdCounter}`;

  ngAfterViewInit(): void {
    if (this.trapFocus) {
      this.focusTrap = this.focusTrapFactory.create(this.elementRef.nativeElement);
      this.focusTrap.focusInitialElement();
    }
  }

  ngOnDestroy(): void {
    this.focusTrap?.destroy();
  }
}

@Component({
  selector: 'sw-confirm-dialog',
  standalone: true,
  imports: [NgClass, A11yModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="p-6"
      role="alertdialog"
      [attr.aria-modal]="true"
      [attr.aria-labelledby]="confirmTitleId"
      [attr.aria-describedby]="confirmDescId"
    >
      <div class="flex items-start gap-4">
        <!-- Icon -->
        <div [ngClass]="iconClasses" class="flex-shrink-0 p-2 rounded-full" aria-hidden="true">
          @switch (type) {
            @case ('danger') {
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
            @case ('warning') {
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            @default {
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          }
        </div>

        <div class="flex-1">
          <h3 [id]="confirmTitleId" class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {{ title }}
          </h3>
          <p [id]="confirmDescId" class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            {{ message }}
          </p>
        </div>
      </div>

      <div class="mt-6 flex justify-end gap-3">
        <button
          type="button"
          (click)="onCancel.emit()"
          class="sw-btn sw-btn-md sw-btn-outline"
        >
          {{ cancelText }}
        </button>
        <button
          type="button"
          (click)="onConfirm.emit()"
          [ngClass]="confirmButtonClasses"
          class="sw-btn sw-btn-md"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  `
})
export class ConfirmDialogComponent {
  readonly confirmTitleId = `sw-confirm-title-${++dialogIdCounter}`;
  readonly confirmDescId = `sw-confirm-desc-${dialogIdCounter}`;
  @Input() type: 'info' | 'warning' | 'danger' = 'info';
  @Input() title = 'Confirm';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';

  @Output() onConfirm = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  get iconClasses(): string {
    const colors: Record<string, string> = {
      info: 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
      warning: 'bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400',
      danger: 'bg-error-100 text-error-600 dark:bg-error-900/30 dark:text-error-400'
    };
    return colors[this.type];
  }

  get confirmButtonClasses(): string {
    const variants: Record<string, string> = {
      info: 'bg-primary-500 text-white hover:bg-primary-600',
      warning: 'bg-warning-500 text-white hover:bg-warning-600',
      danger: 'bg-error-500 text-white hover:bg-error-600'
    };
    return variants[this.type];
  }
}
