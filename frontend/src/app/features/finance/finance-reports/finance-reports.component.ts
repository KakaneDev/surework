import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-finance-reports',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="space-y-6">
      <div class="sw-page-header">
        <div>
          <h1 class="sw-page-title">{{ 'finance.reports.title' | translate }}</h1>
          <p class="sw-page-description">{{ 'finance.reports.subtitle' | translate }}</p>
        </div>
      </div>
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
        <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">analytics</span>
        <h2 class="text-lg font-semibold text-neutral-600 dark:text-neutral-400">{{ 'finance.reports.comingSoon' | translate }}</h2>
        <p class="text-neutral-500 dark:text-neutral-500">{{ 'finance.reports.description' | translate }}</p>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinanceReportsComponent {}
