import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import {
  RecruitmentService,
  JobPostingSummary,
  JobStatus,
  EmploymentType,
  PageResponse
} from '../../../core/services/recruitment.service';

@Component({
  selector: 'app-job-postings-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatChipsModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDialogModule,
    DatePipe
  ],
  template: `
    <div class="job-postings-list">
      <header class="list-header">
        <div class="header-title">
          <a routerLink="/recruitment" class="back-link">
            <mat-icon>arrow_back</mat-icon>
          </a>
          <h1>Job Postings</h1>
        </div>
        <a mat-raised-button color="primary" routerLink="/recruitment/jobs/new">
          <mat-icon>add</mat-icon>
          Post New Job
        </a>
      </header>

      <!-- Filters -->
      <div class="filters-section">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search</mat-label>
          <input matInput [formControl]="searchControl" placeholder="Search by title or department...">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [formControl]="statusControl">
            <mat-option value="">All Statuses</mat-option>
            @for (status of statuses; track status) {
              <mat-option [value]="status">{{ getJobStatusLabel(status) }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Employment Type</mat-label>
          <mat-select [formControl]="employmentTypeControl">
            <mat-option value="">All Types</mat-option>
            @for (type of employmentTypes; track type) {
              <mat-option [value]="type">{{ getEmploymentTypeLabel(type) }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <button mat-button (click)="clearFilters()" [disabled]="!hasFilters()">
          <mat-icon>clear</mat-icon>
          Clear Filters
        </button>
      </div>

      <!-- Content -->
      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      } @else if (jobs().length === 0) {
        <div class="empty-state">
          <mat-icon>work_off</mat-icon>
          <h3>No job postings found</h3>
          @if (hasFilters()) {
            <p>Try adjusting your filters</p>
            <button mat-button color="primary" (click)="clearFilters()">Clear Filters</button>
          } @else {
            <p>Get started by posting your first job</p>
            <a mat-raised-button color="primary" routerLink="/recruitment/jobs/new">Post New Job</a>
          }
        </div>
      } @else {
        <div class="table-container">
          <table mat-table [dataSource]="jobs()" class="jobs-table">
            <!-- Reference Column -->
            <ng-container matColumnDef="jobReference">
              <th mat-header-cell *matHeaderCellDef>Reference</th>
              <td mat-cell *matCellDef="let job">
                <span class="reference">{{ job.jobReference }}</span>
              </td>
            </ng-container>

            <!-- Title Column -->
            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef>Title</th>
              <td mat-cell *matCellDef="let job">
                <a [routerLink]="['/recruitment/jobs', job.id]" class="job-link">
                  {{ job.title }}
                </a>
                @if (job.remote) {
                  <mat-icon class="remote-icon" matTooltip="Remote">home_work</mat-icon>
                }
              </td>
            </ng-container>

            <!-- Department Column -->
            <ng-container matColumnDef="department">
              <th mat-header-cell *matHeaderCellDef>Department</th>
              <td mat-cell *matCellDef="let job">{{ job.departmentName || '-' }}</td>
            </ng-container>

            <!-- Employment Type Column -->
            <ng-container matColumnDef="employmentType">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let job">
                {{ getEmploymentTypeLabel(job.employmentType) }}
              </td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let job">
                <span class="status-badge"
                      [style.background]="getJobStatusColor(job.status).background"
                      [style.color]="getJobStatusColor(job.status).color">
                  {{ getJobStatusLabel(job.status) }}
                </span>
              </td>
            </ng-container>

            <!-- Applications Column -->
            <ng-container matColumnDef="applicationCount">
              <th mat-header-cell *matHeaderCellDef>Applications</th>
              <td mat-cell *matCellDef="let job">
                <span class="app-count">{{ job.applicationCount }}</span>
              </td>
            </ng-container>

            <!-- Closing Date Column -->
            <ng-container matColumnDef="closingDate">
              <th mat-header-cell *matHeaderCellDef>Closing Date</th>
              <td mat-cell *matCellDef="let job">
                @if (job.closingDate) {
                  <span [class.overdue]="isOverdue(job.closingDate)">
                    {{ job.closingDate | date:'mediumDate' }}
                  </span>
                } @else {
                  <span class="no-date">-</span>
                }
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let job">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <a mat-menu-item [routerLink]="['/recruitment/jobs', job.id]">
                    <mat-icon>visibility</mat-icon>
                    <span>View</span>
                  </a>
                  <a mat-menu-item [routerLink]="['/recruitment/jobs', job.id, 'edit']">
                    <mat-icon>edit</mat-icon>
                    <span>Edit</span>
                  </a>
                  @if (job.status === 'DRAFT') {
                    <button mat-menu-item (click)="publishJob(job)">
                      <mat-icon>publish</mat-icon>
                      <span>Publish</span>
                    </button>
                  }
                  @if (job.status === 'OPEN') {
                    <button mat-menu-item (click)="putOnHold(job)">
                      <mat-icon>pause</mat-icon>
                      <span>Put On Hold</span>
                    </button>
                    <button mat-menu-item (click)="closeJob(job)">
                      <mat-icon>close</mat-icon>
                      <span>Close</span>
                    </button>
                  }
                  @if (job.status === 'ON_HOLD') {
                    <button mat-menu-item (click)="reopenJob(job)">
                      <mat-icon>play_arrow</mat-icon>
                      <span>Reopen</span>
                    </button>
                  }
                  @if (job.status === 'DRAFT' || job.status === 'CLOSED') {
                    <button mat-menu-item (click)="deleteJob(job)" class="delete-action">
                      <mat-icon>delete</mat-icon>
                      <span>Delete</span>
                    </button>
                  }
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>

        <mat-paginator
          [length]="totalElements()"
          [pageSize]="pageSize()"
          [pageIndex]="pageIndex()"
          [pageSizeOptions]="[10, 25, 50]"
          (page)="onPageChange($event)"
          showFirstLastButtons>
        </mat-paginator>
      }
    </div>
  `,
  styles: [`
    .job-postings-list {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .back-link {
      color: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
    }

    .back-link:hover {
      color: rgba(0, 0, 0, 0.87);
    }

    .list-header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
    }

    .filters-section {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 24px;
    }

    .search-field {
      flex: 1;
      min-width: 250px;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 300px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 64px 24px;
      color: rgba(0, 0, 0, 0.6);
      text-align: center;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
    }

    .empty-state p {
      margin: 0 0 16px 0;
    }

    .table-container {
      overflow-x: auto;
    }

    .jobs-table {
      width: 100%;
    }

    .reference {
      font-family: monospace;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
    }

    .job-link {
      color: #1976d2;
      text-decoration: none;
      font-weight: 500;
    }

    .job-link:hover {
      text-decoration: underline;
    }

    .remote-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-left: 8px;
      vertical-align: middle;
      color: #43a047;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }

    .app-count {
      font-weight: 500;
    }

    .overdue {
      color: #d32f2f;
    }

    .no-date {
      color: rgba(0, 0, 0, 0.4);
    }

    .delete-action {
      color: #d32f2f;
    }

    mat-paginator {
      margin-top: 16px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobPostingsListComponent implements OnInit, OnDestroy {
  private readonly recruitmentService = inject(RecruitmentService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

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

  // Options
  statuses: JobStatus[] = ['DRAFT', 'OPEN', 'ON_HOLD', 'CLOSED', 'FILLED', 'CANCELLED'];
  employmentTypes: EmploymentType[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'INTERNSHIP', 'FREELANCE'];

  displayedColumns = ['jobReference', 'title', 'department', 'employmentType', 'status', 'applicationCount', 'closingDate', 'actions'];

  ngOnInit(): void {
    this.loadJobs();
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
  }

  loadJobs(): void {
    this.loading.set(true);

    const status = this.statusControl.value as JobStatus | undefined;
    const employmentType = this.employmentTypeControl.value as EmploymentType | undefined;
    const searchTerm = this.searchControl.value || undefined;

    this.recruitmentService.searchJobs(
      this.pageIndex(),
      this.pageSize(),
      status || undefined,
      undefined, // departmentId
      employmentType || undefined,
      undefined, // location
      searchTerm
    ).subscribe({
      next: (response) => {
        this.jobs.set(response.content);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load jobs', err);
        this.snackBar.open('Failed to load job postings', 'Dismiss', { duration: 5000 });
        this.loading.set(false);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadJobs();
  }

  hasFilters(): boolean {
    return !!(this.searchControl.value || this.statusControl.value || this.employmentTypeControl.value);
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.statusControl.setValue('');
    this.employmentTypeControl.setValue('');
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
        this.snackBar.open('Job published successfully', 'Dismiss', { duration: 3000 });
        this.loadJobs();
      },
      error: (err) => {
        console.error('Failed to publish job', err);
        this.snackBar.open('Failed to publish job', 'Dismiss', { duration: 5000 });
      }
    });
  }

  putOnHold(job: JobPostingSummary): void {
    this.recruitmentService.putJobOnHold(job.id).subscribe({
      next: () => {
        this.snackBar.open('Job put on hold', 'Dismiss', { duration: 3000 });
        this.loadJobs();
      },
      error: (err) => {
        console.error('Failed to put job on hold', err);
        this.snackBar.open('Failed to put job on hold', 'Dismiss', { duration: 5000 });
      }
    });
  }

  reopenJob(job: JobPostingSummary): void {
    this.recruitmentService.reopenJob(job.id).subscribe({
      next: () => {
        this.snackBar.open('Job reopened', 'Dismiss', { duration: 3000 });
        this.loadJobs();
      },
      error: (err) => {
        console.error('Failed to reopen job', err);
        this.snackBar.open('Failed to reopen job', 'Dismiss', { duration: 5000 });
      }
    });
  }

  closeJob(job: JobPostingSummary): void {
    this.recruitmentService.closeJob(job.id).subscribe({
      next: () => {
        this.snackBar.open('Job closed', 'Dismiss', { duration: 3000 });
        this.loadJobs();
      },
      error: (err) => {
        console.error('Failed to close job', err);
        this.snackBar.open('Failed to close job', 'Dismiss', { duration: 5000 });
      }
    });
  }

  deleteJob(job: JobPostingSummary): void {
    if (confirm(`Are you sure you want to delete "${job.title}"?`)) {
      this.recruitmentService.cancelJob(job.id).subscribe({
        next: () => {
          this.snackBar.open('Job deleted', 'Dismiss', { duration: 3000 });
          this.loadJobs();
        },
        error: (err) => {
          console.error('Failed to delete job', err);
          this.snackBar.open('Failed to delete job', 'Dismiss', { duration: 5000 });
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
}
