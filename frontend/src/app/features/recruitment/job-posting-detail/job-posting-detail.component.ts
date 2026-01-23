import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  RecruitmentService,
  JobPosting,
  Application,
  RecruitmentStage
} from '../../../core/services/recruitment.service';
import { StageChangeDialogComponent } from '../dialogs/stage-change-dialog.component';
import { ScheduleInterviewDialogComponent } from '../dialogs/schedule-interview-dialog.component';
import { MakeOfferDialogComponent } from '../dialogs/make-offer-dialog.component';

@Component({
  selector: 'app-job-posting-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatMenuModule,
    MatChipsModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDialogModule,
    DatePipe
  ],
  template: `
    <div class="job-detail">
      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      } @else if (error()) {
        <mat-card class="error-card">
          <mat-card-content>
            <mat-icon color="warn">error</mat-icon>
            <p>{{ error() }}</p>
            <button mat-button color="primary" routerLink="/recruitment/jobs">Back to Jobs</button>
          </mat-card-content>
        </mat-card>
      } @else if (job()) {
        <!-- Header -->
        <header class="detail-header">
          <div class="header-left">
            <a routerLink="/recruitment/jobs" class="back-link">
              <mat-icon>arrow_back</mat-icon>
            </a>
            <div class="header-info">
              <h1>{{ job()!.title }}</h1>
              <div class="header-meta">
                <span class="job-reference">{{ job()!.jobReference }}</span>
                <span class="status-badge"
                      [style.background]="getJobStatusColor(job()!.status).background"
                      [style.color]="getJobStatusColor(job()!.status).color">
                  {{ getJobStatusLabel(job()!.status) }}
                </span>
                @if (job()!.remote) {
                  <mat-chip>Remote</mat-chip>
                }
              </div>
            </div>
          </div>
          <div class="header-actions">
            <a mat-stroked-button [routerLink]="['/recruitment/jobs', job()!.id, 'edit']">
              <mat-icon>edit</mat-icon>
              Edit
            </a>
            @if (job()!.status === 'DRAFT') {
              <button mat-raised-button color="primary" (click)="publishJob()">
                <mat-icon>publish</mat-icon>
                Publish
              </button>
            }
            @if (job()!.status === 'OPEN') {
              <button mat-button [matMenuTriggerFor]="statusMenu">
                <mat-icon>more_vert</mat-icon>
                Actions
              </button>
              <mat-menu #statusMenu="matMenu">
                <button mat-menu-item (click)="putOnHold()">
                  <mat-icon>pause</mat-icon>
                  <span>Put On Hold</span>
                </button>
                <button mat-menu-item (click)="closeJob()">
                  <mat-icon>close</mat-icon>
                  <span>Close Job</span>
                </button>
                <button mat-menu-item (click)="markAsFilled()">
                  <mat-icon>check_circle</mat-icon>
                  <span>Mark as Filled</span>
                </button>
              </mat-menu>
            }
            @if (job()!.status === 'ON_HOLD') {
              <button mat-raised-button color="primary" (click)="reopenJob()">
                <mat-icon>play_arrow</mat-icon>
                Reopen
              </button>
            }
          </div>
        </header>

        <!-- Stats -->
        <div class="stats-row">
          <div class="stat-item">
            <mat-icon>people</mat-icon>
            <span class="stat-value">{{ job()!.applicationCount }}</span>
            <span class="stat-label">Applications</span>
          </div>
          <div class="stat-item">
            <mat-icon>visibility</mat-icon>
            <span class="stat-value">{{ job()!.viewCount }}</span>
            <span class="stat-label">Views</span>
          </div>
          <div class="stat-item">
            <mat-icon>work</mat-icon>
            <span class="stat-value">{{ job()!.positionsFilled }}/{{ job()!.positionsAvailable }}</span>
            <span class="stat-label">Positions Filled</span>
          </div>
          @if (job()!.closingDate) {
            <div class="stat-item">
              <mat-icon>event</mat-icon>
              <span class="stat-value">{{ job()!.closingDate | date:'mediumDate' }}</span>
              <span class="stat-label">Closing Date</span>
            </div>
          }
        </div>

        <!-- Tabs -->
        <mat-tab-group>
          <!-- Overview Tab -->
          <mat-tab label="Overview">
            <div class="tab-content">
              <mat-card>
                <mat-card-content>
                  <div class="detail-grid">
                    <div class="detail-section">
                      <h3>Basic Information</h3>
                      <div class="detail-row">
                        <span class="label">Department</span>
                        <span class="value">{{ job()!.departmentName || '-' }}</span>
                      </div>
                      <div class="detail-row">
                        <span class="label">Location</span>
                        <span class="value">{{ job()!.location || '-' }}</span>
                      </div>
                      <div class="detail-row">
                        <span class="label">Employment Type</span>
                        <span class="value">{{ getEmploymentTypeLabel(job()!.employmentType) }}</span>
                      </div>
                      <div class="detail-row">
                        <span class="label">Experience Required</span>
                        <span class="value">
                          @if (job()!.experienceYearsMin || job()!.experienceYearsMax) {
                            {{ job()!.experienceYearsMin || 0 }} - {{ job()!.experienceYearsMax || 'Any' }} years
                          } @else {
                            Not specified
                          }
                        </span>
                      </div>
                      <div class="detail-row">
                        <span class="label">Salary Range</span>
                        <span class="value">{{ job()!.salaryRange || 'Not disclosed' }}</span>
                      </div>
                    </div>

                    <div class="detail-section">
                      <h3>Team</h3>
                      <div class="detail-row">
                        <span class="label">Hiring Manager</span>
                        <span class="value">{{ job()!.hiringManagerName || '-' }}</span>
                      </div>
                      <div class="detail-row">
                        <span class="label">Recruiter</span>
                        <span class="value">{{ job()!.recruiterName || '-' }}</span>
                      </div>
                      <div class="detail-row">
                        <span class="label">Posted Date</span>
                        <span class="value">{{ job()!.postingDate | date:'mediumDate' }}</span>
                      </div>
                      <div class="detail-row">
                        <span class="label">Internal Only</span>
                        <span class="value">{{ job()!.internalOnly ? 'Yes' : 'No' }}</span>
                      </div>
                    </div>
                  </div>

                  @if (job()!.description) {
                    <div class="text-section">
                      <h3>Description</h3>
                      <p class="text-content">{{ job()!.description }}</p>
                    </div>
                  }

                  @if (job()!.requirements) {
                    <div class="text-section">
                      <h3>Requirements</h3>
                      <p class="text-content">{{ job()!.requirements }}</p>
                    </div>
                  }

                  @if (job()!.responsibilities) {
                    <div class="text-section">
                      <h3>Responsibilities</h3>
                      <p class="text-content">{{ job()!.responsibilities }}</p>
                    </div>
                  }

                  @if (job()!.qualifications) {
                    <div class="text-section">
                      <h3>Qualifications</h3>
                      <p class="text-content">{{ job()!.qualifications }}</p>
                    </div>
                  }

                  @if (job()!.skills) {
                    <div class="text-section">
                      <h3>Skills</h3>
                      <p class="text-content">{{ job()!.skills }}</p>
                    </div>
                  }

                  @if (job()!.benefits) {
                    <div class="text-section">
                      <h3>Benefits</h3>
                      <p class="text-content">{{ job()!.benefits }}</p>
                    </div>
                  }
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Candidates Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              Candidates ({{ applications().length }})
            </ng-template>
            <div class="tab-content">
              <!-- Pipeline Summary -->
              @if (applications().length > 0) {
                <div class="pipeline-summary">
                  @for (stage of pipelineStages; track stage) {
                    <div class="pipeline-item"
                         [class.active]="selectedStage() === stage"
                         (click)="filterByStage(stage)">
                      <span class="pipeline-count">{{ getStageCount(stage) }}</span>
                      <span class="pipeline-label">{{ getStageLabel(stage) }}</span>
                    </div>
                  }
                </div>
              }

              @if (applicationsLoading()) {
                <div class="loading-container small">
                  <mat-spinner diameter="32"></mat-spinner>
                </div>
              } @else if (filteredApplications().length === 0) {
                <div class="empty-state">
                  <mat-icon>people_outline</mat-icon>
                  <h3>No candidates yet</h3>
                  <p>Candidates who apply to this job will appear here</p>
                </div>
              } @else {
                <table mat-table [dataSource]="filteredApplications()" class="candidates-table">
                  <ng-container matColumnDef="candidate">
                    <th mat-header-cell *matHeaderCellDef>Candidate</th>
                    <td mat-cell *matCellDef="let app">
                      <div class="candidate-cell">
                        <a [routerLink]="['/recruitment/candidates', app.candidate.id]" class="candidate-link">
                          {{ app.candidate.fullName }}
                        </a>
                        <span class="candidate-title">{{ app.candidate.currentJobTitle || '-' }}</span>
                      </div>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="stage">
                    <th mat-header-cell *matHeaderCellDef>Stage</th>
                    <td mat-cell *matCellDef="let app">
                      <span class="stage-badge"
                            [style.background]="getStageColor(app.stage).background"
                            [style.color]="getStageColor(app.stage).color">
                        {{ getStageLabel(app.stage) }}
                      </span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="rating">
                    <th mat-header-cell *matHeaderCellDef>Rating</th>
                    <td mat-cell *matCellDef="let app">
                      @if (app.overallRating) {
                        <div class="rating">
                          @for (star of [1, 2, 3, 4, 5]; track star) {
                            <mat-icon [class.filled]="star <= app.overallRating">star</mat-icon>
                          }
                        </div>
                      } @else {
                        <span class="no-rating">-</span>
                      }
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="applied">
                    <th mat-header-cell *matHeaderCellDef>Applied</th>
                    <td mat-cell *matCellDef="let app">
                      {{ app.applicationDate | date:'mediumDate' }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef></th>
                    <td mat-cell *matCellDef="let app">
                      <button mat-icon-button [matMenuTriggerFor]="appMenu">
                        <mat-icon>more_vert</mat-icon>
                      </button>
                      <mat-menu #appMenu="matMenu">
                        <a mat-menu-item [routerLink]="['/recruitment/candidates', app.candidate.id]">
                          <mat-icon>person</mat-icon>
                          <span>View Candidate</span>
                        </a>
                        <button mat-menu-item (click)="changeStage(app)">
                          <mat-icon>trending_up</mat-icon>
                          <span>Change Stage</span>
                        </button>
                        <button mat-menu-item (click)="scheduleInterview(app)">
                          <mat-icon>event</mat-icon>
                          <span>Schedule Interview</span>
                        </button>
                        @if (app.stage !== 'OFFER' && app.stage !== 'COMPLETED') {
                          <button mat-menu-item (click)="makeOffer(app)">
                            <mat-icon>local_offer</mat-icon>
                            <span>Make Offer</span>
                          </button>
                        }
                        <button mat-menu-item (click)="toggleStarred(app)">
                          <mat-icon>{{ app.starred ? 'star' : 'star_border' }}</mat-icon>
                          <span>{{ app.starred ? 'Unstar' : 'Star' }}</span>
                        </button>
                        <button mat-menu-item (click)="rejectApplication(app)" class="reject-action">
                          <mat-icon>block</mat-icon>
                          <span>Reject</span>
                        </button>
                      </mat-menu>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="applicationColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: applicationColumns;"
                      [class.starred]="row.starred"></tr>
                </table>
              }
            </div>
          </mat-tab>

          <!-- Statistics Tab -->
          <mat-tab label="Statistics">
            <div class="tab-content">
              <mat-card>
                <mat-card-content>
                  <div class="stats-grid">
                    <div class="stat-card">
                      <h4>Conversion Rate</h4>
                      <span class="big-stat">{{ conversionRate() }}%</span>
                      <span class="stat-desc">Applications to Hire</span>
                    </div>
                    <div class="stat-card">
                      <h4>Avg. Time in Pipeline</h4>
                      <span class="big-stat">{{ avgDaysInPipeline() }}</span>
                      <span class="stat-desc">Days</span>
                    </div>
                    <div class="stat-card">
                      <h4>Interview Rate</h4>
                      <span class="big-stat">{{ interviewRate() }}%</span>
                      <span class="stat-desc">Applications to Interview</span>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .job-detail {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 400px;
    }

    .loading-container.small {
      height: 200px;
    }

    .error-card mat-card-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      text-align: center;
    }

    .error-card mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    /* Header */
    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .header-left {
      display: flex;
      gap: 12px;
    }

    .back-link {
      color: rgba(0, 0, 0, 0.6);
      margin-top: 4px;
    }

    .header-info h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 500;
    }

    .header-meta {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .job-reference {
      font-family: monospace;
      font-size: 13px;
      color: rgba(0, 0, 0, 0.6);
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    /* Stats Row */
    .stats-row {
      display: flex;
      gap: 32px;
      padding: 16px 24px;
      background: #f5f5f5;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .stat-item mat-icon {
      color: rgba(0, 0, 0, 0.5);
    }

    .stat-value {
      font-weight: 600;
      font-size: 18px;
    }

    .stat-label {
      color: rgba(0, 0, 0, 0.6);
      font-size: 13px;
    }

    /* Tab Content */
    .tab-content {
      padding: 24px 0;
    }

    /* Detail Grid */
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-bottom: 24px;
    }

    @media (max-width: 768px) {
      .detail-grid {
        grid-template-columns: 1fr;
      }
    }

    .detail-section h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .detail-row .label {
      color: rgba(0, 0, 0, 0.6);
    }

    .detail-row .value {
      font-weight: 500;
    }

    .text-section {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
    }

    .text-section h3 {
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 500;
    }

    .text-content {
      white-space: pre-wrap;
      line-height: 1.6;
      color: rgba(0, 0, 0, 0.8);
    }

    /* Pipeline Summary */
    .pipeline-summary {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .pipeline-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 16px;
      background: #f5f5f5;
      border-radius: 8px;
      cursor: pointer;
      min-width: 80px;
      transition: all 0.2s;
    }

    .pipeline-item:hover {
      background: #eeeeee;
    }

    .pipeline-item.active {
      background: #e3f2fd;
      border: 2px solid #1976d2;
    }

    .pipeline-count {
      font-size: 24px;
      font-weight: 600;
    }

    .pipeline-label {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.6);
      text-align: center;
    }

    /* Candidates Table */
    .candidates-table {
      width: 100%;
    }

    .candidate-cell {
      display: flex;
      flex-direction: column;
    }

    .candidate-link {
      color: #1976d2;
      text-decoration: none;
      font-weight: 500;
    }

    .candidate-link:hover {
      text-decoration: underline;
    }

    .candidate-title {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
    }

    .stage-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
    }

    .rating {
      display: flex;
    }

    .rating mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #e0e0e0;
    }

    .rating mat-icon.filled {
      color: #ffc107;
    }

    .no-rating {
      color: rgba(0, 0, 0, 0.4);
    }

    tr.starred {
      background: #fffde7;
    }

    .reject-action {
      color: #d32f2f;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 64px 24px;
      color: rgba(0, 0, 0, 0.6);
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

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .stat-card {
      text-align: center;
      padding: 24px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .stat-card h4 {
      margin: 0 0 8px 0;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
    }

    .big-stat {
      font-size: 36px;
      font-weight: 600;
      color: #1976d2;
    }

    .stat-desc {
      display: block;
      font-size: 13px;
      color: rgba(0, 0, 0, 0.6);
      margin-top: 4px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobPostingDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly recruitmentService = inject(RecruitmentService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  job = signal<JobPosting | null>(null);
  applications = signal<Application[]>([]);
  loading = signal(true);
  applicationsLoading = signal(false);
  error = signal<string | null>(null);
  selectedStage = signal<RecruitmentStage | null>(null);

  pipelineStages: RecruitmentStage[] = ['NEW', 'SCREENING', 'FIRST_INTERVIEW', 'SECOND_INTERVIEW', 'FINAL_INTERVIEW', 'OFFER', 'COMPLETED'];
  applicationColumns = ['candidate', 'stage', 'rating', 'applied', 'actions'];

  filteredApplications = computed(() => {
    const stage = this.selectedStage();
    const apps = this.applications();
    if (!stage) return apps;
    return apps.filter(a => a.stage === stage);
  });

  conversionRate = computed(() => {
    const apps = this.applications();
    if (apps.length === 0) return 0;
    const hired = apps.filter(a => a.status === 'HIRED').length;
    return Math.round((hired / apps.length) * 100);
  });

  avgDaysInPipeline = computed(() => {
    const apps = this.applications();
    if (apps.length === 0) return 0;
    const totalDays = apps.reduce((sum, a) => sum + a.daysSinceApplication, 0);
    return Math.round(totalDays / apps.length);
  });

  interviewRate = computed(() => {
    const apps = this.applications();
    if (apps.length === 0) return 0;
    const interviewed = apps.filter(a =>
      a.stage === 'FIRST_INTERVIEW' || a.stage === 'SECOND_INTERVIEW' ||
      a.stage === 'FINAL_INTERVIEW' || a.stage === 'OFFER' ||
      a.stage === 'COMPLETED' || a.status === 'HIRED'
    ).length;
    return Math.round((interviewed / apps.length) * 100);
  });

  ngOnInit(): void {
    const jobId = this.route.snapshot.paramMap.get('id');
    if (jobId) {
      this.loadJob(jobId);
      this.loadApplications(jobId);
    } else {
      this.error.set('Job ID not found');
      this.loading.set(false);
    }
  }

  loadJob(jobId: string): void {
    this.loading.set(true);
    this.recruitmentService.getJob(jobId).subscribe({
      next: (job) => {
        this.job.set(job);
        this.loading.set(false);
        // Track view
        this.recruitmentService.incrementJobViews(jobId).subscribe();
      },
      error: (err) => {
        console.error('Failed to load job', err);
        this.error.set('Failed to load job details');
        this.loading.set(false);
      }
    });
  }

  loadApplications(jobId: string): void {
    this.applicationsLoading.set(true);
    this.recruitmentService.getApplicationsForJob(jobId).subscribe({
      next: (apps) => {
        this.applications.set(apps);
        this.applicationsLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load applications', err);
        this.applicationsLoading.set(false);
      }
    });
  }

  filterByStage(stage: RecruitmentStage): void {
    if (this.selectedStage() === stage) {
      this.selectedStage.set(null);
    } else {
      this.selectedStage.set(stage);
    }
  }

  getStageCount(stage: RecruitmentStage): number {
    return this.applications().filter(a => a.stage === stage).length;
  }

  publishJob(): void {
    if (!this.job()) return;
    const closingDate = new Date();
    closingDate.setMonth(closingDate.getMonth() + 1);
    const dateStr = closingDate.toISOString().split('T')[0];

    this.recruitmentService.publishJob(this.job()!.id, dateStr).subscribe({
      next: (job) => {
        this.job.set(job);
        this.snackBar.open('Job published successfully', 'Dismiss', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to publish job', 'Dismiss', { duration: 5000 })
    });
  }

  putOnHold(): void {
    if (!this.job()) return;
    this.recruitmentService.putJobOnHold(this.job()!.id).subscribe({
      next: (job) => {
        this.job.set(job);
        this.snackBar.open('Job put on hold', 'Dismiss', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to put job on hold', 'Dismiss', { duration: 5000 })
    });
  }

  reopenJob(): void {
    if (!this.job()) return;
    this.recruitmentService.reopenJob(this.job()!.id).subscribe({
      next: (job) => {
        this.job.set(job);
        this.snackBar.open('Job reopened', 'Dismiss', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to reopen job', 'Dismiss', { duration: 5000 })
    });
  }

  closeJob(): void {
    if (!this.job()) return;
    this.recruitmentService.closeJob(this.job()!.id).subscribe({
      next: (job) => {
        this.job.set(job);
        this.snackBar.open('Job closed', 'Dismiss', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to close job', 'Dismiss', { duration: 5000 })
    });
  }

  markAsFilled(): void {
    if (!this.job()) return;
    this.recruitmentService.markJobAsFilled(this.job()!.id).subscribe({
      next: (job) => {
        this.job.set(job);
        this.snackBar.open('Job marked as filled', 'Dismiss', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to mark job as filled', 'Dismiss', { duration: 5000 })
    });
  }

  changeStage(app: Application): void {
    const dialogRef = this.dialog.open(StageChangeDialogComponent, {
      width: '400px',
      data: { application: app }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadApplications(this.job()!.id);
      }
    });
  }

  scheduleInterview(app: Application): void {
    const dialogRef = this.dialog.open(ScheduleInterviewDialogComponent, {
      width: '500px',
      data: { application: app }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadApplications(this.job()!.id);
        this.snackBar.open('Interview scheduled', 'Dismiss', { duration: 3000 });
      }
    });
  }

  makeOffer(app: Application): void {
    const dialogRef = this.dialog.open(MakeOfferDialogComponent, {
      width: '500px',
      data: { application: app }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadApplications(this.job()!.id);
        this.snackBar.open('Offer sent', 'Dismiss', { duration: 3000 });
      }
    });
  }

  toggleStarred(app: Application): void {
    this.recruitmentService.toggleStarred(app.id).subscribe({
      next: () => {
        this.loadApplications(this.job()!.id);
      },
      error: () => this.snackBar.open('Failed to update', 'Dismiss', { duration: 5000 })
    });
  }

  rejectApplication(app: Application): void {
    const reason = prompt('Rejection reason:');
    if (reason) {
      this.recruitmentService.rejectApplication(app.id, reason, 'current-user').subscribe({
        next: () => {
          this.loadApplications(this.job()!.id);
          this.snackBar.open('Application rejected', 'Dismiss', { duration: 3000 });
        },
        error: () => this.snackBar.open('Failed to reject application', 'Dismiss', { duration: 5000 })
      });
    }
  }

  getJobStatusLabel(status: string): string {
    return RecruitmentService.getJobStatusLabel(status as any);
  }

  getJobStatusColor(status: string): { background: string; color: string } {
    return RecruitmentService.getJobStatusColor(status as any);
  }

  getEmploymentTypeLabel(type: string): string {
    return RecruitmentService.getEmploymentTypeLabel(type as any);
  }

  getStageLabel(stage: RecruitmentStage): string {
    return RecruitmentService.getRecruitmentStageLabel(stage);
  }

  getStageColor(stage: RecruitmentStage): { background: string; color: string } {
    return RecruitmentService.getStageColor(stage);
  }
}
