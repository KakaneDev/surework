import { Component, inject, OnInit, signal, ChangeDetectionStrategy, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { debounceTime, timeout, catchError, of, finalize } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  LeaveService,
  LeaveBalance,
  LeaveRequest,
  LeaveStatus,
  LeaveType
} from '@core/services/leave.service';
import { selectCanApproveLeave, selectCurrentEmployeeId, selectCurrentUser } from '@core/store/auth/auth.selectors';
import { LeaveRequestDialogComponent } from '../leave-request-dialog/leave-request-dialog.component';
import { LeaveCancelDialogComponent } from '../leave-cancel-dialog/leave-cancel-dialog.component';
import { AdminPendingApprovalsComponent } from '../components/admin-pending-approvals.component';
import { AdminEmployeeBalancesComponent, BalanceAdjustmentEvent } from '../components/admin-employee-balances.component';
import {
  SpinnerComponent,
  BadgeComponent,
  DropdownComponent,
  DropdownItemComponent,
  ToastService,
  DialogService,
  LEAVE_TYPE_CONFIG,
  getLeaveTypeConfig,
  getLeaveStatusConfig,
  ButtonComponent
} from '@shared/ui';

@Component({
  selector: 'app-leave-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    AdminPendingApprovalsComponent,
    AdminEmployeeBalancesComponent,
    SpinnerComponent,
    BadgeComponent,
    DropdownComponent,
    DropdownItemComponent,
    ButtonComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="sw-page-header">
        <div class="flex items-center gap-3">
          <span class="material-icons text-3xl text-primary-500">event_available</span>
          <div>
            <h1 class="sw-page-title">{{ 'leave.title' | translate }}</h1>
            <p class="sw-page-description">{{ 'leave.subtitle' | translate }}</p>
          </div>
        </div>
        <div class="flex gap-3">
          <sw-button variant="primary" size="md" [disabled]="!currentUser()" (clicked)="openRequestDialog()">
            <span class="material-icons text-lg" aria-hidden="true">add</span>
            {{ 'leave.requestLeave' | translate }}
          </sw-button>
        </div>
      </div>

      <!-- Loading state while user data loads -->
      @if (!currentUser()) {
        <div class="flex flex-col items-center justify-center py-16 gap-4">
          <sw-spinner size="lg" />
          <p class="text-neutral-500 dark:text-neutral-400">{{ 'leave.loading' | translate }}</p>
        </div>
      }

      <!-- ADMIN SECTION (conditional) -->
      @if (canApproveLeave()) {
        <div class="space-y-6">
          <h2 class="flex items-center gap-2 text-lg font-semibold text-neutral-900 dark:text-white">
            <span class="material-icons text-primary-500">admin_panel_settings</span>
            {{ 'leave.admin.title' | translate }}
          </h2>

          <!-- Pending Approvals Card -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
            <div class="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-dark-border">
              <div class="flex items-center gap-2">
                <span class="material-icons text-warning-500">pending_actions</span>
                <h3 class="font-semibold text-neutral-900 dark:text-white">{{ 'leave.pendingApprovals' | translate }}</h3>
                @if (pendingCount() > 0) {
                  <span class="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-warning-500 text-white text-sm font-semibold rounded-full">
                    {{ pendingCount() }}
                  </span>
                }
              </div>
              <a routerLink="pending" class="inline-flex items-center gap-1 text-primary-500 hover:text-primary-600 text-sm font-medium">
                {{ 'leave.admin.viewFullPage' | translate }}
                <span class="material-icons text-base">open_in_new</span>
              </a>
            </div>
            <div class="p-4">
              <app-admin-pending-approvals
                #pendingApprovalsComponent
                (requestProcessed)="onRequestProcessed()"/>
            </div>
          </div>

          <!-- Employee Balances Card -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
            <div class="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-dark-border">
              <div class="flex items-center gap-2">
                <span class="material-icons text-primary-500">groups</span>
                <h3 class="font-semibold text-neutral-900 dark:text-white">{{ 'leave.admin.employeeBalances.title' | translate }}</h3>
              </div>
              <div class="flex items-center gap-3">
                <select [formControl]="adminYearControl" class="sw-input w-44 text-sm">
                  @for (year of availableYears; track year) {
                    <option [value]="year">{{ getTaxYearLabel(year) }}</option>
                  }
                </select>
                <a routerLink="employees" class="inline-flex items-center gap-1 text-primary-500 hover:text-primary-600 text-sm font-medium">
                  {{ 'leave.admin.viewFullPage' | translate }}
                  <span class="material-icons text-base">open_in_new</span>
                </a>
              </div>
            </div>
            <div class="p-4">
              <app-admin-employee-balances
                [year]="adminYearControl.value!"
                (adjustBalance)="onAdjustBalance($event)"/>
            </div>
          </div>
        </div>

        <hr class="border-neutral-200 dark:border-dark-border my-8" />
      }

      <!-- PERSONAL SECTION (visible to any authenticated user) -->
      @if (currentUser()) {
        <div class="space-y-6">
          @if (canApproveLeave()) {
            <h2 class="flex items-center gap-2 text-lg font-semibold text-neutral-900 dark:text-white">
              <span class="material-icons text-primary-500">person</span>
              {{ 'leave.myLeave' | translate }}
            </h2>
          }

          <!-- Balance Cards -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold text-neutral-800 dark:text-neutral-200">{{ 'leave.balances.title' | translate }}</h3>
              <select [formControl]="yearControl" class="sw-input w-48">
                @for (year of availableYears; track year) {
                  <option [value]="year">{{ getTaxYearLabel(year) }}</option>
                }
              </select>
            </div>

            @if (loadingBalances()) {
              <div class="flex justify-center py-12">
                <sw-spinner size="md" />
              </div>
            } @else if (balances().length === 0) {
              <div class="flex flex-col items-center py-8 text-neutral-500">
                <span class="material-icons text-5xl mb-4 opacity-50">info</span>
                <p>{{ 'leave.balances.noBalancesFound' | translate }}</p>
              </div>
            } @else {
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                @for (balance of balances(); track balance.id) {
                  <div class="rounded-xl p-5 text-white shadow-lg hover:-translate-y-0.5 transition-transform" [style.background]="getLeaveTypeGradient(balance.leaveType)">
                    <div class="flex items-center gap-2 mb-4">
                      <span class="material-icons text-2xl">{{ getLeaveTypeIcon(balance.leaveType) }}</span>
                      <span class="text-sm font-medium opacity-95">{{ getLeaveTypeLabel(balance.leaveType) | translate }}</span>
                    </div>
                    <div>
                      <div class="flex items-baseline gap-2 mb-2">
                        <span class="text-4xl font-bold">{{ balance.available }}</span>
                        <span class="text-sm opacity-90">{{ 'leave.balances.available' | translate }}</span>
                      </div>
                      <div class="text-xs opacity-85 mb-3" [title]="('leave.balances.entitlement' | translate) + ' | ' + ('leave.balances.used' | translate) + ' | ' + ('leave.balances.pending' | translate)">
                        {{ balance.entitlement }} | {{ balance.used }} | {{ balance.pending }}
                      </div>
                      <div class="h-1.5 bg-white/30 rounded-full overflow-hidden">
                        <div class="h-full bg-white/90 rounded-full transition-all" [style.width.%]="getUsagePercentage(balance)"></div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Leave Requests Table -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border">
            <div class="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-dark-border">
              <h3 class="font-semibold text-neutral-900 dark:text-white">{{ 'leave.requests.title' | translate }}</h3>
              <select [formControl]="statusControl" class="sw-input w-36">
                <option [ngValue]="null">{{ 'common.all' | translate }}</option>
                <option value="PENDING">{{ 'common.pending' | translate }}</option>
                <option value="APPROVED">{{ 'common.approved' | translate }}</option>
                <option value="REJECTED">{{ 'common.rejected' | translate }}</option>
                <option value="CANCELLED">{{ 'leave.cancelled' | translate }}</option>
              </select>
            </div>

            @if (loadingRequests()) {
              <div class="flex justify-center py-12">
                <sw-spinner size="md" />
              </div>
            } @else {
              <div class="overflow-x-auto">
                <table class="sw-table">
                  <thead>
                    <tr>
                      <th>{{ 'common.type' | translate }}</th>
                      <th>{{ 'leave.table.dates' | translate }}</th>
                      <th>{{ 'leave.table.days' | translate }}</th>
                      <th>{{ 'common.status' | translate }}</th>
                      <th>{{ 'leave.requests.submitted' | translate }}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (request of requests(); track request.id) {
                      <tr>
                        <td>
                          <div class="flex items-center gap-2">
                            <span class="material-icons text-lg" [style.color]="getLeaveTypeColor(request.leaveType)">
                              {{ getLeaveTypeIcon(request.leaveType) }}
                            </span>
                            <span>{{ getLeaveTypeLabel(request.leaveType) | translate }}</span>
                          </div>
                        </td>
                        <td class="text-neutral-600 dark:text-neutral-400">
                          {{ request.startDate | date:'mediumDate' }} - {{ request.endDate | date:'mediumDate' }}
                        </td>
                        <td>{{ request.days }}</td>
                        <td>
                          <sw-badge [variant]="getStatusVariant(request.status)">
                            {{ request.status }}
                          </sw-badge>
                        </td>
                        <td class="text-neutral-600 dark:text-neutral-400">{{ request.createdAt | date:'mediumDate' }}</td>
                        <td>
                          @if (request.status === 'PENDING') {
                            <sw-dropdown align="right">
                              <button trigger class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated" [attr.aria-label]="'common.moreOptions' | translate">
                                <span class="material-icons">more_vert</span>
                              </button>
                              <sw-dropdown-item icon="cancel" [danger]="true" (onClick)="cancelRequest(request)">
                                {{ 'leave.cancelRequest' | translate }}
                              </sw-dropdown-item>
                            </sw-dropdown>
                          }
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="6" class="text-center py-12">
                          <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">event_busy</span>
                          <p class="text-neutral-500 dark:text-neutral-400">{{ 'leave.noRequestsFound' | translate }}</p>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Pagination -->
              <div class="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-dark-border">
                <div class="text-sm text-neutral-500 dark:text-neutral-400">
                  {{ 'common.showing' | translate }} {{ (pageIndex() * pageSize) + 1 }} {{ 'common.to' | translate }} {{ Math.min((pageIndex() + 1) * pageSize, totalElements()) }} {{ 'common.of' | translate }} {{ totalElements() }}
                </div>
                <div class="flex items-center gap-2">
                  <button (click)="goToPage(0)" [disabled]="pageIndex() === 0"
                          class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed">
                    <span class="material-icons">first_page</span>
                  </button>
                  <button (click)="goToPage(pageIndex() - 1)" [disabled]="pageIndex() === 0"
                          class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed">
                    <span class="material-icons">chevron_left</span>
                  </button>
                  <span class="px-3 text-sm text-neutral-600 dark:text-neutral-400">
                    {{ 'common.page' | translate }} {{ pageIndex() + 1 }} {{ 'common.of' | translate }} {{ Math.ceil(totalElements() / pageSize) || 1 }}
                  </span>
                  <button (click)="goToPage(pageIndex() + 1)" [disabled]="(pageIndex() + 1) * pageSize >= totalElements()"
                          class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed">
                    <span class="material-icons">chevron_right</span>
                  </button>
                  <button (click)="goToPage(Math.ceil(totalElements() / pageSize) - 1)" [disabled]="(pageIndex() + 1) * pageSize >= totalElements()"
                          class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed">
                    <span class="material-icons">last_page</span>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Note: Personal section is now shown for all authenticated users.
           If they don't have an employee profile, the self-service APIs will return empty data. -->
    </div>
  `
})
export class LeaveDashboardComponent implements OnInit {
  private readonly leaveService = inject(LeaveService);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly store = inject(Store);

  // Expose Math for template use
  Math = Math;

  @ViewChild('pendingApprovalsComponent') pendingApprovalsComponent?: AdminPendingApprovalsComponent;

  // Auth state from store
  readonly currentUser = toSignal(this.store.select(selectCurrentUser));
  readonly currentEmployeeId = toSignal(this.store.select(selectCurrentEmployeeId));
  readonly canApproveLeave = toSignal(this.store.select(selectCanApproveLeave), { initialValue: false });

  displayedColumns = ['leaveType', 'dates', 'days', 'status', 'submittedAt', 'actions'];

  // Signal-based state
  balances = signal<LeaveBalance[]>([]);
  requests = signal<LeaveRequest[]>([]);
  loadingBalances = signal(true);
  loadingRequests = signal(true);
  totalElements = signal(0);
  pageIndex = signal(0);
  pageSize = 10;

  // Admin state
  pendingCount = signal(0);
  private pendingCountLoaded = false;
  private personalDataLoaded = false;

  statusControl = new FormControl<LeaveStatus | null>(null);
  yearControl = new FormControl(this.getCurrentTaxYear());
  adminYearControl = new FormControl(this.getCurrentTaxYear());
  availableYears: number[] = [];

  constructor() {
    // React to user data becoming available
    // allowSignalWrites: true is required because loadBalances/loadRequests write to signals
    effect(() => {
      const user = this.currentUser();

      console.log('[LeaveDashboard] Effect running - user:', user?.userId, 'personalDataLoaded:', this.personalDataLoaded);

      // Once user is loaded, load personal data using self-service endpoints
      // Backend uses JWT token to identify the employee - no employeeId needed
      if (user && !this.personalDataLoaded) {
        console.log('[LeaveDashboard] User loaded, loading personal data via self-service');
        this.personalDataLoaded = true;
        this.loadBalances();
        this.loadRequests();
      }
    }, { allowSignalWrites: true });

    // React to admin status becoming available
    effect(() => {
      const canApprove = this.canApproveLeave();
      if (canApprove && !this.pendingCountLoaded) {
        console.log('[LeaveDashboard] Loading pending count');
        this.pendingCountLoaded = true;
        this.loadPendingCount();
      }
    });
  }

  ngOnInit(): void {
    // Initialize available years
    const currentYear = this.getCurrentTaxYear();
    this.availableYears = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

    this.statusControl.valueChanges.pipe(
      debounceTime(100)
    ).subscribe(() => {
      this.pageIndex.set(0);
      this.loadRequests();
    });

    this.yearControl.valueChanges.subscribe(() => {
      this.loadBalances();
    });

    // Fallback: if user is already available on init, load personal data
    // This handles cases where store data was already populated before component mounted
    setTimeout(() => {
      const user = this.currentUser();
      console.log('[LeaveDashboard] ngOnInit fallback check - user:', user?.userId, 'personalDataLoaded:', this.personalDataLoaded);

      if (user && !this.personalDataLoaded) {
        console.log('[LeaveDashboard] Fallback: Loading personal data via self-service');
        this.personalDataLoaded = true;
        this.loadBalances();
        this.loadRequests();
      }
    }, 100);
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

  private loadPendingCount(): void {
    this.leaveService.getPendingApprovals(0, 1).subscribe({
      next: (response) => {
        this.pendingCount.set(response.totalElements);
      }
    });
  }

  loadBalances(): void {
    // Self-service endpoint - no employeeId needed, backend uses JWT token
    console.log('[LeaveDashboard] loadBalances called (self-service)');

    this.loadingBalances.set(true);
    const selectedYear = this.yearControl.value || this.getCurrentTaxYear();
    console.log('[LeaveDashboard] Fetching my balances for year:', selectedYear);

    this.leaveService.getMyBalances(selectedYear).pipe(
      timeout(30000), // 30 second timeout
      catchError(err => {
        console.error('[LeaveDashboard] Error loading balances:', err);
        return of([]);
      }),
      finalize(() => {
        console.log('[LeaveDashboard] Balance loading complete');
        this.loadingBalances.set(false);
      })
    ).subscribe({
      next: (balances) => {
        console.log('[LeaveDashboard] Received balances:', balances);
        this.balances.set(balances);
      }
    });
  }

  loadRequests(): void {
    // Self-service endpoint - no employeeId needed, backend uses JWT token
    console.log('[LeaveDashboard] loadRequests called (self-service)');

    this.loadingRequests.set(true);

    this.leaveService.getMyRequests(
      this.pageIndex(),
      this.pageSize,
      this.statusControl.value ?? undefined
    ).pipe(
      timeout(30000), // 30 second timeout
      catchError(err => {
        console.error('[LeaveDashboard] Error loading requests:', err);
        return of({ content: [], totalElements: 0, page: 0, size: this.pageSize, totalPages: 0, first: true, last: true });
      }),
      finalize(() => {
        console.log('[LeaveDashboard] Requests loading complete');
        this.loadingRequests.set(false);
      })
    ).subscribe({
      next: (response) => {
        console.log('[LeaveDashboard] Received requests:', response);
        this.requests.set(response.content);
        this.totalElements.set(response.totalElements);
      }
    });
  }


  openRequestDialog(): void {
    if (!this.currentUser()) {
      this.toast.error('Unable to submit request: User not authenticated');
      return;
    }

    const dialogRef = this.dialog.open(LeaveRequestDialogComponent, {
      width: '500px',
      data: {
        balances: this.balances()
      }
    });

    dialogRef.afterClosed().then((result) => {
      if (result) {
        this.loadBalances();
        this.loadRequests();
        // Refresh pending data for admins
        if (this.canApproveLeave()) {
          this.loadPendingCount();
          // Also refresh the pending approvals table
          this.pendingApprovalsComponent?.loadPendingRequests();
        }
        this.toast.success('Leave request submitted successfully');
      }
    });
  }

  cancelRequest(request: LeaveRequest): void {
    const dialogRef = this.dialog.open(LeaveCancelDialogComponent, {
      width: '400px',
      data: { request }
    });

    dialogRef.afterClosed().then((reason) => {
      if (reason) {
        this.leaveService.cancelLeaveRequest(request.id, reason as string).subscribe({
          next: () => {
            this.loadBalances();
            this.loadRequests();
            // Refresh pending data for admins
            if (this.canApproveLeave()) {
              this.loadPendingCount();
              this.pendingApprovalsComponent?.loadPendingRequests();
            }
            this.toast.success('Leave request cancelled');
          },
          error: () => {
            this.toast.error('Failed to cancel leave request');
          }
        });
      }
    });
  }

  /** Called when a pending request is approved or rejected */
  onRequestProcessed(): void {
    // Refresh pending count
    this.loadPendingCount();
    // Refresh personal balances if admin is also an employee
    if (this.currentEmployeeId()) {
      this.loadBalances();
      this.loadRequests();
    }
  }

  /** Called when an employee balance is adjusted */
  onAdjustBalance(event: BalanceAdjustmentEvent): void {
    // If the adjusted employee is the current user, refresh personal balances
    const employeeId = this.currentEmployeeId();
    if (employeeId && event.employeeId === employeeId) {
      this.loadBalances();
    }
  }

  getLeaveTypeIcon(type: LeaveType): string {
    return getLeaveTypeConfig(type).icon;
  }

  getLeaveTypeGradient(type: LeaveType): string {
    return getLeaveTypeConfig(type).gradient;
  }

  getLeaveTypeLabel(type: LeaveType): string {
    return getLeaveTypeConfig(type).translationKey;
  }

  getLeaveTypeColor(type: LeaveType): string {
    // Extract primary color from gradient for solid color use cases
    const colors: Record<string, string> = {
      ANNUAL: '#4CAF50',
      SICK: '#f44336',
      FAMILY_RESPONSIBILITY: '#9C27B0',
      MATERNITY: '#E91E63',
      PARENTAL: '#00BCD4',
      UNPAID: '#607D8B',
      STUDY: '#FF9800'
    };
    return colors[type] || '#607D8B';
  }

  getStatusClass(status: LeaveStatus): string {
    return `status-${status.toLowerCase()}`;
  }

  getStatusVariant(status: LeaveStatus): 'neutral' | 'success' | 'warning' | 'error' {
    const config = getLeaveStatusConfig(status);
    const variant = config.variant;
    // Map to the limited set of variants this method returns
    if (variant === 'primary' || variant === 'info') return 'neutral';
    return variant as 'neutral' | 'success' | 'warning' | 'error';
  }

  goToPage(page: number): void {
    if (page < 0 || page * this.pageSize >= this.totalElements()) return;
    this.pageIndex.set(page);
    this.loadRequests();
  }

  getUsagePercentage(balance: LeaveBalance): number {
    if (balance.entitlement === 0) return 0;
    return ((balance.used + balance.pending) / balance.entitlement) * 100;
  }
}
