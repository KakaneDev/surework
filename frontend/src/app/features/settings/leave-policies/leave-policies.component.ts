import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { SettingsService, LeaveType } from '@core/services/settings.service';
import { SpinnerComponent, ToastService, ButtonComponent, BadgeComponent, DropdownComponent, DropdownItemComponent, DropdownDividerComponent } from '@shared/ui';
import { LeavePolicyFormDialogComponent } from './leave-policy-form-dialog.component';

@Component({
  selector: 'app-leave-policies',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    SpinnerComponent,
    ButtonComponent,
    BadgeComponent,
    DropdownComponent,
    DropdownItemComponent,
    DropdownDividerComponent,
    LeavePolicyFormDialogComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
        <div class="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{{ 'settings.leavePolicies.title' | translate }}</h2>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{{ 'settings.leavePolicies.description' | translate }}</p>
          </div>
          <button
            type="button"
            (click)="openFormDialog()"
            class="sw-btn sw-btn-primary sw-btn-md"
          >
            <span class="material-icons text-sm">add</span>
            <span>{{ 'settings.leavePolicies.addLeaveType' | translate }}</span>
          </button>
        </div>
      </div>

      <!-- Leave Types Table -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
        @if (loading()) {
          <div class="flex flex-col items-center justify-center py-16 gap-4">
            <sw-spinner size="lg" />
            <p class="text-neutral-500 dark:text-neutral-400">{{ 'settings.leavePolicies.loading' | translate }}</p>
          </div>
        } @else if (leaveTypes().length === 0) {
          <div class="flex flex-col items-center justify-center py-16 gap-4">
            <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600">event_busy</span>
            <p class="text-neutral-500 dark:text-neutral-400">{{ 'settings.leavePolicies.noLeaveTypes' | translate }}</p>
            <button
              type="button"
              (click)="openFormDialog()"
              class="sw-btn sw-btn-primary sw-btn-md"
            >
              <span class="material-icons text-sm">add</span>
              <span>{{ 'settings.leavePolicies.addFirstLeaveType' | translate }}</span>
            </button>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="sw-table">
              <thead>
                <tr>
                  <th class="text-left">{{ 'settings.leavePolicies.tableHeaders.leaveType' | translate }}</th>
                  <th class="text-center">{{ 'settings.leavePolicies.tableHeaders.defaultDays' | translate }}</th>
                  <th class="text-center">{{ 'settings.leavePolicies.tableHeaders.carryForward' | translate }}</th>
                  <th class="text-center">{{ 'settings.leavePolicies.tableHeaders.approval' | translate }}</th>
                  <th class="text-center">{{ 'settings.leavePolicies.tableHeaders.status' | translate }}</th>
                  <th class="text-right">{{ 'settings.leavePolicies.tableHeaders.actions' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                @for (leaveType of leaveTypes(); track leaveType.id) {
                  <tr>
                    <td>
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                          <span class="material-icons text-primary-600 dark:text-primary-400">event_available</span>
                        </div>
                        <div>
                          <p class="font-medium text-neutral-800 dark:text-neutral-100">{{ leaveType.name }}</p>
                          <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ leaveType.code }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="text-center">
                      <span class="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{{ leaveType.defaultDays }}</span>
                      <span class="text-sm text-neutral-500 dark:text-neutral-400"> {{ 'settings.leavePolicies.days' | translate }}</span>
                    </td>
                    <td class="text-center">
                      @if (leaveType.carryForwardDays > 0) {
                        <span class="text-neutral-800 dark:text-neutral-100">{{ leaveType.carryForwardDays }} {{ 'settings.leavePolicies.days' | translate }}</span>
                      } @else {
                        <span class="text-neutral-400">{{ 'settings.leavePolicies.none' | translate }}</span>
                      }
                    </td>
                    <td class="text-center">
                      @if (leaveType.requiresApproval) {
                        <span class="inline-flex items-center gap-1 text-success-600 dark:text-success-400">
                          <span class="material-icons text-sm">check_circle</span>
                          {{ 'settings.leavePolicies.required' | translate }}
                        </span>
                      } @else {
                        <span class="inline-flex items-center gap-1 text-neutral-400">
                          <span class="material-icons text-sm">remove_circle_outline</span>
                          {{ 'settings.leavePolicies.auto' | translate }}
                        </span>
                      }
                    </td>
                    <td class="text-center">
                      <sw-badge [variant]="leaveType.status === 'ACTIVE' ? 'success' : 'neutral'" [dot]="true">
                        {{ leaveType.status === 'ACTIVE' ? ('settings.leavePolicies.active' | translate) : ('settings.leavePolicies.inactive' | translate) }}
                      </sw-badge>
                    </td>
                    <td class="text-right">
                      <sw-dropdown position="bottom-end">
                        <button
                          trigger
                          type="button"
                          class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors"
                        >
                          <span class="material-icons text-neutral-500">more_vert</span>
                        </button>
                        <sw-dropdown-item (click)="openFormDialog(leaveType)">
                          <span class="material-icons text-sm">edit</span>
                          <span>{{ 'settings.leavePolicies.edit' | translate }}</span>
                        </sw-dropdown-item>
                        <sw-dropdown-divider></sw-dropdown-divider>
                        @if (leaveType.status === 'ACTIVE') {
                          <sw-dropdown-item (click)="deactivateLeaveType(leaveType)" variant="danger">
                            <span class="material-icons text-sm">block</span>
                            <span>{{ 'settings.leavePolicies.deactivate' | translate }}</span>
                          </sw-dropdown-item>
                        } @else {
                          <sw-dropdown-item (click)="activateLeaveType(leaveType)">
                            <span class="material-icons text-sm">check_circle</span>
                            <span>{{ 'settings.leavePolicies.activate' | translate }}</span>
                          </sw-dropdown-item>
                        }
                      </sw-dropdown>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Info Card -->
      <div class="bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800 p-6">
        <div class="flex items-start gap-4">
          <span class="material-icons text-primary-600 dark:text-primary-400">info</span>
          <div>
            <h3 class="font-semibold text-primary-800 dark:text-primary-200">{{ 'settings.leavePolicies.aboutTitle' | translate }}</h3>
            <ul class="mt-2 text-sm text-primary-700 dark:text-primary-300 space-y-1">
              <li><strong>{{ 'settings.leavePolicies.info.defaultDays' | translate }}:</strong> {{ 'settings.leavePolicies.info.defaultDaysDesc' | translate }}</li>
              <li><strong>{{ 'settings.leavePolicies.info.carryForward' | translate }}:</strong> {{ 'settings.leavePolicies.info.carryForwardDesc' | translate }}</li>
              <li><strong>{{ 'settings.leavePolicies.info.approvalRequired' | translate }}:</strong> {{ 'settings.leavePolicies.info.approvalRequiredDesc' | translate }}</li>
              <li><strong>{{ 'settings.leavePolicies.info.negativeBalance' | translate }}:</strong> {{ 'settings.leavePolicies.info.negativeBalanceDesc' | translate }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Form Dialog -->
    @if (showFormDialog()) {
      <app-leave-policy-form-dialog
        [leaveType]="selectedLeaveType()"
        (close)="closeFormDialog()"
        (saved)="onLeaveTypeSaved($event)"
      ></app-leave-policy-form-dialog>
    }
  `
})
export class LeavePoliciesComponent implements OnInit {
  private readonly settingsService = inject(SettingsService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  loading = signal(true);
  leaveTypes = signal<LeaveType[]>([]);

  showFormDialog = signal(false);
  selectedLeaveType = signal<LeaveType | null>(null);

  ngOnInit(): void {
    this.loadLeaveTypes();
  }

  private loadLeaveTypes(): void {
    this.loading.set(true);

    this.settingsService.getLeaveTypes().pipe(
      catchError(err => {
        console.error('Error loading leave types:', err);
        this.toast.error(this.translate.instant('settings.leavePolicies.errors.failedToLoad'));
        return of([]);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe(types => {
      this.leaveTypes.set(types);
    });
  }

  openFormDialog(leaveType: LeaveType | null = null): void {
    this.selectedLeaveType.set(leaveType);
    this.showFormDialog.set(true);
  }

  closeFormDialog(): void {
    this.showFormDialog.set(false);
    this.selectedLeaveType.set(null);
  }

  onLeaveTypeSaved(leaveType: LeaveType): void {
    this.closeFormDialog();
    this.loadLeaveTypes();
  }

  activateLeaveType(leaveType: LeaveType): void {
    this.settingsService.activateLeaveType(leaveType.id).pipe(
      catchError(err => {
        console.error('Error activating leave type:', err);
        this.toast.error(this.translate.instant('settings.leavePolicies.errors.failedToActivate'));
        return of(null);
      })
    ).subscribe(result => {
      if (result) {
        this.toast.success(this.translate.instant('settings.leavePolicies.messages.activated'));
        this.loadLeaveTypes();
      }
    });
  }

  deactivateLeaveType(leaveType: LeaveType): void {
    this.settingsService.deactivateLeaveType(leaveType.id).pipe(
      catchError(err => {
        console.error('Error deactivating leave type:', err);
        this.toast.error(this.translate.instant('settings.leavePolicies.errors.failedToDeactivate'));
        return of(null);
      })
    ).subscribe(result => {
      if (result) {
        this.toast.success(this.translate.instant('settings.leavePolicies.messages.deactivated'));
        this.loadLeaveTypes();
      }
    });
  }
}
