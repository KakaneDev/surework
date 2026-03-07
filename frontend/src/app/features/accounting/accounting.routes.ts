import { Routes } from '@angular/router';

export const ACCOUNTING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./accounting-dashboard/accounting-dashboard.component').then(m => m.AccountingDashboardComponent)
  },
  {
    path: 'accounts',
    loadComponent: () => import('./chart-of-accounts/chart-of-accounts.component').then(m => m.ChartOfAccountsComponent)
  },
  {
    path: 'journals',
    loadComponent: () => import('./journal-entries/journal-entries-list.component').then(m => m.JournalEntriesListComponent)
  },
  {
    path: 'journals/new',
    loadComponent: () => import('./journal-entries/journal-entry-form.component').then(m => m.JournalEntryFormComponent)
  },
  {
    path: 'journals/:id',
    loadComponent: () => import('./journal-entries/journal-entry-detail.component').then(m => m.JournalEntryDetailComponent)
  },
  {
    path: 'journals/:id/edit',
    loadComponent: () => import('./journal-entries/journal-entry-form.component').then(m => m.JournalEntryFormComponent)
  },
  {
    path: 'reports',
    loadComponent: () => import('./reports/reports-dashboard.component').then(m => m.ReportsDashboardComponent)
  },
  {
    path: 'reports/trial-balance',
    loadComponent: () => import('./reports/trial-balance.component').then(m => m.TrialBalanceComponent)
  },
  {
    path: 'reports/balance-sheet',
    loadComponent: () => import('./reports/balance-sheet.component').then(m => m.BalanceSheetComponent)
  },
  {
    path: 'reports/income-statement',
    loadComponent: () => import('./reports/income-statement.component').then(m => m.IncomeStatementComponent)
  },
  {
    path: 'reports/general-ledger',
    loadComponent: () => import('./reports/general-ledger.component').then(m => m.GeneralLedgerComponent)
  },
  {
    path: 'periods',
    loadComponent: () => import('./fiscal-periods/fiscal-periods.component').then(m => m.FiscalPeriodsComponent)
  },
  // Bank Integration Routes
  {
    path: 'banking',
    loadComponent: () => import('./banking/banking-dashboard.component').then(m => m.BankingDashboardComponent)
  },
  {
    path: 'banking/rules',
    loadComponent: () => import('./banking/bank-rules.component').then(m => m.BankRulesComponent)
  },
  {
    path: 'banking/reconciliation',
    loadComponent: () => import('./banking/bank-reconciliation.component').then(m => m.BankReconciliationComponent)
  },
  {
    path: 'banking/accounts/:bankAccountId',
    loadComponent: () => import('./banking/banking-dashboard.component').then(m => m.BankingDashboardComponent)
  },
  // VAT201 Report Routes
  {
    path: 'vat',
    loadComponent: () => import('./vat/vat-dashboard.component').then(m => m.VatDashboardComponent)
  },
  {
    path: 'vat/new',
    loadComponent: () => import('./vat/vat-report-form.component').then(m => m.VatReportFormComponent)
  },
  {
    path: 'vat/history',
    loadComponent: () => import('./vat/vat-report-list.component').then(m => m.VatReportListComponent)
  },
  {
    path: 'vat/:id',
    loadComponent: () => import('./vat/vat-report-detail.component').then(m => m.VatReportDetailComponent)
  },
  // Invoicing Routes
  {
    path: 'invoicing',
    loadComponent: () => import('./invoicing/invoice-dashboard.component').then(m => m.InvoiceDashboardComponent)
  },
  {
    path: 'invoicing/list',
    loadComponent: () => import('./invoicing/invoice-list.component').then(m => m.InvoiceListComponent)
  },
  {
    path: 'invoicing/new',
    loadComponent: () => import('./invoicing/invoice-form.component').then(m => m.InvoiceFormComponent)
  },
  {
    path: 'invoicing/customers',
    loadComponent: () => import('./invoicing/customer-list.component').then(m => m.CustomerListComponent)
  },
  {
    path: 'invoicing/:id',
    loadComponent: () => import('./invoicing/invoice-detail.component').then(m => m.InvoiceDetailComponent)
  },
  {
    path: 'invoicing/:id/edit',
    loadComponent: () => import('./invoicing/invoice-form.component').then(m => m.InvoiceFormComponent)
  },
  // Payroll Integration Routes
  {
    path: 'payroll-integration',
    loadComponent: () => import('./payroll-integration/payroll-integration-dashboard.component').then(m => m.PayrollIntegrationDashboardComponent)
  },
  {
    path: 'payroll-integration/mappings',
    loadComponent: () => import('./payroll-integration/payroll-account-mappings.component').then(m => m.PayrollAccountMappingsComponent)
  },
  {
    path: 'payroll-integration/settings',
    loadComponent: () => import('./payroll-integration/payroll-integration-settings.component').then(m => m.PayrollIntegrationSettingsComponent)
  },
  {
    path: 'payroll-integration/journals',
    loadComponent: () => import('./payroll-integration/payroll-journals-list.component').then(m => m.PayrollJournalsListComponent)
  }
];
