import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  RecruitmentService,
  Application
} from '../../../core/services/recruitment.service';
import { SpinnerComponent, ButtonComponent, DialogRef } from '@shared/ui';

interface DialogData {
  application: Application;
}

@Component({
  selector: 'app-make-offer-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    SpinnerComponent,
    ButtonComponent,
    DecimalPipe
  ],
  template: `
    <div class="p-6 min-w-[450px]">
      <h2 class="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-2 flex items-center gap-2">
        <span class="material-icons text-success-500">local_offer</span>
        {{ 'recruitment.makeOffer.title' | translate }}
      </h2>
      <p class="text-neutral-500 dark:text-neutral-400 mb-6">
        {{ 'recruitment.makeOffer.subtitle' | translate: { candidateName: data.application.candidate.fullName, positionName: data.application.job.title } }}
      </p>

      <form [formGroup]="form" class="space-y-4">
        <div>
          <label for="salary" class="sw-label">{{ 'recruitment.makeOffer.salaryLabel' | translate }}</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" aria-hidden="true">R</span>
            <input id="salary" type="number" formControlName="salary" class="sw-input w-full pl-8" min="0"
                   aria-required="true"
                   [attr.aria-invalid]="form.get('salary')?.touched && form.get('salary')?.invalid"
                   [attr.aria-describedby]="(form.get('salary')?.touched && form.get('salary')?.invalid) ? 'salary-error' : null"
                   [class.border-error-500]="form.get('salary')?.touched && form.get('salary')?.invalid">
          </div>
          @if (form.get('salary')?.touched && form.get('salary')?.hasError('required')) {
            <p id="salary-error" class="text-sm text-error-500 mt-1" role="alert">{{ 'recruitment.makeOffer.salaryRequired' | translate }}</p>
          }
          @if (form.get('salary')?.touched && form.get('salary')?.hasError('min')) {
            <p id="salary-error" class="text-sm text-error-500 mt-1" role="alert">{{ 'recruitment.makeOffer.salaryPositive' | translate }}</p>
          }
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="startDate" class="sw-label">{{ 'recruitment.makeOffer.startDateLabel' | translate }}</label>
            <input id="startDate" type="date" formControlName="startDate" class="sw-input w-full"
                   aria-required="true"
                   [attr.aria-invalid]="form.get('startDate')?.touched && form.get('startDate')?.hasError('required')"
                   [attr.aria-describedby]="(form.get('startDate')?.touched && form.get('startDate')?.hasError('required')) ? 'startDate-error' : null"
                   [class.border-error-500]="form.get('startDate')?.touched && form.get('startDate')?.hasError('required')">
            @if (form.get('startDate')?.touched && form.get('startDate')?.hasError('required')) {
              <p id="startDate-error" class="text-sm text-error-500 mt-1" role="alert">{{ 'recruitment.makeOffer.startDateRequired' | translate }}</p>
            }
          </div>

          <div>
            <label for="expiryDate" class="sw-label">{{ 'recruitment.makeOffer.expiryDateLabel' | translate }}</label>
            <input id="expiryDate" type="date" formControlName="expiryDate" class="sw-input w-full"
                   aria-required="true"
                   [attr.aria-invalid]="form.get('expiryDate')?.touched && form.get('expiryDate')?.hasError('required')"
                   [attr.aria-describedby]="(form.get('expiryDate')?.touched && form.get('expiryDate')?.hasError('required')) ? 'expiryDate-error' : null"
                   [class.border-error-500]="form.get('expiryDate')?.touched && form.get('expiryDate')?.hasError('required')">
            @if (form.get('expiryDate')?.touched && form.get('expiryDate')?.hasError('required')) {
              <p id="expiryDate-error" class="text-sm text-error-500 mt-1" role="alert">{{ 'recruitment.makeOffer.expiryDateRequired' | translate }}</p>
            }
          </div>
        </div>

        <!-- Offer Summary -->
        <div class="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
          <h4 class="text-sm font-semibold text-primary-700 dark:text-primary-400 mb-3 flex items-center gap-2">
            <span class="material-icons text-lg">summarize</span>
            {{ 'recruitment.makeOffer.offerSummary' | translate }}
          </h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.makeOffer.positionLabel' | translate }}</span>
              <span class="font-medium text-neutral-700 dark:text-neutral-300">{{ data.application.job.title }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.makeOffer.candidateLabel' | translate }}</span>
              <span class="font-medium text-neutral-700 dark:text-neutral-300">{{ data.application.candidate.fullName }}</span>
            </div>
            @if (form.get('salary')?.value) {
              <div class="flex justify-between pt-2 border-t border-primary-200 dark:border-primary-800">
                <span class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.makeOffer.monthlySalaryLabel' | translate }}</span>
                <span class="font-semibold text-primary-600 dark:text-primary-400">R{{ (form.get('salary')?.value / 12) | number:'1.0-0' }}</span>
              </div>
            }
          </div>
        </div>
      </form>

      <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-dark-border">
        <sw-button variant="ghost" size="md" [disabled]="saving()" (clicked)="cancel()">
          {{ 'common.cancel' | translate }}
        </sw-button>
        <sw-button variant="primary" size="md" [disabled]="form.invalid" [loading]="saving()" (clicked)="onSubmit()">
          <span class="material-icons text-lg" aria-hidden="true">send</span>
          {{ 'recruitment.makeOffer.sendButton' | translate }}
        </sw-button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MakeOfferDialogComponent {
  private readonly dialogRef: DialogRef = inject('DIALOG_REF' as any);
  readonly data: DialogData = inject('DIALOG_DATA' as any);
  private readonly fb = inject(FormBuilder);
  private readonly recruitmentService = inject(RecruitmentService);
  private readonly translate = inject(TranslateService);

  cancel(): void {
    this.dialogRef.close();
  }

  form: FormGroup;
  saving = signal(false);

  constructor() {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() + 1);
    startDate.setDate(1);

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    this.form = this.fb.group({
      salary: [null, [Validators.required, Validators.min(1)]],
      startDate: [this.formatDate(startDate), Validators.required],
      expiryDate: [this.formatDate(expiryDate), Validators.required]
    });
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving.set(true);
    const formValue = this.form.value;

    this.recruitmentService.makeOffer(
      this.data.application.id,
      formValue.salary,
      formValue.expiryDate,
      formValue.startDate
    ).subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Failed to make offer', err);
        this.saving.set(false);
      }
    });
  }
}
