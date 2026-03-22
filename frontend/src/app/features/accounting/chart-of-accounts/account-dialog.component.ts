import { Component, ChangeDetectionStrategy, inject, signal, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import type { DialogRef } from '@shared/ui';
import {
  Account,
  AccountType,
  AccountSubtype,
  VatCategory,
  CreateAccountRequest,
  UpdateAccountRequest
} from '../../../core/services/accounting.service';

interface DialogData {
  account?: Account;
  accounts: Account[];
}

@Component({
  selector: 'app-account-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  template: `
    <div class="p-6">
      <h2 class="text-xl font-semibold text-neutral-900 dark:text-white mb-6">
        {{ (isEdit ? 'accounting.chartOfAccounts.dialog.editTitle' : 'accounting.chartOfAccounts.dialog.addTitle') | translate }}
      </h2>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        @if (!isEdit) {
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="sw-label">{{ 'accounting.chartOfAccounts.dialog.fields.accountCode' | translate }} *</label>
              <input type="text" formControlName="accountCode" class="sw-input w-full" [placeholder]="'accounting.chartOfAccounts.dialog.placeholders.accountCode' | translate">
              @if (form.get('accountCode')?.touched && form.get('accountCode')?.errors?.['required']) {
                <p class="text-sm text-red-500 mt-1">{{ 'accounting.chartOfAccounts.dialog.validation.accountCodeRequired' | translate }}</p>
              }
            </div>
            <div>
              <label class="sw-label">{{ 'accounting.chartOfAccounts.dialog.fields.accountType' | translate }} *</label>
              <select formControlName="accountType" class="sw-input w-full">
                <option [ngValue]="null">{{ 'accounting.chartOfAccounts.dialog.placeholders.selectType' | translate }}</option>
                @for (type of accountTypes; track type) {
                  <option [ngValue]="type">{{ ('accounting.chartOfAccounts.dialog.accountTypes.' + type) | translate }}</option>
                }
              </select>
            </div>
          </div>
        }

        <div>
          <label class="sw-label">{{ 'accounting.chartOfAccounts.dialog.fields.accountName' | translate }} *</label>
          <input type="text" formControlName="accountName" class="sw-input w-full" [placeholder]="'accounting.chartOfAccounts.dialog.placeholders.accountName' | translate">
          @if (form.get('accountName')?.touched && form.get('accountName')?.errors?.['required']) {
            <p class="text-sm text-red-500 mt-1">{{ 'accounting.chartOfAccounts.dialog.validation.accountNameRequired' | translate }}</p>
          }
        </div>

        <div>
          <label class="sw-label">{{ 'accounting.chartOfAccounts.dialog.fields.description' | translate }}</label>
          <textarea formControlName="description" rows="2" class="sw-input w-full" [placeholder]="'accounting.chartOfAccounts.dialog.placeholders.description' | translate"></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="sw-label">{{ 'accounting.chartOfAccounts.dialog.fields.subtype' | translate }}</label>
            <select formControlName="accountSubtype" class="sw-input w-full">
              <option [ngValue]="null">{{ 'accounting.chartOfAccounts.dialog.options.none' | translate }}</option>
              @for (subtype of getSubtypesForType(form.get('accountType')?.value); track subtype) {
                <option [ngValue]="subtype">{{ getTranslatedSubtype(subtype) }}</option>
              }
            </select>
          </div>
          @if (!isEdit) {
            <div>
              <label class="sw-label">{{ 'accounting.chartOfAccounts.dialog.fields.parentAccount' | translate }}</label>
              <select formControlName="parentId" class="sw-input w-full">
                <option [ngValue]="null">{{ 'accounting.chartOfAccounts.dialog.options.noneTopLevel' | translate }}</option>
                @for (account of getParentOptions(); track account.id) {
                  <option [ngValue]="account.id">{{ account.accountCode }} - {{ account.accountName }}</option>
                }
              </select>
            </div>
          }
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="sw-label">{{ 'accounting.chartOfAccounts.dialog.fields.vatCategory' | translate }}</label>
            <select formControlName="vatCategory" class="sw-input w-full">
              <option [ngValue]="null">{{ 'accounting.chartOfAccounts.dialog.options.none' | translate }}</option>
              @for (cat of vatCategories; track cat) {
                <option [ngValue]="cat">{{ ('accounting.chartOfAccounts.dialog.vatCategories.' + cat) | translate }}</option>
              }
            </select>
          </div>
          <div>
            <label class="sw-label">{{ 'accounting.chartOfAccounts.dialog.fields.vatRate' | translate }} (%)</label>
            <input type="number" formControlName="vatRate" class="sw-input w-full" [placeholder]="'accounting.chartOfAccounts.dialog.placeholders.vatRate' | translate" step="0.01" min="0" max="100">
          </div>
        </div>

        @if (!isEdit) {
          <div>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" formControlName="isHeader" class="sw-checkbox">
              <span class="text-sm text-neutral-700 dark:text-neutral-300">{{ 'accounting.chartOfAccounts.dialog.fields.isHeader' | translate }}</span>
            </label>
          </div>
        }

        @if (isEdit) {
          <div>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" formControlName="isActive" class="sw-checkbox">
              <span class="text-sm text-neutral-700 dark:text-neutral-300">{{ 'accounting.chartOfAccounts.dialog.fields.isActive' | translate }}</span>
            </label>
          </div>
        }

        <div class="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-dark-border">
          <button type="button" (click)="onCancel()" class="sw-btn sw-btn-outline sw-btn-md">
            {{ 'accounting.chartOfAccounts.dialog.buttons.cancel' | translate }}
          </button>
          <button type="submit" [disabled]="form.invalid || saving()" class="sw-btn sw-btn-primary sw-btn-md">
            @if (saving()) {
              <span class="animate-spin mr-2">&#9696;</span>
            }
            {{ (isEdit ? 'accounting.chartOfAccounts.dialog.buttons.update' : 'accounting.chartOfAccounts.dialog.buttons.create') | translate }}
          </button>
        </div>
      </form>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);

  constructor(
    @Inject('DIALOG_REF') private readonly dialogRef: DialogRef<CreateAccountRequest | UpdateAccountRequest | undefined>,
    @Inject('DIALOG_DATA') private readonly data: DialogData
  ) {}

  readonly accountTypes: AccountType[] = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
  readonly accountTypeLabels: Record<AccountType, string> = {
    ASSET: 'Assets',
    LIABILITY: 'Liabilities',
    EQUITY: 'Equity',
    REVENUE: 'Revenue',
    EXPENSE: 'Expenses'
  };

  readonly subtypesByType: Record<AccountType, AccountSubtype[]> = {
    ASSET: ['CASH', 'BANK', 'ACCOUNTS_RECEIVABLE', 'INVENTORY', 'PREPAID_EXPENSE', 'OTHER_CURRENT_ASSET', 'FIXED_ASSET', 'ACCUMULATED_DEPRECIATION', 'OTHER_NON_CURRENT_ASSET'],
    LIABILITY: ['ACCOUNTS_PAYABLE', 'ACCRUED_LIABILITY', 'TAX_PAYABLE', 'OTHER_CURRENT_LIABILITY', 'LONG_TERM_LIABILITY'],
    EQUITY: ['SHARE_CAPITAL', 'RETAINED_EARNINGS', 'CURRENT_YEAR_EARNINGS', 'DRAWINGS'],
    REVENUE: [],
    EXPENSE: []
  };

  readonly vatCategories: VatCategory[] = ['STANDARD', 'ZERO_RATED', 'EXEMPT', 'OUT_OF_SCOPE', 'INPUT_VAT', 'OUTPUT_VAT'];
  readonly vatCategoryLabels: Record<VatCategory, string> = {
    STANDARD: 'Standard (15%)',
    ZERO_RATED: 'Zero Rated (0%)',
    EXEMPT: 'Exempt',
    OUT_OF_SCOPE: 'Out of Scope',
    INPUT_VAT: 'Input VAT',
    OUTPUT_VAT: 'Output VAT'
  };

  form!: FormGroup;
  saving = signal(false);

  get isEdit(): boolean {
    return !!this.data.account;
  }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    const account = this.data.account;

    if (this.isEdit) {
      this.form = this.fb.group({
        accountName: [account?.accountName || '', Validators.required],
        description: [account?.description || ''],
        accountSubtype: [account?.accountSubtype || null],
        vatCategory: [account?.vatCategory || null],
        vatRate: [account?.vatRate ? account.vatRate * 100 : null],
        isActive: [account?.isActive ?? true]
      });
    } else {
      this.form = this.fb.group({
        accountCode: ['', Validators.required],
        accountName: ['', Validators.required],
        description: [''],
        accountType: [null as AccountType | null, Validators.required],
        accountSubtype: [null as AccountSubtype | null],
        parentId: [null as string | null],
        isHeader: [false],
        vatCategory: [null as VatCategory | null],
        vatRate: [null as number | null]
      });
    }
  }

  getSubtypesForType(type: AccountType | null): AccountSubtype[] {
    if (!type) return [];
    return this.subtypesByType[type] || [];
  }

  getParentOptions(): Account[] {
    const selectedType = this.form.get('accountType')?.value;
    if (!selectedType) return [];

    return this.data.accounts.filter(a =>
      a.accountType === selectedType &&
      a.isHeader &&
      a.isActive
    );
  }

  formatSubtype(subtype: AccountSubtype): string {
    return subtype.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  getTranslatedSubtype(subtype: AccountSubtype): string {
    return this.translate.instant('accounting.chartOfAccounts.dialog.accountSubtypes.' + subtype);
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const values = this.form.value;

    if (this.isEdit) {
      const request: UpdateAccountRequest = {
        accountName: values.accountName,
        description: values.description || undefined,
        accountSubtype: values.accountSubtype || undefined,
        vatCategory: values.vatCategory || undefined,
        vatRate: values.vatRate ? values.vatRate / 100 : undefined,
        isActive: values.isActive
      };
      this.dialogRef.close(request);
    } else {
      const request: CreateAccountRequest = {
        accountCode: values.accountCode,
        accountName: values.accountName,
        description: values.description || undefined,
        accountType: values.accountType,
        accountSubtype: values.accountSubtype || undefined,
        parentId: values.parentId || undefined,
        isHeader: values.isHeader,
        vatCategory: values.vatCategory || undefined,
        vatRate: values.vatRate ? values.vatRate / 100 : undefined
      };
      this.dialogRef.close(request);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
