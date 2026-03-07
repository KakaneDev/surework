import { Component, inject, OnInit, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { debounceTime } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import {
  LeaveService,
  LeaveBalance,
  LeaveSummary,
  AdjustmentRequest
} from '@core/services/leave.service';
import { selectCanApproveLeave } from '@core/store/auth/auth.selectors';
import { SpinnerComponent, DropdownComponent, DropdownItemComponent, ToastService } from '@shared/ui';
import {
  LEAVE_TYPE_CONFIG,
  LEAVE_TYPE_TAILWIND_CLASSES,
  LeaveType,
  getLeaveTypeConfig,
  getLeaveTypeClasses
} from '@shared/ui/status-config';

@Component({
  selector: 'app-leave-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    SpinnerComponent,
    DropdownComponent,
    DropdownItemComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="sw-page-header">
        <div class="flex items-center gap-3">
          <a routerLink="/leave" class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors" [title]="'common.back' | translate" [attr.aria-label]="'common.back' | translate">
            <span class="material-icons" aria-hidden="true">arrow_back</span>
          </a>
          <span class="material-icons text-3xl text-primary-500">groups</span>
          <div>
            <h1 class="sw-page-title">{{ 'leave.admin.employeeBalances.title' | translate }}</h1>
            <p class="sw-page-description">{{ 'leave.admin.viewAndManageBalances' | translate }}</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="relative">
            <label class="sw-label">{{ 'leave.taxYear' | translate }}</label>
            <select [formControl]="yearControl" class="sw-input w-48">
              @for (year of availableYears; track year) {
                <option [value]="year">{{ getTaxYearLabel(year) }}</option>
              }
            </select>
          </div>
        </div>
      </div>

      <!-- Access Control -->
      @if (!canApproveLeave()) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <span class="material-icons text-5xl text-error-500 mb-4">lock</span>
          <h2 class="text-lg font-semibold text-neutral-600 dark:text-neutral-400 mb-2">{{ 'errors.forbidden' | translate }}</h2>
          <p class="text-neutral-500 dark:text-neutral-500 mb-4">{{ 'errors.unauthorized' | translate }}</p>
          <a routerLink="/leave" class="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors">
            {{ 'errors.goBack' | translate }}
          </a>
        </div>
      } @else {
        <!-- Search and Filters -->
        <div class="flex items-center gap-4">
          <div class="relative flex-1 max-w-sm">
            <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">search</span>
            <input
              type="text"
              [formControl]="searchControl"
              [placeholder]="'leave.admin.searchEmployee' | translate"
              class="sw-input pl-10 pr-10 w-full"
            />
            @if (searchControl.value) {
              <button (click)="searchControl.reset()" class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                <span class="material-icons text-lg">close</span>
              </button>
            }
          </div>
        </div>

        <!-- Employee Leave Table -->
        @if (loading()) {
          <div class="flex flex-col items-center justify-center py-16 gap-4">
            <sw-spinner size="lg" />
            <p class="text-neutral-500 dark:text-neutral-400">{{ 'leave.admin.loadingBalances' | translate }}</p>
          </div>
        } @else {
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
            <div class="overflow-x-auto">
              <table class="sw-table">
                <thead>
                  <tr>
                    <th>{{ 'employees.title' | translate }}</th>
                    <th>
                      <div class="flex items-center gap-1">
                        <span class="material-icons text-lg" [class]="leaveTypeClasses['ANNUAL']">{{ leaveTypeConfig['ANNUAL'].icon }}</span>
                        {{ 'leave.types.annual' | translate }}
                      </div>
                    </th>
                    <th>
                      <div class="flex items-center gap-1">
                        <span class="material-icons text-lg" [class]="leaveTypeClasses['SICK']">{{ leaveTypeConfig['SICK'].icon }}</span>
                        {{ 'leave.types.sick' | translate }}
                      </div>
                    </th>
                    <th>
                      <div class="flex items-center gap-1">
                        <span class="material-icons text-lg" [class]="leaveTypeClasses['FAMILY_RESPONSIBILITY']">{{ leaveTypeConfig['FAMILY_RESPONSIBILITY'].icon }}</span>
                        {{ 'leave.types.family' | translate }}
                      </div>
                    </th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (employee of filteredEmployees(); track employee.employeeId) {
                    <tr>
                      <td>
                        <div class="flex items-center gap-2">
                          <span class="material-icons text-neutral-400">person</span>
                          <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ employee.employeeName }}</span>
                        </div>
                      </td>
                      <td>
                        <span class="font-medium px-2 py-1 rounded"
                              [class.bg-error-50]="isLowBalance(employee, 'ANNUAL')"
                              [class.text-error-700]="isLowBalance(employee, 'ANNUAL')">
                          {{ getBalanceDisplay(employee, 'ANNUAL') }}
                        </span>
                      </td>
                      <td>
                        <span class="font-medium px-2 py-1 rounded"
                              [class.bg-error-50]="isLowBalance(employee, 'SICK')"
                              [class.text-error-700]="isLowBalance(employee, 'SICK')">
                          {{ getBalanceDisplay(employee, 'SICK') }}
                        </span>
                      </td>
                      <td>
                        <span class="font-medium px-2 py-1 rounded"
                              [class.bg-error-50]="isLowBalance(employee, 'FAMILY_RESPONSIBILITY')"
                              [class.text-error-700]="isLowBalance(employee, 'FAMILY_RESPONSIBILITY')">
                          {{ getBalanceDisplay(employee, 'FAMILY_RESPONSIBILITY') }}
                        </span>
                      </td>
                      <td>
                        <sw-dropdown position="bottom-end">
                          <button trigger class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated" [attr.aria-label]="'common.moreOptions' | translate">
                            <span class="material-icons">more_vert</span>
                          </button>
                          <sw-dropdown-item icon="edit" (click)="openAdjustDialog(employee)">{{ 'leave.admin.adjustBalance' | translate }}</sw-dropdown-item>
                          <sw-dropdown-item icon="calendar_today" (click)="viewSickCycle(employee)">{{ 'leave.admin.viewSickCycle' | translate }}</sw-dropdown-item>
                        </sw-dropdown>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5" class="text-center py-12">
                        <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">person_search</span>
                        <p class="text-neutral-500 dark:text-neutral-400">{{ 'employees.noEmployees' | translate }}</p>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <div class="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-dark-border">
              <div class="text-sm text-neutral-500 dark:text-neutral-400">
                {{ 'leave.pagination.showing' | translate }} {{ (pageIndex() * pageSize) + 1 }} {{ 'leave.pagination.to' | translate }} {{ Math.min((pageIndex() + 1) * pageSize, totalElements()) }} {{ 'leave.pagination.of' | translate }} {{ totalElements() }}
              </div>
              <div class="flex items-center gap-2">
                <button (click)="goToPage(0)" [disabled]="pageIndex() === 0"
                        class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed"
                        [attr.aria-label]="'common.pagination.firstPage' | translate">
                  <span class="material-icons" aria-hidden="true">first_page</span>
                </button>
                <button (click)="goToPage(pageIndex() - 1)" [disabled]="pageIndex() === 0"
                        class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed"
                        [attr.aria-label]="'common.pagination.previousPage' | translate">
                  <span class="material-icons" aria-hidden="true">chevron_left</span>
                </button>
                <span class="px-3 text-sm text-neutral-600 dark:text-neutral-400">
                  Page {{ pageIndex() + 1 }} of {{ Math.ceil(totalElements() / pageSize) || 1 }}
                </span>
                <button (click)="goToPage(pageIndex() + 1)" [disabled]="(pageIndex() + 1) * pageSize >= totalElements()"
                        class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed"
                        [attr.aria-label]="'common.pagination.nextPage' | translate">
                  <span class="material-icons" aria-hidden="true">chevron_right</span>
                </button>
                <button (click)="goToPage(Math.ceil(totalElements() / pageSize) - 1)" [disabled]="(pageIndex() + 1) * pageSize >= totalElements()"
                        class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed"
                        [attr.aria-label]="'common.pagination.lastPage' | translate">
                  <span class="material-icons" aria-hidden="true">last_page</span>
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Adjustment Dialog (inline) -->
        @if (showAdjustDialog()) {
          <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" (click)="closeAdjustDialog()">
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-xl p-6 w-full max-w-md" (click)="$event.stopPropagation()">
              <h2 class="text-xl font-semibold text-neutral-900 dark:text-white mb-1">{{ 'leave.admin.adjustBalance' | translate }}</h2>
              <p class="text-neutral-500 dark:text-neutral-400 text-sm mb-6">{{ selectedEmployee()?.employeeName }}</p>

              <div class="space-y-4">
                <div>
                  <label class="sw-label">{{ 'leave.leaveType' | translate }}</label>
                  <select [formControl]="adjustLeaveTypeControl" class="sw-input w-full">
                    @for (type of leaveTypes; track type) {
                      <option [value]="type">{{ leaveTypeConfig[type].translationKey | translate }}</option>
                    }
                  </select>
                </div>

                <div>
                  <label class="sw-label">{{ 'leave.admin.adjustmentDays' | translate }}</label>
                  <input type="number" [formControl]="adjustAmountControl" class="sw-input w-full" [placeholder]="'leave.admin.adjustmentPlaceholder' | translate" />
                  <p class="text-xs text-neutral-500 mt-1">{{ 'leave.admin.adjustmentHint' | translate }}</p>
                </div>

                <div>
                  <label class="sw-label">{{ 'leave.reason' | translate }}</label>
                  <textarea [formControl]="adjustReasonControl" class="sw-input w-full" rows="3" [placeholder]="'leave.admin.reasonPlaceholder' | translate"></textarea>
                  <p class="text-xs text-neutral-500 mt-1">{{ adjustReasonControl.value?.length || 0 }}/500</p>
                </div>
              </div>

              <div class="flex justify-end gap-3 mt-6">
                <button (click)="closeAdjustDialog()" class="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-elevated rounded-lg transition-colors">
                  {{ 'common.cancel' | translate }}
                </button>
                <button (click)="submitAdjustment()" [disabled]="!isAdjustmentValid() || adjusting()"
                        class="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  @if (adjusting()) {
                    <sw-spinner size="sm" />
                  }
                  {{ 'leave.admin.applyAdjustment' | translate }}
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Sick Cycle Dialog -->
        @if (showSickCycleDialog()) {
          <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" (click)="closeSickCycleDialog()">
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-xl p-6 w-full max-w-md" (click)="$event.stopPropagation()">
              <h2 class="text-xl font-semibold text-neutral-900 dark:text-white mb-1">{{ 'leave.admin.sickCycle' | translate }}</h2>
              <p class="text-neutral-500 dark:text-neutral-400 text-sm mb-6">{{ selectedEmployee()?.employeeName }}</p>

              @if (loadingSickCycle()) {
                <div class="flex justify-center py-8">
                  <sw-spinner size="md" />
                </div>
              } @else if (sickCycleInfo()) {
                <div class="divide-y divide-neutral-200 dark:divide-dark-border">
                  <div class="flex justify-between py-3">
                    <span class="text-neutral-500 dark:text-neutral-400">{{ 'leave.admin.cyclePeriod' | translate }}:</span>
                    <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ sickCycleInfo()?.cycleStart | date:'mediumDate' }} - {{ sickCycleInfo()?.cycleEnd | date:'mediumDate' }}</span>
                  </div>
                  <div class="flex justify-between py-3">
                    <span class="text-neutral-500 dark:text-neutral-400">{{ 'leave.balances.entitlement' | translate }}:</span>
                    <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ sickCycleInfo()?.entitlement }} {{ 'leave.days' | translate }}</span>
                  </div>
                  <div class="flex justify-between py-3">
                    <span class="text-neutral-500 dark:text-neutral-400">{{ 'leave.balances.used' | translate }}:</span>
                    <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ sickCycleInfo()?.used }} {{ 'leave.days' | translate }}</span>
                  </div>
                  <div class="flex justify-between py-3">
                    <span class="text-neutral-500 dark:text-neutral-400">{{ 'leave.balances.pending' | translate }}:</span>
                    <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ sickCycleInfo()?.pending }} {{ 'leave.days' | translate }}</span>
                  </div>
                  <div class="flex justify-between py-3 bg-primary-50 dark:bg-primary-900/20 -mx-6 px-6 rounded-lg">
                    <span class="text-neutral-600 dark:text-neutral-300">{{ 'leave.balances.available' | translate }}:</span>
                    <span class="font-semibold text-primary-600 dark:text-primary-400">{{ sickCycleInfo()?.available }} {{ 'leave.days' | translate }}</span>
                  </div>
                </div>
              }

              <div class="flex justify-end mt-6">
                <button (click)="closeSickCycleDialog()" class="px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors">
                  {{ 'common.close' | translate }}
                </button>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `
})
export class LeaveListComponent implements OnInit {
  private readonly leaveService = inject(LeaveService);
  private readonly toast = inject(ToastService);
  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);

  readonly canApproveLeave = toSignal(this.store.select(selectCanApproveLeave), { initialValue: false });

  // Expose Math for template use
  Math = Math;

  // Expose centralized lookup maps for template (avoids function calls on every CD cycle)
  readonly leaveTypeConfig = LEAVE_TYPE_CONFIG;
  readonly leaveTypeClasses = LEAVE_TYPE_TAILWIND_CLASSES;

  displayedColumns = ['employeeName', 'annual', 'sick', 'family', 'actions'];
  leaveTypes: LeaveType[] = ['ANNUAL', 'SICK', 'FAMILY_RESPONSIBILITY'];

  // State
  employees = signal<LeaveSummary[]>([]);
  filteredEmployees = signal<LeaveSummary[]>([]);
  loading = signal(true);
  totalElements = signal(0);
  pageIndex = signal(0);
  pageSize = 20;

  // Dialog state
  showAdjustDialog = signal(false);
  showSickCycleDialog = signal(false);
  selectedEmployee = signal<LeaveSummary | null>(null);
  sickCycleInfo = signal<any>(null);
  loadingSickCycle = signal(false);
  adjusting = signal(false);

  // Form controls
  yearControl = new FormControl(this.getCurrentTaxYear());
  searchControl = new FormControl('');
  adjustLeaveTypeControl = new FormControl<LeaveType>('ANNUAL');
  adjustAmountControl = new FormControl<number>(0);
  adjustReasonControl = new FormControl('');

  // Generate available years (current year +/- 2)
  availableYears: number[] = [];

  ngOnInit(): void {
    const currentYear = this.getCurrentTaxYear();
    this.availableYears = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

    this.loadEmployees();

    this.yearControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.pageIndex.set(0);
      this.loadEmployees();
    });

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((search) => {
      this.filterEmployees(search || '');
    });
  }

  private getCurrentTaxYear(): number {
    const now = new Date();
    // SA tax year: March to February
    // If January or February, we're in the tax year that ends this year
    // Otherwise, we're in the tax year that ends next year
    if (now.getMonth() < 2) { // Jan or Feb
      return now.getFullYear();
    }
    return now.getFullYear() + 1;
  }

  getTaxYearLabel(taxYear: number): string {
    return `March ${taxYear - 1} - Feb ${taxYear}`;
  }

  loadEmployees(): void {
    this.loading.set(true);
    const year = this.yearControl.value || this.getCurrentTaxYear();

    this.leaveService.getAllEmployeeLeaveBalances(year, this.pageIndex(), this.pageSize).subscribe({
      next: (response) => {
        this.employees.set(response.content);
        this.filteredEmployees.set(response.content);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load employee balances');
        this.loading.set(false);
      }
    });
  }

  private filterEmployees(search: string): void {
    if (!search.trim()) {
      this.filteredEmployees.set(this.employees());
      return;
    }

    const searchLower = search.toLowerCase();
    const filtered = this.employees().filter(emp =>
      emp.employeeName.toLowerCase().includes(searchLower)
    );
    this.filteredEmployees.set(filtered);
  }


  getBalance(employee: LeaveSummary, type: LeaveType): LeaveBalance | undefined {
    return employee.balances.find(b => b.leaveType === type);
  }

  getBalanceDisplay(employee: LeaveSummary, type: LeaveType): string {
    const balance = this.getBalance(employee, type);
    if (!balance) return '-';
    return `${balance.available}/${balance.entitlement}`;
  }

  isLowBalance(employee: LeaveSummary, type: LeaveType): boolean {
    const balance = this.getBalance(employee, type);
    if (!balance) return false;
    return balance.available < balance.entitlement * 0.2;
  }

  getLeaveTypeIcon(type: LeaveType): string {
    return getLeaveTypeConfig(type).icon;
  }

  getLeaveTypeColorClasses(type: LeaveType): string {
    return getLeaveTypeClasses(type);
  }

  getLeaveTypeLabel(type: LeaveType): string {
    return getLeaveTypeConfig(type).translationKey;
  }

  openAdjustDialog(employee: LeaveSummary): void {
    this.selectedEmployee.set(employee);
    this.adjustLeaveTypeControl.reset('ANNUAL');
    this.adjustAmountControl.reset(0);
    this.adjustReasonControl.reset('');
    this.showAdjustDialog.set(true);
  }

  closeAdjustDialog(): void {
    this.showAdjustDialog.set(false);
    this.selectedEmployee.set(null);
  }

  isAdjustmentValid(): boolean {
    return !!(
      this.adjustLeaveTypeControl.value &&
      this.adjustAmountControl.value !== null &&
      this.adjustAmountControl.value !== 0 &&
      this.adjustReasonControl.value &&
      this.adjustReasonControl.value.length >= 10
    );
  }

  submitAdjustment(): void {
    const employee = this.selectedEmployee();
    if (!employee || !this.isAdjustmentValid()) return;

    this.adjusting.set(true);

    const request: AdjustmentRequest = {
      leaveType: this.adjustLeaveTypeControl.value!,
      adjustment: this.adjustAmountControl.value!,
      reason: this.adjustReasonControl.value!
    };

    this.leaveService.adjustLeaveBalance(employee.employeeId, request).subscribe({
      next: (response) => {
        this.toast.success(`Adjusted ${response.leaveType} balance by ${response.adjustment} days`);
        this.closeAdjustDialog();
        this.loadEmployees();
        this.adjusting.set(false);
      },
      error: () => {
        this.toast.error('Failed to adjust balance');
        this.adjusting.set(false);
      }
    });
  }

  viewSickCycle(employee: LeaveSummary): void {
    this.selectedEmployee.set(employee);
    this.sickCycleInfo.set(null);
    this.showSickCycleDialog.set(true);
    this.loadingSickCycle.set(true);

    this.leaveService.getSickLeaveCycleInfo(employee.employeeId).subscribe({
      next: (info) => {
        this.sickCycleInfo.set(info);
        this.loadingSickCycle.set(false);
      },
      error: () => {
        this.toast.error('Failed to load sick leave cycle');
        this.loadingSickCycle.set(false);
      }
    });
  }

  goToPage(page: number): void {
    if (page < 0 || page * this.pageSize >= this.totalElements()) return;
    this.pageIndex.set(page);
    this.loadEmployees();
  }

  closeSickCycleDialog(): void {
    this.showSickCycleDialog.set(false);
    this.selectedEmployee.set(null);
    this.sickCycleInfo.set(null);
  }
}
