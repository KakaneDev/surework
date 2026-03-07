import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AccountingService, FiscalPeriod, FiscalPeriodStatus } from '../../../core/services/accounting.service';
import { SpinnerComponent, ToastService } from '@shared/ui';

@Component({
  selector: 'app-fiscal-periods',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslateModule,
    SpinnerComponent,
    DatePipe
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="sw-page-header">
        <div class="flex items-center gap-3">
          <a routerLink="/accounting" class="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300">
            <span class="material-icons">arrow_back</span>
          </a>
          <div>
            <h1 class="sw-page-title">{{ 'accounting.fiscalPeriods.title' | translate }}</h1>
            <p class="sw-page-description">{{ 'accounting.fiscalPeriods.description' | translate }}</p>
          </div>
        </div>
      </div>

      <!-- Year Selection & Generation -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
        <div class="flex flex-wrap items-end gap-4">
          <div>
            <label class="sw-label">{{ 'accounting.fiscalPeriods.fiscalYear' | translate }}</label>
            <select [(ngModel)]="selectedYear" (ngModelChange)="loadPeriods()" class="sw-input">
              @for (year of years; track year) {
                <option [ngValue]="year">{{ year }}</option>
              }
            </select>
          </div>
          <button (click)="generateYear()" [disabled]="generatingYear()" class="sw-btn sw-btn-outline sw-btn-md">
            @if (generatingYear()) {
              <span class="animate-spin mr-2">&#9696;</span>
            }
            <span class="material-icons text-lg">add</span>
            {{ 'accounting.fiscalPeriods.generateNewYear' | translate }}
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
          <button (click)="loadPeriods()" class="px-4 py-2 text-primary-500 hover:text-primary-600 font-medium">{{ 'common.retry' | translate }}</button>
        </div>
      } @else {
        <!-- Periods Table -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          <div class="p-4 border-b border-neutral-200 dark:border-dark-border">
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">
              {{ 'accounting.fiscalPeriods.yearHeader' | translate: { year: selectedYear, endYear: selectedYear + 1 } }}
            </h3>
          </div>
          @if (periods().length > 0) {
            <div class="overflow-x-auto">
              <table class="sw-table">
                <thead>
                  <tr>
                    <th>{{ 'accounting.fiscalPeriods.period' | translate }}</th>
                    <th>{{ 'accounting.fiscalPeriods.periodName' | translate }}</th>
                    <th>{{ 'accounting.fiscalPeriods.startDate' | translate }}</th>
                    <th>{{ 'accounting.fiscalPeriods.endDate' | translate }}</th>
                    <th>{{ 'accounting.fiscalPeriods.status' | translate }}</th>
                    <th>{{ 'accounting.fiscalPeriods.closedAt' | translate }}</th>
                    <th class="w-[150px]">{{ 'common.actions' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (period of periods(); track period.id) {
                    <tr [ngClass]="{'bg-primary-50 dark:bg-primary-900/20': isCurrentPeriod(period)}">
                      <td class="font-mono text-neutral-600 dark:text-neutral-400">
                        {{ period.periodNumber }}
                        @if (period.isYearEnd) {
                          <span class="ml-2 text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{{ 'accounting.fiscalPeriods.yearEnd' | translate }}</span>
                        }
                        @if (period.isAdjustmentPeriod) {
                          <span class="ml-2 text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">{{ 'accounting.fiscalPeriods.adjustment' | translate }}</span>
                        }
                      </td>
                      <td class="font-medium text-neutral-800 dark:text-neutral-200">{{ period.periodName }}</td>
                      <td class="text-neutral-600 dark:text-neutral-400">{{ period.startDate | date:'mediumDate' }}</td>
                      <td class="text-neutral-600 dark:text-neutral-400">{{ period.endDate | date:'mediumDate' }}</td>
                      <td>
                        <span class="inline-block px-3 py-1 rounded-full text-xs font-medium"
                              [style.background]="statusColorMap[period.status].background"
                              [style.color]="statusColorMap[period.status].color">
                          {{ statusLabelMap[period.status] }}
                        </span>
                      </td>
                      <td class="text-sm text-neutral-500 dark:text-neutral-400">
                        @if (period.closedAt) {
                          {{ period.closedAt | date:'short' }}
                        } @else {
                          -
                        }
                      </td>
                      <td>
                        <div class="flex items-center gap-1">
                          @switch (period.status) {
                            @case ('FUTURE') {
                              <button (click)="openPeriod(period)"
                                      [disabled]="!canOpen(period)"
                                      class="p-1.5 text-neutral-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                      [title]="'accounting.fiscalPeriods.actions.open' | translate">
                                <span class="material-icons text-lg">lock_open</span>
                              </button>
                            }
                            @case ('OPEN') {
                              <button (click)="closePeriod(period)"
                                      class="p-1.5 text-neutral-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded"
                                      [title]="'accounting.fiscalPeriods.actions.close' | translate">
                                <span class="material-icons text-lg">lock</span>
                              </button>
                            }
                            @case ('CLOSED') {
                              <button (click)="reopenPeriod(period)"
                                      class="p-1.5 text-neutral-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                      [title]="'accounting.fiscalPeriods.actions.reopen' | translate">
                                <span class="material-icons text-lg">lock_open</span>
                              </button>
                              <button (click)="lockPeriod(period)"
                                      class="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                      [title]="'accounting.fiscalPeriods.actions.lockPermanently' | translate">
                                <span class="material-icons text-lg">lock</span>
                              </button>
                            }
                            @case ('LOCKED') {
                              <span class="text-xs text-neutral-400 dark:text-neutral-500">{{ 'accounting.fiscalPeriods.permanentlyLocked' | translate }}</span>
                            }
                          }
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="p-12 text-center">
              <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">event_busy</span>
              <p class="text-neutral-500 dark:text-neutral-400 mb-4">{{ 'accounting.fiscalPeriods.noPeriodsFor' | translate: { year: selectedYear } }}</p>
              <button (click)="generateYear()" class="sw-btn sw-btn-primary sw-btn-md">
                {{ 'accounting.fiscalPeriods.generateYear' | translate: { year: selectedYear } }}
              </button>
            </div>
          }
        </div>

        <!-- Status Legend -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
          <h4 class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">{{ 'accounting.fiscalPeriods.statusLegendTitle' | translate }}</h4>
          <div class="flex flex-wrap gap-4">
            @for (status of statuses; track status) {
              <div class="flex items-center gap-2">
                <span class="inline-block w-3 h-3 rounded-full" [style.background]="statusColorMap[status].color"></span>
                <span class="text-sm text-neutral-600 dark:text-neutral-400">{{ 'accounting.fiscalPeriods.status.' + status | translate }}</span>
                <span class="text-xs text-neutral-400 dark:text-neutral-500">- {{ 'accounting.fiscalPeriods.statusDesc.' + status | translate }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Year End Actions -->
        @if (canPerformYearEnd()) {
          <div class="bg-amber-50 dark:bg-amber-900/20 rounded-xl shadow-card border border-amber-200 dark:border-amber-800 p-6">
            <div class="flex items-start gap-4">
              <span class="material-icons text-3xl text-amber-500">warning</span>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">{{ 'accounting.fiscalPeriods.yearEndClose.title' | translate }}</h3>
                <p class="text-amber-700 dark:text-amber-300 mb-4">
                  {{ 'accounting.fiscalPeriods.yearEndClose.description' | translate: { year: selectedYear } }}
                </p>
                <button (click)="performYearEndClose()" class="sw-btn sw-btn-md bg-amber-600 hover:bg-amber-700 text-white">
                  <span class="material-icons text-lg">gavel</span>
                  {{ 'accounting.fiscalPeriods.yearEndClose.perform' | translate }}
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
export class FiscalPeriodsComponent implements OnInit {
  private readonly accountingService = inject(AccountingService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly statuses: FiscalPeriodStatus[] = ['FUTURE', 'OPEN', 'CLOSED', 'LOCKED'];

  readonly statusColorMap: Record<FiscalPeriodStatus, { background: string; color: string }> = {
    FUTURE: { background: '#e3f2fd', color: '#1565c0' },
    OPEN: { background: '#e8f5e9', color: '#2e7d32' },
    CLOSED: { background: '#fff3e0', color: '#f57c00' },
    LOCKED: { background: '#eceff1', color: '#546e7a' }
  };

  get statusLabelMap(): Record<FiscalPeriodStatus, string> {
    return {
      FUTURE: this.translate.instant('accounting.fiscalPeriods.status.FUTURE'),
      OPEN: this.translate.instant('accounting.fiscalPeriods.status.OPEN'),
      CLOSED: this.translate.instant('accounting.fiscalPeriods.status.CLOSED'),
      LOCKED: this.translate.instant('accounting.fiscalPeriods.status.LOCKED')
    };
  }

  get statusDescriptions(): Record<FiscalPeriodStatus, string> {
    return {
      FUTURE: this.translate.instant('accounting.fiscalPeriods.statusDesc.FUTURE'),
      OPEN: this.translate.instant('accounting.fiscalPeriods.statusDesc.OPEN'),
      CLOSED: this.translate.instant('accounting.fiscalPeriods.statusDesc.CLOSED'),
      LOCKED: this.translate.instant('accounting.fiscalPeriods.statusDesc.LOCKED')
    };
  }

  periods = signal<FiscalPeriod[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  generatingYear = signal(false);

  selectedYear = new Date().getFullYear();
  years: number[] = [];

  ngOnInit(): void {
    // Generate years list (current - 3 to current + 2)
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 3; y <= currentYear + 2; y++) {
      this.years.push(y);
    }
    this.loadPeriods();
  }

  loadPeriods(): void {
    this.loading.set(true);
    this.error.set(null);

    this.accountingService.getFiscalPeriodsForYear(this.selectedYear).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (periods) => {
        this.periods.set(periods);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load fiscal periods', err);
        this.error.set(this.translate.instant('accounting.fiscalPeriods.loadError'));
        this.loading.set(false);
      }
    });
  }

  generateYear(): void {
    const prompt_msg = this.translate.instant('accounting.fiscalPeriods.generateYearPrompt');
    const year = parseInt(prompt(prompt_msg) || '', 10);
    if (isNaN(year) || year < 2000 || year > 2100) {
      this.toast.error(this.translate.instant('accounting.fiscalPeriods.invalidYearError'));
      return;
    }

    this.generatingYear.set(true);
    this.accountingService.generateFiscalYear(year).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success(this.translate.instant('accounting.fiscalPeriods.generateYearSuccess', { year }));
        this.selectedYear = year;
        if (!this.years.includes(year)) {
          this.years.push(year);
          this.years.sort();
        }
        this.loadPeriods();
        this.generatingYear.set(false);
      },
      error: (err) => {
        console.error('Failed to generate fiscal year', err);
        this.toast.error(this.translate.instant('accounting.fiscalPeriods.generateYearError'));
        this.generatingYear.set(false);
      }
    });
  }

  isCurrentPeriod(period: FiscalPeriod): boolean {
    const today = new Date().toISOString().split('T')[0];
    return period.startDate <= today && period.endDate >= today;
  }

  canOpen(period: FiscalPeriod): boolean {
    // Can only open if previous period is open or closed
    const periods = this.periods();
    const idx = periods.findIndex(p => p.id === period.id);
    if (idx === 0) return true;
    const prev = periods[idx - 1];
    return prev.status === 'OPEN' || prev.status === 'CLOSED' || prev.status === 'LOCKED';
  }

  openPeriod(period: FiscalPeriod): void {
    this.accountingService.openPeriod(period.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success(this.translate.instant('accounting.fiscalPeriods.periodOpenedSuccess', { name: period.periodName }));
        this.loadPeriods();
      },
      error: (err) => {
        console.error('Failed to open period', err);
        this.toast.error(this.translate.instant('accounting.fiscalPeriods.periodOpenedError'));
      }
    });
  }

  closePeriod(period: FiscalPeriod): void {
    const confirmMsg = this.translate.instant('accounting.fiscalPeriods.closeConfirm', { name: period.periodName });
    if (confirm(confirmMsg)) {
      this.accountingService.closePeriod(period.id).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: () => {
          this.toast.success(this.translate.instant('accounting.fiscalPeriods.periodClosedSuccess', { name: period.periodName }));
          this.loadPeriods();
        },
        error: (err) => {
          console.error('Failed to close period', err);
          this.toast.error(this.translate.instant('accounting.fiscalPeriods.periodClosedError'));
        }
      });
    }
  }

  reopenPeriod(period: FiscalPeriod): void {
    this.accountingService.reopenPeriod(period.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success(this.translate.instant('accounting.fiscalPeriods.periodReopenedSuccess', { name: period.periodName }));
        this.loadPeriods();
      },
      error: (err) => {
        console.error('Failed to reopen period', err);
        this.toast.error(this.translate.instant('accounting.fiscalPeriods.periodReopenedError'));
      }
    });
  }

  lockPeriod(period: FiscalPeriod): void {
    const confirmMsg = this.translate.instant('accounting.fiscalPeriods.lockConfirm', { name: period.periodName });
    if (confirm(confirmMsg)) {
      this.accountingService.lockPeriod(period.id).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: () => {
          this.toast.success(this.translate.instant('accounting.fiscalPeriods.periodLockedSuccess', { name: period.periodName }));
          this.loadPeriods();
        },
        error: (err) => {
          console.error('Failed to lock period', err);
          this.toast.error(this.translate.instant('accounting.fiscalPeriods.periodLockedError'));
        }
      });
    }
  }

  canPerformYearEnd(): boolean {
    const periods = this.periods();
    if (periods.length === 0) return false;
    return periods.every(p => p.status === 'CLOSED' || p.status === 'LOCKED');
  }

  performYearEndClose(): void {
    const confirmMsg = this.translate.instant('accounting.fiscalPeriods.yearEndClose.confirm', { year: this.selectedYear });
    if (confirm(confirmMsg)) {
      this.accountingService.performYearEndClose(this.selectedYear).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: () => {
          this.toast.success(this.translate.instant('accounting.fiscalPeriods.yearEndClose.success'));
          this.loadPeriods();
        },
        error: (err) => {
          console.error('Failed to perform year-end close', err);
          this.toast.error(this.translate.instant('accounting.fiscalPeriods.yearEndClose.error'));
        }
      });
    }
  }
}
