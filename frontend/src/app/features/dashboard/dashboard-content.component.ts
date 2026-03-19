import { Component, inject, ChangeDetectionStrategy, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { selectUserPermissions } from '@core/store/auth/auth.selectors';
import {
  DashboardService,
  DashboardStats,
  UpcomingInterview,
  RecentCandidate,
  LeaveRequestSummary,
  PipelineStage
} from '@core/services/dashboard.service';
import { LeaveService, LeaveBalance, LeaveRequest } from '@core/services/leave.service';
import { PayrollService, PayslipSummary } from '@core/services/payroll.service';
import {
  CardComponent,
  SpinnerComponent,
  BadgeComponent,
  ButtonComponent,
  getLeaveTypeConfig,
  getLeaveStatusConfig,
  getInterviewTypeConfig,
  getApplicationStageConfig
} from '@shared/ui';
import { HasPermissionDirective } from '@shared/directives';
import { OrgChartWidgetComponent } from './widgets/org-chart-widget.component';
import { SetupBannerComponent } from './widgets/setup-banner.component';

@Component({
  selector: 'app-dashboard-content',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    CardComponent,
    SpinnerComponent,
    BadgeComponent,
    ButtonComponent,
    HasPermissionDirective,
    OrgChartWidgetComponent,
    SetupBannerComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Setup Completion Banner -->
      <app-setup-banner />

      <!-- Page Header -->
      <div class="sw-page-header">
        <div>
          <h1 class="sw-page-title">{{ 'dashboard.title' | translate }}</h1>
          <p class="sw-page-description">{{ 'dashboard.subtitle' | translate }}</p>
        </div>
        <div class="flex gap-3">
          <sw-button *hasPermission="['EMPLOYEE_CREATE', 'EMPLOYEE_MANAGE']" variant="outline" size="md" routerLink="/employees/new">
            <span class="material-icons text-lg mr-1.5" aria-hidden="true">person_add</span>
            {{ 'dashboard.actions.addEmployee' | translate }}
          </sw-button>
          <sw-button *hasPermission="['RECRUITMENT_MANAGE']" variant="primary" size="md" routerLink="/recruitment/jobs/new">
            <span class="material-icons text-lg mr-1.5" aria-hidden="true">work</span>
            {{ 'dashboard.actions.postJob' | translate }}
          </sw-button>
        </div>
      </div>

      <!-- Quick Links Section -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        @for (link of quickLinks(); track link.route) {
          <a
            [routerLink]="link.route"
            class="group flex flex-col items-center gap-3 p-4 rounded-xl bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border hover:border-primary-500 hover:shadow-card-hover transition-all"
            [attr.aria-label]="'Go to ' + link.label"
          >
            <span class="material-icons text-3xl text-neutral-400 group-hover:text-primary-500 transition-colors" aria-hidden="true">
              {{ link.icon }}
            </span>
            <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300 text-center">
              {{ link.label }}
            </span>
          </a>
        }
      </div>

      <!-- EMPLOYEE WIDGETS (shown only to regular employees) -->
      @if (isEmployee()) {
        <!-- Leave Balances Row - Gradient Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @if (loadingMyLeave()) {
            @for (i of [1, 2, 3]; track i) {
              <div class="rounded-xl p-5 bg-neutral-100 dark:bg-dark-surface animate-pulse h-[120px]" role="status" aria-label="Loading leave balance"></div>
            }
          } @else if (myLeaveBalances().length === 0) {
            <div class="col-span-full sw-card text-center py-8">
              <span class="material-icons text-4xl text-neutral-300 mb-2" aria-hidden="true">event_busy</span>
              <p class="text-neutral-500">{{ 'dashboard.leave.noBalancesAvailable' | translate }}</p>
            </div>
          } @else {
            @for (balance of myLeaveBalances(); track balance.leaveType) {
              <div class="rounded-xl p-5 text-white shadow-lg" [style.background]="getLeaveGradient(balance.leaveType)" role="region" [attr.aria-label]="getLeaveTypeLabel(balance.leaveType) + ' leave balance'">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-sm font-medium opacity-90">{{ getLeaveTypeLabel(balance.leaveType) | translate }}</span>
                  <span class="material-icons text-lg opacity-80" aria-hidden="true">{{ getLeaveIcon(balance.leaveType) }}</span>
                </div>
                <div class="flex items-baseline gap-2 mb-2">
                  <span class="text-3xl font-bold">{{ balance.available }}</span>
                  <span class="text-sm opacity-90">{{ 'dashboard.leave.daysAvailable' | translate }}</span>
                </div>
                <div class="flex justify-between text-xs opacity-85 mb-2">
                  <span>{{ 'dashboard.leave.entitlement' | translate }}: {{ balance.entitlement }}</span>
                  <span>{{ 'dashboard.leave.used' | translate }}: {{ balance.used }}</span>
                  @if (balance.pending > 0) {
                    <span>{{ 'dashboard.leave.pending' | translate }}: {{ balance.pending }}</span>
                  }
                </div>
                <div class="h-1.5 bg-white/30 rounded-full overflow-hidden">
                  <div class="h-full bg-white/90 rounded-full" [style.width.%]="getUsagePercentage(balance)"></div>
                </div>
              </div>
            }
          }
        </div>

        <!-- Employee Widgets Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- My Recent Leave Requests -->
          <div class="sw-card">
            <div class="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-200 dark:border-dark-border">
              <div class="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                <span class="material-icons" aria-hidden="true">event_note</span>
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">{{ 'dashboard.widgets.myLeaveRequests' | translate }}</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'dashboard.leave.recentRequestsStatus' | translate }}</p>
              </div>
              <a routerLink="/leave" class="text-sm font-medium text-primary-500 hover:text-primary-600">{{ 'dashboard.actions.viewAll' | translate }}</a>
            </div>
            <div class="min-h-[180px]">
              @if (myLeaveRequests().length === 0) {
                <div class="sw-empty-state py-6">
                  <span class="material-icons text-4xl text-neutral-300 mb-2" aria-hidden="true">beach_access</span>
                  <p class="sw-empty-state-title">{{ 'dashboard.leave.noRequestsYet' | translate }}</p>
                  <p class="sw-empty-state-description">{{ 'dashboard.leave.submitRequestToSee' | translate }}</p>
                </div>
              } @else {
                <div class="space-y-2">
                  @for (request of myLeaveRequests().slice(0, 5); track request.id) {
                    <div class="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-dark-elevated">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                          <sw-badge [variant]="getStatusBadgeVariant(request.status)" size="sm">{{ request.status }}</sw-badge>
                          <sw-badge [variant]="getLeaveBadgeVariant(request.leaveType)" size="sm">{{ getLeaveTypeLabel(request.leaveType) | translate }}</sw-badge>
                        </div>
                        <p class="text-sm text-neutral-500 mt-1">
                          {{ formatDate(request.startDate) }} - {{ formatDate(request.endDate) }}
                          <span class="text-neutral-400">({{ request.days }} day{{ request.days !== 1 ? 's' : '' }})</span>
                        </p>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
            <div class="mt-4 pt-4 border-t border-neutral-200 dark:border-dark-border">
              <sw-button variant="primary" size="sm" routerLink="/leave">
                <span class="material-icons text-lg mr-1" aria-hidden="true">add</span>
                {{ 'dashboard.actions.requestLeave' | translate }}
              </sw-button>
            </div>
          </div>

          <!-- My Payslips -->
          <div class="sw-card">
            <div class="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-200 dark:border-dark-border">
              <div class="p-2 rounded-lg bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400">
                <span class="material-icons" aria-hidden="true">receipt_long</span>
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">{{ 'dashboard.widgets.myPayslips' | translate }}</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'dashboard.payslips.recentPayslips' | translate }}</p>
              </div>
              <a routerLink="/my-payslips" class="text-sm font-medium text-primary-500 hover:text-primary-600">{{ 'dashboard.actions.viewAll' | translate }}</a>
            </div>
            <div class="min-h-[180px]">
              @if (loadingMyPayslips()) {
                <div class="flex justify-center items-center h-[150px]">
                  <sw-spinner size="md" />
                </div>
              } @else if (myPayslips().length === 0) {
                <div class="sw-empty-state py-6">
                  <span class="material-icons text-4xl text-neutral-300 mb-2" aria-hidden="true">payments</span>
                  <p class="sw-empty-state-title">{{ 'dashboard.payslips.noPayslipsAvailable' | translate }}</p>
                  <p class="sw-empty-state-description">{{ 'dashboard.payslips.payslipsWillAppear' | translate }}</p>
                </div>
              } @else {
                <div class="space-y-2">
                  @for (payslip of myPayslips(); track payslip.id) {
                    <div class="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-dark-elevated">
                      <div class="flex-1 min-w-0">
                        <p class="font-medium text-neutral-900 dark:text-neutral-100">{{ getPayslipPeriod(payslip) }}</p>
                        <p class="text-sm text-neutral-500">{{ 'dashboard.payslips.net' | translate }}: {{ formatCurrency(payslip.netPay) }}</p>
                      </div>
                      <sw-badge [variant]="getPayslipStatusVariant(payslip.status)" size="sm">{{ payslip.status }}</sw-badge>
                    </div>
                  }
                </div>
              }
            </div>
            <div class="mt-4 pt-4 border-t border-neutral-200 dark:border-dark-border">
              <sw-button variant="outline" size="sm" routerLink="/my-payslips">
                <span class="material-icons text-lg mr-1" aria-hidden="true">folder_open</span>
                {{ 'dashboard.actions.viewAllPayslips' | translate }}
              </sw-button>
            </div>
          </div>
        </div>
      }

      <!-- Stats Cards Row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Employees Card -->
        <a
          *hasPermission="['EMPLOYEE_READ', 'EMPLOYEE_MANAGE']"
          routerLink="/employees"
          class="sw-card hover:shadow-card-hover cursor-pointer transition-all group"
        >
          <div class="flex items-center gap-4">
            <div class="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
              <span class="material-icons text-2xl" aria-hidden="true">people</span>
            </div>
            <div class="flex-1">
              <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'dashboard.stats.employees' | translate }}</p>
              <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {{ stats()?.employeeCount ?? '--' }}
              </p>
            </div>
          </div>
          <p class="mt-3 text-sm text-neutral-500 dark:text-neutral-400">{{ 'dashboard.stats.totalActiveEmployees' | translate }}</p>
        </a>

        <!-- Leave Requests Card -->
        <a
          *hasPermission="['LEAVE_APPROVE', 'LEAVE_MANAGE']"
          routerLink="/leave/pending"
          class="sw-card hover:shadow-card-hover cursor-pointer transition-all group"
        >
          <div class="flex items-center gap-4">
            <div class="p-3 rounded-xl bg-warning-50 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400">
              <span class="material-icons text-2xl" aria-hidden="true">event_busy</span>
            </div>
            <div class="flex-1">
              <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'dashboard.stats.leaveRequests' | translate }}</p>
              <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {{ pendingLeaveRequests().length }}
              </p>
            </div>
          </div>
          <p class="mt-3 text-sm text-neutral-500 dark:text-neutral-400">{{ 'dashboard.stats.pendingApprovals' | translate }}</p>
        </a>

        <!-- Payroll Card -->
        <div *hasPermission="['PAYROLL_READ', 'PAYROLL_MANAGE']" class="sw-card">
          <div class="flex items-center gap-4">
            <div class="p-3 rounded-xl bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400">
              <span class="material-icons text-2xl" aria-hidden="true">payments</span>
            </div>
            <div class="flex-1">
              <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'dashboard.stats.payroll' | translate }}</p>
              <p class="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {{ stats()?.nextPayrollDate ?? '--' }}
              </p>
            </div>
          </div>
          <p class="mt-3 text-sm text-neutral-500 dark:text-neutral-400">{{ 'dashboard.stats.nextRunDate' | translate }}</p>
        </div>

        <!-- Open Positions Card -->
        <a
          *hasPermission="['RECRUITMENT_READ', 'RECRUITMENT_MANAGE']"
          routerLink="/recruitment"
          class="sw-card hover:shadow-card-hover cursor-pointer transition-all group"
        >
          <div class="flex items-center gap-4">
            <div class="p-3 rounded-xl bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400">
              <span class="material-icons text-2xl" aria-hidden="true">work</span>
            </div>
            <div class="flex-1">
              <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'dashboard.stats.openPositions' | translate }}</p>
              <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {{ stats()?.openJobPostings ?? '--' }}
              </p>
            </div>
          </div>
          <p class="mt-3 text-sm text-neutral-500 dark:text-neutral-400">{{ 'dashboard.stats.activeJobPostings' | translate }}</p>
        </a>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Upcoming Interviews Widget -->
        <div *hasPermission="['RECRUITMENT_READ', 'RECRUITMENT_MANAGE']" class="sw-card">
          <div class="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-200 dark:border-dark-border">
            <div class="p-2 rounded-lg bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400">
              <span class="material-icons" aria-hidden="true">event</span>
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">{{ 'dashboard.widgets.upcomingInterviews' | translate }}</h3>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'dashboard.interviews.nextScheduled' | translate }}</p>
            </div>
          </div>

          <div class="min-h-[200px]">
            @if (loadingInterviews()) {
              <div class="flex justify-center items-center h-[150px]">
                <sw-spinner size="md" />
              </div>
            } @else if (upcomingInterviews().length === 0) {
              <div class="sw-empty-state">
                <span class="material-icons sw-empty-state-icon" aria-hidden="true">event_available</span>
                <p class="sw-empty-state-title">{{ 'dashboard.interviews.noUpcomingInterviews' | translate }}</p>
                <p class="sw-empty-state-description">{{ 'dashboard.interviews.scheduleToSee' | translate }}</p>
              </div>
            } @else {
              <div class="space-y-3">
                @for (interview of upcomingInterviews().slice(0, 5); track interview.id) {
                  <button
                    type="button"
                    (click)="navigateTo('/recruitment/candidates/' + interview.candidateId)"
                    class="w-full flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-dark-elevated hover:bg-neutral-100 dark:hover:bg-dark-border cursor-pointer transition-colors text-left"
                    [attr.aria-label]="'View interview with ' + interview.candidateName + ' for ' + interview.jobTitle"
                  >
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {{ interview.candidateName }}
                      </p>
                      <p class="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                        {{ interview.jobTitle }}
                      </p>
                    </div>
                    <div class="flex flex-col items-end gap-1 ml-4">
                      <sw-badge [variant]="getInterviewBadgeVariant(interview.interviewType)" size="sm">
                        {{ getInterviewTypeLabel(interview.interviewType) | translate }}
                      </sw-badge>
                      <span class="text-xs text-neutral-500 dark:text-neutral-400">
                        {{ formatInterviewTime(interview.scheduledAt) }}
                      </span>
                    </div>
                  </button>
                }
              </div>
            }
          </div>

          <div class="mt-4 pt-4 border-t border-neutral-200 dark:border-dark-border">
            <a routerLink="/recruitment/interviews" class="text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors">
              {{ 'dashboard.actions.viewAllInterviews' | translate }} →
            </a>
          </div>
        </div>

        <!-- Recent Candidates Widget -->
        <div *hasPermission="['RECRUITMENT_READ', 'RECRUITMENT_MANAGE']" class="sw-card">
          <div class="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-200 dark:border-dark-border">
            <div class="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
              <span class="material-icons" aria-hidden="true">person_search</span>
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">{{ 'dashboard.widgets.recentCandidates' | translate }}</h3>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'dashboard.candidates.newlyAdded' | translate }}</p>
            </div>
          </div>

          <div class="min-h-[200px]">
            @if (loadingCandidates()) {
              <div class="flex justify-center items-center h-[150px]">
                <sw-spinner size="md" />
              </div>
            } @else if (recentCandidates().length === 0) {
              <div class="sw-empty-state">
                <span class="material-icons sw-empty-state-icon" aria-hidden="true">person_add</span>
                <p class="sw-empty-state-title">{{ 'dashboard.candidates.noCandidatesYet' | translate }}</p>
                <p class="sw-empty-state-description">{{ 'dashboard.candidates.addToTrack' | translate }}</p>
              </div>
            } @else {
              <div class="space-y-3">
                @for (candidate of recentCandidates(); track candidate.id) {
                  <button
                    type="button"
                    (click)="navigateTo('/recruitment/candidates/' + candidate.id)"
                    class="w-full flex items-center gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-dark-elevated hover:bg-neutral-100 dark:hover:bg-dark-border cursor-pointer transition-colors text-left"
                    [attr.aria-label]="'View candidate ' + candidate.fullName"
                  >
                    <div class="sw-avatar sw-avatar-sm" aria-hidden="true">
                      {{ getInitials(candidate.fullName) }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {{ candidate.fullName }}
                      </p>
                      <p class="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                        {{ candidate.currentJobTitle || ('dashboard.candidates.notSpecified' | translate) }}
                      </p>
                    </div>
                    <span class="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                      {{ formatDate(candidate.createdAt) }}
                    </span>
                  </button>
                }
              </div>
            }
          </div>

          <div class="mt-4 pt-4 border-t border-neutral-200 dark:border-dark-border">
            <a routerLink="/recruitment/candidates" class="text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors">
              {{ 'dashboard.actions.viewAllCandidates' | translate }} →
            </a>
          </div>
        </div>

        <!-- Pending Leave Requests Widget -->
        <div *hasPermission="['LEAVE_APPROVE', 'LEAVE_MANAGE']" class="sw-card">
          <div class="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-200 dark:border-dark-border">
            <div class="p-2 rounded-lg bg-warning-50 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400">
              <span class="material-icons" aria-hidden="true">pending_actions</span>
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">{{ 'dashboard.widgets.pendingLeaveRequests' | translate }}</h3>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'dashboard.pendingLeave.awaitingApproval' | translate }}</p>
            </div>
          </div>

          <div class="min-h-[200px]">
            @if (loadingLeave()) {
              <div class="flex justify-center items-center h-[150px]">
                <sw-spinner size="md" />
              </div>
            } @else if (pendingLeaveRequests().length === 0) {
              <div class="sw-empty-state">
                <span class="material-icons sw-empty-state-icon" aria-hidden="true">check_circle</span>
                <p class="sw-empty-state-title">{{ 'dashboard.pendingLeave.noPendingRequests' | translate }}</p>
                <p class="sw-empty-state-description">{{ 'dashboard.pendingLeave.allProcessed' | translate }}</p>
              </div>
            } @else {
              <div class="space-y-3">
                @for (request of pendingLeaveRequests(); track request.id) {
                  <button
                    type="button"
                    (click)="navigateTo('/leave/pending')"
                    class="w-full flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-dark-elevated hover:bg-neutral-100 dark:hover:bg-dark-border cursor-pointer transition-colors text-left"
                    [attr.aria-label]="'Review leave request from ' + request.employeeName + ', ' + request.days + ' days ' + getLeaveTypeLabel(request.leaveType)"
                  >
                    <div class="flex items-center gap-3 flex-1 min-w-0">
                      <p class="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {{ request.employeeName }}
                      </p>
                      <sw-badge [variant]="getLeaveBadgeVariant(request.leaveType)" size="sm">
                        {{ getLeaveTypeLabel(request.leaveType) | translate }}
                      </sw-badge>
                    </div>
                    <div class="flex flex-col items-end gap-1 ml-4">
                      <span class="text-xs text-neutral-500 dark:text-neutral-400">
                        {{ formatDate(request.startDate) }} - {{ formatDate(request.endDate) }}
                      </span>
                      <span class="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        {{ request.days }} day{{ request.days !== 1 ? 's' : '' }}
                      </span>
                    </div>
                  </button>
                }
              </div>
            }
          </div>

          <div class="mt-4 pt-4 border-t border-neutral-200 dark:border-dark-border">
            <a routerLink="/leave/pending" class="text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors">
              {{ 'dashboard.actions.reviewAllRequests' | translate }} →
            </a>
          </div>
        </div>

        <!-- Recruitment Pipeline Widget -->
        <div *hasPermission="['RECRUITMENT_READ', 'RECRUITMENT_MANAGE']" class="sw-card">
          <div class="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-200 dark:border-dark-border">
            <div class="p-2 rounded-lg bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400">
              <span class="material-icons" aria-hidden="true">analytics</span>
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">{{ 'dashboard.widgets.recruitmentPipeline' | translate }}</h3>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'dashboard.pipeline.applicationStages' | translate }}</p>
            </div>
          </div>

          <div class="min-h-[200px]">
            @if (loadingPipeline()) {
              <div class="flex justify-center items-center h-[150px]">
                <sw-spinner size="md" />
              </div>
            } @else if (pipelineStages().length === 0) {
              <div class="sw-empty-state">
                <span class="material-icons sw-empty-state-icon" aria-hidden="true">trending_up</span>
                <p class="sw-empty-state-title">{{ 'dashboard.pipeline.noActiveApplications' | translate }}</p>
                <p class="sw-empty-state-description">{{ 'dashboard.pipeline.applicationsWillAppear' | translate }}</p>
              </div>
            } @else {
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                @for (stage of pipelineStages(); track stage.stage) {
                  <div
                    class="p-3 rounded-lg bg-neutral-50 dark:bg-dark-elevated border-l-4"
                    [style.border-left-color]="getStageColor(stage.stage)"
                  >
                    <p class="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {{ stage.count }}
                    </p>
                    <p class="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                      {{ stage.stageName }}
                    </p>
                  </div>
                }
              </div>
            }
          </div>

          <div class="mt-4 pt-4 border-t border-neutral-200 dark:border-dark-border">
            <a routerLink="/recruitment" class="text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors">
              {{ 'dashboard.actions.viewPipeline' | translate }} →
            </a>
          </div>
        </div>

        <!-- Organization Chart Widget -->
        <app-org-chart-widget *hasPermission="['EMPLOYEE_READ', 'EMPLOYEE_MANAGE']" />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardContentComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly leaveService = inject(LeaveService);
  private readonly payrollService = inject(PayrollService);
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);

  // User permissions from store
  private userPermissions = toSignal(this.store.select(selectUserPermissions), { initialValue: [] as string[] });

  // Detect if user is a regular employee (not admin/manager)
  isEmployee = computed(() => {
    const permissions = this.userPermissions();
    const hasAdminPerms = permissions.some(p =>
      p.includes('MANAGE') || p.includes('APPROVE') ||
      p.includes('ADMIN') || p === 'ALL' || p === '*' || p === 'TENANT_ALL'
    );
    return permissions.includes('LEAVE_REQUEST') && !hasAdminPerms;
  });

  // Quick links configuration with permissions
  private readonly quickLinksConfig = [
    { label: 'Employees', route: '/employees', icon: 'people', permissions: ['EMPLOYEE_READ', 'EMPLOYEE_MANAGE'] },
    { label: 'Org Chart', route: '/hr/organogram', icon: 'account_tree', permissions: ['EMPLOYEE_READ', 'EMPLOYEE_MANAGE'] },
    { label: 'Leave', route: '/leave', icon: 'event_note', permissions: ['LEAVE_REQUEST', 'LEAVE_APPROVE', 'LEAVE_MANAGE'] },
    { label: 'Recruitment', route: '/recruitment', icon: 'work', permissions: ['RECRUITMENT_READ', 'RECRUITMENT_MANAGE'] },
    { label: 'Candidates', route: '/recruitment/candidates', icon: 'person_search', permissions: ['RECRUITMENT_READ', 'RECRUITMENT_MANAGE'] },
    { label: 'Payroll', route: '/payroll', icon: 'payments', permissions: ['PAYROLL_READ', 'PAYROLL_MANAGE'] }
  ];

  // Filtered quick links based on user permissions
  quickLinks = computed(() => {
    const permissions = this.userPermissions();
    const isSuperAdmin = permissions.includes('ALL') || permissions.includes('*') || permissions.includes('TENANT_ALL');

    return this.quickLinksConfig.filter(link => {
      if (isSuperAdmin) return true;
      if (!link.permissions?.length) return true;
      return link.permissions.some(p => permissions.includes(p));
    });
  });

  // Stats
  stats = signal<DashboardStats | null>(null);

  // Widget data
  upcomingInterviews = signal<UpcomingInterview[]>([]);
  recentCandidates = signal<RecentCandidate[]>([]);
  pendingLeaveRequests = signal<LeaveRequestSummary[]>([]);
  pipelineStages = signal<PipelineStage[]>([]);

  // Loading states
  loadingInterviews = signal(true);
  loadingCandidates = signal(true);
  loadingLeave = signal(true);
  loadingPipeline = signal(true);

  // Employee-specific data signals
  myLeaveBalances = signal<LeaveBalance[]>([]);
  myLeaveRequests = signal<LeaveRequest[]>([]);
  myPayslips = signal<PayslipSummary[]>([]);
  loadingMyLeave = signal(true);
  loadingMyPayslips = signal(true);

  ngOnInit(): void {
    this.loadDashboardStats();
    this.loadWidgetData();
    this.loadEmployeeWidgetData();
  }

  loadDashboardStats(): void {
    this.dashboardService.getDashboardStats().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => this.stats.set(data),
      error: () => {
        this.stats.set({
          employeeCount: 0,
          pendingLeaveRequests: 0,
          openJobPostings: 0,
          nextPayrollDate: null
        });
      }
    });
  }

  loadWidgetData(): void {
    // Load each widget independently so failures don't block others
    this.dashboardService.getUpcomingInterviews().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.upcomingInterviews.set(data);
        this.loadingInterviews.set(false);
      },
      error: () => this.loadingInterviews.set(false)
    });

    this.dashboardService.getRecentCandidates().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.recentCandidates.set(data);
        this.loadingCandidates.set(false);
      },
      error: () => this.loadingCandidates.set(false)
    });

    this.dashboardService.getPendingLeaveRequests().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.pendingLeaveRequests.set(data);
        this.loadingLeave.set(false);
      },
      error: () => this.loadingLeave.set(false)
    });

    this.dashboardService.getPipelineSummary().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.pipelineStages.set(data);
        this.loadingPipeline.set(false);
      },
      error: () => this.loadingPipeline.set(false)
    });
  }

  loadEmployeeWidgetData(): void {
    // Only load for employees with LEAVE_REQUEST permission
    if (!this.userPermissions().includes('LEAVE_REQUEST')) {
      this.loadingMyLeave.set(false);
      this.loadingMyPayslips.set(false);
      return;
    }

    // Load each independently so failures don't block others
    this.leaveService.getMyBalances().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (balances) => {
        this.myLeaveBalances.set(balances);
        this.loadingMyLeave.set(false);
      },
      error: () => this.loadingMyLeave.set(false)
    });

    this.leaveService.getMyRequests(0, 5).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => this.myLeaveRequests.set(response.content),
      error: () => {}
    });

    this.payrollService.getMyPayslips(0, 3).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.myPayslips.set(response.content);
        this.loadingMyPayslips.set(false);
      },
      error: () => this.loadingMyPayslips.set(false)
    });
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
  }

  formatInterviewTime(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const time = date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `Today, ${time}`;
    if (isTomorrow) return `Tomorrow, ${time}`;
    return `${date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}, ${time}`;
  }

  // === Centralized Status/Type Helpers (using shared configuration) ===

  getInterviewTypeLabel(type: string): string {
    return getInterviewTypeConfig(type).translationKey;
  }

  getInterviewBadgeVariant(type: string): 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'info' {
    return getInterviewTypeConfig(type).variant;
  }

  getLeaveTypeLabel(type: string): string {
    return getLeaveTypeConfig(type).translationKey;
  }

  getLeaveBadgeVariant(type: string): 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'info' {
    return getLeaveTypeConfig(type).variant;
  }

  getStageColor(stage: string): string {
    return getApplicationStageConfig(stage).color;
  }

  getLeaveGradient(type: string): string {
    return getLeaveTypeConfig(type).gradient;
  }

  getLeaveIcon(type: string): string {
    return getLeaveTypeConfig(type).icon;
  }

  getUsagePercentage(balance: LeaveBalance): number {
    if (balance.entitlement === 0) return 0;
    return Math.min(100, ((balance.used + balance.pending) / balance.entitlement) * 100);
  }

  getStatusBadgeVariant(status: string): 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'info' {
    return getLeaveStatusConfig(status).variant;
  }

  getPayslipPeriod(payslip: PayslipSummary): string {
    if (payslip.payslipNumber) {
      const match = payslip.payslipNumber.match(/PS-(\d{4})-(\d{2})/);
      if (match) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[parseInt(match[2], 10) - 1]} ${match[1]}`;
      }
    }
    return 'Unknown Period';
  }

  getPayslipStatusVariant(status: string): 'primary' | 'success' | 'warning' | 'error' | 'neutral' {
    const variants: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'neutral'> = {
      PAID: 'success',
      APPROVED: 'primary',
      CALCULATED: 'warning',
      DRAFT: 'neutral',
      EXCLUDED: 'neutral',
      VOID: 'error'
    };
    return variants[status] || 'neutral';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}
