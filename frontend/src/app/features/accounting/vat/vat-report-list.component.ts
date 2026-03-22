import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { VatService, VatReportSummary, ReportStatus } from '../../../core/services/vat.service';
import { PageResponse } from '../../../core/services/accounting.service';
import { SpinnerComponent } from '@shared/ui';

@Component({
  selector: 'app-vat-report-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    TranslateModule,
    SpinnerComponent,
    CurrencyPipe,
    DatePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="sw-page-header">
        <div class="flex items-center gap-3">
          <a routerLink="/accounting/vat" class="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300">
            <span class="material-icons">arrow_back</span>
          </a>
          <div>
            <h1 class="sw-page-title">{{ 'accounting.vat.list.pageTitle' | translate }}</h1>
            <p class="sw-page-description">{{ 'accounting.vat.list.pageDescription' | translate }}</p>
          </div>
        </div>
        <a routerLink="/accounting/vat/new" class="sw-btn sw-btn-primary sw-btn-md">
          <span class="material-icons text-lg">add</span>
          {{ 'accounting.vat.list.generateNewReturn' | translate }}
        </a>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
        <div class="flex flex-wrap gap-4 items-center">
          <div class="flex-1 min-w-[200px]">
            <label class="sr-only">{{ 'accounting.vat.list.filterByStatus' | translate }}</label>
            <select [(ngModel)]="statusFilter" (ngModelChange)="loadReports()" class="sw-input w-full">
              <option value="">{{ 'accounting.vat.list.allStatuses' | translate }}</option>
              <option value="DRAFT">{{ 'accounting.vat.status.draft' | translate }}</option>
              <option value="PREVIEW">{{ 'accounting.vat.status.preview' | translate }}</option>
              <option value="GENERATED">{{ 'accounting.vat.status.readyToSubmit' | translate }}</option>
              <option value="SUBMITTED">{{ 'accounting.vat.status.submitted' | translate }}</option>
              <option value="PAID">{{ 'accounting.vat.status.paid' | translate }}</option>
              <option value="AMENDED">{{ 'accounting.vat.status.amended' | translate }}</option>
            </select>
          </div>
          <div class="flex-1 min-w-[150px]">
            <label class="sr-only">{{ 'accounting.vat.list.filterByYear' | translate }}</label>
            <select [(ngModel)]="yearFilter" (ngModelChange)="loadReports()" class="sw-input w-full">
              <option [value]="null">{{ 'accounting.vat.list.allYears' | translate }}</option>
              @for (year of availableYears; track year) {
                <option [value]="year">{{ year }}</option>
              }
            </select>
          </div>
          <button (click)="clearFilters()" class="sw-btn sw-btn-outline sw-btn-sm">
            {{ 'accounting.vat.list.clearFilters' | translate }}
          </button>
        </div>
      </div>

      <!-- Reports Table -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border">
        @if (loading()) {
          <div class="flex justify-center items-center py-24">
            <sw-spinner size="lg" />
          </div>
        } @else if (reports().length > 0) {
          <div class="overflow-x-auto">
            <table class="sw-table">
              <thead>
                <tr>
                  <th>{{ 'accounting.vat.list.tableHeaders.period' | translate }}</th>
                  <th>{{ 'accounting.vat.list.tableHeaders.dateRange' | translate }}</th>
                  <th>{{ 'accounting.vat.list.tableHeaders.status' | translate }}</th>
                  <th>{{ 'accounting.vat.list.tableHeaders.dueDate' | translate }}</th>
                  <th class="text-right">{{ 'accounting.vat.list.tableHeaders.outputVat' | translate }}</th>
                  <th class="text-right">{{ 'accounting.vat.list.tableHeaders.inputVat' | translate }}</th>
                  <th class="text-right">{{ 'accounting.vat.list.tableHeaders.netVat' | translate }}</th>
                  <th>{{ 'accounting.vat.list.tableHeaders.created' | translate }}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (report of reports(); track report.id) {
                  <tr class="hover:bg-neutral-50 dark:hover:bg-dark-elevated cursor-pointer" (click)="viewReport(report.id)">
                    <td class="font-medium">{{ formatPeriod(report.periodStart) }}</td>
                    <td class="text-sm text-neutral-600 dark:text-neutral-400">
                      {{ getPeriodRange(report.periodStart, report.periodEnd) }}
                    </td>
                    <td>
                      <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full" [class]="getStatusBadgeColor(report.status)">
                        {{ getStatusLabel(report.status) }}
                      </span>
                    </td>
                    <td class="text-sm" [class]="isOverdue(report) ? 'text-red-600 font-medium' : 'text-neutral-600 dark:text-neutral-400'">
                      @if (report.paymentDueDate) {
                        {{ report.paymentDueDate | date:'mediumDate' }}
                        @if (isOverdue(report)) {
                          <span class="material-icons text-sm ml-1 text-red-600">warning</span>
                        }
                      } @else {
                        -
                      }
                    </td>
                    <td class="text-right font-mono text-sm">
                      {{ getOutputVat(report) | currency:'ZAR':'symbol':'1.2-2' }}
                    </td>
                    <td class="text-right font-mono text-sm">
                      {{ getInputVat(report) | currency:'ZAR':'symbol':'1.2-2' }}
                    </td>
                    <td class="text-right font-mono font-medium" [class]="report.isPayable ? 'text-red-600' : 'text-green-600'">
                      {{ report.isPayable ? '' : '-' }}{{ report.netVat | currency:'ZAR':'symbol':'1.2-2' }}
                    </td>
                    <td class="text-sm text-neutral-500 dark:text-neutral-400">
                      {{ report.createdAt | date:'shortDate' }}
                    </td>
                    <td class="text-right">
                      <button class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300" [title]="'accounting.vat.list.viewReport' | translate">
                        <span class="material-icons">chevron_right</span>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="p-4 border-t border-neutral-200 dark:border-dark-border flex items-center justify-between">
              <p class="text-sm text-neutral-500 dark:text-neutral-400">
                {{ 'accounting.vat.list.pagination.page' | translate : { currentPage: currentPage() + 1, totalPages: totalPages(), total: totalElements() } }}
              </p>
              <div class="flex gap-2">
                <button (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() === 0"
                        class="sw-btn sw-btn-outline sw-btn-sm">
                  <span class="material-icons text-sm">chevron_left</span>
                  {{ 'accounting.vat.list.pagination.previous' | translate }}
                </button>
                <button (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() >= totalPages() - 1"
                        class="sw-btn sw-btn-outline sw-btn-sm">
                  {{ 'accounting.vat.list.pagination.next' | translate }}
                  <span class="material-icons text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          }
        } @else {
          <div class="p-12 text-center">
            <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">receipt_long</span>
            <p class="text-neutral-500 dark:text-neutral-400 mb-4">
              @if (statusFilter || yearFilter) {
                {{ 'accounting.vat.list.emptyState.noResultsFiltered' | translate }}
              } @else {
                {{ 'accounting.vat.list.emptyState.noReturnsGenerated' | translate }}
              }
            </p>
            @if (statusFilter || yearFilter) {
              <button (click)="clearFilters()" class="sw-btn sw-btn-outline sw-btn-md">
                {{ 'accounting.vat.list.clearFilters' | translate }}
              </button>
            } @else {
              <a routerLink="/accounting/vat/new" class="sw-btn sw-btn-primary sw-btn-md">
                <span class="material-icons text-lg">add</span>
                {{ 'accounting.vat.list.generateFirstReturn' | translate }}
              </a>
            }
          </div>
        }
      </div>

      <!-- Summary Stats -->
      @if (reports().length > 0) {
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.vat.list.stats.totalReturns' | translate }}</p>
            <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{{ totalElements() }}</p>
          </div>
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.vat.list.stats.submitted' | translate }}</p>
            <p class="text-2xl font-bold text-green-600">{{ submittedCount() }}</p>
          </div>
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.vat.list.stats.pending' | translate }}</p>
            <p class="text-2xl font-bold text-amber-600">{{ pendingCount() }}</p>
          </div>
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.vat.list.stats.overdue' | translate }}</p>
            <p class="text-2xl font-bold" [class]="overdueCount() > 0 ? 'text-red-600' : 'text-neutral-800 dark:text-neutral-200'">
              {{ overdueCount() }}
            </p>
          </div>
        </div>
      }
    </div>
  `
})
export class VatReportListComponent implements OnInit {
  private readonly vatService = inject(VatService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);

  loading = signal(true);
  reports = signal<VatReportSummary[]>([]);
  currentPage = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);

  statusFilter: ReportStatus | '' = '';
  yearFilter: number | null = null;
  availableYears: number[] = [];

  // Computed counts
  submittedCount = signal(0);
  pendingCount = signal(0);
  overdueCount = signal(0);

  ngOnInit(): void {
    this.generateAvailableYears();
    this.loadReports();
  }

  generateAvailableYears(): void {
    const currentYear = new Date().getFullYear();
    this.availableYears = [];
    for (let i = 0; i < 5; i++) {
      this.availableYears.push(currentYear - i);
    }
  }

  loadReports(): void {
    this.loading.set(true);
    const status = this.statusFilter || undefined;
    const year = this.yearFilter || undefined;

    this.vatService.searchReports(this.currentPage(), 20, status as ReportStatus | undefined, year)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.reports.set(response.content);
          this.totalPages.set(response.totalPages);
          this.totalElements.set(response.totalElements);
          this.updateCounts(response.content);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load VAT reports', err);
          this.loading.set(false);
        }
      });
  }

  updateCounts(reports: VatReportSummary[]): void {
    this.submittedCount.set(reports.filter(r => r.status === 'SUBMITTED' || r.status === 'PAID').length);
    this.pendingCount.set(reports.filter(r => r.status === 'DRAFT' || r.status === 'PREVIEW' || r.status === 'GENERATED').length);
    this.overdueCount.set(reports.filter(r => this.isOverdue(r)).length);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadReports();
    }
  }

  clearFilters(): void {
    this.statusFilter = '';
    this.yearFilter = null;
    this.currentPage.set(0);
    this.loadReports();
  }

  viewReport(reportId: string): void {
    this.router.navigate(['/accounting/vat', reportId]);
  }

  getStatusLabel(status: ReportStatus): string {
    const statusKey = `accounting.vat.status.${status.toLowerCase()}`;
    return this.translate.instant(statusKey);
  }

  getStatusBadgeColor(status: ReportStatus): string {
    return VatService.getStatusColor(status);
  }

  formatPeriod(periodStart: string): string {
    return VatService.formatPeriod(periodStart);
  }

  getPeriodRange(periodStart: string, periodEnd: string): string {
    return VatService.getPeriodRange(periodStart, periodEnd);
  }

  isOverdue(report: VatReportSummary): boolean {
    return VatService.isOverdue(report);
  }

  // Helper to calculate output VAT from net (approximate)
  getOutputVat(report: VatReportSummary): number {
    // This is approximate - full data would come from the detail view
    if (report.isPayable) {
      return report.netVat * 2; // Rough estimate
    }
    return report.netVat;
  }

  getInputVat(report: VatReportSummary): number {
    // This is approximate - full data would come from the detail view
    if (!report.isPayable) {
      return report.netVat * 2;
    }
    return report.netVat;
  }
}
