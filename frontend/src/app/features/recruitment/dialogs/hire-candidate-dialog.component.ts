import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import {
  RecruitmentService,
  Application
} from '../../../core/services/recruitment.service';

interface DialogData {
  application: Application;
}

@Component({
  selector: 'app-hire-candidate-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    DatePipe
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="success-icon">check_circle</mat-icon>
      Hire Candidate
    </h2>
    <mat-dialog-content>
      <p class="dialog-info">
        You are about to mark <strong>{{ data.application.candidate.fullName }}</strong> as hired
        for the position of <strong>{{ data.application.job.title }}</strong>.
      </p>

      <div class="hire-summary">
        <h4>Hiring Details</h4>
        <div class="summary-row">
          <span>Candidate:</span>
          <span>{{ data.application.candidate.fullName }}</span>
        </div>
        <div class="summary-row">
          <span>Position:</span>
          <span>{{ data.application.job.title }}</span>
        </div>
        @if (data.application.offerSalary) {
          <div class="summary-row">
            <span>Agreed Salary:</span>
            <span>R{{ data.application.offerSalary | number:'1.0-0' }} p/a</span>
          </div>
        }
        @if (data.application.expectedStartDate) {
          <div class="summary-row">
            <span>Start Date:</span>
            <span>{{ data.application.expectedStartDate | date:'mediumDate' }}</span>
          </div>
        }
      </div>

      <div class="notice">
        <mat-icon>info</mat-icon>
        <span>This will update the candidate's status and notify the HR team to begin onboarding.</span>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="saving()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onConfirm()"
              [disabled]="saving()">
        @if (saving()) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          Confirm Hire
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .success-icon {
      color: #43a047;
    }

    .dialog-info {
      margin-bottom: 16px;
      color: rgba(0, 0, 0, 0.6);
    }

    mat-dialog-content {
      min-width: 400px;
    }

    .hire-summary {
      padding: 16px;
      background: #e8f5e9;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .hire-summary h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 500;
      color: #2e7d32;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 14px;
    }

    .summary-row span:first-child {
      color: rgba(0, 0, 0, 0.6);
    }

    .summary-row span:last-child {
      font-weight: 500;
    }

    .notice {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 12px;
      background: #fff3e0;
      border-radius: 8px;
      font-size: 13px;
      color: rgba(0, 0, 0, 0.7);
    }

    .notice mat-icon {
      color: #f57c00;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    mat-dialog-actions button mat-spinner {
      display: inline-block;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HireCandidateDialogComponent {
  readonly dialogRef = inject(MatDialogRef<HireCandidateDialogComponent>);
  readonly data: DialogData = inject(MAT_DIALOG_DATA);
  private readonly recruitmentService = inject(RecruitmentService);

  saving = signal(false);

  onConfirm(): void {
    this.saving.set(true);

    this.recruitmentService.markAsHired(this.data.application.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Failed to mark as hired', err);
        this.saving.set(false);
      }
    });
  }
}
