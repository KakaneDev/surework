import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  RecruitmentService,
  Interview,
  InterviewFeedback,
  Recommendation
} from '../../../core/services/recruitment.service';
import { SpinnerComponent, ButtonComponent, DialogRef } from '@shared/ui';

interface DialogData {
  interview: Interview;
}

@Component({
  selector: 'app-interview-feedback-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    SpinnerComponent,
    ButtonComponent
  ],
  template: `
    <div class="p-6 min-w-[450px]">
      <h2 id="feedback-dialog-title" class="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-2 flex items-center gap-2">
        <span class="material-icons text-primary-500" aria-hidden="true">rate_review</span>
        {{ 'recruitment.interviewFeedback.title' | translate }}
      </h2>
      <p class="text-neutral-500 dark:text-neutral-400 mb-6">
        {{ 'recruitment.interviewFeedback.description' | translate: { candidateName: data.interview.candidateName } }}
      </p>

      <form [formGroup]="form" class="space-y-4">
        <!-- Ratings Section -->
        <div class="p-4 bg-neutral-50 dark:bg-dark-elevated rounded-lg space-y-3">
          <div class="flex justify-between items-center py-2">
            <span id="technical-label" class="font-medium text-neutral-700 dark:text-neutral-300">{{ 'recruitment.interviewFeedback.technicalSkills' | translate }}</span>
            <div class="flex gap-1" role="group" aria-labelledby="technical-label">
              @for (star of [1, 2, 3, 4, 5]; track star) {
                <button type="button" (click)="setRating('technicalRating', star)"
                        class="text-2xl transition-colors"
                        [class.text-warning-500]="star <= (form.get('technicalRating')?.value || 0)"
                        [class.text-neutral-300]="star > (form.get('technicalRating')?.value || 0)"
                        [class.dark:text-neutral-600]="star > (form.get('technicalRating')?.value || 0)"
                        [attr.aria-label]="'Rate technical skills ' + star + ' out of 5'"
                        [attr.aria-pressed]="star === form.get('technicalRating')?.value">
                  <span class="material-icons" aria-hidden="true">star</span>
                </button>
              }
            </div>
          </div>

          <div class="flex justify-between items-center py-2">
            <span id="communication-label" class="font-medium text-neutral-700 dark:text-neutral-300">{{ 'recruitment.interviewFeedback.communication' | translate }}</span>
            <div class="flex gap-1" role="group" aria-labelledby="communication-label">
              @for (star of [1, 2, 3, 4, 5]; track star) {
                <button type="button" (click)="setRating('communicationRating', star)"
                        class="text-2xl transition-colors"
                        [class.text-warning-500]="star <= (form.get('communicationRating')?.value || 0)"
                        [class.text-neutral-300]="star > (form.get('communicationRating')?.value || 0)"
                        [class.dark:text-neutral-600]="star > (form.get('communicationRating')?.value || 0)"
                        [attr.aria-label]="'Rate communication ' + star + ' out of 5'"
                        [attr.aria-pressed]="star === form.get('communicationRating')?.value">
                  <span class="material-icons" aria-hidden="true">star</span>
                </button>
              }
            </div>
          </div>

          <div class="flex justify-between items-center py-2">
            <span id="cultural-fit-label" class="font-medium text-neutral-700 dark:text-neutral-300">{{ 'recruitment.interviewFeedback.culturalFit' | translate }}</span>
            <div class="flex gap-1" role="group" aria-labelledby="cultural-fit-label">
              @for (star of [1, 2, 3, 4, 5]; track star) {
                <button type="button" (click)="setRating('culturalFitRating', star)"
                        class="text-2xl transition-colors"
                        [class.text-warning-500]="star <= (form.get('culturalFitRating')?.value || 0)"
                        [class.text-neutral-300]="star > (form.get('culturalFitRating')?.value || 0)"
                        [class.dark:text-neutral-600]="star > (form.get('culturalFitRating')?.value || 0)"
                        [attr.aria-label]="'Rate cultural fit ' + star + ' out of 5'"
                        [attr.aria-pressed]="star === form.get('culturalFitRating')?.value">
                  <span class="material-icons" aria-hidden="true">star</span>
                </button>
              }
            </div>
          </div>

          <div class="flex justify-between items-center py-2 pt-4 border-t border-neutral-200 dark:border-dark-border">
            <span id="overall-label" class="font-semibold text-neutral-800 dark:text-neutral-200">{{ 'recruitment.interviewFeedback.overallRating' | translate }}</span>
            <div class="flex gap-1" role="group" aria-labelledby="overall-label" aria-required="true">
              @for (star of [1, 2, 3, 4, 5]; track star) {
                <button type="button" (click)="setRating('overallRating', star)"
                        class="text-2xl transition-colors"
                        [class.text-warning-500]="star <= (form.get('overallRating')?.value || 0)"
                        [class.text-neutral-300]="star > (form.get('overallRating')?.value || 0)"
                        [class.dark:text-neutral-600]="star > (form.get('overallRating')?.value || 0)"
                        [attr.aria-label]="'Rate overall ' + star + ' out of 5'"
                        [attr.aria-pressed]="star === form.get('overallRating')?.value">
                  <span class="material-icons" aria-hidden="true">star</span>
                </button>
              }
            </div>
          </div>
        </div>

        <div>
          <label for="recommendation" class="sw-label">{{ 'recruitment.interviewFeedback.recommendation' | translate }}</label>
          <select id="recommendation" formControlName="recommendation" class="sw-input w-full" aria-required="true">
            <option value="">{{ 'recruitment.interviewFeedback.selectRecommendation' | translate }}</option>
            @for (rec of recommendations; track rec.value) {
              <option [value]="rec.value">{{ rec.labelKey | translate }}</option>
            }
          </select>
        </div>

        <div>
          <label for="strengths" class="sw-label">{{ 'recruitment.interviewFeedback.strengths' | translate }}</label>
          <textarea id="strengths" formControlName="strengths" class="sw-input w-full" rows="2"
                    [placeholder]="'recruitment.interviewFeedback.strengthsPlaceholder' | translate"></textarea>
        </div>

        <div>
          <label for="concerns" class="sw-label">{{ 'recruitment.interviewFeedback.concerns' | translate }}</label>
          <textarea id="concerns" formControlName="concerns" class="sw-input w-full" rows="2"
                    [placeholder]="'recruitment.interviewFeedback.concernsPlaceholder' | translate"></textarea>
        </div>

        <div>
          <label for="feedback" class="sw-label">{{ 'recruitment.interviewFeedback.additionalFeedback' | translate }}</label>
          <textarea id="feedback" formControlName="feedback" class="sw-input w-full" rows="3"
                    [placeholder]="'recruitment.interviewFeedback.feedbackPlaceholder' | translate"></textarea>
        </div>
      </form>

      <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-dark-border">
        <sw-button variant="ghost" size="md" [disabled]="saving()" (clicked)="cancel()">
          {{ 'recruitment.interviewFeedback.cancel' | translate }}
        </sw-button>
        <sw-button variant="primary" size="md" [disabled]="form.invalid" [loading]="saving()" (clicked)="onSubmit()">
          <span class="material-icons text-lg" aria-hidden="true">send</span>
          {{ 'recruitment.interviewFeedback.submitFeedback' | translate }}
        </sw-button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InterviewFeedbackDialogComponent {
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

  recommendations: { value: Recommendation; labelKey: string }[] = [
    { value: 'STRONG_HIRE', labelKey: 'recruitment.interviewFeedback.recommendations.strongHire' },
    { value: 'HIRE', labelKey: 'recruitment.interviewFeedback.recommendations.hire' },
    { value: 'LEAN_HIRE', labelKey: 'recruitment.interviewFeedback.recommendations.leanHire' },
    { value: 'NEUTRAL', labelKey: 'recruitment.interviewFeedback.recommendations.neutral' },
    { value: 'LEAN_NO_HIRE', labelKey: 'recruitment.interviewFeedback.recommendations.leanNoHire' },
    { value: 'NO_HIRE', labelKey: 'recruitment.interviewFeedback.recommendations.noHire' },
    { value: 'STRONG_NO_HIRE', labelKey: 'recruitment.interviewFeedback.recommendations.strongNoHire' }
  ];

  constructor() {
    this.form = this.fb.group({
      technicalRating: [null],
      communicationRating: [null],
      culturalFitRating: [null],
      overallRating: [null, Validators.required],
      recommendation: ['', Validators.required],
      strengths: [''],
      concerns: [''],
      feedback: ['']
    });
  }

  setRating(field: string, value: number): void {
    this.form.get(field)?.setValue(value);
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving.set(true);
    const formValue = this.form.value;

    const feedback: InterviewFeedback = {
      technicalRating: formValue.technicalRating,
      communicationRating: formValue.communicationRating,
      culturalFitRating: formValue.culturalFitRating,
      overallRating: formValue.overallRating,
      recommendation: formValue.recommendation,
      strengths: formValue.strengths,
      concerns: formValue.concerns,
      feedback: formValue.feedback
    };

    this.recruitmentService.submitFeedback(this.data.interview.id, feedback).subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Failed to submit feedback', err);
        this.saving.set(false);
      }
    });
  }
}
