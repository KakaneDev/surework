import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  RecruitmentService,
  Application,
  RecruitmentStage
} from '../../../core/services/recruitment.service';

interface DialogData {
  application: Application;
}

@Component({
  selector: 'app-stage-change-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Change Stage</h2>
    <mat-dialog-content>
      <p class="dialog-info">
        Move <strong>{{ data.application.candidate.fullName }}</strong> to a new stage
      </p>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>New Stage</mat-label>
          <mat-select formControlName="stage">
            @for (stage of stages; track stage.value) {
              <mat-option [value]="stage.value" [disabled]="stage.value === data.application.stage">
                {{ stage.label }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes (optional)</mat-label>
          <textarea matInput formControlName="notes" rows="3"
                    placeholder="Add any notes about this stage change..."></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="saving()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSubmit()"
              [disabled]="form.invalid || saving()">
        @if (saving()) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          Update Stage
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-info {
      margin-bottom: 16px;
      color: rgba(0, 0, 0, 0.6);
    }

    .full-width {
      width: 100%;
    }

    mat-dialog-content {
      min-width: 350px;
    }

    mat-dialog-actions button mat-spinner {
      display: inline-block;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StageChangeDialogComponent {
  readonly dialogRef = inject(MatDialogRef<StageChangeDialogComponent>);
  readonly data: DialogData = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly recruitmentService = inject(RecruitmentService);

  form: FormGroup;
  saving = signal(false);

  stages: { value: RecruitmentStage; label: string }[] = [
    { value: 'NEW', label: 'New' },
    { value: 'SCREENING', label: 'Screening' },
    { value: 'PHONE_SCREEN', label: 'Phone Screen' },
    { value: 'ASSESSMENT', label: 'Assessment' },
    { value: 'FIRST_INTERVIEW', label: 'First Interview' },
    { value: 'SECOND_INTERVIEW', label: 'Second Interview' },
    { value: 'FINAL_INTERVIEW', label: 'Final Interview' },
    { value: 'REFERENCE_CHECK', label: 'Reference Check' },
    { value: 'BACKGROUND_CHECK', label: 'Background Check' },
    { value: 'OFFER', label: 'Offer' },
    { value: 'ONBOARDING', label: 'Onboarding' }
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
        console.error('Failed to change stage', err);
        this.saving.set(false);
      }
    });
  }
}
