import { Component, inject, ChangeDetectionStrategy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService, DashboardStats } from '@core/services/dashboard.service';

@Component({
  selector: 'app-dashboard-content',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
  ],
  template: `
    <div class="dashboard-content">
      <h1>Dashboard</h1>

      <div class="cards-grid">
        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>people</mat-icon>
            <mat-card-title>Employees</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <h2 class="stat-number">{{ stats()?.employeeCount ?? '--' }}</h2>
            <p>Total active employees</p>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>event_busy</mat-icon>
            <mat-card-title>Leave Requests</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <h2 class="stat-number">{{ stats()?.pendingLeaveRequests ?? '--' }}</h2>
            <p>Pending approvals</p>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>payments</mat-icon>
            <mat-card-title>Payroll</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <h2 class="stat-number stat-date">{{ stats()?.nextPayrollDate ?? '--' }}</h2>
            <p>Next run date</p>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>work</mat-icon>
            <mat-card-title>Open Positions</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <h2 class="stat-number">{{ stats()?.openJobPostings ?? '--' }}</h2>
            <p>Active job postings</p>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-content {
      padding: 24px;

      h1 {
        margin: 0 0 24px;
      }
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }

    mat-card {
      mat-icon[mat-card-avatar] {
        background: #1a73e8;
        color: white;
        padding: 8px;
        border-radius: 50%;
        font-size: 24px;
        width: 40px;
        height: 40px;
      }
    }

    .stat-number {
      font-size: 36px;
      font-weight: 500;
      margin: 16px 0 8px;
      color: #1a73e8;

      &.stat-date {
        font-size: 20px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardContentComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  stats = signal<DashboardStats | null>(null);

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  loadDashboardStats(): void {
    this.dashboardService.getDashboardStats().subscribe({
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
}
