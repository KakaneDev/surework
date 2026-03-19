import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { OnboardingService, SignupRequest, COMPANY_TYPES } from './onboarding.service';
import { catchError, of, finalize, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

@Component({
  selector: 'app-onboarding-wizard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-800 p-4 py-12">
      <div class="w-full max-w-md">
        <!-- Logo/Brand -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg mb-4">
            <span class="text-3xl font-bold text-primary-500">S</span>
          </div>
          <h1 class="text-2xl font-bold text-white">Start your free trial</h1>
          <p class="text-primary-100 mt-1">Set up your SureWork account in minutes</p>
        </div>

        <!-- Signup Card -->
        <div class="bg-white dark:bg-dark-surface rounded-2xl shadow-xl p-8">
          <form [formGroup]="signupForm" (ngSubmit)="submitSignup()" class="space-y-5" novalidate>

            <!-- First name + Last name -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="firstName" class="sw-label">
                  First name <span class="text-error-500">*</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  formControlName="firstName"
                  autocomplete="given-name"
                  placeholder="Jane"
                  class="sw-input"
                  [class.sw-input-error]="isFieldInvalid('firstName')"
                />
                @if (isFieldInvalid('firstName')) {
                  <p class="sw-error-text">{{ getFieldError('firstName') }}</p>
                }
              </div>

              <div>
                <label for="lastName" class="sw-label">
                  Last name <span class="text-error-500">*</span>
                </label>
                <input
                  id="lastName"
                  type="text"
                  formControlName="lastName"
                  autocomplete="family-name"
                  placeholder="Smith"
                  class="sw-input"
                  [class.sw-input-error]="isFieldInvalid('lastName')"
                />
                @if (isFieldInvalid('lastName')) {
                  <p class="sw-error-text">{{ getFieldError('lastName') }}</p>
                }
              </div>
            </div>

            <!-- Work email -->
            <div>
              <label for="email" class="sw-label">
                Work email <span class="text-error-500">*</span>
              </label>
              <div class="relative">
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  autocomplete="email"
                  placeholder="jane@company.co.za"
                  class="sw-input pr-10"
                  [class.sw-input-error]="isFieldInvalid('email') || emailTaken()"
                  [class.sw-input-success]="emailChecked() && !emailTaken() && signupForm.get('email')?.valid"
                />
                @if (emailChecking()) {
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                  </span>
                }
                @if (!emailChecking() && emailChecked() && !emailTaken() && signupForm.get('email')?.valid) {
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 material-icons text-success-500 text-xl">check_circle</span>
                }
              </div>
              @if (isFieldInvalid('email')) {
                <p class="sw-error-text">{{ getFieldError('email') }}</p>
              }
              @if (emailTaken()) {
                <p class="sw-error-text">This email is already registered. <a routerLink="/auth/login" class="underline">Sign in instead?</a></p>
              }
            </div>

            <!-- Password -->
            <div>
              <label for="password" class="sw-label">
                Password <span class="text-error-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                formControlName="password"
                autocomplete="new-password"
                placeholder="Min. 12 characters"
                class="sw-input"
                [class.sw-input-error]="isFieldInvalid('password')"
              />
              @if (isFieldInvalid('password')) {
                <p class="sw-error-text">{{ getFieldError('password') }}</p>
              }

              <!-- Password strength indicator -->
              @if (signupForm.get('password')?.value) {
                <div class="mt-2">
                  <div class="flex gap-1 mb-1">
                    @for (bar of [1,2,3,4]; track bar) {
                      <div
                        class="h-1 flex-1 rounded-full transition-colors"
                        [class.bg-error-400]="passwordStrength() >= bar && passwordStrength() === 1"
                        [class.bg-warning-400]="passwordStrength() >= bar && passwordStrength() === 2"
                        [class.bg-warning-300]="passwordStrength() >= bar && passwordStrength() === 3"
                        [class.bg-success-400]="passwordStrength() >= bar && passwordStrength() === 4"
                        [class.bg-neutral-200]="passwordStrength() < bar"
                      ></div>
                    }
                  </div>
                  <p class="text-xs" [class]="passwordStrengthColor()">{{ passwordStrengthLabel() }}</p>
                </div>
              }
            </div>

            <!-- Company name -->
            <div>
              <label for="companyName" class="sw-label">
                Company name <span class="text-error-500">*</span>
              </label>
              <input
                id="companyName"
                type="text"
                formControlName="companyName"
                autocomplete="organization"
                placeholder="Acme (Pty) Ltd"
                class="sw-input"
                [class.sw-input-error]="isFieldInvalid('companyName')"
              />
              @if (isFieldInvalid('companyName')) {
                <p class="sw-error-text">{{ getFieldError('companyName') }}</p>
              }
            </div>

            <!-- Company type -->
            <div>
              <label for="companyType" class="sw-label">
                Company type <span class="text-error-500">*</span>
              </label>
              <select
                id="companyType"
                formControlName="companyType"
                class="sw-input"
                [class.sw-input-error]="isFieldInvalid('companyType')"
              >
                <option value="" disabled>Select company type</option>
                @for (type of companyTypes; track type.name) {
                  <option [value]="type.name">{{ type.displayName }}</option>
                }
              </select>
              @if (isFieldInvalid('companyType')) {
                <p class="sw-error-text">Please select a company type</p>
              }
            </div>

            <!-- Terms checkbox -->
            <div>
              <label class="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  formControlName="termsAccepted"
                  class="mt-0.5 w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
                />
                <span class="text-sm text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200 transition-colors">
                  I agree to the
                  <a href="/terms" target="_blank" class="text-primary-500 hover:text-primary-600 underline">Terms of Service</a>
                  and
                  <a href="/privacy" target="_blank" class="text-primary-500 hover:text-primary-600 underline">Privacy Policy</a>
                </span>
              </label>
              @if (signupForm.get('termsAccepted')?.touched && !signupForm.get('termsAccepted')?.value) {
                <p class="sw-error-text">You must accept the terms to continue</p>
              }
            </div>

            <!-- Error message -->
            @if (errorMessage()) {
              <div class="p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg" role="alert">
                <p class="text-sm text-error-600 dark:text-error-400">{{ errorMessage() }}</p>
              </div>
            }

            <!-- Submit button -->
            <button
              type="submit"
              [disabled]="submitting() || emailTaken()"
              class="w-full py-3 px-4 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold rounded-lg text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center justify-center gap-2"
            >
              @if (submitting()) {
                <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Creating your account...
              } @else {
                Start free trial
              }
            </button>
          </form>
        </div>

        <!-- Already have account -->
        <p class="text-center text-primary-200 text-sm mt-8">
          Already have an account?
          <a routerLink="/auth/login" class="text-white hover:underline font-medium">Sign in</a>
        </p>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnboardingWizardComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly onboardingService = inject(OnboardingService);

  readonly companyTypes = COMPANY_TYPES;

  submitting = signal(false);
  errorMessage = signal<string | null>(null);
  emailChecking = signal(false);
  emailChecked = signal(false);
  emailTaken = signal(false);

  signupForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [
      Validators.required,
      Validators.minLength(12),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
    ]],
    companyName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    companyType: ['', Validators.required],
    termsAccepted: [false, Validators.requiredTrue]
  });

  ngOnInit(): void {
    // Debounced email availability check
    this.signupForm.get('email')!.valueChanges.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      switchMap(email => {
        if (!email || !this.signupForm.get('email')?.valid) {
          this.emailChecked.set(false);
          this.emailTaken.set(false);
          return of(null);
        }
        this.emailChecking.set(true);
        this.emailChecked.set(false);
        this.emailTaken.set(false);
        return this.onboardingService.checkEmailAvailability(email).pipe(
          catchError(() => of(null))
        );
      })
    ).subscribe(result => {
      this.emailChecking.set(false);
      if (result !== null) {
        this.emailChecked.set(true);
        this.emailTaken.set(!result.available);
      }
    });
  }

  passwordStrength(): number {
    const password = this.signupForm.get('password')?.value ?? '';
    if (!password) return 0;
    let score = 0;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;
    return score;
  }

  passwordStrengthLabel(): string {
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    return labels[this.passwordStrength()] ?? '';
  }

  passwordStrengthColor(): string {
    const colors = ['', 'text-error-500', 'text-warning-500', 'text-warning-600', 'text-success-600'];
    return colors[this.passwordStrength()] ?? '';
  }

  isFieldInvalid(field: string): boolean {
    const control = this.signupForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  getFieldError(field: string): string {
    const control = this.signupForm.get(field);
    if (!control || !control.errors) return '';
    if (control.errors['required']) return 'This field is required';
    if (control.errors['email']) return 'Please enter a valid email address';
    if (control.errors['minlength']) {
      const min = control.errors['minlength'].requiredLength;
      return `Must be at least ${min} characters`;
    }
    if (control.errors['maxlength']) {
      const max = control.errors['maxlength'].requiredLength;
      return `Must be no more than ${max} characters`;
    }
    if (control.errors['pattern']) {
      if (field === 'password') {
        return 'Must include uppercase, lowercase, number, and special character (@$!%*?&)';
      }
    }
    return 'Invalid value';
  }

  submitSignup(): void {
    this.signupForm.markAllAsTouched();

    if (this.signupForm.invalid || this.emailTaken() || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const formValue = this.signupForm.value;
    const request: SignupRequest = {
      email: formValue.email!,
      password: formValue.password!,
      firstName: formValue.firstName!,
      lastName: formValue.lastName!,
      companyName: formValue.companyName!,
      companyType: formValue.companyType!,
      acceptTerms: formValue.termsAccepted!
    };

    this.onboardingService.signup(request).pipe(
      catchError(error => {
        const message = this.getErrorMessage(error);
        this.errorMessage.set(message);
        return of(null);
      }),
      finalize(() => this.submitting.set(false))
    ).subscribe(response => {
      if (response) {
        sessionStorage.setItem('signup_email', request.email);
        this.router.navigate(['/signup/verify']);
      }
    });
  }

  private getErrorMessage(error: any): string {
    if (error.status === 0) return 'Network error. Please check your connection and try again.';
    if (error.status === 409) return error.error?.message || 'An account with this email already exists.';
    if (error.status === 422 || error.status === 400) return error.error?.message || 'Please check your details and try again.';
    if (error.status >= 500) return 'Server error. Please try again in a moment.';
    return error.error?.message || 'Signup failed. Please try again.';
  }
}
