import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule, ArrowLeft, Plus, Pencil, Trash2, AlertCircle, Check, X } from 'lucide-angular';
import {
  AccountingService,
  PayrollAccountMapping,
  PayrollMappingType,
  MappingTypeInfo,
  Account,
  CreateAccountMappingRequest,
  UpdateAccountMappingRequest
} from '../../../core/services/accounting.service';

@Component({
  selector: 'app-payroll-account-mappings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, LucideAngularModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a routerLink="/accounting/payroll-integration"
             class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <lucide-icon [img]="ArrowLeftIcon" class="w-5 h-5"></lucide-icon>
          </a>
          <div>
            <h1 class="text-2xl font-semibold text-gray-900">{{ 'accounting.payrollIntegration.mappings.title' | translate }}</h1>
            <p class="mt-1 text-sm text-gray-500">
              {{ 'accounting.payrollIntegration.mappings.subtitle' | translate }}
            </p>
          </div>
        </div>
        <button (click)="openCreateDialog()"
                class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
          <lucide-icon [img]="PlusIcon" class="w-4 h-4"></lucide-icon>
          {{ 'accounting.payrollIntegration.mappings.addMapping' | translate }}
        </button>
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
        <!-- Mappings by Category -->
        @for (category of categories; track category) {
          <div class="bg-white rounded-lg border border-gray-200">
            <div class="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h2 class="font-medium text-gray-900">{{ getCategoryLabel(category) | translate }}</h2>
            </div>
            <div class="divide-y divide-gray-100">
              @for (mapping of getMappingsByCategory(category); track mapping.id) {
                <div class="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <p class="font-medium text-gray-900">{{ mapping.mappingTypeDisplay }}</p>
                      @if (mapping.isDefault) {
                        <span class="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {{ 'accounting.payrollIntegration.mappings.defaultLabel' | translate }}
                        </span>
                      }
                      @if (!mapping.active) {
                        <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {{ 'common.inactive' | translate }}
                        </span>
                      }
                    </div>
                    <p class="text-sm text-gray-500">
                      {{ mapping.accountCode }} - {{ mapping.accountName }}
                      @if (mapping.departmentName) {
                        <span class="ml-2">({{ mapping.departmentName }})</span>
                      }
                    </p>
                  </div>
                  <div class="flex items-center gap-2">
                    <button (click)="openEditDialog(mapping)"
                            class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <lucide-icon [img]="PencilIcon" class="w-4 h-4"></lucide-icon>
                    </button>
                    <button (click)="confirmDelete(mapping)"
                            class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <lucide-icon [img]="Trash2Icon" class="w-4 h-4"></lucide-icon>
                    </button>
                  </div>
                </div>
              } @empty {
                <div class="px-4 py-6 text-center text-gray-500">
                  {{ 'accounting.payrollIntegration.mappings.noMappings' | translate: { category: (getCategoryLabel(category) | translate | lowercase) } }}
                </div>
              }
            </div>
          </div>
        }
      }

      <!-- Create/Edit Dialog -->
      @if (showDialog()) {
        <div class="fixed inset-0 z-50 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75" (click)="closeDialog()"></div>
            <div class="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">
                {{ (editingMapping() ? 'accounting.payrollIntegration.mappings.dialog.editTitle' : 'accounting.payrollIntegration.mappings.dialog.addTitle') | translate }}
              </h3>

              <div class="space-y-4">
                <!-- Mapping Type -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ 'accounting.payrollIntegration.mappings.dialog.fields.mappingType' | translate }}</label>
                  <select [(ngModel)]="formData.mappingType"
                          [disabled]="!!editingMapping()"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100">
                    <option value="">{{ 'accounting.payrollIntegration.mappings.dialog.placeholders.selectType' | translate }}</option>
                    @for (type of mappingTypes(); track type.code) {
                      <option [value]="type.code">{{ type.display }}</option>
                    }
                  </select>
                </div>

                <!-- Account -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">{{ 'accounting.payrollIntegration.mappings.dialog.fields.account' | translate }}</label>
                  <select [(ngModel)]="formData.accountId"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">{{ 'accounting.payrollIntegration.mappings.dialog.placeholders.selectAccount' | translate }}</option>
                    @for (account of filteredAccounts(); track account.id) {
                      <option [value]="account.id">{{ account.accountCode }} - {{ account.accountName }}</option>
                    }
                  </select>
                </div>

                <!-- Is Default -->
                <div class="flex items-center gap-2">
                  <input type="checkbox" id="isDefault"
                         [(ngModel)]="formData.isDefault"
                         class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                  <label for="isDefault" class="text-sm text-gray-700">{{ 'accounting.payrollIntegration.mappings.dialog.fields.setAsDefault' | translate }}</label>
                </div>

                <!-- Active (only for edit) -->
                @if (editingMapping()) {
                  <div class="flex items-center gap-2">
                    <input type="checkbox" id="active"
                           [(ngModel)]="formData.active"
                           class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                    <label for="active" class="text-sm text-gray-700">{{ 'common.active' | translate }}</label>
                  </div>
                }
              </div>

              <div class="mt-6 flex justify-end gap-3">
                <button (click)="closeDialog()"
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  {{ 'common.cancel' | translate }}
                </button>
                <button (click)="saveMapping()"
                        [disabled]="saving()"
                        class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {{ saving() ? ('accounting.payrollIntegration.mappings.saving' | translate) : (editingMapping() ? ('common.update' | translate) : ('common.create' | translate)) }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Delete Confirmation Dialog -->
      @if (showDeleteDialog()) {
        <div class="fixed inset-0 z-50 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75" (click)="cancelDelete()"></div>
            <div class="relative bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ 'accounting.payrollIntegration.mappings.dialog.deleteTitle' | translate }}</h3>
              <p class="text-sm text-gray-500 mb-4">
                {{ 'accounting.payrollIntegration.mappings.dialog.deleteMessage' | translate }}
              </p>
              <div class="flex justify-end gap-3">
                <button (click)="cancelDelete()"
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  {{ 'common.cancel' | translate }}
                </button>
                <button (click)="deleteMapping()"
                        [disabled]="deleting()"
                        class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
                  {{ deleting() ? ('accounting.payrollIntegration.mappings.deleting' | translate) : ('common.delete' | translate) }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class PayrollAccountMappingsComponent implements OnInit {
  private readonly accountingService = inject(AccountingService);
  private readonly translate = inject(TranslateService);

  // Icons
  readonly ArrowLeftIcon = ArrowLeft;
  readonly PlusIcon = Plus;
  readonly PencilIcon = Pencil;
  readonly Trash2Icon = Trash2;
  readonly AlertCircleIcon = AlertCircle;

  // Categories
  readonly categories: ('EXPENSE' | 'LIABILITY' | 'ASSET')[] = ['EXPENSE', 'LIABILITY', 'ASSET'];

  // State
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly mappings = signal<PayrollAccountMapping[]>([]);
  readonly mappingTypes = signal<MappingTypeInfo[]>([]);
  readonly accounts = signal<Account[]>([]);

  // Dialog state
  readonly showDialog = signal(false);
  readonly editingMapping = signal<PayrollAccountMapping | null>(null);
  readonly saving = signal(false);

  // Delete dialog state
  readonly showDeleteDialog = signal(false);
  readonly deletingMapping = signal<PayrollAccountMapping | null>(null);
  readonly deleting = signal(false);

  // Form data
  formData = {
    mappingType: '' as PayrollMappingType | '',
    accountId: '',
    isDefault: false,
    active: true
  };

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    // Load mappings, mapping types, and accounts in parallel
    this.accountingService.getPayrollMappings().subscribe({
      next: (mappings) => {
        this.mappings.set(mappings);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.translate.instant('accounting.payrollIntegration.mappings.errorLoading'));
        this.loading.set(false);
        console.error('Error loading mappings:', err);
      }
    });

    this.accountingService.getPayrollMappingTypes().subscribe({
      next: (types) => this.mappingTypes.set(types),
      error: (err) => console.error('Error loading mapping types:', err)
    });

    this.accountingService.getPostableAccounts().subscribe({
      next: (accounts) => this.accounts.set(accounts),
      error: (err) => console.error('Error loading accounts:', err)
    });
  }

  getCategoryLabel(category: 'EXPENSE' | 'LIABILITY' | 'ASSET'): string {
    const labelKeys = {
      EXPENSE: 'accounting.payrollIntegration.mappings.categories.expense',
      LIABILITY: 'accounting.payrollIntegration.mappings.categories.liability',
      ASSET: 'accounting.payrollIntegration.mappings.categories.asset'
    };
    return labelKeys[category];
  }

  getMappingsByCategory(category: 'EXPENSE' | 'LIABILITY' | 'ASSET'): PayrollAccountMapping[] {
    return this.mappings().filter(m =>
      AccountingService.getPayrollMappingCategory(m.mappingType) === category
    );
  }

  filteredAccounts(): Account[] {
    if (!this.formData.mappingType) return this.accounts();

    const category = AccountingService.getPayrollMappingCategory(this.formData.mappingType as PayrollMappingType);
    return this.accounts().filter(a => {
      switch (category) {
        case 'EXPENSE':
          return a.accountType === 'EXPENSE';
        case 'LIABILITY':
          return a.accountType === 'LIABILITY';
        case 'ASSET':
          return a.accountType === 'ASSET';
        default:
          return true;
      }
    });
  }

  openCreateDialog(): void {
    this.editingMapping.set(null);
    this.formData = {
      mappingType: '',
      accountId: '',
      isDefault: false,
      active: true
    };
    this.showDialog.set(true);
  }

  openEditDialog(mapping: PayrollAccountMapping): void {
    this.editingMapping.set(mapping);
    this.formData = {
      mappingType: mapping.mappingType,
      accountId: mapping.accountId,
      isDefault: mapping.isDefault,
      active: mapping.active
    };
    this.showDialog.set(true);
  }

  closeDialog(): void {
    this.showDialog.set(false);
    this.editingMapping.set(null);
  }

  saveMapping(): void {
    if (!this.formData.mappingType || !this.formData.accountId) return;

    this.saving.set(true);

    const editing = this.editingMapping();
    if (editing) {
      const request: UpdateAccountMappingRequest = {
        accountId: this.formData.accountId,
        isDefault: this.formData.isDefault,
        active: this.formData.active
      };

      this.accountingService.updatePayrollMapping(editing.id, request).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeDialog();
          this.loadData();
        },
        error: (err) => {
          this.saving.set(false);
          console.error('Error updating mapping:', err);
        }
      });
    } else {
      const request: CreateAccountMappingRequest = {
        mappingType: this.formData.mappingType as PayrollMappingType,
        accountId: this.formData.accountId,
        isDefault: this.formData.isDefault
      };

      this.accountingService.createPayrollMapping(request).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeDialog();
          this.loadData();
        },
        error: (err) => {
          this.saving.set(false);
          console.error('Error creating mapping:', err);
        }
      });
    }
  }

  confirmDelete(mapping: PayrollAccountMapping): void {
    this.deletingMapping.set(mapping);
    this.showDeleteDialog.set(true);
  }

  cancelDelete(): void {
    this.showDeleteDialog.set(false);
    this.deletingMapping.set(null);
  }

  deleteMapping(): void {
    const mapping = this.deletingMapping();
    if (!mapping) return;

    this.deleting.set(true);

    this.accountingService.deletePayrollMapping(mapping.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.cancelDelete();
        this.loadData();
      },
      error: (err) => {
        this.deleting.set(false);
        console.error('Error deleting mapping:', err);
      }
    });
  }
}
