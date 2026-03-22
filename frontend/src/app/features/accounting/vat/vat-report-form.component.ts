import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { VatService, VatReportResponse, GenerateVatReportRequest, PreviewVatReportRequest } from '../../../core/services/vat.service';
import { SpinnerComponent } from '@shared/ui';

@Component({
  selector: 'app-vat-report-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
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
          <a routerLink="/accounting/vat" class="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300">
            <span class="material-icons">arrow_back</span>
          </a>
          <div>
            <h1 class="sw-page-title">{{ 'accounting.vat.form.pageTitle' | translate }}</h1>
            <p class="sw-page-description">{{ 'accounting.vat.form.pageDescription' | translate }}</p>
          </div>
        </div>
      </div>

      <!-- Period Selection -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border">
        <div class="p-4 border-b border-neutral-200 dark:border-dark-border">
          <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ 'accounting.vat.form.selectPeriod' | translate }}</h2>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.vat.form.choosePeriodDescription' | translate }}</p>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Quick Period Selection -->
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">{{ 'accounting.vat.form.quickSelect' | translate }}</label>
              <select [(ngModel)]="selectedQuickPeriod" (ngModelChange)="onQuickPeriodChange($event)"
                      class="sw-input w-full">
                <option value="">{{ 'accounting.vat.form.customPeriod' | translate }}</option>
                @for (period of availablePeriods; track period.value) {
                  <option [value]="period.value">{{ period.label }}</option>
                }
              </select>
            </div>

            <!-- Start Date -->
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">{{ 'accounting.vat.form.periodStart' | translate }}</label>
              <input type="date" [(ngModel)]="periodStart" [disabled]="!!selectedQuickPeriod()"
                     class="sw-input w-full">
            </div>

            <!-- End Date -->
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">{{ 'accounting.vat.form.periodEnd' | translate }}</label>
              <input type="date" [(ngModel)]="periodEnd" [disabled]="!!selectedQuickPeriod()"
                     class="sw-input w-full">
            </div>
          </div>

          <div class="mt-6 flex gap-3">
            <button (click)="preview()" [disabled]="!isValidPeriod() || loading()" class="sw-btn sw-btn-outline sw-btn-md">
              @if (loading() && !generating()) {
                <sw-spinner size="sm" />
              } @else {
                <span class="material-icons text-lg">preview</span>
              }
              {{ 'accounting.vat.form.previewReturn' | translate }}
            </button>
            <button (click)="generate()" [disabled]="!isValidPeriod() || loading()" class="sw-btn sw-btn-primary sw-btn-md">
              @if (generating()) {
                <sw-spinner size="sm" />
              } @else {
                <span class="material-icons text-lg">add_circle</span>
              }
              {{ 'accounting.vat.form.generateReturn' | translate }}
            </button>
          </div>
        </div>
      </div>

      <!-- Preview Result -->
      @if (previewResult()) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border">
          <div class="p-4 border-b border-neutral-200 dark:border-dark-border flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ 'accounting.vat.form.preview' | translate }}: {{ formatPeriod(previewResult()!.periodStart) }}</h2>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ getPeriodRange(previewResult()!.periodStart, previewResult()!.periodEnd) }}</p>
            </div>
            <span class="px-3 py-1 text-sm font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
              {{ 'accounting.vat.form.previewOnly' | translate }}
            </span>
          </div>

          <div class="p-6 space-y-6">
            <!-- Summary Cards -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="bg-neutral-50 dark:bg-dark-elevated rounded-lg p-4">
                <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.vat.form.totalSupplies' | translate }}</p>
                <p class="text-lg font-bold font-mono text-neutral-800 dark:text-neutral-200">
                  {{ previewResult()!.box4TotalSupplies | currency:'ZAR':'symbol':'1.2-2' }}
                </p>
              </div>
              <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p class="text-sm text-blue-600 dark:text-blue-400">{{ 'accounting.vat.form.outputVat' | translate }}</p>
                <p class="text-lg font-bold font-mono text-blue-700 dark:text-blue-300">
                  {{ previewResult()!.box1aOutputVat | currency:'ZAR':'symbol':'1.2-2' }}
                </p>
              </div>
              <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p class="text-sm text-green-600 dark:text-green-400">{{ 'accounting.vat.form.inputVat' | translate }}</p>
                <p class="text-lg font-bold font-mono text-green-700 dark:text-green-300">
                  {{ previewResult()!.box7TotalInputVat | currency:'ZAR':'symbol':'1.2-2' }}
                </p>
              </div>
              <div class="rounded-lg p-4"
                   [class]="previewResult()!.box16VatPayable > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'">
                <p class="text-sm" [class]="previewResult()!.box16VatPayable > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'">
                  {{ previewResult()!.box16VatPayable > 0 ? ('accounting.vat.form.vatPayable' | translate) : ('accounting.vat.form.vatRefundable' | translate) }}
                </p>
                <p class="text-lg font-bold font-mono" [class]="previewResult()!.box16VatPayable > 0 ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'">
                  {{ (previewResult()!.box16VatPayable > 0 ? previewResult()!.box16VatPayable : previewResult()!.box17VatRefundable) | currency:'ZAR':'symbol':'1.2-2' }}
                </p>
              </div>
            </div>

            <!-- Key Figures Table -->
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-neutral-200 dark:border-dark-border">
                    <th class="text-left py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400">{{ 'accounting.vat.form.description' | translate }}</th>
                    <th class="text-right py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400">{{ 'accounting.vat.form.amount' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="border-b border-neutral-100 dark:border-dark-border">
                    <td class="py-2 px-3">{{ 'accounting.vat.form.standardRatedSupplies' | translate }}</td>
                    <td class="py-2 px-3 text-right font-mono">{{ previewResult()!.box1StandardRatedSupplies | currency:'ZAR':'symbol':'1.2-2' }}</td>
                  </tr>
                  <tr class="border-b border-neutral-100 dark:border-dark-border">
                    <td class="py-2 px-3">{{ 'accounting.vat.form.zeroRatedSupplies' | translate }}</td>
                    <td class="py-2 px-3 text-right font-mono">{{ previewResult()!.box2ZeroRatedSupplies | currency:'ZAR':'symbol':'1.2-2' }}</td>
                  </tr>
                  <tr class="border-b border-neutral-100 dark:border-dark-border">
                    <td class="py-2 px-3">{{ 'accounting.vat.form.exemptSupplies' | translate }}</td>
                    <td class="py-2 px-3 text-right font-mono">{{ previewResult()!.box3ExemptSupplies | currency:'ZAR':'symbol':'1.2-2' }}</td>
                  </tr>
                  <tr class="border-b border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-elevated">
                    <td class="py-2 px-3 font-semibold">{{ 'accounting.vat.form.outputVatRate' | translate }}</td>
                    <td class="py-2 px-3 text-right font-mono font-semibold">{{ previewResult()!.box1aOutputVat | currency:'ZAR':'symbol':'1.2-2' }}</td>
                  </tr>
                  <tr class="border-b border-neutral-100 dark:border-dark-border">
                    <td class="py-2 px-3">{{ 'accounting.vat.form.inputVatCapital' | translate }}</td>
                    <td class="py-2 px-3 text-right font-mono">{{ previewResult()!.box5aInputVatCapital | currency:'ZAR':'symbol':'1.2-2' }}</td>
                  </tr>
                  <tr class="border-b border-neutral-100 dark:border-dark-border">
                    <td class="py-2 px-3">{{ 'accounting.vat.form.inputVatOther' | translate }}</td>
                    <td class="py-2 px-3 text-right font-mono">{{ previewResult()!.box6aInputVatOther | currency:'ZAR':'symbol':'1.2-2' }}</td>
                  </tr>
                  <tr class="border-b border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-elevated">
                    <td class="py-2 px-3 font-semibold">{{ 'accounting.vat.form.totalInputVat' | translate }}</td>
                    <td class="py-2 px-3 text-right font-mono font-semibold">{{ previewResult()!.box7TotalInputVat | currency:'ZAR':'symbol':'1.2-2' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Action Button -->
            <div class="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-dark-border">
              <button (click)="clearPreview()" class="sw-btn sw-btn-outline sw-btn-md">
                {{ 'accounting.vat.form.clearPreview' | translate }}
              </button>
              <button (click)="generate()" [disabled]="generating()" class="sw-btn sw-btn-primary sw-btn-md">
                @if (generating()) {
                  <sw-spinner size="sm" />
                } @else {
                  <span class="material-icons text-lg">add_circle</span>
                }
                {{ 'accounting.vat.form.generateThisReturn' | translate }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Help Section -->
      <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 class="font-semibold text-blue-800 dark:text-blue-200 mb-2">{{ 'accounting.vat.form.aboutVatReturns' | translate }}</h3>
        <ul class="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
          <li>{{ 'accounting.vat.form.helpDueDate' | translate }}</li>
          <li>{{ 'accounting.vat.form.helpVatRate' | translate }}</li>
          <li>{{ 'accounting.vat.form.helpZeroRated' | translate }}</li>
          <li>{{ 'accounting.vat.form.helpPreviewBased' | translate }}</li>
          <li>{{ 'accounting.vat.form.helpExport' | translate }}</li>
        </ul>
      </div>
    </div>
  `
})
export class VatReportFormComponent implements OnInit {
  private readonly vatService = inject(VatService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);

  loading = signal(false);
  generating = signal(false);
  previewResult = signal<VatReportResponse | null>(null);
  selectedQuickPeriod = signal('');
  periodStart = '';
  periodEnd = '';

  availablePeriods: { value: string; label: string; start: string; end: string }[] = [];

  ngOnInit(): void {
    this.generateAvailablePeriods();
  }

  generateAvailablePeriods(): void {
    const today = new Date();
    const periods: { value: string; label: string; start: string; end: string }[] = [];

    // Generate last 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth();

      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      const value = `${year}-${String(month + 1).padStart(2, '0')}`;
      const label = startDate.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long' });

      periods.push({
        value,
        label,
        start: this.formatDate(startDate),
        end: this.formatDate(endDate)
      });
    }

    this.availablePeriods = periods;

    // Default to previous month
    if (periods.length > 1) {
      this.selectedQuickPeriod.set(periods[1].value);
      this.onQuickPeriodChange(periods[1].value);
    }
  }

  onQuickPeriodChange(value: string): void {
    this.selectedQuickPeriod.set(value);
    if (value) {
      const period = this.availablePeriods.find(p => p.value === value);
      if (period) {
        this.periodStart = period.start;
        this.periodEnd = period.end;
      }
    }
    this.clearPreview();
  }

  isValidPeriod(): boolean {
    return !!this.periodStart && !!this.periodEnd && this.periodStart <= this.periodEnd;
  }

  preview(): void {
    if (!this.isValidPeriod()) return;

    this.loading.set(true);
    const request: PreviewVatReportRequest = {
      periodStart: this.periodStart,
      periodEnd: this.periodEnd
    };

    this.vatService.previewVatReport(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.previewResult.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to preview VAT report', err);
          this.loading.set(false);
        }
      });
  }

  generate(): void {
    if (!this.isValidPeriod()) return;

    this.generating.set(true);
    this.loading.set(true);
    const request: GenerateVatReportRequest = {
      periodStart: this.periodStart,
      periodEnd: this.periodEnd
    };

    this.vatService.generateVatReport(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.generating.set(false);
          this.loading.set(false);
          // Navigate to the generated report
          this.router.navigate(['/accounting/vat', data.id]);
        },
        error: (err) => {
          console.error('Failed to generate VAT report', err);
          this.generating.set(false);
          this.loading.set(false);
        }
      });
  }

  clearPreview(): void {
    this.previewResult.set(null);
  }

  formatPeriod(periodStart: string): string {
    return VatService.formatPeriod(periodStart);
  }

  getPeriodRange(periodStart: string, periodEnd: string): string {
    return VatService.getPeriodRange(periodStart, periodEnd);
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
