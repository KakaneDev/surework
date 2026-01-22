import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { Store } from '@ngrx/store';
import * as AuthActions from '@core/store/auth/auth.actions';
import * as AuthSelectors from '@core/store/auth/auth.selectors';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
  ],
  template: `
    <mat-sidenav-container class="shell-container">
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
          <router-outlet></router-outlet>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .shell-container {
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
      background: #f5f5f5;
      min-height: calc(100vh - 64px);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShellComponent {
  private readonly store = inject(Store);

  user$ = this.store.select(AuthSelectors.selectCurrentUser);

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
