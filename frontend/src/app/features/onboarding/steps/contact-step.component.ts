import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent, FormFieldComponent, InputComponent } from '@shared/ui';
import { PROVINCES } from '../onboarding.service';

@Component({
  selector: 'app-contact-step',
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
          {{ 'onboarding.contact.title' | translate }}
        </h2>
        <p class="text-neutral-600 dark:text-neutral-400 mt-2">
          {{ 'onboarding.contact.subtitle' | translate }}
        </p>
      </div>

      <!-- Contact Information Section -->
      <fieldset class="space-y-4">
        <legend class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-700 pb-2 w-full">
          {{ 'onboarding.contact.contactInfo' | translate }}
        </legend>

        <!-- Phone Number -->
        <div>
          <label for="phone" class="sw-label">
            {{ 'onboarding.contact.phone' | translate }} <span class="text-error-500" aria-hidden="true">*</span>
            <span class="sr-only">{{ 'common.required' | translate }}</span>
          </label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-neutral-400" aria-hidden="true">phone</span>
            <input
              id="phone"
              type="tel"
              formControlName="phone"
              [placeholder]="'onboarding.contact.phonePlaceholder' | translate"
              class="sw-input pl-10"
              [class.sw-input-error]="form.get('phone')?.invalid && form.get('phone')?.touched"
              [attr.aria-invalid]="form.get('phone')?.invalid && form.get('phone')?.touched"
              [attr.aria-describedby]="getPhoneDescribedBy()"
              aria-required="true"
              autocomplete="tel"
            />
          </div>
          @if (form.get('phone')?.hasError('required') && form.get('phone')?.touched) {
            <p id="phone-error-required" class="sw-error-text" role="alert">{{ 'errors.requiredField' | translate }}</p>
          }
          @if (form.get('phone')?.hasError('pattern') && form.get('phone')?.touched) {
            <p id="phone-error-pattern" class="sw-error-text" role="alert">{{ 'onboarding.contact.phoneFormat' | translate }}</p>
          }
          <p id="phone-hint" class="text-xs text-neutral-500 mt-1">{{ 'onboarding.contact.phoneHint' | translate }}</p>
        </div>

        <!-- Company Email -->
        <div>
          <label for="companyEmail" class="sw-label">
            {{ 'onboarding.contact.companyEmail' | translate }} <span class="text-error-500" aria-hidden="true">*</span>
            <span class="sr-only">{{ 'common.required' | translate }}</span>
          </label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-neutral-400" aria-hidden="true">email</span>
            <input
              id="companyEmail"
              type="email"
              formControlName="companyEmail"
              [placeholder]="'onboarding.contact.companyEmailPlaceholder' | translate"
              class="sw-input pl-10"
              [class.sw-input-error]="form.get('companyEmail')?.invalid && form.get('companyEmail')?.touched"
              [attr.aria-invalid]="form.get('companyEmail')?.invalid && form.get('companyEmail')?.touched"
              [attr.aria-describedby]="getCompanyEmailDescribedBy()"
              aria-required="true"
              autocomplete="email"
            />
          </div>
          @if (form.get('companyEmail')?.hasError('required') && form.get('companyEmail')?.touched) {
            <p id="companyEmail-error-required" class="sw-error-text" role="alert">{{ 'errors.requiredField' | translate }}</p>
          }
          @if (form.get('companyEmail')?.hasError('email') && form.get('companyEmail')?.touched) {
            <p id="companyEmail-error-invalid" class="sw-error-text" role="alert">{{ 'errors.invalidEmail' | translate }}</p>
          }
        </div>
      </fieldset>

      <!-- Address Section -->
      <fieldset class="space-y-4 pt-4">
        <legend class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-700 pb-2 w-full">
          {{ 'onboarding.contact.physicalAddress' | translate }}
        </legend>

        <!-- Street Address -->
        <div>
          <label for="streetAddress" class="sw-label">
            {{ 'onboarding.contact.streetAddress' | translate }} <span class="text-error-500" aria-hidden="true">*</span>
            <span class="sr-only">{{ 'common.required' | translate }}</span>
          </label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-neutral-400" aria-hidden="true">location_on</span>
            <input
              id="streetAddress"
              type="text"
              formControlName="streetAddress"
              [placeholder]="'onboarding.contact.streetAddressPlaceholder' | translate"
              class="sw-input pl-10"
              [class.sw-input-error]="form.get('streetAddress')?.invalid && form.get('streetAddress')?.touched"
              [attr.aria-invalid]="form.get('streetAddress')?.invalid && form.get('streetAddress')?.touched"
              [attr.aria-describedby]="form.get('streetAddress')?.hasError('required') && form.get('streetAddress')?.touched ? 'streetAddress-error' : null"
              aria-required="true"
              autocomplete="street-address"
            />
          </div>
          @if (form.get('streetAddress')?.hasError('required') && form.get('streetAddress')?.touched) {
            <p id="streetAddress-error" class="sw-error-text" role="alert">{{ 'errors.requiredField' | translate }}</p>
          }
        </div>

        <!-- City and Province Row -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="city" class="sw-label">
              {{ 'onboarding.contact.city' | translate }} <span class="text-error-500" aria-hidden="true">*</span>
              <span class="sr-only">{{ 'common.required' | translate }}</span>
            </label>
            <input
              id="city"
              type="text"
              formControlName="city"
              [placeholder]="'onboarding.contact.cityPlaceholder' | translate"
              class="sw-input"
              [class.sw-input-error]="form.get('city')?.invalid && form.get('city')?.touched"
              [attr.aria-invalid]="form.get('city')?.invalid && form.get('city')?.touched"
              [attr.aria-describedby]="form.get('city')?.hasError('required') && form.get('city')?.touched ? 'city-error' : null"
              aria-required="true"
              autocomplete="address-level2"
            />
            @if (form.get('city')?.hasError('required') && form.get('city')?.touched) {
              <p id="city-error" class="sw-error-text" role="alert">{{ 'errors.requiredField' | translate }}</p>
            }
          </div>

          <div>
            <label for="province" class="sw-label">
              {{ 'onboarding.contact.province' | translate }} <span class="text-error-500" aria-hidden="true">*</span>
              <span class="sr-only">{{ 'common.required' | translate }}</span>
            </label>
            <select
              id="province"
              formControlName="province"
              class="sw-input"
              [class.sw-input-error]="form.get('province')?.invalid && form.get('province')?.touched"
              [attr.aria-invalid]="form.get('province')?.invalid && form.get('province')?.touched"
              [attr.aria-describedby]="form.get('province')?.hasError('required') && form.get('province')?.touched ? 'province-error' : null"
              aria-required="true"
            >
              <option value="" disabled>{{ 'onboarding.contact.selectProvince' | translate }}</option>
              @for (province of provinces; track province.name) {
                <option [value]="province.name">{{ province.displayName }}</option>
              }
            </select>
            @if (form.get('province')?.hasError('required') && form.get('province')?.touched) {
              <p id="province-error" class="sw-error-text" role="alert">{{ 'errors.requiredField' | translate }}</p>
            }
          </div>
        </div>

        <!-- Postal Code -->
        <div class="md:w-1/2">
          <label for="postalCode" class="sw-label">
            {{ 'onboarding.contact.postalCode' | translate }} <span class="text-error-500" aria-hidden="true">*</span>
            <span class="sr-only">{{ 'common.required' | translate }}</span>
          </label>
          <input
            id="postalCode"
            type="text"
            formControlName="postalCode"
            [placeholder]="'onboarding.contact.postalCodePlaceholder' | translate"
            class="sw-input"
            [class.sw-input-error]="form.get('postalCode')?.invalid && form.get('postalCode')?.touched"
            [attr.aria-invalid]="form.get('postalCode')?.invalid && form.get('postalCode')?.touched"
            [attr.aria-describedby]="getPostalCodeDescribedBy()"
            aria-required="true"
            maxlength="4"
            autocomplete="postal-code"
          />
          @if (form.get('postalCode')?.hasError('required') && form.get('postalCode')?.touched) {
            <p id="postalCode-error-required" class="sw-error-text" role="alert">{{ 'errors.requiredField' | translate }}</p>
          }
          @if (form.get('postalCode')?.hasError('pattern') && form.get('postalCode')?.touched) {
            <p id="postalCode-error-pattern" class="sw-error-text" role="alert">{{ 'onboarding.contact.postalCodeFormat' | translate }}</p>
          }
        </div>
      </fieldset>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactStepComponent {
  @Input({ required: true }) form!: FormGroup;

  provinces = PROVINCES;

  getPhoneDescribedBy(): string {
    const ids: string[] = [];
    const phone = this.form.get('phone');

    if (phone?.hasError('required') && phone?.touched) {
      ids.push('phone-error-required');
    } else if (phone?.hasError('pattern') && phone?.touched) {
      ids.push('phone-error-pattern');
    }
    ids.push('phone-hint');

    return ids.join(' ');
  }

  getCompanyEmailDescribedBy(): string | null {
    const companyEmail = this.form.get('companyEmail');

    if (companyEmail?.hasError('required') && companyEmail?.touched) {
      return 'companyEmail-error-required';
    } else if (companyEmail?.hasError('email') && companyEmail?.touched) {
      return 'companyEmail-error-invalid';
    }

    return null;
  }

  getPostalCodeDescribedBy(): string | null {
    const postalCode = this.form.get('postalCode');

    if (postalCode?.hasError('required') && postalCode?.touched) {
      return 'postalCode-error-required';
    } else if (postalCode?.hasError('pattern') && postalCode?.touched) {
      return 'postalCode-error-pattern';
    }

    return null;
  }
}
