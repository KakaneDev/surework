import { Component, OnInit, inject, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BillingService } from '@core/services/billing.service';
import { Discount, CreateDiscountRequest, DiscountType } from '@core/models/billing.model';
import { ButtonComponent } from '@core/components/ui/button.component';
import { CardComponent } from '@core/components/ui/card.component';
import { InputComponent } from '@core/components/ui/input.component';
import { SelectComponent, SelectOption } from '@core/components/ui/select.component';

@Component({
  selector: 'app-discount-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ButtonComponent, CardComponent, InputComponent, SelectComponent],
  template: `
    <div class="max-w-2xl mx-auto space-y-6">
      <div>
        <nav class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
          <a routerLink="/discounts" class="hover:text-primary-600">Discounts</a>
          <span>/</span>
          <span class="text-gray-800 dark:text-white">{{ isEdit ? 'Edit' : 'Create' }} Discount</span>
        </nav>
        <h1 class="text-2xl font-bold text-gray-800 dark:text-white">
          {{ isEdit ? 'Edit Discount Code' : 'Create Discount Code' }}
        </h1>
      </div>

      @if (error()) {
        <div class="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p class="text-sm text-red-600 dark:text-red-400">{{ error() }}</p>
        </div>
      }

      <app-card>
        <form (ngSubmit)="onSubmit()" #discountForm="ngForm" class="space-y-6">
          <div class="grid gap-4 sm:grid-cols-2">
            <app-input
              label="Discount Code"
              [(ngModel)]="formData.code"
              name="code"
              placeholder="e.g., WELCOME20"
              [required]="true"
              hint="Must be unique, alphanumeric only"
            />

            <app-select
              label="Discount Type"
              [options]="typeOptions"
              [(ngModel)]="formData.type"
              name="type"
              [required]="true"
            />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <app-input
              [label]="formData.type === 'PERCENTAGE' ? 'Percentage' : 'Amount (ZAR)'"
              type="number"
              [(ngModel)]="formData.value"
              name="value"
              [placeholder]="formData.type === 'PERCENTAGE' ? 'e.g., 20' : 'e.g., 500'"
              [required]="true"
            />

            <app-input
              label="Duration (months)"
              type="number"
              [(ngModel)]="formData.durationMonths"
              name="durationMonths"
              placeholder="Leave empty for forever"
              hint="How long the discount applies after activation"
            />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <app-input
              label="Valid From"
              type="date"
              [(ngModel)]="formData.validFrom"
              name="validFrom"
              [required]="true"
            />

            <app-input
              label="Valid Until"
              type="date"
              [(ngModel)]="formData.validUntil"
              name="validUntil"
              hint="Leave empty for no expiry"
            />
          </div>

          <app-input
            label="Maximum Uses"
            type="number"
            [(ngModel)]="formData.maxUses"
            name="maxUses"
            placeholder="Leave empty for unlimited"
            hint="Total number of times this code can be used"
          />

          <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <app-button variant="outline" type="button" routerLink="/discounts">
              Cancel
            </app-button>
            <app-button type="submit" [loading]="saving()">
              {{ isEdit ? 'Update' : 'Create' }} Discount
            </app-button>
          </div>
        </form>
      </app-card>
    </div>
  `
})
export class DiscountFormComponent implements OnInit {
  private billingService = inject(BillingService);
  private router = inject(Router);

  @Input() id?: string;

  saving = signal(false);
  error = signal<string | null>(null);
  isEdit = false;

  formData: CreateDiscountRequest = {
    code: '',
    type: 'PERCENTAGE',
    value: 0,
    validFrom: new Date().toISOString().split('T')[0]
  };

  typeOptions: SelectOption[] = [
    { label: 'Percentage', value: 'PERCENTAGE' },
    { label: 'Fixed Amount', value: 'FIXED_AMOUNT' }
  ];

  ngOnInit(): void {
    if (this.id) {
      this.isEdit = true;
      this.loadDiscount();
    }
  }

  loadDiscount(): void {
    this.billingService.getDiscountById(this.id!).subscribe({
      next: (discount) => {
        this.formData = {
          code: discount.code,
          type: discount.type,
          value: discount.value,
          durationMonths: discount.durationMonths,
          validFrom: discount.validFrom.split('T')[0],
          validUntil: discount.validUntil?.split('T')[0],
          maxUses: discount.maxUses
        };
      }
    });
  }

  onSubmit(): void {
    this.error.set(null);

    // Validate required fields
    if (!this.formData.code?.trim()) {
      this.error.set('Discount code is required');
      return;
    }

    // Ensure value is a number and valid
    const numValue = Number(this.formData.value);
    if (isNaN(numValue) || numValue <= 0) {
      this.error.set('Please enter a valid discount value greater than 0');
      return;
    }

    if (!this.formData.validFrom) {
      this.error.set('Valid from date is required');
      return;
    }

    this.saving.set(true);

    const request: CreateDiscountRequest = {
      ...this.formData,
      code: this.formData.code.toUpperCase().trim(),
      value: numValue,
      validFrom: new Date(this.formData.validFrom).toISOString(),
      validUntil: this.formData.validUntil ? new Date(this.formData.validUntil).toISOString() : undefined
    };

    const operation = this.isEdit
      ? this.billingService.updateDiscount(this.id!, request)
      : this.billingService.createDiscount(request);

    operation.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/discounts']);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message || 'Failed to save discount. Please try again.');
      }
    });
  }
}
