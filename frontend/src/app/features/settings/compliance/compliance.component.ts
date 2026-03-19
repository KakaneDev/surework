import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SettingsService } from '../../../core/services/settings.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-compliance-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-2xl">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">SARS Compliance</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
        These details are required for payroll, VAT reporting, and accounting features.
      </p>

      <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tax Number *
          </label>
          <input formControlName="taxNumber" type="text"
                 placeholder="1234567890"
                 class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          <p class="text-xs text-gray-400 mt-1">10-digit SARS tax number</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            VAT Number
          </label>
          <input formControlName="vatNumber" type="text"
                 placeholder="4123456789"
                 class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          <p class="text-xs text-gray-400 mt-1">Optional — 10 digits starting with 4</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            UIF Reference *
          </label>
          <input formControlName="uifReference" type="text"
                 placeholder="U12345678"
                 class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          <p class="text-xs text-gray-400 mt-1">U followed by 8 digits</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            SDL Number *
          </label>
          <input formControlName="sdlNumber" type="text"
                 placeholder="L12345678"
                 class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          <p class="text-xs text-gray-400 mt-1">L followed by 8 digits</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            PAYE Reference *
          </label>
          <input formControlName="payeReference" type="text"
                 placeholder="1234567/123/1234"
                 class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          <p class="text-xs text-gray-400 mt-1">Format: NNNNNNN/NNN/NNNN</p>
        </div>

        <div class="pt-4">
          <button type="submit"
                  [disabled]="form.invalid || saving()"
                  class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold
                         rounded-lg disabled:opacity-50 transition-colors">
            {{ saving() ? 'Saving...' : 'Save compliance details' }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class ComplianceComponent implements OnInit {
  private fb = inject(FormBuilder);
  private settingsService = inject(SettingsService);
  private authService = inject(AuthService);

  saving = signal(false);

  form = this.fb.group({
    taxNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    vatNumber: ['', [Validators.pattern(/^4\d{9}$/)]],
    uifReference: ['', [Validators.required, Validators.pattern(/^U\d{8}$/)]],
    sdlNumber: ['', [Validators.required, Validators.pattern(/^L\d{8}$/)]],
    payeReference: ['', [Validators.required, Validators.pattern(/^\d{7}\/\d{3}\/\d{4}$/)]]
  });

  ngOnInit() {
    this.settingsService.getComplianceDetails().subscribe({
      next: (data) => {
        if (data) this.form.patchValue(data);
      },
      error: () => {} // Silently handle if no data yet
    });
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);

    this.settingsService.saveComplianceDetails(this.form.getRawValue()).subscribe({
      next: () => {
        this.saving.set(false);
        this.authService.refreshSetupStatus().subscribe();
      },
      error: () => this.saving.set(false)
    });
  }
}
