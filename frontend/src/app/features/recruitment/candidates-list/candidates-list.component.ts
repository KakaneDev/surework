import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  RecruitmentService,
  Candidate,
  CandidateStatus
} from '../../../core/services/recruitment.service';
import { SpinnerComponent, DropdownComponent, DropdownItemComponent, ToastService, TableSkeletonComponent } from '@shared/ui';

@Component({
  selector: 'app-candidates-list',
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
          <a routerLink="/recruitment" class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors" [title]="'common.back' | translate" [attr.aria-label]="'common.back' | translate">
            <span class="material-icons" aria-hidden="true">arrow_back</span>
          </a>
          <span class="material-icons text-3xl text-primary-500">people</span>
          <div>
            <h1 class="sw-page-title">{{ 'recruitment.candidatesList.title' | translate }}</h1>
            <p class="sw-page-description">{{ 'recruitment.candidatesList.description' | translate }}</p>
          </div>
        </div>
        <a routerLink="/recruitment/candidates/new" class="sw-btn sw-btn-primary sw-btn-md">
          <span class="material-icons text-lg">person_add</span>
          {{ 'recruitment.candidatesList.addCandidate' | translate }}
        </a>
      </div>

      <!-- Filters -->
      <div class="flex items-center gap-4 flex-wrap">
        <div class="relative flex-1 min-w-[250px]">
          <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">search</span>
          <input
            type="text"
            [formControl]="searchControl"
            [placeholder]="'recruitment.candidatesList.searchPlaceholder' | translate"
            class="sw-input pl-10 w-full"
          />
        </div>

        <select [formControl]="statusControl" class="sw-input w-40">
          <option value="">{{ 'recruitment.candidatesList.allStatuses' | translate }}</option>
          @for (status of statuses; track status) {
            <option [value]="status">{{ getStatusLabel(status) | translate }}</option>
          }
        </select>

        <button (click)="clearFilters()" [disabled]="!hasFilters()"
                class="sw-btn sw-btn-ghost sw-btn-sm"
                [title]="'common.clear' | translate">
          <span class="material-icons text-lg">clear</span>
          {{ 'common.clear' | translate }}
        </button>
      </div>

      <!-- Content -->
      @if (loading()) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          <sw-table-skeleton [columns]="6" [rows]="10" [showAvatar]="true" [showActions]="true" />
        </div>
      } @else if (candidates().length === 0) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">people_outline</span>
          <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">{{ 'recruitment.candidatesList.noCandidatesFound' | translate }}</h3>
          @if (hasFilters()) {
            <p class="text-neutral-500 dark:text-neutral-400 mb-4">{{ 'recruitment.candidatesList.tryAdjustingFilters' | translate }}</p>
            <button (click)="clearFilters()" class="px-4 py-2 text-primary-500 hover:text-primary-600 font-medium">
              {{ 'recruitment.candidatesList.clearFilters' | translate }}
            </button>
          } @else {
            <p class="text-neutral-500 dark:text-neutral-400 mb-4">{{ 'recruitment.candidatesList.addFirstCandidate' | translate }}</p>
            <a routerLink="/recruitment/candidates/new" class="sw-btn sw-btn-primary sw-btn-md">
              {{ 'recruitment.candidatesList.addCandidate' | translate }}
            </a>
          }
        </div>
      } @else {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          <div class="overflow-x-auto">
            <table class="sw-table">
              <thead>
                <tr>
                  <th>{{ 'recruitment.candidatesList.reference' | translate }}</th>
                  <th>{{ 'recruitment.candidatesList.name' | translate }}</th>
                  <th>{{ 'recruitment.candidatesList.email' | translate }}</th>
                  <th>{{ 'recruitment.candidatesList.currentTitle' | translate }}</th>
                  <th>{{ 'recruitment.candidatesList.experience' | translate }}</th>
                  <th>{{ 'recruitment.candidatesList.status' | translate }}</th>
                  <th>{{ 'recruitment.candidatesList.added' | translate }}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (candidate of candidates(); track candidate.id) {
                  <tr class="cursor-pointer hover:bg-neutral-50 dark:hover:bg-dark-elevated"
                      [ngClass]="{'bg-error-50': candidate.blacklisted}"
                      [routerLink]="['/recruitment/candidates', candidate.id]">
                    <td>
                      <span class="font-mono text-xs text-neutral-500">{{ candidate.candidateReference }}</span>
                    </td>
                    <td>
                      <a [routerLink]="['/recruitment/candidates', candidate.id]" class="text-primary-500 hover:text-primary-600 font-medium">
                        {{ candidate.fullName }}
                      </a>
                    </td>
                    <td class="text-neutral-600 dark:text-neutral-400">{{ candidate.email }}</td>
                    <td class="text-neutral-600 dark:text-neutral-400">{{ candidate.currentJobTitle || '-' }}</td>
                    <td>{{ candidate.experienceLevel || '-' }}</td>
                    <td>
                      <span class="inline-block px-3 py-1 rounded-full text-xs font-medium"
                            [style.background]="candidateStatusColorMap[candidate.status].background"
                            [style.color]="candidateStatusColorMap[candidate.status].color">
                        {{ getStatusLabel(candidate.status) | translate }}
                      </span>
                    </td>
                    <td class="text-neutral-600 dark:text-neutral-400">{{ candidate.createdAt | date:'mediumDate' }}</td>
                    <td (click)="$event.stopPropagation()">
                      <sw-dropdown position="bottom-end">
                        <button trigger class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated" [title]="'common.actions' | translate" [attr.aria-label]="'common.moreOptions' | translate">
                          <span class="material-icons">more_vert</span>
                        </button>
                        <sw-dropdown-item icon="visibility" [routerLink]="['/recruitment/candidates', candidate.id]">{{ 'common.view' | translate }}</sw-dropdown-item>
                        <sw-dropdown-item icon="edit" [routerLink]="['/recruitment/candidates', candidate.id, 'edit']">{{ 'common.edit' | translate }}</sw-dropdown-item>
                        @if (candidate.status === 'ACTIVE' && !candidate.blacklisted) {
                          <sw-dropdown-item icon="archive" (click)="archiveCandidate(candidate)">{{ 'recruitment.candidatesList.archive' | translate }}</sw-dropdown-item>
                          <sw-dropdown-item icon="block" (click)="blacklistCandidate(candidate)" class="text-error-600">{{ 'recruitment.candidatesList.blacklist' | translate }}</sw-dropdown-item>
                        }
                        @if (candidate.blacklisted) {
                          <sw-dropdown-item icon="check_circle" (click)="removeFromBlacklist(candidate)">{{ 'recruitment.candidatesList.removeFromBlacklist' | translate }}</sw-dropdown-item>
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
              {{ 'common.pagination.showingRange' | translate: { start: (pageIndex() * pageSize()) + 1, end: Math.min((pageIndex() + 1) * pageSize(), totalElements()), total: totalElements() } }}
            </div>
            <div class="flex items-center gap-2">
              <button (click)="goToPage(0)" [disabled]="pageIndex() === 0"
                      class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed"
                      [title]="'common.pagination.firstPage' | translate">
                <span class="material-icons">first_page</span>
              </button>
              <button (click)="goToPage(pageIndex() - 1)" [disabled]="pageIndex() === 0"
                      class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed"
                      [title]="'common.pagination.previous' | translate">
                <span class="material-icons">chevron_left</span>
              </button>
              <span class="px-3 text-sm text-neutral-600 dark:text-neutral-400">
                {{ 'common.pagination.pageInfo' | translate: { page: pageIndex() + 1, totalPages: Math.ceil(totalElements() / pageSize()) || 1 } }}
              </span>
              <button (click)="goToPage(pageIndex() + 1)" [disabled]="(pageIndex() + 1) * pageSize() >= totalElements()"
                      class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed"
                      [title]="'common.pagination.next' | translate">
                <span class="material-icons">chevron_right</span>
              </button>
              <button (click)="goToPage(Math.ceil(totalElements() / pageSize()) - 1)" [disabled]="(pageIndex() + 1) * pageSize() >= totalElements()"
                      class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed"
                      [title]="'common.pagination.lastPage' | translate">
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
export class CandidatesListComponent implements OnInit, OnDestroy {
  private readonly recruitmentService = inject(RecruitmentService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly destroy$ = new Subject<void>();

  // Expose Math for template use
  Math = Math;

  // Lookup maps for template (avoids function calls on every CD cycle)
  readonly candidateStatusLabelMap: Record<CandidateStatus, string> = {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    HIRED: 'Hired',
    BLACKLISTED: 'Blacklisted',
    ARCHIVED: 'Archived'
  };

  readonly candidateStatusColorMap: Record<CandidateStatus, { background: string; color: string }> = {
    ACTIVE: { background: '#e8f5e9', color: '#2e7d32' },
    INACTIVE: { background: '#eceff1', color: '#546e7a' },
    HIRED: { background: '#c8e6c9', color: '#1b5e20' },
    BLACKLISTED: { background: '#ffcdd2', color: '#b71c1c' },
    ARCHIVED: { background: '#f5f5f5', color: '#9e9e9e' }
  };

  candidates = signal<Candidate[]>([]);
  loading = signal(true);
  totalElements = signal(0);
  pageSize = signal(10);
  pageIndex = signal(0);

  searchControl = new FormControl('');
  statusControl = new FormControl('');

  statuses: CandidateStatus[] = ['ACTIVE', 'INACTIVE', 'HIRED', 'BLACKLISTED', 'ARCHIVED'];
  displayedColumns = ['candidateReference', 'fullName', 'email', 'currentJobTitle', 'experienceLevel', 'status', 'createdAt', 'actions'];

  ngOnInit(): void {
    this.loadCandidates();
    this.setupFilters();
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
        this.loadCandidates();
      });

    this.statusControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex.set(0);
        this.loadCandidates();
      });
  }

  loadCandidates(): void {
    this.loading.set(true);

    const status = this.statusControl.value as CandidateStatus | undefined;
    const searchTerm = this.searchControl.value || undefined;

    this.recruitmentService.searchCandidates(
      this.pageIndex(),
      this.pageSize(),
      status || undefined,
      searchTerm
    ).subscribe({
      next: (response) => {
        this.candidates.set(response.content);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load candidates', err);
        this.translate.get('recruitment.candidatesList.failedToLoadCandidates').subscribe(msg => {
          this.toast.error(msg);
        });
        this.loading.set(false);
      }
    });
  }

  goToPage(page: number): void {
    if (page < 0 || page * this.pageSize() >= this.totalElements()) return;
    this.pageIndex.set(page);
    this.loadCandidates();
  }

  hasFilters(): boolean {
    return !!(this.searchControl.value || this.statusControl.value);
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.statusControl.setValue('');
  }

  archiveCandidate(candidate: Candidate): void {
    this.translate.get('recruitment.candidatesList.archiveConfirmation', { name: candidate.fullName }).subscribe(msg => {
      if (confirm(msg)) {
        this.recruitmentService.archiveCandidate(candidate.id).subscribe({
          next: () => {
            this.translate.get('recruitment.candidatesList.candidateArchived').subscribe(successMsg => {
              this.toast.success(successMsg);
            });
            this.loadCandidates();
          },
          error: () => {
            this.translate.get('recruitment.candidatesList.failedToArchiveCandidate').subscribe(errorMsg => {
              this.toast.error(errorMsg);
            });
          }
        });
      }
    });
  }

  blacklistCandidate(candidate: Candidate): void {
    this.translate.get('recruitment.candidatesList.blacklistReason').subscribe(msg => {
      const reason = prompt(msg);
      if (reason) {
        this.recruitmentService.blacklistCandidate(candidate.id, reason).subscribe({
          next: () => {
            this.translate.get('recruitment.candidatesList.candidateBlacklisted').subscribe(successMsg => {
              this.toast.success(successMsg);
            });
            this.loadCandidates();
          },
          error: () => {
            this.translate.get('recruitment.candidatesList.failedToBlacklistCandidate').subscribe(errorMsg => {
              this.toast.error(errorMsg);
            });
          }
        });
      }
    });
  }

  removeFromBlacklist(candidate: Candidate): void {
    this.translate.get('recruitment.candidatesList.removeFromBlacklistConfirmation', { name: candidate.fullName }).subscribe(msg => {
      if (confirm(msg)) {
        this.recruitmentService.removeFromBlacklist(candidate.id).subscribe({
          next: () => {
            this.translate.get('recruitment.candidatesList.removedFromBlacklist').subscribe(successMsg => {
              this.toast.success(successMsg);
            });
            this.loadCandidates();
          },
          error: () => {
            this.translate.get('recruitment.candidatesList.failedToRemoveFromBlacklist').subscribe(errorMsg => {
              this.toast.error(errorMsg);
            });
          }
        });
      }
    });
  }

  getCandidateStatusLabel(status: CandidateStatus): string {
    return RecruitmentService.getCandidateStatusLabel(status);
  }

  getCandidateStatusColor(status: CandidateStatus): { background: string; color: string } {
    return RecruitmentService.getCandidateStatusColor(status);
  }

  getStatusLabel(status: CandidateStatus): string {
    const statusLabels: Record<CandidateStatus, string> = {
      ACTIVE: 'recruitment.candidatesList.statusActive',
      INACTIVE: 'recruitment.candidatesList.statusInactive',
      HIRED: 'recruitment.candidatesList.statusHired',
      BLACKLISTED: 'recruitment.candidatesList.statusBlacklisted',
      ARCHIVED: 'recruitment.candidatesList.statusArchived'
    };
    return statusLabels[status];
  }
}
