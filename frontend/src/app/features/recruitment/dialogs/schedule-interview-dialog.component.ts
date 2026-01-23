import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  RecruitmentService,
  Application,
  InterviewType,
  LocationType,
  ScheduleInterviewRequest
} from '../../../core/services/recruitment.service';

interface DialogData {
  application: Application;
}

@Component({
  selector: 'app-schedule-interview-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Schedule Interview</h2>
    <mat-dialog-content>
      <p class="dialog-info">
        Schedule an interview for <strong>{{ data.application.candidate.fullName }}</strong>
      </p>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Interview Type</mat-label>
          <mat-select formControlName="interviewType">
            @for (type of interviewTypes; track type.value) {
              <mat-option [value]="type.value">{{ type.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Date</mat-label>
            <input matInput [matDatepicker]="datePicker" formControlName="date">
            <mat-datepicker-toggle matIconSuffix [for]="datePicker"></mat-datepicker-toggle>
            <mat-datepicker #datePicker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Time</mat-label>
            <input matInput type="time" formControlName="time">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Duration (minutes)</mat-label>
          <mat-select formControlName="durationMinutes">
            <mat-option [value]="15">15 minutes</mat-option>
            <mat-option [value]="30">30 minutes</mat-option>
            <mat-option [value]="45">45 minutes</mat-option>
            <mat-option [value]="60">1 hour</mat-option>
            <mat-option [value]="90">1.5 hours</mat-option>
            <mat-option [value]="120">2 hours</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Location Type</mat-label>
          <mat-select formControlName="locationType">
            <mat-option value="REMOTE">Remote (Video Call)</mat-option>
            <mat-option value="ONSITE">On-site</mat-option>
            <mat-option value="HYBRID">Hybrid</mat-option>
          </mat-select>
        </mat-form-field>

        @if (form.get('locationType')?.value === 'REMOTE') {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Meeting Link</mat-label>
            <input matInput formControlName="meetingLink" placeholder="https://...">
          </mat-form-field>
        } @else {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Location Details</mat-label>
            <input matInput formControlName="locationDetails" placeholder="Office address or room number">
          </mat-form-field>
        }

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Interviewer Name</mat-label>
          <input matInput formControlName="interviewerName" placeholder="Name of the interviewer">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Agenda (optional)</mat-label>
          <textarea matInput formControlName="agenda" rows="3"
                    placeholder="Interview agenda and topics to cover..."></textarea>
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
          Schedule Interview
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

    mat-dialog-actions button mat-spinner {
      display: inline-block;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleInterviewDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ScheduleInterviewDialogComponent>);
  readonly data: DialogData = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly recruitmentService = inject(RecruitmentService);

  form: FormGroup;
  saving = signal(false);

  interviewTypes: { value: InterviewType; label: string }[] = [
    { value: 'PHONE_SCREEN', label: 'Phone Screen' },
    { value: 'VIDEO_CALL', label: 'Video Call' },
    { value: 'IN_PERSON', label: 'In Person' },
    { value: 'TECHNICAL', label: 'Technical Interview' },
    { value: 'BEHAVIORAL', label: 'Behavioral Interview' },
    { value: 'PANEL', label: 'Panel Interview' },
    { value: 'CASE_STUDY', label: 'Case Study' },
    { value: 'FINAL', label: 'Final Interview' }
  ];

  constructor() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    this.form = this.fb.group({
      interviewType: ['VIDEO_CALL', Validators.required],
      date: [tomorrow, Validators.required],
      time: ['10:00', Validators.required],
      durationMinutes: [60, Validators.required],
      locationType: ['REMOTE', Validators.required],
      locationDetails: [''],
      meetingLink: [''],
      interviewerName: ['', Validators.required],
      agenda: ['']
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving.set(true);
    const formValue = this.form.value;

    // Combine date and time
    const date = new Date(formValue.date);
    const [hours, minutes] = formValue.time.split(':');
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    const request: ScheduleInterviewRequest = {
      applicationId: this.data.application.id,
      interviewType: formValue.interviewType,
      scheduledAt: date.toISOString(),
      durationMinutes: formValue.durationMinutes,
      locationType: formValue.locationType,
      locationDetails: formValue.locationDetails,
      meetingLink: formValue.meetingLink,
      interviewerId: 'current-user-id', // Would come from auth service
      interviewerName: formValue.interviewerName,
      agenda: formValue.agenda
    };

    this.recruitmentService.scheduleInterview(request).subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Failed to schedule interview', err);
        this.saving.set(false);
      }
    });
  }
}
