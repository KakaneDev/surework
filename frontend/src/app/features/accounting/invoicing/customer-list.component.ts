import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InvoiceService, CustomerResponse, CreateCustomerRequest, UpdateCustomerRequest } from '../../../core/services/invoice.service';
import { SpinnerComponent } from '@shared/ui';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    TranslateModule,
    SpinnerComponent,
    CurrencyPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="sw-page-header">
        <div class="flex items-center gap-3">
          <a routerLink="/accounting/invoicing" class="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300">
            <span class="material-icons">arrow_back</span>
          </a>
          <div>
            <h1 class="sw-page-title">{{ 'accounting.invoicing.customers.title' | translate }}</h1>
            <p class="sw-page-description">{{ 'accounting.invoicing.customers.description' | translate }}</p>
          </div>
        </div>
        <button (click)="openCreateDialog()" class="sw-btn sw-btn-primary sw-btn-md">
          <span class="material-icons text-lg">add</span>
          {{ 'accounting.invoicing.customers.newCustomer' | translate }}
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
        <div class="flex gap-4 items-end">
          <div class="flex-1">
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.customers.search' | translate }}</label>
            <input type="text"
                   [(ngModel)]="searchTerm"
                   (ngModelChange)="onSearchChange()"
                   [placeholder]="'accounting.invoicing.customers.searchPlaceholder' | translate"
                   class="sw-input w-full">
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" [(ngModel)]="activeOnly" (ngModelChange)="loadCustomers()" id="activeOnly" class="rounded border-neutral-300">
            <label for="activeOnly" class="text-sm text-neutral-700 dark:text-neutral-300">{{ 'accounting.invoicing.customers.activeOnly' | translate }}</label>
          </div>
        </div>
      </div>

      <!-- Customer List -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border">
        @if (loading()) {
          <div class="flex justify-center items-center py-24">
            <sw-spinner size="lg" />
          </div>
        } @else if (customers().length > 0) {
          <div class="overflow-x-auto">
            <table class="sw-table">
              <thead>
                <tr>
                  <th>{{ 'accounting.invoicing.customers.code' | translate }}</th>
                  <th>{{ 'accounting.invoicing.customers.customerName' | translate }}</th>
                  <th>{{ 'accounting.invoicing.customers.email' | translate }}</th>
                  <th>{{ 'accounting.invoicing.customers.phone' | translate }}</th>
                  <th>{{ 'accounting.invoicing.customers.paymentTerms' | translate }}</th>
                  <th>{{ 'accounting.invoicing.customers.status' | translate }}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (customer of customers(); track customer.id) {
                  <tr class="hover:bg-neutral-50 dark:hover:bg-dark-elevated">
                    <td class="font-mono text-sm">{{ customer.customerCode }}</td>
                    <td>
                      <div>
                        <p class="font-medium text-neutral-800 dark:text-neutral-200">{{ customer.customerName }}</p>
                        @if (customer.tradingName && customer.tradingName !== customer.customerName) {
                          <p class="text-xs text-neutral-500">t/a {{ customer.tradingName }}</p>
                        }
                      </div>
                    </td>
                    <td class="text-sm text-neutral-600 dark:text-neutral-400">{{ customer.email || '-' }}</td>
                    <td class="text-sm text-neutral-600 dark:text-neutral-400">{{ customer.phone || customer.mobile || '-' }}</td>
                    <td class="text-sm text-neutral-600 dark:text-neutral-400">{{ customer.paymentTerms }} days</td>
                    <td>
                      <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full"
                            [class]="customer.active ? 'text-green-600 bg-green-100' : 'text-neutral-500 bg-neutral-200'">
                        {{ customer.active ? ('accounting.invoicing.customers.active' | translate) : ('accounting.invoicing.customers.inactive' | translate) }}
                      </span>
                    </td>
                    <td class="text-right">
                      <div class="flex items-center justify-end gap-2">
                        <button (click)="viewInvoices(customer)" class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300" [title]="'accounting.invoicing.customers.viewInvoices' | translate">
                          <span class="material-icons text-lg">receipt</span>
                        </button>
                        <button (click)="openEditDialog(customer)" class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300" [title]="'accounting.invoicing.customers.edit' | translate">
                          <span class="material-icons text-lg">edit</span>
                        </button>
                        <button (click)="toggleStatus(customer)" class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300" [title]="customer.active ? ('accounting.invoicing.customers.deactivate' | translate) : ('accounting.invoicing.customers.activate' | translate)">
                          <span class="material-icons text-lg">{{ customer.active ? 'toggle_on' : 'toggle_off' }}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="p-4 border-t border-neutral-200 dark:border-dark-border flex items-center justify-between">
              <p class="text-sm text-neutral-600 dark:text-neutral-400">
                {{ 'accounting.invoicing.customers.showing' | translate: { from: (currentPage() * pageSize) + 1, to: Math.min((currentPage() + 1) * pageSize, totalElements()), total: totalElements() } }}
              </p>
              <div class="flex gap-2">
                <button (click)="goToPage(currentPage() - 1)"
                        [disabled]="currentPage() === 0"
                        class="sw-btn sw-btn-outline sw-btn-sm"
                        [class.opacity-50]="currentPage() === 0">
                  <span class="material-icons text-sm">chevron_left</span>
                </button>
                <button (click)="goToPage(currentPage() + 1)"
                        [disabled]="currentPage() >= totalPages() - 1"
                        class="sw-btn sw-btn-outline sw-btn-sm"
                        [class.opacity-50]="currentPage() >= totalPages() - 1">
                  <span class="material-icons text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          }
        } @else {
          <div class="p-12 text-center">
            <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">people</span>
            <p class="text-neutral-500 dark:text-neutral-400 mb-4">{{ 'accounting.invoicing.customers.noCustomersFound' | translate }}</p>
            <button (click)="openCreateDialog()" class="sw-btn sw-btn-primary sw-btn-md">
              <span class="material-icons text-lg">add</span>
              {{ 'accounting.invoicing.customers.addFirstCustomer' | translate }}
            </button>
          </div>
        }
      </div>

      <!-- Create/Edit Customer Dialog -->
      @if (showDialog) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8" (click)="showDialog = false">
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-xl max-w-2xl w-full mx-4 my-auto" (click)="$event.stopPropagation()">
            <div class="p-6 border-b border-neutral-200 dark:border-dark-border">
              <h2 class="text-xl font-semibold text-neutral-900 dark:text-white">
                {{ editingCustomer ? ('accounting.invoicing.customers.editCustomer' | translate) : ('accounting.invoicing.customers.newCustomerDialog' | translate) }}
              </h2>
            </div>
            <div class="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              <!-- Basic Info -->
              <div class="space-y-4">
                <h3 class="text-sm font-semibold text-neutral-500 uppercase">{{ 'accounting.invoicing.customers.basicInformation' | translate }}</h3>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.customers.customerCode' | translate }}</label>
                    <input type="text" [(ngModel)]="customerForm.customerCode" [disabled]="!!editingCustomer" class="sw-input w-full" [placeholder]="'accounting.invoicing.customers.customerCodePlaceholder' | translate">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.customers.customerNameLabel' | translate }}</label>
                    <input type="text" [(ngModel)]="customerForm.customerName" class="sw-input w-full" [placeholder]="'accounting.invoicing.customers.customerNamePlaceholder' | translate">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.customers.tradingName' | translate }}</label>
                    <input type="text" [(ngModel)]="customerForm.tradingName" class="sw-input w-full" [placeholder]="'accounting.invoicing.customers.tradingNamePlaceholder' | translate">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.customers.vatNumber' | translate }}</label>
                    <input type="text" [(ngModel)]="customerForm.vatNumber" class="sw-input w-full" [placeholder]="'accounting.invoicing.customers.vatNumberPlaceholder' | translate">
                  </div>
                </div>
              </div>

              <!-- Contact Info -->
              <div class="space-y-4">
                <h3 class="text-sm font-semibold text-neutral-500 uppercase">{{ 'accounting.invoicing.customers.contactInformation' | translate }}</h3>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.customers.email' | translate }}</label>
                    <input type="email" [(ngModel)]="customerForm.email" class="sw-input w-full" [placeholder]="'accounting.invoicing.customers.emailPlaceholder' | translate">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.customers.phone' | translate }}</label>
                    <input type="tel" [(ngModel)]="customerForm.phone" class="sw-input w-full" [placeholder]="'accounting.invoicing.customers.phonePlaceholder' | translate">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.customers.mobile' | translate }}</label>
                    <input type="tel" [(ngModel)]="customerForm.mobile" class="sw-input w-full" [placeholder]="'accounting.invoicing.customers.mobilePlaceholder' | translate">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.customers.contactPerson' | translate }}</label>
                    <input type="text" [(ngModel)]="customerForm.contactPerson" class="sw-input w-full" [placeholder]="'accounting.invoicing.customers.contactPersonPlaceholder' | translate">
                  </div>
                </div>
              </div>

              <!-- Address -->
              <div class="space-y-4">
                <h3 class="text-sm font-semibold text-neutral-500 uppercase">{{ 'accounting.invoicing.customers.address' | translate }}</h3>
                <div class="grid grid-cols-2 gap-4">
                  <div class="col-span-2">
                    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.customers.addressLine1' | translate }}</label>
                    <input type="text" [(ngModel)]="customerForm.addressLine1" class="sw-input w-full" [placeholder]="'accounting.invoicing.customers.addressLine1Placeholder' | translate">
                  </div>
                  <div class="col-span-2">
                    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.customers.addressLine2' | translate }}</label>
                    <input type="text" [(ngModel)]="customerForm.addressLine2" class="sw-input w-full" [placeholder]="'accounting.invoicing.customers.addressLine2Placeholder' | translate">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.customers.city' | translate }}</label>
                    <input type="text" [(ngModel)]="customerForm.city" class="sw-input w-full" [placeholder]="'accounting.invoicing.customers.cityPlaceholder' | translate">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.customers.province' | translate }}</label>
                    <select [(ngModel)]="customerForm.province" class="sw-select w-full">
                      <option value="">{{ 'accounting.invoicing.customers.selectProvince' | translate }}</option>
                      <option value="Gauteng">{{ 'accounting.invoicing.customers.gauteng' | translate }}</option>
                      <option value="Western Cape">{{ 'accounting.invoicing.customers.westernCape' | translate }}</option>
                      <option value="KwaZulu-Natal">{{ 'accounting.invoicing.customers.kwazuluNatal' | translate }}</option>
                      <option value="Eastern Cape">{{ 'accounting.invoicing.customers.easternCape' | translate }}</option>
                      <option value="Free State">{{ 'accounting.invoicing.customers.freeState' | translate }}</option>
                      <option value="Limpopo">{{ 'accounting.invoicing.customers.limpopo' | translate }}</option>
                      <option value="Mpumalanga">{{ 'accounting.invoicing.customers.mpumalanga' | translate }}</option>
                      <option value="North West">{{ 'accounting.invoicing.customers.northWest' | translate }}</option>
                      <option value="Northern Cape">{{ 'accounting.invoicing.customers.northernCape' | translate }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.customers.postalCode' | translate }}</label>
                    <input type="text" [(ngModel)]="customerForm.postalCode" class="sw-input w-full" [placeholder]="'accounting.invoicing.customers.postalCodePlaceholder' | translate">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.customers.country' | translate }}</label>
                    <input type="text" [(ngModel)]="customerForm.country" class="sw-input w-full" [placeholder]="'accounting.invoicing.customers.countryPlaceholder' | translate" value="South Africa">
                  </div>
                </div>
              </div>

              <!-- Payment Terms -->
              <div class="space-y-4">
                <h3 class="text-sm font-semibold text-neutral-500 uppercase">{{ 'accounting.invoicing.customers.paymentTermsSection' | translate }}</h3>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.customers.paymentTermsDays' | translate }}</label>
                    <input type="number" [(ngModel)]="customerForm.paymentTerms" min="0" class="sw-input w-full" [placeholder]="'accounting.invoicing.customers.paymentTermsPlaceholder' | translate">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.customers.creditLimit' | translate }}</label>
                    <input type="number" [(ngModel)]="customerForm.creditLimit" min="0" step="1000" class="sw-input w-full" [placeholder]="'accounting.invoicing.customers.creditLimitPlaceholder' | translate">
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <input type="checkbox" [(ngModel)]="customerForm.taxExempt" id="taxExempt" class="rounded border-neutral-300">
                  <label for="taxExempt" class="text-sm text-neutral-700 dark:text-neutral-300">{{ 'accounting.invoicing.customers.taxExempt' | translate }}</label>
                </div>
              </div>

              <!-- Notes -->
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.customers.notes' | translate }}</label>
                <textarea [(ngModel)]="customerForm.notes" rows="2" class="sw-input w-full" [placeholder]="'accounting.invoicing.customers.notesPlaceholder' | translate"></textarea>
              </div>
            </div>
            <div class="p-6 border-t border-neutral-200 dark:border-dark-border flex justify-end gap-3">
              <button (click)="showDialog = false" class="sw-btn sw-btn-outline sw-btn-md">{{ 'accounting.invoicing.customers.cancel' | translate }}</button>
              <button (click)="saveCustomer()" [disabled]="!customerForm.customerCode || !customerForm.customerName || saving()" class="sw-btn sw-btn-primary sw-btn-md">
                @if (saving()) {
                  <sw-spinner size="sm" />
                }
                {{ editingCustomer ? ('accounting.invoicing.customers.saveChanges' | translate) : ('accounting.invoicing.customers.createCustomer' | translate) }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class CustomerListComponent implements OnInit {
  private readonly invoiceService = inject(InvoiceService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);

  Math = Math;

  loading = signal(true);
  saving = signal(false);
  customers = signal<CustomerResponse[]>([]);
  currentPage = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  pageSize = 20;

  searchTerm = '';
  activeOnly = false;
  showDialog = false;
  editingCustomer: CustomerResponse | null = null;

  private searchDebounce: ReturnType<typeof setTimeout> | null = null;

  customerForm: Partial<CreateCustomerRequest & UpdateCustomerRequest> = this.getEmptyForm();

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading.set(true);
    this.invoiceService.searchCustomers(
      this.currentPage(),
      this.pageSize,
      this.searchTerm || undefined,
      this.activeOnly
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.customers.set(response.content);
          this.totalPages.set(response.totalPages);
          this.totalElements.set(response.totalElements);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load customers', err);
          this.loading.set(false);
        }
      });
  }

  onSearchChange(): void {
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }
    this.searchDebounce = setTimeout(() => {
      this.currentPage.set(0);
      this.loadCustomers();
    }, 300);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadCustomers();
    }
  }

  openCreateDialog(): void {
    this.editingCustomer = null;
    this.customerForm = this.getEmptyForm();
    this.showDialog = true;
  }

  openEditDialog(customer: CustomerResponse): void {
    this.editingCustomer = customer;
    this.customerForm = {
      customerCode: customer.customerCode,
      customerName: customer.customerName,
      tradingName: customer.tradingName,
      email: customer.email,
      phone: customer.phone,
      mobile: customer.mobile,
      contactPerson: customer.contactPerson,
      contactEmail: customer.contactEmail,
      addressLine1: customer.addressLine1,
      addressLine2: customer.addressLine2,
      city: customer.city,
      province: customer.province,
      postalCode: customer.postalCode,
      country: customer.country || 'South Africa',
      vatNumber: customer.vatNumber,
      taxExempt: customer.taxExempt,
      paymentTerms: customer.paymentTerms,
      creditLimit: customer.creditLimit,
      notes: customer.notes
    };
    this.showDialog = true;
  }

  saveCustomer(): void {
    if (!this.customerForm.customerCode || !this.customerForm.customerName) return;

    this.saving.set(true);

    if (this.editingCustomer) {
      const request: UpdateCustomerRequest = {
        customerName: this.customerForm.customerName,
        tradingName: this.customerForm.tradingName,
        email: this.customerForm.email,
        phone: this.customerForm.phone,
        mobile: this.customerForm.mobile,
        contactPerson: this.customerForm.contactPerson,
        contactEmail: this.customerForm.contactEmail,
        addressLine1: this.customerForm.addressLine1,
        addressLine2: this.customerForm.addressLine2,
        city: this.customerForm.city,
        province: this.customerForm.province,
        postalCode: this.customerForm.postalCode,
        country: this.customerForm.country,
        vatNumber: this.customerForm.vatNumber,
        taxExempt: this.customerForm.taxExempt,
        paymentTerms: this.customerForm.paymentTerms,
        creditLimit: this.customerForm.creditLimit,
        notes: this.customerForm.notes
      };

      this.invoiceService.updateCustomer(this.editingCustomer.id, request)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.showDialog = false;
            this.saving.set(false);
            this.loadCustomers();
          },
          error: (err) => {
            console.error('Failed to update customer', err);
            this.saving.set(false);
          }
        });
    } else {
      const request: CreateCustomerRequest = {
        customerCode: this.customerForm.customerCode!,
        customerName: this.customerForm.customerName!,
        tradingName: this.customerForm.tradingName,
        email: this.customerForm.email,
        phone: this.customerForm.phone,
        mobile: this.customerForm.mobile,
        contactPerson: this.customerForm.contactPerson,
        contactEmail: this.customerForm.contactEmail,
        addressLine1: this.customerForm.addressLine1,
        addressLine2: this.customerForm.addressLine2,
        city: this.customerForm.city,
        province: this.customerForm.province,
        postalCode: this.customerForm.postalCode,
        country: this.customerForm.country || 'South Africa',
        vatNumber: this.customerForm.vatNumber,
        taxExempt: this.customerForm.taxExempt || false,
        paymentTerms: this.customerForm.paymentTerms || 30,
        creditLimit: this.customerForm.creditLimit,
        notes: this.customerForm.notes
      };

      this.invoiceService.createCustomer(request)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.showDialog = false;
            this.saving.set(false);
            this.loadCustomers();
          },
          error: (err) => {
            console.error('Failed to create customer', err);
            this.saving.set(false);
          }
        });
    }
  }

  toggleStatus(customer: CustomerResponse): void {
    const operation = customer.active
      ? this.invoiceService.deactivateCustomer(customer.id)
      : this.invoiceService.activateCustomer(customer.id);

    operation
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadCustomers(),
        error: (err) => console.error('Failed to toggle customer status', err)
      });
  }

  viewInvoices(customer: CustomerResponse): void {
    this.router.navigate(['/accounting/invoicing/list'], {
      queryParams: { customerId: customer.id }
    });
  }

  private getEmptyForm(): Partial<CreateCustomerRequest & UpdateCustomerRequest> {
    return {
      customerCode: '',
      customerName: '',
      tradingName: '',
      email: '',
      phone: '',
      mobile: '',
      contactPerson: '',
      contactEmail: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      province: '',
      postalCode: '',
      country: 'South Africa',
      vatNumber: '',
      taxExempt: false,
      paymentTerms: 30,
      creditLimit: undefined,
      notes: ''
    };
  }
}
