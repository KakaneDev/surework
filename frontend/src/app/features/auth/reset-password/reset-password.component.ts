import { Component, inject, ChangeDetectionStrategy, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { finalize, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { ButtonComponent, SpinnerComponent, PasswordStrengthComponent } from '@shared/ui';

/**
 * Custom validator for password complexity
 */
function passwordComplexityValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;

  const hasUppercase = /[A-Z]/.test(value);
  const hasLowercase = /[a-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);

  const valid = hasUppercase && hasLowercase && hasNumber && hasSpecial;
  return valid ? null : { complexity: true };
}

/**
 * Common passwords check
 */
const COMMON_PASSWORDS = [
  'password', '123456', '12345678', 'qwerty', 'abc123', 'password1', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', 'dragon', 'master', 'login'
];

function notCommonPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value?.toLowerCase();
  if (!value) return null;
  return COMMON_PASSWORDS.includes(value) ? { commonPassword: true } : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    ButtonComponent,
    SpinnerComponent,
    PasswordStrengthComponent
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-800 p-4">
      <div class="w-full max-w-md">
        <!-- Logo/Brand -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg mb-4">
            <span class="material-icons text-3xl text-primary-500" aria-hidden="true">vpn_key</span>
          </div>
          <h1 class="text-2xl font-bold text-white">{{ 'auth.resetPassword.title' | translate }}</h1>
          <p class="text-primary-100 mt-1">{{ 'auth.resetPassword.subtitle' | translate }}</p>
        </div>

        <!-- Card -->
        <div class="bg-white dark:bg-dark-surface rounded-2xl shadow-xl p-8">
          @if (validatingToken()) {
            <!-- Token Validation Loading -->
            <div class="text-center py-8">
              <sw-spinner size="lg" />
              <p class="mt-4 text-neutral-600 dark:text-neutral-400">{{ 'auth.resetPassword.validatingToken' | translate }}</p>
            </div>
          } @else if (tokenInvalid()) {
            <!-- Invalid Token -->
            <div class="text-center py-4">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error-50 dark:bg-error-900/20 mb-4">
                <span class="material-icons text-3xl text-error-500" aria-hidden="true">error</span>
              </div>
              <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-2">
                {{ 'auth.resetPassword.invalidToken' | translate }}
              </h2>
              <p class="text-neutral-600 dark:text-neutral-400 mb-6">
                {{ 'auth.resetPassword.tokenExpired' | translate }}
              </p>
              <a
                routerLink="/auth/forgot-password"
                class="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
              >
                {{ 'auth.resetPassword.requestNewLink' | translate }}
              </a>
            </div>
          } @else if (resetSuccess()) {
            <!-- Success State -->
            <div class="text-center py-4">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-50 dark:bg-success-900/20 mb-4">
                <span class="material-icons text-3xl text-success-500" aria-hidden="true">check_circle</span>
              </div>
              <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-2">
                {{ 'auth.resetPassword.success' | translate }}
              </h2>
              <p class="text-neutral-600 dark:text-neutral-400 mb-6">
                {{ 'auth.resetPassword.successMessage' | translate }}
              </p>
              <a
                routerLink="/auth/login"
                class="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
              >
                <span class="material-icons text-lg" aria-hidden="true">login</span>
                {{ 'auth.resetPassword.goToLogin' | translate }}
              </a>
            </div>
          } @else {
            <!-- Reset Password Form -->
            <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="space-y-5">
              @if (userEmail()) {
                <div class="text-center text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  {{ 'auth.resetPassword.resettingFor' | translate }}: <strong>{{ userEmail() }}</strong>
                </div>
              }

              <!-- New Password Field -->
              <div>
                <label for="newPassword" class="sw-label">{{ 'auth.resetPassword.newPassword' | translate }}</label>
                <div class="relative">
                  <input
                    id="newPassword"
                    [type]="hidePassword() ? 'password' : 'text'"
                    formControlName="newPassword"
                    [placeholder]="'auth.resetPassword.newPasswordPlaceholder' | translate"
                    class="sw-input pr-10"
                    [class.sw-input-error]="resetForm.get('newPassword')?.invalid && resetForm.get('newPassword')?.touched"
                    [attr.aria-invalid]="resetForm.get('newPassword')?.invalid && resetForm.get('newPassword')?.touched"
                    autocomplete="new-password"
                  />
                  <button
                    type="button"
                    (click)="hidePassword.set(!hidePassword())"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                    [attr.aria-label]="hidePassword() ? ('auth.showPassword' | translate) : ('auth.hidePassword' | translate)"
                  >
                    <span class="material-icons text-xl" aria-hidden="true">
                      {{ hidePassword() ? 'visibility_off' : 'visibility' }}
                    </span>
                  </button>
                </div>
              </div>

              <!-- Password Strength Indicator -->
              <sw-password-strength
                [password]="resetForm.get('newPassword')?.value || ''"
                [showRequirements]="true"
              />

              <!-- Confirm Password Field -->
              <div>
                <label for="confirmPassword" class="sw-label">{{ 'auth.resetPassword.confirmPassword' | translate }}</label>
                <div class="relative">
                  <input
                    id="confirmPassword"
                    [type]="hideConfirmPassword() ? 'password' : 'text'"
                    formControlName="confirmPassword"
                    [placeholder]="'auth.resetPassword.confirmPasswordPlaceholder' | translate"
                    class="sw-input pr-10"
                    [class.sw-input-error]="(resetForm.get('confirmPassword')?.invalid || resetForm.hasError('passwordMismatch')) && resetForm.get('confirmPassword')?.touched"
                    autocomplete="new-password"
                  />
                  <button
                    type="button"
                    (click)="hideConfirmPassword.set(!hideConfirmPassword())"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                    [attr.aria-label]="hideConfirmPassword() ? ('auth.showPassword' | translate) : ('auth.hidePassword' | translate)"
                  >
                    <span class="material-icons text-xl" aria-hidden="true">
                      {{ hideConfirmPassword() ? 'visibility_off' : 'visibility' }}
                    </span>
                  </button>
                </div>
                @if (resetForm.hasError('passwordMismatch') && resetForm.get('confirmPassword')?.touched) {
                  <p class="sw-error-text" role="alert">{{ 'auth.resetPassword.passwordMismatch' | translate }}</p>
                }
              </div>

              <!-- Error Message -->
              @if (error()) {
                <div class="bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400 px-4 py-3 rounded-lg text-sm text-center" role="alert">
                  {{ error() }}
                </div>
              }

              <!-- Submit Button -->
              <sw-button
                type="submit"
                variant="primary"
                size="lg"
                [block]="true"
                [disabled]="resetForm.invalid"
                [loading]="loading()"
              >
                {{ loading() ? ('auth.resetPassword.resetting' | translate) : ('auth.resetPassword.resetPassword' | translate) }}
              </sw-button>
            </form>
          }

          <!-- Back to Login (not shown on success) -->
          @if (!resetSuccess()) {
            <div class="mt-6 text-center">
              <a
                routerLink="/auth/login"
                class="inline-flex items-center gap-2 text-sm text-primary-500 hover:text-primary-600 transition-colors"
              >
                <span class="material-icons text-lg" aria-hidden="true">arrow_back</span>
                {{ 'auth.forgotPasswordPage.backToLogin' | translate }}
              </a>
            </div>
          }
        </div>

        <!-- Footer -->
        <p class="text-center text-primary-200 text-sm mt-8">
          {{ 'auth.platformTagline' | translate }}
        </p>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);
  validatingToken = signal(true);
  tokenInvalid = signal(false);
  resetSuccess = signal(false);
  userEmail = signal<string | null>(null);
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);

  private token: string | null = null;

  resetForm = this.fb.group({
    newPassword: ['', [
      Validators.required,
      Validators.minLength(12),
      passwordComplexityValidator,
      notCommonPasswordValidator
    ]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  ngOnInit(): void {
    // Get token from URL
    this.token = this.route.snapshot.queryParamMap.get('token');

    if (!this.token) {
      this.validatingToken.set(false);
      this.tokenInvalid.set(true);
      return;
    }

    // Validate token
    this.authService.validateResetToken(this.token).pipe(
      catchError(() => of({ valid: false, email: undefined })),
      finalize(() => this.validatingToken.set(false))
    ).subscribe(result => {
      if (!result.valid) {
        this.tokenInvalid.set(true);
      } else if (result.email) {
        this.userEmail.set(result.email);
      }
    });
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.resetForm.invalid || !this.token) return;

    this.loading.set(true);
    this.error.set(null);

    const { newPassword, confirmPassword } = this.resetForm.value;

    this.authService.resetPassword({
      token: this.token,
      newPassword: newPassword!,
      confirmPassword: confirmPassword!
    }).pipe(
      catchError(err => {
        console.error('Reset password error:', err);
        this.error.set(err.error?.message || 'Failed to reset password. Please try again.');
        return of(null);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe(result => {
      if (result !== null) {
        this.resetSuccess.set(true);
      }
    });
  }
}
