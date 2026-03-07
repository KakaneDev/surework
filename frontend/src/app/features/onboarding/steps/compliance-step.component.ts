import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent, FormFieldComponent, InputComponent } from '@shared/ui';

@Component({
  selector: 'app-compliance-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    ButtonComponent,
    FormFieldComponent,
    InputComponent
  ],
  template: `
    <div class="space-y-6" [formGroup]="form">
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {{ 'onboarding.compliance.title' | translate }}
        </h2>
        <p class="text-neutral-600 dark:text-neutral-400 mt-2">
          {{ 'onboarding.compliance.subtitle' | translate }}
        </p>
      </div>

      <!-- Info Banner -->
      <div class="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4" role="note">
        <div class="flex items-start gap-3">
          <span class="material-icons text-primary-500 mt-0.5" aria-hidden="true">info</span>
          <p class="text-sm text-primary-700 dark:text-primary-300">
            {{ 'onboarding.compliance.infoMessage' | translate }}
          </p>
        </div>
      </div>

      <!-- Tax Number -->
      <div>
        <label for="taxNumber" class="sw-label">
          {{ 'onboarding.compliance.taxNumber' | translate }} <span class="text-error-500" aria-hidden="true">*</span>
          <span class="sr-only">{{ 'common.required' | translate }}</span>
        </label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-neutral-400" aria-hidden="true">receipt_long</span>
          <input
            id="taxNumber"
            type="text"
            formControlName="taxNumber"
            [placeholder]="'onboarding.compliance.taxNumberPlaceholder' | translate"
            class="sw-input pl-10"
            [class.sw-input-error]="form.get('taxNumber')?.invalid && form.get('taxNumber')?.touched"
            [attr.aria-invalid]="form.get('taxNumber')?.invalid && form.get('taxNumber')?.touched"
            [attr.aria-describedby]="getTaxNumberDescribedBy()"
            aria-required="true"
            maxlength="10"
          />
        </div>
        @if (form.get('taxNumber')?.hasError('required') && form.get('taxNumber')?.touched) {
          <p id="taxNumber-error-required" class="sw-error-text" role="alert">{{ 'errors.requiredField' | translate }}</p>
        }
        @if (form.get('taxNumber')?.hasError('pattern') && form.get('taxNumber')?.touched) {
          <p id="taxNumber-error-pattern" class="sw-error-text" role="alert">{{ 'onboarding.compliance.taxNumberFormat' | translate }}</p>
        }
        <p id="taxNumber-hint" class="text-xs text-neutral-500 mt-1">{{ 'onboarding.compliance.taxNumberHint' | translate }}</p>
      </div>

      <!-- VAT Number -->
      <div>
        <label for="vatNumber" class="sw-label">
          {{ 'onboarding.compliance.vatNumber' | translate }}
        </label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-neutral-400" aria-hidden="true">account_balance</span>
          <input
            id="vatNumber"
            type="text"
            formControlName="vatNumber"
            [placeholder]="'onboarding.compliance.vatNumberPlaceholder' | translate"
            class="sw-input pl-10"
            [class.sw-input-error]="form.get('vatNumber')?.invalid && form.get('vatNumber')?.touched"
            [attr.aria-invalid]="form.get('vatNumber')?.invalid && form.get('vatNumber')?.touched"
            [attr.aria-describedby]="getVatNumberDescribedBy()"
            maxlength="10"
          />
        </div>
        @if (form.get('vatNumber')?.hasError('pattern') && form.get('vatNumber')?.touched) {
          <p id="vatNumber-error-pattern" class="sw-error-text" role="alert">{{ 'onboarding.compliance.vatNumberFormat' | translate }}</p>
        }
        <p id="vatNumber-hint" class="text-xs text-neutral-500 mt-1">{{ 'onboarding.compliance.vatNumberHint' | translate }}</p>
      </div>

      <!-- UIF Reference -->
      <div>
        <label for="uifReference" class="sw-label">
          {{ 'onboarding.compliance.uifReference' | translate }} <span class="text-error-500" aria-hidden="true">*</span>
          <span class="sr-only">{{ 'common.required' | translate }}</span>
        </label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-neutral-400" aria-hidden="true">people</span>
          <input
            id="uifReference"
            type="text"
            formControlName="uifReference"
            [placeholder]="'onboarding.compliance.uifReferencePlaceholder' | translate"
            class="sw-input pl-10"
            [class.sw-input-error]="form.get('uifReference')?.invalid && form.get('uifReference')?.touched"
            [attr.aria-invalid]="form.get('uifReference')?.invalid && form.get('uifReference')?.touched"
            [attr.aria-describedby]="getUifReferenceDescribedBy()"
            aria-required="true"
            maxlength="9"
          />
        </div>
        @if (form.get('uifReference')?.hasError('required') && form.get('uifReference')?.touched) {
          <p id="uifReference-error-required" class="sw-error-text" role="alert">{{ 'errors.requiredField' | translate }}</p>
        }
        @if (form.get('uifReference')?.hasError('pattern') && form.get('uifReference')?.touched) {
          <p id="uifReference-error-pattern" class="sw-error-text" role="alert">{{ 'onboarding.compliance.uifReferenceFormat' | translate }}</p>
        }
        <p id="uifReference-hint" class="text-xs text-neutral-500 mt-1">{{ 'onboarding.compliance.uifReferenceHint' | translate }}</p>
      </div>

      <!-- SDL Number -->
      <div>
        <label for="sdlNumber" class="sw-label">
          {{ 'onboarding.compliance.sdlNumber' | translate }} <span class="text-error-500" aria-hidden="true">*</span>
          <span class="sr-only">{{ 'common.required' | translate }}</span>
        </label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-neutral-400" aria-hidden="true">school</span>
          <input
            id="sdlNumber"
            type="text"
            formControlName="sdlNumber"
            [placeholder]="'onboarding.compliance.sdlNumberPlaceholder' | translate"
            class="sw-input pl-10"
            [class.sw-input-error]="form.get('sdlNumber')?.invalid && form.get('sdlNumber')?.touched"
            [attr.aria-invalid]="form.get('sdlNumber')?.invalid && form.get('sdlNumber')?.touched"
            [attr.aria-describedby]="getSdlNumberDescribedBy()"
            aria-required="true"
            maxlength="9"
          />
        </div>
        @if (form.get('sdlNumber')?.hasError('required') && form.get('sdlNumber')?.touched) {
          <p id="sdlNumber-error-required" class="sw-error-text" role="alert">{{ 'errors.requiredField' | translate }}</p>
        }
        @if (form.get('sdlNumber')?.hasError('pattern') && form.get('sdlNumber')?.touched) {
          <p id="sdlNumber-error-pattern" class="sw-error-text" role="alert">{{ 'onboarding.compliance.sdlNumberFormat' | translate }}</p>
        }
        <p id="sdlNumber-hint" class="text-xs text-neutral-500 mt-1">{{ 'onboarding.compliance.sdlNumberHint' | translate }}</p>
      </div>

      <!-- PAYE Reference -->
      <div>
        <label for="payeReference" class="sw-label">
          {{ 'onboarding.compliance.payeReference' | translate }} <span class="text-error-500" aria-hidden="true">*</span>
          <span class="sr-only">{{ 'common.required' | translate }}</span>
        </label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-neutral-400" aria-hidden="true">payments</span>
          <input
            id="payeReference"
            type="text"
            formControlName="payeReference"
            [placeholder]="'onboarding.compliance.payeReferencePlaceholder' | translate"
            class="sw-input pl-10"
            [class.sw-input-error]="form.get('payeReference')?.invalid && form.get('payeReference')?.touched"
            [attr.aria-invalid]="form.get('payeReference')?.invalid && form.get('payeReference')?.touched"
            [attr.aria-describedby]="getPayeReferenceDescribedBy()"
            aria-required="true"
            maxlength="16"
          />
        </div>
        @if (form.get('payeReference')?.hasError('required') && form.get('payeReference')?.touched) {
          <p id="payeReference-error-required" class="sw-error-text" role="alert">{{ 'errors.requiredField' | translate }}</p>
        }
        @if (form.get('payeReference')?.hasError('pattern') && form.get('payeReference')?.touched) {
          <p id="payeReference-error-pattern" class="sw-error-text" role="alert">{{ 'onboarding.compliance.payeReferenceFormat' | translate }}</p>
        }
        <p id="payeReference-hint" class="text-xs text-neutral-500 mt-1">{{ 'onboarding.compliance.payeReferenceHint' | translate }}</p>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComplianceStepComponent {
  @Input({ required: true }) form!: FormGroup;

  getTaxNumberDescribedBy(): string {
    const ids: string[] = [];
    const taxNumber = this.form.get('taxNumber');

    if (taxNumber?.hasError('required') && taxNumber?.touched) {
      ids.push('taxNumber-error-required');
    } else if (taxNumber?.hasError('pattern') && taxNumber?.touched) {
      ids.push('taxNumber-error-pattern');
    }
    ids.push('taxNumber-hint');

    return ids.join(' ');
  }

  getVatNumberDescribedBy(): string {
    const ids: string[] = [];
    const vatNumber = this.form.get('vatNumber');

    if (vatNumber?.hasError('pattern') && vatNumber?.touched) {
      ids.push('vatNumber-error-pattern');
    }
    ids.push('vatNumber-hint');

    return ids.join(' ');
  }

  getUifReferenceDescribedBy(): string {
    const ids: string[] = [];
    const uifReference = this.form.get('uifReference');

    if (uifReference?.hasError('required') && uifReference?.touched) {
      ids.push('uifReference-error-required');
    } else if (uifReference?.hasError('pattern') && uifReference?.touched) {
      ids.push('uifReference-error-pattern');
    }
    ids.push('uifReference-hint');

    return ids.join(' ');
  }

  getSdlNumberDescribedBy(): string {
    const ids: string[] = [];
    const sdlNumber = this.form.get('sdlNumber');

    if (sdlNumber?.hasError('required') && sdlNumber?.touched) {
      ids.push('sdlNumber-error-required');
    } else if (sdlNumber?.hasError('pattern') && sdlNumber?.touched) {
      ids.push('sdlNumber-error-pattern');
    }
    ids.push('sdlNumber-hint');

    return ids.join(' ');
  }

  getPayeReferenceDescribedBy(): string {
    const ids: string[] = [];
    const payeReference = this.form.get('payeReference');

    if (payeReference?.hasError('required') && payeReference?.touched) {
      ids.push('payeReference-error-required');
    } else if (payeReference?.hasError('pattern') && payeReference?.touched) {
      ids.push('payeReference-error-pattern');
    }
    ids.push('payeReference-hint');

    return ids.join(' ');
  }
}
