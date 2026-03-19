import { Component, Input, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent, FormFieldComponent, InputComponent, SelectComponent } from '@shared/ui';
import { OnboardingService, COMPANY_TYPES, INDUSTRY_SECTORS } from '../onboarding.service';
import { debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';

@Component({
  selector: 'app-company-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    ButtonComponent,
    FormFieldComponent,
    InputComponent,
    SelectComponent
  ],
  template: `
    <div class="space-y-6" [formGroup]="form">
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {{ 'onboarding.company.title' | translate }}
        </h2>
        <p class="text-neutral-600 dark:text-neutral-400 mt-2">
          {{ 'onboarding.company.subtitle' | translate }}
        </p>
      </div>

      <!-- ARIA Live Region for async validation announcements -->
      <div role="status" aria-live="polite" class="sr-only">
        @if (checkingRegNumber()) {
          {{ 'common.checking' | translate }}
        } @else if (regNumberAvailable() === false && form.get('registrationNumber')?.valid) {
          {{ 'onboarding.company.registrationNumberTaken' | translate }}
        } @else if (regNumberAvailable() === true && form.get('registrationNumber')?.valid) {
          {{ 'onboarding.company.registrationNumberAvailable' | translate }}
        }
      </div>

      <!-- Company Name -->
      <div>
        <label for="companyName" class="sw-label">
          {{ 'onboarding.company.companyName' | translate }} <span class="text-error-500" aria-hidden="true">*</span>
          <span class="sr-only">{{ 'common.required' | translate }}</span>
        </label>
        <input
          id="companyName"
          type="text"
          formControlName="companyName"
          [placeholder]="'onboarding.company.companyNamePlaceholder' | translate"
          class="sw-input"
          [class.sw-input-error]="form.get('companyName')?.invalid && form.get('companyName')?.touched"
          [attr.aria-invalid]="form.get('companyName')?.invalid && form.get('companyName')?.touched"
          [attr.aria-describedby]="getCompanyNameDescribedBy()"
          aria-required="true"
          autocomplete="organization"
        />
        @if (form.get('companyName')?.hasError('required') && form.get('companyName')?.touched) {
          <p id="companyName-error-required" class="sw-error-text" role="alert">{{ 'errors.requiredField' | translate }}</p>
        }
        @if (form.get('companyName')?.hasError('minlength') && form.get('companyName')?.touched) {
          <p id="companyName-error-minlength" class="sw-error-text" role="alert">{{ 'onboarding.company.nameMinLength' | translate }}</p>
        }
      </div>

      <!-- Trading Name -->
      <div>
        <label for="tradingName" class="sw-label">
          {{ 'onboarding.company.tradingName' | translate }}
        </label>
        <input
          id="tradingName"
          type="text"
          formControlName="tradingName"
          [placeholder]="'onboarding.company.tradingNamePlaceholder' | translate"
          class="sw-input"
          aria-describedby="tradingName-hint"
        />
        <p id="tradingName-hint" class="text-xs text-neutral-500 mt-1">{{ 'onboarding.company.tradingNameHint' | translate }}</p>
      </div>

      <!-- Registration Number -->
      <div>
        <label for="registrationNumber" class="sw-label">
          {{ 'onboarding.company.registrationNumber' | translate }} <span class="text-error-500" aria-hidden="true">*</span>
          <span class="sr-only">{{ 'common.required' | translate }}</span>
        </label>
        <div class="relative">
          <input
            id="registrationNumber"
            type="text"
            formControlName="registrationNumber"
            [placeholder]="'onboarding.company.registrationNumberPlaceholder' | translate"
            class="sw-input"
            [class.sw-input-error]="(form.get('registrationNumber')?.invalid && form.get('registrationNumber')?.touched) || regNumberAvailable() === false"
            [class.sw-input-success]="regNumberAvailable() && form.get('registrationNumber')?.valid"
            [attr.aria-invalid]="(form.get('registrationNumber')?.invalid && form.get('registrationNumber')?.touched) || regNumberAvailable() === false"
            [attr.aria-describedby]="getRegNumberDescribedBy()"
            aria-required="true"
          />
          @if (checkingRegNumber()) {
            <span class="absolute right-3 top-1/2 -translate-y-1/2" role="status">
              <span class="animate-spin material-icons text-neutral-400" aria-hidden="true">refresh</span>
              <span class="sr-only">{{ 'common.checking' | translate }}</span>
            </span>
          }
        </div>
        @if (form.get('registrationNumber')?.hasError('required') && form.get('registrationNumber')?.touched) {
          <p id="registrationNumber-error-required" class="sw-error-text" role="alert">{{ 'errors.requiredField' | translate }}</p>
        }
        @if (form.get('registrationNumber')?.hasError('pattern') && form.get('registrationNumber')?.touched) {
          <p id="registrationNumber-error-pattern" class="sw-error-text" role="alert">{{ 'onboarding.company.registrationNumberFormat' | translate }}</p>
        }
        @if (regNumberAvailable() === false && form.get('registrationNumber')?.valid) {
          <p id="registrationNumber-error-taken" class="sw-error-text" role="alert">{{ 'onboarding.company.registrationNumberTaken' | translate }}</p>
        }
        @if (regNumberAvailable() === true && form.get('registrationNumber')?.valid) {
          <p id="registrationNumber-success" class="text-sm text-success-600 mt-1">{{ 'onboarding.company.registrationNumberAvailable' | translate }}</p>
        }
        <p id="registrationNumber-hint" class="text-xs text-neutral-500 mt-1">{{ 'onboarding.company.registrationNumberHint' | translate }}</p>
      </div>

      <!-- Company Type -->
      <div>
        <label for="companyType" class="sw-label">
          {{ 'onboarding.company.companyType' | translate }} <span class="text-error-500" aria-hidden="true">*</span>
          <span class="sr-only">{{ 'common.required' | translate }}</span>
        </label>
        <select
          id="companyType"
          formControlName="companyType"
          class="sw-input"
          [class.sw-input-error]="form.get('companyType')?.invalid && form.get('companyType')?.touched"
          [attr.aria-invalid]="form.get('companyType')?.invalid && form.get('companyType')?.touched"
          [attr.aria-describedby]="form.get('companyType')?.hasError('required') && form.get('companyType')?.touched ? 'companyType-error' : null"
          aria-required="true"
        >
          <option value="" disabled>{{ 'onboarding.company.selectCompanyType' | translate }}</option>
          @for (type of companyTypes; track type.name) {
            <option [value]="type.name">{{ type.displayName }}</option>
          }
        </select>
        @if (form.get('companyType')?.hasError('required') && form.get('companyType')?.touched) {
          <p id="companyType-error" class="sw-error-text" role="alert">{{ 'errors.requiredField' | translate }}</p>
        }
      </div>

      <!-- Industry Sector -->
      <div>
        <label for="industrySector" class="sw-label">
          {{ 'onboarding.company.industrySector' | translate }} <span class="text-error-500" aria-hidden="true">*</span>
          <span class="sr-only">{{ 'common.required' | translate }}</span>
        </label>
        <select
          id="industrySector"
          formControlName="industrySector"
          class="sw-input"
          [class.sw-input-error]="form.get('industrySector')?.invalid && form.get('industrySector')?.touched"
          [attr.aria-invalid]="form.get('industrySector')?.invalid && form.get('industrySector')?.touched"
          [attr.aria-describedby]="form.get('industrySector')?.hasError('required') && form.get('industrySector')?.touched ? 'industrySector-error' : null"
          aria-required="true"
        >
          <option value="" disabled>{{ 'onboarding.company.selectIndustrySector' | translate }}</option>
          @for (sector of industrySectors; track sector.name) {
            <option [value]="sector.name">{{ sector.displayName }}</option>
          }
        </select>
        @if (form.get('industrySector')?.hasError('required') && form.get('industrySector')?.touched) {
          <p id="industrySector-error" class="sw-error-text" role="alert">{{ 'errors.requiredField' | translate }}</p>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanyStepComponent {
  @Input({ required: true }) form!: FormGroup;

  private readonly onboardingService = inject(OnboardingService);

  companyTypes = COMPANY_TYPES;
  industrySectors = INDUSTRY_SECTORS;

  checkingRegNumber = signal(false);
  regNumberAvailable = signal<boolean | null>(null);

  constructor() {
    // Check registration number availability on change (debounced)
    setTimeout(() => {
      if (this.form?.get('registrationNumber')) {
        this.form.get('registrationNumber')!.valueChanges.pipe(
          debounceTime(500),
          distinctUntilChanged(),
          switchMap(regNumber => {
            if (!regNumber || this.form.get('registrationNumber')?.invalid) {
              this.regNumberAvailable.set(null);
              return of(null);
            }
            this.checkingRegNumber.set(true);
            return this.onboardingService.checkRegistrationNumberAvailability(regNumber).pipe(
              catchError(() => of({ available: true, message: '' }))
            );
          })
        ).subscribe(result => {
          this.checkingRegNumber.set(false);
          if (result) {
            this.regNumberAvailable.set(result.available);
          }
        });
      }
    });
  }

  /**
   * Returns the aria-describedby IDs for the company name field
   */
  getCompanyNameDescribedBy(): string | null {
    const companyName = this.form.get('companyName');

    if (companyName?.hasError('required') && companyName?.touched) {
      return 'companyName-error-required';
    } else if (companyName?.hasError('minlength') && companyName?.touched) {
      return 'companyName-error-minlength';
    }

    return null;
  }

  /**
   * Returns the aria-describedby IDs for the registration number field
   */
  getRegNumberDescribedBy(): string | null {
    const ids: string[] = [];
    const regNumber = this.form.get('registrationNumber');

    if (regNumber?.hasError('required') && regNumber?.touched) {
      ids.push('registrationNumber-error-required');
    } else if (regNumber?.hasError('pattern') && regNumber?.touched) {
      ids.push('registrationNumber-error-pattern');
    } else if (this.regNumberAvailable() === false && regNumber?.valid) {
      ids.push('registrationNumber-error-taken');
    } else if (this.regNumberAvailable() === true && regNumber?.valid) {
      ids.push('registrationNumber-success');
    }

    // Always include hint
    ids.push('registrationNumber-hint');

    return ids.join(' ');
  }
}
