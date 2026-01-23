import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import {
  RecruitmentService,
  Interview,
  InterviewFeedback,
  Recommendation
} from '../../../core/services/recruitment.service';

interface DialogData {
  interview: Interview;
}

@Component({
  selector: 'app-interview-feedback-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>Interview Feedback</h2>
    <mat-dialog-content>
      <p class="dialog-info">
        Provide feedback for <strong>{{ data.interview.candidateName }}</strong>'s interview
      </p>
      <form [formGroup]="form">
        <!-- Ratings -->
        <div class="ratings-section">
          <div class="rating-row">
            <span class="rating-label">Technical Skills</span>
            <div class="rating-stars">
              @for (star of [1, 2, 3, 4, 5]; track star) {
                <mat-icon
                  [class.filled]="star <= (form.get('technicalRating')?.value || 0)"
                  (click)="setRating('technicalRating', star)">
                  star
                </mat-icon>
              }
            </div>
          </div>

          <div class="rating-row">
            <span class="rating-label">Communication</span>
            <div class="rating-stars">
              @for (star of [1, 2, 3, 4, 5]; track star) {
                <mat-icon
                  [class.filled]="star <= (form.get('communicationRating')?.value || 0)"
                  (click)="setRating('communicationRating', star)">
                  star
                </mat-icon>
              }
            </div>
          </div>

          <div class="rating-row">
            <span class="rating-label">Cultural Fit</span>
            <div class="rating-stars">
              @for (star of [1, 2, 3, 4, 5]; track star) {
                <mat-icon
                  [class.filled]="star <= (form.get('culturalFitRating')?.value || 0)"
                  (click)="setRating('culturalFitRating', star)">
                  star
                </mat-icon>
              }
            </div>
          </div>

          <div class="rating-row overall">
            <span class="rating-label">Overall Rating</span>
            <div class="rating-stars">
              @for (star of [1, 2, 3, 4, 5]; track star) {
                <mat-icon
                  [class.filled]="star <= (form.get('overallRating')?.value || 0)"
                  (click)="setRating('overallRating', star)">
                  star
                </mat-icon>
              }
            </div>
          </div>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Recommendation</mat-label>
          <mat-select formControlName="recommendation">
            @for (rec of recommendations; track rec.value) {
              <mat-option [value]="rec.value">{{ rec.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Strengths</mat-label>
          <textarea matInput formControlName="strengths" rows="2"
                    placeholder="What were the candidate's strengths?"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Concerns</mat-label>
          <textarea matInput formControlName="concerns" rows="2"
                    placeholder="Any concerns or areas for improvement?"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Additional Feedback</mat-label>
          <textarea matInput formControlName="feedback" rows="3"
                    placeholder="Overall impressions and additional notes..."></textarea>
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
          Submit Feedback
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
      min-width: 400px;
    }

    .ratings-section {
      margin-bottom: 24px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .rating-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
    }

    .rating-row.overall {
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      margin-top: 8px;
      padding-top: 16px;
    }

    .rating-label {
      font-weight: 500;
    }

    .rating-stars {
      display: flex;
      gap: 4px;
    }

    .rating-stars mat-icon {
      cursor: pointer;
      color: #e0e0e0;
      font-size: 24px;
      width: 24px;
      height: 24px;
      transition: color 0.2s;
    }

    .rating-stars mat-icon.filled {
      color: #ffc107;
    }

    .rating-stars mat-icon:hover {
      color: #ffca28;
    }

    mat-dialog-actions button mat-spinner {
      display: inline-block;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InterviewFeedbackDialogComponent {
  readonly dialogRef = inject(MatDialogRef<InterviewFeedbackDialogComponent>);
  readonly data: DialogData = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly recruitmentService = inject(RecruitmentService);

  form: FormGroup;
  saving = signal(false);

  recommendations: { value: Recommendation; label: string }[] = [
    { value: 'STRONG_HIRE', label: 'Strong Hire' },
    { value: 'HIRE', label: 'Hire' },
    { value: 'LEAN_HIRE', label: 'Lean Hire' },
    { value: 'NEUTRAL', label: 'Neutral' },
    { value: 'LEAN_NO_HIRE', label: 'Lean No Hire' },
    { value: 'NO_HIRE', label: 'No Hire' },
    { value: 'STRONG_NO_HIRE', label: 'Strong No Hire' }
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
