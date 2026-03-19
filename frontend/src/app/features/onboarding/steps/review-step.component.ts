import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from '@shared/ui';
import { COMPANY_TYPES, INDUSTRY_SECTORS, PROVINCES } from '../onboarding.service';

@Component({
  selector: 'app-review-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    ButtonComponent
  ],
  template: `
    <div class="space-y-6">
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {{ 'onboarding.review.title' | translate }}
        </h2>
        <p class="text-neutral-600 dark:text-neutral-400 mt-2">
          {{ 'onboarding.review.subtitle' | translate }}
        </p>
      </div>

      <!-- Account Information -->
      <div class="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
          <span class="material-icons text-primary-500">person</span>
          {{ 'onboarding.review.accountInfo' | translate }}
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'onboarding.account.email' | translate }}</p>
            <p class="font-medium text-neutral-900 dark:text-neutral-100">{{ data.email }}</p>
          </div>
          <div>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'onboarding.review.fullName' | translate }}</p>
            <p class="font-medium text-neutral-900 dark:text-neutral-100">{{ data.firstName }} {{ data.lastName }}</p>
          </div>
        </div>
      </div>

      <!-- Company Details -->
      <div class="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
          <span class="material-icons text-primary-500">business</span>
          {{ 'onboarding.review.companyDetails' | translate }}
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'onboarding.company.companyName' | translate }}</p>
            <p class="font-medium text-neutral-900 dark:text-neutral-100">{{ data.companyName }}</p>
          </div>
          @if (data.tradingName) {
            <div>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'onboarding.company.tradingName' | translate }}</p>
              <p class="font-medium text-neutral-900 dark:text-neutral-100">{{ data.tradingName }}</p>
            </div>
          }
          <div>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'onboarding.company.registrationNumber' | translate }}</p>
            <p class="font-medium text-neutral-900 dark:text-neutral-100">{{ data.registrationNumber }}</p>
          </div>
          <div>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'onboarding.company.companyType' | translate }}</p>
            <p class="font-medium text-neutral-900 dark:text-neutral-100">{{ getCompanyTypeDisplay(data.companyType) }}</p>
          </div>
          <div>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'onboarding.company.industrySector' | translate }}</p>
            <p class="font-medium text-neutral-900 dark:text-neutral-100">{{ getIndustrySectorDisplay(data.industrySector) }}</p>
          </div>
        </div>
      </div>

      <!-- SARS Compliance -->
      <div class="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
          <span class="material-icons text-primary-500">verified</span>
          {{ 'onboarding.review.sarsCompliance' | translate }}
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'onboarding.compliance.taxNumber' | translate }}</p>
            <p class="font-medium text-neutral-900 dark:text-neutral-100">{{ data.taxNumber }}</p>
          </div>
          @if (data.vatNumber) {
            <div>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'onboarding.compliance.vatNumber' | translate }}</p>
              <p class="font-medium text-neutral-900 dark:text-neutral-100">{{ data.vatNumber }}</p>
            </div>
          }
          <div>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'onboarding.compliance.uifReference' | translate }}</p>
            <p class="font-medium text-neutral-900 dark:text-neutral-100">{{ data.uifReference }}</p>
          </div>
          <div>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'onboarding.compliance.sdlNumber' | translate }}</p>
            <p class="font-medium text-neutral-900 dark:text-neutral-100">{{ data.sdlNumber }}</p>
          </div>
          <div>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'onboarding.compliance.payeReference' | translate }}</p>
            <p class="font-medium text-neutral-900 dark:text-neutral-100">{{ data.payeReference }}</p>
          </div>
        </div>
      </div>

      <!-- Contact Information -->
      <div class="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
          <span class="material-icons text-primary-500">contact_phone</span>
          {{ 'onboarding.review.contactInfo' | translate }}
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'onboarding.contact.phone' | translate }}</p>
            <p class="font-medium text-neutral-900 dark:text-neutral-100">{{ data.phone }}</p>
          </div>
          <div>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'onboarding.contact.companyEmail' | translate }}</p>
            <p class="font-medium text-neutral-900 dark:text-neutral-100">{{ data.companyEmail }}</p>
          </div>
          <div class="md:col-span-2">
            <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'onboarding.contact.physicalAddress' | translate }}</p>
            <p class="font-medium text-neutral-900 dark:text-neutral-100">
              {{ data.streetAddress }}, {{ data.city }}, {{ getProvinceDisplay(data.province) }}, {{ data.postalCode }}
            </p>
          </div>
        </div>
      </div>

      <!-- Terms and Conditions -->
      <fieldset class="border-t border-neutral-200 dark:border-neutral-700 pt-6" [formGroup]="termsForm">
        <legend class="sr-only">{{ 'onboarding.review.termsSection' | translate }}</legend>
        <!-- Larger touch target wrapper (min 44x44px) -->
        <label class="flex items-start gap-3 cursor-pointer p-2 -m-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
          <input
            id="acceptTerms"
            type="checkbox"
            formControlName="acceptTerms"
            class="mt-1 w-5 h-5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
            [attr.aria-invalid]="termsForm.get('acceptTerms')?.hasError('requiredTrue') && termsForm.get('acceptTerms')?.touched"
            [attr.aria-describedby]="termsForm.get('acceptTerms')?.hasError('requiredTrue') && termsForm.get('acceptTerms')?.touched ? 'acceptTerms-error' : null"
            aria-required="true"
          />
          <span class="text-sm text-neutral-700 dark:text-neutral-300">
            {{ 'onboarding.review.acceptTerms' | translate }}
            <a href="/terms" target="_blank" rel="noopener noreferrer" class="text-primary-500 hover:text-primary-600 underline">
              {{ 'onboarding.review.termsLink' | translate }}
            </a>
            {{ 'onboarding.review.and' | translate }}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" class="text-primary-500 hover:text-primary-600 underline">
              {{ 'onboarding.review.privacyLink' | translate }}
            </a>.
          </span>
        </label>
        @if (termsForm.get('acceptTerms')?.hasError('requiredTrue') && termsForm.get('acceptTerms')?.touched) {
          <p id="acceptTerms-error" class="sw-error-text mt-2" role="alert">{{ 'onboarding.review.acceptTermsRequired' | translate }}</p>
        }
      </fieldset>

      <!-- Trial Info -->
      <div class="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-4">
        <div class="flex items-center gap-3">
          <span class="material-icons text-success-500">celebration</span>
          <div>
            <p class="font-semibold text-success-700 dark:text-success-300">{{ 'onboarding.review.trialTitle' | translate }}</p>
            <p class="text-sm text-success-600 dark:text-success-400">{{ 'onboarding.review.trialDescription' | translate }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReviewStepComponent {
  @Input({ required: true }) data: any;
  @Input({ required: true }) termsForm!: FormGroup;

  getCompanyTypeDisplay(value: string): string {
    const type = COMPANY_TYPES.find(t => t.name === value);
    return type?.displayName || value;
  }

  getIndustrySectorDisplay(value: string): string {
    const sector = INDUSTRY_SECTORS.find(s => s.name === value);
    return sector?.displayName || value;
  }

  getProvinceDisplay(value: string): string {
    const province = PROVINCES.find(p => p.name === value);
    return province?.displayName || value;
  }
}
