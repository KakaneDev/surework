import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="space-y-6">
      <div class="sw-page-header">
        <div>
          <h1 class="sw-page-title">{{ 'finance.dashboard.title' | translate }}</h1>
          <p class="sw-page-description">{{ 'finance.dashboard.description' | translate }}</p>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <span class="material-icons text-green-600 dark:text-green-400">payments</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">--</p>
              <p class="text-sm text-neutral-500">{{ 'finance.dashboard.stats.monthlyPayroll' | translate }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <span class="material-icons text-primary-600 dark:text-primary-400">play_circle</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">--</p>
              <p class="text-sm text-neutral-500">{{ 'finance.dashboard.stats.activeRuns' | translate }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <span class="material-icons text-yellow-600 dark:text-yellow-400">pending</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">--</p>
              <p class="text-sm text-neutral-500">{{ 'finance.dashboard.stats.pendingApprovals' | translate }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <span class="material-icons text-purple-600 dark:text-purple-400">receipt_long</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">--</p>
              <p class="text-sm text-neutral-500">{{ 'finance.dashboard.stats.payslipsGenerated' | translate }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Links -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <a routerLink="/payroll" class="block bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <span class="material-icons text-green-600 dark:text-green-400">payments</span>
            </div>
            <div>
              <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">{{ 'finance.dashboard.links.payroll.title' | translate }}</h3>
              <p class="text-sm text-neutral-500">{{ 'finance.dashboard.links.payroll.description' | translate }}</p>
            </div>
          </div>
        </a>

        <a routerLink="/payroll/runs" class="block bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <span class="material-icons text-primary-600 dark:text-primary-400">play_circle</span>
            </div>
            <div>
              <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">{{ 'finance.dashboard.links.payrollRuns.title' | translate }}</h3>
              <p class="text-sm text-neutral-500">{{ 'finance.dashboard.links.payrollRuns.description' | translate }}</p>
            </div>
          </div>
        </a>

        <a routerLink="/accounting" class="block bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <span class="material-icons text-purple-600 dark:text-purple-400">calculate</span>
            </div>
            <div>
              <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">{{ 'finance.dashboard.links.accounting.title' | translate }}</h3>
              <p class="text-sm text-neutral-500">{{ 'finance.dashboard.links.accounting.description' | translate }}</p>
            </div>
          </div>
        </a>

        <a routerLink="/finance/reports" class="block bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6 hover:shadow-lg transition-shadow">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <span class="material-icons text-yellow-600 dark:text-yellow-400">analytics</span>
            </div>
            <div>
              <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">{{ 'finance.dashboard.links.financialReports.title' | translate }}</h3>
              <p class="text-sm text-neutral-500">{{ 'finance.dashboard.links.financialReports.description' | translate }}</p>
            </div>
          </div>
        </a>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinanceDashboardComponent {}
