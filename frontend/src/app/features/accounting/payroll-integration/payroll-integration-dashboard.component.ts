import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule, DollarSign, FileText, Settings, List, Users, TrendingUp, AlertCircle, CheckCircle, ArrowRight } from 'lucide-angular';
import {
  AccountingService,
  PayrollAccountingDashboard,
  PayrollYearSummary
} from '../../../core/services/accounting.service';

@Component({
  selector: 'app-payroll-integration-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, TranslateModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">{{ 'accounting.payrollIntegration.dashboard.title' | translate }}</h1>
          <p class="mt-1 text-sm text-gray-500">
            {{ 'accounting.payrollIntegration.dashboard.subtitle' | translate }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <a routerLink="settings"
             class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <lucide-icon [img]="SettingsIcon" class="w-4 h-4"></lucide-icon>
            {{ 'common.settings' | translate }}
          </a>
          <a routerLink="mappings"
             class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
            <lucide-icon [img]="ListIcon" class="w-4 h-4"></lucide-icon>
            {{ 'accounting.payrollIntegration.dashboard.accountMappings' | translate }}
          </a>
        </div>
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center h-64">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      } @else if (error()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex items-center gap-2 text-red-800">
            <lucide-icon [img]="AlertCircleIcon" class="w-5 h-5"></lucide-icon>
            <span>{{ error() }}</span>
          </div>
        </div>
      } @else {
        <!-- Integration Status -->
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              @if (dashboard()?.integrationEnabled) {
                <div class="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                  <lucide-icon [img]="CheckCircleIcon" class="w-5 h-5 text-green-600"></lucide-icon>
                </div>
                <div>
                  <p class="font-medium text-green-800">{{ 'accounting.payrollIntegration.dashboard.autoJournalingEnabled' | translate }}</p>
                  <p class="text-sm text-gray-500">{{ 'accounting.payrollIntegration.dashboard.enabledDescription' | translate }}</p>
                </div>
              } @else {
                <div class="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-full">
                  <lucide-icon [img]="AlertCircleIcon" class="w-5 h-5 text-yellow-600"></lucide-icon>
                </div>
                <div>
                  <p class="font-medium text-yellow-800">{{ 'accounting.payrollIntegration.dashboard.autoJournalingDisabled' | translate }}</p>
                  <p class="text-sm text-gray-500">{{ 'accounting.payrollIntegration.dashboard.disabledDescription' | translate }}</p>
                </div>
              }
            </div>
            <a routerLink="settings"
               class="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              {{ 'common.configure' | translate }}
              <lucide-icon [img]="ArrowRightIcon" class="w-4 h-4"></lucide-icon>
            </a>
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- YTD Gross -->
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                <lucide-icon [img]="DollarSignIcon" class="w-5 h-5 text-blue-600"></lucide-icon>
              </div>
            </div>
            <p class="mt-3 text-2xl font-semibold text-gray-900">
              {{ formatCurrency(dashboard()?.ytdGross || 0) }}
            </p>
            <p class="mt-1 text-sm text-gray-500">{{ 'accounting.payrollIntegration.dashboard.ytdGrossSalaries' | translate }}</p>
          </div>

          <!-- YTD PAYE -->
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center justify-center w-10 h-10 bg-red-100 rounded-lg">
                <lucide-icon [img]="FileTextIcon" class="w-5 h-5 text-red-600"></lucide-icon>
              </div>
            </div>
            <p class="mt-3 text-2xl font-semibold text-gray-900">
              {{ formatCurrency(dashboard()?.ytdPaye || 0) }}
            </p>
            <p class="mt-1 text-sm text-gray-500">{{ 'accounting.payrollIntegration.dashboard.ytdPayeTax' | translate }}</p>
          </div>

          <!-- YTD Employer Cost -->
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                <lucide-icon [img]="TrendingUpIcon" class="w-5 h-5 text-purple-600"></lucide-icon>
              </div>
            </div>
            <p class="mt-3 text-2xl font-semibold text-gray-900">
              {{ formatCurrency(dashboard()?.ytdEmployerCost || 0) }}
            </p>
            <p class="mt-1 text-sm text-gray-500">{{ 'accounting.payrollIntegration.dashboard.ytdEmployerCost' | translate }}</p>
          </div>

          <!-- Journaled Runs -->
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                <lucide-icon [img]="UsersIcon" class="w-5 h-5 text-green-600"></lucide-icon>
              </div>
            </div>
            <p class="mt-3 text-2xl font-semibold text-gray-900">
              {{ dashboard()?.journaledRunsCount || 0 }}
            </p>
            <p class="mt-1 text-sm text-gray-500">{{ 'accounting.payrollIntegration.dashboard.journaledRuns' | translate: {year: dashboard()?.currentYear} }}</p>
          </div>
        </div>

        <!-- Recent Journals & Account Mappings -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Recent Payroll Journals -->
          <div class="bg-white rounded-lg border border-gray-200">
            <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 class="font-medium text-gray-900">{{ 'accounting.payrollIntegration.dashboard.recentPayrollJournals' | translate }}</h2>
              <a routerLink="journals" class="text-sm text-indigo-600 hover:text-indigo-700">
                {{ 'common.viewAll' | translate }}
              </a>
            </div>
            <div class="divide-y divide-gray-100">
              @for (journal of dashboard()?.recentJournals || []; track journal.id) {
                <div class="px-4 py-3 hover:bg-gray-50">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-medium text-gray-900">{{ journal.payrollRunNumber }}</p>
                      <p class="text-sm text-gray-500">{{ journal.periodDisplay }} - {{ 'accounting.payrollIntegration.dashboard.employees' | translate: {count: journal.employeeCount} }}</p>
                    </div>
                    <div class="text-right">
                      <p class="font-medium text-gray-900">{{ formatCurrency(journal.totalGross) }}</p>
                      <span [class]="getStatusClass(journal.status)" class="text-xs px-2 py-0.5 rounded-full">
                        {{ journal.statusDisplay }}
                      </span>
                    </div>
                  </div>
                </div>
              } @empty {
                <div class="px-4 py-8 text-center text-gray-500">
                  {{ 'accounting.payrollIntegration.dashboard.noPayrollJournals' | translate }}
                </div>
              }
            </div>
          </div>

          <!-- Account Mappings Summary -->
          <div class="bg-white rounded-lg border border-gray-200">
            <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 class="font-medium text-gray-900">{{ 'accounting.payrollIntegration.dashboard.accountMappings' | translate }}</h2>
              <a routerLink="mappings" class="text-sm text-indigo-600 hover:text-indigo-700">
                {{ 'common.manage' | translate }}
              </a>
            </div>
            <div class="divide-y divide-gray-100">
              @for (mapping of dashboard()?.accountMappings || []; track mapping.id) {
                <div class="px-4 py-3">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-medium text-gray-900">{{ mapping.mappingTypeDisplay }}</p>
                      <p class="text-sm text-gray-500">{{ mapping.accountCode }} - {{ mapping.accountName }}</p>
                    </div>
                    @if (mapping.isDefault) {
                      <span class="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {{ 'common.default' | translate }}
                      </span>
                    }
                  </div>
                </div>
              } @empty {
                <div class="px-4 py-8 text-center text-gray-500">
                  <p>{{ 'accounting.payrollIntegration.dashboard.noAccountMappings' | translate }}</p>
                  <a routerLink="mappings" class="mt-2 inline-flex items-center text-indigo-600 hover:text-indigo-700">
                    {{ 'accounting.payrollIntegration.dashboard.configureMappings' | translate }}
                    <lucide-icon [img]="ArrowRightIcon" class="w-4 h-4 ml-1"></lucide-icon>
                  </a>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class PayrollIntegrationDashboardComponent implements OnInit {
  private readonly accountingService = inject(AccountingService);
  private readonly translate = inject(TranslateService);

  // Icons
  readonly DollarSignIcon = DollarSign;
  readonly FileTextIcon = FileText;
  readonly SettingsIcon = Settings;
  readonly ListIcon = List;
  readonly UsersIcon = Users;
  readonly TrendingUpIcon = TrendingUp;
  readonly AlertCircleIcon = AlertCircle;
  readonly CheckCircleIcon = CheckCircle;
  readonly ArrowRightIcon = ArrowRight;

  // State
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly dashboard = signal<PayrollAccountingDashboard | null>(null);

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    this.accountingService.getPayrollDashboard().subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.translate.instant('accounting.payrollIntegration.dashboard.loadError'));
        this.loading.set(false);
        console.error('Error loading payroll dashboard:', err);
      }
    });
  }

  formatCurrency(amount: number): string {
    return AccountingService.formatCurrency(amount);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'POSTED':
        return 'bg-green-100 text-green-800';
      case 'CREATED':
        return 'bg-yellow-100 text-yellow-800';
      case 'REVERSED':
        return 'bg-red-100 text-red-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
