import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LeaveRequest, LeaveService } from '@core/services/leave.service';
import { DialogRef, ButtonComponent } from '@shared/ui';

interface DialogData {
  request: LeaveRequest;
}

@Component({
  selector: 'app-leave-cancel-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatePipe,
    TranslateModule,
    ButtonComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 min-w-[400px]">
      <h2 class="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
        <span class="material-icons text-error-500">cancel</span>
        {{ 'leave.cancelDialog.title' | translate }}
      </h2>

      <!-- Request Info -->
      <div class="p-4 bg-neutral-50 dark:bg-dark-elevated rounded-lg mb-4 text-sm space-y-1">
        <p><strong>{{ 'leave.cancelDialog.leaveType' | translate }}:</strong> {{ getLeaveTypeLabel(data.request.leaveType) | translate }}</p>
        <p><strong>{{ 'leave.cancelDialog.dates' | translate }}:</strong> {{ data.request.startDate | date:'mediumDate' }} - {{ data.request.endDate | date:'mediumDate' }}</p>
        <p><strong>{{ 'leave.cancelDialog.days' | translate }}:</strong> {{ data.request.days }}</p>
      </div>

      <!-- Warning -->
      <div class="flex items-start gap-3 p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg text-sm mb-4">
        <span class="material-icons text-warning-500">warning</span>
        <span class="text-neutral-700 dark:text-neutral-300">{{ 'leave.cancelDialog.warningMessage' | translate }}</span>
      </div>

      <!-- Reason Input -->
      <div>
        <label class="sw-label">{{ 'leave.cancelDialog.reasonLabel' | translate }}</label>
        <textarea [formControl]="reasonControl" class="sw-input w-full" rows="3"
                  [placeholder]="'leave.cancelDialog.reasonPlaceholder' | translate"
                  [class.border-error-500]="reasonControl.touched && reasonControl.invalid"></textarea>
        @if (reasonControl.hasError('required') && reasonControl.touched) {
          <p class="text-sm text-error-500 mt-1">{{ 'leave.cancelDialog.errorRequired' | translate }}</p>
        }
        @if (reasonControl.hasError('minlength')) {
          <p class="text-sm text-error-500 mt-1">{{ 'leave.cancelDialog.errorMinlength' | translate }}</p>
        }
        <p class="text-sm text-neutral-400 mt-1 text-right">{{ reasonControl.value?.length || 0 }}/500</p>
      </div>

      <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-dark-border">
        <sw-button variant="ghost" size="md" (clicked)="cancel()">
          {{ 'leave.cancelDialog.keepButton' | translate }}
        </sw-button>
        <sw-button variant="danger" size="md" [disabled]="reasonControl.invalid" (clicked)="confirm()">
          <span class="material-icons text-lg" aria-hidden="true">cancel</span>
          {{ 'leave.cancelDialog.cancelButton' | translate }}
        </sw-button>
      </div>
    </div>
  `
})
export class LeaveCancelDialogComponent {
  private readonly dialogRef: DialogRef = inject('DIALOG_REF' as any);
  private readonly translate: TranslateService = inject(TranslateService);
  readonly data: DialogData = inject('DIALOG_DATA' as any);

  reasonControl = new FormControl('', [
    Validators.required,
    Validators.minLength(10),
    Validators.maxLength(500)
  ]);

  getLeaveTypeLabel(type: string): string {
    return LeaveService.getLeaveTypeLabel(type as any);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    if (this.reasonControl.valid) {
      this.dialogRef.close(this.reasonControl.value);
    } else {
      this.reasonControl.markAsTouched();
    }
  }
}
