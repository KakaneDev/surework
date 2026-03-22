import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import {
  PayrollService,
  PayrollRunSummary,
  PayrollRunStatus
} from '../../../core/services/payroll.service';
import { CreateRunDialogComponent } from '../dialogs/create-run-dialog.component';
import { SpinnerComponent, ButtonComponent, IconButtonComponent, ToastService, DialogService } from '@shared/ui';

@Component({
  selector: 'app-payroll-run-list',
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
    IconButtonComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="sw-page-header">
        <div class="flex items-center gap-3">
          <a routerLink="/payroll" class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors" [attr.aria-label]="'common.back' | translate">
            <span class="material-icons" aria-hidden="true">arrow_back</span>
          </a>
          <span class="material-icons text-3xl text-primary-500">payments</span>
          <div>
            <h1 class="sw-page-title">{{ 'payroll.runs' | translate }}</h1>
            <p class="sw-page-description">{{ 'payroll.runList.subtitle' | translate }}</p>
          </div>
        </div>
        <sw-button variant="primary" (clicked)="openCreateRunDialog()">
          <span class="material-icons text-lg">add</span>
          {{ 'payroll.createRun' | translate }}
        </sw-button>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
        <div class="flex items-center gap-4 flex-wrap">
          <div class="flex flex-col gap-1">
            <label class="sw-label">{{ 'common.status' | translate }}</label>
            <select [formControl]="statusFilter" class="sw-input w-40">
              <option [ngValue]="null">{{ 'common.all' | translate }}</option>
              <option value="DRAFT">{{ 'payroll.status.draft' | translate }}</option>
              <option value="PROCESSING">{{ 'payroll.status.processing' | translate }}</option>
              <option value="PENDING_APPROVAL">{{ 'payroll.status.pendingApproval' | translate }}</option>
              <option value="APPROVED">{{ 'payroll.status.approved' | translate }}</option>
              <option value="PAID">{{ 'payroll.status.paid' | translate }}</option>
              <option value="CANCELLED">{{ 'payroll.status.cancelled' | translate }}</option>
            </select>
          </div>

          <div class="flex flex-col gap-1">
            <label class="sw-label">{{ 'payroll.runList.year' | translate }}</label>
            <select [formControl]="yearFilter" class="sw-input w-32">
              <option [ngValue]="null">{{ 'payroll.runList.allYears' | translate }}</option>
              @for (year of years; track year) {
                <option [value]="year">{{ year }}</option>
              }
            </select>
          </div>

          <div class="flex flex-col gap-1">
            <label class="sw-label">{{ 'payroll.runList.month' | translate }}</label>
            <select [formControl]="monthFilter" class="sw-input w-40">
              <option [ngValue]="null">{{ 'payroll.runList.allMonths' | translate }}</option>
              @for (month of months; track month.value) {
                <option [value]="month.value">{{ month.label }}</option>
              }
            </select>
          </div>

          <sw-button variant="ghost" size="sm" [disabled]="!hasFilters()" (clicked)="clearFilters()" class="self-end">
            <span class="material-icons text-lg">clear</span>
            {{ 'common.clearFilters' | translate }}
          </sw-button>
        </div>
      </div>

      <!-- Content -->
      @if (loading()) {
        <div class="flex justify-center items-center py-24">
          <sw-spinner size="lg" />
        </div>
      } @else if (error()) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <span class="material-icons text-5xl text-error-500 mb-4">error</span>
          <p class="text-neutral-600 dark:text-neutral-400 mb-4">{{ error() }}</p>
          <sw-button variant="link" (clicked)="loadRuns()">{{ 'common.retry' | translate }}</sw-button>
        </div>
      } @else if (runs().length === 0) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">payments</span>
          <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">{{ 'payroll.runList.noRunsFound' | translate }}</h3>
          @if (hasFilters()) {
            <p class="text-neutral-500 dark:text-neutral-400 mb-4">{{ 'payroll.runList.adjustFilters' | translate }}</p>
            <sw-button variant="link" (clicked)="clearFilters()">{{ 'common.clearFilters' | translate }}</sw-button>
          } @else {
            <p class="text-neutral-500 dark:text-neutral-400 mb-4">{{ 'payroll.runList.getStarted' | translate }}</p>
            <sw-button variant="primary" (clicked)="openCreateRunDialog()">{{ 'payroll.createRun' | translate }}</sw-button>
          }
        </div>
      } @else {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          <div class="overflow-x-auto">
            <table class="sw-table">
              <thead>
                <tr>
                  <th>{{ 'payroll.table.period' | translate }}</th>
                  <th>{{ 'payroll.table.paymentDate' | translate }}</th>
                  <th>{{ 'payroll.table.employees' | translate }}</th>
                  <th>{{ 'payroll.table.netPay' | translate }}</th>
                  <th>{{ 'payroll.table.status' | translate }}</th>
                  <th>{{ 'payroll.runList.created' | translate }}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (run of runs(); track run.id) {
                  <tr class="cursor-pointer hover:bg-neutral-50 dark:hover:bg-dark-elevated" [routerLink]="['/payroll/runs', run.id]">
                    <td>
                      <a [routerLink]="['/payroll/runs', run.id]" class="text-primary-500 hover:text-primary-600 font-medium">
                        {{ getPeriodLabel(run.periodYear, run.periodMonth) }}
                      </a>
                    </td>
                    <td class="text-neutral-600 dark:text-neutral-400">{{ run.paymentDate | date:'mediumDate' }}</td>
                    <td class="font-medium">{{ run.employeeCount }}</td>
                    <td class="font-medium">{{ run.totalNet | currency:'ZAR':'symbol':'1.0-0' }}</td>
                    <td>
                      <span class="inline-block px-3 py-1 rounded-full text-xs font-medium"
                            [style.background]="getStatusColor(run.status).background"
                            [style.color]="getStatusColor(run.status).color">
                        {{ getStatusLabel(run.status) }}
                      </span>
                    </td>
                    <td class="text-neutral-600 dark:text-neutral-400">{{ run.createdAt | date:'mediumDate' }}</td>
                    <td (click)="$event.stopPropagation()">
                      <a [routerLink]="['/payroll/runs', run.id]" class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated inline-flex items-center justify-center" title="View Details">
                        <span class="material-icons">visibility</span>
                      </a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-dark-border">
            <div class="text-sm text-neutral-500 dark:text-neutral-400">
              {{ 'common.pagination.showing' | translate }} {{ (pageIndex() * pageSize()) + 1 }} {{ 'common.pagination.to' | translate }} {{ Math.min((pageIndex() + 1) * pageSize(), totalElements()) }} {{ 'common.pagination.of' | translate }} {{ totalElements() }}
            </div>
            <div class="flex items-center gap-2">
              <sw-icon-button variant="ghost" [disabled]="pageIndex() === 0" (clicked)="goToPage(0)" [ariaLabel]="'payroll.runList.pagination.firstPage' | translate">
                <span class="material-icons">first_page</span>
              </sw-icon-button>
              <sw-icon-button variant="ghost" [disabled]="pageIndex() === 0" (clicked)="goToPage(pageIndex() - 1)" [ariaLabel]="'payroll.runList.pagination.previousPage' | translate">
                <span class="material-icons">chevron_left</span>
              </sw-icon-button>
              <span class="px-3 text-sm text-neutral-600 dark:text-neutral-400">
                {{ 'common.pagination.page' | translate }} {{ pageIndex() + 1 }} {{ 'common.pagination.of' | translate }} {{ Math.ceil(totalElements() / pageSize()) || 1 }}
              </span>
              <sw-icon-button variant="ghost" [disabled]="(pageIndex() + 1) * pageSize() >= totalElements()" (clicked)="goToPage(pageIndex() + 1)" [ariaLabel]="'payroll.runList.pagination.nextPage' | translate">
                <span class="material-icons">chevron_right</span>
              </sw-icon-button>
              <sw-icon-button variant="ghost" [disabled]="(pageIndex() + 1) * pageSize() >= totalElements()" (clicked)="goToPage(Math.ceil(totalElements() / pageSize()) - 1)" [ariaLabel]="'payroll.runList.pagination.lastPage' | translate">
                <span class="material-icons">last_page</span>
              </sw-icon-button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PayrollRunListComponent implements OnInit, OnDestroy {
  private readonly payrollService = inject(PayrollService);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();

  // Expose Math for template use
  Math = Math;

  runs = signal<PayrollRunSummary[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  totalElements = signal(0);
  pageIndex = signal(0);
  pageSize = signal(10);

  displayedColumns = ['period', 'paymentDate', 'employees', 'netPay', 'status', 'createdAt', 'actions'];

  currentYear = new Date().getFullYear();
  years = [this.currentYear - 2, this.currentYear - 1, this.currentYear, this.currentYear + 1];

  months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  statusFilter = new FormControl<PayrollRunStatus | null>(null);
  yearFilter = new FormControl<number | null>(null);
  monthFilter = new FormControl<number | null>(null);

  ngOnInit(): void {
    this.loadRuns();

    // React to filter changes
    this.statusFilter.valueChanges.pipe(debounceTime(100), takeUntil(this.destroy$)).subscribe(() => {
      this.pageIndex.set(0);
      this.loadRuns();
    });

    this.yearFilter.valueChanges.pipe(debounceTime(100), takeUntil(this.destroy$)).subscribe(() => {
      this.pageIndex.set(0);
      this.loadRuns();
    });

    this.monthFilter.valueChanges.pipe(debounceTime(100), takeUntil(this.destroy$)).subscribe(() => {
      this.pageIndex.set(0);
      this.loadRuns();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRuns(): void {
    this.loading.set(true);
    this.error.set(null);

    this.payrollService.searchPayrollRuns(
      this.pageIndex(),
      this.pageSize(),
      this.statusFilter.value ?? undefined,
      this.yearFilter.value ?? undefined,
      this.monthFilter.value ?? undefined
    ).subscribe({
      next: (response) => {
        this.runs.set(response.content);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load payroll runs', err);
        this.error.set('Failed to load payroll runs. Please try again.');
        this.loading.set(false);
      }
    });
  }

  goToPage(page: number): void {
    if (page < 0 || page * this.pageSize() >= this.totalElements()) return;
    this.pageIndex.set(page);
    this.loadRuns();
  }

  hasFilters(): boolean {
    return this.statusFilter.value !== null || this.yearFilter.value !== null || this.monthFilter.value !== null;
  }

  clearFilters(): void {
    this.statusFilter.setValue(null);
    this.yearFilter.setValue(null);
    this.monthFilter.setValue(null);
  }

  openCreateRunDialog(): void {
    const dialogRef = this.dialog.open(CreateRunDialogComponent, {});

    dialogRef.afterClosed().then((result) => {
      if (result) {
        this.toast.success('Payroll run created successfully');
        this.loadRuns();
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
}
