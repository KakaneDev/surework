import { Routes } from '@angular/router';
import { companyDetailsGuard, complianceGuard } from '@core/guards/setup.guard';

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
  // VAT201 Report Routes — require SARS compliance details
  {
    path: 'vat',
    canActivate: [complianceGuard()],
    loadComponent: () => import('./vat/vat-dashboard.component').then(m => m.VatDashboardComponent)
  },
  {
    path: 'vat/new',
    canActivate: [complianceGuard()],
    loadComponent: () => import('./vat/vat-report-form.component').then(m => m.VatReportFormComponent)
  },
  {
    path: 'vat/history',
    canActivate: [complianceGuard()],
    loadComponent: () => import('./vat/vat-report-list.component').then(m => m.VatReportListComponent)
  },
  {
    path: 'vat/:id',
    canActivate: [complianceGuard()],
    loadComponent: () => import('./vat/vat-report-detail.component').then(m => m.VatReportDetailComponent)
  },
  // Invoicing Routes — require company details
  {
    path: 'invoicing',
    canActivate: [companyDetailsGuard()],
    loadComponent: () => import('./invoicing/invoice-dashboard.component').then(m => m.InvoiceDashboardComponent)
  },
  {
    path: 'invoicing/list',
    canActivate: [companyDetailsGuard()],
    loadComponent: () => import('./invoicing/invoice-list.component').then(m => m.InvoiceListComponent)
  },
  {
    path: 'invoicing/new',
    canActivate: [companyDetailsGuard()],
    loadComponent: () => import('./invoicing/invoice-form.component').then(m => m.InvoiceFormComponent)
  },
  {
    path: 'invoicing/customers',
    canActivate: [companyDetailsGuard()],
    loadComponent: () => import('./invoicing/customer-list.component').then(m => m.CustomerListComponent)
  },
  {
    path: 'invoicing/:id',
    canActivate: [companyDetailsGuard()],
    loadComponent: () => import('./invoicing/invoice-detail.component').then(m => m.InvoiceDetailComponent)
  },
  {
    path: 'invoicing/:id/edit',
    canActivate: [companyDetailsGuard()],
    loadComponent: () => import('./invoicing/invoice-form.component').then(m => m.InvoiceFormComponent)
  },
  // Payroll Integration Routes — require SARS compliance details
  {
    path: 'payroll-integration',
    canActivate: [complianceGuard()],
    loadComponent: () => import('./payroll-integration/payroll-integration-dashboard.component').then(m => m.PayrollIntegrationDashboardComponent)
  },
  {
    path: 'payroll-integration/mappings',
    canActivate: [complianceGuard()],
    loadComponent: () => import('./payroll-integration/payroll-account-mappings.component').then(m => m.PayrollAccountMappingsComponent)
  },
  {
    path: 'payroll-integration/settings',
    canActivate: [complianceGuard()],
    loadComponent: () => import('./payroll-integration/payroll-integration-settings.component').then(m => m.PayrollIntegrationSettingsComponent)
  },
  {
    path: 'payroll-integration/journals',
    canActivate: [complianceGuard()],
    loadComponent: () => import('./payroll-integration/payroll-journals-list.component').then(m => m.PayrollJournalsListComponent)
  }
];
