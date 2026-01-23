import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  RecruitmentService,
  Application
} from '../../../core/services/recruitment.service';

interface DialogData {
  application: Application;
}

@Component({
  selector: 'app-make-offer-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Make Offer</h2>
    <mat-dialog-content>
      <p class="dialog-info">
        Create a job offer for <strong>{{ data.application.candidate.fullName }}</strong>
        for the position of <strong>{{ data.application.job.title }}</strong>
      </p>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Salary (Annual, ZAR)</mat-label>
          <input matInput type="number" formControlName="salary" min="0">
          <span matTextPrefix>R&nbsp;</span>
          @if (form.get('salary')?.hasError('required')) {
            <mat-error>Salary is required</mat-error>
          }
          @if (form.get('salary')?.hasError('min')) {
            <mat-error>Salary must be positive</mat-error>
          }
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Start Date</mat-label>
            <input matInput [matDatepicker]="startPicker" formControlName="startDate">
            <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
            @if (form.get('startDate')?.hasError('required')) {
              <mat-error>Start date is required</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Offer Expiry Date</mat-label>
            <input matInput [matDatepicker]="expiryPicker" formControlName="expiryDate">
            <mat-datepicker-toggle matIconSuffix [for]="expiryPicker"></mat-datepicker-toggle>
            <mat-datepicker #expiryPicker></mat-datepicker>
            @if (form.get('expiryDate')?.hasError('required')) {
              <mat-error>Expiry date is required</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="offer-summary">
          <h4>Offer Summary</h4>
          <div class="summary-row">
            <span>Position:</span>
            <span>{{ data.application.job.title }}</span>
          </div>
          <div class="summary-row">
            <span>Candidate:</span>
            <span>{{ data.application.candidate.fullName }}</span>
          </div>
          @if (form.get('salary')?.value) {
            <div class="summary-row">
              <span>Monthly Salary:</span>
              <span>R{{ (form.get('salary')?.value / 12) | number:'1.0-0' }}</span>
            </div>
          }
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="saving()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSubmit()"
              [disabled]="form.invalid || saving()">
        @if (saving()) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          Send Offer
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

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    mat-dialog-content {
      min-width: 400px;
    }

    .offer-summary {
      margin-top: 16px;
      padding: 16px;
      background: #e3f2fd;
      border-radius: 8px;
    }

    .offer-summary h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 500;
      color: #1565c0;
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

    mat-dialog-actions button mat-spinner {
      display: inline-block;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MakeOfferDialogComponent {
  readonly dialogRef = inject(MatDialogRef<MakeOfferDialogComponent>);
  readonly data: DialogData = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly recruitmentService = inject(RecruitmentService);

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
      startDate: [startDate, Validators.required],
      expiryDate: [expiryDate, Validators.required]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving.set(true);
    const formValue = this.form.value;

    const salary = formValue.salary;
    const startDate = this.formatDate(formValue.startDate);
    const expiryDate = this.formatDate(formValue.expiryDate);

    this.recruitmentService.makeOffer(
      this.data.application.id,
      salary,
      expiryDate,
      startDate
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

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
