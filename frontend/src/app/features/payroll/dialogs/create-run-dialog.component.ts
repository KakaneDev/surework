import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PayrollService, CreatePayrollRunRequest } from '../../../core/services/payroll.service';
import { SpinnerComponent, DialogRef } from '@shared/ui';

@Component({
  selector: 'app-create-run-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    SpinnerComponent
  ],
  template: `
    <div class="p-6 min-w-[400px]">
      <h2 class="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
        <span class="material-icons text-primary-500">payments</span>
        {{ 'payroll.createRunDialog.title' | translate }}
      </h2>

      <form [formGroup]="form" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="sw-label">{{ 'payroll.createRunDialog.labels.year' | translate }}</label>
            <select formControlName="periodYear" class="sw-input w-full">
              @for (year of years; track year) {
                <option [value]="year">{{ year }}</option>
              }
            </select>
          </div>

          <div>
            <label class="sw-label">{{ 'payroll.createRunDialog.labels.month' | translate }}</label>
            <select formControlName="periodMonth" class="sw-input w-full">
              @for (month of months; track month.value) {
                <option [value]="month.value">{{ 'common.months.' + month.translationKey | translate }}</option>
              }
            </select>
          </div>
        </div>

        <div>
          <label class="sw-label">{{ 'payroll.createRunDialog.labels.paymentDate' | translate }} *</label>
          <input type="date" formControlName="paymentDate" class="sw-input w-full"
                 [class.border-error-500]="form.get('paymentDate')?.touched && form.get('paymentDate')?.hasError('required')">
          @if (form.get('paymentDate')?.touched && form.get('paymentDate')?.hasError('required')) {
            <p class="text-sm text-error-500 mt-1">{{ 'payroll.createRunDialog.errors.paymentDateRequired' | translate }}</p>
          }
        </div>

        <div>
          <label class="sw-label">{{ 'payroll.createRunDialog.labels.notes' | translate }}</label>
          <textarea formControlName="notes" class="sw-input w-full" rows="3"
                    [placeholder]="'payroll.createRunDialog.placeholders.notes' | translate"></textarea>
        </div>

        @if (errorMessage()) {
          <div class="flex items-center gap-2 p-3 bg-error-50 text-error-600 rounded-lg text-sm">
            <span class="material-icons text-lg">error</span>
            {{ errorMessage() }}
          </div>
        }
      </form>

      <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-dark-border">
        <button type="button" (click)="cancel()" [disabled]="submitting()"
                class="sw-btn sw-btn-ghost sw-btn-md">
          {{ 'common.actions.cancel' | translate }}
        </button>
        <button type="button" (click)="submit()" [disabled]="form.invalid || submitting()"
                class="sw-btn sw-btn-primary sw-btn-md">
          @if (submitting()) {
            <sw-spinner size="sm" />
          } @else {
            <span class="material-icons text-lg">add</span>
          }
          {{ 'payroll.createRunDialog.actions.create' | translate }}
        </button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateRunDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly payrollService = inject(PayrollService);
  private readonly dialogRef: DialogRef = inject('DIALOG_REF' as any);
  private readonly translate = inject(TranslateService);

  submitting = signal(false);
  errorMessage = signal<string | null>(null);

  currentYear = new Date().getFullYear();
  years = [this.currentYear - 1, this.currentYear, this.currentYear + 1];

  months = [
    { value: 1, translationKey: 'january' },
    { value: 2, translationKey: 'february' },
    { value: 3, translationKey: 'march' },
    { value: 4, translationKey: 'april' },
    { value: 5, translationKey: 'may' },
    { value: 6, translationKey: 'june' },
    { value: 7, translationKey: 'july' },
    { value: 8, translationKey: 'august' },
    { value: 9, translationKey: 'september' },
    { value: 10, translationKey: 'october' },
    { value: 11, translationKey: 'november' },
    { value: 12, translationKey: 'december' }
  ];

  form: FormGroup = this.fb.group({
    periodYear: [this.currentYear, Validators.required],
    periodMonth: [new Date().getMonth() + 1, Validators.required],
    paymentDate: [this.getDefaultPaymentDate(), Validators.required],
    notes: ['']
  });

  private getDefaultPaymentDate(): string {
    const now = new Date();
    // Default to last day of current month
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay.toISOString().split('T')[0];
  }

  cancel(): void {
    this.dialogRef.close();
  }

  submit(): void {
    if (this.form.invalid) return;

    this.submitting.set(true);
    this.errorMessage.set(null);

    const request: CreatePayrollRunRequest = {
      periodYear: this.form.value.periodYear,
      periodMonth: this.form.value.periodMonth,
      paymentDate: this.form.value.paymentDate,
      notes: this.form.value.notes || undefined
    };

    this.payrollService.createPayrollRun(request).subscribe({
      next: (run) => {
        this.submitting.set(false);
        this.dialogRef.close(run);
      },
      error: (err) => {
        console.error('Failed to create payroll run', err);
        this.errorMessage.set(err.error?.message || this.translate.instant('payroll.createRunDialog.errors.failedToCreate'));
        this.submitting.set(false);
      }
    });
  }
}
