import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  RecruitmentService,
  JobPostingSummary,
  JobStatus,
  EmploymentType,
  PageResponse,
  ClientSummary
} from '../../../core/services/recruitment.service';
import { SpinnerComponent, DropdownComponent, DropdownItemComponent, ToastService, TableSkeletonComponent } from '@shared/ui';

@Component({
  selector: 'app-job-postings-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    TranslateModule,
    SpinnerComponent,
    DropdownComponent,
    DropdownItemComponent,
    DatePipe,
    TableSkeletonComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="sw-page-header">
        <div class="flex items-center gap-3">
          <a routerLink="/recruitment" class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors" [attr.aria-label]="'common.back' | translate">
            <span class="material-icons" aria-hidden="true">arrow_back</span>
          </a>
          <span class="material-icons text-3xl text-primary-500">work</span>
          <div>
            <h1 class="sw-page-title">{{ 'recruitment.jobList.title' | translate }}</h1>
            <p class="sw-page-description">{{ 'recruitment.jobList.subtitle' | translate }}</p>
          </div>
        </div>
        <a routerLink="/recruitment/jobs/new" class="sw-btn sw-btn-primary sw-btn-md">
          <span class="material-icons text-lg">add</span>
          {{ 'recruitment.jobList.postNewJob' | translate }}
        </a>
      </div>

      <!-- Filters -->
      <div class="flex items-center gap-4 flex-wrap">
        <div class="relative flex-1 min-w-[250px]">
          <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">search</span>
          <input
            type="text"
            [formControl]="searchControl"
            [placeholder]="'recruitment.jobList.searchPlaceholder' | translate"
            class="sw-input pl-10 w-full"
          />
        </div>

        <select [formControl]="statusControl" class="sw-input w-40">
          <option value="">{{ 'common.allStatuses' | translate }}</option>
          @for (status of statuses; track status) {
            <option [value]="status">{{ getJobStatusLabel(status) }}</option>
          }
        </select>

        <select [formControl]="employmentTypeControl" class="sw-input w-40">
          <option value="">{{ 'common.allTypes' | translate }}</option>
          @for (type of employmentTypes; track type) {
            <option [value]="type">{{ getEmploymentTypeLabel(type) }}</option>
          }
        </select>

        <select [formControl]="clientControl" class="sw-input w-44">
          <option value="">All Clients</option>
          @for (client of activeClients(); track client.id) {
            <option [value]="client.id">{{ client.name }}</option>
          }
        </select>

        <button (click)="clearFilters()" [disabled]="!hasFilters()"
                class="sw-btn sw-btn-ghost sw-btn-sm">
          <span class="material-icons text-lg">clear</span>
          {{ 'common.clear' | translate }}
        </button>
      </div>

      <!-- Content -->
      @if (loading()) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          <sw-table-skeleton [columns]="6" [rows]="10" [showAvatar]="false" [showActions]="true" />
        </div>
      } @else if (jobs().length === 0) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">work_off</span>
          <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">{{ 'recruitment.jobList.noPostings' | translate }}</h3>
          @if (hasFilters()) {
            <p class="text-neutral-500 dark:text-neutral-400 mb-4">{{ 'recruitment.jobList.adjustFilters' | translate }}</p>
            <button (click)="clearFilters()" class="px-4 py-2 text-primary-500 hover:text-primary-600 font-medium">
              {{ 'common.clearFilters' | translate }}
            </button>
          } @else {
            <p class="text-neutral-500 dark:text-neutral-400 mb-4">{{ 'recruitment.jobList.emptyState' | translate }}</p>
            <a routerLink="/recruitment/jobs/new" class="sw-btn sw-btn-primary sw-btn-md">
              {{ 'recruitment.jobList.postNewJob' | translate }}
            </a>
          }
        </div>
      } @else {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          <div class="overflow-x-auto">
            <table class="sw-table">
              <thead>
                <tr>
                  <th>{{ 'recruitment.jobList.reference' | translate }}</th>
                  <th>{{ 'common.title' | translate }}</th>
                  <th>Client</th>
                  <th>{{ 'common.department' | translate }}</th>
                  <th>{{ 'common.type' | translate }}</th>
                  <th>{{ 'common.status' | translate }}</th>
                  <th>{{ 'recruitment.jobList.applications' | translate }}</th>
                  <th>{{ 'recruitment.jobList.closingDate' | translate }}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (job of jobs(); track job.id) {
                  <tr class="cursor-pointer hover:bg-neutral-50 dark:hover:bg-dark-elevated" [routerLink]="['/recruitment/jobs', job.id]">
                    <td>
                      <span class="font-mono text-xs text-neutral-500">{{ job.jobReference }}</span>
                    </td>
                    <td>
                      <a [routerLink]="['/recruitment/jobs', job.id]" class="text-primary-500 hover:text-primary-600 font-medium">
                        {{ job.title }}
                      </a>
                      @if (job.remote) {
                        <span class="material-icons text-sm text-success-500 ml-2 align-middle" [title]="'common.remote' | translate">home_work</span>
                      }
                    </td>
                    <td class="text-neutral-600 dark:text-neutral-400">{{ job.clientName || '-' }}</td>
                    <td class="text-neutral-600 dark:text-neutral-400">{{ job.departmentName || '-' }}</td>
                    <td>{{ getEmploymentTypeLabel(job.employmentType) }}</td>
                    <td>
                      <span class="inline-block px-3 py-1 rounded-full text-xs font-medium"
                            [style.background]="getJobStatusColor(job.status).background"
                            [style.color]="getJobStatusColor(job.status).color">
                        {{ getJobStatusLabel(job.status) }}
                      </span>
                    </td>
                    <td class="font-medium">{{ job.applicationCount }}</td>
                    <td>
                      @if (job.closingDate) {
                        <span [class.text-error-600]="isOverdue(job.closingDate)">
                          {{ job.closingDate | date:'mediumDate' }}
                        </span>
                      } @else {
                        <span class="text-neutral-400">-</span>
                      }
                    </td>
                    <td (click)="$event.stopPropagation()">
                      <sw-dropdown position="bottom-end">
                        <button trigger class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated" [attr.aria-label]="'common.moreOptions' | translate">
                          <span class="material-icons">more_vert</span>
                        </button>
                        <sw-dropdown-item icon="visibility" [routerLink]="['/recruitment/jobs', job.id]">{{ 'common.view' | translate }}</sw-dropdown-item>
                        <sw-dropdown-item icon="edit" [routerLink]="['/recruitment/jobs', job.id, 'edit']">{{ 'common.edit' | translate }}</sw-dropdown-item>
                        @if (job.status === 'DRAFT') {
                          <sw-dropdown-item icon="publish" (click)="publishJob(job)">{{ 'recruitment.jobList.publish' | translate }}</sw-dropdown-item>
                        }
                        @if (job.status === 'OPEN') {
                          <sw-dropdown-item icon="pause" (click)="putOnHold(job)">{{ 'recruitment.jobList.putOnHold' | translate }}</sw-dropdown-item>
                          <sw-dropdown-item icon="close" (click)="closeJob(job)">{{ 'common.close' | translate }}</sw-dropdown-item>
                        }
                        @if (job.status === 'ON_HOLD') {
                          <sw-dropdown-item icon="play_arrow" (click)="reopenJob(job)">{{ 'recruitment.jobList.reopen' | translate }}</sw-dropdown-item>
                        }
                        @if (job.status === 'DRAFT' || job.status === 'CLOSED') {
                          <sw-dropdown-item icon="delete" (click)="deleteJob(job)" class="text-error-600">{{ 'common.delete' | translate }}</sw-dropdown-item>
                        }
                      </sw-dropdown>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-dark-border">
            <div class="text-sm text-neutral-500 dark:text-neutral-400">
              {{ 'common.showing' | translate: { from: (pageIndex() * pageSize()) + 1, to: Math.min((pageIndex() + 1) * pageSize(), totalElements()), total: totalElements() } }}
            </div>
            <div class="flex items-center gap-2">
              <button (click)="goToPage(0)" [disabled]="pageIndex() === 0"
                      [title]="'common.firstPage' | translate"
                      class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed">
                <span class="material-icons">first_page</span>
              </button>
              <button (click)="goToPage(pageIndex() - 1)" [disabled]="pageIndex() === 0"
                      [title]="'common.previousPage' | translate"
                      class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed">
                <span class="material-icons">chevron_left</span>
              </button>
              <span class="px-3 text-sm text-neutral-600 dark:text-neutral-400">
                {{ 'common.page' | translate: { current: pageIndex() + 1, total: Math.ceil(totalElements() / pageSize()) || 1 } }}
              </span>
              <button (click)="goToPage(pageIndex() + 1)" [disabled]="(pageIndex() + 1) * pageSize() >= totalElements()"
                      [title]="'common.nextPage' | translate"
                      class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed">
                <span class="material-icons">chevron_right</span>
              </button>
              <button (click)="goToPage(Math.ceil(totalElements() / pageSize()) - 1)" [disabled]="(pageIndex() + 1) * pageSize() >= totalElements()"
                      [title]="'common.lastPage' | translate"
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
export class JobPostingsListComponent implements OnInit, OnDestroy {
  private readonly recruitmentService = inject(RecruitmentService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly destroy$ = new Subject<void>();

  // Expose Math for template use
  Math = Math;

  // State
  jobs = signal<JobPostingSummary[]>([]);
  loading = signal(true);
  totalElements = signal(0);
  pageSize = signal(10);
  pageIndex = signal(0);

  // Form controls
  searchControl = new FormControl('');
  statusControl = new FormControl('');
  employmentTypeControl = new FormControl('');
  clientControl = new FormControl('');

  // Client data
  activeClients = signal<ClientSummary[]>([]);

  // Options
  statuses: JobStatus[] = ['DRAFT', 'OPEN', 'ON_HOLD', 'CLOSED', 'FILLED', 'CANCELLED'];
  employmentTypes: EmploymentType[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'INTERNSHIP', 'FREELANCE'];

  displayedColumns = ['jobReference', 'title', 'department', 'employmentType', 'status', 'applicationCount', 'closingDate', 'actions'];

  ngOnInit(): void {
    this.loadJobs();
    this.loadActiveClients();
    this.setupFilters();
  }

  private loadActiveClients(): void {
    this.recruitmentService.getActiveClients().subscribe({
      next: (clients) => this.activeClients.set(clients),
      error: () => {}
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFilters(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.pageIndex.set(0);
        this.loadJobs();
      });

    this.statusControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex.set(0);
        this.loadJobs();
      });

    this.employmentTypeControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex.set(0);
        this.loadJobs();
      });

    this.clientControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex.set(0);
        this.loadJobs();
      });
  }

  loadJobs(): void {
    this.loading.set(true);

    const status = this.statusControl.value as JobStatus | undefined;
    const employmentType = this.employmentTypeControl.value as EmploymentType | undefined;
    const searchTerm = this.searchControl.value || undefined;
    const clientId = this.clientControl.value || undefined;

    this.recruitmentService.searchJobs(
      this.pageIndex(),
      this.pageSize(),
      status || undefined,
      undefined, // departmentId
      employmentType || undefined,
      undefined, // location
      searchTerm,
      clientId
    ).subscribe({
      next: (response) => {
        this.jobs.set(response.content);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load jobs', err);
        this.toast.error(this.translate.instant('recruitment.jobList.loadError'));
        this.loading.set(false);
      }
    });
  }

  goToPage(page: number): void {
    if (page < 0 || page * this.pageSize() >= this.totalElements()) return;
    this.pageIndex.set(page);
    this.loadJobs();
  }

  hasFilters(): boolean {
    return !!(this.searchControl.value || this.statusControl.value || this.employmentTypeControl.value || this.clientControl.value);
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.statusControl.setValue('');
    this.employmentTypeControl.setValue('');
    this.clientControl.setValue('');
  }

  isOverdue(dateStr: string): boolean {
    const date = new Date(dateStr);
    return date < new Date();
  }

  publishJob(job: JobPostingSummary): void {
    const closingDate = new Date();
    closingDate.setMonth(closingDate.getMonth() + 1);
    const dateStr = closingDate.toISOString().split('T')[0];

    this.recruitmentService.publishJob(job.id, dateStr).subscribe({
      next: () => {
        this.toast.success(this.translate.instant('recruitment.jobList.publishSuccess'));
        this.loadJobs();
      },
      error: (err) => {
        console.error('Failed to publish job', err);
        this.toast.error(this.translate.instant('recruitment.jobList.publishError'));
      }
    });
  }

  putOnHold(job: JobPostingSummary): void {
    this.recruitmentService.putJobOnHold(job.id).subscribe({
      next: () => {
        this.toast.success(this.translate.instant('recruitment.jobList.putOnHoldSuccess'));
        this.loadJobs();
      },
      error: (err) => {
        console.error('Failed to put job on hold', err);
        this.toast.error(this.translate.instant('recruitment.jobList.putOnHoldError'));
      }
    });
  }

  reopenJob(job: JobPostingSummary): void {
    this.recruitmentService.reopenJob(job.id).subscribe({
      next: () => {
        this.toast.success(this.translate.instant('recruitment.jobList.reopenSuccess'));
        this.loadJobs();
      },
      error: (err) => {
        console.error('Failed to reopen job', err);
        this.toast.error(this.translate.instant('recruitment.jobList.reopenError'));
      }
    });
  }

  closeJob(job: JobPostingSummary): void {
    this.recruitmentService.closeJob(job.id).subscribe({
      next: () => {
        this.toast.success(this.translate.instant('recruitment.jobList.closeSuccess'));
        this.loadJobs();
      },
      error: (err) => {
        console.error('Failed to close job', err);
        this.toast.error(this.translate.instant('recruitment.jobList.closeError'));
      }
    });
  }

  deleteJob(job: JobPostingSummary): void {
    const message = `${this.translate.instant('recruitment.jobList.deleteConfirm')} "${job.title}"?`;
    if (confirm(message)) {
      this.recruitmentService.cancelJob(job.id).subscribe({
        next: () => {
          this.toast.success(this.translate.instant('recruitment.jobList.deleteSuccess'));
          this.loadJobs();
        },
        error: (err) => {
          console.error('Failed to delete job', err);
          this.toast.error(this.translate.instant('recruitment.jobList.deleteError'));
        }
      });
    }
  }

  getJobStatusLabel(status: JobStatus): string {
    return RecruitmentService.getJobStatusLabel(status);
  }

  getJobStatusColor(status: JobStatus): { background: string; color: string } {
    return RecruitmentService.getJobStatusColor(status);
  }

  getEmploymentTypeLabel(type: EmploymentType): string {
    return RecruitmentService.getEmploymentTypeLabel(type);
  }

  private translateKey(key: string): string {
    return this.translate.instant(key);
  }
}
