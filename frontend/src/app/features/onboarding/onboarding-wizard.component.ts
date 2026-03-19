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
    <div class="min-h-screen bg-gradient-to-br from-primary-500 to-primary-800 flex items-center justify-center py-12 px-4">
      <div class="max-w-lg w-full">
        <!-- Logo/Brand -->
        <div class="text-center mb-8">
          <a href="/" class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg mb-4">
            <span class="text-3xl font-bold text-primary-500">S</span>
          </a>
          <h1 class="text-2xl font-bold text-white">Start your free trial</h1>
          <p class="text-primary-100 mt-1">Set up your SureWork account in minutes</p>
        </div>

        <!-- Signup Card -->
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
          <form [formGroup]="signupForm" (ngSubmit)="submitSignup()" novalidate>

            <!-- First name + Last name -->
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label for="firstName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First name <span class="text-red-500">*</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  formControlName="firstName"
                  autocomplete="given-name"
                  placeholder="Jane"
                  class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  [class.border-red-400]="isFieldInvalid('firstName')"
                  [class.border-gray-300]="!isFieldInvalid('firstName')"
                />
                @if (isFieldInvalid('firstName')) {
                  <p class="mt-1 text-xs text-red-500">{{ getFieldError('firstName') }}</p>
                }
              </div>

              <div>
                <label for="lastName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last name <span class="text-red-500">*</span>
                </label>
                <input
                  id="lastName"
                  type="text"
                  formControlName="lastName"
                  autocomplete="family-name"
                  placeholder="Smith"
                  class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  [class.border-red-400]="isFieldInvalid('lastName')"
                  [class.border-gray-300]="!isFieldInvalid('lastName')"
                />
                @if (isFieldInvalid('lastName')) {
                  <p class="mt-1 text-xs text-red-500">{{ getFieldError('lastName') }}</p>
                }
              </div>
            </div>

            <!-- Work email -->
            <div class="mb-4">
              <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Work email <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  autocomplete="email"
                  placeholder="jane@company.co.za"
                  class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  [class.border-red-400]="isFieldInvalid('email') || emailTaken()"
                  [class.border-green-400]="emailChecked() && !emailTaken() && signupForm.get('email')?.valid"
                  [class.border-gray-300]="!isFieldInvalid('email') && !emailTaken() && !(emailChecked() && !emailTaken() && signupForm.get('email')?.valid)"
                />
                @if (emailChecking()) {
                  <span class="absolute right-3 top-2.5 text-gray-400">
                    <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                  </span>
                }
                @if (!emailChecking() && emailChecked() && !emailTaken() && signupForm.get('email')?.valid) {
                  <span class="absolute right-3 top-2.5 text-green-500 text-sm">&#10003;</span>
                }
              </div>
              @if (isFieldInvalid('email')) {
                <p class="mt-1 text-xs text-red-500">{{ getFieldError('email') }}</p>
              }
              @if (emailTaken()) {
                <p class="mt-1 text-xs text-red-500">This email is already registered. <a routerLink="/auth/login" class="underline">Sign in instead?</a></p>
              }
            </div>

            <!-- Password -->
            <div class="mb-4">
              <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password <span class="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                formControlName="password"
                autocomplete="new-password"
                placeholder="Min. 12 characters"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                [class.border-red-400]="isFieldInvalid('password')"
                [class.border-gray-300]="!isFieldInvalid('password')"
              />
              @if (isFieldInvalid('password')) {
                <p class="mt-1 text-xs text-red-500">{{ getFieldError('password') }}</p>
              }

              <!-- Password strength indicator -->
              @if (signupForm.get('password')?.value) {
                <div class="mt-2">
                  <div class="flex gap-1 mb-1">
                    @for (bar of [1,2,3,4]; track bar) {
                      <div
                        class="h-1 flex-1 rounded-full transition-colors"
                        [class.bg-red-400]="passwordStrength() >= bar && passwordStrength() === 1"
                        [class.bg-orange-400]="passwordStrength() >= bar && passwordStrength() === 2"
                        [class.bg-yellow-400]="passwordStrength() >= bar && passwordStrength() === 3"
                        [class.bg-green-400]="passwordStrength() >= bar && passwordStrength() === 4"
                        [class.bg-gray-200]="passwordStrength() < bar"
                      ></div>
                    }
                  </div>
                  <p class="text-xs" [class]="passwordStrengthColor()">{{ passwordStrengthLabel() }}</p>
                </div>
              }
            </div>

            <!-- Company name -->
            <div class="mb-4">
              <label for="companyName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company name <span class="text-red-500">*</span>
              </label>
              <input
                id="companyName"
                type="text"
                formControlName="companyName"
                autocomplete="organization"
                placeholder="Acme (Pty) Ltd"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                [class.border-red-400]="isFieldInvalid('companyName')"
                [class.border-gray-300]="!isFieldInvalid('companyName')"
              />
              @if (isFieldInvalid('companyName')) {
                <p class="mt-1 text-xs text-red-500">{{ getFieldError('companyName') }}</p>
              }
            </div>

            <!-- Company type -->
            <div class="mb-6">
              <label for="companyType" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company type <span class="text-red-500">*</span>
              </label>
              <select
                id="companyType"
                formControlName="companyType"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white dark:bg-gray-900"
                [class.border-red-400]="isFieldInvalid('companyType')"
                [class.border-gray-300]="!isFieldInvalid('companyType')"
              >
                <option value="" disabled>Select company type</option>
                @for (type of companyTypes; track type.name) {
                  <option [value]="type.name">{{ type.displayName }}</option>
                }
              </select>
              @if (isFieldInvalid('companyType')) {
                <p class="mt-1 text-xs text-red-500">Please select a company type</p>
              }
            </div>

            <!-- Terms checkbox -->
            <div class="mb-6">
              <label class="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  formControlName="termsAccepted"
                  class="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                />
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  I agree to the
                  <a href="/terms" target="_blank" class="text-primary-500 hover:text-primary-600 underline">Terms of Service</a>
                  and
                  <a href="/privacy" target="_blank" class="text-primary-500 hover:text-primary-600 underline">Privacy Policy</a>
                </span>
              </label>
              @if (signupForm.get('termsAccepted')?.touched && !signupForm.get('termsAccepted')?.value) {
                <p class="mt-1 text-xs text-red-500">You must accept the terms to continue</p>
              }
            </div>

            <!-- Error message -->
            @if (errorMessage()) {
              <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p class="text-sm text-red-600">{{ errorMessage() }}</p>
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
        <p class="text-center text-primary-100 text-sm mt-6">
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
    const colors = ['', 'text-red-500', 'text-orange-500', 'text-yellow-600', 'text-green-600'];
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
