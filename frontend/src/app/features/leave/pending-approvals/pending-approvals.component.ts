import { Component, inject, OnInit, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { LeaveService, LeaveRequest, LeaveType } from '@core/services/leave.service';
import { selectCanApproveLeave, selectCurrentUser } from '@core/store/auth/auth.selectors';
import { SpinnerComponent, ToastService } from '@shared/ui';

@Component({
  selector: 'app-pending-approvals',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    TranslateModule,
    DatePipe,
    SpinnerComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Access Denied -->
      @if (!canApproveLeave()) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <span class="material-icons text-6xl text-error-500 mb-4">lock</span>
          <h2 class="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-2">{{ 'errors.forbidden' | translate }}</h2>
          <p class="text-neutral-600 dark:text-neutral-400 mb-2">{{ 'errors.unauthorized' | translate }}</p>
          <p class="text-sm text-neutral-400 dark:text-neutral-500 mb-6">{{ 'leave.approvals.accessDeniedDescription' | translate }}</p>
          <a routerLink="/leave" class="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors">
            <span class="material-icons text-lg">arrow_back</span>
            {{ 'leave.approvals.backToLeave' | translate }}
          </a>
        </div>
      } @else {
        <!-- Header -->
        <div class="sw-page-header">
          <div class="flex items-center gap-3">
            <a routerLink="/leave" class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors" [title]="'leave.approvals.backToLeave' | translate" [attr.aria-label]="'common.back' | translate">
              <span class="material-icons" aria-hidden="true">arrow_back</span>
            </a>
            <span class="material-icons text-3xl text-warning-500">pending_actions</span>
            <div>
              <h1 class="sw-page-title">{{ 'leave.pendingApprovals' | translate }}</h1>
              <p class="sw-page-description">{{ 'leave.approvals.subtitle' | translate }}</p>
            </div>
          </div>
          <span class="px-3 py-1.5 bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 rounded-full text-xs font-medium uppercase">
            {{ currentUserRole() }}
          </span>
        </div>

        <!-- Info Banner -->
        <div class="flex items-center gap-3 px-4 py-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg text-primary-700 dark:text-primary-300">
          <span class="material-icons text-primary-500">info</span>
          <span>{{ 'leave.approvals.infoBanner' | translate }}</span>
        </div>

        <!-- Table -->
        @if (loading()) {
          <div class="flex justify-center items-center py-24">
            <sw-spinner size="lg" />
          </div>
        } @else if (requests().length === 0) {
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
            <span class="material-icons text-5xl text-success-500 mb-4">check_circle</span>
            <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">{{ 'leave.approvals.allCaughtUp' | translate }}</h3>
            <p class="text-neutral-500 dark:text-neutral-400">{{ 'leave.approvals.noPending' | translate }}</p>
          </div>
        } @else {
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
            <div class="overflow-x-auto">
              <table class="sw-table">
                <thead>
                  <tr>
                    <th>{{ 'employees.title' | translate }}</th>
                    <th>{{ 'leave.table.type' | translate }}</th>
                    <th>{{ 'leave.table.dates' | translate }}</th>
                    <th>{{ 'leave.table.days' | translate }}</th>
                    <th>{{ 'leave.reason' | translate }}</th>
                    <th>{{ 'leave.table.submitted' | translate }}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (request of requests(); track request.id) {
                    <tr>
                      <td>
                        <div class="flex flex-col">
                          <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ request.employee.fullName }}</span>
                          <span class="text-xs text-neutral-500 dark:text-neutral-400">{{ request.employee.employeeNumber }}</span>
                        </div>
                      </td>
                      <td>
                        <div class="flex items-center gap-2">
                          <span class="material-icons text-lg" [style.color]="leaveTypeColorMap[request.leaveType] || '#607D8B'">
                            {{ leaveTypeIconMap[request.leaveType] || 'event' }}
                          </span>
                          <span class="text-neutral-700 dark:text-neutral-300">{{ leaveTypeLabelMap[request.leaveType] || request.leaveType }}</span>
                        </div>
                      </td>
                      <td class="text-neutral-600 dark:text-neutral-400">
                        {{ request.startDate | date:'mediumDate' }} - {{ request.endDate | date:'mediumDate' }}
                      </td>
                      <td>
                        <span class="inline-block px-3 py-1 bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-400 rounded-full text-sm font-medium">
                          {{ request.days }}
                        </span>
                      </td>
                      <td class="max-w-[200px]">
                        <span class="truncate block text-neutral-600 dark:text-neutral-400" [title]="request.reason || 'No reason provided'">
                          {{ request.reason || '-' }}
                        </span>
                      </td>
                      <td class="text-neutral-600 dark:text-neutral-400">{{ request.createdAt | date:'mediumDate' }}</td>
                      <td>
                        <div class="flex items-center gap-2">
                          <button (click)="approve(request)"
                                  [disabled]="processingId() === request.id"
                                  class="w-9 h-9 rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Approve">
                            @if (processingId() === request.id && processingAction() === 'approve') {
                              <sw-spinner size="sm" />
                            } @else {
                              <span class="material-icons text-lg">check</span>
                            }
                          </button>
                          <button (click)="openRejectDialog(request)"
                                  [disabled]="processingId() === request.id"
                                  class="w-9 h-9 rounded-full bg-error-500 text-white flex items-center justify-center hover:bg-error-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Reject">
                            @if (processingId() === request.id && processingAction() === 'reject') {
                              <sw-spinner size="sm" />
                            } @else {
                              <span class="material-icons text-lg">close</span>
                            }
                          </button>
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
                {{ 'leave.pagination.showing' | translate }} {{ (pageIndex() * pageSize) + 1 }} {{ 'leave.pagination.to' | translate }} {{ Math.min((pageIndex() + 1) * pageSize, totalElements()) }} {{ 'leave.pagination.of' | translate }} {{ totalElements() }}
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
                  Page {{ pageIndex() + 1 }} of {{ Math.ceil(totalElements() / pageSize) || 1 }}
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
          </div>
        }

        <!-- Reject Dialog -->
        @if (showRejectDialog()) {
          <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" (click)="closeRejectDialog()">
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-xl p-6 min-w-[400px] max-w-[500px]" (click)="$event.stopPropagation()">
              <div class="flex items-center gap-3 mb-4">
                <span class="material-icons text-2xl text-error-500">cancel</span>
                <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200">{{ 'leave.approvals.rejectTitle' | translate }}</h3>
              </div>
              <div class="mb-4">
                <p class="text-neutral-600 dark:text-neutral-400 mb-3">{{ 'leave.approvals.rejectPrompt' | translate }}</p>
                <div class="flex flex-col gap-1">
                  <label class="sw-label">{{ 'leave.approvals.rejectionReason' | translate }}</label>
                  <textarea [formControl]="rejectReasonControl"
                            rows="3"
                            [placeholder]="'leave.approvals.rejectionPlaceholder' | translate"
                            class="sw-input"></textarea>
                  @if (rejectReasonControl.hasError('required') && rejectReasonControl.touched) {
                    <span class="text-xs text-error-500">{{ 'leave.approvals.reasonRequired' | translate }}</span>
                  }
                  @if (rejectReasonControl.hasError('minlength') && rejectReasonControl.touched) {
                    <span class="text-xs text-error-500">{{ 'leave.approvals.reasonMinLength' | translate }}</span>
                  }
                </div>
              </div>
              <div class="flex justify-end gap-3">
                <button (click)="closeRejectDialog()"
                        class="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-elevated rounded-lg transition-colors">
                  {{ 'common.cancel' | translate }}
                </button>
                <button (click)="confirmReject()"
                        [disabled]="rejectReasonControl.invalid"
                        class="px-4 py-2 bg-error-500 text-white font-medium rounded-lg hover:bg-error-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {{ 'leave.approvals.rejectButton' | translate }}
                </button>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `
})
export class PendingApprovalsComponent implements OnInit {
  private readonly leaveService = inject(LeaveService);
  private readonly toast = inject(ToastService);
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // Expose Math for template use
  Math = Math;

  // Lookup maps for template (avoids function calls on every CD cycle)
  readonly leaveTypeIconMap: Record<LeaveType, string> = {
    ANNUAL: 'beach_access',
    SICK: 'medical_services',
    FAMILY_RESPONSIBILITY: 'family_restroom',
    MATERNITY: 'pregnant_woman',
    PARENTAL: 'child_care',
    UNPAID: 'money_off',
    STUDY: 'school'
  };

  readonly leaveTypeColorMap: Record<LeaveType, string> = {
    ANNUAL: '#4CAF50',
    SICK: '#f44336',
    FAMILY_RESPONSIBILITY: '#9C27B0',
    MATERNITY: '#E91E63',
    PARENTAL: '#00BCD4',
    UNPAID: '#607D8B',
    STUDY: '#FF9800'
  };

  readonly leaveTypeLabelMap: Record<LeaveType, string> = {
    ANNUAL: 'Annual Leave',
    SICK: 'Sick Leave',
    FAMILY_RESPONSIBILITY: 'Family Responsibility',
    MATERNITY: 'Maternity Leave',
    PARENTAL: 'Parental Leave',
    UNPAID: 'Unpaid Leave',
    STUDY: 'Study Leave'
  };

  // Auth state from store
  readonly currentUser = toSignal(this.store.select(selectCurrentUser));
  readonly canApproveLeave = toSignal(this.store.select(selectCanApproveLeave), { initialValue: false });

  // Computed user role display
  readonly currentUserRole = signal('');

  displayedColumns = ['employee', 'leaveType', 'dates', 'days', 'reason', 'submittedAt', 'actions'];

  requests = signal<LeaveRequest[]>([]);
  loading = signal(true);
  totalElements = signal(0);
  pageIndex = signal(0);
  pageSize = 10;

  processingId = signal<string | null>(null);
  processingAction = signal<'approve' | 'reject' | null>(null);

  showRejectDialog = signal(false);
  selectedRequest = signal<LeaveRequest | null>(null);
  rejectReasonControl = new FormControl('', [Validators.required, Validators.minLength(10)]);

  ngOnInit(): void {
    // Update user role display
    const user = this.currentUser();
    if (user?.roles?.length) {
      const roleLabels: Record<string, string> = {
        'ADMIN': 'Administrator',
        'HR_ADMIN': 'HR Admin',
        'HR_MANAGER': 'HR Manager',
        'MANAGER': 'Manager',
        'DEPARTMENT_HEAD': 'Department Head'
      };
      const displayRole = user.roles.find(r => roleLabels[r]);
      this.currentUserRole.set(displayRole ? roleLabels[displayRole] : user.roles[0]);
    }

    // Only load data if user has permission
    if (this.canApproveLeave()) {
      this.loadPendingRequests();
    }
  }

  loadPendingRequests(): void {
    this.loading.set(true);
    this.leaveService.getPendingApprovals(this.pageIndex(), this.pageSize).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.requests.set(response.content);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Failed to load pending requests');
      }
    });
  }

  goToPage(page: number): void {
    if (page < 0 || page * this.pageSize >= this.totalElements()) return;
    this.pageIndex.set(page);
    this.loadPendingRequests();
  }

  approve(request: LeaveRequest): void {
    this.processingId.set(request.id);
    this.processingAction.set('approve');

    this.leaveService.approveLeaveRequest(request.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.processingId.set(null);
        this.processingAction.set(null);
        this.toast.success('Leave request approved');
        this.loadPendingRequests();
      },
      error: () => {
        this.processingId.set(null);
        this.processingAction.set(null);
        this.toast.error('Failed to approve request');
      }
    });
  }

  openRejectDialog(request: LeaveRequest): void {
    this.selectedRequest.set(request);
    this.rejectReasonControl.reset();
    this.showRejectDialog.set(true);
  }

  closeRejectDialog(): void {
    this.showRejectDialog.set(false);
    this.selectedRequest.set(null);
  }

  confirmReject(): void {
    const request = this.selectedRequest();
    if (!request || this.rejectReasonControl.invalid) {
      this.rejectReasonControl.markAsTouched();
      return;
    }

    this.processingId.set(request.id);
    this.processingAction.set('reject');
    this.closeRejectDialog();

    this.leaveService.rejectLeaveRequest(request.id, this.rejectReasonControl.value!).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.processingId.set(null);
        this.processingAction.set(null);
        this.toast.success('Leave request rejected');
        this.loadPendingRequests();
      },
      error: () => {
        this.processingId.set(null);
        this.processingAction.set(null);
        this.toast.error('Failed to reject request');
      }
    });
  }

  getLeaveTypeIcon(type: LeaveType): string {
    const icons: Record<LeaveType, string> = {
      ANNUAL: 'beach_access',
      SICK: 'medical_services',
      FAMILY_RESPONSIBILITY: 'family_restroom',
      MATERNITY: 'pregnant_woman',
      PARENTAL: 'child_care',
      UNPAID: 'money_off',
      STUDY: 'school'
    };
    return icons[type] || 'event';
  }

  getLeaveTypeLabel(type: LeaveType): string {
    return LeaveService.getLeaveTypeLabel(type);
  }

  getLeaveTypeColor(type: LeaveType): string {
    const colors: Record<LeaveType, string> = {
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
}
