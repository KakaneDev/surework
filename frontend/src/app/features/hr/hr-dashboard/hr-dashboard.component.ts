import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '@env/environment';

@Component({
  selector: 'app-hr-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="space-y-6">
      <div class="sw-page-header">
        <div>
          <h1 class="sw-page-title">{{ 'hr.dashboard.title' | translate }}</h1>
          <p class="sw-page-description">{{ 'hr.dashboard.subtitle' | translate }}</p>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <span class="material-icons text-primary-600 dark:text-primary-400">people</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ totalEmployees() }}</p>
              <p class="text-sm text-neutral-500">{{ 'hr.dashboard.stats.totalEmployees' | translate }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <span class="material-icons text-green-600 dark:text-green-400">person_add</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ newThisMonth() }}</p>
              <p class="text-sm text-neutral-500">{{ 'hr.dashboard.stats.newThisMonth' | translate }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <span class="material-icons text-yellow-600 dark:text-yellow-400">event_available</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ onLeaveToday() }}</p>
              <p class="text-sm text-neutral-500">{{ 'hr.dashboard.stats.onLeaveToday' | translate }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <span class="material-icons text-purple-600 dark:text-purple-400">pending_actions</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ pendingApprovals() }}</p>
              <p class="text-sm text-neutral-500">{{ 'hr.dashboard.stats.pendingApprovals' | translate }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Links -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <a routerLink="/employees" class="block bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <span class="material-icons text-primary-600 dark:text-primary-400">people</span>
            </div>
            <div>
              <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">{{ 'hr.dashboard.links.employees.title' | translate }}</h3>
              <p class="text-sm text-neutral-500">{{ 'hr.dashboard.links.employees.description' | translate }}</p>
            </div>
          </div>
        </a>

        <a routerLink="/hr/organogram" class="block bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <span class="material-icons text-indigo-600 dark:text-indigo-400">account_tree</span>
            </div>
            <div>
              <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">{{ 'hr.dashboard.links.organogram.title' | translate }}</h3>
              <p class="text-sm text-neutral-500">{{ 'hr.dashboard.links.organogram.description' | translate }}</p>
            </div>
          </div>
        </a>

        <a routerLink="/leave/admin" class="block bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <span class="material-icons text-green-600 dark:text-green-400">event_available</span>
            </div>
            <div>
              <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">{{ 'hr.dashboard.links.leaveManagement.title' | translate }}</h3>
              <p class="text-sm text-neutral-500">{{ 'hr.dashboard.links.leaveManagement.description' | translate }}</p>
            </div>
          </div>
        </a>

        <a routerLink="/documents/hr" class="block bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <span class="material-icons text-purple-600 dark:text-purple-400">folder</span>
            </div>
            <div>
              <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">{{ 'hr.dashboard.links.documents.title' | translate }}</h3>
              <p class="text-sm text-neutral-500">{{ 'hr.dashboard.links.documents.description' | translate }}</p>
            </div>
          </div>
        </a>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HrDashboardComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  totalEmployees = signal<number | string>('--');
  newThisMonth = signal<number | string>('--');
  onLeaveToday = signal<number | string>('--');
  pendingApprovals = signal<number | string>('--');

  ngOnInit(): void {
    this.loadStats();
  }

  private loadStats(): void {
    // Load total employees count
    this.http.get<{ count: number }>(`${this.apiUrl}/api/v1/employees/count`).subscribe({
      next: (response) => this.totalEmployees.set(response.count),
      error: () => this.totalEmployees.set(0)
    });

    // Load employees to calculate new this month and on leave
    this.http.get<{ content: { hireDate: string, status: string }[], totalElements: number }>(`${this.apiUrl}/api/v1/employees`).subscribe({
      next: (response) => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const newCount = response.content.filter(emp => {
          const hireDate = new Date(emp.hireDate);
          return hireDate >= startOfMonth;
        }).length;
        this.newThisMonth.set(newCount);

        // Calculate on leave (employees with ON_LEAVE status)
        const onLeave = response.content.filter(emp => emp.status === 'ON_LEAVE').length;
        this.onLeaveToday.set(onLeave);
      },
      error: () => {
        this.newThisMonth.set(0);
        this.onLeaveToday.set(0);
      }
    });

    // Load pending leave approvals
    this.http.get<any[]>(`${this.apiUrl}/api/v1/leave/pending`).subscribe({
      next: (pending) => this.pendingApprovals.set(Array.isArray(pending) ? pending.length : 0),
      error: () => this.pendingApprovals.set(0)
    });
  }
}
