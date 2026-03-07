import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ReportListItem, ReportsService, ReportStatus, ReportType } from '../../../core/services/reports.service';

export interface PageEvent {
  pageIndex: number;
  pageSize: number;
  length: number;
}

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    TranslateModule
  ],
  template: `
    <div class="bg-white dark:bg-dark-surface rounded-2xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-5 border-b border-neutral-100 dark:border-dark-border">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{{ title }}</h3>
            @if (subtitle) {
              <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{{ subtitle }}</p>
            }
          </div>
          @if (reports.length > 0) {
            <span class="px-2.5 py-1 text-xs font-medium rounded-full bg-neutral-100 dark:bg-dark-border text-neutral-600 dark:text-neutral-400">
              {{ totalElements }} reports
            </span>
          }
        </div>
      </div>

      @if (loading) {
        <div class="p-12 flex flex-col items-center justify-center">
          <mat-spinner diameter="40"></mat-spinner>
          <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-4">Loading reports...</p>
        </div>
      } @else if (reports.length === 0) {
        <div class="p-12 flex flex-col items-center justify-center">
          <div class="w-16 h-16 rounded-full bg-neutral-100 dark:bg-dark-border flex items-center justify-center mb-4">
            <span class="material-icons text-3xl text-neutral-400 dark:text-neutral-500">description</span>
          </div>
          <p class="text-neutral-900 dark:text-neutral-100 font-medium">No reports found</p>
          <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Generate a report to see it here</p>
        </div>
      } @else {
        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-neutral-50/70 dark:bg-dark-border/20">
                <th class="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Report</th>
                <th class="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 hidden sm:table-cell">Format</th>
                <th class="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Status</th>
                <th class="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 hidden md:table-cell">Size</th>
                <th class="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 hidden lg:table-cell">Created</th>
                <th class="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 w-[140px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (report of reports; track report.id; let last = $last) {
                <tr class="group transition-colors hover:bg-neutral-50/60 dark:hover:bg-white/[0.03]"
                    [ngClass]="!last ? 'border-b border-neutral-100 dark:border-dark-border/30' : ''">

                  <!-- Report name + type -->
                  <td class="px-6 py-3.5">
                    <div class="flex items-center gap-3 min-w-0">
                      <div class="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center" [class]="getFormatBgClasses(report.outputFormat)">
                        <span class="material-icons text-base" [class]="getFormatTextClasses(report.outputFormat)">{{ getFormatIcon(report.outputFormat) }}</span>
                      </div>
                      <div class="min-w-0">
                        <p class="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[260px]">{{ report.name }}</p>
                        <p class="text-[11px] text-neutral-400 dark:text-neutral-500">{{ getReportTypeLabel(report.reportType) }}</p>
                      </div>
                    </div>
                  </td>

                  <!-- Format badge -->
                  <td class="px-4 py-3.5 hidden sm:table-cell">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold" [class]="getFormatBadgeClasses(report.outputFormat)">
                      {{ report.outputFormat }}
                    </span>
                  </td>

                  <!-- Status -->
                  <td class="px-4 py-3.5">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap" [class]="getStatusClasses(report.status)">
                      @if (report.status === 'GENERATING') {
                        <span class="w-2.5 h-2.5 border-[1.5px] border-current border-t-transparent rounded-full animate-spin"></span>
                      } @else {
                        <span class="material-icons text-xs">{{ getStatusIcon(report.status) }}</span>
                      }
                      {{ getStatusLabel(report.status) }}
                    </span>
                  </td>

                  <!-- Size -->
                  <td class="px-4 py-3.5 hidden md:table-cell">
                    <span class="text-[13px] text-neutral-500 dark:text-neutral-400 tabular-nums">
                      {{ formatFileSize(report.fileSize) }}
                    </span>
                  </td>

                  <!-- Date -->
                  <td class="px-4 py-3.5 hidden lg:table-cell">
                    <p class="text-[13px] text-neutral-700 dark:text-neutral-300">{{ report.createdAt | date:'MMM d, y' }}</p>
                    <p class="text-[11px] text-neutral-400 dark:text-neutral-500">{{ report.createdAt | date:'h:mm a' }}</p>
                  </td>

                  <!-- Actions -->
                  <td class="px-6 py-3.5 text-right">
                    <div class="flex items-center justify-end gap-1">
                      @if (report.status === 'COMPLETED') {
                        <button
                          class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 dark:text-primary-400 dark:bg-primary-900/20 dark:hover:bg-primary-900/30 transition-colors"
                          (click)="onDownload(report)"
                          matTooltip="Download"
                        >
                          <span class="material-icons text-sm">download</span>
                        </button>
                      }
                      @if (report.status === 'FAILED') {
                        <button
                          class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 transition-colors"
                          (click)="onRetry(report)"
                          matTooltip="Retry"
                        >
                          <span class="material-icons text-sm">refresh</span>
                        </button>
                      }
                      <button
                        class="w-8 h-8 rounded-lg inline-flex items-center justify-center text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-dark-border/50 transition-colors"
                        [matMenuTriggerFor]="menu"
                        matTooltip="More actions"
                      >
                        <span class="material-icons text-[20px]">more_vert</span>
                      </button>
                      <mat-menu #menu="matMenu" xPosition="before">
                        @if (report.status === 'COMPLETED') {
                          <button mat-menu-item (click)="onView(report)">
                            <mat-icon class="!text-neutral-600 dark:!text-neutral-300">visibility</mat-icon>
                            <span>View</span>
                          </button>
                          <button mat-menu-item (click)="onDownload(report)">
                            <mat-icon class="!text-neutral-600 dark:!text-neutral-300">download</mat-icon>
                            <span>Download</span>
                          </button>
                        }
                        @if (report.status === 'GENERATING' || report.status === 'QUEUED') {
                          <button mat-menu-item (click)="onCancel(report)">
                            <mat-icon class="!text-neutral-600 dark:!text-neutral-300">cancel</mat-icon>
                            <span>Cancel</span>
                          </button>
                        }
                        @if (report.status === 'FAILED') {
                          <button mat-menu-item (click)="onRetry(report)">
                            <mat-icon class="!text-neutral-600 dark:!text-neutral-300">refresh</mat-icon>
                            <span>Retry</span>
                          </button>
                        }
                        <mat-divider></mat-divider>
                        <button mat-menu-item (click)="onDelete(report)">
                          <mat-icon class="!text-red-500">delete_outline</mat-icon>
                          <span class="text-red-600 dark:text-red-400">Delete</span>
                        </button>
                      </mat-menu>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (showPagination && totalElements > pageSize) {
          <div class="flex items-center justify-between px-6 py-3 border-t border-neutral-100 dark:border-dark-border/40">
            <span class="text-xs text-neutral-500 dark:text-neutral-400">
              Showing {{ (pageIndex * pageSize) + 1 }}&ndash;{{ Math.min((pageIndex + 1) * pageSize, totalElements) }} of {{ totalElements }}
            </span>
            <div class="flex items-center gap-1">
              <button
                class="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-dark-border/50 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                [disabled]="pageIndex === 0"
                (click)="goToPage(0)"
                matTooltip="First page"
              >
                <span class="material-icons text-lg">first_page</span>
              </button>
              <button
                class="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-dark-border/50 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                [disabled]="pageIndex === 0"
                (click)="goToPage(pageIndex - 1)"
                matTooltip="Previous"
              >
                <span class="material-icons text-lg">chevron_left</span>
              </button>
              <span class="text-xs text-neutral-500 dark:text-neutral-400 px-2 tabular-nums">{{ pageIndex + 1 }} / {{ totalPages }}</span>
              <button
                class="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-dark-border/50 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                [disabled]="pageIndex >= totalPages - 1"
                (click)="goToPage(pageIndex + 1)"
                matTooltip="Next"
              >
                <span class="material-icons text-lg">chevron_right</span>
              </button>
              <button
                class="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-dark-border/50 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                [disabled]="pageIndex >= totalPages - 1"
                (click)="goToPage(totalPages - 1)"
                matTooltip="Last page"
              >
                <span class="material-icons text-lg">last_page</span>
              </button>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host ::ng-deep .mat-mdc-menu-panel {
      min-width: 160px !important;
      border-radius: 12px !important;
      box-shadow: 0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08) !important;
      border: 1px solid rgba(0,0,0,0.06);
    }
    :host ::ng-deep .mat-mdc-menu-item {
      font-size: 13px !important;
      min-height: 40px !important;
    }
    :host ::ng-deep .mat-mdc-menu-item .mat-icon {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
      margin-right: 10px !important;
    }
    :host ::ng-deep .mat-divider {
      margin: 4px 0 !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportListComponent {
  private readonly translate = inject(TranslateService);

  @Input() title = 'Report History';
  @Input() subtitle?: string;
  @Input() reports: ReportListItem[] = [];
  @Input() loading = false;
  @Input() showPagination = true;
  @Input() totalElements = 0;
  @Input() pageSize = 10;
  @Input() pageIndex = 0;

  @Output() download = new EventEmitter<ReportListItem>();
  @Output() view = new EventEmitter<ReportListItem>();
  @Output() retry = new EventEmitter<ReportListItem>();
  @Output() cancelReport = new EventEmitter<ReportListItem>();
  @Output() delete = new EventEmitter<ReportListItem>();
  @Output() pageChange = new EventEmitter<PageEvent>();

  Math = Math;

  get totalPages(): number {
    return Math.ceil(this.totalElements / this.pageSize);
  }

  formatFileSize = ReportsService.formatFileSize;

  getReportTypeLabel(type: ReportType): string {
    const key = `reports.list.reportTypes.${type}`;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : ReportsService.getReportTypeLabel(type);
  }

  getStatusLabel(status: ReportStatus): string {
    const key = `reports.list.statuses.${status}`;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : ReportsService.getStatusLabel(status);
  }

  getFormatIcon(format: string): string {
    switch (format) {
      case 'PDF': return 'picture_as_pdf';
      case 'EXCEL': return 'table_chart';
      case 'CSV': return 'description';
      default: return 'description';
    }
  }

  getFormatBgClasses(format: string): string {
    switch (format) {
      case 'PDF': return 'bg-red-50 dark:bg-red-900/20';
      case 'EXCEL': return 'bg-emerald-50 dark:bg-emerald-900/20';
      case 'CSV': return 'bg-sky-50 dark:bg-sky-900/20';
      default: return 'bg-neutral-100 dark:bg-neutral-800';
    }
  }

  getFormatTextClasses(format: string): string {
    switch (format) {
      case 'PDF': return 'text-red-600 dark:text-red-400';
      case 'EXCEL': return 'text-emerald-600 dark:text-emerald-400';
      case 'CSV': return 'text-sky-600 dark:text-sky-400';
      default: return 'text-neutral-500 dark:text-neutral-400';
    }
  }

  getFormatBadgeClasses(format: string): string {
    switch (format) {
      case 'PDF': return 'bg-red-100/80 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'EXCEL': return 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'CSV': return 'bg-sky-100/80 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400';
      default: return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400';
    }
  }

  getStatusIcon(status: ReportStatus): string {
    switch (status) {
      case 'COMPLETED': return 'check_circle';
      case 'GENERATING': return 'sync';
      case 'QUEUED': return 'schedule';
      case 'FAILED': return 'error';
      case 'CANCELLED': return 'cancel';
      default: return 'help';
    }
  }

  getStatusClasses(status: ReportStatus): string {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'GENERATING': return 'bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'QUEUED': return 'bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'FAILED': return 'bg-red-100/80 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'CANCELLED': return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
      default: return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
    }
  }

  goToPage(page: number): void {
    this.pageChange.emit({ pageIndex: page, pageSize: this.pageSize, length: this.totalElements });
  }

  onDownload(report: ReportListItem): void {
    this.download.emit(report);
  }

  onView(report: ReportListItem): void {
    this.view.emit(report);
  }

  onRetry(report: ReportListItem): void {
    this.retry.emit(report);
  }

  onCancel(report: ReportListItem): void {
    this.cancelReport.emit(report);
  }

  onDelete(report: ReportListItem): void {
    this.delete.emit(report);
  }
}
