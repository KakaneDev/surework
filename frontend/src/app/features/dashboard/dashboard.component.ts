import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { Store } from '@ngrx/store';
import * as AuthActions from '@core/store/auth/auth.actions';
import * as AuthSelectors from '@core/store/auth/auth.selectors';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
  ],
  template: `
    <mat-sidenav-container class="dashboard-container">
      <mat-sidenav mode="side" opened class="sidenav">
        <div class="logo">
          <h2>SureWork</h2>
        </div>
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
          <a mat-list-item routerLink="/employees" routerLinkActive="active">
            <mat-icon matListItemIcon>people</mat-icon>
            <span matListItemTitle>Employees</span>
          </a>
          <a mat-list-item routerLink="/leave" routerLinkActive="active">
            <mat-icon matListItemIcon>event</mat-icon>
            <span matListItemTitle>Leave</span>
          </a>
          <a mat-list-item routerLink="/payroll" routerLinkActive="active">
            <mat-icon matListItemIcon>payments</mat-icon>
            <span matListItemTitle>Payroll</span>
          </a>
          <a mat-list-item routerLink="/accounting" routerLinkActive="active">
            <mat-icon matListItemIcon>account_balance</mat-icon>
            <span matListItemTitle>Accounting</span>
          </a>
          <a mat-list-item routerLink="/recruitment" routerLinkActive="active">
            <mat-icon matListItemIcon>work</mat-icon>
            <span matListItemTitle>Recruitment</span>
          </a>
          <mat-divider></mat-divider>
          <a mat-list-item routerLink="/settings" routerLinkActive="active">
            <mat-icon matListItemIcon>settings</mat-icon>
            <span matListItemTitle>Settings</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary">
          <span class="flex-grow"></span>
          @if (user$ | async; as user) {
            <span class="user-name">{{ user.fullName }}</span>
          }
          <button mat-icon-button (click)="logout()">
            <mat-icon>logout</mat-icon>
          </button>
        </mat-toolbar>

        <main class="content">
          <h1>Dashboard</h1>

          <div class="cards-grid">
            <mat-card>
              <mat-card-header>
                <mat-icon mat-card-avatar>people</mat-icon>
                <mat-card-title>Employees</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <h2 class="stat-number">--</h2>
                <p>Total active employees</p>
              </mat-card-content>
            </mat-card>

            <mat-card>
              <mat-card-header>
                <mat-icon mat-card-avatar>event_busy</mat-icon>
                <mat-card-title>Leave Requests</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <h2 class="stat-number">--</h2>
                <p>Pending approvals</p>
              </mat-card-content>
            </mat-card>

            <mat-card>
              <mat-card-header>
                <mat-icon mat-card-avatar>payments</mat-icon>
                <mat-card-title>Payroll</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <h2 class="stat-number">--</h2>
                <p>Next run date</p>
              </mat-card-content>
            </mat-card>

            <mat-card>
              <mat-card-header>
                <mat-icon mat-card-avatar>work</mat-icon>
                <mat-card-title>Open Positions</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <h2 class="stat-number">--</h2>
                <p>Active job postings</p>
              </mat-card-content>
            </mat-card>
          </div>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .dashboard-container {
      height: 100vh;
    }

    .sidenav {
      width: 250px;
      background: #1a1a2e;
    }

    .logo {
      padding: 24px;
      text-align: center;
      border-bottom: 1px solid rgba(255,255,255,0.1);

      h2 {
        margin: 0;
        color: white;
        font-weight: 500;
      }
    }

    mat-nav-list {
      a {
        color: rgba(255,255,255,0.7);

        &:hover {
          background: rgba(255,255,255,0.1);
        }

        &.active {
          background: rgba(26, 115, 232, 0.2);
          color: #1a73e8;
        }

        mat-icon {
          color: inherit;
        }
      }
    }

    .flex-grow {
      flex: 1;
    }

    .user-name {
      margin-right: 16px;
    }

    .content {
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
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  private readonly store = inject(Store);

  user$ = this.store.select(AuthSelectors.selectCurrentUser);

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
