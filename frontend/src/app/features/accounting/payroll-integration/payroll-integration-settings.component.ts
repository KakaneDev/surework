import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule, ArrowLeft, Save, AlertCircle, CheckCircle, Info } from 'lucide-angular';
import {
  AccountingService,
  PayrollIntegrationSettings,
  UpdateIntegrationSettingsRequest,
  Account
} from '../../../core/services/accounting.service';

@Component({
  selector: 'app-payroll-integration-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, LucideAngularModule],
  template: `
    <div class="p-6 space-y-6 max-w-3xl">
      <!-- Header -->
      <div class="flex items-center gap-4">
        <a routerLink="/accounting/payroll-integration"
           class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <lucide-icon [img]="ArrowLeftIcon" class="w-5 h-5"></lucide-icon>
        </a>
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">{{ 'accounting.payrollIntegration.settings.title' | translate }}</h1>
          <p class="mt-1 text-sm text-gray-500">
            {{ 'accounting.payrollIntegration.settings.subtitle' | translate }}
          </p>
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
        <!-- Success Message -->
        @if (successMessage()) {
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="flex items-center gap-2 text-green-800">
              <lucide-icon [img]="CheckCircleIcon" class="w-5 h-5"></lucide-icon>
              <span>{{ successMessage() }}</span>
            </div>
          </div>
        }

        <form (ngSubmit)="saveSettings()" class="space-y-6">
          <!-- Auto-Journaling Section -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4">{{ 'accounting.payrollIntegration.settings.autoJournaling.title' | translate }}</h2>

            <div class="space-y-4">
              <!-- Enable Auto-Journaling -->
              <div class="flex items-start gap-3">
                <input type="checkbox" id="autoJournalEnabled"
                       [(ngModel)]="formData.autoJournalEnabled"
                       name="autoJournalEnabled"
                       class="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                <div>
                  <label for="autoJournalEnabled" class="font-medium text-gray-900">
                    {{ 'accounting.payrollIntegration.settings.autoJournaling.enableLabel' | translate }}
                  </label>
                  <p class="text-sm text-gray-500">
                    {{ 'accounting.payrollIntegration.settings.autoJournaling.enableDescription' | translate }}
                  </p>
                </div>
              </div>

              <!-- Journal on Approval -->
              <div class="flex items-start gap-3 ml-7">
                <input type="checkbox" id="journalOnApproval"
                       [(ngModel)]="formData.journalOnApproval"
                       name="journalOnApproval"
                       [disabled]="!formData.autoJournalEnabled"
                       class="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50">
                <div>
                  <label for="journalOnApproval" class="font-medium text-gray-900">
                    {{ 'accounting.payrollIntegration.settings.autoJournaling.approvalLabel' | translate }}
                  </label>
                  <p class="text-sm text-gray-500">
                    {{ 'accounting.payrollIntegration.settings.autoJournaling.approvalDescription' | translate }}
                  </p>
                </div>
              </div>

              <!-- Create Payment Entry -->
              <div class="flex items-start gap-3 ml-7">
                <input type="checkbox" id="createPaymentEntry"
                       [(ngModel)]="formData.createPaymentEntry"
                       name="createPaymentEntry"
                       [disabled]="!formData.autoJournalEnabled"
                       class="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50">
                <div>
                  <label for="createPaymentEntry" class="font-medium text-gray-900">
                    {{ 'accounting.payrollIntegration.settings.autoJournaling.paymentLabel' | translate }}
                  </label>
                  <p class="text-sm text-gray-500">
                    {{ 'accounting.payrollIntegration.settings.autoJournaling.paymentDescription' | translate }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Default Accounts Section -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4">{{ 'accounting.payrollIntegration.settings.defaultAccounts.title' | translate }}</h2>
            <p class="text-sm text-gray-500 mb-4">
              {{ 'accounting.payrollIntegration.settings.defaultAccounts.description' | translate }}
            </p>

            <div class="space-y-4">
              <!-- Default Expense Account -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  {{ 'accounting.payrollIntegration.settings.defaultAccounts.expenseLabel' | translate }}
                </label>
                <select [(ngModel)]="formData.defaultExpenseAccountId"
                        name="defaultExpenseAccountId"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="">{{ 'accounting.payrollIntegration.settings.selectAccount' | translate }}</option>
                  @for (account of expenseAccounts(); track account.id) {
                    <option [value]="account.id">{{ account.accountCode }} - {{ account.accountName }}</option>
                  }
                </select>
              </div>

              <!-- Default Liability Account -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  {{ 'accounting.payrollIntegration.settings.defaultAccounts.liabilityLabel' | translate }}
                </label>
                <select [(ngModel)]="formData.defaultLiabilityAccountId"
                        name="defaultLiabilityAccountId"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="">{{ 'accounting.payrollIntegration.settings.selectAccount' | translate }}</option>
                  @for (account of liabilityAccounts(); track account.id) {
                    <option [value]="account.id">{{ account.accountCode }} - {{ account.accountName }}</option>
                  }
                </select>
              </div>

              <!-- Default Bank Account -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  {{ 'accounting.payrollIntegration.settings.defaultAccounts.bankLabel' | translate }}
                </label>
                <select [(ngModel)]="formData.defaultBankAccountId"
                        name="defaultBankAccountId"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="">{{ 'accounting.payrollIntegration.settings.selectAccount' | translate }}</option>
                  @for (account of bankAccounts(); track account.id) {
                    <option [value]="account.id">{{ account.accountCode }} - {{ account.accountName }}</option>
                  }
                </select>
              </div>
            </div>
          </div>

          <!-- Journal Description Template -->
          <div class="bg-white rounded-lg border border-gray-200 p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4">{{ 'accounting.payrollIntegration.settings.journalDescription.title' | translate }}</h2>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                {{ 'accounting.payrollIntegration.settings.journalDescription.templateLabel' | translate }}
              </label>
              <input type="text"
                     [(ngModel)]="formData.journalDescriptionTemplate"
                     name="journalDescriptionTemplate"
                     [placeholder]="'accounting.payrollIntegration.settings.journalDescription.templatePlaceholder' | translate"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <div class="mt-2 flex items-start gap-2 text-sm text-gray-500">
                <lucide-icon [img]="InfoIcon" class="w-4 h-4 mt-0.5 flex-shrink-0"></lucide-icon>
                <span>
                  {{ 'accounting.payrollIntegration.settings.journalDescription.availablePlaceholders' | translate }}
                  <code class="bg-gray-100 px-1 rounded">{{ '{' }}period{{ '}' }}</code>,
                  <code class="bg-gray-100 px-1 rounded">{{ '{' }}runNumber{{ '}' }}</code>,
                  <code class="bg-gray-100 px-1 rounded">{{ '{' }}employeeCount{{ '}' }}</code>
                </span>
              </div>
            </div>
          </div>

          <!-- Save Button -->
          <div class="flex justify-end">
            <button type="submit"
                    [disabled]="saving()"
                    class="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              <lucide-icon [img]="SaveIcon" class="w-4 h-4"></lucide-icon>
              {{ saving() ? ('accounting.payrollIntegration.settings.saving' | translate) : ('accounting.payrollIntegration.settings.saveButton' | translate) }}
            </button>
          </div>
        </form>
      }
    </div>
  `
})
export class PayrollIntegrationSettingsComponent implements OnInit {
  private readonly accountingService = inject(AccountingService);
  private readonly translate = inject(TranslateService);

  // Icons
  readonly ArrowLeftIcon = ArrowLeft;
  readonly SaveIcon = Save;
  readonly AlertCircleIcon = AlertCircle;
  readonly CheckCircleIcon = CheckCircle;
  readonly InfoIcon = Info;

  // State
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly settings = signal<PayrollIntegrationSettings | null>(null);
  readonly accounts = signal<Account[]>([]);

  // Form data
  formData = {
    autoJournalEnabled: true,
    journalOnApproval: true,
    createPaymentEntry: false,
    defaultExpenseAccountId: '',
    defaultLiabilityAccountId: '',
    defaultBankAccountId: '',
    journalDescriptionTemplate: 'Payroll for {period} - {runNumber}'
  };

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.accountingService.getPayrollSettings().subscribe({
      next: (settings) => {
        this.settings.set(settings);
        this.formData = {
          autoJournalEnabled: settings.autoJournalEnabled,
          journalOnApproval: settings.journalOnApproval,
          createPaymentEntry: settings.createPaymentEntry,
          defaultExpenseAccountId: settings.defaultExpenseAccountId || '',
          defaultLiabilityAccountId: settings.defaultLiabilityAccountId || '',
          defaultBankAccountId: settings.defaultBankAccountId || '',
          journalDescriptionTemplate: settings.journalDescriptionTemplate
        };
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.translate.instant('accounting.payrollIntegration.settings.loadError'));
        this.loading.set(false);
        console.error('Error loading settings:', err);
      }
    });

    this.accountingService.getPostableAccounts().subscribe({
      next: (accounts) => this.accounts.set(accounts),
      error: (err) => console.error('Error loading accounts:', err)
    });
  }

  expenseAccounts(): Account[] {
    return this.accounts().filter(a => a.accountType === 'EXPENSE');
  }

  liabilityAccounts(): Account[] {
    return this.accounts().filter(a => a.accountType === 'LIABILITY');
  }

  bankAccounts(): Account[] {
    return this.accounts().filter(a => a.accountSubtype === 'BANK' || a.accountType === 'ASSET');
  }

  saveSettings(): void {
    this.saving.set(true);
    this.successMessage.set(null);
    this.error.set(null);

    const request: UpdateIntegrationSettingsRequest = {
      autoJournalEnabled: this.formData.autoJournalEnabled,
      journalOnApproval: this.formData.journalOnApproval,
      createPaymentEntry: this.formData.createPaymentEntry,
      defaultExpenseAccountId: this.formData.defaultExpenseAccountId || undefined,
      defaultLiabilityAccountId: this.formData.defaultLiabilityAccountId || undefined,
      defaultBankAccountId: this.formData.defaultBankAccountId || undefined,
      journalDescriptionTemplate: this.formData.journalDescriptionTemplate
    };

    this.accountingService.updatePayrollSettings(request).subscribe({
      next: (settings) => {
        this.settings.set(settings);
        this.saving.set(false);
        this.successMessage.set(this.translate.instant('accounting.payrollIntegration.settings.saveSuccess'));
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(this.translate.instant('accounting.payrollIntegration.settings.saveError'));
        console.error('Error saving settings:', err);
      }
    });
  }
}
