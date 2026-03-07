import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { VatService, VatDashboardSummary, VatReportSummary, ReportStatus } from '../../../core/services/vat.service';
import { SpinnerComponent } from '@shared/ui';

@Component({
  selector: 'app-vat-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    SpinnerComponent,
    CurrencyPipe,
    DatePipe,
    TranslateModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="sw-page-header">
        <div class="flex items-center gap-3">
          <a routerLink="/accounting" class="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300">
            <span class="material-icons">arrow_back</span>
          </a>
          <div>
            <h1 class="sw-page-title">{{ 'accounting.vat.dashboard.pageTitle' | translate }}</h1>
            <p class="sw-page-description">{{ 'accounting.vat.dashboard.pageDescription' | translate }}</p>
          </div>
        </div>
        <div class="flex gap-3">
          <a routerLink="history" class="sw-btn sw-btn-outline sw-btn-md">
            <span class="material-icons text-lg">history</span>
            {{ 'accounting.vat.dashboard.reportHistory' | translate }}
          </a>
          <button (click)="generateNewReport()" class="sw-btn sw-btn-primary sw-btn-md">
            <span class="material-icons text-lg">add</span>
            {{ 'accounting.vat.dashboard.generateVatReturn' | translate }}
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center items-center py-24">
          <sw-spinner size="lg" />
        </div>
      } @else if (dashboard()) {
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Current Period -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border border-l-4 border-l-blue-500 p-5">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.vat.dashboard.currentPeriod' | translate }}</p>
            @if (dashboard()!.currentPeriod) {
              <p class="text-xl font-bold text-neutral-800 dark:text-neutral-200">{{ formatPeriod(dashboard()!.currentPeriod!.periodStart) }}</p>
              <p class="text-sm mt-1" [class]="getStatusColor(dashboard()!.currentPeriod!.status)">
                {{ getStatusLabel(dashboard()!.currentPeriod!.status) }}
              </p>
            } @else {
              <p class="text-neutral-400 dark:text-neutral-500">{{ 'accounting.vat.dashboard.noReportGenerated' | translate }}</p>
            }
          </div>

          <!-- YTD VAT Payable -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border border-l-4 border-l-green-500 p-5">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.vat.dashboard.ytdVatPayable' | translate }}</p>
            <p class="text-2xl font-bold font-mono text-neutral-800 dark:text-neutral-200">
              {{ dashboard()!.ytdVatPayable | currency:'ZAR':'symbol':'1.2-2' }}
            </p>
          </div>

          <!-- YTD VAT Refundable -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border border-l-4 border-l-amber-500 p-5">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.vat.dashboard.ytdVatRefundable' | translate }}</p>
            <p class="text-2xl font-bold font-mono text-neutral-800 dark:text-neutral-200">
              {{ dashboard()!.ytdVatRefundable | currency:'ZAR':'symbol':'1.2-2' }}
            </p>
          </div>

          <!-- Net VAT Position -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border border-l-4 p-5"
               [class.border-l-red-500]="dashboard()!.ytdNetVat > 0"
               [class.border-l-green-500]="dashboard()!.ytdNetVat <= 0">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.vat.dashboard.ytdNetPosition' | translate }}</p>
            <p class="text-2xl font-bold font-mono"
               [class]="dashboard()!.ytdNetVat > 0 ? 'text-red-600' : 'text-green-600'">
              {{ dashboard()!.ytdNetVat | currency:'ZAR':'symbol':'1.2-2' }}
            </p>
            <p class="text-xs text-neutral-500 mt-1">
              {{ dashboard()!.ytdNetVat > 0 ? ('accounting.vat.dashboard.payableToSars' | translate) : ('accounting.vat.dashboard.refundableFromSars' | translate) }}
            </p>
          </div>
        </div>

        <!-- Alerts Section -->
        @if (dashboard()!.overdueReportsCount > 0 || dashboard()!.pendingReportsCount > 0) {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @if (dashboard()!.overdueReportsCount > 0) {
              <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-4">
                <span class="material-icons text-red-600 text-3xl">warning</span>
                <div class="flex-1">
                  <p class="font-medium text-red-800 dark:text-red-200">
                    {{ dashboard()!.overdueReportsCount }}
                    {{ 'accounting.vat.dashboard.overdueReturn' | translate : { count: dashboard()!.overdueReportsCount } }}
                  </p>
                  <p class="text-sm text-red-600 dark:text-red-400">{{ 'accounting.vat.dashboard.submitImmediately' | translate }}</p>
                </div>
                <a routerLink="overdue" class="sw-btn sw-btn-sm bg-red-600 text-white hover:bg-red-700">
                  {{ 'accounting.vat.dashboard.viewOverdue' | translate }}
                </a>
              </div>
            }
            @if (dashboard()!.pendingReportsCount > 0 && dashboard()!.nextDueDate) {
              <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-4">
                <span class="material-icons text-amber-600 text-3xl">schedule</span>
                <div class="flex-1">
                  <p class="font-medium text-amber-800 dark:text-amber-200">
                    {{ dashboard()!.pendingReportsCount }}
                    {{ 'accounting.vat.dashboard.pendingSubmission' | translate : { count: dashboard()!.pendingReportsCount } }}
                  </p>
                  <p class="text-sm text-amber-600 dark:text-amber-400">{{ 'accounting.vat.dashboard.nextDue' | translate : { date: dashboard()!.nextDueDate | date:'longDate' } }}</p>
                </div>
                <a routerLink="pending" class="sw-btn sw-btn-sm bg-amber-600 text-white hover:bg-amber-700">
                  {{ 'accounting.vat.dashboard.viewPending' | translate }}
                </a>
              </div>
            }
          </div>
        }

        <!-- Current Period Detail -->
        @if (dashboard()!.currentPeriod) {
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border">
            <div class="p-4 border-b border-neutral-200 dark:border-dark-border flex items-center justify-between">
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">
                {{ 'accounting.vat.dashboard.currentPeriodLabel' | translate : { period: formatPeriod(dashboard()!.currentPeriod!.periodStart) } }}
              </h2>
              <div class="flex gap-2">
                <a [routerLink]="['/accounting/vat', dashboard()!.currentPeriod!.id]" class="sw-btn sw-btn-outline sw-btn-sm">
                  {{ 'accounting.vat.dashboard.viewDetails' | translate }}
                </a>
                @if (dashboard()!.currentPeriod!.status === 'GENERATED') {
                  <button (click)="submitCurrentPeriod()" class="sw-btn sw-btn-primary sw-btn-sm">
                    <span class="material-icons text-sm">send</span>
                    {{ 'accounting.vat.dashboard.submitToSars' | translate }}
                  </button>
                }
              </div>
            </div>
            <div class="p-6">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.vat.dashboard.period' | translate }}</p>
                  <p class="font-medium text-neutral-800 dark:text-neutral-200">
                    {{ getPeriodRange(dashboard()!.currentPeriod!.periodStart, dashboard()!.currentPeriod!.periodEnd) }}
                  </p>
                </div>
                <div>
                  <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.vat.dashboard.status' | translate }}</p>
                  <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full" [class]="getStatusBadgeColor(dashboard()!.currentPeriod!.status)">
                    {{ getStatusLabel(dashboard()!.currentPeriod!.status) }}
                  </span>
                </div>
                <div>
                  <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.vat.dashboard.dueDate' | translate }}</p>
                  <p class="font-medium" [class]="isOverdue(dashboard()!.currentPeriod!) ? 'text-red-600' : 'text-neutral-800 dark:text-neutral-200'">
                    {{ dashboard()!.currentPeriod!.paymentDueDate | date:'longDate' }}
                    @if (getDaysUntilDue(dashboard()!.currentPeriod!.paymentDueDate!) > 0) {
                      <span class="text-sm text-neutral-500">({{ getDaysUntilDue(dashboard()!.currentPeriod!.paymentDueDate!) }} {{ 'accounting.vat.dashboard.days' | translate }})</span>
                    }
                  </p>
                </div>
                <div>
                  <p class="text-sm text-neutral-500 dark:text-neutral-400">
                    {{ dashboard()!.currentPeriod!.isPayable ? ('accounting.vat.dashboard.amountPayable' | translate) : ('accounting.vat.dashboard.amountRefundable' | translate) }}
                  </p>
                  <p class="text-xl font-bold font-mono" [class]="dashboard()!.currentPeriod!.isPayable ? 'text-red-600' : 'text-green-600'">
                    {{ dashboard()!.currentPeriod!.netVat | currency:'ZAR':'symbol':'1.2-2' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Recent VAT Returns -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border">
          <div class="p-4 border-b border-neutral-200 dark:border-dark-border flex items-center justify-between">
            <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ 'accounting.vat.dashboard.recentVatReturns' | translate }}</h2>
            <a routerLink="history" class="text-primary-500 hover:text-primary-600 text-sm font-medium">
              {{ 'accounting.vat.dashboard.viewAll' | translate }}
            </a>
          </div>

          @if (dashboard()!.recentReports.length > 0) {
            <div class="overflow-x-auto">
              <table class="sw-table">
                <thead>
                  <tr>
                    <th>{{ 'accounting.vat.dashboard.period' | translate }}</th>
                    <th>{{ 'accounting.vat.dashboard.dateRange' | translate }}</th>
                    <th>{{ 'accounting.vat.dashboard.status' | translate }}</th>
                    <th>{{ 'accounting.vat.dashboard.dueDate' | translate }}</th>
                    <th class="text-right">{{ 'accounting.vat.dashboard.netVat' | translate }}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (report of dashboard()!.recentReports; track report.id) {
                    <tr class="hover:bg-neutral-50 dark:hover:bg-dark-elevated cursor-pointer" (click)="viewReport(report.id)">
                      <td class="font-medium">{{ formatPeriod(report.periodStart) }}</td>
                      <td class="text-sm text-neutral-600 dark:text-neutral-400">{{ getPeriodRange(report.periodStart, report.periodEnd) }}</td>
                      <td>
                        <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full" [class]="getStatusBadgeColor(report.status)">
                          {{ getStatusLabel(report.status) }}
                        </span>
                      </td>
                      <td class="text-sm" [class]="isOverdue(report) ? 'text-red-600 font-medium' : 'text-neutral-600 dark:text-neutral-400'">
                        {{ report.paymentDueDate | date:'mediumDate' }}
                        @if (isOverdue(report)) {
                          <span class="material-icons text-sm ml-1">warning</span>
                        }
                      </td>
                      <td class="text-right font-mono font-medium" [class]="report.isPayable ? 'text-red-600' : 'text-green-600'">
                        {{ report.isPayable ? '' : '-' }}{{ report.netVat | currency:'ZAR':'symbol':'1.2-2' }}
                      </td>
                      <td class="text-right">
                        <button class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300" [title]="'accounting.vat.dashboard.viewReport' | translate">
                          <span class="material-icons">chevron_right</span>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="p-12 text-center">
              <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">receipt_long</span>
              <p class="text-neutral-500 dark:text-neutral-400 mb-4">{{ 'accounting.vat.dashboard.noVatReturnsGenerated' | translate }}</p>
              <button (click)="generateNewReport()" class="sw-btn sw-btn-primary sw-btn-md">
                <span class="material-icons text-lg">add</span>
                {{ 'accounting.vat.dashboard.generateFirstReturn' | translate }}
              </button>
            </div>
          }
        </div>
      } @else {
        <!-- Error State -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">error_outline</span>
          <p class="text-neutral-500 dark:text-neutral-400 mb-4">{{ 'accounting.vat.dashboard.unableToLoad' | translate }}</p>
          <button (click)="loadDashboard()" class="sw-btn sw-btn-primary sw-btn-md">
            <span class="material-icons text-lg">refresh</span>
            {{ 'accounting.vat.dashboard.retry' | translate }}
          </button>
        </div>
      }
    </div>
  `
})
export class VatDashboardComponent implements OnInit {
  private readonly vatService = inject(VatService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);

  loading = signal(true);
  dashboard = signal<VatDashboardSummary | null>(null);

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.vatService.getDashboardSummary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.dashboard.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load VAT dashboard', err);
          this.loading.set(false);
        }
      });
  }

  generateNewReport(): void {
    this.router.navigate(['/accounting/vat/new']);
  }

  viewReport(reportId: string): void {
    this.router.navigate(['/accounting/vat', reportId]);
  }

  submitCurrentPeriod(): void {
    if (this.dashboard()?.currentPeriod) {
      this.router.navigate(['/accounting/vat', this.dashboard()!.currentPeriod!.id, 'submit']);
    }
  }

  getStatusLabel(status: ReportStatus): string {
    const statusKeyMap: { [key in ReportStatus]: string } = {
      'DRAFT': 'accounting.vat.status.draft',
      'PREVIEW': 'accounting.vat.status.preview',
      'GENERATED': 'accounting.vat.status.generated',
      'SUBMITTED': 'accounting.vat.status.submitted',
      'PAID': 'accounting.vat.status.paid',
      'AMENDED': 'accounting.vat.status.amended'
    };
    return this.translate.instant(statusKeyMap[status] || 'accounting.vat.status.unknown');
  }

  getStatusColor(status: ReportStatus): string {
    return VatService.getStatusColor(status);
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

  getDaysUntilDue(paymentDueDate: string): number {
    return VatService.getDaysUntilDue(paymentDueDate);
  }
}
