import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { timeout, catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  PayrollService,
  PayslipSummary,
  Payslip
} from '@core/services/payroll.service';
import { selectCurrentUser } from '@core/store/auth/auth.selectors';
import { SpinnerComponent, BadgeComponent, ButtonComponent, IconButtonComponent, ToastService } from '@shared/ui';

@Component({
  selector: 'app-my-payslips',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    SpinnerComponent,
    BadgeComponent,
    ButtonComponent,
    IconButtonComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="sw-page-header">
        <div class="flex items-center gap-3">
          <span class="material-icons text-3xl text-primary-500">receipt_long</span>
          <div>
            <h1 class="sw-page-title">{{ 'payroll.myPayslips.title' | translate }}</h1>
            <p class="sw-page-description">{{ 'payroll.myPayslips.description' | translate }}</p>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-16 gap-4">
          <sw-spinner size="lg" />
          <p class="text-neutral-500 dark:text-neutral-400">{{ 'payroll.myPayslips.loading' | translate }}</p>
        </div>
      } @else {
        <!-- Payslips List -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          @if (payslips().length === 0) {
            <div class="flex flex-col items-center py-16">
              <span class="material-icons text-6xl text-neutral-300 dark:text-neutral-600 mb-4">receipt_long</span>
              <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">{{ 'payroll.myPayslips.emptyState.title' | translate }}</h2>
              <p class="text-neutral-500 dark:text-neutral-400">{{ 'payroll.myPayslips.emptyState.message' | translate }}</p>
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="sw-table">
                <thead>
                  <tr>
                    <th>{{ 'payroll.myPayslips.table.period' | translate }}</th>
                    <th class="text-right">{{ 'payroll.myPayslips.table.grossPay' | translate }}</th>
                    <th class="text-right">{{ 'payroll.myPayslips.table.deductions' | translate }}</th>
                    <th class="text-right">{{ 'payroll.myPayslips.table.netPay' | translate }}</th>
                    <th>{{ 'payroll.myPayslips.table.status' | translate }}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (payslip of payslips(); track payslip.id) {
                    <tr class="hover:bg-neutral-50 dark:hover:bg-dark-elevated">
                      <td>
                        <div class="flex items-center gap-2">
                          <span class="material-icons text-lg text-primary-500">calendar_month</span>
                          <span class="font-medium">{{ getPayslipPeriod(payslip) }}</span>
                        </div>
                      </td>
                      <td class="text-right font-medium">{{ formatCurrency(payslip.grossEarnings) }}</td>
                      <td class="text-right text-error-600 dark:text-error-400">-{{ formatCurrency(payslip.totalDeductions) }}</td>
                      <td class="text-right font-semibold text-success-600 dark:text-success-400">{{ formatCurrency(payslip.netPay) }}</td>
                      <td>
                        <sw-badge [variant]="statusVariantMap[payslip.status] || 'neutral'">
                          {{ 'payroll.myPayslips.status.' + payslip.status | translate }}
                        </sw-badge>
                      </td>
                      <td>
                        <div class="flex items-center gap-2 justify-end">
                          <sw-icon-button variant="ghost" (clicked)="viewPayslip(payslip)" [ariaLabel]="'payroll.myPayslips.actions.viewDetails' | translate">
                            <span class="material-icons text-neutral-600 dark:text-neutral-400">visibility</span>
                          </sw-icon-button>
                          <sw-icon-button variant="ghost" [loading]="downloading() === payslip.id" [disabled]="downloading() === payslip.id" (clicked)="downloadPayslip(payslip)" [ariaLabel]="'payroll.myPayslips.actions.downloadPdf' | translate">
                            <span class="material-icons text-primary-500">download</span>
                          </sw-icon-button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <div class="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-dark-border">
              <div class="text-sm text-neutral-500 dark:text-neutral-400">
                {{ 'payroll.myPayslips.pagination.showing' | translate: { from: (pageIndex() * pageSize) + 1, to: Math.min((pageIndex() + 1) * pageSize, totalElements()), total: totalElements() } }}
              </div>
              <div class="flex items-center gap-2">
                <sw-icon-button variant="ghost" [disabled]="pageIndex() === 0" (clicked)="goToPage(0)" [ariaLabel]="'payroll.myPayslips.pagination.firstPage' | translate">
                  <span class="material-icons">first_page</span>
                </sw-icon-button>
                <sw-icon-button variant="ghost" [disabled]="pageIndex() === 0" (clicked)="goToPage(pageIndex() - 1)" [ariaLabel]="'payroll.myPayslips.pagination.previousPage' | translate">
                  <span class="material-icons">chevron_left</span>
                </sw-icon-button>
                <span class="px-3 text-sm text-neutral-600 dark:text-neutral-400">
                  {{ 'payroll.myPayslips.pagination.pageOf' | translate: { current: pageIndex() + 1, total: Math.ceil(totalElements() / pageSize) || 1 } }}
                </span>
                <sw-icon-button variant="ghost" [disabled]="(pageIndex() + 1) * pageSize >= totalElements()" (clicked)="goToPage(pageIndex() + 1)" [ariaLabel]="'payroll.myPayslips.pagination.nextPage' | translate">
                  <span class="material-icons">chevron_right</span>
                </sw-icon-button>
                <sw-icon-button variant="ghost" [disabled]="(pageIndex() + 1) * pageSize >= totalElements()" (clicked)="goToPage(Math.ceil(totalElements() / pageSize) - 1)" [ariaLabel]="'payroll.myPayslips.pagination.lastPage' | translate">
                  <span class="material-icons">last_page</span>
                </sw-icon-button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Payslip Detail Modal -->
      @if (selectedPayslip()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="closeDetail()">
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-dark-border">
              <h2 class="text-xl font-semibold text-neutral-800 dark:text-neutral-200">{{ 'payroll.myPayslips.detail.title' | translate }}</h2>
              <sw-icon-button variant="ghost" (clicked)="closeDetail()" [ariaLabel]="'common.close' | translate">
                <span class="material-icons">close</span>
              </sw-icon-button>
            </div>

            @if (loadingDetail()) {
              <div class="flex items-center justify-center py-12">
                <sw-spinner size="lg" />
              </div>
            } @else if (payslipDetail()) {
              <div class="p-6 space-y-6">
                <!-- Header Info -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'payroll.myPayslips.detail.employee' | translate }}</p>
                    <p class="font-medium text-neutral-800 dark:text-neutral-200">{{ payslipDetail()!.employeeName }}</p>
                    <p class="text-sm text-neutral-500">{{ payslipDetail()!.employeeNumber }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'payroll.myPayslips.table.status' | translate }}</p>
                    <sw-badge [variant]="statusVariantMap[payslipDetail()!.status] || 'neutral'">
                      {{ 'payroll.myPayslips.status.' + payslipDetail()!.status | translate }}
                    </sw-badge>
                  </div>
                </div>

                <!-- Earnings -->
                <div>
                  <h3 class="font-semibold text-neutral-800 dark:text-neutral-200 mb-3 flex items-center gap-2">
                    <span class="material-icons text-success-500">add_circle</span>
                    {{ 'payroll.myPayslips.detail.earnings' | translate }}
                  </h3>
                  <div class="space-y-2 bg-success-50 dark:bg-success-900/20 rounded-lg p-4">
                    <div class="flex justify-between">
                      <span class="text-neutral-600 dark:text-neutral-400">{{ 'payroll.myPayslips.detail.basicSalary' | translate }}</span>
                      <span class="font-medium">{{ formatCurrency(payslipDetail()!.basicSalary) }}</span>
                    </div>
                    @if ((payslipDetail()!.overtime ?? 0) > 0) {
                      <div class="flex justify-between">
                        <span class="text-neutral-600 dark:text-neutral-400">{{ 'payroll.myPayslips.detail.overtime' | translate }}</span>
                        <span class="font-medium">{{ formatCurrency(payslipDetail()!.overtime ?? 0) }}</span>
                      </div>
                    }
                    @if ((payslipDetail()!.bonuses ?? 0) > 0) {
                      <div class="flex justify-between">
                        <span class="text-neutral-600 dark:text-neutral-400">{{ 'payroll.myPayslips.detail.bonuses' | translate }}</span>
                        <span class="font-medium">{{ formatCurrency(payslipDetail()!.bonuses ?? 0) }}</span>
                      </div>
                    }
                    @if ((payslipDetail()!.commission ?? 0) > 0) {
                      <div class="flex justify-between">
                        <span class="text-neutral-600 dark:text-neutral-400">{{ 'payroll.myPayslips.detail.commission' | translate }}</span>
                        <span class="font-medium">{{ formatCurrency(payslipDetail()!.commission ?? 0) }}</span>
                      </div>
                    }
                    @if ((payslipDetail()!.allowances ?? 0) > 0) {
                      <div class="flex justify-between">
                        <span class="text-neutral-600 dark:text-neutral-400">{{ 'payroll.myPayslips.detail.allowances' | translate }}</span>
                        <span class="font-medium">{{ formatCurrency(payslipDetail()!.allowances ?? 0) }}</span>
                      </div>
                    }
                    <div class="flex justify-between pt-2 border-t border-success-200 dark:border-success-800 font-semibold">
                      <span>{{ 'payroll.myPayslips.table.grossPay' | translate }}</span>
                      <span class="text-success-600 dark:text-success-400">{{ formatCurrency(payslipDetail()!.grossEarnings) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Deductions -->
                <div>
                  <h3 class="font-semibold text-neutral-800 dark:text-neutral-200 mb-3 flex items-center gap-2">
                    <span class="material-icons text-error-500">remove_circle</span>
                    {{ 'payroll.myPayslips.detail.deductionsTitle' | translate }}
                  </h3>
                  <div class="space-y-2 bg-error-50 dark:bg-error-900/20 rounded-lg p-4">
                    <div class="flex justify-between">
                      <span class="text-neutral-600 dark:text-neutral-400">{{ 'payroll.myPayslips.detail.paye' | translate }}</span>
                      <span class="font-medium">{{ formatCurrency(payslipDetail()!.paye) }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-neutral-600 dark:text-neutral-400">{{ 'payroll.myPayslips.detail.uif' | translate }}</span>
                      <span class="font-medium">{{ formatCurrency(payslipDetail()!.uifEmployee || payslipDetail()!.uif || 0) }}</span>
                    </div>
                    @if ((payslipDetail()!.pensionFund || payslipDetail()!.pension || 0) > 0) {
                      <div class="flex justify-between">
                        <span class="text-neutral-600 dark:text-neutral-400">{{ 'payroll.myPayslips.detail.pension' | translate }}</span>
                        <span class="font-medium">{{ formatCurrency(payslipDetail()!.pensionFund || payslipDetail()!.pension || 0) }}</span>
                      </div>
                    }
                    @if (payslipDetail()!.medicalAid > 0) {
                      <div class="flex justify-between">
                        <span class="text-neutral-600 dark:text-neutral-400">{{ 'payroll.myPayslips.detail.medicalAid' | translate }}</span>
                        <span class="font-medium">{{ formatCurrency(payslipDetail()!.medicalAid) }}</span>
                      </div>
                    }
                    @if (payslipDetail()!.otherDeductions > 0) {
                      <div class="flex justify-between">
                        <span class="text-neutral-600 dark:text-neutral-400">{{ 'payroll.myPayslips.detail.otherDeductions' | translate }}</span>
                        <span class="font-medium">{{ formatCurrency(payslipDetail()!.otherDeductions) }}</span>
                      </div>
                    }
                    <div class="flex justify-between pt-2 border-t border-error-200 dark:border-error-800 font-semibold">
                      <span>{{ 'payroll.myPayslips.detail.totalDeductions' | translate }}</span>
                      <span class="text-error-600 dark:text-error-400">{{ formatCurrency(payslipDetail()!.totalDeductions) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Net Pay -->
                <div class="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
                  <div class="flex justify-between items-center">
                    <span class="text-lg font-semibold text-neutral-800 dark:text-neutral-200">{{ 'payroll.myPayslips.table.netPay' | translate }}</span>
                    <span class="text-2xl font-bold text-primary-600 dark:text-primary-400">{{ formatCurrency(payslipDetail()!.netPay) }}</span>
                  </div>
                </div>
              </div>

              <div class="flex justify-end gap-3 p-6 border-t border-neutral-200 dark:border-dark-border">
                <sw-button variant="ghost" (clicked)="closeDetail()">{{ 'common.close' | translate }}</sw-button>
                <sw-button variant="primary" [loading]="downloading() === payslipDetail()!.id" [disabled]="downloading() === payslipDetail()!.id" (clicked)="downloadPayslipFromDetail()">
                  <span class="material-icons text-lg">download</span>
                  {{ 'payroll.myPayslips.actions.downloadPdf' | translate }}
                </sw-button>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class MyPayslipsComponent implements OnInit {
  private readonly payrollService = inject(PayrollService);
  private readonly toast = inject(ToastService);
  private readonly store = inject(Store);
  private readonly translate = inject(TranslateService);

  // Expose Math for template
  Math = Math;

  // Lookup map for status variants (avoids function calls on every CD cycle)
  readonly statusVariantMap: Record<string, 'neutral' | 'success' | 'warning' | 'error'> = {
    PAID: 'success',
    APPROVED: 'success',
    CALCULATED: 'warning',
    DRAFT: 'neutral',
    EXCLUDED: 'error',
    VOID: 'error'
  };

  // Auth state from store
  readonly currentUser = toSignal(this.store.select(selectCurrentUser));

  // Component state
  payslips = signal<PayslipSummary[]>([]);
  loading = signal(true);
  totalElements = signal(0);
  pageIndex = signal(0);
  pageSize = 12;

  // Detail modal state
  selectedPayslip = signal<PayslipSummary | null>(null);
  payslipDetail = signal<Payslip | null>(null);
  loadingDetail = signal(false);

  // Download state
  downloading = signal<string | null>(null);

  ngOnInit(): void {
    this.loadPayslips();
  }

  loadPayslips(): void {
    this.loading.set(true);

    this.payrollService.getMyPayslips(this.pageIndex(), this.pageSize).pipe(
      timeout(30000),
      catchError(err => {
        console.error('[MyPayslips] Error loading payslips:', err);
        this.toast.error(this.translate.instant('payroll.myPayslips.errors.loadFailed'));
        return of({ content: [], totalElements: 0, page: 0, size: this.pageSize, totalPages: 0, first: true, last: true });
      }),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (response) => {
        this.payslips.set(response.content);
        this.totalElements.set(response.totalElements);
      }
    });
  }

  viewPayslip(payslip: PayslipSummary): void {
    this.selectedPayslip.set(payslip);
    this.loadingDetail.set(true);
    this.payslipDetail.set(null);

    this.payrollService.getMyPayslip(payslip.id).pipe(
      timeout(30000),
      catchError(err => {
        console.error('[MyPayslips] Error loading payslip detail:', err);
        this.toast.error(this.translate.instant('payroll.myPayslips.errors.loadDetailFailed'));
        this.selectedPayslip.set(null);
        return of(null);
      }),
      finalize(() => this.loadingDetail.set(false))
    ).subscribe({
      next: (detail) => {
        if (detail) {
          this.payslipDetail.set(detail);
        }
      }
    });
  }

  closeDetail(): void {
    this.selectedPayslip.set(null);
    this.payslipDetail.set(null);
  }

  downloadPayslip(payslip: PayslipSummary): void {
    this.downloading.set(payslip.id);

    this.payrollService.downloadMyPayslip(payslip.id).pipe(
      timeout(60000),
      catchError(err => {
        console.error('[MyPayslips] Error downloading payslip:', err);
        this.toast.error(this.translate.instant('payroll.myPayslips.errors.downloadFailed'));
        return of(null);
      }),
      finalize(() => this.downloading.set(null))
    ).subscribe({
      next: (blob) => {
        if (blob) {
          this.triggerDownload(blob, `payslip-${this.getPayslipPeriod(payslip).replace(/\s/g, '-')}.pdf`);
          this.toast.success(this.translate.instant('payroll.myPayslips.success.downloaded'));
        }
      }
    });
  }

  downloadPayslipFromDetail(): void {
    const detail = this.payslipDetail();
    if (!detail) return;

    this.downloading.set(detail.id);

    this.payrollService.downloadMyPayslip(detail.id).pipe(
      timeout(60000),
      catchError(err => {
        console.error('[MyPayslips] Error downloading payslip:', err);
        this.toast.error(this.translate.instant('payroll.myPayslips.errors.downloadFailed'));
        return of(null);
      }),
      finalize(() => this.downloading.set(null))
    ).subscribe({
      next: (blob) => {
        if (blob) {
          this.triggerDownload(blob, `payslip-${detail.employeeNumber}.pdf`);
          this.toast.success(this.translate.instant('payroll.myPayslips.success.downloaded'));
        }
      }
    });
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  goToPage(page: number): void {
    if (page < 0 || page * this.pageSize >= this.totalElements()) return;
    this.pageIndex.set(page);
    this.loadPayslips();
  }

  getPayslipPeriod(payslip: PayslipSummary): string {
    // Parse period from payslipNumber format: "PS-YYYY-MM-###"
    if (payslip.payslipNumber) {
      const match = payslip.payslipNumber.match(/PS-(\d{4})-(\d{2})/);
      if (match) {
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        return PayrollService.getPeriodLabel(year, month);
      }
    }
    return payslip.payslipNumber || 'Payslip';
  }

  formatCurrency(amount: number): string {
    return PayrollService.formatCurrency(amount);
  }

  getStatusVariant(status: string): 'neutral' | 'success' | 'warning' | 'error' {
    switch (status) {
      case 'PAID': return 'success';
      case 'APPROVED': return 'success';
      case 'CALCULATED': return 'warning';
      case 'DRAFT': return 'neutral';
      case 'EXCLUDED':
      case 'VOID': return 'error';
      default: return 'neutral';
    }
  }
}
