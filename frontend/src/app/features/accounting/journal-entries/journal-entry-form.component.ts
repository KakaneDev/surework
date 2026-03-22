import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  AccountingService,
  Account,
  JournalEntry,
  JournalEntryType,
  CreateJournalEntryRequest,
  JournalEntryLineRequest
} from '../../../core/services/accounting.service';
import { SpinnerComponent, ToastService } from '@shared/ui';

@Component({
  selector: 'app-journal-entry-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    SpinnerComponent,
    CurrencyPipe,
    DatePipe
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="sw-page-header">
        <div class="flex items-center gap-3">
          <a routerLink="/accounting/journals" class="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300">
            <span class="material-icons">arrow_back</span>
          </a>
          <div>
            <h1 class="sw-page-title">{{ isEdit ? ('accounting.journalEntries.form.editTitle' | translate) : ('accounting.journalEntries.form.newTitle' | translate) }}</h1>
            <p class="sw-page-description">{{ isEdit ? ('accounting.journalEntries.form.editDescription' | translate) : ('accounting.journalEntries.form.newDescription' | translate) }}</p>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center items-center py-24">
          <sw-spinner size="lg" />
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
          <!-- Entry Details -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-white mb-4">{{ 'accounting.journalEntries.form.entryDetailsTitle' | translate }}</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="form-field" [class.form-field-error]="hasError('transactionDate')">
                <label class="sw-label" for="transactionDate">{{ 'accounting.journalEntries.form.transactionDateLabel' | translate }}</label>
                <input type="date"
                       id="transactionDate"
                       formControlName="transactionDate"
                       class="sw-input w-full"
                       [attr.aria-invalid]="hasError('transactionDate')"
                       [attr.aria-describedby]="hasError('transactionDate') ? 'transactionDate-error' : null">
                @if (hasError('transactionDate')) {
                  <p id="transactionDate-error" class="text-sm text-red-500 mt-1 flex items-center gap-1" role="alert">
                    <span class="material-icons text-sm" aria-hidden="true">error</span>
                    {{ 'accounting.journalEntries.form.dateRequiredError' | translate }}
                  </p>
                }
              </div>
              <div>
                <label class="sw-label">{{ 'accounting.journalEntries.form.entryTypeLabel' | translate }}</label>
                <select formControlName="entryType" class="sw-input w-full">
                  @for (type of entryTypes; track type) {
                    <option [ngValue]="type">{{ getEntryTypeLabel(type) }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="sw-label">{{ 'accounting.journalEntries.form.referenceLabel' | translate }}</label>
                <input type="text" formControlName="reference" class="sw-input w-full" [placeholder]="'accounting.journalEntries.form.referencePlaceholder' | translate">
              </div>
            </div>
            <div class="mt-4 form-field" [class.form-field-error]="hasError('description')">
              <label class="sw-label" for="description">{{ 'accounting.journalEntries.form.descriptionLabel' | translate }}</label>
              <input type="text"
                     id="description"
                     formControlName="description"
                     class="sw-input w-full"
                     [placeholder]="'accounting.journalEntries.form.descriptionPlaceholder' | translate"
                     [attr.aria-invalid]="hasError('description')"
                     [attr.aria-describedby]="hasError('description') ? 'description-error' : null">
              @if (hasError('description')) {
                <p id="description-error" class="text-sm text-red-500 mt-1 flex items-center gap-1" role="alert">
                  <span class="material-icons text-sm" aria-hidden="true">error</span>
                  {{ 'accounting.journalEntries.form.descriptionRequiredError' | translate }}
                </p>
              }
            </div>
            <div class="mt-4">
              <label class="sw-label">{{ 'accounting.journalEntries.form.notesLabel' | translate }}</label>
              <textarea formControlName="notes" rows="2" class="sw-input w-full" [placeholder]="'accounting.journalEntries.form.notesPlaceholder' | translate"></textarea>
            </div>
          </div>

          <!-- Journal Lines -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
            <div class="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-dark-border">
              <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ 'accounting.journalEntries.form.journalLinesTitle' | translate }}</h3>
              <button type="button" (click)="addLine()" class="sw-btn sw-btn-outline sw-btn-sm">
                <span class="material-icons text-lg">add</span>
                {{ 'accounting.journalEntries.form.addLineButton' | translate }}
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="sw-table">
                <thead>
                  <tr>
                    <th class="w-[300px]">{{ 'accounting.journalEntries.form.accountColumnHeader' | translate }}</th>
                    <th>{{ 'accounting.journalEntries.form.descriptionColumnHeader' | translate }}</th>
                    <th class="w-[150px] text-right">{{ 'accounting.journalEntries.form.debitColumnHeader' | translate }}</th>
                    <th class="w-[150px] text-right">{{ 'accounting.journalEntries.form.creditColumnHeader' | translate }}</th>
                    <th class="w-[50px]"></th>
                  </tr>
                </thead>
                <tbody formArrayName="lines">
                  @for (line of linesArray.controls; track $index; let i = $index) {
                    <tr [formGroupName]="i">
                      <td>
                        <select formControlName="accountId" class="sw-input w-full text-sm">
                          <option [ngValue]="null">{{ 'accounting.journalEntries.form.selectAccountPlaceholder' | translate }}</option>
                          @for (account of postableAccounts(); track account.id) {
                            <option [ngValue]="account.id">{{ account.accountCode }} - {{ account.accountName }}</option>
                          }
                        </select>
                      </td>
                      <td>
                        <input type="text" formControlName="description" class="sw-input w-full text-sm" [placeholder]="'accounting.journalEntries.form.lineDescriptionPlaceholder' | translate">
                      </td>
                      <td>
                        <input type="number" formControlName="debitAmount" class="sw-input w-full text-right text-sm font-mono" placeholder="0.00" step="0.01" min="0" (input)="onDebitChange(i)">
                      </td>
                      <td>
                        <input type="number" formControlName="creditAmount" class="sw-input w-full text-right text-sm font-mono" placeholder="0.00" step="0.01" min="0" (input)="onCreditChange(i)">
                      </td>
                      <td>
                        @if (linesArray.length > 2) {
                          <button type="button" (click)="removeLine(i)" class="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                            <span class="material-icons text-lg">close</span>
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
                <tfoot>
                  <tr class="bg-neutral-50 dark:bg-dark-elevated font-semibold">
                    <td colspan="2" class="text-right">{{ 'accounting.journalEntries.form.totalsLabel' | translate }}</td>
                    <td class="text-right font-mono">{{ totalDebit() | currency:'ZAR':'symbol':'1.2-2' }}</td>
                    <td class="text-right font-mono">{{ totalCredit() | currency:'ZAR':'symbol':'1.2-2' }}</td>
                    <td></td>
                  </tr>
                  <tr class="font-semibold">
                    <td colspan="2" class="text-right">{{ 'accounting.journalEntries.form.differenceLabel' | translate }}</td>
                    <td colspan="2" class="text-center">
                      @if (isBalanced()) {
                        <span class="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                          <span class="material-icons text-lg">check_circle</span>
                          {{ 'accounting.journalEntries.form.balancedStatus' | translate }}
                        </span>
                      } @else {
                        <span class="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                          <span class="material-icons text-lg">error</span>
                          {{ difference() | currency:'ZAR':'symbol':'1.2-2' }}
                        </span>
                      }
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            @if (!isBalanced()) {
              <div role="alert"
                   aria-live="polite"
                   class="p-4 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
                <p class="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                  <span class="material-icons text-lg" aria-hidden="true">warning</span>
                  {{ 'accounting.journalEntries.form.balanceWarning' | translate }}
                </p>
              </div>
            }
          </div>

          <!-- Actions -->
          <div class="flex justify-between items-center">
            <button type="button" (click)="autoBalance()" [disabled]="isBalanced()" class="sw-btn sw-btn-outline sw-btn-md">
              <span class="material-icons text-lg">auto_fix_high</span>
              {{ 'accounting.journalEntries.form.autoBalanceButton' | translate }}
            </button>
            <div class="flex gap-3">
              <a routerLink="/accounting/journals" class="sw-btn sw-btn-outline sw-btn-md">{{ 'common.cancelButton' | translate }}</a>
              <button type="submit"
                      [disabled]="form.invalid || !isBalanced() || saving()"
                      [attr.title]="getSubmitButtonTitle()"
                      class="sw-btn sw-btn-primary sw-btn-md">
                @if (saving()) {
                  <sw-spinner size="sm" />
                }
                {{ isEdit ? ('accounting.journalEntries.form.updateEntryButton' | translate) : ('accounting.journalEntries.form.createEntryButton' | translate) }}
              </button>
            </div>
          </div>
        </form>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JournalEntryFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly accountingService = inject(AccountingService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);

  readonly entryTypes: JournalEntryType[] = ['MANUAL', 'ADJUSTMENT', 'TRANSFER', 'OPENING', 'CLOSING'];

  typeLabelMap: Record<JournalEntryType, string> = {
    MANUAL: '',
    SYSTEM: '',
    PAYROLL: '',
    INVOICE: '',
    BILL: '',
    PAYMENT: '',
    RECEIPT: '',
    TRANSFER: '',
    ADJUSTMENT: '',
    CLOSING: '',
    OPENING: '',
    REVERSAL: ''
  };

  form!: FormGroup;
  postableAccounts = signal<Account[]>([]);
  loading = signal(true);
  saving = signal(false);

  isEdit = false;
  entryId?: string;

  totalDebit = computed(() => {
    const lines = this.form?.get('lines')?.value || [];
    return lines.reduce((sum: number, line: any) => sum + (parseFloat(line.debitAmount) || 0), 0);
  });

  totalCredit = computed(() => {
    const lines = this.form?.get('lines')?.value || [];
    return lines.reduce((sum: number, line: any) => sum + (parseFloat(line.creditAmount) || 0), 0);
  });

  difference = computed(() => Math.abs(this.totalDebit() - this.totalCredit()));

  isBalanced = computed(() => Math.abs(this.totalDebit() - this.totalCredit()) < 0.01 && this.totalDebit() > 0);

  get linesArray(): FormArray {
    return this.form.get('lines') as FormArray;
  }

  ngOnInit(): void {
    this.initForm();
    this.loadAccounts();
    this.initializeEntryTypeLabels();

    // Check if editing
    this.entryId = this.route.snapshot.params['id'];
    if (this.entryId && this.route.snapshot.url.some(s => s.path === 'edit')) {
      this.isEdit = true;
      this.loadEntry();
    } else {
      this.loading.set(false);
    }
  }

  private initializeEntryTypeLabels(): void {
    const typeKeys: JournalEntryType[] = ['MANUAL', 'SYSTEM', 'PAYROLL', 'INVOICE', 'BILL', 'PAYMENT', 'RECEIPT', 'TRANSFER', 'ADJUSTMENT', 'CLOSING', 'OPENING', 'REVERSAL'];
    typeKeys.forEach(type => {
      this.typeLabelMap[type] = this.translate.instant(`accounting.journalEntries.form.entryType.${type.toLowerCase()}`);
    });
  }

  private initForm(): void {
    this.form = this.fb.group({
      transactionDate: [this.getTodayDate(), Validators.required],
      description: ['', Validators.required],
      reference: [''],
      entryType: ['MANUAL' as JournalEntryType, Validators.required],
      notes: [''],
      lines: this.fb.array([
        this.createLineGroup(),
        this.createLineGroup()
      ])
    });
  }

  private createLineGroup(): FormGroup {
    return this.fb.group({
      accountId: [null, Validators.required],
      description: [''],
      debitAmount: [null],
      creditAmount: [null],
      costCenter: [''],
      department: [''],
      project: ['']
    });
  }

  private loadAccounts(): void {
    this.accountingService.getPostableAccounts().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (accounts) => {
        // Sort by account code
        accounts.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
        this.postableAccounts.set(accounts);
      },
      error: (err) => {
        console.error('Failed to load accounts', err);
        this.toast.error(this.translate.instant('accounting.journalEntries.form.loadAccountsError'));
      }
    });
  }

  private loadEntry(): void {
    this.accountingService.getJournalEntry(this.entryId!).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (entry) => {
        if (entry.status !== 'DRAFT') {
          this.toast.error(this.translate.instant('accounting.journalEntries.form.draftOnlyError'));
          this.router.navigate(['/accounting/journals', entry.id]);
          return;
        }

        // Populate form
        this.form.patchValue({
          transactionDate: entry.transactionDate,
          description: entry.description,
          reference: entry.reference || '',
          entryType: entry.entryType,
          notes: entry.notes || ''
        });

        // Clear existing lines and add from entry
        this.linesArray.clear();
        for (const line of entry.lines) {
          const lineGroup = this.createLineGroup();
          lineGroup.patchValue({
            accountId: line.accountId,
            description: line.description || '',
            debitAmount: line.debitAmount || null,
            creditAmount: line.creditAmount || null
          });
          this.linesArray.push(lineGroup);
        }

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load entry', err);
        this.toast.error(this.translate.instant('accounting.journalEntries.form.loadEntryError'));
        this.router.navigate(['/accounting/journals']);
      }
    });
  }

  addLine(): void {
    this.linesArray.push(this.createLineGroup());
  }

  removeLine(index: number): void {
    if (this.linesArray.length > 2) {
      this.linesArray.removeAt(index);
    }
  }

  onDebitChange(index: number): void {
    const line = this.linesArray.at(index);
    if (line.get('debitAmount')?.value) {
      line.get('creditAmount')?.setValue(null);
    }
  }

  onCreditChange(index: number): void {
    const line = this.linesArray.at(index);
    if (line.get('creditAmount')?.value) {
      line.get('debitAmount')?.setValue(null);
    }
  }

  autoBalance(): void {
    const diff = this.totalDebit() - this.totalCredit();
    if (Math.abs(diff) < 0.01) return;

    // Find last line without amount and add the difference
    for (let i = this.linesArray.length - 1; i >= 0; i--) {
      const line = this.linesArray.at(i);
      const debit = parseFloat(line.get('debitAmount')?.value) || 0;
      const credit = parseFloat(line.get('creditAmount')?.value) || 0;

      if (debit === 0 && credit === 0) {
        if (diff > 0) {
          line.get('creditAmount')?.setValue(diff.toFixed(2));
        } else {
          line.get('debitAmount')?.setValue(Math.abs(diff).toFixed(2));
        }
        return;
      }
    }

    // If no empty line, add a new one
    const newLine = this.createLineGroup();
    if (diff > 0) {
      newLine.get('creditAmount')?.setValue(diff.toFixed(2));
    } else {
      newLine.get('debitAmount')?.setValue(Math.abs(diff).toFixed(2));
    }
    this.linesArray.push(newLine);
  }

  onSubmit(): void {
    if (this.form.invalid || !this.isBalanced()) return;

    this.saving.set(true);
    const values = this.form.value;

    const lines: JournalEntryLineRequest[] = values.lines
      .filter((line: any) => line.accountId && (line.debitAmount || line.creditAmount))
      .map((line: any) => ({
        accountId: line.accountId,
        description: line.description || undefined,
        debitAmount: line.debitAmount ? parseFloat(line.debitAmount) : undefined,
        creditAmount: line.creditAmount ? parseFloat(line.creditAmount) : undefined,
        costCenter: line.costCenter || undefined,
        department: line.department || undefined,
        project: line.project || undefined
      }));

    const request: CreateJournalEntryRequest = {
      transactionDate: values.transactionDate,
      description: values.description,
      reference: values.reference || undefined,
      entryType: values.entryType,
      notes: values.notes || undefined,
      lines
    };

    // For edit, we'd need an update endpoint. For now, just create.
    this.accountingService.createJournalEntry(request).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (entry) => {
        this.toast.success(
          this.translate.instant(
            this.isEdit
              ? 'accounting.journalEntries.form.entryUpdatedSuccess'
              : 'accounting.journalEntries.form.entryCreatedSuccess'
          )
        );
        this.router.navigate(['/accounting/journals', entry.id]);
      },
      error: (err) => {
        console.error('Failed to save entry', err);
        this.toast.error(this.translate.instant('accounting.journalEntries.form.saveEntryError'));
        this.saving.set(false);
      }
    });
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  hasError(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field?.touched && field?.errors);
  }

  getSubmitButtonTitle(): string {
    if (this.saving()) return this.translate.instant('common.savingMessage');
    if (this.form.invalid) return this.translate.instant('accounting.journalEntries.form.requiredFieldsError');
    if (!this.isBalanced()) return this.translate.instant('accounting.journalEntries.form.balanceRequiredError');
    return '';
  }

  getEntryTypeLabel(type: JournalEntryType): string {
    return this.typeLabelMap[type] || type;
  }
}
