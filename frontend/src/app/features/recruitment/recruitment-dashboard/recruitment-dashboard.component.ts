import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  RecruitmentService,
  RecruitmentDashboard,
  JobPostingSummary,
  Interview,
  PipelineStage
} from '../../../core/services/recruitment.service';

@Component({
  selector: 'app-recruitment-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
    DatePipe
  ],
  template: `
    <div class="recruitment-dashboard">
      <header class="dashboard-header">
        <h1>Recruitment</h1>
        <div class="header-actions">
          <a mat-raised-button color="primary" routerLink="/recruitment/jobs/new">
            <mat-icon>add</mat-icon>
            Post Job
          </a>
          <a mat-raised-button routerLink="/recruitment/candidates/new">
            <mat-icon>person_add</mat-icon>
            Add Candidate
          </a>
        </div>
      </header>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      } @else if (error()) {
        <mat-card class="error-card">
          <mat-card-content>
            <mat-icon color="warn">error</mat-icon>
            <p>{{ error() }}</p>
            <button mat-button color="primary" (click)="loadDashboard()">Retry</button>
          </mat-card-content>
        </mat-card>
      } @else {
        <!-- Stats Cards -->
        <div class="stats-grid">
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-icon open-jobs">
                <mat-icon>work</mat-icon>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ dashboard()?.openJobs || 0 }}</span>
                <span class="stat-label">Open Jobs</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-icon candidates">
                <mat-icon>people</mat-icon>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ dashboard()?.totalApplications || 0 }}</span>
                <span class="stat-label">Total Applications</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-icon interviews">
                <mat-icon>event</mat-icon>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ dashboard()?.interviewsThisWeek || 0 }}</span>
                <span class="stat-label">Interviews This Week</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-icon offers">
                <mat-icon>local_offer</mat-icon>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ dashboard()?.offersPending || 0 }}</span>
                <span class="stat-label">Pending Offers</span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Pipeline and Interviews -->
        <div class="content-grid">
          <!-- Pipeline Overview -->
          <mat-card class="pipeline-card">
            <mat-card-header>
              <mat-card-title>Pipeline Overview</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @if (dashboard()?.pipeline?.length) {
                <div class="pipeline-stages">
                  @for (stage of dashboard()!.pipeline; track stage.stage) {
                    <div class="pipeline-stage">
                      <div class="stage-bar" [style.height.%]="getBarHeight(stage.count)">
                        <span class="stage-count">{{ stage.count }}</span>
                      </div>
                      <span class="stage-name">{{ stage.stageName }}</span>
                    </div>
                  }
                </div>
              } @else {
                <div class="empty-state">
                  <mat-icon>analytics</mat-icon>
                  <p>No pipeline data available</p>
                </div>
              }
            </mat-card-content>
          </mat-card>

          <!-- Upcoming Interviews -->
          <mat-card class="interviews-card">
            <mat-card-header>
              <mat-card-title>Upcoming Interviews</mat-card-title>
              <a mat-button color="primary" routerLink="/recruitment/jobs">View All</a>
            </mat-card-header>
            <mat-card-content>
              @if (dashboard()?.upcomingInterviews?.length) {
                <div class="interview-list">
                  @for (interview of dashboard()!.upcomingInterviews.slice(0, 5); track interview.id) {
                    <div class="interview-item">
                      <div class="interview-info">
                        <span class="candidate-name">{{ interview.candidateName }}</span>
                        <span class="job-title">{{ interview.jobTitle }}</span>
                      </div>
                      <div class="interview-meta">
                        <span class="interview-type" [style.background]="getInterviewTypeColor(interview.interviewType).background"
                              [style.color]="getInterviewTypeColor(interview.interviewType).color">
                          {{ getInterviewTypeLabel(interview.interviewType) }}
                        </span>
                        <span class="interview-time">{{ interview.scheduledAt | date:'MMM d, h:mm a' }}</span>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="empty-state">
                  <mat-icon>event_available</mat-icon>
                  <p>No upcoming interviews</p>
                </div>
              }
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Recent Job Postings -->
        <mat-card class="jobs-card">
          <mat-card-header>
            <mat-card-title>Recent Job Postings</mat-card-title>
            <a mat-button color="primary" routerLink="/recruitment/jobs">View All Jobs</a>
          </mat-card-header>
          <mat-card-content>
            @if (dashboard()?.recentJobs?.length) {
              <table mat-table [dataSource]="dashboard()!.recentJobs" class="jobs-table">
                <ng-container matColumnDef="title">
                  <th mat-header-cell *matHeaderCellDef>Title</th>
                  <td mat-cell *matCellDef="let job">
                    <a [routerLink]="['/recruitment/jobs', job.id]" class="job-link">
                      {{ job.title }}
                    </a>
                  </td>
                </ng-container>

                <ng-container matColumnDef="department">
                  <th mat-header-cell *matHeaderCellDef>Department</th>
                  <td mat-cell *matCellDef="let job">{{ job.departmentName || '-' }}</td>
                </ng-container>

                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let job">
                    <span class="status-badge" [style.background]="getJobStatusColor(job.status).background"
                          [style.color]="getJobStatusColor(job.status).color">
                      {{ getJobStatusLabel(job.status) }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="applications">
                  <th mat-header-cell *matHeaderCellDef>Applications</th>
                  <td mat-cell *matCellDef="let job">{{ job.applicationCount }}</td>
                </ng-container>

                <ng-container matColumnDef="closingDate">
                  <th mat-header-cell *matHeaderCellDef>Closing Date</th>
                  <td mat-cell *matCellDef="let job">{{ job.closingDate | date:'mediumDate' }}</td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="jobColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: jobColumns;"></tr>
              </table>
            } @else {
              <div class="empty-state">
                <mat-icon>work_off</mat-icon>
                <p>No job postings yet</p>
                <a mat-raised-button color="primary" routerLink="/recruitment/jobs/new">Post a Job</a>
              </div>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .recruitment-dashboard {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .dashboard-header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 500;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 400px;
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

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: white;
    }

    .stat-icon.open-jobs { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .stat-icon.candidates { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
    .stat-icon.interviews { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
    .stat-icon.offers { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 600;
      line-height: 1;
    }

    .stat-label {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
      margin-top: 4px;
    }

    /* Content Grid */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }

    @media (max-width: 900px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Pipeline Card */
    .pipeline-card mat-card-header,
    .interviews-card mat-card-header,
    .jobs-card mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .pipeline-stages {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      height: 200px;
      padding: 16px 0;
    }

    .pipeline-stage {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
    }

    .stage-bar {
      width: 40px;
      min-height: 20px;
      background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
      border-radius: 4px 4px 0 0;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 4px;
      transition: height 0.3s ease;
    }

    .stage-count {
      color: white;
      font-weight: 600;
      font-size: 12px;
    }

    .stage-name {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.6);
      margin-top: 8px;
      text-align: center;
      max-width: 60px;
    }

    /* Interview List */
    .interview-list {
      display: flex;
      flex-direction: column;
    }

    .interview-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }

    .interview-item:last-child {
      border-bottom: none;
    }

    .interview-info {
      display: flex;
      flex-direction: column;
    }

    .candidate-name {
      font-weight: 500;
    }

    .job-title {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.6);
    }

    .interview-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .interview-type {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 500;
    }

    .interview-time {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
    }

    /* Jobs Table */
    .jobs-card {
      margin-bottom: 24px;
    }

    .jobs-table {
      width: 100%;
    }

    .job-link {
      color: #1976d2;
      text-decoration: none;
      font-weight: 500;
    }

    .job-link:hover {
      text-decoration: underline;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 24px;
      color: rgba(0, 0, 0, 0.6);
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-state p {
      margin-bottom: 16px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecruitmentDashboardComponent implements OnInit {
  private readonly recruitmentService = inject(RecruitmentService);

  dashboard = signal<RecruitmentDashboard | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  jobColumns = ['title', 'department', 'status', 'applications', 'closingDate'];

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    this.recruitmentService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load dashboard', err);
        this.error.set('Failed to load recruitment dashboard. Please try again.');
        this.loading.set(false);
      }
    });
  }

  getBarHeight(count: number): number {
    const maxCount = Math.max(...(this.dashboard()?.pipeline?.map(s => s.count) || [1]));
    return Math.max(20, (count / maxCount) * 100);
  }

  getJobStatusLabel(status: string): string {
    return RecruitmentService.getJobStatusLabel(status as any);
  }

  getJobStatusColor(status: string): { background: string; color: string } {
    return RecruitmentService.getJobStatusColor(status as any);
  }

  getInterviewTypeLabel(type: string): string {
    return RecruitmentService.getInterviewTypeLabel(type as any);
  }

  getInterviewTypeColor(type: string): { background: string; color: string } {
    // Using stage colors for interview types
    const colors: Record<string, { background: string; color: string }> = {
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
}
