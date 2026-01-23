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
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import {
  RecruitmentService,
  Candidate,
  CandidateStatus
} from '../../../core/services/recruitment.service';

@Component({
  selector: 'app-candidates-list',
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
    DatePipe
  ],
  template: `
    <div class="candidates-list">
      <header class="list-header">
        <div class="header-title">
          <a routerLink="/recruitment" class="back-link">
            <mat-icon>arrow_back</mat-icon>
          </a>
          <h1>Candidates</h1>
        </div>
        <a mat-raised-button color="primary" routerLink="/recruitment/candidates/new">
          <mat-icon>person_add</mat-icon>
          Add Candidate
        </a>
      </header>

      <!-- Filters -->
      <div class="filters-section">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search</mat-label>
          <input matInput [formControl]="searchControl" placeholder="Search by name or email...">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [formControl]="statusControl">
            <mat-option value="">All Statuses</mat-option>
            @for (status of statuses; track status) {
              <mat-option [value]="status">{{ getCandidateStatusLabel(status) }}</mat-option>
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
      } @else if (candidates().length === 0) {
        <div class="empty-state">
          <mat-icon>people_outline</mat-icon>
          <h3>No candidates found</h3>
          @if (hasFilters()) {
            <p>Try adjusting your filters</p>
            <button mat-button color="primary" (click)="clearFilters()">Clear Filters</button>
          } @else {
            <p>Add your first candidate to get started</p>
            <a mat-raised-button color="primary" routerLink="/recruitment/candidates/new">Add Candidate</a>
          }
        </div>
      } @else {
        <div class="table-container">
          <table mat-table [dataSource]="candidates()" class="candidates-table">
            <!-- Reference Column -->
            <ng-container matColumnDef="candidateReference">
              <th mat-header-cell *matHeaderCellDef>Reference</th>
              <td mat-cell *matCellDef="let candidate">
                <span class="reference">{{ candidate.candidateReference }}</span>
              </td>
            </ng-container>

            <!-- Name Column -->
            <ng-container matColumnDef="fullName">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let candidate">
                <a [routerLink]="['/recruitment/candidates', candidate.id]" class="candidate-link">
                  {{ candidate.fullName }}
                </a>
              </td>
            </ng-container>

            <!-- Email Column -->
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let candidate">{{ candidate.email }}</td>
            </ng-container>

            <!-- Current Title Column -->
            <ng-container matColumnDef="currentJobTitle">
              <th mat-header-cell *matHeaderCellDef>Current Title</th>
              <td mat-cell *matCellDef="let candidate">{{ candidate.currentJobTitle || '-' }}</td>
            </ng-container>

            <!-- Experience Column -->
            <ng-container matColumnDef="experienceLevel">
              <th mat-header-cell *matHeaderCellDef>Experience</th>
              <td mat-cell *matCellDef="let candidate">{{ candidate.experienceLevel || '-' }}</td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let candidate">
                <span class="status-badge"
                      [style.background]="getCandidateStatusColor(candidate.status).background"
                      [style.color]="getCandidateStatusColor(candidate.status).color">
                  {{ getCandidateStatusLabel(candidate.status) }}
                </span>
              </td>
            </ng-container>

            <!-- Created Date Column -->
            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>Added</th>
              <td mat-cell *matCellDef="let candidate">
                {{ candidate.createdAt | date:'mediumDate' }}
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let candidate">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <a mat-menu-item [routerLink]="['/recruitment/candidates', candidate.id]">
                    <mat-icon>visibility</mat-icon>
                    <span>View</span>
                  </a>
                  <a mat-menu-item [routerLink]="['/recruitment/candidates', candidate.id, 'edit']">
                    <mat-icon>edit</mat-icon>
                    <span>Edit</span>
                  </a>
                  @if (candidate.status === 'ACTIVE' && !candidate.blacklisted) {
                    <button mat-menu-item (click)="archiveCandidate(candidate)">
                      <mat-icon>archive</mat-icon>
                      <span>Archive</span>
                    </button>
                    <button mat-menu-item (click)="blacklistCandidate(candidate)" class="danger-action">
                      <mat-icon>block</mat-icon>
                      <span>Blacklist</span>
                    </button>
                  }
                  @if (candidate.blacklisted) {
                    <button mat-menu-item (click)="removeFromBlacklist(candidate)">
                      <mat-icon>check_circle</mat-icon>
                      <span>Remove from Blacklist</span>
                    </button>
                  }
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                [class.blacklisted]="row.blacklisted"></tr>
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
    .candidates-list {
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

    .table-container {
      overflow-x: auto;
    }

    .candidates-table {
      width: 100%;
    }

    .reference {
      font-family: monospace;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
    }

    .candidate-link {
      color: #1976d2;
      text-decoration: none;
      font-weight: 500;
    }

    .candidate-link:hover {
      text-decoration: underline;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }

    tr.blacklisted {
      background: #ffebee;
    }

    .danger-action {
      color: #d32f2f;
    }

    mat-paginator {
      margin-top: 16px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CandidatesListComponent implements OnInit, OnDestroy {
  private readonly recruitmentService = inject(RecruitmentService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

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
        this.snackBar.open('Failed to load candidates', 'Dismiss', { duration: 5000 });
        this.loading.set(false);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
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
    if (confirm(`Archive ${candidate.fullName}?`)) {
      this.recruitmentService.archiveCandidate(candidate.id).subscribe({
        next: () => {
          this.snackBar.open('Candidate archived', 'Dismiss', { duration: 3000 });
          this.loadCandidates();
        },
        error: () => this.snackBar.open('Failed to archive candidate', 'Dismiss', { duration: 5000 })
      });
    }
  }

  blacklistCandidate(candidate: Candidate): void {
    const reason = prompt('Reason for blacklisting:');
    if (reason) {
      this.recruitmentService.blacklistCandidate(candidate.id, reason).subscribe({
        next: () => {
          this.snackBar.open('Candidate blacklisted', 'Dismiss', { duration: 3000 });
          this.loadCandidates();
        },
        error: () => this.snackBar.open('Failed to blacklist candidate', 'Dismiss', { duration: 5000 })
      });
    }
  }

  removeFromBlacklist(candidate: Candidate): void {
    if (confirm(`Remove ${candidate.fullName} from blacklist?`)) {
      this.recruitmentService.removeFromBlacklist(candidate.id).subscribe({
        next: () => {
          this.snackBar.open('Removed from blacklist', 'Dismiss', { duration: 3000 });
          this.loadCandidates();
        },
        error: () => this.snackBar.open('Failed to remove from blacklist', 'Dismiss', { duration: 5000 })
      });
    }
  }

  getCandidateStatusLabel(status: CandidateStatus): string {
    return RecruitmentService.getCandidateStatusLabel(status);
  }

  getCandidateStatusColor(status: CandidateStatus): { background: string; color: string } {
    return RecruitmentService.getCandidateStatusColor(status);
  }
}
