import { Component, inject, ChangeDetectionStrategy, signal, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { login } from '@core/store/auth/auth.actions';
import { selectAuthLoading, selectAuthError, selectRateLimitInfo } from '@core/store/auth/auth.selectors';
import { ButtonComponent, SpinnerComponent, FormFieldComponent, InputComponent } from '@shared/ui';

const REMEMBER_EMAIL_KEY = 'sw-remember-email';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    ButtonComponent,
    SpinnerComponent,
    FormFieldComponent,
    InputComponent
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-800 p-4">
      <div class="w-full max-w-md">
        <!-- Logo/Brand -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg mb-4">
            <span class="text-3xl font-bold text-primary-500">S</span>
          </div>
          <h1 class="text-2xl font-bold text-white">{{ 'auth.welcome' | translate }}</h1>
          <p class="text-primary-100 mt-1">{{ 'auth.signInToContinue' | translate }}</p>
        </div>

        <!-- Login Card -->
        <div class="bg-white dark:bg-dark-surface rounded-2xl shadow-xl p-8">
          <!-- Rate Limit Warning -->
          @if (rateLimitInfo$ | async; as rateLimit) {
            @if (rateLimit.isLocked) {
              <div class="mb-6 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg" role="alert">
                <div class="flex items-start gap-3">
                  <span class="material-icons text-error-500 text-xl mt-0.5" aria-hidden="true">lock</span>
                  <div>
                    <h3 class="font-semibold text-error-700 dark:text-error-300">
                      {{ 'auth.rateLimit.accountLocked' | translate }}
                    </h3>
                    <p class="text-sm text-error-600 dark:text-error-400 mt-1">
                      {{ 'auth.rateLimit.tooManyAttempts' | translate }}
                    </p>
                    @if (lockoutCountdown() > 0) {
                      <p class="text-sm font-medium text-error-700 dark:text-error-300 mt-2">
                        {{ 'auth.rateLimit.tryAgainIn' | translate: { time: formatCountdown(lockoutCountdown()) } }}
                      </p>
                    }
                  </div>
                </div>
              </div>
            } @else if (rateLimit.remainingAttempts !== undefined && rateLimit.remainingAttempts <= 3) {
              <div class="mb-6 p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg" role="alert">
                <div class="flex items-center gap-2">
                  <span class="material-icons text-warning-500 text-lg" aria-hidden="true">warning</span>
                  <p class="text-sm text-warning-700 dark:text-warning-300">
                    {{ 'auth.rateLimit.remainingAttempts' | translate: { count: rateLimit.remainingAttempts } }}
                  </p>
                </div>
              </div>
            }
          }

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-5">
            <!-- Email Field -->
            <div>
              <label for="email" class="sw-label">{{ 'auth.email' | translate }}</label>
              <div class="relative">
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  [placeholder]="'auth.emailPlaceholder' | translate"
                  class="sw-input pr-10"
                  [class.sw-input-error]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
                  [attr.aria-invalid]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
                  [attr.aria-describedby]="(loginForm.get('email')?.invalid && loginForm.get('email')?.touched) ? 'email-error' : null"
                  autocomplete="email"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 material-icons text-neutral-400 text-xl" aria-hidden="true">
                  email
                </span>
              </div>
              @if (loginForm.get('email')?.hasError('required') && loginForm.get('email')?.touched) {
                <p id="email-error" class="sw-error-text" role="alert">{{ 'errors.requiredField' | translate }}</p>
              }
              @if (loginForm.get('email')?.hasError('email') && loginForm.get('email')?.touched) {
                <p id="email-error" class="sw-error-text" role="alert">{{ 'errors.invalidEmail' | translate }}</p>
              }
            </div>

            <!-- Password Field -->
            <div>
              <label for="password" class="sw-label">{{ 'auth.password' | translate }}</label>
              <div class="relative">
                <input
                  id="password"
                  [type]="hidePassword() ? 'password' : 'text'"
                  formControlName="password"
                  [placeholder]="'auth.enterPassword' | translate"
                  class="sw-input pr-10"
                  [class.sw-input-error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
                  [attr.aria-invalid]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
                  [attr.aria-describedby]="(loginForm.get('password')?.invalid && loginForm.get('password')?.touched) ? 'password-error' : null"
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  (click)="togglePasswordVisibility()"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors p-1"
                  [attr.aria-label]="hidePassword() ? ('auth.showPassword' | translate) : ('auth.hidePassword' | translate)"
                  [attr.title]="hidePassword() ? ('auth.showPassword' | translate) + ' (Alt+V)' : ('auth.hidePassword' | translate) + ' (Alt+V)'"
                >
                  <span class="material-icons text-xl" aria-hidden="true">
                    {{ hidePassword() ? 'visibility_off' : 'visibility' }}
                  </span>
                </button>
              </div>
              @if (loginForm.get('password')?.hasError('required') && loginForm.get('password')?.touched) {
                <p id="password-error" class="sw-error-text" role="alert">{{ 'errors.requiredField' | translate }}</p>
              }
            </div>

            <!-- Remember Me -->
            <div class="flex items-center justify-between">
              <label class="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  formControlName="rememberMe"
                  class="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
                />
                <span class="text-sm text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200 transition-colors">
                  {{ 'auth.rememberMe' | translate }}
                </span>
              </label>
              <a
                routerLink="/auth/forgot-password"
                class="text-sm text-primary-500 hover:text-primary-600 transition-colors"
              >
                {{ 'auth.forgotPassword' | translate }}
              </a>
            </div>

            <!-- Error Message -->
            @if (error$ | async; as error) {
              <div class="bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400 px-4 py-3 rounded-lg text-sm text-center" role="alert">
                {{ error }}
              </div>
            }

            <!-- Submit Button -->
            <sw-button
              type="submit"
              variant="primary"
              size="lg"
              [block]="true"
              [disabled]="loginForm.invalid || isLocked()"
              [loading]="(loading$ | async) ?? false"
            >
              {{ (loading$ | async) ? ('auth.signingIn' | translate) : ('auth.signIn' | translate) }}
            </sw-button>
          </form>
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
export class LoginComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);

  hidePassword = signal(true);
  lockoutCountdown = signal(0);

  loading$ = this.store.select(selectAuthLoading);
  error$ = this.store.select(selectAuthError);
  rateLimitInfo$ = this.store.select(selectRateLimitInfo);

  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [false]
  });

  constructor() {
    // Load remembered email
    const rememberedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (rememberedEmail) {
      this.loginForm.patchValue({
        email: rememberedEmail,
        rememberMe: true
      });
    }

    // Subscribe to rate limit info for countdown
    this.rateLimitInfo$.subscribe(info => {
      if (info?.isLocked && info?.lockoutEndTime) {
        this.startLockoutCountdown(info.lockoutEndTime);
      }
    });
  }

  /**
   * Handle Alt+V keyboard shortcut for password visibility toggle
   */
  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.altKey && event.key.toLowerCase() === 'v') {
      event.preventDefault();
      this.togglePasswordVisibility();
    }
  }

  togglePasswordVisibility(): void {
    this.hidePassword.set(!this.hidePassword());
  }

  isLocked(): boolean {
    return this.lockoutCountdown() > 0;
  }

  onSubmit(): void {
    if (this.loginForm.valid && !this.isLocked()) {
      const { email, password, rememberMe } = this.loginForm.value;

      // Handle Remember Me
      if (rememberMe) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, email!);
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }

      this.store.dispatch(login({
        request: { email: email!, password: password! }
      }));
    }
  }

  private startLockoutCountdown(endTime: number): void {
    // Clear existing interval
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      this.lockoutCountdown.set(remaining);

      if (remaining <= 0 && this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
    };

    updateCountdown();
    this.countdownInterval = setInterval(updateCountdown, 1000);
  }

  formatCountdown(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
