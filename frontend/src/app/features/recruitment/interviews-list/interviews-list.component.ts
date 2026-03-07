import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { debounceTime } from 'rxjs';
import {
  RecruitmentService,
  Interview,
  InterviewStatus,
  InterviewType
} from '../../../core/services/recruitment.service';
import { InterviewFeedbackDialogComponent } from '../dialogs/interview-feedback-dialog.component';
import { SpinnerComponent, DropdownComponent, DropdownItemComponent, ToastService, DialogService } from '@shared/ui';

@Component({
  selector: 'app-interviews-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    TranslateModule,
    SpinnerComponent,
    DropdownComponent,
    DropdownItemComponent,
    DatePipe
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="sw-page-header">
        <div class="flex items-center gap-3">
          <span class="material-icons text-3xl text-primary-500">event_note</span>
          <div>
            <h1 class="sw-page-title">{{ 'recruitment.interviewsList.title' | translate }}</h1>
            <p class="sw-page-description">{{ 'recruitment.interviewsList.subtitle' | translate }}</p>
          </div>
        </div>
        <a routerLink="/recruitment" class="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 dark:border-dark-border rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-elevated transition-colors">
          <span class="material-icons text-lg" aria-hidden="true">arrow_back</span>
          {{ 'common.backToDashboard' | translate }}
        </a>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4 min-w-0">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 flex-shrink-0 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <span class="material-icons text-white text-xl">event</span>
            </div>
            <div class="min-w-0">
              <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{{ upcomingCount() }}</p>
              <p class="text-sm text-neutral-500 dark:text-neutral-400 truncate">{{ 'recruitment.interviewsList.stats.upcoming' | translate }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4 min-w-0">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 flex-shrink-0 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
              <span class="material-icons text-white text-xl">today</span>
            </div>
            <div class="min-w-0">
              <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{{ todayCount() }}</p>
              <p class="text-sm text-neutral-500 dark:text-neutral-400 truncate">{{ 'recruitment.interviewsList.stats.today' | translate }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4 min-w-0">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 flex-shrink-0 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <span class="material-icons text-white text-xl">rate_review</span>
            </div>
            <div class="min-w-0">
              <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{{ feedbackPendingCount() }}</p>
              <p class="text-sm text-neutral-500 dark:text-neutral-400 truncate">{{ 'recruitment.interviewsList.stats.feedbackPending' | translate }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4 min-w-0">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 flex-shrink-0 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
              <span class="material-icons text-white text-xl">check_circle</span>
            </div>
            <div class="min-w-0">
              <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{{ completedCount() }}</p>
              <p class="text-sm text-neutral-500 dark:text-neutral-400 truncate">{{ 'recruitment.interviewsList.stats.completed' | translate }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex items-end gap-4 flex-wrap">
        <select [formControl]="statusControl" class="sw-input w-40" [attr.aria-label]="'recruitment.interviewsList.filters.status' | translate">
          <option [ngValue]="null">{{ 'recruitment.interviewsList.filters.allStatuses' | translate }}</option>
          <option value="SCHEDULED">{{ 'recruitment.interviewsList.status.scheduled' | translate }}</option>
          <option value="CONFIRMED">{{ 'recruitment.interviewsList.status.confirmed' | translate }}</option>
          <option value="IN_PROGRESS">{{ 'recruitment.interviewsList.status.inProgress' | translate }}</option>
          <option value="COMPLETED">{{ 'recruitment.interviewsList.status.completed' | translate }}</option>
          <option value="FEEDBACK_PENDING">{{ 'recruitment.interviewsList.status.feedbackPending' | translate }}</option>
          <option value="FEEDBACK_SUBMITTED">{{ 'recruitment.interviewsList.status.feedbackSubmitted' | translate }}</option>
          <option value="CANCELLED">{{ 'recruitment.interviewsList.status.cancelled' | translate }}</option>
          <option value="NO_SHOW">{{ 'recruitment.interviewsList.status.noShow' | translate }}</option>
          <option value="RESCHEDULED">{{ 'recruitment.interviewsList.status.rescheduled' | translate }}</option>
        </select>

        <select [formControl]="typeControl" class="sw-input w-40" [attr.aria-label]="'recruitment.interviewsList.filters.type' | translate">
          <option [ngValue]="null">{{ 'recruitment.interviewsList.filters.allTypes' | translate }}</option>
          <option value="PHONE_SCREEN">{{ 'recruitment.interviewsList.type.phoneScreen' | translate }}</option>
          <option value="VIDEO_CALL">{{ 'recruitment.interviewsList.type.videoCall' | translate }}</option>
          <option value="IN_PERSON">{{ 'recruitment.interviewsList.type.inPerson' | translate }}</option>
          <option value="TECHNICAL">{{ 'recruitment.interviewsList.type.technical' | translate }}</option>
          <option value="BEHAVIORAL">{{ 'recruitment.interviewsList.type.behavioral' | translate }}</option>
          <option value="PANEL">{{ 'recruitment.interviewsList.type.panel' | translate }}</option>
          <option value="GROUP">{{ 'recruitment.interviewsList.type.group' | translate }}</option>
          <option value="CASE_STUDY">{{ 'recruitment.interviewsList.type.caseStudy' | translate }}</option>
          <option value="FINAL">{{ 'recruitment.interviewsList.type.final' | translate }}</option>
        </select>

        <div>
          <label class="sw-label">{{ 'recruitment.interviewsList.filters.startDate' | translate }}</label>
          <input type="date" [formControl]="startDateControl" class="sw-input" />
        </div>

        <div>
          <label class="sw-label">{{ 'recruitment.interviewsList.filters.endDate' | translate }}</label>
          <input type="date" [formControl]="endDateControl" class="sw-input" />
        </div>

        <button (click)="clearFilters()"
                class="inline-flex items-center gap-2 px-3 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-elevated rounded-lg"
                [title]="'recruitment.interviewsList.filters.clearFilters' | translate">
          <span class="material-icons text-lg">clear</span>
          {{ 'recruitment.interviewsList.filters.clearFilters' | translate }}
        </button>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="flex justify-center items-center py-24">
          <sw-spinner size="lg" />
        </div>
      } @else if (error()) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <span class="material-icons text-5xl text-error-500 mb-4">error</span>
          <p class="text-neutral-600 dark:text-neutral-400 mb-4">{{ error() }}</p>
          <button (click)="loadInterviews()" class="px-4 py-2 text-primary-500 hover:text-primary-600 font-medium">{{ 'common.retry' | translate }}</button>
        </div>
      } @else {
        <!-- Table -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          <div class="overflow-x-auto">
            <table class="sw-table">
              <thead>
                <tr>
                  <th>{{ 'recruitment.interviewsList.table.dateTime' | translate }}</th>
                  <th>{{ 'recruitment.interviewsList.table.candidate' | translate }}</th>
                  <th>{{ 'recruitment.interviewsList.table.type' | translate }}</th>
                  <th>{{ 'recruitment.interviewsList.table.interviewer' | translate }}</th>
                  <th>{{ 'recruitment.interviewsList.table.location' | translate }}</th>
                  <th>{{ 'recruitment.interviewsList.table.status' | translate }}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (interview of interviews(); track interview.id) {
                  <tr [ngClass]="{
                    'bg-primary-50/50 dark:bg-primary-900/10': interview.isUpcoming,
                    'bg-warning-50/50 dark:bg-warning-900/10': interview.needsFeedback
                  }">
                    <td>
                      <div class="flex flex-col">
                        <span class="font-medium">{{ interview.scheduledAt | date:'EEE, MMM d, y' }}</span>
                        <span class="text-xs text-neutral-500">{{ interview.scheduledAt | date:'h:mm a' }} - {{ interview.endTime | date:'h:mm a' }}</span>
                      </div>
                    </td>
                    <td>
                      <a [routerLink]="['/recruitment/candidates', getCandidateId(interview)]"
                         class="text-primary-500 hover:text-primary-600 font-medium"
                         [title]="interview.jobTitle">
                        {{ interview.candidateName }}
                      </a>
                      <span class="block text-xs text-neutral-500">{{ interview.jobTitle }}</span>
                    </td>
                    <td>
                      <span class="inline-block px-3 py-1 rounded-full text-xs font-medium"
                            [style.background]="getInterviewTypeColor(interview.interviewType).background"
                            [style.color]="getInterviewTypeColor(interview.interviewType).color">
                        {{ getInterviewTypeLabel(interview.interviewType) }}
                      </span>
                    </td>
                    <td class="text-neutral-600 dark:text-neutral-400">{{ interview.interviewerName || '-' }}</td>
                    <td>
                      <div class="flex items-center gap-2">
                        <span class="material-icons text-lg text-neutral-400">
                          {{ interview.locationType === 'REMOTE' ? 'video_call' :
                             interview.locationType === 'HYBRID' ? 'business' : 'place' }}
                        </span>
                        <span class="text-sm">{{ interview.locationDetails || getLocationLabel(interview.locationType) }}</span>
                        @if (interview.meetingLink) {
                          <a [href]="interview.meetingLink" target="_blank" class="ml-auto p-1 hover:bg-neutral-100 dark:hover:bg-dark-elevated rounded" [title]="'recruitment.interviewsList.joinMeeting' | translate">
                            <span class="material-icons text-lg text-primary-500">open_in_new</span>
                          </a>
                        }
                      </div>
                    </td>
                    <td>
                      <span class="inline-block px-3 py-1 rounded-full text-xs font-medium"
                            [style.background]="getInterviewStatusColor(interview.status).background"
                            [style.color]="getInterviewStatusColor(interview.status).color">
                        {{ getInterviewStatusLabel(interview.status) }}
                      </span>
                    </td>
                    <td>
                      <sw-dropdown position="bottom-end">
                        <button trigger class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated" [attr.aria-label]="'common.moreOptions' | translate">
                          <span class="material-icons">more_vert</span>
                        </button>
                        @if (interview.status === 'SCHEDULED') {
                          <sw-dropdown-item icon="check" (click)="confirmInterview(interview)">{{ 'recruitment.interviewsList.actions.confirm' | translate }}</sw-dropdown-item>
                        }
                        @if (interview.status === 'CONFIRMED') {
                          <sw-dropdown-item icon="play_arrow" (click)="startInterview(interview)">{{ 'recruitment.interviewsList.actions.startInterview' | translate }}</sw-dropdown-item>
                        }
                        @if (interview.status === 'IN_PROGRESS') {
                          <sw-dropdown-item icon="done" (click)="completeInterview(interview)">{{ 'recruitment.interviewsList.actions.complete' | translate }}</sw-dropdown-item>
                        }
                        @if (interview.needsFeedback) {
                          <sw-dropdown-item icon="rate_review" (click)="submitFeedback(interview)">{{ 'recruitment.interviewsList.actions.submitFeedback' | translate }}</sw-dropdown-item>
                        }
                        @if (interview.meetingLink) {
                          <a [href]="interview.meetingLink" target="_blank" class="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-dark-elevated">
                            <span class="material-icons text-lg">video_call</span>
                            {{ 'recruitment.interviewsList.actions.joinMeeting' | translate }}
                          </a>
                        }
                        @if (['SCHEDULED', 'CONFIRMED'].includes(interview.status)) {
                          <sw-dropdown-item icon="cancel" (click)="cancelInterview(interview)">{{ 'recruitment.interviewsList.actions.cancel' | translate }}</sw-dropdown-item>
                          <sw-dropdown-item icon="person_off" (click)="markNoShow(interview)">{{ 'recruitment.interviewsList.actions.markNoShow' | translate }}</sw-dropdown-item>
                        }
                      </sw-dropdown>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="text-center py-12">
                      <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">event_busy</span>
                      <p class="text-neutral-500 dark:text-neutral-400 mb-1">{{ 'recruitment.interviewsList.empty.title' | translate }}</p>
                      <span class="text-sm text-neutral-400">{{ 'recruitment.interviewsList.empty.subtitle' | translate }}</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-dark-border">
            <div class="text-sm text-neutral-500 dark:text-neutral-400">
              {{ 'common.pagination.showingRange' | translate: { start: (pageIndex() * pageSize) + 1, end: Math.min((pageIndex() + 1) * pageSize, totalElements()), total: totalElements() } }}
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
                {{ 'common.pagination.pageOf' | translate: { current: pageIndex() + 1, total: Math.ceil(totalElements() / pageSize) || 1 } }}
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
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InterviewsListComponent implements OnInit {
  private readonly recruitmentService = inject(RecruitmentService);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly translateService = inject(TranslateService);

  // Expose Math for template use
  Math = Math;

  interviews = signal<Interview[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  totalElements = signal(0);
  pageIndex = signal(0);
  pageSize = 20;

  // Stats
  upcomingCount = signal(0);
  todayCount = signal(0);
  feedbackPendingCount = signal(0);
  completedCount = signal(0);

  displayedColumns = ['scheduledAt', 'candidateName', 'interviewType', 'interviewer', 'location', 'status', 'actions'];

  // Filter controls
  statusControl = new FormControl<InterviewStatus | null>(null);
  typeControl = new FormControl<InterviewType | null>(null);
  startDateControl = new FormControl<string | null>(null);
  endDateControl = new FormControl<string | null>(null);

  ngOnInit(): void {
    this.loadInterviews();
    this.loadStats();

    // Subscribe to filter changes
    this.statusControl.valueChanges.pipe(debounceTime(100)).subscribe(() => {
      this.pageIndex.set(0);
      this.loadInterviews();
    });

    this.typeControl.valueChanges.pipe(debounceTime(100)).subscribe(() => {
      this.pageIndex.set(0);
      this.loadInterviews();
    });

    this.startDateControl.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      this.pageIndex.set(0);
      this.loadInterviews();
    });

    this.endDateControl.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      this.pageIndex.set(0);
      this.loadInterviews();
    });
  }

  loadInterviews(): void {
    this.loading.set(true);
    this.error.set(null);

    this.recruitmentService.searchInterviews(
      this.pageIndex(),
      this.pageSize,
      undefined, // interviewerId
      this.statusControl.value ?? undefined,
      this.typeControl.value ?? undefined,
      this.startDateControl.value ?? undefined,
      this.endDateControl.value ?? undefined
    ).subscribe({
      next: (response) => {
        this.interviews.set(response.content);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load interviews', err);
        this.translateService.get('recruitment.interviewsList.messages.loadFailed').subscribe(message => {
          this.error.set(message);
        });
        this.loading.set(false);
      }
    });
  }

  loadStats(): void {
    // Load today's interviews
    this.recruitmentService.getTodaysInterviews().subscribe({
      next: (interviews) => {
        this.todayCount.set(interviews.length);
      }
    });

    // Load stats by status
    this.recruitmentService.searchInterviews(0, 1, undefined, 'SCHEDULED').subscribe({
      next: (response) => {
        this.upcomingCount.set(response.totalElements);
      }
    });

    this.recruitmentService.searchInterviews(0, 1, undefined, 'FEEDBACK_PENDING').subscribe({
      next: (response) => {
        this.feedbackPendingCount.set(response.totalElements);
      }
    });

    this.recruitmentService.searchInterviews(0, 1, undefined, 'COMPLETED').subscribe({
      next: (response) => {
        this.completedCount.set(response.totalElements);
      }
    });
  }

  goToPage(page: number): void {
    if (page < 0 || page * this.pageSize >= this.totalElements()) return;
    this.pageIndex.set(page);
    this.loadInterviews();
  }

  clearFilters(): void {
    this.statusControl.setValue(null);
    this.typeControl.setValue(null);
    this.startDateControl.setValue(null);
    this.endDateControl.setValue(null);
  }

  getCandidateId(interview: Interview): string {
    return interview.candidateId;
  }

  getInterviewTypeLabel(type: InterviewType): string {
    return RecruitmentService.getInterviewTypeLabel(type);
  }

  getInterviewTypeColor(type: InterviewType): { background: string; color: string } {
    const colors: Record<InterviewType, { background: string; color: string }> = {
      PHONE_SCREEN: { background: '#fce4ec', color: '#c2185b' },
      VIDEO_CALL: { background: '#e3f2fd', color: '#1565c0' },
      IN_PERSON: { background: '#e8f5e9', color: '#2e7d32' },
      TECHNICAL: { background: '#f3e5f5', color: '#6a1b9a' },
      BEHAVIORAL: { background: '#fff3e0', color: '#f57c00' },
      PANEL: { background: '#e1bee7', color: '#4a148c' },
      GROUP: { background: '#d1c4e9', color: '#311b92' },
      CASE_STUDY: { background: '#c5cae9', color: '#283593' },
      FINAL: { background: '#c8e6c9', color: '#1b5e20' }
    };
    return colors[type] || { background: '#eceff1', color: '#546e7a' };
  }

  getInterviewStatusLabel(status: InterviewStatus): string {
    return RecruitmentService.getInterviewStatusLabel(status);
  }

  getInterviewStatusColor(status: InterviewStatus): { background: string; color: string } {
    return RecruitmentService.getInterviewStatusColor(status);
  }

  getLocationLabel(locationType: string): string {
    // Location labels are translated in template, this method is for fallback
    const labels: Record<string, string> = {
      ONSITE: 'recruitment.interviewsList.location.onsite',
      REMOTE: 'recruitment.interviewsList.location.remote',
      HYBRID: 'recruitment.interviewsList.location.hybrid'
    };
    return labels[locationType] || locationType;
  }

  confirmInterview(interview: Interview): void {
    this.recruitmentService.confirmInterview(interview.id).subscribe({
      next: () => {
        this.translateService.get('recruitment.interviewsList.messages.confirmed').subscribe(message => {
          this.toast.success(message);
        });
        this.loadInterviews();
      },
      error: (err) => {
        console.error('Failed to confirm interview', err);
        this.translateService.get('recruitment.interviewsList.messages.confirmFailed').subscribe(message => {
          this.toast.error(message);
        });
      }
    });
  }

  startInterview(interview: Interview): void {
    this.recruitmentService.startInterview(interview.id).subscribe({
      next: () => {
        this.translateService.get('recruitment.interviewsList.messages.started').subscribe(message => {
          this.toast.success(message);
        });
        this.loadInterviews();
      },
      error: (err) => {
        console.error('Failed to start interview', err);
        this.translateService.get('recruitment.interviewsList.messages.startFailed').subscribe(message => {
          this.toast.error(message);
        });
      }
    });
  }

  completeInterview(interview: Interview): void {
    this.recruitmentService.completeInterview(interview.id).subscribe({
      next: () => {
        this.translateService.get('recruitment.interviewsList.messages.completed').subscribe(message => {
          this.toast.success(message);
        });
        this.loadInterviews();
      },
      error: (err) => {
        console.error('Failed to complete interview', err);
        this.translateService.get('recruitment.interviewsList.messages.completeFailed').subscribe(message => {
          this.toast.error(message);
        });
      }
    });
  }

  submitFeedback(interview: Interview): void {
    const dialogRef = this.dialog.open(InterviewFeedbackDialogComponent, {
      width: '500px',
      data: { interview }
    });

    dialogRef.afterClosed().then(result => {
      if (result) {
        this.loadInterviews();
        this.loadStats();
      }
    });
  }

  cancelInterview(interview: Interview): void {
    this.translateService.get('recruitment.interviewsList.messages.enterCancellationReason').subscribe(prompt => {
      const reason = window.prompt(prompt);
      if (reason) {
        this.recruitmentService.cancelInterview(interview.id, reason).subscribe({
          next: () => {
            this.translateService.get('recruitment.interviewsList.messages.cancelled').subscribe(message => {
              this.toast.success(message);
            });
            this.loadInterviews();
          },
          error: (err) => {
            console.error('Failed to cancel interview', err);
            this.translateService.get('recruitment.interviewsList.messages.cancelFailed').subscribe(message => {
              this.toast.error(message);
            });
          }
        });
      }
    });
  }

  markNoShow(interview: Interview): void {
    this.translateService.get('recruitment.interviewsList.messages.confirmMarkNoShow').subscribe(confirmMsg => {
      if (window.confirm(confirmMsg)) {
        this.recruitmentService.markAsNoShow(interview.id).subscribe({
          next: () => {
            this.translateService.get('recruitment.interviewsList.messages.markedNoShow').subscribe(message => {
              this.toast.success(message);
            });
            this.loadInterviews();
          },
          error: (err) => {
            console.error('Failed to mark no-show', err);
            this.translateService.get('recruitment.interviewsList.messages.markNoShowFailed').subscribe(message => {
              this.toast.error(message);
            });
          }
        });
      }
    });
  }
}
