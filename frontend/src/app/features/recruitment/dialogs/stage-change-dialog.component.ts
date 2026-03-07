import { Component, ChangeDetectionStrategy, inject, signal, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  RecruitmentService,
  Application,
  RecruitmentStage
} from '../../../core/services/recruitment.service';
import { SpinnerComponent, ButtonComponent, DialogRef } from '@shared/ui';

interface DialogData {
  application: Application;
}

@Component({
  selector: 'app-stage-change-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    SpinnerComponent,
    ButtonComponent
  ],
  template: `
    <div class="p-6 min-w-[400px]">
      <h2 class="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-2 flex items-center gap-2">
        <span class="material-icons text-primary-500">swap_horiz</span>
        {{ 'recruitment.stageChange.title' | translate }}
      </h2>
      <p class="text-neutral-500 dark:text-neutral-400 mb-6">
        {{ 'recruitment.stageChange.subtitle' | translate: { candidateName: data.application.candidate.fullName } }}
      </p>

      <form [formGroup]="form" class="space-y-4">
        <div>
          <label class="sw-label">{{ 'recruitment.stageChange.newStage' | translate }}</label>
          <select formControlName="stage" class="sw-input w-full">
            <option value="">{{ 'recruitment.stageChange.selectStage' | translate }}</option>
            @for (stage of stages; track stage.value) {
              <option [value]="stage.value" [disabled]="stage.value === data.application.stage">
                {{ stage.label | translate }}
              </option>
            }
          </select>
        </div>

        <div>
          <label class="sw-label">{{ 'recruitment.stageChange.notes' | translate }}</label>
          <textarea formControlName="notes" class="sw-input w-full" rows="3"
                    [placeholder]="'recruitment.stageChange.notesPlaceholder' | translate"></textarea>
        </div>
      </form>

      <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-dark-border">
        <sw-button variant="ghost" size="md" [disabled]="saving()" (clicked)="cancel()">
          {{ 'common.cancel' | translate }}
        </sw-button>
        <sw-button variant="primary" size="md" [disabled]="form.invalid" [loading]="saving()" (clicked)="onSubmit()">
          <span class="material-icons text-lg" aria-hidden="true">check</span>
          {{ 'recruitment.stageChange.submit' | translate }}
        </sw-button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StageChangeDialogComponent {
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

  stages: { value: RecruitmentStage; label: string }[] = [
    { value: 'NEW', label: 'recruitment.stageChange.stageNew' },
    { value: 'SCREENING', label: 'recruitment.stageChange.stageScreening' },
    { value: 'PHONE_SCREEN', label: 'recruitment.stageChange.stagePhoneScreen' },
    { value: 'ASSESSMENT', label: 'recruitment.stageChange.stageAssessment' },
    { value: 'FIRST_INTERVIEW', label: 'recruitment.stageChange.stageFirstInterview' },
    { value: 'SECOND_INTERVIEW', label: 'recruitment.stageChange.stageSecondInterview' },
    { value: 'FINAL_INTERVIEW', label: 'recruitment.stageChange.stageFinalInterview' },
    { value: 'REFERENCE_CHECK', label: 'recruitment.stageChange.stageReferenceCheck' },
    { value: 'BACKGROUND_CHECK', label: 'recruitment.stageChange.stageBackgroundCheck' },
    { value: 'OFFER', label: 'recruitment.stageChange.stageOffer' },
    { value: 'ONBOARDING', label: 'recruitment.stageChange.stageOnboarding' }
  ];

  constructor() {
    this.form = this.fb.group({
      stage: ['', Validators.required],
      notes: ['']
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving.set(true);
    const { stage } = this.form.value;

    // Determine which API to call based on the stage
    let observable;
    if (stage === 'SCREENING') {
      observable = this.recruitmentService.moveToScreening(this.data.application.id);
    } else if (stage === 'FIRST_INTERVIEW' || stage === 'SECOND_INTERVIEW' || stage === 'FINAL_INTERVIEW') {
      observable = this.recruitmentService.moveToInterview(this.data.application.id, stage);
    } else if (stage === 'OFFER') {
      // For offer stage, we need the make offer dialog
      this.dialogRef.close({ needsOfferDialog: true });
      return;
    } else {
      // For shortlist
      observable = this.recruitmentService.shortlistApplication(this.data.application.id);
    }

    observable.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogRef.close(true);
      },
      error: (err) => {
        const errorMessage = this.translate.instant('recruitment.stageChange.error');
        console.error(errorMessage, err);
        this.saving.set(false);
      }
    });
  }
}
