import { Component, ChangeDetectionStrategy, inject, signal, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { SettingsService, LeaveType, CreateLeaveTypeRequest } from '@core/services/settings.service';
import { SpinnerComponent, ToastService, ButtonComponent } from '@shared/ui';

@Component({
  selector: 'app-leave-policy-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, SpinnerComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/50 z-50" (click)="onClose()"></div>

    <!-- Dialog -->
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="p-6 border-b border-neutral-200 dark:border-dark-border flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
              {{ isEditMode ? ('settings.leavePolicies.dialog.editTitle' | translate) : ('settings.leavePolicies.dialog.addTitle' | translate) }}
            </h2>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{{ 'settings.leavePolicies.dialog.subtitle' | translate }}</p>
          </div>
          <button
            type="button"
            (click)="onClose()"
            class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors"
          >
            <span class="material-icons text-neutral-500">close</span>
          </button>
        </div>

        <!-- Form -->
        <form [formGroup]="leaveForm" (ngSubmit)="onSubmit()" class="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="sw-label">{{ 'settings.leavePolicies.dialog.nameLabel' | translate }}</label>
              <input
                type="text"
                formControlName="name"
                class="sw-input"
                [class.sw-input-error]="leaveForm.get('name')?.invalid && leaveForm.get('name')?.touched"
                [placeholder]="'settings.leavePolicies.dialog.namePlaceholder' | translate"
              />
              @if (leaveForm.get('name')?.hasError('required') && leaveForm.get('name')?.touched) {
                <p class="sw-error-text">{{ 'settings.leavePolicies.dialog.nameRequired' | translate }}</p>
              }
            </div>

            <div>
              <label class="sw-label">{{ 'settings.leavePolicies.dialog.codeLabel' | translate }}</label>
              <input
                type="text"
                formControlName="code"
                class="sw-input uppercase"
                [class.sw-input-error]="leaveForm.get('code')?.invalid && leaveForm.get('code')?.touched"
                [placeholder]="'settings.leavePolicies.dialog.codePlaceholder' | translate"
                [readonly]="isEditMode"
              />
              @if (leaveForm.get('code')?.hasError('required') && leaveForm.get('code')?.touched) {
                <p class="sw-error-text">{{ 'settings.leavePolicies.dialog.codeRequired' | translate }}</p>
              }
            </div>
          </div>

          <div>
            <label class="sw-label">{{ 'settings.leavePolicies.dialog.descriptionLabel' | translate }}</label>
            <textarea
              formControlName="description"
              class="sw-input"
              rows="2"
              [placeholder]="'settings.leavePolicies.dialog.descriptionPlaceholder' | translate"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="sw-label">{{ 'settings.leavePolicies.dialog.defaultDaysLabel' | translate }}</label>
              <input
                type="number"
                formControlName="defaultDays"
                class="sw-input"
                [class.sw-input-error]="leaveForm.get('defaultDays')?.invalid && leaveForm.get('defaultDays')?.touched"
                min="0"
                max="365"
              />
              @if (leaveForm.get('defaultDays')?.hasError('required') && leaveForm.get('defaultDays')?.touched) {
                <p class="sw-error-text">{{ 'settings.leavePolicies.dialog.defaultDaysRequired' | translate }}</p>
              }
              @if (leaveForm.get('defaultDays')?.hasError('min') && leaveForm.get('defaultDays')?.touched) {
                <p class="sw-error-text">{{ 'settings.leavePolicies.dialog.defaultDaysMinError' | translate }}</p>
              }
            </div>

            <div>
              <label class="sw-label">{{ 'settings.leavePolicies.dialog.carryForwardDaysLabel' | translate }}</label>
              <input
                type="number"
                formControlName="carryForwardDays"
                class="sw-input"
                min="0"
                max="365"
                placeholder="0"
              />
              <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{{ 'settings.leavePolicies.dialog.carryForwardDaysHint' | translate }}</p>
            </div>
          </div>

          <div class="space-y-3 pt-2">
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                formControlName="requiresApproval"
                class="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
              <div>
                <p class="text-sm font-medium text-neutral-800 dark:text-neutral-100">{{ 'settings.leavePolicies.dialog.requiresApprovalLabel' | translate }}</p>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ 'settings.leavePolicies.dialog.requiresApprovalHint' | translate }}</p>
              </div>
            </label>

            <label class="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                formControlName="allowNegativeBalance"
                class="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
              <div>
                <p class="text-sm font-medium text-neutral-800 dark:text-neutral-100">{{ 'settings.leavePolicies.dialog.allowNegativeBalanceLabel' | translate }}</p>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ 'settings.leavePolicies.dialog.allowNegativeBalanceHint' | translate }}</p>
              </div>
            </label>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-dark-border">
            <button
              type="button"
              (click)="onClose()"
              class="sw-btn sw-btn-secondary sw-btn-md"
            >
              {{ 'settings.leavePolicies.dialog.cancelButton' | translate }}
            </button>
            <button
              type="submit"
              [disabled]="leaveForm.invalid || submitting()"
              class="sw-btn sw-btn-primary sw-btn-md"
            >
              @if (submitting()) {
                <sw-spinner size="sm" color="white" />
                <span>{{ isEditMode ? ('settings.leavePolicies.dialog.updatingButton' | translate) : ('settings.leavePolicies.dialog.creatingButton' | translate) }}</span>
              } @else {
                <span class="material-icons text-sm">{{ isEditMode ? 'save' : 'add' }}</span>
                <span>{{ isEditMode ? ('settings.leavePolicies.dialog.saveButton' | translate) : ('settings.leavePolicies.dialog.createButton' | translate) }}</span>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class LeavePolicyFormDialogComponent implements OnInit {
  @Input() leaveType: LeaveType | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<LeaveType>();

  private readonly fb = inject(FormBuilder);
  private readonly settingsService = inject(SettingsService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  submitting = signal(false);
  leaveForm: FormGroup;

  get isEditMode(): boolean {
    return !!this.leaveType;
  }

  constructor() {
    this.leaveForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      description: [''],
      defaultDays: [15, [Validators.required, Validators.min(0)]],
      carryForwardDays: [0, Validators.min(0)],
      requiresApproval: [true],
      allowNegativeBalance: [false]
    });
  }

  ngOnInit(): void {
    if (this.leaveType) {
      this.leaveForm.patchValue({
        name: this.leaveType.name,
        code: this.leaveType.code,
        description: this.leaveType.description || '',
        defaultDays: this.leaveType.defaultDays,
        carryForwardDays: this.leaveType.carryForwardDays,
        requiresApproval: this.leaveType.requiresApproval,
        allowNegativeBalance: this.leaveType.allowNegativeBalance
      });
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onSubmit(): void {
    if (this.leaveForm.invalid) return;

    this.submitting.set(true);
    const values = this.leaveForm.value;

    const request: CreateLeaveTypeRequest = {
      name: values.name,
      code: values.code.toUpperCase(),
      description: values.description || undefined,
      defaultDays: values.defaultDays,
      carryForwardDays: values.carryForwardDays || 0,
      requiresApproval: values.requiresApproval,
      allowNegativeBalance: values.allowNegativeBalance
    };

    const operation = this.isEditMode
      ? this.settingsService.updateLeaveType(this.leaveType!.id, request)
      : this.settingsService.createLeaveType(request);

    operation.pipe(
      catchError(err => {
        console.error('Error saving leave type:', err);
        const message = err.error?.message || this.translate.instant('settings.leavePolicies.dialog.errorSaving');
        this.toast.error(message);
        return of(null);
      }),
      finalize(() => this.submitting.set(false))
    ).subscribe(result => {
      if (result) {
        const message = this.isEditMode
          ? this.translate.instant('settings.leavePolicies.dialog.updateSuccess')
          : this.translate.instant('settings.leavePolicies.dialog.createSuccess');
        this.toast.success(message);
        this.saved.emit(result);
      }
    });
  }
}
