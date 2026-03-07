import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PayrollService, Payslip, PayslipStatus } from '../../../core/services/payroll.service';
import { SpinnerComponent, ButtonComponent, DialogRef } from '@shared/ui';

export interface PayslipDetailDialogData {
  payslipId: string;
}

@Component({
  selector: 'app-payslip-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    SpinnerComponent,
    ButtonComponent,
    CurrencyPipe
  ],
  template: `
    <div class="p-6 min-w-[450px] max-w-[550px]">
      <h2 class="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
        <span class="material-icons text-primary-500">receipt_long</span>
        {{ 'payroll.payslipDialog.title' | translate }}
      </h2>

      @if (loading()) {
        <div class="flex justify-center items-center py-12">
          <sw-spinner size="lg" />
        </div>
      } @else if (error()) {
        <div class="flex flex-col items-center justify-center py-12 text-error-500">
          <span class="material-icons text-5xl mb-4">error</span>
          <p>{{ error() }}</p>
        </div>
      } @else if (payslip()) {
        <div class="space-y-4">
          <!-- Employee Header -->
          <div class="flex justify-between items-center pb-4 border-b border-neutral-200 dark:border-dark-border">
            <div>
              <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200">{{ payslip()!.employeeName }}</h3>
              <span class="text-sm text-neutral-500">{{ payslip()!.employeeNumber }}</span>
            </div>
            <span class="px-3 py-1 rounded-full text-xs font-medium"
                  [style.background]="getStatusColor(payslip()!.status).background"
                  [style.color]="getStatusColor(payslip()!.status).color">
              {{ getStatusLabel(payslip()!.status) }}
            </span>
          </div>

          <!-- Earnings Section -->
          <div class="pb-4 border-b border-neutral-200 dark:border-dark-border">
            <h4 class="flex items-center gap-2 text-sm font-semibold uppercase text-success-600 mb-3">
              <span class="material-icons text-lg">arrow_upward</span>
              {{ 'payroll.payslipDialog.earnings' | translate }}
            </h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-neutral-500 dark:text-neutral-400">{{ 'payroll.payslipDialog.basicSalary' | translate }}</span>
                <span class="text-neutral-700 dark:text-neutral-300">{{ payslip()!.basicSalary | currency:'ZAR':'symbol':'1.2-2' }}</span>
              </div>
              @if ((payslip()!.overtime ?? 0) > 0) {
                <div class="flex justify-between">
                  <span class="text-neutral-500 dark:text-neutral-400">{{ 'payroll.payslipDialog.overtime' | translate }}</span>
                  <span class="text-neutral-700 dark:text-neutral-300">{{ payslip()!.overtime ?? 0 | currency:'ZAR':'symbol':'1.2-2' }}</span>
                </div>
              }
              @if ((payslip()!.bonuses ?? 0) > 0) {
                <div class="flex justify-between">
                  <span class="text-neutral-500 dark:text-neutral-400">{{ 'payroll.payslipDialog.bonuses' | translate }}</span>
                  <span class="text-neutral-700 dark:text-neutral-300">{{ payslip()!.bonuses ?? 0 | currency:'ZAR':'symbol':'1.2-2' }}</span>
                </div>
              }
              @if ((payslip()!.commission ?? 0) > 0) {
                <div class="flex justify-between">
                  <span class="text-neutral-500 dark:text-neutral-400">{{ 'payroll.payslipDialog.commission' | translate }}</span>
                  <span class="text-neutral-700 dark:text-neutral-300">{{ payslip()!.commission ?? 0 | currency:'ZAR':'symbol':'1.2-2' }}</span>
                </div>
              }
              @if ((payslip()!.allowances ?? 0) > 0) {
                <div class="flex justify-between">
                  <span class="text-neutral-500 dark:text-neutral-400">{{ 'payroll.payslipDialog.allowances' | translate }}</span>
                  <span class="text-neutral-700 dark:text-neutral-300">{{ payslip()!.allowances ?? 0 | currency:'ZAR':'symbol':'1.2-2' }}</span>
                </div>
              }
              <div class="flex justify-between pt-2 mt-2 border-t border-dashed border-neutral-200 dark:border-dark-border font-semibold text-success-600">
                <span>{{ 'payroll.payslipDialog.grossPay' | translate }}</span>
                <span>{{ payslip()!.grossEarnings | currency:'ZAR':'symbol':'1.2-2' }}</span>
              </div>
            </div>
          </div>

          <!-- Deductions Section -->
          <div class="pb-4 border-b border-neutral-200 dark:border-dark-border">
            <h4 class="flex items-center gap-2 text-sm font-semibold uppercase text-error-600 mb-3">
              <span class="material-icons text-lg">arrow_downward</span>
              {{ 'payroll.payslipDialog.deductions' | translate }}
            </h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-neutral-500 dark:text-neutral-400">{{ 'payroll.payslipDialog.paye' | translate }}</span>
                <span class="text-neutral-700 dark:text-neutral-300">{{ payslip()!.paye | currency:'ZAR':'symbol':'1.2-2' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-500 dark:text-neutral-400">{{ 'payroll.payslipDialog.uif' | translate }}</span>
                <span class="text-neutral-700 dark:text-neutral-300">{{ (payslip()!.uifEmployee ?? payslip()!.uif ?? 0) | currency:'ZAR':'symbol':'1.2-2' }}</span>
              </div>
              @if ((payslip()!.pensionFund ?? payslip()!.pension ?? 0) > 0) {
                <div class="flex justify-between">
                  <span class="text-neutral-500 dark:text-neutral-400">{{ 'payroll.payslipDialog.pensionFund' | translate }}</span>
                  <span class="text-neutral-700 dark:text-neutral-300">{{ (payslip()!.pensionFund ?? payslip()!.pension ?? 0) | currency:'ZAR':'symbol':'1.2-2' }}</span>
                </div>
              }
              @if (payslip()!.medicalAid > 0) {
                <div class="flex justify-between">
                  <span class="text-neutral-500 dark:text-neutral-400">{{ 'payroll.payslipDialog.medicalAid' | translate }}</span>
                  <span class="text-neutral-700 dark:text-neutral-300">{{ payslip()!.medicalAid | currency:'ZAR':'symbol':'1.2-2' }}</span>
                </div>
              }
              @if (payslip()!.otherDeductions > 0) {
                <div class="flex justify-between">
                  <span class="text-neutral-500 dark:text-neutral-400">{{ 'payroll.payslipDialog.otherDeductions' | translate }}</span>
                  <span class="text-neutral-700 dark:text-neutral-300">{{ payslip()!.otherDeductions | currency:'ZAR':'symbol':'1.2-2' }}</span>
                </div>
              }
              <div class="flex justify-between pt-2 mt-2 border-t border-dashed border-neutral-200 dark:border-dark-border font-semibold text-error-600">
                <span>{{ 'payroll.payslipDialog.totalDeductions' | translate }}</span>
                <span>{{ payslip()!.totalDeductions | currency:'ZAR':'symbol':'1.2-2' }}</span>
              </div>
            </div>
          </div>

          <!-- Net Pay -->
          <div class="flex justify-between p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg font-semibold text-lg text-primary-600 dark:text-primary-400">
            <span>{{ 'payroll.payslipDialog.netPay' | translate }}</span>
            <span>{{ payslip()!.netPay | currency:'ZAR':'symbol':'1.2-2' }}</span>
          </div>

          <!-- Employer Contributions -->
          @if ((payslip()!.employerUif ?? payslip()!.uifEmployer ?? 0) > 0 || (payslip()!.employerPension ?? 0) > 0) {
            <div class="pt-4 border-t border-neutral-200 dark:border-dark-border">
              <h4 class="flex items-center gap-2 text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-3">
                <span class="material-icons text-lg">business</span>
                {{ 'payroll.payslipDialog.employerContributions' | translate }}
              </h4>
              <div class="space-y-2 text-sm text-neutral-500 dark:text-neutral-400">
                @if ((payslip()!.employerUif ?? payslip()!.uifEmployer ?? 0) > 0) {
                  <div class="flex justify-between">
                    <span>{{ 'payroll.payslipDialog.employerUif' | translate }}</span>
                    <span>{{ (payslip()!.employerUif ?? payslip()!.uifEmployer ?? 0) | currency:'ZAR':'symbol':'1.2-2' }}</span>
                  </div>
                }
                @if ((payslip()!.employerPension ?? 0) > 0) {
                  <div class="flex justify-between">
                    <span>{{ 'payroll.payslipDialog.employerPension' | translate }}</span>
                    <span>{{ payslip()!.employerPension ?? 0 | currency:'ZAR':'symbol':'1.2-2' }}</span>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-dark-border">
        <sw-button variant="ghost" size="md" (clicked)="cancel()">
          {{ 'common.close' | translate }}
        </sw-button>
        @if (payslip() && (payslip()!.status === 'APPROVED' || payslip()!.status === 'PAID')) {
          <sw-button variant="primary" size="md" [loading]="downloading()" (clicked)="downloadPdf()">
            <span class="material-icons text-lg" aria-hidden="true">download</span>
            {{ 'payroll.payslipDialog.downloadPdf' | translate }}
          </sw-button>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PayslipDetailDialogComponent implements OnInit {
  private readonly payrollService = inject(PayrollService);
  private readonly dialogRef: DialogRef = inject('DIALOG_REF' as any);
  private readonly data = inject<PayslipDetailDialogData>('DIALOG_DATA' as any);
  private readonly translate = inject(TranslateService);

  cancel(): void {
    this.dialogRef.close();
  }

  payslip = signal<Payslip | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  downloading = signal(false);

  ngOnInit(): void {
    this.loadPayslip();
  }

  private loadPayslip(): void {
    this.loading.set(true);
    this.error.set(null);

    this.payrollService.getPayslip(this.data.payslipId).subscribe({
      next: (payslip) => {
        this.payslip.set(payslip);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load payslip', err);
        this.error.set(this.translate.instant('payroll.payslipDialog.loadError'));
        this.loading.set(false);
      }
    });
  }

  downloadPdf(): void {
    if (!this.payslip()) return;

    this.downloading.set(true);

    this.payrollService.downloadPayslipPdf(this.data.payslipId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `payslip-${this.payslip()!.employeeNumber}-${Date.now()}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.downloading.set(false);
      },
      error: (err) => {
        console.error('Failed to download PDF', err);
        const errorMsg = this.translate.instant('payroll.payslipDialog.downloadError');
        console.error(errorMsg);
        this.downloading.set(false);
      }
    });
  }

  getStatusLabel(status: PayslipStatus): string {
    return PayrollService.getPayslipStatusLabel(status);
  }

  getStatusColor(status: PayslipStatus): { background: string; color: string } {
    return PayrollService.getPayslipStatusColor(status);
  }
}
