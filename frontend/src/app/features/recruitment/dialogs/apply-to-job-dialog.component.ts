import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  RecruitmentService,
  Candidate,
  JobPostingSummary,
  CreateApplicationRequest
} from '../../../core/services/recruitment.service';
import { SpinnerComponent, ButtonComponent, DialogRef } from '@shared/ui';

interface DialogData {
  candidate: Candidate;
}

@Component({
  selector: 'app-apply-to-job-dialog',
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
        <span class="material-icons text-primary-500">send</span>
        {{ 'recruitment.applyDialog.title' | translate }}
      </h2>
      <p class="text-neutral-500 dark:text-neutral-400 mb-6">
        {{ 'recruitment.applyDialog.subtitle' | translate: { candidateName: data.candidate.fullName } }}
      </p>

      @if (loadingJobs()) {
        <div class="flex items-center justify-center gap-3 py-12 text-neutral-500">
          <sw-spinner size="md" />
          <span>{{ 'recruitment.applyDialog.loadingPositions' | translate }}</span>
        </div>
      } @else if (openJobs().length === 0) {
        <div class="text-center py-12">
          <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-3">work_off</span>
          <p class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.applyDialog.noOpenPositions' | translate }}</p>
        </div>
      } @else {
        <form [formGroup]="form" class="space-y-4">
          <div>
            <label class="sw-label">{{ 'recruitment.applyDialog.selectJobLabel' | translate }}</label>
            <select formControlName="jobId" class="sw-input w-full">
              <option value="">{{ 'recruitment.applyDialog.selectPositionPlaceholder' | translate }}</option>
              @for (job of openJobs(); track job.id) {
                <option [value]="job.id">{{ job.title }} - {{ job.departmentName }}</option>
              }
            </select>
            <p class="text-sm text-neutral-500 mt-1">{{ 'recruitment.applyDialog.openPositionsCount' | translate: { count: openJobs().length } }}</p>
          </div>

          <div>
            <label class="sw-label">{{ 'recruitment.applyDialog.coverLetterLabel' | translate }}</label>
            <textarea formControlName="coverLetter" class="sw-input w-full" rows="4"
                      [placeholder]="'recruitment.applyDialog.coverLetterPlaceholder' | translate"></textarea>
          </div>

          <div>
            <label class="sw-label">{{ 'recruitment.applyDialog.sourceLabel' | translate }}</label>
            <select formControlName="source" class="sw-input w-full">
              <option value="DIRECT">{{ 'recruitment.applyDialog.source.direct' | translate }}</option>
              <option value="REFERRAL">{{ 'recruitment.applyDialog.source.referral' | translate }}</option>
              <option value="RECRUITER">{{ 'recruitment.applyDialog.source.recruiter' | translate }}</option>
              <option value="LINKEDIN">{{ 'recruitment.applyDialog.source.linkedin' | translate }}</option>
              <option value="JOB_BOARD">{{ 'recruitment.applyDialog.source.jobBoard' | translate }}</option>
              <option value="CAREER_SITE">{{ 'recruitment.applyDialog.source.careerSite' | translate }}</option>
              <option value="INTERNAL">{{ 'recruitment.applyDialog.source.internal' | translate }}</option>
              <option value="OTHER">{{ 'recruitment.applyDialog.source.other' | translate }}</option>
            </select>
          </div>
        </form>
      }

      @if (errorMessage()) {
        <div class="flex items-center gap-2 p-3 mt-4 bg-error-50 text-error-600 rounded-lg text-sm">
          <span class="material-icons text-lg">error</span>
          {{ errorMessage() }}
        </div>
      }

      <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-dark-border">
        <sw-button variant="ghost" size="md" [disabled]="saving()" (clicked)="cancel()">
          {{ 'common.cancel' | translate }}
        </sw-button>
        <sw-button variant="primary" size="md"
                   [disabled]="form.invalid || openJobs().length === 0"
                   [loading]="saving()"
                   (clicked)="onSubmit()">
          <span class="material-icons text-lg" aria-hidden="true">send</span>
          {{ 'recruitment.applyDialog.submitButton' | translate }}
        </sw-button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApplyToJobDialogComponent implements OnInit {
  private readonly dialogRef: DialogRef = inject('DIALOG_REF' as any);
  readonly data: DialogData = inject('DIALOG_DATA' as any);
  private readonly fb = inject(FormBuilder);
  private readonly recruitmentService = inject(RecruitmentService);
  private readonly translate = inject(TranslateService);

  cancel(): void {
    this.dialogRef.close();
  }

  form: FormGroup;
  openJobs = signal<JobPostingSummary[]>([]);
  loadingJobs = signal(true);
  saving = signal(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    this.form = this.fb.group({
      jobId: ['', Validators.required],
      coverLetter: [''],
      source: ['RECRUITER']
    });
  }

  ngOnInit(): void {
    this.loadOpenJobs();
  }

  loadOpenJobs(): void {
    this.loadingJobs.set(true);
    this.recruitmentService.searchJobs(0, 100, 'OPEN').subscribe({
      next: (response) => {
        this.openJobs.set(response.content);
        this.loadingJobs.set(false);
      },
      error: () => {
        this.loadingJobs.set(false);
        this.errorMessage.set(this.translate.instant('recruitment.applyDialog.errorLoadingJobs'));
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    const request: CreateApplicationRequest = {
      candidateId: this.data.candidate.id,
      jobId: this.form.value.jobId,
      coverLetter: this.form.value.coverLetter || undefined,
      source: this.form.value.source || undefined
    };

    this.recruitmentService.createApplication(request).subscribe({
      next: (application) => {
        this.saving.set(false);
        this.dialogRef.close(application);
      },
      error: (err) => {
        console.error('Failed to create application', err);
        this.saving.set(false);
        if (err.error?.detail) {
          this.errorMessage.set(err.error.detail);
        } else {
          this.errorMessage.set(this.translate.instant('recruitment.applyDialog.errorSubmitting'));
        }
      }
    });
  }
}
