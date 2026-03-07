import { Component, inject, OnInit, ChangeDetectionStrategy, signal, computed, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { LeaveService, LeaveBalance, LeaveType, CreateLeaveRequest } from '@core/services/leave.service';
import { SpinnerComponent, DialogRef, ButtonComponent } from '@shared/ui';

interface DialogData {
  balances: LeaveBalance[];
}

interface LeaveTypeOption {
  value: LeaveType;
  label: string;
  icon: string;
  available: number;
  color: string;
}

@Component({
  selector: 'app-leave-request-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    SpinnerComponent,
    ButtonComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 min-w-[450px]" role="dialog" aria-labelledby="leave-dialog-title">
      <h2 id="leave-dialog-title" class="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
        <span class="material-icons text-primary-500" aria-hidden="true">event_available</span>
        {{ 'leave.requestDialog.title' | translate }}
      </h2>

      <form [formGroup]="form" class="space-y-4">
        <!-- Leave Type -->
        <div>
          <label for="leaveType" class="sw-label">{{ 'leave.requestDialog.leaveTypeLabel' | translate }}</label>
          <select id="leaveType" formControlName="leaveType" class="sw-input w-full" aria-required="true"
                  [attr.aria-invalid]="form.get('leaveType')?.invalid && form.get('leaveType')?.touched"
                  [attr.aria-describedby]="(form.get('leaveType')?.invalid && form.get('leaveType')?.touched) ? 'leaveType-error' : null">
            <option value="">{{ 'leave.requestDialog.selectLeaveType' | translate }}</option>
            @for (option of leaveTypeOptions; track option.value) {
              <option [value]="option.value" [disabled]="option.available <= 0">
                {{ option.label | translate }} ({{ option.available }} {{ 'leave.requestDialog.days' | translate }})
              </option>
            }
          </select>
          @if (form.get('leaveType')?.hasError('required') && form.get('leaveType')?.touched) {
            <p id="leaveType-error" class="text-sm text-error-500 mt-1" role="alert">{{ 'leave.requestDialog.leaveTypeRequired' | translate }}</p>
          }
        </div>

        <!-- Selected Balance Info -->
        @if (selectedBalance()) {
          <div class="flex items-center gap-2 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-sm text-primary-700 dark:text-primary-400" role="status">
            <span class="material-icons text-lg" aria-hidden="true">info</span>
            <span>
              {{ 'leave.requestDialog.available' | translate }}: <strong>{{ selectedBalance()!.available }}</strong> {{ 'leave.requestDialog.days' | translate }}
              ({{ selectedBalance()!.entitlement }} {{ 'leave.requestDialog.entitled' | translate }}, {{ selectedBalance()!.used }} {{ 'leave.requestDialog.used' | translate }}, {{ selectedBalance()!.pending }} {{ 'leave.requestDialog.pending' | translate }})
            </span>
          </div>
        }

        <!-- Date Range -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="startDate" class="sw-label">{{ 'leave.requestDialog.startDateLabel' | translate }}</label>
            <input id="startDate" type="date" formControlName="startDate" class="sw-input w-full" aria-required="true"
                   [attr.aria-invalid]="form.get('startDate')?.invalid && form.get('startDate')?.touched"
                   [attr.aria-describedby]="(form.get('startDate')?.invalid && form.get('startDate')?.touched) ? 'startDate-error' : null">
            @if (form.get('startDate')?.hasError('required') && form.get('startDate')?.touched) {
              <p id="startDate-error" class="text-sm text-error-500 mt-1" role="alert">{{ 'leave.requestDialog.startDateRequired' | translate }}</p>
            }
          </div>

          <div>
            <label for="endDate" class="sw-label">{{ 'leave.requestDialog.endDateLabel' | translate }}</label>
            <input id="endDate" type="date" formControlName="endDate" class="sw-input w-full" aria-required="true"
                   [attr.aria-invalid]="form.get('endDate')?.invalid && form.get('endDate')?.touched"
                   [attr.aria-describedby]="(form.get('endDate')?.invalid && form.get('endDate')?.touched) ? 'endDate-error' : null">
            @if (form.get('endDate')?.hasError('required') && form.get('endDate')?.touched) {
              <p id="endDate-error" class="text-sm text-error-500 mt-1" role="alert">{{ 'leave.requestDialog.endDateRequired' | translate }}</p>
            }
          </div>
        </div>

        <!-- Calculated Days -->
        @if (calculatedDays() !== null) {
          <div class="flex items-center gap-2 p-3 rounded-lg text-sm"
               [ngClass]="insufficientBalance() ? 'bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400' : 'bg-neutral-50 dark:bg-dark-elevated text-neutral-700 dark:text-neutral-300'"
               [attr.role]="insufficientBalance() ? 'alert' : 'status'">
            <span class="material-icons text-lg" aria-hidden="true">{{ insufficientBalance() ? 'warning' : 'event_note' }}</span>
            <span>
              @if (insufficientBalance()) {
                {{ 'leave.requestDialog.insufficientBalance' | translate: {days: calculatedDays(), available: selectedBalance()?.available} }}
              } @else {
                {{ 'leave.requestDialog.workingDays' | translate: {days: calculatedDays()} }}
              }
            </span>
          </div>
        }

        <!-- Reason -->
        <div>
          <label for="reason" class="sw-label">{{ 'leave.requestDialog.reasonLabel' | translate }}</label>
          <textarea id="reason" formControlName="reason" class="sw-input w-full" rows="3"
                    [attr.placeholder]="'leave.requestDialog.reasonPlaceholder' | translate"
                    aria-describedby="reason-hint"></textarea>
          <p id="reason-hint" class="text-sm text-neutral-400 mt-1 text-right">{{ form.get('reason')?.value?.length || 0 }}/500</p>
        </div>
      </form>

      <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-dark-border">
        <sw-button variant="ghost" size="md" [disabled]="submitting()" (clicked)="cancel()">
          {{ 'leave.requestDialog.cancelButton' | translate }}
        </sw-button>
        <sw-button variant="primary" size="md"
                   [disabled]="form.invalid || insufficientBalance()"
                   [loading]="submitting()"
                   (clicked)="submit()">
          <span class="material-icons text-lg" aria-hidden="true">send</span>
          {{ 'leave.requestDialog.submitButton' | translate }}
        </sw-button>
      </div>
    </div>
  `
})
export class LeaveRequestDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly leaveService = inject(LeaveService);
  private readonly dialogRef: DialogRef = inject('DIALOG_REF' as any);
  private readonly data: DialogData = inject('DIALOG_DATA' as any);

  form!: FormGroup;
  submitting = signal(false);
  leaveTypeOptions: LeaveTypeOption[] = [];

  // Computed values using signals
  selectedLeaveType = signal<LeaveType | null>(null);
  startDate = signal<Date | null>(null);
  endDate = signal<Date | null>(null);

  selectedBalance = computed(() => {
    const type = this.selectedLeaveType();
    if (!type) return null;
    return this.data.balances.find(b => b.leaveType === type) || null;
  });

  calculatedDays = computed(() => {
    const start = this.startDate();
    const end = this.endDate();
    if (!start || !end) return null;
    return this.calculateWorkingDays(start, end);
  });

  insufficientBalance = computed(() => {
    const days = this.calculatedDays();
    const balance = this.selectedBalance();
    if (days === null || !balance) return false;
    return days > balance.available;
  });

  ngOnInit(): void {
    this.initForm();
    this.buildLeaveTypeOptions();
  }

  private initForm(): void {
    this.form = this.fb.group({
      leaveType: [null, Validators.required],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      reason: ['', Validators.maxLength(500)]
    });

    this.form.get('leaveType')?.valueChanges.subscribe(value => {
      this.selectedLeaveType.set(value);
    });

    this.form.get('startDate')?.valueChanges.subscribe(value => {
      this.startDate.set(value ? new Date(value) : null);
      // Ensure end date is not before start date
      const endDate = this.form.get('endDate')?.value;
      if (value && endDate && new Date(endDate) < new Date(value)) {
        this.form.get('endDate')?.setValue(value);
      }
    });

    this.form.get('endDate')?.valueChanges.subscribe(value => {
      this.endDate.set(value ? new Date(value) : null);
    });
  }

  private buildLeaveTypeOptions(): void {
    const typeConfig: Record<LeaveType, { labelKey: string; icon: string; color: string }> = {
      ANNUAL: { labelKey: 'leave.types.annual', icon: 'beach_access', color: '#4CAF50' },
      SICK: { labelKey: 'leave.types.sick', icon: 'medical_services', color: '#f44336' },
      FAMILY_RESPONSIBILITY: { labelKey: 'leave.types.familyResponsibility', icon: 'family_restroom', color: '#9C27B0' },
      MATERNITY: { labelKey: 'leave.types.maternity', icon: 'pregnant_woman', color: '#E91E63' },
      PARENTAL: { labelKey: 'leave.types.parental', icon: 'child_care', color: '#00BCD4' },
      UNPAID: { labelKey: 'leave.types.unpaid', icon: 'money_off', color: '#607D8B' },
      STUDY: { labelKey: 'leave.types.study', icon: 'school', color: '#FF9800' }
    };

    this.leaveTypeOptions = this.data.balances.map(balance => ({
      value: balance.leaveType,
      label: typeConfig[balance.leaveType]?.labelKey || balance.leaveType,
      icon: typeConfig[balance.leaveType]?.icon || 'event',
      color: typeConfig[balance.leaveType]?.color || '#607D8B',
      available: balance.available
    }));
  }

  private calculateWorkingDays(start: Date, end: Date): number {
    let count = 0;
    const current = new Date(start);
    const endDate = new Date(end);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  cancel(): void {
    this.dialogRef.close();
  }

  submit(): void {
    if (this.form.invalid || this.insufficientBalance()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    const request: CreateLeaveRequest = {
      leaveType: this.form.value.leaveType,
      startDate: this.form.value.startDate,
      endDate: this.form.value.endDate,
      reason: this.form.value.reason || undefined
    };

    // Use self-service endpoint - backend uses JWT token to identify the employee
    this.leaveService.createMyLeaveRequest(request).subscribe({
      next: (response) => {
        this.submitting.set(false);
        this.dialogRef.close(response);
      },
      error: () => {
        this.submitting.set(false);
      }
    });
  }
}
