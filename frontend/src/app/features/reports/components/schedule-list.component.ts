import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ScheduleResponse, ReportsService, ReportType, ScheduleFrequency, ReportStatus } from '../../../core/services/reports.service';
import { SpinnerComponent, ButtonComponent, IconButtonComponent, DropdownComponent, DropdownItemComponent, DropdownDividerComponent } from '@shared/ui';

interface PageEvent {
  pageIndex: number;
  pageSize: number;
  length: number;
}

@Component({
  selector: 'app-schedule-list',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    TranslateModule,
    SpinnerComponent,
    ButtonComponent,
    IconButtonComponent,
    DropdownComponent,
    DropdownItemComponent,
    DropdownDividerComponent
  ],
  template: `
    <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border">
      <!-- Header -->
      <div class="p-4 border-b border-neutral-200 dark:border-dark-border flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{{ 'reports.scheduleList.scheduledReports' | translate }}</h3>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'reports.scheduleList.manageSchedules' | translate }}</p>
        </div>
        <sw-button variant="primary" (clicked)="onCreate()">
          <span class="material-icons text-lg">add</span>
          {{ 'reports.scheduleList.newSchedule' | translate }}
        </sw-button>
      </div>

      <!-- Loading State -->
      @if (loading) {
        <div class="p-8 flex justify-center">
          <sw-spinner size="lg" />
        </div>
      } @else if (schedules.length === 0) {
        <!-- Empty State -->
        <div class="p-8 text-center">
          <span class="material-icons text-4xl text-neutral-300 dark:text-neutral-600 mb-2">schedule</span>
          <p class="text-neutral-500 dark:text-neutral-400">{{ 'reports.scheduleList.noSchedules' | translate }}</p>
          <sw-button variant="ghost" class="mt-4" (clicked)="onCreate()">
            {{ 'reports.scheduleList.createFirstSchedule' | translate }}
          </sw-button>
        </div>
      } @else {
        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-neutral-50 dark:bg-dark-surface/50 border-b border-neutral-200 dark:border-dark-border">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                  {{ 'reports.scheduleList.columns.schedule' | translate }}
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                  {{ 'reports.scheduleList.columns.frequency' | translate }}
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                  {{ 'reports.scheduleList.columns.nextRun' | translate }}
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                  {{ 'reports.scheduleList.columns.lastRun' | translate }}
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                  {{ 'reports.scheduleList.columns.runs' | translate }}
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                  {{ 'reports.scheduleList.columns.active' | translate }}
                </th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                  {{ 'common.actions' | translate }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100 dark:divide-dark-border">
              @for (schedule of schedules; track schedule.id) {
                <tr class="hover:bg-neutral-50 dark:hover:bg-dark-elevated/30 transition-colors duration-200">
                  <!-- Schedule Name -->
                  <td class="px-4 py-3">
                    <div>
                      <p class="font-medium text-neutral-900 dark:text-neutral-100">{{ schedule.name }}</p>
                      <p class="text-xs text-neutral-500">{{ getReportTypeLabelTranslated(schedule.reportType) }}</p>
                    </div>
                  </td>

                  <!-- Frequency -->
                  <td class="px-4 py-3">
                    <span class="text-sm text-neutral-600 dark:text-neutral-400">
                      {{ getFrequencyLabelTranslated(schedule.frequency) }}
                    </span>
                  </td>

                  <!-- Next Run -->
                  <td class="px-4 py-3">
                    @if (schedule.nextRunAt && schedule.active) {
                      <span class="text-sm text-neutral-600 dark:text-neutral-400">
                        {{ schedule.nextRunAt | date:'short' }}
                      </span>
                    } @else {
                      <span class="text-sm text-neutral-400">-</span>
                    }
                  </td>

                  <!-- Last Run -->
                  <td class="px-4 py-3">
                    @if (schedule.lastRunAt) {
                      <div class="flex items-center gap-2">
                        <span class="text-sm text-neutral-600 dark:text-neutral-400">
                          {{ schedule.lastRunAt | date:'short' }}
                        </span>
                        @if (schedule.lastRunStatus) {
                          <span
                            class="w-2 h-2 rounded-full"
                            [class]="getStatusDotClass(schedule.lastRunStatus)"
                            [title]="getStatusLabelTranslated(schedule.lastRunStatus)"
                          ></span>
                        }
                      </div>
                    } @else {
                      <span class="text-sm text-neutral-400">{{ 'reports.scheduleList.never' | translate }}</span>
                    }
                  </td>

                  <!-- Run Count -->
                  <td class="px-4 py-3">
                    <span class="text-sm text-neutral-600 dark:text-neutral-400">
                      {{ schedule.runCount }}
                      @if (schedule.failureCount > 0) {
                        <span class="text-error-500">({{ schedule.failureCount }} {{ 'reports.scheduleList.failed' | translate }})</span>
                      }
                    </span>
                  </td>

                  <!-- Active Toggle -->
                  <td class="px-4 py-3">
                    <button
                      type="button"
                      (click)="onToggleActive(schedule)"
                      class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      [class]="schedule.active ? 'bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-700'"
                      role="switch"
                      [attr.aria-checked]="schedule.active"
                    >
                      <span
                        class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                        [class]="schedule.active ? 'translate-x-5' : 'translate-x-0'"
                      ></span>
                    </button>
                  </td>

                  <!-- Actions -->
                  <td class="px-4 py-3">
                    <div class="flex items-center justify-end gap-1">
                      <sw-icon-button
                        size="sm"
                        [ariaLabel]="'reports.scheduleList.actions.runNow' | translate"
                        [disabled]="!schedule.active"
                        (clicked)="onRunNow(schedule)"
                      >
                        <span class="material-icons text-lg">play_arrow</span>
                      </sw-icon-button>

                      <sw-dropdown align="right">
                        <button trigger class="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors">
                          <span class="material-icons">more_vert</span>
                        </button>

                        <sw-dropdown-item icon="edit" (onClick)="onEdit(schedule)">
                          {{ 'common.edit' | translate }}
                        </sw-dropdown-item>
                        <sw-dropdown-item icon="play_arrow" (onClick)="onRunNow(schedule)">
                          {{ 'reports.scheduleList.actions.runNow' | translate }}
                        </sw-dropdown-item>
                        <sw-dropdown-item icon="history" (onClick)="onViewHistory(schedule)">
                          {{ 'reports.scheduleList.actions.viewHistory' | translate }}
                        </sw-dropdown-item>
                        <sw-dropdown-divider />
                        <sw-dropdown-item icon="delete" [danger]="true" (onClick)="onDelete(schedule)">
                          {{ 'common.delete' | translate }}
                        </sw-dropdown-item>
                      </sw-dropdown>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (showPagination && totalElements > 0) {
          <div class="px-4 py-3 border-t border-neutral-200 dark:border-dark-border flex items-center justify-between">
            <div class="text-sm text-neutral-500 dark:text-neutral-400">
              {{ 'common.showing' | translate }}
              {{ pageIndex * pageSize + 1 }}-{{ Math.min((pageIndex + 1) * pageSize, totalElements) }}
              {{ 'common.of' | translate }} {{ totalElements }}
            </div>

            <div class="flex items-center gap-2">
              <!-- Page Size Select -->
              <select
                [value]="pageSize"
                (change)="onPageSizeChange($event)"
                class="px-2 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option [value]="5">5</option>
                <option [value]="10">10</option>
                <option [value]="25">25</option>
              </select>

              <!-- Page Navigation -->
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  [disabled]="pageIndex === 0"
                  (click)="goToPage(0)"
                  class="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span class="material-icons text-lg">first_page</span>
                </button>
                <button
                  type="button"
                  [disabled]="pageIndex === 0"
                  (click)="goToPage(pageIndex - 1)"
                  class="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span class="material-icons text-lg">chevron_left</span>
                </button>

                <span class="px-3 text-sm text-neutral-700 dark:text-neutral-300">
                  {{ pageIndex + 1 }} / {{ totalPages }}
                </span>

                <button
                  type="button"
                  [disabled]="pageIndex >= totalPages - 1"
                  (click)="goToPage(pageIndex + 1)"
                  class="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span class="material-icons text-lg">chevron_right</span>
                </button>
                <button
                  type="button"
                  [disabled]="pageIndex >= totalPages - 1"
                  (click)="goToPage(totalPages - 1)"
                  class="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span class="material-icons text-lg">last_page</span>
                </button>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleListComponent {
  private readonly translate = inject(TranslateService);

  @Input() schedules: ScheduleResponse[] = [];
  @Input() loading = false;
  @Input() showPagination = true;
  @Input() totalElements = 0;
  @Input() pageSize = 10;
  @Input() pageIndex = 0;

  @Output() create = new EventEmitter<void>();
  @Output() edit = new EventEmitter<ScheduleResponse>();
  @Output() toggleActive = new EventEmitter<ScheduleResponse>();
  @Output() runNow = new EventEmitter<ScheduleResponse>();
  @Output() viewHistory = new EventEmitter<ScheduleResponse>();
  @Output() delete = new EventEmitter<ScheduleResponse>();
  @Output() pageChange = new EventEmitter<PageEvent>();

  Math = Math;

  get totalPages(): number {
    return Math.ceil(this.totalElements / this.pageSize);
  }

  getReportTypeLabelTranslated(reportType: string): string {
    const key = `reports.scheduleList.reportTypes.${reportType}`;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : ReportsService.getReportTypeLabel(reportType as ReportType);
  }

  getFrequencyLabelTranslated(frequency: string): string {
    const key = `reports.scheduleList.frequencies.${frequency}`;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : ReportsService.getFrequencyLabel(frequency as ScheduleFrequency);
  }

  getStatusLabelTranslated(status: string): string {
    const key = `reports.scheduleList.statuses.${status}`;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : ReportsService.getStatusLabel(status as ReportStatus);
  }

  getStatusDotClass(status: string): string {
    const statusClasses: Record<string, string> = {
      COMPLETED: 'bg-success-500',
      FAILED: 'bg-error-500',
      GENERATING: 'bg-warning-500',
      PENDING: 'bg-neutral-400',
      QUEUED: 'bg-warning-400'
    };
    return statusClasses[status] || 'bg-neutral-400';
  }

  onCreate(): void {
    this.create.emit();
  }

  onEdit(schedule: ScheduleResponse): void {
    this.edit.emit(schedule);
  }

  onToggleActive(schedule: ScheduleResponse): void {
    this.toggleActive.emit(schedule);
  }

  onRunNow(schedule: ScheduleResponse): void {
    this.runNow.emit(schedule);
  }

  onViewHistory(schedule: ScheduleResponse): void {
    this.viewHistory.emit(schedule);
  }

  onDelete(schedule: ScheduleResponse): void {
    this.delete.emit(schedule);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.pageChange.emit({
        pageIndex: page,
        pageSize: this.pageSize,
        length: this.totalElements
      });
    }
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newSize = parseInt(select.value, 10);
    this.pageChange.emit({
      pageIndex: 0,
      pageSize: newSize,
      length: this.totalElements
    });
  }
}
