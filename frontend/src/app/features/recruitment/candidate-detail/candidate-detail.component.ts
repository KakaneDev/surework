import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
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
  Candidate,
  Application,
  Interview
} from '../../../core/services/recruitment.service';

@Component({
  selector: 'app-candidate-detail',
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
    <div class="candidate-detail">
      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      } @else if (error()) {
        <mat-card class="error-card">
          <mat-card-content>
            <mat-icon color="warn">error</mat-icon>
            <p>{{ error() }}</p>
            <button mat-button color="primary" routerLink="/recruitment/candidates">Back to Candidates</button>
          </mat-card-content>
        </mat-card>
      } @else if (candidate()) {
        <!-- Header -->
        <header class="detail-header">
          <div class="header-left">
            <a routerLink="/recruitment/candidates" class="back-link">
              <mat-icon>arrow_back</mat-icon>
            </a>
            <div class="header-info">
              <h1>{{ candidate()!.fullName }}</h1>
              <div class="header-meta">
                <span class="candidate-reference">{{ candidate()!.candidateReference }}</span>
                <span class="status-badge"
                      [style.background]="getCandidateStatusColor(candidate()!.status).background"
                      [style.color]="getCandidateStatusColor(candidate()!.status).color">
                  {{ getCandidateStatusLabel(candidate()!.status) }}
                </span>
                @if (candidate()!.blacklisted) {
                  <mat-chip color="warn">Blacklisted</mat-chip>
                }
              </div>
            </div>
          </div>
          <div class="header-actions">
            <a mat-stroked-button [routerLink]="['/recruitment/candidates', candidate()!.id, 'edit']">
              <mat-icon>edit</mat-icon>
              Edit
            </a>
            @if (candidate()!.status === 'ACTIVE' && !candidate()!.blacklisted) {
              <button mat-button [matMenuTriggerFor]="actionMenu">
                <mat-icon>more_vert</mat-icon>
                Actions
              </button>
              <mat-menu #actionMenu="matMenu">
                <button mat-menu-item (click)="archiveCandidate()">
                  <mat-icon>archive</mat-icon>
                  <span>Archive</span>
                </button>
                <button mat-menu-item (click)="blacklistCandidate()" class="danger-action">
                  <mat-icon>block</mat-icon>
                  <span>Blacklist</span>
                </button>
              </mat-menu>
            }
            @if (candidate()!.blacklisted) {
              <button mat-raised-button color="primary" (click)="removeFromBlacklist()">
                Remove from Blacklist
              </button>
            }
          </div>
        </header>

        <!-- Tabs -->
        <mat-tab-group>
          <!-- Profile Tab -->
          <mat-tab label="Profile">
            <div class="tab-content">
              <div class="profile-grid">
                <!-- Contact Information -->
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Contact Information</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="info-row">
                      <mat-icon>email</mat-icon>
                      <a [href]="'mailto:' + candidate()!.email">{{ candidate()!.email }}</a>
                    </div>
                    @if (candidate()!.phone) {
                      <div class="info-row">
                        <mat-icon>phone</mat-icon>
                        <a [href]="'tel:' + candidate()!.phone">{{ candidate()!.phone }}</a>
                      </div>
                    }
                    @if (candidate()!.city || candidate()!.province) {
                      <div class="info-row">
                        <mat-icon>location_on</mat-icon>
                        <span>{{ getLocation() }}</span>
                      </div>
                    }
                    @if (candidate()!.linkedinUrl) {
                      <div class="info-row">
                        <mat-icon>link</mat-icon>
                        <a [href]="candidate()!.linkedinUrl" target="_blank">LinkedIn Profile</a>
                      </div>
                    }
                    @if (candidate()!.portfolioUrl) {
                      <div class="info-row">
                        <mat-icon>work</mat-icon>
                        <a [href]="candidate()!.portfolioUrl" target="_blank">Portfolio</a>
                      </div>
                    }
                  </mat-card-content>
                </mat-card>

                <!-- Professional Information -->
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Professional Information</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="detail-row">
                      <span class="label">Current Title</span>
                      <span class="value">{{ candidate()!.currentJobTitle || '-' }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Current Employer</span>
                      <span class="value">{{ candidate()!.currentEmployer || '-' }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Experience</span>
                      <span class="value">{{ candidate()!.experienceLevel || '-' }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Qualification</span>
                      <span class="value">{{ candidate()!.highestQualification || '-' }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Field of Study</span>
                      <span class="value">{{ candidate()!.fieldOfStudy || '-' }}</span>
                    </div>
                  </mat-card-content>
                </mat-card>

                <!-- Preferences -->
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Preferences</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="detail-row">
                      <span class="label">Expected Salary</span>
                      <span class="value">
                        @if (candidate()!.expectedSalary) {
                          R{{ candidate()!.expectedSalary | number }}
                        } @else {
                          Not specified
                        }
                      </span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Notice Period</span>
                      <span class="value">
                        @if (candidate()!.noticePeriodDays) {
                          {{ candidate()!.noticePeriodDays }} days
                        } @else {
                          Not specified
                        }
                      </span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Available From</span>
                      <span class="value">{{ candidate()!.availableFrom | date:'mediumDate' }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Willing to Relocate</span>
                      <span class="value">{{ candidate()!.willingToRelocate ? 'Yes' : 'No' }}</span>
                    </div>
                    @if (candidate()!.preferredLocations) {
                      <div class="detail-row">
                        <span class="label">Preferred Locations</span>
                        <span class="value">{{ candidate()!.preferredLocations }}</span>
                      </div>
                    }
                  </mat-card-content>
                </mat-card>

                <!-- Skills -->
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Skills & Languages</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    @if (candidate()!.skills) {
                      <div class="skills-section">
                        <h4>Skills</h4>
                        <p>{{ candidate()!.skills }}</p>
                      </div>
                    }
                    @if (candidate()!.languages) {
                      <div class="skills-section">
                        <h4>Languages</h4>
                        <p>{{ candidate()!.languages }}</p>
                      </div>
                    }
                    @if (!candidate()!.skills && !candidate()!.languages) {
                      <p class="no-data">No skills or languages specified</p>
                    }
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>

          <!-- Applications Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              Applications ({{ applications().length }})
            </ng-template>
            <div class="tab-content">
              @if (applications().length === 0) {
                <div class="empty-state">
                  <mat-icon>work_outline</mat-icon>
                  <h3>No applications yet</h3>
                  <p>This candidate hasn't applied to any positions</p>
                </div>
              } @else {
                <table mat-table [dataSource]="applications()" class="applications-table">
                  <ng-container matColumnDef="job">
                    <th mat-header-cell *matHeaderCellDef>Position</th>
                    <td mat-cell *matCellDef="let app">
                      <a [routerLink]="['/recruitment/jobs', app.job.id]" class="job-link">
                        {{ app.job.title }}
                      </a>
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

                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let app">
                      {{ getApplicationStatusLabel(app.status) }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="applied">
                    <th mat-header-cell *matHeaderCellDef>Applied</th>
                    <td mat-cell *matCellDef="let app">
                      {{ app.applicationDate | date:'mediumDate' }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="days">
                    <th mat-header-cell *matHeaderCellDef>Days in Pipeline</th>
                    <td mat-cell *matCellDef="let app">{{ app.daysSinceApplication }}</td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="applicationColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: applicationColumns;"></tr>
                </table>
              }
            </div>
          </mat-tab>

          <!-- Source Tab -->
          <mat-tab label="Source">
            <div class="tab-content">
              <mat-card>
                <mat-card-content>
                  <div class="detail-row">
                    <span class="label">Source</span>
                    <span class="value">{{ candidate()!.source || 'Not specified' }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Internal Candidate</span>
                    <span class="value">{{ candidate()!.internalCandidate ? 'Yes' : 'No' }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Added On</span>
                    <span class="value">{{ candidate()!.createdAt | date:'medium' }}</span>
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
    .candidate-detail {
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

    .candidate-reference {
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

    .danger-action {
      color: #d32f2f;
    }

    /* Tab Content */
    .tab-content {
      padding: 24px 0;
    }

    /* Profile Grid */
    .profile-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }

    @media (max-width: 900px) {
      .profile-grid {
        grid-template-columns: 1fr;
      }
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
    }

    .info-row mat-icon {
      color: rgba(0, 0, 0, 0.5);
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .info-row a {
      color: #1976d2;
      text-decoration: none;
    }

    .info-row a:hover {
      text-decoration: underline;
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

    .skills-section {
      margin-bottom: 16px;
    }

    .skills-section:last-child {
      margin-bottom: 0;
    }

    .skills-section h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
    }

    .skills-section p {
      margin: 0;
      line-height: 1.6;
    }

    .no-data {
      color: rgba(0, 0, 0, 0.4);
      font-style: italic;
    }

    /* Applications Table */
    .applications-table {
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

    .stage-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CandidateDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly recruitmentService = inject(RecruitmentService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  candidate = signal<Candidate | null>(null);
  applications = signal<Application[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  applicationColumns = ['job', 'stage', 'status', 'applied', 'days'];

  ngOnInit(): void {
    const candidateId = this.route.snapshot.paramMap.get('id');
    if (candidateId) {
      this.loadCandidate(candidateId);
      this.loadApplications(candidateId);
    } else {
      this.error.set('Candidate ID not found');
      this.loading.set(false);
    }
  }

  loadCandidate(candidateId: string): void {
    this.loading.set(true);
    this.recruitmentService.getCandidate(candidateId).subscribe({
      next: (candidate) => {
        this.candidate.set(candidate);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load candidate', err);
        this.error.set('Failed to load candidate details');
        this.loading.set(false);
      }
    });
  }

  loadApplications(candidateId: string): void {
    this.recruitmentService.getApplicationsForCandidate(candidateId).subscribe({
      next: (apps) => {
        this.applications.set(apps);
      },
      error: (err) => {
        console.error('Failed to load applications', err);
      }
    });
  }

  archiveCandidate(): void {
    if (!this.candidate()) return;
    if (confirm(`Archive ${this.candidate()!.fullName}?`)) {
      this.recruitmentService.archiveCandidate(this.candidate()!.id).subscribe({
        next: () => {
          this.snackBar.open('Candidate archived', 'Dismiss', { duration: 3000 });
          this.loadCandidate(this.candidate()!.id);
        },
        error: () => this.snackBar.open('Failed to archive candidate', 'Dismiss', { duration: 5000 })
      });
    }
  }

  blacklistCandidate(): void {
    if (!this.candidate()) return;
    const reason = prompt('Reason for blacklisting:');
    if (reason) {
      this.recruitmentService.blacklistCandidate(this.candidate()!.id, reason).subscribe({
        next: () => {
          this.snackBar.open('Candidate blacklisted', 'Dismiss', { duration: 3000 });
          this.loadCandidate(this.candidate()!.id);
        },
        error: () => this.snackBar.open('Failed to blacklist candidate', 'Dismiss', { duration: 5000 })
      });
    }
  }

  removeFromBlacklist(): void {
    if (!this.candidate()) return;
    if (confirm(`Remove ${this.candidate()!.fullName} from blacklist?`)) {
      this.recruitmentService.removeFromBlacklist(this.candidate()!.id).subscribe({
        next: () => {
          this.snackBar.open('Removed from blacklist', 'Dismiss', { duration: 3000 });
          this.loadCandidate(this.candidate()!.id);
        },
        error: () => this.snackBar.open('Failed to remove from blacklist', 'Dismiss', { duration: 5000 })
      });
    }
  }

  getCandidateStatusLabel(status: string): string {
    return RecruitmentService.getCandidateStatusLabel(status as any);
  }

  getCandidateStatusColor(status: string): { background: string; color: string } {
    return RecruitmentService.getCandidateStatusColor(status as any);
  }

  getStageLabel(stage: string): string {
    return RecruitmentService.getRecruitmentStageLabel(stage as any);
  }

  getStageColor(stage: string): { background: string; color: string } {
    return RecruitmentService.getStageColor(stage as any);
  }

  getApplicationStatusLabel(status: string): string {
    return RecruitmentService.getApplicationStatusLabel(status as any);
  }

  getLocation(): string {
    const c = this.candidate();
    if (!c) return '';
    const parts = [c.city, c.province].filter(p => !!p);
    return parts.join(', ');
  }
}
