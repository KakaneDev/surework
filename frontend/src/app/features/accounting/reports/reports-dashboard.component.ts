import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="sw-page-header">
        <div class="flex items-center gap-3">
          <a routerLink="/accounting" class="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300">
            <span class="material-icons">arrow_back</span>
          </a>
          <div>
            <h1 class="sw-page-title">{{ 'accounting.reports.dashboard.title' | translate }}</h1>
            <p class="sw-page-description">{{ 'accounting.reports.dashboard.description' | translate }}</p>
          </div>
        </div>
      </div>

      <!-- Report Categories -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Core Financial Statements -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          <div class="p-4 border-b border-neutral-200 dark:border-dark-border bg-gradient-to-r from-primary-50 to-transparent dark:from-primary-900/20">
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ 'accounting.reports.dashboard.coreFinancialStatements.title' | translate }}</h3>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.reports.dashboard.coreFinancialStatements.description' | translate }}</p>
          </div>
          <div class="p-4 space-y-2">
            <a routerLink="/accounting/reports/trial-balance" class="flex items-center gap-4 p-4 rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-elevated transition-colors group">
              <div class="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span class="material-icons text-blue-600 dark:text-blue-400">balance</span>
              </div>
              <div class="flex-1">
                <h4 class="font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-primary-600 dark:group-hover:text-primary-400">{{ 'accounting.reports.dashboard.trialBalance.title' | translate }}</h4>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.reports.dashboard.trialBalance.description' | translate }}</p>
              </div>
              <span class="material-icons text-neutral-400 group-hover:text-primary-500">chevron_right</span>
            </a>

            <a routerLink="/accounting/reports/balance-sheet" class="flex items-center gap-4 p-4 rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-elevated transition-colors group">
              <div class="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <span class="material-icons text-emerald-600 dark:text-emerald-400">account_balance</span>
              </div>
              <div class="flex-1">
                <h4 class="font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-primary-600 dark:group-hover:text-primary-400">{{ 'accounting.reports.dashboard.balanceSheet.title' | translate }}</h4>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.reports.dashboard.balanceSheet.description' | translate }}</p>
              </div>
              <span class="material-icons text-neutral-400 group-hover:text-primary-500">chevron_right</span>
            </a>

            <a routerLink="/accounting/reports/income-statement" class="flex items-center gap-4 p-4 rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-elevated transition-colors group">
              <div class="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <span class="material-icons text-amber-600 dark:text-amber-400">trending_up</span>
              </div>
              <div class="flex-1">
                <h4 class="font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-primary-600 dark:group-hover:text-primary-400">{{ 'accounting.reports.dashboard.incomeStatement.title' | translate }}</h4>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.reports.dashboard.incomeStatement.description' | translate }}</p>
              </div>
              <span class="material-icons text-neutral-400 group-hover:text-primary-500">chevron_right</span>
            </a>
          </div>
        </div>

        <!-- Detailed Reports -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          <div class="p-4 border-b border-neutral-200 dark:border-dark-border bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-900/20">
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ 'accounting.reports.dashboard.detailedReports.title' | translate }}</h3>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.reports.dashboard.detailedReports.description' | translate }}</p>
          </div>
          <div class="p-4 space-y-2">
            <a routerLink="/accounting/reports/general-ledger" class="flex items-center gap-4 p-4 rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-elevated transition-colors group">
              <div class="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <span class="material-icons text-purple-600 dark:text-purple-400">menu_book</span>
              </div>
              <div class="flex-1">
                <h4 class="font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-primary-600 dark:group-hover:text-primary-400">{{ 'accounting.reports.dashboard.generalLedger.title' | translate }}</h4>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.reports.dashboard.generalLedger.description' | translate }}</p>
              </div>
              <span class="material-icons text-neutral-400 group-hover:text-primary-500">chevron_right</span>
            </a>

            <div class="flex items-center gap-4 p-4 rounded-lg bg-neutral-50 dark:bg-dark-elevated opacity-60 cursor-not-allowed">
              <div class="w-12 h-12 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                <span class="material-icons text-neutral-400 dark:text-neutral-500">receipt</span>
              </div>
              <div class="flex-1">
                <h4 class="font-medium text-neutral-500 dark:text-neutral-400">{{ 'accounting.reports.dashboard.accountsReceivableAging.title' | translate }}</h4>
                <p class="text-sm text-neutral-400 dark:text-neutral-500">{{ 'accounting.reports.dashboard.comingSoon' | translate }}</p>
              </div>
              <span class="material-icons text-neutral-300 dark:text-neutral-600">lock</span>
            </div>

            <div class="flex items-center gap-4 p-4 rounded-lg bg-neutral-50 dark:bg-dark-elevated opacity-60 cursor-not-allowed">
              <div class="w-12 h-12 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                <span class="material-icons text-neutral-400 dark:text-neutral-500">receipt_long</span>
              </div>
              <div class="flex-1">
                <h4 class="font-medium text-neutral-500 dark:text-neutral-400">{{ 'accounting.reports.dashboard.accountsPayableAging.title' | translate }}</h4>
                <p class="text-sm text-neutral-400 dark:text-neutral-500">{{ 'accounting.reports.dashboard.comingSoon' | translate }}</p>
              </div>
              <span class="material-icons text-neutral-300 dark:text-neutral-600">lock</span>
            </div>
          </div>
        </div>

        <!-- Tax Reports -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          <div class="p-4 border-b border-neutral-200 dark:border-dark-border bg-gradient-to-r from-red-50 to-transparent dark:from-red-900/20">
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ 'accounting.reports.dashboard.taxReports.title' | translate }}</h3>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.reports.dashboard.taxReports.description' | translate }}</p>
          </div>
          <div class="p-4 space-y-2">
            <div class="flex items-center gap-4 p-4 rounded-lg bg-neutral-50 dark:bg-dark-elevated opacity-60 cursor-not-allowed">
              <div class="w-12 h-12 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                <span class="material-icons text-neutral-400 dark:text-neutral-500">description</span>
              </div>
              <div class="flex-1">
                <h4 class="font-medium text-neutral-500 dark:text-neutral-400">{{ 'accounting.reports.dashboard.vat201Report.title' | translate }}</h4>
                <p class="text-sm text-neutral-400 dark:text-neutral-500">{{ 'accounting.reports.dashboard.comingSoon' | translate }}</p>
              </div>
              <span class="material-icons text-neutral-300 dark:text-neutral-600">lock</span>
            </div>

            <div class="flex items-center gap-4 p-4 rounded-lg bg-neutral-50 dark:bg-dark-elevated opacity-60 cursor-not-allowed">
              <div class="w-12 h-12 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                <span class="material-icons text-neutral-400 dark:text-neutral-500">analytics</span>
              </div>
              <div class="flex-1">
                <h4 class="font-medium text-neutral-500 dark:text-neutral-400">{{ 'accounting.reports.dashboard.taxSummary.title' | translate }}</h4>
                <p class="text-sm text-neutral-400 dark:text-neutral-500">{{ 'accounting.reports.dashboard.comingSoon' | translate }}</p>
              </div>
              <span class="material-icons text-neutral-300 dark:text-neutral-600">lock</span>
            </div>
          </div>
        </div>

        <!-- Management Reports -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          <div class="p-4 border-b border-neutral-200 dark:border-dark-border bg-gradient-to-r from-cyan-50 to-transparent dark:from-cyan-900/20">
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ 'accounting.reports.dashboard.managementReports.title' | translate }}</h3>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.reports.dashboard.managementReports.description' | translate }}</p>
          </div>
          <div class="p-4 space-y-2">
            <div class="flex items-center gap-4 p-4 rounded-lg bg-neutral-50 dark:bg-dark-elevated opacity-60 cursor-not-allowed">
              <div class="w-12 h-12 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                <span class="material-icons text-neutral-400 dark:text-neutral-500">monetization_on</span>
              </div>
              <div class="flex-1">
                <h4 class="font-medium text-neutral-500 dark:text-neutral-400">{{ 'accounting.reports.dashboard.cashFlowStatement.title' | translate }}</h4>
                <p class="text-sm text-neutral-400 dark:text-neutral-500">{{ 'accounting.reports.dashboard.comingSoon' | translate }}</p>
              </div>
              <span class="material-icons text-neutral-300 dark:text-neutral-600">lock</span>
            </div>

            <div class="flex items-center gap-4 p-4 rounded-lg bg-neutral-50 dark:bg-dark-elevated opacity-60 cursor-not-allowed">
              <div class="w-12 h-12 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                <span class="material-icons text-neutral-400 dark:text-neutral-500">pie_chart</span>
              </div>
              <div class="flex-1">
                <h4 class="font-medium text-neutral-500 dark:text-neutral-400">{{ 'accounting.reports.dashboard.budgetVsActual.title' | translate }}</h4>
                <p class="text-sm text-neutral-400 dark:text-neutral-500">{{ 'accounting.reports.dashboard.comingSoon' | translate }}</p>
              </div>
              <span class="material-icons text-neutral-300 dark:text-neutral-600">lock</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsDashboardComponent {
  constructor(private translate: TranslateService) {}
}
