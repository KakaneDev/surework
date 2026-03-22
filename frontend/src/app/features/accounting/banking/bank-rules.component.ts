import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BankingService, BankRule, CreateBankRuleRequest, ConditionField, ConditionOperator } from '../../../core/services/banking.service';
import { AccountingService, Account } from '../../../core/services/accounting.service';
import { SpinnerComponent } from '@shared/ui';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-bank-rules',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    SpinnerComponent,
    DatePipe,
    TranslateModule
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="sw-page-header">
        <div class="flex items-center gap-3">
          <a routerLink="/accounting/banking" class="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300">
            <span class="material-icons">arrow_back</span>
          </a>
          <div>
            <h1 class="sw-page-title">{{ 'accounting.banking.rules.pageTitle' | translate }}</h1>
            <p class="sw-page-description">{{ 'accounting.banking.rules.pageDescription' | translate }}</p>
          </div>
        </div>
        <button (click)="openCreateDialog()" class="sw-btn sw-btn-primary sw-btn-md">
          <span class="material-icons text-lg">add</span>
          {{ 'accounting.banking.rules.newRule' | translate }}
        </button>
      </div>

      @if (loading()) {
        <div class="flex justify-center items-center py-24">
          <sw-spinner size="lg" />
        </div>
      } @else {
        <!-- Rules List -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border">
          @if (rules().length > 0) {
            <div class="overflow-x-auto">
              <table class="sw-table">
                <thead>
                  <tr>
                    <th>{{ 'accounting.banking.rules.columnPriority' | translate }}</th>
                    <th>{{ 'accounting.banking.rules.columnName' | translate }}</th>
                    <th>{{ 'accounting.banking.rules.columnCondition' | translate }}</th>
                    <th>{{ 'accounting.banking.rules.columnTargetAccount' | translate }}</th>
                    <th>{{ 'accounting.banking.rules.columnMatches' | translate }}</th>
                    <th>{{ 'accounting.banking.rules.columnStatus' | translate }}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (rule of rules(); track rule.id) {
                    <tr class="hover:bg-neutral-50 dark:hover:bg-dark-elevated">
                      <td class="text-center">
                        <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 dark:bg-dark-elevated text-sm font-medium">
                          {{ rule.priority }}
                        </span>
                      </td>
                      <td>
                        <div class="font-medium text-neutral-900 dark:text-white">{{ rule.name }}</div>
                        @if (rule.description) {
                          <div class="text-sm text-neutral-500 dark:text-neutral-400">{{ rule.description }}</div>
                        }
                      </td>
                      <td class="text-sm text-neutral-600 dark:text-neutral-400">
                        {{ rule.conditionDescription }}
                      </td>
                      <td>
                        <div class="font-mono text-sm">{{ rule.targetAccountCode }}</div>
                        <div class="text-sm text-neutral-500 dark:text-neutral-400">{{ rule.targetAccountName }}</div>
                      </td>
                      <td class="text-center">
                        <span class="font-medium">{{ rule.matchCount }}</span>
                        @if (rule.lastMatchedAt) {
                          <div class="text-xs text-neutral-500">{{ rule.lastMatchedAt | date:'shortDate' }}</div>
                        }
                      </td>
                      <td>
                        <button (click)="toggleRuleStatus(rule)" class="px-2 py-0.5 text-xs font-medium rounded-full"
                                [class]="rule.active ? 'text-green-600 bg-green-100 hover:bg-green-200' : 'text-neutral-600 bg-neutral-100 hover:bg-neutral-200'">
                          {{ rule.active ? ('accounting.banking.rules.statusActive' | translate) : ('accounting.banking.rules.statusInactive' | translate) }}
                        </button>
                      </td>
                      <td>
                        <div class="flex gap-1">
                          <button (click)="editRule(rule)" class="p-1 text-neutral-400 hover:text-primary-600" [title]="'accounting.banking.rules.actionEdit' | translate">
                            <span class="material-icons text-lg">edit</span>
                          </button>
                          <button (click)="deleteRule(rule)" class="p-1 text-neutral-400 hover:text-red-600" [title]="'accounting.banking.rules.actionDelete' | translate">
                            <span class="material-icons text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="p-12 text-center">
              <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">rule</span>
              <p class="text-neutral-500 dark:text-neutral-400 mb-4">{{ 'accounting.banking.rules.noRulesCreated' | translate }}</p>
              <p class="text-sm text-neutral-400 dark:text-neutral-500 mb-6">
                {{ 'accounting.banking.rules.rulesDescription' | translate }}
              </p>
              <button (click)="openCreateDialog()" class="sw-btn sw-btn-primary sw-btn-md">
                <span class="material-icons text-lg">add</span>
                {{ 'accounting.banking.rules.createFirstRule' | translate }}
              </button>
            </div>
          }
        </div>

        <!-- How Rules Work -->
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
          <h3 class="font-semibold text-blue-800 dark:text-blue-200 mb-2">{{ 'accounting.banking.rules.howRulesWork' | translate }}</h3>
          <ul class="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• {{ 'accounting.banking.rules.helpPoint1' | translate }}</li>
            <li>• {{ 'accounting.banking.rules.helpPoint2' | translate }}</li>
            <li>• {{ 'accounting.banking.rules.helpPoint3' | translate }}</li>
            <li>• {{ 'accounting.banking.rules.helpPoint4' | translate }}</li>
          </ul>
        </div>
      }

      <!-- Create/Edit Dialog -->
      @if (showDialog()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" (click)="closeDialog()">
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-xl w-full max-w-lg mx-4" (click)="$event.stopPropagation()">
            <div class="p-4 border-b border-neutral-200 dark:border-dark-border">
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">
                {{ editingRule() ? ('accounting.banking.rules.dialogEditRule' | translate) : ('accounting.banking.rules.dialogCreateRule' | translate) }}
              </h2>
            </div>
            <div class="p-4 space-y-4">
              <div>
                <label class="sw-label">{{ 'accounting.banking.rules.fieldRuleName' | translate }} *</label>
                <input type="text" [(ngModel)]="form.name" class="sw-input w-full" [placeholder]="'accounting.banking.rules.placeholderRuleName' | translate">
              </div>

              <div>
                <label class="sw-label">{{ 'accounting.banking.rules.fieldDescription' | translate }}</label>
                <input type="text" [(ngModel)]="form.description" class="sw-input w-full" [placeholder]="'accounting.banking.rules.placeholderDescription' | translate">
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="sw-label">{{ 'accounting.banking.rules.fieldField' | translate }}</label>
                  <select [(ngModel)]="form.conditionField" class="sw-input w-full">
                    @for (field of conditionFields; track field) {
                      <option [value]="field">{{ getFieldLabel(field) }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="sw-label">{{ 'accounting.banking.rules.fieldOperator' | translate }}</label>
                  <select [(ngModel)]="form.conditionOperator" class="sw-input w-full">
                    @for (op of conditionOperators; track op) {
                      <option [value]="op">{{ getOperatorLabel(op) }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="sw-label">{{ 'accounting.banking.rules.fieldValue' | translate }} *</label>
                  <input type="text" [(ngModel)]="form.conditionValue" class="sw-input w-full" [placeholder]="'accounting.banking.rules.placeholderMatchValue' | translate">
                </div>
              </div>

              @if (form.conditionOperator === 'BETWEEN') {
                <div>
                  <label class="sw-label">{{ 'accounting.banking.rules.fieldSecondValue' | translate }} *</label>
                  <input type="text" [(ngModel)]="form.conditionValueSecondary" class="sw-input w-full" [placeholder]="'accounting.banking.rules.placeholderUpperLimit' | translate">
                </div>
              }

              <div>
                <label class="sw-label">{{ 'accounting.banking.rules.fieldTargetAccount' | translate }} *</label>
                <select [(ngModel)]="form.targetAccountId" class="sw-input w-full">
                  <option [ngValue]="null">{{ 'accounting.banking.rules.selectAccountPlaceholder' | translate }}</option>
                  @for (account of accounts(); track account.id) {
                    <option [value]="account.id">{{ account.accountCode }} - {{ account.accountName }}</option>
                  }
                </select>
              </div>

              <div>
                <label class="sw-label">{{ 'accounting.banking.rules.fieldPriority' | translate }}</label>
                <input type="number" [(ngModel)]="form.priority" class="sw-input w-full" placeholder="100">
                <p class="text-xs text-neutral-500 mt-1">{{ 'accounting.banking.rules.priorityHint' | translate }}</p>
              </div>
            </div>
            <div class="p-4 border-t border-neutral-200 dark:border-dark-border flex justify-end gap-3">
              <button (click)="closeDialog()" class="sw-btn sw-btn-outline sw-btn-md">{{ 'accounting.banking.rules.buttonCancel' | translate }}</button>
              <button (click)="saveRule()" [disabled]="!isFormValid()" class="sw-btn sw-btn-primary sw-btn-md">
                {{ editingRule() ? ('accounting.banking.rules.buttonUpdate' | translate) : ('accounting.banking.rules.buttonCreate' | translate) }} {{ 'accounting.banking.rules.buttonRuleText' | translate }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankRulesComponent implements OnInit {
  private readonly bankingService = inject(BankingService);
  private readonly accountingService = inject(AccountingService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  rules = signal<BankRule[]>([]);
  accounts = signal<Account[]>([]);
  loading = signal(true);
  showDialog = signal(false);
  editingRule = signal<BankRule | null>(null);

  conditionFields: ConditionField[] = ['DESCRIPTION', 'PAYEE_NAME', 'AMOUNT', 'REFERENCE', 'CATEGORY', 'MCC'];
  conditionOperators: ConditionOperator[] = ['CONTAINS', 'STARTS_WITH', 'ENDS_WITH', 'EQUALS', 'NOT_CONTAINS', 'GREATER_THAN', 'LESS_THAN', 'BETWEEN', 'REGEX'];

  form: CreateBankRuleRequest = {
    name: '',
    description: '',
    conditionField: 'DESCRIPTION',
    conditionOperator: 'CONTAINS',
    conditionValue: '',
    conditionValueSecondary: '',
    targetAccountId: '',
    priority: 100
  };

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    forkJoin({
      rules: this.bankingService.getBankRules(),
      accounts: this.accountingService.getPostableAccounts()
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ rules, accounts }) => {
        this.rules.set(rules);
        this.accounts.set(accounts);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load data', err);
        this.loading.set(false);
      }
    });
  }

  openCreateDialog(): void {
    this.editingRule.set(null);
    this.form = {
      name: '',
      description: '',
      conditionField: 'DESCRIPTION',
      conditionOperator: 'CONTAINS',
      conditionValue: '',
      conditionValueSecondary: '',
      targetAccountId: '',
      priority: 100
    };
    this.showDialog.set(true);
  }

  editRule(rule: BankRule): void {
    this.editingRule.set(rule);
    this.form = {
      name: rule.name,
      description: rule.description || '',
      conditionField: rule.conditionField,
      conditionOperator: rule.conditionOperator,
      conditionValue: rule.conditionValue,
      conditionValueSecondary: rule.conditionValueSecondary || '',
      targetAccountId: rule.targetAccountId,
      priority: rule.priority
    };
    this.showDialog.set(true);
  }

  closeDialog(): void {
    this.showDialog.set(false);
    this.editingRule.set(null);
  }

  saveRule(): void {
    if (!this.isFormValid()) return;

    const editing = this.editingRule();

    if (editing) {
      this.bankingService.updateBankRule(editing.id, {
        name: this.form.name,
        description: this.form.description,
        conditionField: this.form.conditionField,
        conditionOperator: this.form.conditionOperator,
        conditionValue: this.form.conditionValue,
        conditionValueSecondary: this.form.conditionValueSecondary,
        targetAccountId: this.form.targetAccountId,
        priority: this.form.priority,
        active: editing.active
      }).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: () => {
          this.closeDialog();
          this.loadData();
        },
        error: (err) => console.error('Failed to update rule', err)
      });
    } else {
      this.bankingService.createBankRule(this.form).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: () => {
          this.closeDialog();
          this.loadData();
        },
        error: (err) => console.error('Failed to create rule', err)
      });
    }
  }

  toggleRuleStatus(rule: BankRule): void {
    this.bankingService.updateBankRule(rule.id, { active: !rule.active }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => this.loadData(),
      error: (err) => console.error('Failed to toggle rule status', err)
    });
  }

  deleteRule(rule: BankRule): void {
    const confirmMessage = this.translate.instant('accounting.banking.rules.confirmDeleteRule', { ruleName: rule.name });
    if (!confirm(confirmMessage)) return;

    this.bankingService.deleteBankRule(rule.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => this.loadData(),
      error: (err) => console.error('Failed to delete rule', err)
    });
  }

  isFormValid(): boolean {
    return !!this.form.name &&
           !!this.form.conditionValue &&
           !!this.form.targetAccountId &&
           (this.form.conditionOperator !== 'BETWEEN' || !!this.form.conditionValueSecondary);
  }

  getFieldLabel(field: ConditionField): string {
    return BankingService.getConditionFieldLabel(field);
  }

  getOperatorLabel(operator: ConditionOperator): string {
    return BankingService.getConditionOperatorLabel(operator);
  }
}
