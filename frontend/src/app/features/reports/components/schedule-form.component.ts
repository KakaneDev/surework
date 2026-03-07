import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ReportType,
  OutputFormat,
  ScheduleFrequency,
  DateRangeType,
  CreateScheduleRequest,
  ScheduleResponse,
  ReportsService
} from '../../../core/services/reports.service';
import { ReportTypeOption } from './report-generator.component';
import { SpinnerComponent, ButtonComponent } from '@shared/ui';

@Component({
  selector: 'app-schedule-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    SpinnerComponent,
    ButtonComponent
  ],
  template: `
    <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
      <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-6">
        {{ (isEdit ? 'reports.schedule.editSchedule' : 'reports.schedule.createSchedule') | translate }}
      </h3>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
        <!-- Schedule Name -->
        <div class="space-y-1.5">
          <label for="name" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {{ 'reports.schedule.scheduleName' | translate }} <span class="text-error-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            formControlName="name"
            [placeholder]="'reports.schedule.scheduleNamePlaceholder' | translate"
            class="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            [class.border-error-500]="form.get('name')?.invalid && form.get('name')?.touched"
          >
          @if (form.get('name')?.invalid && form.get('name')?.touched) {
            <p class="text-sm text-error-500 mt-1">{{ 'common.validation.required' | translate }}</p>
          }
        </div>

        <!-- Description -->
        <div class="space-y-1.5">
          <label for="description" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {{ 'reports.schedule.description' | translate }}
          </label>
          <textarea
            id="description"
            formControlName="description"
            rows="2"
            class="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
          ></textarea>
        </div>

        <!-- Report Type (only when creating) -->
        @if (!isEdit) {
          <div class="space-y-1.5">
            <label for="reportType" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {{ 'reports.schedule.reportType' | translate }} <span class="text-error-500">*</span>
            </label>
            <select
              id="reportType"
              formControlName="reportType"
              class="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer"
              [class.border-error-500]="form.get('reportType')?.invalid && form.get('reportType')?.touched"
            >
              <option value="" disabled>{{ 'reports.schedule.selectReportType' | translate }}</option>
              @for (option of reportTypes; track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
            </select>
          </div>
        }

        <!-- Output Format -->
        <div class="space-y-1.5">
          <label for="outputFormat" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {{ 'reports.schedule.outputFormat' | translate }} <span class="text-error-500">*</span>
          </label>
          <div class="flex gap-3">
            @for (format of outputFormats; track format.value) {
              <button
                type="button"
                (click)="selectFormat(format.value)"
                class="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                [class]="form.get('outputFormat')?.value === format.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600'"
              >
                <span class="material-icons text-lg">{{ format.icon }}</span>
                <span class="font-medium text-sm">{{ format.label }}</span>
              </button>
            }
          </div>
        </div>

        <!-- Frequency and Date Range -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label for="frequency" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {{ 'reports.schedule.frequency' | translate }} <span class="text-error-500">*</span>
            </label>
            <select
              id="frequency"
              formControlName="frequency"
              class="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer"
            >
              @for (freq of frequencies; track freq.value) {
                <option [value]="freq.value">{{ freq.labelKey | translate }}</option>
              }
            </select>
          </div>

          <div class="space-y-1.5">
            <label for="dateRangeType" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {{ 'reports.schedule.dateRange' | translate }} <span class="text-error-500">*</span>
            </label>
            <select
              id="dateRangeType"
              formControlName="dateRangeType"
              class="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer"
            >
              @for (range of dateRanges; track range.value) {
                <option [value]="range.value">{{ range.labelKey | translate }}</option>
              }
            </select>
          </div>
        </div>

        <!-- Run Time and Day Selection -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label for="runTime" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {{ 'reports.schedule.runTime' | translate }}
            </label>
            <input
              id="runTime"
              type="time"
              formControlName="runTime"
              class="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            >
          </div>

          @if (form.get('frequency')?.value === 'WEEKLY') {
            <div class="space-y-1.5">
              <label for="dayOfWeek" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {{ 'reports.schedule.dayOfWeek' | translate }}
              </label>
              <select
                id="dayOfWeek"
                formControlName="dayOfWeek"
                class="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer"
              >
                <option [value]="1">{{ 'reports.schedule.days.monday' | translate }}</option>
                <option [value]="2">{{ 'reports.schedule.days.tuesday' | translate }}</option>
                <option [value]="3">{{ 'reports.schedule.days.wednesday' | translate }}</option>
                <option [value]="4">{{ 'reports.schedule.days.thursday' | translate }}</option>
                <option [value]="5">{{ 'reports.schedule.days.friday' | translate }}</option>
                <option [value]="6">{{ 'reports.schedule.days.saturday' | translate }}</option>
                <option [value]="7">{{ 'reports.schedule.days.sunday' | translate }}</option>
              </select>
            </div>
          }

          @if (form.get('frequency')?.value === 'MONTHLY') {
            <div class="space-y-1.5">
              <label for="dayOfMonth" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {{ 'reports.schedule.dayOfMonth' | translate }}
              </label>
              <select
                id="dayOfMonth"
                formControlName="dayOfMonth"
                class="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer"
              >
                @for (day of daysOfMonth; track day) {
                  <option [value]="day">{{ day }}</option>
                }
              </select>
            </div>
          }
        </div>

        <!-- Email Distribution Section -->
        <div class="border-t border-neutral-200 dark:border-dark-border pt-5 mt-5">
          <h4 class="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
            <span class="material-icons text-lg text-neutral-500">email</span>
            {{ 'reports.schedule.emailDistribution' | translate }}
          </h4>

          <!-- Email Recipients -->
          <div class="space-y-1.5 mb-4">
            <label for="emailInput" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {{ 'reports.schedule.recipients' | translate }}
            </label>

            <!-- Email Chips Container -->
            <div class="min-h-[48px] p-2 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all">
              <div class="flex flex-wrap gap-2">
                @for (email of emailRecipients; track email) {
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                    {{ email }}
                    <button
                      type="button"
                      (click)="removeEmail(email)"
                      class="p-0.5 rounded-full hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
                      [attr.aria-label]="'Remove ' + email"
                    >
                      <span class="material-icons text-sm">close</span>
                    </button>
                  </span>
                }
                <input
                  id="emailInput"
                  type="email"
                  [placeholder]="emailRecipients.length === 0 ? ('reports.schedule.addEmailPlaceholder' | translate) : ''"
                  class="flex-1 min-w-[200px] px-1 py-1 bg-transparent border-none outline-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
                  (keydown)="onEmailKeydown($event)"
                  (blur)="onEmailBlur($event)"
                  #emailInput
                >
              </div>
            </div>
            <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ 'reports.schedule.emailHint' | translate }}</p>
          </div>

          <!-- Checkboxes -->
          <div class="flex flex-wrap gap-6">
            <label class="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                formControlName="attachReport"
                class="w-4 h-4 rounded border-neutral-300 dark:border-dark-border text-primary-500 focus:ring-primary-500 focus:ring-offset-0 transition-colors cursor-pointer"
              >
              <span class="text-sm text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-neutral-100">
                {{ 'reports.schedule.attachReport' | translate }}
              </span>
            </label>

            <label class="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                formControlName="includeDownloadLink"
                class="w-4 h-4 rounded border-neutral-300 dark:border-dark-border text-primary-500 focus:ring-primary-500 focus:ring-offset-0 transition-colors cursor-pointer"
              >
              <span class="text-sm text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-neutral-100">
                {{ 'reports.schedule.includeDownloadLink' | translate }}
              </span>
            </label>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end gap-3 pt-5 border-t border-neutral-200 dark:border-dark-border">
          <sw-button
            type="button"
            variant="outline"
            (clicked)="onCancel()"
          >
            {{ 'common.cancel' | translate }}
          </sw-button>

          <sw-button
            type="submit"
            variant="primary"
            [disabled]="form.invalid || saving"
            [loading]="saving"
          >
            {{ (isEdit ? 'reports.schedule.updateSchedule' : 'reports.schedule.createSchedule') | translate }}
          </sw-button>
        </div>
      </form>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);

  @Input() reportTypes: ReportTypeOption[] = [];
  @Input() isEdit = false;
  @Input() schedule?: ScheduleResponse;
  @Input() saving = false;

  @Output() save = new EventEmitter<CreateScheduleRequest>();
  @Output() cancel = new EventEmitter<void>();

  emailRecipients: string[] = [];
  daysOfMonth = Array.from({ length: 28 }, (_, i) => i + 1);

  outputFormats = [
    { value: 'PDF' as OutputFormat, label: 'PDF', icon: 'picture_as_pdf' },
    { value: 'EXCEL' as OutputFormat, label: 'Excel', icon: 'table_chart' },
    { value: 'CSV' as OutputFormat, label: 'CSV', icon: 'description' }
  ];

  frequencies: { value: ScheduleFrequency; labelKey: string }[] = [
    { value: 'DAILY', labelKey: 'reports.schedule.frequencies.daily' },
    { value: 'WEEKLY', labelKey: 'reports.schedule.frequencies.weekly' },
    { value: 'MONTHLY', labelKey: 'reports.schedule.frequencies.monthly' },
    { value: 'QUARTERLY', labelKey: 'reports.schedule.frequencies.quarterly' },
    { value: 'YEARLY', labelKey: 'reports.schedule.frequencies.yearly' }
  ];

  dateRanges: { value: DateRangeType; labelKey: string }[] = [
    { value: 'PREVIOUS_DAY', labelKey: 'reports.schedule.dateRanges.previousDay' },
    { value: 'PREVIOUS_WEEK', labelKey: 'reports.schedule.dateRanges.previousWeek' },
    { value: 'PREVIOUS_MONTH', labelKey: 'reports.schedule.dateRanges.previousMonth' },
    { value: 'PREVIOUS_QUARTER', labelKey: 'reports.schedule.dateRanges.previousQuarter' },
    { value: 'PREVIOUS_YEAR', labelKey: 'reports.schedule.dateRanges.previousYear' },
    { value: 'MONTH_TO_DATE', labelKey: 'reports.schedule.dateRanges.monthToDate' },
    { value: 'YEAR_TO_DATE', labelKey: 'reports.schedule.dateRanges.yearToDate' }
  ];

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    reportType: ['', Validators.required],
    outputFormat: ['PDF', Validators.required],
    frequency: ['MONTHLY', Validators.required],
    dateRangeType: ['PREVIOUS_MONTH', Validators.required],
    runTime: ['06:00'],
    dayOfWeek: [1],
    dayOfMonth: [1],
    attachReport: [true],
    includeDownloadLink: [true]
  });

  ngOnInit(): void {
    if (this.schedule) {
      this.form.patchValue({
        name: this.schedule.name,
        description: this.schedule.description,
        reportType: this.schedule.reportType,
        outputFormat: this.schedule.outputFormat,
        frequency: this.schedule.frequency,
        dateRangeType: this.schedule.dateRangeType,
        runTime: this.schedule.runTime,
        dayOfWeek: this.schedule.dayOfWeek,
        dayOfMonth: this.schedule.dayOfMonth,
        attachReport: this.schedule.attachReport
      });
      this.emailRecipients = [...(this.schedule.emailRecipients || [])];
    }
  }

  selectFormat(format: OutputFormat): void {
    this.form.patchValue({ outputFormat: format });
  }

  onEmailKeydown(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();

    if ((event.key === 'Enter' || event.key === ',') && value) {
      event.preventDefault();
      this.addEmail(value);
      input.value = '';
    }

    if (event.key === 'Backspace' && !value && this.emailRecipients.length > 0) {
      this.emailRecipients.pop();
    }
  }

  onEmailBlur(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    if (value) {
      this.addEmail(value);
      input.value = '';
    }
  }

  addEmail(email: string): void {
    const trimmed = email.trim().replace(/,/g, '');
    if (trimmed && this.isValidEmail(trimmed) && !this.emailRecipients.includes(trimmed)) {
      this.emailRecipients.push(trimmed);
    }
  }

  removeEmail(email: string): void {
    const index = this.emailRecipients.indexOf(email);
    if (index >= 0) {
      this.emailRecipients.splice(index, 1);
    }
  }

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const formValue = this.form.value;
    const request: CreateScheduleRequest = {
      name: formValue.name,
      description: formValue.description || undefined,
      reportType: formValue.reportType,
      outputFormat: formValue.outputFormat,
      frequency: formValue.frequency,
      dateRangeType: formValue.dateRangeType,
      runTime: formValue.runTime || undefined,
      dayOfWeek: formValue.frequency === 'WEEKLY' ? formValue.dayOfWeek : undefined,
      dayOfMonth: formValue.frequency === 'MONTHLY' ? formValue.dayOfMonth : undefined,
      distribution: {
        emailRecipients: this.emailRecipients,
        attachReport: formValue.attachReport,
        includeDownloadLink: formValue.includeDownloadLink
      }
    };

    this.save.emit(request);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
