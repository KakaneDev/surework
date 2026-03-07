import { Component, Input, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent, FormFieldComponent, InputComponent, PasswordStrengthComponent } from '@shared/ui';
import { OnboardingService } from '../onboarding.service';
import { debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';

@Component({
  selector: 'app-account-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    ButtonComponent,
    FormFieldComponent,
    InputComponent,
    PasswordStrengthComponent
  ],
  template: `
    <div class="space-y-6" [formGroup]="form">
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {{ 'onboarding.account.title' | translate }}
        </h2>
        <p class="text-neutral-600 dark:text-neutral-400 mt-2">
          {{ 'onboarding.account.subtitle' | translate }}
        </p>
      </div>

      <!-- ARIA Live Region for async validation announcements -->
      <div role="status" aria-live="polite" class="sr-only">
        @if (checkingEmail()) {
          {{ 'common.checking' | translate }}
        } @else if (emailAvailable() === false && form.get('email')?.valid) {
          {{ 'onboarding.account.emailTaken' | translate }}
        } @else if (emailAvailable() === true && form.get('email')?.valid) {
          {{ 'onboarding.account.emailAvailable' | translate }}
        }
      </div>

      <!-- Email Field -->
      <div>
        <label for="email" class="sw-label">
          {{ 'onboarding.account.email' | translate }} <span class="text-error-500" aria-hidden="true">*</span>
          <span class="sr-only">{{ 'common.required' | translate }}</span>
        </label>
        <div class="relative">
          <input
            id="email"
            type="email"
            formControlName="email"
            [placeholder]="'onboarding.account.emailPlaceholder' | translate"
            class="sw-input pr-10"
            [class.sw-input-error]="(form.get('email')?.invalid && form.get('email')?.touched) || emailAvailable() === false"
            [class.sw-input-success]="emailAvailable() && form.get('email')?.valid"
            [attr.aria-invalid]="(form.get('email')?.invalid && form.get('email')?.touched) || emailAvailable() === false"
            [attr.aria-describedby]="getEmailDescribedBy()"
            aria-required="true"
            autocomplete="email"
          />
          @if (checkingEmail()) {
            <span class="absolute right-3 top-1/2 -translate-y-1/2" role="status">
              <span class="animate-spin material-icons text-neutral-400" aria-hidden="true">refresh</span>
              <span class="sr-only">{{ 'common.checking' | translate }}</span>
            </span>
          } @else {
            <span class="absolute right-3 top-1/2 -translate-y-1/2 material-icons text-neutral-400" aria-hidden="true">
              email
            </span>
          }
        </div>
        @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
          <p id="email-error-required" class="sw-error-text" role="alert">{{ 'errors.requiredField' | translate }}</p>
        }
        @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
          <p id="email-error-invalid" class="sw-error-text" role="alert">{{ 'errors.invalidEmail' | translate }}</p>
        }
        @if (emailAvailable() === false && form.get('email')?.valid) {
          <p id="email-error-taken" class="sw-error-text" role="alert">{{ 'onboarding.account.emailTaken' | translate }}</p>
        }
        @if (emailAvailable() === true && form.get('email')?.valid) {
          <p id="email-success" class="text-sm text-success-600 mt-1">{{ 'onboarding.account.emailAvailable' | translate }}</p>
        }
      </div>

      <!-- Password Field -->
      <div>
        <label for="password" class="sw-label">
          {{ 'onboarding.account.password' | translate }} <span class="text-error-500" aria-hidden="true">*</span>
          <span class="sr-only">{{ 'common.required' | translate }}</span>
        </label>
        <div class="relative">
          <input
            id="password"
            [type]="hidePassword() ? 'password' : 'text'"
            formControlName="password"
            [placeholder]="'onboarding.account.passwordPlaceholder' | translate"
            class="sw-input pr-10"
            [class.sw-input-error]="form.get('password')?.invalid && form.get('password')?.touched"
            [attr.aria-invalid]="form.get('password')?.invalid && form.get('password')?.touched"
            [attr.aria-describedby]="getPasswordDescribedBy()"
            aria-required="true"
            autocomplete="new-password"
          />
          <button
            type="button"
            (click)="togglePasswordVisibility()"
            [attr.aria-pressed]="!hidePassword()"
            [attr.aria-label]="hidePassword() ? ('common.showPassword' | translate) : ('common.hidePassword' | translate)"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-2 -m-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <span class="material-icons" aria-hidden="true">
              {{ hidePassword() ? 'visibility_off' : 'visibility' }}
            </span>
          </button>
        </div>
        @if (form.get('password')?.hasError('required') && form.get('password')?.touched) {
          <p id="password-error-required" class="sw-error-text" role="alert">{{ 'errors.requiredField' | translate }}</p>
        }
        @if (form.get('password')?.hasError('minlength') && form.get('password')?.touched) {
          <p id="password-error-minlength" class="sw-error-text" role="alert">{{ 'onboarding.account.passwordMinLength' | translate }}</p>
        }
        @if (form.get('password')?.hasError('pattern') && form.get('password')?.touched) {
          <p id="password-error-pattern" class="sw-error-text" role="alert">{{ 'onboarding.account.passwordRequirements' | translate }}</p>
        }

        <!-- Password Strength Indicator -->
        @if (form.get('password')?.value) {
          <div class="mt-3" id="password-strength">
            <sw-password-strength [password]="form.get('password')?.value || ''"></sw-password-strength>
          </div>
        }
      </div>

      <!-- Name Fields -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="firstName" class="sw-label">
            {{ 'onboarding.account.firstName' | translate }} <span class="text-error-500" aria-hidden="true">*</span>
            <span class="sr-only">{{ 'common.required' | translate }}</span>
          </label>
          <input
            id="firstName"
            type="text"
            formControlName="firstName"
            [placeholder]="'onboarding.account.firstNamePlaceholder' | translate"
            class="sw-input"
            [class.sw-input-error]="form.get('firstName')?.invalid && form.get('firstName')?.touched"
            [attr.aria-invalid]="form.get('firstName')?.invalid && form.get('firstName')?.touched"
            [attr.aria-describedby]="getFirstNameDescribedBy()"
            aria-required="true"
            autocomplete="given-name"
          />
          @if (form.get('firstName')?.hasError('required') && form.get('firstName')?.touched) {
            <p id="firstName-error-required" class="sw-error-text" role="alert">{{ 'errors.requiredField' | translate }}</p>
          }
          @if (form.get('firstName')?.hasError('minlength') && form.get('firstName')?.touched) {
            <p id="firstName-error-minlength" class="sw-error-text" role="alert">{{ 'onboarding.account.nameMinLength' | translate }}</p>
          }
        </div>

        <div>
          <label for="lastName" class="sw-label">
            {{ 'onboarding.account.lastName' | translate }} <span class="text-error-500" aria-hidden="true">*</span>
            <span class="sr-only">{{ 'common.required' | translate }}</span>
          </label>
          <input
            id="lastName"
            type="text"
            formControlName="lastName"
            [placeholder]="'onboarding.account.lastNamePlaceholder' | translate"
            class="sw-input"
            [class.sw-input-error]="form.get('lastName')?.invalid && form.get('lastName')?.touched"
            [attr.aria-invalid]="form.get('lastName')?.invalid && form.get('lastName')?.touched"
            [attr.aria-describedby]="getLastNameDescribedBy()"
            aria-required="true"
            autocomplete="family-name"
          />
          @if (form.get('lastName')?.hasError('required') && form.get('lastName')?.touched) {
            <p id="lastName-error-required" class="sw-error-text" role="alert">{{ 'errors.requiredField' | translate }}</p>
          }
          @if (form.get('lastName')?.hasError('minlength') && form.get('lastName')?.touched) {
            <p id="lastName-error-minlength" class="sw-error-text" role="alert">{{ 'onboarding.account.nameMinLength' | translate }}</p>
          }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountStepComponent {
  @Input({ required: true }) form!: FormGroup;

  private readonly onboardingService = inject(OnboardingService);

  hidePassword = signal(true);
  checkingEmail = signal(false);
  emailAvailable = signal<boolean | null>(null);

  constructor() {
    // Check email availability on change (debounced)
    setTimeout(() => {
      if (this.form?.get('email')) {
        this.form.get('email')!.valueChanges.pipe(
          debounceTime(500),
          distinctUntilChanged(),
          switchMap(email => {
            if (!email || this.form.get('email')?.invalid) {
              this.emailAvailable.set(null);
              return of(null);
            }
            this.checkingEmail.set(true);
            return this.onboardingService.checkEmailAvailability(email).pipe(
              catchError(() => of({ available: true, message: '' }))
            );
          })
        ).subscribe(result => {
          this.checkingEmail.set(false);
          if (result) {
            this.emailAvailable.set(result.available);
          }
        });
      }
    });
  }

  togglePasswordVisibility(): void {
    this.hidePassword.set(!this.hidePassword());
  }

  /**
   * Returns the aria-describedby IDs for the email field
   */
  getEmailDescribedBy(): string | null {
    const ids: string[] = [];
    const email = this.form.get('email');

    if (email?.hasError('required') && email?.touched) {
      ids.push('email-error-required');
    } else if (email?.hasError('email') && email?.touched) {
      ids.push('email-error-invalid');
    } else if (this.emailAvailable() === false && email?.valid) {
      ids.push('email-error-taken');
    } else if (this.emailAvailable() === true && email?.valid) {
      ids.push('email-success');
    }

    return ids.length > 0 ? ids.join(' ') : null;
  }

  /**
   * Returns the aria-describedby IDs for the password field
   */
  getPasswordDescribedBy(): string | null {
    const ids: string[] = [];
    const password = this.form.get('password');

    if (password?.hasError('required') && password?.touched) {
      ids.push('password-error-required');
    } else if (password?.hasError('minlength') && password?.touched) {
      ids.push('password-error-minlength');
    } else if (password?.hasError('pattern') && password?.touched) {
      ids.push('password-error-pattern');
    }

    if (password?.value) {
      ids.push('password-strength');
    }

    return ids.length > 0 ? ids.join(' ') : null;
  }

  /**
   * Returns the aria-describedby IDs for the first name field
   */
  getFirstNameDescribedBy(): string | null {
    const firstName = this.form.get('firstName');

    if (firstName?.hasError('required') && firstName?.touched) {
      return 'firstName-error-required';
    } else if (firstName?.hasError('minlength') && firstName?.touched) {
      return 'firstName-error-minlength';
    }

    return null;
  }

  /**
   * Returns the aria-describedby IDs for the last name field
   */
  getLastNameDescribedBy(): string | null {
    const lastName = this.form.get('lastName');

    if (lastName?.hasError('required') && lastName?.touched) {
      return 'lastName-error-required';
    } else if (lastName?.hasError('minlength') && lastName?.touched) {
      return 'lastName-error-minlength';
    }

    return null;
  }
}
