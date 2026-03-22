import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ReportType,
  OutputFormat,
  GenerateReportRequest,
  ReportsService
} from '../../../core/services/reports.service';

export interface ReportTypeOption {
  value: ReportType;
  label: string;
  description?: string;
  icon?: string;
  badge?: 'popular' | 'new' | 'recommended' | null;
}

@Component({
  selector: 'app-report-generator',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  template: `
    <div class="space-y-6">
      <!-- Report Type Selection Card -->
      <div class="bg-white dark:bg-dark-surface rounded-2xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{{ 'reports.generator.selectReportType' | translate }}</h3>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{{ 'reports.generator.selectReportTypeDescription' | translate }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-600">
            <span class="material-icons text-white text-2xl">description</span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (option of reportTypes; track option.value) {
            <button
              type="button"
              class="group relative text-left p-4 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              [class]="getReportTypeClasses(option.value)"
              (click)="selectReportType(option.value)"
            >
              <!-- Badge -->
              @if (option.badge) {
                <div class="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-medium" [class]="getBadgeClasses(option.badge)">
                  {{ getBadgeLabel(option.badge) }}
                </div>
              }

              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200" [class]="getIconClasses(option.value)">
                  <span class="material-icons">{{ getReportIcon(option.value) }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <h4 class="font-medium text-neutral-900 dark:text-neutral-100">{{ option.label | translate }}</h4>
                    @if (form.get('reportType')?.value === option.value) {
                      <span class="material-icons text-green-500 text-lg">check_circle</span>
                    }
                  </div>
                  @if (option.description) {
                    <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">{{ option.description | translate }}</p>
                  }
                </div>
              </div>
            </button>
          }
        </div>
      </div>

      <!-- Report Settings Card -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Format & Options -->
        <div class="bg-white dark:bg-dark-surface rounded-2xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{{ 'reports.generator.outputFormat' | translate }}</h3>
              <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{{ 'reports.generator.outputFormatDescription' | translate }}</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <span class="material-icons text-green-600 dark:text-green-400">file_present</span>
            </div>
          </div>

          <div class="flex flex-wrap gap-3">
            @for (format of outputFormats; track format.value) {
              <button
                type="button"
                class="flex-1 min-w-[100px] flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                [class]="getFormatButtonClasses(format.value)"
                (click)="selectFormat(format.value)"
              >
                <div class="w-12 h-12 rounded-lg flex items-center justify-center" [class]="getFormatIconClasses(format.value)">
                  <span class="material-icons text-xl">{{ format.icon }}</span>
                </div>
                <span class="font-medium text-sm">{{ format.label }}</span>
              </button>
            }
          </div>

          <!-- Custom Name -->
          <div class="mt-6 pt-6 border-t border-neutral-200 dark:border-dark-border">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
              {{ 'reports.generator.reportName' | translate }} <span class="text-neutral-400 font-normal">({{ 'reports.generator.optional' | translate }})</span>
            </label>
            <input
              type="text"
              [formControl]="$any(form.get('name'))"
              [placeholder]="'reports.generator.reportNamePlaceholder' | translate"
              class="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            >
            <p class="text-xs text-neutral-400 mt-2">{{ 'reports.generator.reportNameHint' | translate }}</p>
          </div>
        </div>

        <!-- Date Range & Preview -->
        <div class="space-y-6">
          @if (showDateRange) {
            <div class="bg-white dark:bg-dark-surface rounded-2xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{{ 'reports.generator.dateRange' | translate }}</h3>
                  <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{{ 'reports.generator.dateRangeDescription' | translate }}</p>
                </div>
                <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <span class="material-icons text-purple-600 dark:text-purple-400">date_range</span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">{{ 'reports.generator.fromDate' | translate }}</label>
                  <div class="relative">
                    <input
                      type="date"
                      [formControl]="$any(form.get('dateFrom'))"
                      class="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    >
                    <span class="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">calendar_today</span>
                  </div>
                </div>
                <div>
                  <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">{{ 'reports.generator.toDate' | translate }}</label>
                  <div class="relative">
                    <input
                      type="date"
                      [formControl]="$any(form.get('dateTo'))"
                      class="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    >
                    <span class="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">calendar_today</span>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Preview Card -->
          @if (form.get('reportType')?.value) {
            <div class="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <span class="material-icons text-2xl">{{ getReportIcon(form.get('reportType')?.value) }}</span>
                </div>
                <div class="flex-1">
                  <h4 class="font-semibold text-lg">{{ 'reports.generator.readyToGenerate' | translate }}</h4>
                  <p class="text-primary-100 mt-1 text-sm">{{ getSelectedReportLabel() }}</p>
                  <div class="flex items-center gap-4 mt-4 text-sm">
                    <div class="flex items-center gap-1.5">
                      <span class="material-icons text-base">{{ getSelectedFormatIcon() }}</span>
                      <span>{{ getSelectedFormatLabel() }}</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="material-icons text-base">timer</span>
                      <span>{{ 'reports.generator.estimatedTime' | translate }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          } @else {
            <div class="bg-neutral-50 dark:bg-dark-border/50 rounded-2xl p-6 border-2 border-dashed border-neutral-200 dark:border-dark-border">
              <div class="text-center">
                <span class="material-icons text-4xl text-neutral-300 dark:text-neutral-600">touch_app</span>
                <p class="text-neutral-500 dark:text-neutral-400 mt-2">{{ 'reports.generator.selectReportToContinue' | translate }}</p>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Generate Button -->
      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="px-4 py-2 rounded-lg font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-border transition-colors duration-fast"
          (click)="onCancel()"
        >
          {{ 'common.cancel' | translate }}
        </button>
        <button
          type="button"
          class="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-colors duration-fast focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          [class]="generating ? 'bg-primary-400' : 'bg-primary-500 hover:bg-primary-600'"
          [disabled]="form.invalid || generating"
          (click)="onGenerate()"
        >
          @if (generating) {
            <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>{{ 'reports.generator.generating' | translate }}</span>
          } @else {
            <span class="material-icons">rocket_launch</span>
            <span>{{ 'reports.generator.generateReport' | translate }}</span>
          }
        </button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportGeneratorComponent {
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);

  @Input() reportTypes: ReportTypeOption[] = [];
  @Input() showDateRange = true;
  @Input() generating = false;

  @Output() generate = new EventEmitter<GenerateReportRequest>();
  @Output() cancel = new EventEmitter<void>();

  outputFormats: { value: OutputFormat; label: string; icon: string }[] = [
    { value: 'PDF', label: 'PDF', icon: 'picture_as_pdf' },
    { value: 'EXCEL', label: 'Excel', icon: 'table_chart' },
    { value: 'CSV', label: 'CSV', icon: 'description' }
  ];

  form: FormGroup = this.fb.group({
    reportType: ['', Validators.required],
    outputFormat: ['PDF', Validators.required],
    dateFrom: [null],
    dateTo: [null],
    name: ['']
  });

  private readonly reportIcons: Record<string, string> = {
    HEADCOUNT: 'people',
    TURNOVER: 'trending_down',
    DEMOGRAPHICS: 'pie_chart',
    PROBATION_STATUS: 'hourglass_empty',
    EMPLOYEE_DIRECTORY: 'folder_shared',
    PAYROLL_REGISTER: 'receipt_long',
    PAYROLL_SUMMARY: 'summarize',
    STATUTORY_DEDUCTIONS: 'account_balance',
    COST_TO_COMPANY: 'paid',
    PAYROLL_VARIANCE: 'compare_arrows',
    YTD_PAYROLL: 'calendar_today',
    PAYROLL_JOURNAL: 'book',
    RECRUITMENT_PIPELINE: 'filter_alt',
    TIME_TO_HIRE: 'schedule',
    SOURCE_EFFECTIVENESS: 'source',
    OFFER_ACCEPTANCE: 'handshake'
  };

  selectReportType(value: ReportType): void {
    this.form.patchValue({ reportType: value });
    this.form.get('reportType')?.markAsTouched();
  }

  selectFormat(value: OutputFormat): void {
    this.form.patchValue({ outputFormat: value });
  }

  getReportIcon(type: string): string {
    return this.reportIcons[type] || 'description';
  }

  getReportTypeClasses(value: ReportType): string {
    const selected = this.form.get('reportType')?.value === value;
    if (selected) {
      return 'border-primary-500 bg-primary-50 dark:bg-primary-900/20';
    }
    return 'border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-sm';
  }

  getIconClasses(value: ReportType): string {
    const selected = this.form.get('reportType')?.value === value;
    if (selected) {
      return 'bg-primary-500 text-white';
    }
    return 'bg-neutral-100 dark:bg-dark-border text-neutral-500 dark:text-neutral-400 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 group-hover:text-primary-500';
  }

  getBadgeClasses(badge: string): string {
    switch (badge) {
      case 'popular':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'new':
        return 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400';
      case 'recommended':
        return 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400';
      default:
        return '';
    }
  }

  getBadgeLabel(badge: string): string {
    const badgeKey = `reports.generator.badges.${badge}`;
    return this.translate.instant(badgeKey);
  }

  getFormatButtonClasses(format: OutputFormat): string {
    const selected = this.form.get('outputFormat')?.value === format;
    if (selected) {
      return 'border-primary-500 bg-primary-50 dark:bg-primary-900/20';
    }
    return 'border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-neutral-300 dark:hover:border-neutral-600';
  }

  getFormatIconClasses(format: OutputFormat): string {
    const selected = this.form.get('outputFormat')?.value === format;
    const colors: Record<string, string> = {
      PDF: selected ? 'bg-red-500 text-white' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
      EXCEL: selected ? 'bg-success-500 text-white' : 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400',
      CSV: selected ? 'bg-primary-500 text-white' : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
    };
    return colors[format] || 'bg-neutral-100 text-neutral-600';
  }

  getSelectedReportLabel(): string {
    const selected = this.reportTypes.find(r => r.value === this.form.get('reportType')?.value);
    return selected?.label || '';
  }

  getSelectedReportDescription(): string {
    const selected = this.reportTypes.find(r => r.value === this.form.get('reportType')?.value);
    return selected?.description || this.translate.instant('reports.generator.selectReportForMoreInfo');
  }

  getSelectedFormatLabel(): string {
    const format = this.form.get('outputFormat')?.value as OutputFormat;
    return this.outputFormats.find(f => f.value === format)?.label || format;
  }

  getSelectedFormatIcon(): string {
    const format = this.form.get('outputFormat')?.value as OutputFormat;
    return this.outputFormats.find(f => f.value === format)?.icon || 'description';
  }

  onGenerate(): void {
    if (this.form.invalid) return;

    const formValue = this.form.value;
    const request: GenerateReportRequest = {
      reportType: formValue.reportType,
      outputFormat: formValue.outputFormat,
      name: formValue.name || undefined,
      dateFrom: formValue.dateFrom ? formValue.dateFrom + 'T00:00:00' : undefined,
      dateTo: formValue.dateTo ? formValue.dateTo + 'T23:59:59' : undefined
    };

    this.generate.emit(request);
  }

  onCancel(): void {
    this.form.reset({ outputFormat: 'PDF' });
    this.cancel.emit();
  }
}
