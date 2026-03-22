import {
  Component,
  inject,
  OnInit,
  signal,
  input,
  output,
  effect,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { debounceTime } from 'rxjs';
import {
  LeaveService,
  LeaveBalance,
  LeaveSummary,
  LeaveType,
  AdjustmentRequest
} from '@core/services/leave.service';
import { ToastService } from '@shared/ui';
import { SpinnerComponent } from '@shared/ui';

interface LeaveTypeConfig {
  icon: string;
  color: string;
  label: string;
}

const LEAVE_TYPE_CONFIG: Record<LeaveType, LeaveTypeConfig> = {
  ANNUAL: { icon: 'beach_access', color: '#4CAF50', label: 'Annual' },
  SICK: { icon: 'medical_services', color: '#f44336', label: 'Sick' },
  FAMILY_RESPONSIBILITY: { icon: 'family_restroom', color: '#9C27B0', label: 'Family' },
  MATERNITY: { icon: 'pregnant_woman', color: '#E91E63', label: 'Maternity' },
  PARENTAL: { icon: 'child_care', color: '#00BCD4', label: 'Parental' },
  UNPAID: { icon: 'money_off', color: '#607D8B', label: 'Unpaid' },
  STUDY: { icon: 'school', color: '#FF9800', label: 'Study' }
};

export interface BalanceAdjustmentEvent {
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  adjustment: number;
  reason: string;
}

/**
 * Compact employee balances table for embedding in the admin dashboard.
 * Shows employee leave balances with search and adjustment capabilities.
 */
@Component({
  selector: 'app-admin-employee-balances',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    SpinnerComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Search -->
    <div class="mb-4">
      <div class="relative w-72">
        <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-lg">search</span>
        <input type="text" [formControl]="searchControl"
               [placeholder]="'leave.admin.employeeBalances.searchPlaceholder' | translate"
               class="sw-input w-full pl-10 pr-10">
        @if (searchControl.value) {
          <button type="button" (click)="searchControl.reset()"
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-dark-elevated text-neutral-400 hover:text-neutral-600">
            <span class="material-icons text-lg">close</span>
          </button>
        }
      </div>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-8">
        <sw-spinner size="md" />
      </div>
    } @else {
      <div class="overflow-x-auto">
        <table class="sw-table">
          <thead>
            <tr>
              <th>{{ 'leave.admin.employeeBalances.employee' | translate }}</th>
              <th>
                <div class="flex items-center gap-1">
                  <span class="material-icons text-sm" [style.color]="getLeaveTypeColor('ANNUAL')">{{ getLeaveTypeIcon('ANNUAL') }}</span>
                  {{ 'leave.admin.employeeBalances.leaveTypeAnnual' | translate }}
                </div>
              </th>
              <th>
                <div class="flex items-center gap-1">
                  <span class="material-icons text-sm" [style.color]="getLeaveTypeColor('SICK')">{{ getLeaveTypeIcon('SICK') }}</span>
                  {{ 'leave.admin.employeeBalances.leaveTypeSick' | translate }}
                </div>
              </th>
              <th>
                <div class="flex items-center gap-1">
                  <span class="material-icons text-sm" [style.color]="getLeaveTypeColor('FAMILY_RESPONSIBILITY')">{{ getLeaveTypeIcon('FAMILY_RESPONSIBILITY') }}</span>
                  {{ 'leave.admin.employeeBalances.leaveTypeFamily' | translate }}
                </div>
              </th>
              <th class="w-12"></th>
            </tr>
          </thead>
          <tbody>
            @for (employee of filteredEmployees(); track employee.employeeId) {
              <tr>
                <td>
                  <div class="flex items-center gap-2">
                    <span class="material-icons text-neutral-400 text-lg">person</span>
                    <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ employee.employeeName }}</span>
                  </div>
                </td>
                <td>
                  <span class="px-2 py-1 rounded text-sm font-medium"
                        [ngClass]="isLowBalance(employee, 'ANNUAL') ? 'bg-error-50 text-error-700 dark:bg-error-900/20 dark:text-error-400' : ''">
                    {{ getBalanceDisplay(employee, 'ANNUAL') }}
                  </span>
                </td>
                <td>
                  <span class="px-2 py-1 rounded text-sm font-medium"
                        [ngClass]="isLowBalance(employee, 'SICK') ? 'bg-error-50 text-error-700 dark:bg-error-900/20 dark:text-error-400' : ''">
                    {{ getBalanceDisplay(employee, 'SICK') }}
                  </span>
                </td>
                <td>
                  <span class="px-2 py-1 rounded text-sm font-medium"
                        [ngClass]="isLowBalance(employee, 'FAMILY_RESPONSIBILITY') ? 'bg-error-50 text-error-700 dark:bg-error-900/20 dark:text-error-400' : ''">
                    {{ getBalanceDisplay(employee, 'FAMILY_RESPONSIBILITY') }}
                  </span>
                </td>
                <td>
                  <div class="relative">
                    <button type="button" (click)="toggleMenu(employee.employeeId)"
                            class="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
                      <span class="material-icons text-lg">more_vert</span>
                    </button>
                    @if (openMenuId() === employee.employeeId) {
                      <div class="absolute right-0 top-full mt-1 z-10 bg-white dark:bg-dark-surface rounded-lg shadow-dropdown border border-neutral-200 dark:border-dark-border py-1 min-w-[160px]">
                        <button type="button" (click)="openAdjustDialog(employee)"
                                class="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-elevated">
                          <span class="material-icons text-lg">edit</span>
                          {{ 'leave.admin.employeeBalances.adjustBalance' | translate }}
                        </button>
                        <button type="button" (click)="viewSickCycle(employee)"
                                class="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-elevated">
                          <span class="material-icons text-lg">calendar_today</span>
                          {{ 'leave.admin.employeeBalances.viewSickCycle' | translate }}
                        </button>
                      </div>
                    }
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="text-center py-8">
                  <div class="flex flex-col items-center gap-2 text-neutral-500">
                    <span class="material-icons text-3xl text-neutral-300">person_search</span>
                    <span>{{ 'leave.admin.employeeBalances.noEmployeesFound' | translate }}</span>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      @if (totalElements() > pageSize) {
        <div class="flex items-center justify-between mt-4 pt-4 border-t border-neutral-200 dark:border-dark-border">
          <span class="text-sm text-neutral-500">
            {{ 'leave.admin.employeeBalances.showing' | translate: { start: pageIndex() * pageSize + 1, end: Math.min((pageIndex() + 1) * pageSize, totalElements()), total: totalElements() } }}
          </span>
          <div class="flex gap-1">
            <button type="button" (click)="goToPage(0)" [disabled]="pageIndex() === 0"
                    class="p-1.5 rounded-lg border border-neutral-200 dark:border-dark-border hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed">
              <span class="material-icons text-lg">first_page</span>
            </button>
            <button type="button" (click)="goToPage(pageIndex() - 1)" [disabled]="pageIndex() === 0"
                    class="p-1.5 rounded-lg border border-neutral-200 dark:border-dark-border hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed">
              <span class="material-icons text-lg">chevron_left</span>
            </button>
            <button type="button" (click)="goToPage(pageIndex() + 1)" [disabled]="pageIndex() >= Math.ceil(totalElements() / pageSize) - 1"
                    class="p-1.5 rounded-lg border border-neutral-200 dark:border-dark-border hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed">
              <span class="material-icons text-lg">chevron_right</span>
            </button>
            <button type="button" (click)="goToPage(Math.ceil(totalElements() / pageSize) - 1)" [disabled]="pageIndex() >= Math.ceil(totalElements() / pageSize) - 1"
                    class="p-1.5 rounded-lg border border-neutral-200 dark:border-dark-border hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed">
              <span class="material-icons text-lg">last_page</span>
            </button>
          </div>
        </div>
      }

      <!-- Adjustment Dialog -->
      @if (showAdjustDialog()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" (click)="closeAdjustDialog()">
          <div class="bg-white dark:bg-dark-surface rounded-xl p-6 w-[400px] max-w-[90vw] shadow-xl" (click)="$event.stopPropagation()">
            <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-1">{{ 'leave.admin.employeeBalances.adjustLeaveBalance' | translate }}</h2>
            <p class="text-sm text-neutral-500 mb-6">{{ selectedEmployee()?.employeeName }}</p>

            <div class="space-y-4">
              <div>
                <label class="sw-label">{{ 'leave.admin.employeeBalances.leaveType' | translate }}</label>
                <select [formControl]="adjustLeaveTypeControl" class="sw-input w-full">
                  @for (type of leaveTypes; track type) {
                    <option [value]="type">{{ getLeaveTypeLabel(type) | translate }}</option>
                  }
                </select>
              </div>

              <div>
                <label class="sw-label">{{ 'leave.admin.employeeBalances.adjustmentDays' | translate }}</label>
                <input type="number" [formControl]="adjustAmountControl" class="sw-input w-full" [placeholder]="'leave.admin.employeeBalances.adjustmentPlaceholder' | translate">
                <p class="text-xs text-neutral-400 mt-1">{{ 'leave.admin.employeeBalances.adjustmentHint' | translate }}</p>
              </div>

              <div>
                <label class="sw-label">{{ 'leave.admin.employeeBalances.reason' | translate }}</label>
                <textarea [formControl]="adjustReasonControl" class="sw-input w-full" rows="3"
                          [placeholder]="'leave.admin.employeeBalances.reasonPlaceholder' | translate"></textarea>
                <p class="text-xs text-neutral-400 mt-1 text-right">{{ adjustReasonControl.value?.length || 0 }}/500</p>
              </div>
            </div>

            <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-dark-border">
              <button type="button" (click)="closeAdjustDialog()"
                      class="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-elevated rounded-lg transition-colors">
                {{ 'leave.admin.employeeBalances.cancel' | translate }}
              </button>
              <button type="button" (click)="submitAdjustment()" [disabled]="!isAdjustmentValid() || adjusting()"
                      class="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                @if (adjusting()) {
                  <sw-spinner size="sm" />
                }
                {{ 'leave.admin.employeeBalances.applyAdjustment' | translate }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Sick Cycle Dialog -->
      @if (showSickCycleDialog()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" (click)="closeSickCycleDialog()">
          <div class="bg-white dark:bg-dark-surface rounded-xl p-6 w-[400px] max-w-[90vw] shadow-xl" (click)="$event.stopPropagation()">
            <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-1">{{ 'leave.admin.employeeBalances.sickLeaveCycle' | translate }}</h2>
            <p class="text-sm text-neutral-500 mb-6">{{ selectedEmployee()?.employeeName }}</p>

            @if (loadingSickCycle()) {
              <div class="flex justify-center py-6">
                <sw-spinner size="md" />
              </div>
            } @else if (sickCycleInfo()) {
              <div class="space-y-0">
                <div class="flex justify-between py-3 border-b border-neutral-200 dark:border-dark-border">
                  <span class="text-neutral-500">{{ 'leave.admin.employeeBalances.cyclePeriod' | translate }}</span>
                  <span class="font-medium text-neutral-700 dark:text-neutral-300">{{ sickCycleInfo()?.cycleStart | date:'mediumDate' }} - {{ sickCycleInfo()?.cycleEnd | date:'mediumDate' }}</span>
                </div>
                <div class="flex justify-between py-3 border-b border-neutral-200 dark:border-dark-border">
                  <span class="text-neutral-500">{{ 'leave.admin.employeeBalances.entitlement' | translate }}</span>
                  <span class="font-medium text-neutral-700 dark:text-neutral-300">{{ sickCycleInfo()?.entitlement }} {{ 'leave.admin.employeeBalances.days' | translate }}</span>
                </div>
                <div class="flex justify-between py-3 border-b border-neutral-200 dark:border-dark-border">
                  <span class="text-neutral-500">{{ 'leave.admin.employeeBalances.used' | translate }}</span>
                  <span class="font-medium text-neutral-700 dark:text-neutral-300">{{ sickCycleInfo()?.used }} {{ 'leave.admin.employeeBalances.days' | translate }}</span>
                </div>
                <div class="flex justify-between py-3 border-b border-neutral-200 dark:border-dark-border">
                  <span class="text-neutral-500">{{ 'leave.admin.employeeBalances.pending' | translate }}</span>
                  <span class="font-medium text-neutral-700 dark:text-neutral-300">{{ sickCycleInfo()?.pending }} {{ 'leave.admin.employeeBalances.days' | translate }}</span>
                </div>
                <div class="flex justify-between py-3 px-4 -mx-6 mt-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                  <span class="text-neutral-600 dark:text-neutral-400">{{ 'leave.admin.employeeBalances.available' | translate }}</span>
                  <span class="font-semibold text-primary-600 dark:text-primary-400">{{ sickCycleInfo()?.available }} {{ 'leave.admin.employeeBalances.days' | translate }}</span>
                </div>
              </div>
            }

            <div class="flex justify-end mt-6 pt-4 border-t border-neutral-200 dark:border-dark-border">
              <button type="button" (click)="closeSickCycleDialog()"
                      class="px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors">
                {{ 'leave.admin.employeeBalances.close' | translate }}
              </button>
            </div>
          </div>
        </div>
      }
    }
  `
})
export class AdminEmployeeBalancesComponent implements OnInit {
  private readonly leaveService = inject(LeaveService);
  private readonly toastService = inject(ToastService);
  private readonly translate = inject(TranslateService);

  Math = Math;

  /** Tax year for loading balances */
  year = input.required<number>();

  /** Emitted when a balance adjustment is made */
  adjustBalance = output<BalanceAdjustmentEvent>();

  leaveTypes: LeaveType[] = ['ANNUAL', 'SICK', 'FAMILY_RESPONSIBILITY'];

  // State
  employees = signal<LeaveSummary[]>([]);
  filteredEmployees = signal<LeaveSummary[]>([]);
  loading = signal(true);
  totalElements = signal(0);
  pageIndex = signal(0);
  pageSize = 10;

  // Menu state
  openMenuId = signal<string | null>(null);

  // Dialog state
  showAdjustDialog = signal(false);
  showSickCycleDialog = signal(false);
  selectedEmployee = signal<LeaveSummary | null>(null);
  sickCycleInfo = signal<any>(null);
  loadingSickCycle = signal(false);
  adjusting = signal(false);

  // Form controls
  searchControl = new FormControl('');
  adjustLeaveTypeControl = new FormControl<LeaveType>('ANNUAL');
  adjustAmountControl = new FormControl<number>(0);
  adjustReasonControl = new FormControl('');

  constructor() {
    // React to year changes
    // allowSignalWrites: true is required because loadEmployees writes to signals
    effect(() => {
      const yearValue = this.year();
      if (yearValue) {
        this.pageIndex.set(0);
        this.loadEmployees();
      }
    }, { allowSignalWrites: true });

    // Close menu when clicking outside
    if (typeof document !== 'undefined') {
      document.addEventListener('click', () => {
        this.openMenuId.set(null);
      });
    }
  }

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300)
    ).subscribe((search) => {
      this.filterEmployees(search || '');
    });

    // Fallback: load immediately if year is already set
    const yearValue = this.year();
    if (yearValue && this.employees().length === 0) {
      this.loadEmployees();
    }
  }

  loadEmployees(): void {
    this.loading.set(true);
    const yearValue = this.year();

    console.log('[AdminEmployeeBalances] Loading employees for year:', yearValue);

    this.leaveService.getAllEmployeeLeaveBalances(yearValue, this.pageIndex(), this.pageSize).subscribe({
      next: (response) => {
        console.log('[AdminEmployeeBalances] Loaded employees:', response);
        this.employees.set(response.content);
        this.filteredEmployees.set(response.content);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[AdminEmployeeBalances] Error loading employees:', err);
        this.toastService.error(this.translate.instant('leave.admin.employeeBalances.failedLoadBalances'));
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

  goToPage(page: number): void {
    this.pageIndex.set(page);
    this.loadEmployees();
  }

  toggleMenu(employeeId: string): void {
    if (this.openMenuId() === employeeId) {
      this.openMenuId.set(null);
    } else {
      this.openMenuId.set(employeeId);
    }
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
    return LEAVE_TYPE_CONFIG[type]?.icon || 'event';
  }

  getLeaveTypeColor(type: LeaveType): string {
    return LEAVE_TYPE_CONFIG[type]?.color || '#607D8B';
  }

  getLeaveTypeLabel(type: LeaveType): string {
    return LEAVE_TYPE_CONFIG[type]?.label || type;
  }

  openAdjustDialog(employee: LeaveSummary): void {
    this.selectedEmployee.set(employee);
    this.adjustLeaveTypeControl.reset('ANNUAL');
    this.adjustAmountControl.reset(0);
    this.adjustReasonControl.reset('');
    this.showAdjustDialog.set(true);
    this.openMenuId.set(null);
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
        this.toastService.success(this.translate.instant('leave.admin.employeeBalances.adjustmentSuccess', { leaveType: response.leaveType, adjustment: response.adjustment }));
        this.closeAdjustDialog();
        this.loadEmployees();
        this.adjusting.set(false);

        // Notify parent of adjustment
        this.adjustBalance.emit({
          employeeId: employee.employeeId,
          employeeName: employee.employeeName,
          leaveType: request.leaveType,
          adjustment: request.adjustment,
          reason: request.reason
        });
      },
      error: () => {
        this.toastService.error(this.translate.instant('leave.admin.employeeBalances.failedAdjustBalance'));
        this.adjusting.set(false);
      }
    });
  }

  viewSickCycle(employee: LeaveSummary): void {
    this.selectedEmployee.set(employee);
    this.sickCycleInfo.set(null);
    this.showSickCycleDialog.set(true);
    this.loadingSickCycle.set(true);
    this.openMenuId.set(null);

    this.leaveService.getSickLeaveCycleInfo(employee.employeeId).subscribe({
      next: (info) => {
        this.sickCycleInfo.set(info);
        this.loadingSickCycle.set(false);
      },
      error: () => {
        this.toastService.error(this.translate.instant('leave.admin.employeeBalances.failedLoadSickCycle'));
        this.loadingSickCycle.set(false);
      }
    });
  }

  closeSickCycleDialog(): void {
    this.showSickCycleDialog.set(false);
    this.selectedEmployee.set(null);
    this.sickCycleInfo.set(null);
  }
}
