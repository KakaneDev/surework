import {
  Component,
  inject,
  OnInit,
  signal,
  output,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LeaveService, LeaveRequest, LeaveType } from '@core/services/leave.service';
import { ToastService } from '@shared/ui';
import { SpinnerComponent } from '@shared/ui';

/**
 * Compact pending approvals table for embedding in the admin dashboard.
 * Shows pending leave requests with approve/reject actions.
 */
@Component({
  selector: 'app-admin-pending-approvals',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    SpinnerComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div class="flex justify-center py-8">
        <sw-spinner size="md" />
      </div>
    } @else {
      <div class="overflow-x-auto">
        <table class="sw-table">
          <thead>
            <tr>
              <th>{{ 'leave.admin.pendingApprovals.employee' | translate }}</th>
              <th>{{ 'leave.admin.pendingApprovals.type' | translate }}</th>
              <th>{{ 'leave.admin.pendingApprovals.dates' | translate }}</th>
              <th>{{ 'leave.admin.pendingApprovals.days' | translate }}</th>
              <th>{{ 'leave.admin.pendingApprovals.actions' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (request of requests(); track request.id) {
              <tr>
                <td>
                  <div class="flex flex-col">
                    <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ request.employee.fullName }}</span>
                    <span class="text-xs text-neutral-500">{{ request.employee.employeeNumber }}</span>
                  </div>
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <span class="material-icons text-lg" [style.color]="getLeaveTypeColor(request.leaveType)">
                      {{ getLeaveTypeIcon(request.leaveType) }}
                    </span>
                    <span class="text-sm">{{ getLeaveTypeLabel(request.leaveType) | translate }}</span>
                  </div>
                </td>
                <td class="text-sm text-neutral-600 dark:text-neutral-400">
                  {{ request.startDate | date:'mediumDate' }} - {{ request.endDate | date:'mediumDate' }}
                </td>
                <td>
                  <span class="inline-block px-2.5 py-1 bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400 rounded-full text-xs font-medium">
                    {{ request.days }}
                  </span>
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <button type="button" (click)="approve(request)"
                            [disabled]="processingId() === request.id"
                            [title]="'leave.admin.pendingApprovals.approveTitle' | translate"
                            class="w-8 h-8 inline-flex items-center justify-center rounded-full bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      @if (processingId() === request.id && processingAction() === 'approve') {
                        <sw-spinner size="sm" />
                      } @else {
                        <span class="material-icons text-lg">check</span>
                      }
                    </button>
                    <button type="button" (click)="openRejectDialog(request)"
                            [disabled]="processingId() === request.id"
                            [title]="'leave.admin.pendingApprovals.rejectTitle' | translate"
                            class="w-8 h-8 inline-flex items-center justify-center rounded-full bg-error-500 text-white hover:bg-error-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      @if (processingId() === request.id && processingAction() === 'reject') {
                        <sw-spinner size="sm" />
                      } @else {
                        <span class="material-icons text-lg">close</span>
                      }
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="text-center py-8">
                  <div class="flex flex-col items-center gap-2 text-neutral-500">
                    <span class="material-icons text-3xl text-success-400">check_circle</span>
                    <span>{{ 'leave.admin.pendingApprovals.noPendingRequests' | translate }}</span>
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
            {{ 'leave.admin.pendingApprovals.showing' | translate: { from: pageIndex() * pageSize + 1, to: Math.min((pageIndex() + 1) * pageSize, totalElements()), total: totalElements() } }}
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

      <!-- Reject Dialog -->
      @if (showRejectDialog()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" (click)="closeRejectDialog()">
          <div class="bg-white dark:bg-dark-surface rounded-xl p-6 w-[450px] max-w-[90vw] shadow-xl" (click)="$event.stopPropagation()">
            <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2 mb-4">
              <span class="material-icons text-error-500">cancel</span>
              {{ 'leave.admin.pendingApprovals.rejectLeaveRequest' | translate }}
            </h3>

            <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-4">{{ 'leave.admin.pendingApprovals.provideReason' | translate }}</p>

            <div>
              <label class="sw-label">{{ 'leave.admin.pendingApprovals.rejectionReason' | translate }}</label>
              <textarea [formControl]="rejectReasonControl" class="sw-input w-full" rows="3"
                        [placeholder]="'leave.admin.pendingApprovals.enterReasonPlaceholder' | translate"
                        [class.border-error-500]="rejectReasonControl.touched && rejectReasonControl.invalid"></textarea>
              @if (rejectReasonControl.hasError('required') && rejectReasonControl.touched) {
                <p class="text-sm text-error-500 mt-1">{{ 'leave.admin.pendingApprovals.reasonRequired' | translate }}</p>
              }
              @if (rejectReasonControl.hasError('minlength')) {
                <p class="text-sm text-error-500 mt-1">{{ 'leave.admin.pendingApprovals.reasonMinLength' | translate }}</p>
              }
            </div>

            <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-dark-border">
              <button type="button" (click)="closeRejectDialog()"
                      class="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-elevated rounded-lg transition-colors">
                {{ 'leave.admin.pendingApprovals.cancel' | translate }}
              </button>
              <button type="button" (click)="confirmReject()" [disabled]="rejectReasonControl.invalid"
                      class="inline-flex items-center gap-2 px-4 py-2 bg-error-500 text-white font-medium rounded-lg hover:bg-error-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {{ 'leave.admin.pendingApprovals.rejectRequest' | translate }}
              </button>
            </div>
          </div>
        </div>
      }
    }
  `
})
export class AdminPendingApprovalsComponent implements OnInit {
  private readonly leaveService = inject(LeaveService);
  private readonly toastService = inject(ToastService);
  private readonly translate = inject(TranslateService);

  Math = Math;

  /** Emitted when a request is approved or rejected */
  requestProcessed = output<void>();

  requests = signal<LeaveRequest[]>([]);
  loading = signal(true);
  totalElements = signal(0);
  pageIndex = signal(0);
  pageSize = 5;

  processingId = signal<string | null>(null);
  processingAction = signal<'approve' | 'reject' | null>(null);

  showRejectDialog = signal(false);
  selectedRequest = signal<LeaveRequest | null>(null);
  rejectReasonControl = new FormControl('', [Validators.required, Validators.minLength(10)]);

  ngOnInit(): void {
    this.loadPendingRequests();
  }

  loadPendingRequests(): void {
    this.loading.set(true);
    this.leaveService.getPendingApprovals(this.pageIndex(), this.pageSize).subscribe({
      next: (response) => {
        this.requests.set(response.content);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  /** Get pending count for display in parent component */
  getPendingCount(): number {
    return this.totalElements();
  }

  goToPage(page: number): void {
    this.pageIndex.set(page);
    this.loadPendingRequests();
  }

  approve(request: LeaveRequest): void {
    this.processingId.set(request.id);
    this.processingAction.set('approve');

    this.leaveService.approveLeaveRequest(request.id).subscribe({
      next: () => {
        this.processingId.set(null);
        this.processingAction.set(null);
        this.toastService.success(this.translate.instant('leave.admin.pendingApprovals.approveSuccess'));
        this.loadPendingRequests();
        this.requestProcessed.emit();
      },
      error: () => {
        this.processingId.set(null);
        this.processingAction.set(null);
        this.toastService.error(this.translate.instant('leave.admin.pendingApprovals.approveFailed'));
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

    this.leaveService.rejectLeaveRequest(request.id, this.rejectReasonControl.value!).subscribe({
      next: () => {
        this.processingId.set(null);
        this.processingAction.set(null);
        this.toastService.success(this.translate.instant('leave.admin.pendingApprovals.rejectSuccess'));
        this.loadPendingRequests();
        this.requestProcessed.emit();
      },
      error: () => {
        this.processingId.set(null);
        this.processingAction.set(null);
        this.toastService.error(this.translate.instant('leave.admin.pendingApprovals.rejectFailed'));
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
