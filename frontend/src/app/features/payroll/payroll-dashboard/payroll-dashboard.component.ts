import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  PayrollService,
  PayrollDashboard,
  PayrollRunSummary,
  PayrollRunStatus
} from '../../../core/services/payroll.service';
import { CreateRunDialogComponent } from '../dialogs/create-run-dialog.component';
import { SpinnerComponent, BadgeComponent, DialogService, ToastService } from '@shared/ui';

@Component({
  selector: 'app-payroll-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    SpinnerComponent,
    BadgeComponent,
    DatePipe,
    CurrencyPipe
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="sw-page-header">
        <div class="flex items-center gap-3">
          <span class="material-icons text-3xl text-primary-500">payments</span>
          <div>
            <h1 class="sw-page-title">{{ 'payroll.title' | translate }}</h1>
            <p class="sw-page-description">{{ 'payroll.subtitle' | translate }}</p>
          </div>
        </div>
        <div class="flex gap-3">
          <a routerLink="/payroll/runs" class="sw-btn sw-btn-outline sw-btn-md">
            <span class="material-icons text-lg">list</span>
            {{ 'payroll.allRuns' | translate }}
          </a>
          <button (click)="openCreateRunDialog()" class="sw-btn sw-btn-primary sw-btn-md">
            <span class="material-icons text-lg">add</span>
            {{ 'payroll.createRun' | translate }}
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center items-center py-24">
          <sw-spinner size="lg" />
        </div>
      } @else if (error()) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <span class="material-icons text-5xl text-error-500 mb-4">error</span>
          <p class="text-neutral-600 dark:text-neutral-400 mb-4">{{ error() }}</p>
          <button (click)="loadDashboard()" class="px-4 py-2 text-primary-500 hover:text-primary-600 font-medium">{{ 'common.retry' | translate }}</button>
        </div>
      } @else {
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <span class="material-icons text-white text-2xl">assignment</span>
              </div>
              <div>
                @if (dashboard()?.currentRun) {
                  <span class="inline-block px-3 py-1 rounded-full text-sm font-medium mb-1"
                        [style.background]="statusColorMap[dashboard()!.currentRun!.status].background"
                        [style.color]="statusColorMap[dashboard()!.currentRun!.status].color">
                    {{ statusLabelMap[dashboard()!.currentRun!.status] || dashboard()!.currentRun!.status }}
                  </span>
                  <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ monthNames[dashboard()!.currentRun!.periodMonth - 1] }} {{ dashboard()!.currentRun!.periodYear }}</p>
                } @else {
                  <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">-</p>
                  <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'payroll.noCurrentRun' | translate }}</p>
                }
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                <span class="material-icons text-white text-2xl">people</span>
              </div>
              <div>
                <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{{ dashboard()?.employeesOnPayroll || 0 }}</p>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'payroll.employeesOnPayroll' | translate }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <span class="material-icons text-white text-2xl">event</span>
              </div>
              <div>
                @if (dashboard()?.nextPaymentDate) {
                  <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{{ dashboard()!.nextPaymentDate | date:'d MMM' }}</p>
                } @else {
                  <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">-</p>
                }
                <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'payroll.nextPayment' | translate }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                <span class="material-icons text-white text-2xl">account_balance</span>
              </div>
              <div>
                <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{{ formatCompact(dashboard()?.ytdTotalNet || 0) }}</p>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'payroll.ytd.netPaid' | translate }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- YTD Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border border-l-4 border-l-blue-500 p-5">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-2">{{ 'payroll.ytd.grossPay' | translate }}</p>
            <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{{ dashboard()?.ytdTotalGross || 0 | currency:'ZAR':'symbol':'1.0-0' }}</p>
          </div>
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border border-l-4 border-l-orange-500 p-5">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-2">{{ 'payroll.ytd.payeDeducted' | translate }}</p>
            <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{{ dashboard()?.ytdTotalPaye || 0 | currency:'ZAR':'symbol':'1.0-0' }}</p>
          </div>
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border border-l-4 border-l-green-500 p-5">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-2">{{ 'payroll.ytd.netPay' | translate }}</p>
            <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{{ dashboard()?.ytdTotalNet || 0 | currency:'ZAR':'symbol':'1.0-0' }}</p>
          </div>
        </div>

        <!-- Recent Payroll Runs -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          <div class="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-dark-border">
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ 'payroll.recentRuns' | translate }}</h3>
            <a routerLink="/payroll/runs" class="text-primary-500 hover:text-primary-600 text-sm font-medium">{{ 'payroll.viewAll' | translate }}</a>
          </div>
          @if (dashboard()?.recentRuns?.length) {
            <div class="overflow-x-auto">
              <table class="sw-table">
                <thead>
                  <tr>
                    <th>{{ 'payroll.table.period' | translate }}</th>
                    <th>{{ 'payroll.table.paymentDate' | translate }}</th>
                    <th>{{ 'payroll.table.employees' | translate }}</th>
                    <th>{{ 'payroll.table.netPay' | translate }}</th>
                    <th>{{ 'payroll.table.status' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (run of dashboard()!.recentRuns; track run.id) {
                    <tr class="cursor-pointer hover:bg-neutral-50 dark:hover:bg-dark-elevated" [routerLink]="['/payroll/runs', run.id]">
                      <td>
                        <a [routerLink]="['/payroll/runs', run.id]" class="text-primary-500 hover:text-primary-600 font-medium">
                          {{ monthNames[run.periodMonth - 1] }} {{ run.periodYear }}
                        </a>
                      </td>
                      <td class="text-neutral-600 dark:text-neutral-400">{{ run.paymentDate | date:'mediumDate' }}</td>
                      <td>{{ run.employeeCount }}</td>
                      <td class="font-medium">{{ run.totalNet | currency:'ZAR':'symbol':'1.0-0' }}</td>
                      <td>
                        <span class="inline-block px-3 py-1 rounded-full text-xs font-medium"
                              [style.background]="statusColorMap[run.status].background"
                              [style.color]="statusColorMap[run.status].color">
                          {{ statusLabelMap[run.status] || run.status }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="p-12 text-center">
              <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">payments</span>
              <p class="text-neutral-500 dark:text-neutral-400 mb-4">{{ 'payroll.noRuns' | translate }}</p>
              <button (click)="openCreateRunDialog()" class="sw-btn sw-btn-primary sw-btn-md">
                {{ 'payroll.createFirstRun' | translate }}
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PayrollDashboardComponent implements OnInit {
  private readonly payrollService = inject(PayrollService);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  // Lookup maps for template (avoids function calls on every CD cycle)
  readonly statusLabelMap: Record<PayrollRunStatus, string> = {
    DRAFT: 'Draft',
    PROCESSING: 'Processing',
    PENDING_APPROVAL: 'Pending Approval',
    APPROVED: 'Approved',
    PAID: 'Paid',
    CANCELLED: 'Cancelled'
  };

  readonly statusColorMap: Record<PayrollRunStatus, { background: string; color: string }> = {
    DRAFT: { background: '#fff3e0', color: '#f57c00' },
    PROCESSING: { background: '#e3f2fd', color: '#1565c0' },
    PENDING_APPROVAL: { background: '#fff8e1', color: '#ff8f00' },
    APPROVED: { background: '#e8f5e9', color: '#2e7d32' },
    PAID: { background: '#c8e6c9', color: '#1b5e20' },
    CANCELLED: { background: '#ffcdd2', color: '#b71c1c' }
  };

  readonly monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  dashboard = signal<PayrollDashboard | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  runColumns = ['period', 'paymentDate', 'employees', 'netPay', 'status'];

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    this.payrollService.getDashboard().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load payroll dashboard', err);
        this.error.set('Failed to load payroll dashboard. Please try again.');
        this.loading.set(false);
      }
    });
  }

  openCreateRunDialog(): void {
    const dialogRef = this.dialog.open(CreateRunDialogComponent, {
      width: '450px'
    });

    dialogRef.afterClosed().then((result) => {
      if (result) {
        this.toast.success('Payroll run created successfully');
        this.loadDashboard();
      }
    });
  }

  getStatusLabel(status: PayrollRunStatus): string {
    return PayrollService.getRunStatusLabel(status);
  }

  getStatusColor(status: PayrollRunStatus): { background: string; color: string } {
    return PayrollService.getRunStatusColor(status);
  }

  getPeriodLabel(year: number, month: number): string {
    return PayrollService.getPeriodLabel(year, month);
  }

  formatCompact(amount: number): string {
    if (amount >= 1000000) {
      return `R${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `R${(amount / 1000).toFixed(0)}K`;
    }
    return `R${amount.toFixed(0)}`;
  }
}
