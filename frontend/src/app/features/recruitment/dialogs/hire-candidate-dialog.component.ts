import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
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
  selector: 'app-hire-candidate-dialog',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    SpinnerComponent,
    ButtonComponent,
    DatePipe,
    DecimalPipe
  ],
  template: `
    <div class="p-6 min-w-[450px]">
      <h2 class="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-2 flex items-center gap-2">
        <span class="material-icons text-success-500" aria-hidden="true">check_circle</span>
        {{ 'recruitment.hireDialog.title' | translate }}
      </h2>
      <p class="text-neutral-500 dark:text-neutral-400 mb-6">
        {{ 'recruitment.hireDialog.subtitle' | translate: { candidateName: data.application.candidate.fullName, positionTitle: data.application.job.title } }}
      </p>

      <!-- Hiring Summary -->
      <div class="p-4 bg-success-50 dark:bg-success-900/20 rounded-lg mb-4">
        <h4 class="text-sm font-semibold text-success-700 dark:text-success-400 mb-3 flex items-center gap-2">
          <span class="material-icons text-lg" aria-hidden="true">assignment_turned_in</span>
          {{ 'recruitment.hireDialog.detailsHeader' | translate }}
        </h4>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.hireDialog.candidateLabel' | translate }}:</span>
            <span class="font-medium text-neutral-700 dark:text-neutral-300">{{ data.application.candidate.fullName }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.hireDialog.positionLabel' | translate }}:</span>
            <span class="font-medium text-neutral-700 dark:text-neutral-300">{{ data.application.job.title }}</span>
          </div>
          @if (data.application.offerSalary) {
            <div class="flex justify-between">
              <span class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.hireDialog.salaryLabel' | translate }}:</span>
              <span class="font-medium text-neutral-700 dark:text-neutral-300">R{{ data.application.offerSalary | number:'1.0-0' }} {{ 'recruitment.hireDialog.perAnnum' | translate }}</span>
            </div>
          }
          @if (data.application.expectedStartDate) {
            <div class="flex justify-between">
              <span class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.hireDialog.startDateLabel' | translate }}:</span>
              <span class="font-medium text-neutral-700 dark:text-neutral-300">{{ data.application.expectedStartDate | date:'mediumDate' }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Notice -->
      <div class="flex items-start gap-3 p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg text-sm">
        <span class="material-icons text-warning-500 text-lg" aria-hidden="true">info</span>
        <span class="text-neutral-700 dark:text-neutral-300">{{ 'recruitment.hireDialog.notice' | translate }}</span>
      </div>

      <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-dark-border">
        <sw-button variant="ghost" size="md" [disabled]="saving()" (clicked)="cancel()">
          {{ 'recruitment.hireDialog.cancelButton' | translate }}
        </sw-button>
        <sw-button variant="primary" size="md" [disabled]="saving()" [loading]="saving()" (clicked)="onConfirm()">
          <span class="material-icons text-lg" aria-hidden="true">check</span>
          {{ 'recruitment.hireDialog.confirmButton' | translate }}
        </sw-button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HireCandidateDialogComponent {
  private readonly dialogRef: DialogRef = inject('DIALOG_REF' as any);
  readonly data: DialogData = inject('DIALOG_DATA' as any);
  private readonly recruitmentService = inject(RecruitmentService);
  private readonly translate = inject(TranslateService);

  cancel(): void {
    this.dialogRef.close();
  }

  saving = signal(false);

  onConfirm(): void {
    this.saving.set(true);

    this.recruitmentService.markAsHired(this.data.application.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error(this.translate.instant('recruitment.hireDialog.errorMessage'), err);
        this.saving.set(false);
      }
    });
  }
}
