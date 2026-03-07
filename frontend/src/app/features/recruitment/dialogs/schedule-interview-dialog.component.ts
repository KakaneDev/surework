import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  RecruitmentService,
  Application,
  InterviewType,
  LocationType,
  ScheduleInterviewRequest
} from '../../../core/services/recruitment.service';
import { SpinnerComponent, ButtonComponent, DialogRef } from '@shared/ui';

interface DialogData {
  application: Application;
}

@Component({
  selector: 'app-schedule-interview-dialog',
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
      <h2 class="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-2 flex items-center gap-2">
        <span class="material-icons text-primary-500">event</span>
        {{ 'recruitment.scheduleInterview.title' | translate }}
      </h2>
      <p class="text-neutral-500 dark:text-neutral-400 mb-6">
        {{ 'recruitment.scheduleInterview.subtitle' | translate: { candidateName: data.application.candidate.fullName } }}
      </p>

      <form [formGroup]="form" class="space-y-4">
        <div>
          <label for="interviewType" class="sw-label">{{ 'recruitment.scheduleInterview.interviewType' | translate }}</label>
          <select id="interviewType" formControlName="interviewType" class="sw-input w-full" aria-required="true">
            @for (type of interviewTypes; track type.value) {
              <option [value]="type.value">{{ type.label | translate }}</option>
            }
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="interviewDate" class="sw-label">{{ 'recruitment.scheduleInterview.date' | translate }}</label>
            <input id="interviewDate" type="date" formControlName="date" class="sw-input w-full" aria-required="true">
          </div>

          <div>
            <label for="interviewTime" class="sw-label">{{ 'recruitment.scheduleInterview.time' | translate }}</label>
            <input id="interviewTime" type="time" formControlName="time" class="sw-input w-full" aria-required="true">
          </div>
        </div>

        <div>
          <label for="durationMinutes" class="sw-label">{{ 'recruitment.scheduleInterview.duration' | translate }}</label>
          <select id="durationMinutes" formControlName="durationMinutes" class="sw-input w-full" aria-required="true">
            <option [value]="15">{{ 'recruitment.scheduleInterview.duration15Min' | translate }}</option>
            <option [value]="30">{{ 'recruitment.scheduleInterview.duration30Min' | translate }}</option>
            <option [value]="45">{{ 'recruitment.scheduleInterview.duration45Min' | translate }}</option>
            <option [value]="60">{{ 'recruitment.scheduleInterview.duration1Hour' | translate }}</option>
            <option [value]="90">{{ 'recruitment.scheduleInterview.duration1_5Hours' | translate }}</option>
            <option [value]="120">{{ 'recruitment.scheduleInterview.duration2Hours' | translate }}</option>
          </select>
        </div>

        <div>
          <label for="locationType" class="sw-label">{{ 'recruitment.scheduleInterview.locationType' | translate }}</label>
          <select id="locationType" formControlName="locationType" class="sw-input w-full" aria-required="true">
            <option value="REMOTE">{{ 'recruitment.scheduleInterview.locationRemote' | translate }}</option>
            <option value="ONSITE">{{ 'recruitment.scheduleInterview.locationOnsite' | translate }}</option>
            <option value="HYBRID">{{ 'recruitment.scheduleInterview.locationHybrid' | translate }}</option>
          </select>
        </div>

        @if (form.get('locationType')?.value === 'REMOTE') {
          <div>
            <label for="meetingLink" class="sw-label">{{ 'recruitment.scheduleInterview.meetingLink' | translate }}</label>
            <input id="meetingLink" type="url" formControlName="meetingLink" class="sw-input w-full"
                   [placeholder]="'recruitment.scheduleInterview.meetingLinkPlaceholder' | translate">
          </div>
        } @else {
          <div>
            <label for="locationDetails" class="sw-label">{{ 'recruitment.scheduleInterview.locationDetails' | translate }}</label>
            <input id="locationDetails" type="text" formControlName="locationDetails" class="sw-input w-full"
                   [placeholder]="'recruitment.scheduleInterview.locationDetailsPlaceholder' | translate">
          </div>
        }

        <div>
          <label for="interviewerName" class="sw-label">{{ 'recruitment.scheduleInterview.interviewerName' | translate }}</label>
          <input id="interviewerName" type="text" formControlName="interviewerName" class="sw-input w-full" aria-required="true"
                 [placeholder]="'recruitment.scheduleInterview.interviewerNamePlaceholder' | translate">
        </div>

        <div>
          <label for="agenda" class="sw-label">{{ 'recruitment.scheduleInterview.agenda' | translate }}</label>
          <textarea id="agenda" formControlName="agenda" class="sw-input w-full" rows="3"
                    [placeholder]="'recruitment.scheduleInterview.agendaPlaceholder' | translate"></textarea>
        </div>
      </form>

      <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-dark-border">
        <sw-button variant="ghost" size="md" [disabled]="saving()" (clicked)="cancel()">
          {{ 'common.cancel' | translate }}
        </sw-button>
        <sw-button variant="primary" size="md" [disabled]="form.invalid" [loading]="saving()" (clicked)="onSubmit()">
          <span class="material-icons text-lg" aria-hidden="true">event</span>
          {{ 'recruitment.scheduleInterview.submit' | translate }}
        </sw-button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleInterviewDialogComponent {
  readonly dialogRef: DialogRef = inject('DIALOG_REF' as any);
  readonly data: DialogData = inject('DIALOG_DATA' as any);
  private readonly fb = inject(FormBuilder);
  private readonly recruitmentService = inject(RecruitmentService);
  private readonly translate = inject(TranslateService);

  form: FormGroup;
  saving = signal(false);

  interviewTypes: { value: InterviewType; label: string }[] = [
    { value: 'PHONE_SCREEN', label: 'recruitment.scheduleInterview.typePhoneScreen' },
    { value: 'VIDEO_CALL', label: 'recruitment.scheduleInterview.typeVideoCall' },
    { value: 'IN_PERSON', label: 'recruitment.scheduleInterview.typeInPerson' },
    { value: 'TECHNICAL', label: 'recruitment.scheduleInterview.typeTechnical' },
    { value: 'BEHAVIORAL', label: 'recruitment.scheduleInterview.typeBehavioral' },
    { value: 'PANEL', label: 'recruitment.scheduleInterview.typePanel' },
    { value: 'CASE_STUDY', label: 'recruitment.scheduleInterview.typeCaseStudy' },
    { value: 'FINAL', label: 'recruitment.scheduleInterview.typeFinal' }
  ];

  constructor() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    this.form = this.fb.group({
      interviewType: ['VIDEO_CALL', Validators.required],
      date: [this.formatDate(tomorrow), Validators.required],
      time: ['10:00', Validators.required],
      durationMinutes: [60, Validators.required],
      locationType: ['REMOTE', Validators.required],
      locationDetails: [''],
      meetingLink: [''],
      interviewerName: ['', Validators.required],
      agenda: ['']
    });
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  cancel(): void {
    this.dialogRef.close();
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
      interviewerId: '00000000-0000-0000-0000-000000000100', // Dev user ID - would come from auth service in production
      interviewerName: formValue.interviewerName,
      agenda: formValue.agenda
    };

    this.recruitmentService.scheduleInterview(request).subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogRef.close(true);
      },
      error: (err) => {
        const errorMsg = this.translate.instant('recruitment.scheduleInterview.error');
        console.error(errorMsg, err);
        this.saving.set(false);
      }
    });
  }
}
