import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import {
  PayrollService,
  PayrollRun,
  PayrollRunStatus,
  PayslipSummary,
  PayslipStatus
} from '../../../core/services/payroll.service';
import { PayslipDetailDialogComponent } from '../dialogs/payslip-detail-dialog.component';
import { SpinnerComponent, ButtonComponent, IconButtonComponent, DropdownComponent, DropdownItemComponent, ToastService, DialogService } from '@shared/ui';

@Component({
  selector: 'app-payroll-run-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    TranslateModule,
    DatePipe,
    CurrencyPipe,
    SpinnerComponent,
    ButtonComponent,
    IconButtonComponent,
    DropdownComponent,
    DropdownItemComponent
  ],
  template: `
    <div class="space-y-6">
      @if (loadingRun()) {
        <div class="flex justify-center items-center py-24">
          <sw-spinner size="lg" />
        </div>
      } @else if (errorRun()) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <span class="material-icons text-5xl text-error-500 mb-4">error</span>
          <p class="text-neutral-600 dark:text-neutral-400 mb-4">{{ errorRun() }}</p>
          <a routerLink="/payroll/runs" class="px-4 py-2 text-primary-500 hover:text-primary-600 font-medium">
            {{ 'payroll.runDetail.backToRuns' | translate }}
          </a>
        </div>
      } @else if (run()) {
        <!-- Header -->
        <div class="sw-page-header">
          <div class="flex items-center gap-3">
            <a routerLink="/payroll/runs" class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors" [attr.aria-label]="'common.back' | translate">
              <span class="material-icons" aria-hidden="true">arrow_back</span>
            </a>
            <span class="material-icons text-3xl text-primary-500">payments</span>
            <div class="flex items-center gap-3">
              <h1 class="sw-page-title">{{ getPeriodLabel(run()!.periodYear, run()!.periodMonth) }} {{ 'payroll.label' | translate }}</h1>
              <span class="inline-block px-3 py-1 rounded-full text-xs font-medium"
                    [style.background]="getStatusColor(run()!.status).background"
                    [style.color]="getStatusColor(run()!.status).color">
                {{ getStatusLabel(run()!.status) }}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            @switch (run()!.status) {
              @case ('DRAFT') {
                <sw-button variant="primary" [loading]="processing()" [disabled]="processing()" (clicked)="processRun()">
                  <span class="material-icons text-lg">play_arrow</span>
                  {{ 'payroll.runDetail.processPayroll' | translate }}
                </sw-button>
              }
              @case ('PENDING_APPROVAL') {
                <sw-button variant="primary" [loading]="processing()" [disabled]="processing()" (clicked)="approveRun()">
                  <span class="material-icons text-lg">check</span>
                  {{ 'payroll.runDetail.approve' | translate }}
                </sw-button>
              }
              @case ('APPROVED') {
                <sw-button variant="primary" [loading]="processing()" [disabled]="processing()" (clicked)="markAsPaid()" class="!bg-success-500 hover:!bg-success-600">
                  <span class="material-icons text-lg">paid</span>
                  {{ 'payroll.runDetail.markAsPaid' | translate }}
                </sw-button>
              }
            }
            @if (run()!.status !== 'PAID' && run()!.status !== 'CANCELLED') {
              <sw-dropdown position="bottom-end">
                <button trigger class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated" [attr.aria-label]="'common.moreOptions' | translate">
                  <span class="material-icons">more_vert</span>
                </button>
                <sw-dropdown-item icon="cancel" (click)="cancelRun()" class="text-error-600">{{ 'payroll.runDetail.cancelRun' | translate }}</sw-dropdown-item>
              </sw-dropdown>
            }
          </div>
        </div>

        <!-- Run Info -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            <div class="flex flex-col gap-1">
              <span class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{{ 'payroll.runDetail.paymentDate' | translate }}</span>
              <span class="text-base font-medium text-neutral-800 dark:text-neutral-200">{{ run()!.paymentDate | date:'fullDate' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{{ 'payroll.runDetail.employees' | translate }}</span>
              <span class="text-base font-medium text-neutral-800 dark:text-neutral-200">{{ run()!.employeeCount }}</span>
            </div>
            @if (run()!.processedAt) {
              <div class="flex flex-col gap-1">
                <span class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{{ 'payroll.runDetail.processed' | translate }}</span>
                <span class="text-base font-medium text-neutral-800 dark:text-neutral-200">{{ run()!.processedAt | date:'medium' }}</span>
              </div>
            }
            @if (run()!.approvedAt) {
              <div class="flex flex-col gap-1">
                <span class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{{ 'payroll.runDetail.approved' | translate }}</span>
                <span class="text-base font-medium text-neutral-800 dark:text-neutral-200">{{ run()!.approvedAt | date:'medium' }}</span>
              </div>
            }
            @if (run()!.paidAt) {
              <div class="flex flex-col gap-1">
                <span class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{{ 'payroll.runDetail.paid' | translate }}</span>
                <span class="text-base font-medium text-neutral-800 dark:text-neutral-200">{{ run()!.paidAt | date:'medium' }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-5">
            <div class="flex items-center gap-4">
              <div class="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/20">
                <span class="material-icons text-2xl text-primary-500">trending_up</span>
              </div>
              <div class="flex flex-col">
                <span class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'payroll.summary.grossPay' | translate }}</span>
                <span class="text-xl font-semibold text-neutral-800 dark:text-neutral-200">{{ run()!.totalGross | currency:'ZAR':'symbol':'1.0-0' }}</span>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-5">
            <div class="flex items-center gap-4">
              <div class="p-3 rounded-lg bg-warning-100 dark:bg-warning-900/20">
                <span class="material-icons text-2xl text-warning-500">receipt</span>
              </div>
              <div class="flex flex-col">
                <span class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'payroll.summary.paye' | translate }}</span>
                <span class="text-xl font-semibold text-neutral-800 dark:text-neutral-200">{{ run()!.totalPaye | currency:'ZAR':'symbol':'1.0-0' }}</span>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-5">
            <div class="flex items-center gap-4">
              <div class="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <span class="material-icons text-2xl text-purple-500">security</span>
              </div>
              <div class="flex flex-col">
                <span class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'payroll.summary.uif' | translate }}</span>
                <span class="text-xl font-semibold text-neutral-800 dark:text-neutral-200">{{ (run()!.totalUifEmployee + run()!.totalUifEmployer) | currency:'ZAR':'symbol':'1.0-0' }}</span>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-5">
            <div class="flex items-center gap-4">
              <div class="p-3 rounded-lg bg-success-100 dark:bg-success-900/20">
                <span class="material-icons text-2xl text-success-500">account_balance_wallet</span>
              </div>
              <div class="flex flex-col">
                <span class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'payroll.summary.netPay' | translate }}</span>
                <span class="text-xl font-semibold text-success-600 dark:text-success-400">{{ run()!.totalNet | currency:'ZAR':'symbol':'1.0-0' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Payslips Table -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-dark-border">
            <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200">{{ 'payroll.runDetail.payslips' | translate: {count: totalPayslips()} }}</h2>
            <div class="relative">
              <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">search</span>
              <input
                type="text"
                [formControl]="searchControl"
                [placeholder]="'payroll.runDetail.searchPlaceholder' | translate"
                class="sw-input pl-10 w-64"
              />
            </div>
          </div>

          @if (loadingPayslips()) {
            <div class="flex justify-center items-center py-16">
              <sw-spinner size="md" />
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="sw-table">
                <thead>
                  <tr>
                    <th>{{ 'payroll.runDetail.table.employee' | translate }}</th>
                    <th>{{ 'payroll.runDetail.table.gross' | translate }}</th>
                    <th>{{ 'payroll.runDetail.table.deductions' | translate }}</th>
                    <th>{{ 'payroll.runDetail.table.netPay' | translate }}</th>
                    <th>{{ 'payroll.runDetail.table.status' | translate }}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (payslip of payslips(); track payslip.id) {
                    <tr class="cursor-pointer hover:bg-neutral-50 dark:hover:bg-dark-elevated" (click)="viewPayslip(payslip)">
                      <td>
                        <div class="flex flex-col">
                          <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ payslip.employeeName }}</span>
                          <span class="text-xs text-neutral-500 dark:text-neutral-400">{{ payslip.employeeNumber }}</span>
                        </div>
                      </td>
                      <td class="text-neutral-600 dark:text-neutral-400">{{ payslip.grossPay | currency:'ZAR':'symbol':'1.0-0' }}</td>
                      <td class="text-neutral-600 dark:text-neutral-400">{{ payslip.totalDeductions | currency:'ZAR':'symbol':'1.0-0' }}</td>
                      <td class="font-semibold text-success-600 dark:text-success-400">{{ payslip.netPay | currency:'ZAR':'symbol':'1.0-0' }}</td>
                      <td>
                        <span class="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                              [style.background]="getPayslipStatusColor(payslip.status).background"
                              [style.color]="getPayslipStatusColor(payslip.status).color">
                          {{ getPayslipStatusLabel(payslip.status) }}
                        </span>
                      </td>
                      <td (click)="$event.stopPropagation()">
                        <sw-icon-button variant="ghost" (clicked)="viewPayslip(payslip)" [attr.aria-label]="'payroll.runDetail.viewDetails' | translate">
                          <span class="material-icons">visibility</span>
                        </sw-icon-button>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="6" class="text-center py-12">
                        <span class="material-icons text-3xl text-neutral-300 dark:text-neutral-600 mb-2">receipt_long</span>
                        <p class="text-neutral-500 dark:text-neutral-400">{{ 'payroll.runDetail.noPayslipsFound' | translate }}</p>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <div class="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-dark-border">
              <div class="text-sm text-neutral-500 dark:text-neutral-400">
                {{ 'common.pagination.showingRange' | translate: {start: (pageIndex() * pageSize()) + 1, end: Math.min((pageIndex() + 1) * pageSize(), totalPayslips()), total: totalPayslips()} }}
              </div>
              <div class="flex items-center gap-2">
                <sw-icon-button variant="ghost" [disabled]="pageIndex() === 0" (clicked)="goToPage(0)" [attr.aria-label]="'common.pagination.firstPage' | translate">
                  <span class="material-icons">first_page</span>
                </sw-icon-button>
                <sw-icon-button variant="ghost" [disabled]="pageIndex() === 0" (clicked)="goToPage(pageIndex() - 1)" [attr.aria-label]="'common.pagination.previousPage' | translate">
                  <span class="material-icons">chevron_left</span>
                </sw-icon-button>
                <span class="px-3 text-sm text-neutral-600 dark:text-neutral-400">
                  {{ 'common.pagination.pageOf' | translate: {current: pageIndex() + 1, total: Math.ceil(totalPayslips() / pageSize()) || 1} }}
                </span>
                <sw-icon-button variant="ghost" [disabled]="(pageIndex() + 1) * pageSize() >= totalPayslips()" (clicked)="goToPage(pageIndex() + 1)" [attr.aria-label]="'common.pagination.nextPage' | translate">
                  <span class="material-icons">chevron_right</span>
                </sw-icon-button>
                <sw-icon-button variant="ghost" [disabled]="(pageIndex() + 1) * pageSize() >= totalPayslips()" (clicked)="goToPage(Math.ceil(totalPayslips() / pageSize()) - 1)" [attr.aria-label]="'common.pagination.lastPage' | translate">
                  <span class="material-icons">last_page</span>
                </sw-icon-button>
              </div>
            </div>
          }
        </div>

        <!-- Notes -->
        @if (run()!.notes) {
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
            <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-3">{{ 'payroll.runDetail.notes' | translate }}</h2>
            <p class="text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">{{ run()!.notes }}</p>
          </div>
        }
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PayrollRunDetailComponent implements OnInit, OnDestroy {
  private readonly payrollService = inject(PayrollService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();

  // Expose Math for template use
  Math = Math;

  run = signal<PayrollRun | null>(null);
  loadingRun = signal(true);
  errorRun = signal<string | null>(null);
  processing = signal(false);

  payslips = signal<PayslipSummary[]>([]);
  loadingPayslips = signal(true);
  totalPayslips = signal(0);
  pageIndex = signal(0);
  pageSize = signal(20);

  payslipColumns = ['employee', 'grossPay', 'deductions', 'netPay', 'status', 'actions'];

  searchControl = new FormControl('');

  private runId: string = '';

  ngOnInit(): void {
    this.runId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.runId) {
      this.errorRun.set('Invalid payroll run ID');
      this.loadingRun.set(false);
      return;
    }

    this.loadRun();
    this.loadPayslips();

    // React to search changes
    this.searchControl.valueChanges.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe(() => {
      this.pageIndex.set(0);
      this.loadPayslips();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRun(): void {
    this.loadingRun.set(true);
    this.errorRun.set(null);

    this.payrollService.getPayrollRun(this.runId).subscribe({
      next: (run) => {
        this.run.set(run);
        this.loadingRun.set(false);
      },
      error: (err) => {
        console.error('Failed to load payroll run', err);
        this.errorRun.set('Failed to load payroll run. Please try again.');
        this.loadingRun.set(false);
      }
    });
  }

  loadPayslips(): void {
    this.loadingPayslips.set(true);

    this.payrollService.getPayslipsForRun(
      this.runId,
      this.pageIndex(),
      this.pageSize(),
      this.searchControl.value || undefined
    ).subscribe({
      next: (response) => {
        this.payslips.set(response.content);
        this.totalPayslips.set(response.totalElements);
        this.loadingPayslips.set(false);
      },
      error: (err) => {
        console.error('Failed to load payslips', err);
        this.loadingPayslips.set(false);
      }
    });
  }

  goToPage(page: number): void {
    if (page < 0 || page * this.pageSize() >= this.totalPayslips()) return;
    this.pageIndex.set(page);
    this.loadPayslips();
  }

  processRun(): void {
    this.processing.set(true);

    this.payrollService.processPayrollRun(this.runId).subscribe({
      next: (run) => {
        this.run.set(run);
        this.processing.set(false);
        this.toast.success('Payroll processed successfully');
        this.loadPayslips();
      },
      error: (err) => {
        console.error('Failed to process payroll', err);
        this.processing.set(false);
        this.toast.error('Failed to process payroll');
      }
    });
  }

  approveRun(): void {
    this.processing.set(true);

    this.payrollService.approvePayrollRun(this.runId).subscribe({
      next: (run) => {
        this.run.set(run);
        this.processing.set(false);
        this.toast.success('Payroll approved');
        this.loadPayslips();
      },
      error: (err) => {
        console.error('Failed to approve payroll', err);
        this.processing.set(false);
        this.toast.error('Failed to approve payroll');
      }
    });
  }

  markAsPaid(): void {
    this.processing.set(true);

    this.payrollService.markPayrollRunAsPaid(this.runId).subscribe({
      next: (run) => {
        this.run.set(run);
        this.processing.set(false);
        this.toast.success('Payroll marked as paid');
        this.loadPayslips();
      },
      error: (err) => {
        console.error('Failed to mark as paid', err);
        this.processing.set(false);
        this.toast.error('Failed to mark payroll as paid');
      }
    });
  }

  cancelRun(): void {
    const reason = prompt('Enter cancellation reason:');
    if (!reason) return;

    this.processing.set(true);

    this.payrollService.cancelPayrollRun(this.runId, reason).subscribe({
      next: (run) => {
        this.run.set(run);
        this.processing.set(false);
        this.toast.success('Payroll run cancelled');
      },
      error: (err) => {
        console.error('Failed to cancel payroll run', err);
        this.processing.set(false);
        this.toast.error('Failed to cancel payroll run');
      }
    });
  }

  viewPayslip(payslip: PayslipSummary): void {
    this.dialog.open(PayslipDetailDialogComponent, {
      data: { payslipId: payslip.id }
    });
  }

  getStatusLabel(status: PayrollRunStatus): string {
    return PayrollService.getRunStatusLabel(status);
  }

  getStatusColor(status: PayrollRunStatus): { background: string; color: string } {
    return PayrollService.getRunStatusColor(status);
  }

  getPayslipStatusLabel(status: PayslipStatus): string {
    return PayrollService.getPayslipStatusLabel(status);
  }

  getPayslipStatusColor(status: PayslipStatus): { background: string; color: string } {
    return PayrollService.getPayslipStatusColor(status);
  }

  getPeriodLabel(year: number, month: number): string {
    return PayrollService.getPeriodLabel(year, month);
  }
}
