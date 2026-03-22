import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import {
  AccountingService,
  Account,
  AccountType,
  CreateAccountRequest,
  UpdateAccountRequest
} from '../../../core/services/accounting.service';
import {
  SpinnerComponent,
  DialogService,
  ToastService,
  AccountTypeDotComponent,
  EmptyStateComponent,
  AccountingConfirmDialogComponent
} from '@shared/ui';
import { AccountDialogComponent } from './account-dialog.component';

interface AccountNode extends Account {
  children?: AccountNode[];
  expanded?: boolean;
  level?: number;
}

@Component({
  selector: 'app-chart-of-accounts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslateModule,
    SpinnerComponent,
    AccountTypeDotComponent,
    EmptyStateComponent,
    AccountingConfirmDialogComponent,
    CurrencyPipe
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="sw-page-header">
        <div class="flex items-center gap-3">
          <a routerLink="/accounting" class="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300">
            <span class="material-icons">arrow_back</span>
          </a>
          <div>
            <h1 class="sw-page-title">{{ 'accounting.chartOfAccounts.title' | translate }}</h1>
            <p class="sw-page-description">{{ 'accounting.chartOfAccounts.subtitle' | translate }}</p>
          </div>
        </div>
        <div class="flex gap-3">
          <button (click)="collapseAll()" class="sw-btn sw-btn-outline sw-btn-md">
            <span class="material-icons text-lg">unfold_less</span>
            {{ 'accounting.chartOfAccounts.collapseAll' | translate }}
          </button>
          <button (click)="expandAll()" class="sw-btn sw-btn-outline sw-btn-md">
            <span class="material-icons text-lg">unfold_more</span>
            {{ 'accounting.chartOfAccounts.expandAll' | translate }}
          </button>
          <button (click)="openAddAccountDialog()" class="sw-btn sw-btn-primary sw-btn-md">
            <span class="material-icons text-lg">add</span>
            {{ 'accounting.chartOfAccounts.addAccount' | translate }}
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
        <div class="flex flex-wrap gap-4">
          <div class="flex-1 min-w-[200px]">
            <input type="text"
                   [(ngModel)]="searchTerm"
                   (ngModelChange)="filterAccounts()"
                   [placeholder]="'accounting.chartOfAccounts.searchPlaceholder' | translate"
                   class="sw-input w-full">
          </div>
          <select [(ngModel)]="selectedType" (ngModelChange)="filterAccounts()" class="sw-input w-48">
            <option [ngValue]="null">{{ 'accounting.chartOfAccounts.allTypes' | translate }}</option>
            @for (type of accountTypes; track type) {
              <option [ngValue]="type">{{ accountTypeLabelMap[type] }}</option>
            }
          </select>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" [(ngModel)]="showInactive" (ngModelChange)="loadAccounts()" class="sw-checkbox">
            <span class="text-sm text-neutral-600 dark:text-neutral-400">{{ 'accounting.chartOfAccounts.showInactive' | translate }}</span>
          </label>
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center items-center py-24">
          <sw-spinner size="lg" />
        </div>
      } @else if (error()) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <span class="material-icons text-5xl text-error-500 mb-4">error</span>
          <p class="text-neutral-600 dark:text-neutral-400 mb-4">{{ error() }}</p>
          <button (click)="loadAccounts()" class="px-4 py-2 text-primary-500 hover:text-primary-600 font-medium">{{ 'common.retry' | translate }}</button>
        </div>
      } @else {
        <!-- Account Tree by Type -->
        @for (type of accountTypes; track type) {
          @if (getAccountsForType(type).length > 0) {
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
              <div class="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-dark-border"
                   [class]="'account-type-' + type.toLowerCase()">
                <div class="flex items-center gap-3">
                  <sw-account-type-dot [type]="type" />
                  <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ accountTypeLabelMap[type] }}</h3>
                  <span class="text-sm text-neutral-500 dark:text-neutral-400">({{ getAccountsForType(type).length }} {{ getAccountsForType(type).length !== 1 ? ('accounting.chartOfAccounts.accounts' | translate) : ('accounting.chartOfAccounts.account' | translate) }})</span>
                </div>
                <div class="text-right">
                  <p class="text-lg font-bold text-neutral-800 dark:text-neutral-200">{{ getTypeTotal(type) | currency:'ZAR':'symbol':'1.0-0' }}</p>
                  <p class="text-xs text-neutral-400 dark:text-neutral-500">{{ 'accounting.chartOfAccounts.totalBalance' | translate }}</p>
                </div>
              </div>
              <div class="overflow-x-auto">
                <table class="sw-table">
                  <thead>
                    <tr>
                      <th class="w-[300px]">{{ 'accounting.chartOfAccounts.account' | translate }}</th>
                      <th>{{ 'accounting.chartOfAccounts.subtype' | translate }}</th>
                      <th class="text-right">{{ 'accounting.chartOfAccounts.currentBalance' | translate }}</th>
                      <th class="text-right">{{ 'accounting.chartOfAccounts.ytdDebit' | translate }}</th>
                      <th class="text-right">{{ 'accounting.chartOfAccounts.ytdCredit' | translate }}</th>
                      <th>{{ 'accounting.chartOfAccounts.vat' | translate }}</th>
                      <th>{{ 'common.status' | translate }}</th>
                      <th class="w-[100px]">{{ 'common.actions' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (account of getFilteredAccountTree(type); track account.id) {
                      <ng-container *ngTemplateOutlet="accountRow; context: { $implicit: account }"></ng-container>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        }

        @if (filteredAccounts().length === 0) {
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
            <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">search_off</span>
            <p class="text-neutral-500 dark:text-neutral-400">{{ 'accounting.chartOfAccounts.noAccountsFound' | translate }}</p>
          </div>
        }
      }

      <!-- Account Row Template -->
      <ng-template #accountRow let-account>
        <tr [class.bg-neutral-50]="account.isHeader" [class.dark:bg-dark-elevated]="account.isHeader">
          <td>
            <div class="flex items-center gap-2 tree-node" [style.--tree-level]="account.level || 0">
              @if (account.children?.length) {
                <button (click)="toggleExpand(account)" class="p-1 hover:bg-neutral-100 dark:hover:bg-dark-border rounded">
                  <span class="material-icons text-sm text-neutral-400">
                    {{ account.expanded ? 'expand_more' : 'chevron_right' }}
                  </span>
                </button>
              } @else {
                <span class="w-6"></span>
              }
              <span class="font-mono text-sm text-neutral-500 dark:text-neutral-400">{{ account.accountCode }}</span>
              <span [class.font-semibold]="account.isHeader" class="text-neutral-800 dark:text-neutral-200">
                {{ account.accountName }}
              </span>
              @if (account.isSystemAccount) {
                <span class="material-icons text-xs text-neutral-400" [title]="'accounting.chartOfAccounts.systemAccount' | translate">lock</span>
              }
            </div>
          </td>
          <td class="text-neutral-600 dark:text-neutral-400 text-sm">
            {{ account.accountSubtype ? formatSubtype(account.accountSubtype) : '-' }}
          </td>
          <td class="text-right font-mono">
            @if (!account.isHeader) {
              <span [class.text-emerald-600]="account.currentBalance > 0" [class.text-red-600]="account.currentBalance < 0">
                {{ account.currentBalance | currency:'ZAR':'symbol':'1.2-2' }}
              </span>
            }
          </td>
          <td class="text-right font-mono text-neutral-600 dark:text-neutral-400">
            @if (!account.isHeader) {
              {{ account.ytdDebit | currency:'ZAR':'symbol':'1.2-2' }}
            }
          </td>
          <td class="text-right font-mono text-neutral-600 dark:text-neutral-400">
            @if (!account.isHeader) {
              {{ account.ytdCredit | currency:'ZAR':'symbol':'1.2-2' }}
            }
          </td>
          <td class="text-sm">
            @if (account.vatCategory) {
              <span class="text-neutral-500 dark:text-neutral-400">{{ formatVatCategory(account.vatCategory) }}</span>
            } @else {
              <span class="text-neutral-300 dark:text-neutral-600">-</span>
            }
          </td>
          <td>
            @if (account.isActive) {
              <span class="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{{ 'accounting.chartOfAccounts.active' | translate }}</span>
            } @else {
              <span class="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">{{ 'accounting.chartOfAccounts.inactive' | translate }}</span>
            }
          </td>
          <td>
            <div class="flex items-center gap-1">
              <button (click)="openEditAccountDialog(account)"
                      [disabled]="account.isSystemAccount"
                      class="p-1.5 text-neutral-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      [title]="'common.edit' | translate">
                <span class="material-icons text-lg">edit</span>
              </button>
              @if (account.isActive) {
                <button (click)="deactivateAccount(account)"
                        [disabled]="account.isSystemAccount"
                        class="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        [title]="'accounting.chartOfAccounts.deactivate' | translate">
                  <span class="material-icons text-lg">block</span>
                </button>
              } @else {
                <button (click)="activateAccount(account)"
                        class="p-1.5 text-neutral-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                        [title]="'accounting.chartOfAccounts.activate' | translate">
                  <span class="material-icons text-lg">check_circle</span>
                </button>
              }
            </div>
          </td>
        </tr>
        @if (account.expanded && account.children?.length) {
          @for (child of account.children; track child.id) {
            <ng-container *ngTemplateOutlet="accountRow; context: { $implicit: child }"></ng-container>
          }
        }
      </ng-template>

      <!-- Deactivate Confirmation Dialog -->
      <sw-accounting-confirm-dialog
        [open]="deactivateDialogOpen()"
        type="void"
        [title]="'accounting.chartOfAccounts.deactivateTitle' | translate"
        [message]="'accounting.chartOfAccounts.deactivateMessage' | translate"
        [entryNumber]="selectedAccount()?.accountCode || ''"
        [entryDescription]="selectedAccount()?.accountName || ''"
        [additionalInfoLabel]="'common.type' | translate"
        [additionalInfo]="selectedAccount()?.accountType ? accountTypeLabelMap[selectedAccount()!.accountType] : ''"
        [warningMessage]="'accounting.chartOfAccounts.deactivateWarning' | translate"
        [confirmText]="'accounting.chartOfAccounts.deactivate' | translate"
        (confirm)="confirmDeactivate()"
        (cancel)="closeDeactivateDialog()" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChartOfAccountsComponent implements OnInit {
  private readonly accountingService = inject(AccountingService);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly accountTypes: AccountType[] = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

  readonly accountTypeLabelMap: Record<AccountType, string> = {
    ASSET: 'Assets',
    LIABILITY: 'Liabilities',
    EQUITY: 'Equity',
    REVENUE: 'Revenue',
    EXPENSE: 'Expenses'
  };

  accounts = signal<Account[]>([]);
  filteredAccounts = signal<Account[]>([]);
  accountTree = signal<Map<AccountType, AccountNode[]>>(new Map());
  loading = signal(true);
  error = signal<string | null>(null);

  searchTerm = '';
  selectedType: AccountType | null = null;
  showInactive = false;

  // Dialog state
  deactivateDialogOpen = signal(false);
  selectedAccount = signal<Account | null>(null);

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.loading.set(true);
    this.error.set(null);

    this.accountingService.searchAccounts(0, 1000, undefined, undefined, this.showInactive ? undefined : true).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.accounts.set(response.content);
        this.buildAccountTree();
        this.filterAccounts();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load accounts', err);
        this.error.set('accounting.chartOfAccounts.loadError');
        this.loading.set(false);
      }
    });
  }

  private buildAccountTree(): void {
    const accounts = this.accounts();
    const tree = new Map<AccountType, AccountNode[]>();

    // Initialize empty arrays for each type
    for (const type of this.accountTypes) {
      tree.set(type, []);
    }

    // Create account map for lookup
    const accountMap = new Map<string, AccountNode>();
    for (const account of accounts) {
      accountMap.set(account.id, { ...account, children: [], expanded: true, level: 0 });
    }

    // Build tree structure
    for (const account of accounts) {
      const node = accountMap.get(account.id)!;
      if (account.parentId && accountMap.has(account.parentId)) {
        const parent = accountMap.get(account.parentId)!;
        node.level = (parent.level || 0) + 1;
        parent.children!.push(node);
      } else {
        tree.get(account.accountType)!.push(node);
      }
    }

    // Sort by account code
    const sortByCode = (a: AccountNode, b: AccountNode) => a.accountCode.localeCompare(b.accountCode);
    for (const [type, nodes] of tree) {
      nodes.sort(sortByCode);
      for (const node of accountMap.values()) {
        node.children?.sort(sortByCode);
      }
    }

    this.accountTree.set(tree);
  }

  filterAccounts(): void {
    let accounts = this.accounts();

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      accounts = accounts.filter(a =>
        a.accountCode.toLowerCase().includes(term) ||
        a.accountName.toLowerCase().includes(term)
      );
    }

    if (this.selectedType) {
      accounts = accounts.filter(a => a.accountType === this.selectedType);
    }

    this.filteredAccounts.set(accounts);
    this.buildAccountTree();
  }

  getAccountsForType(type: AccountType): Account[] {
    return this.filteredAccounts().filter(a => a.accountType === type);
  }

  getFilteredAccountTree(type: AccountType): AccountNode[] {
    if (this.searchTerm || this.selectedType) {
      // When filtering, show flat list
      return this.getAccountsForType(type).map(a => ({ ...a, children: [], level: 0, expanded: false }));
    }
    return this.accountTree().get(type) || [];
  }

  getTypeTotal(type: AccountType): number {
    return this.getAccountsForType(type)
      .filter(a => !a.isHeader)
      .reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  }

  toggleExpand(account: AccountNode): void {
    account.expanded = !account.expanded;
  }

  expandAll(): void {
    const tree = this.accountTree();
    const expandNode = (node: AccountNode) => {
      node.expanded = true;
      node.children?.forEach(expandNode);
    };
    for (const nodes of tree.values()) {
      nodes.forEach(expandNode);
    }
    this.accountTree.set(new Map(tree));
  }

  collapseAll(): void {
    const tree = this.accountTree();
    const collapseNode = (node: AccountNode) => {
      node.expanded = false;
      node.children?.forEach(collapseNode);
    };
    for (const nodes of tree.values()) {
      nodes.forEach(collapseNode);
    }
    this.accountTree.set(new Map(tree));
  }

  openAddAccountDialog(): void {
    const dialogRef = this.dialog.open(AccountDialogComponent, {
      width: '500px',
      data: { accounts: this.accounts() }
    });

    dialogRef.afterClosed().then((result) => {
      if (result) {
        this.createAccount(result as CreateAccountRequest);
      }
    });
  }

  openEditAccountDialog(account: Account): void {
    const dialogRef = this.dialog.open(AccountDialogComponent, {
      width: '500px',
      data: { account, accounts: this.accounts() }
    });

    dialogRef.afterClosed().then((result) => {
      if (result) {
        this.updateAccount(account.id, result as UpdateAccountRequest);
      }
    });
  }

  private createAccount(request: CreateAccountRequest): void {
    this.accountingService.createAccount(request).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success('accounting.chartOfAccounts.createSuccess');
        this.loadAccounts();
      },
      error: (err) => {
        console.error('Failed to create account', err);
        this.toast.error('accounting.chartOfAccounts.createError');
      }
    });
  }

  private updateAccount(accountId: string, request: UpdateAccountRequest): void {
    this.accountingService.updateAccount(accountId, request).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success('accounting.chartOfAccounts.updateSuccess');
        this.loadAccounts();
      },
      error: (err) => {
        console.error('Failed to update account', err);
        this.toast.error('accounting.chartOfAccounts.updateError');
      }
    });
  }

  showDeactivateDialog(account: Account): void {
    this.selectedAccount.set(account);
    this.deactivateDialogOpen.set(true);
  }

  closeDeactivateDialog(): void {
    this.deactivateDialogOpen.set(false);
    this.selectedAccount.set(null);
  }

  confirmDeactivate(): void {
    const account = this.selectedAccount();
    if (!account) return;

    this.accountingService.deactivateAccount(account.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success('accounting.chartOfAccounts.deactivateSuccess');
        this.closeDeactivateDialog();
        this.loadAccounts();
      },
      error: (err) => {
        console.error('Failed to deactivate account', err);
        this.toast.error('accounting.chartOfAccounts.deactivateError');
        this.closeDeactivateDialog();
      }
    });
  }

  deactivateAccount(account: Account): void {
    this.showDeactivateDialog(account);
  }

  activateAccount(account: Account): void {
    this.accountingService.activateAccount(account.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.toast.success('accounting.chartOfAccounts.activateSuccess');
        this.loadAccounts();
      },
      error: (err) => {
        console.error('Failed to activate account', err);
        this.toast.error('accounting.chartOfAccounts.activateError');
      }
    });
  }

  formatSubtype(subtype: string): string {
    return subtype.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  formatVatCategory(category: string): string {
    const labels: Record<string, string> = {
      STANDARD: '15%',
      ZERO_RATED: '0%',
      EXEMPT: 'Exempt',
      OUT_OF_SCOPE: 'N/A',
      INPUT_VAT: 'Input',
      OUTPUT_VAT: 'Output'
    };
    return labels[category] || category;
  }
}
