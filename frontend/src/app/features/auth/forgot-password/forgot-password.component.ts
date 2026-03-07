import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { finalize, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { ButtonComponent, SpinnerComponent } from '@shared/ui';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    ButtonComponent,
    SpinnerComponent
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-800 p-4">
      <div class="w-full max-w-md">
        <!-- Logo/Brand -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg mb-4">
            <span class="material-icons text-3xl text-primary-500" aria-hidden="true">lock_reset</span>
          </div>
          <h1 class="text-2xl font-bold text-white">{{ 'auth.forgotPasswordPage.title' | translate }}</h1>
          <p class="text-primary-100 mt-1">{{ 'auth.forgotPasswordPage.subtitle' | translate }}</p>
        </div>

        <!-- Card -->
        <div class="bg-white dark:bg-dark-surface rounded-2xl shadow-xl p-8">
          @if (!emailSent()) {
            <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()" class="space-y-5">
              <!-- Email Field -->
              <div>
                <label for="email" class="sw-label">{{ 'auth.email' | translate }}</label>
                <div class="relative">
                  <input
                    id="email"
                    type="email"
                    formControlName="email"
                    [placeholder]="'auth.forgotPasswordPage.emailPlaceholder' | translate"
                    class="sw-input pr-10"
                    [class.sw-input-error]="forgotPasswordForm.get('email')?.invalid && forgotPasswordForm.get('email')?.touched"
                    [attr.aria-invalid]="forgotPasswordForm.get('email')?.invalid && forgotPasswordForm.get('email')?.touched"
                    [attr.aria-describedby]="(forgotPasswordForm.get('email')?.invalid && forgotPasswordForm.get('email')?.touched) ? 'email-error' : null"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 material-icons text-neutral-400 text-xl" aria-hidden="true">
                    email
                  </span>
                </div>
                @if (forgotPasswordForm.get('email')?.hasError('required') && forgotPasswordForm.get('email')?.touched) {
                  <p id="email-error" class="sw-error-text" role="alert">{{ 'errors.requiredField' | translate }}</p>
                }
                @if (forgotPasswordForm.get('email')?.hasError('email') && forgotPasswordForm.get('email')?.touched) {
                  <p id="email-error" class="sw-error-text" role="alert">{{ 'errors.invalidEmail' | translate }}</p>
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
                [disabled]="forgotPasswordForm.invalid"
                [loading]="loading()"
              >
                {{ loading() ? ('auth.forgotPasswordPage.sending' | translate) : ('auth.forgotPasswordPage.sendResetLink' | translate) }}
              </sw-button>
            </form>
          } @else {
            <!-- Success State -->
            <div class="text-center py-4">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-50 dark:bg-success-900/20 mb-4">
                <span class="material-icons text-3xl text-success-500" aria-hidden="true">mark_email_read</span>
              </div>
              <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-2">
                {{ 'auth.forgotPasswordPage.checkEmail' | translate }}
              </h2>
              <p class="text-neutral-600 dark:text-neutral-400 mb-4">
                {{ 'auth.forgotPasswordPage.emailSentTo' | translate: { email: submittedEmail() } }}
              </p>
              <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                {{ 'auth.forgotPasswordPage.checkSpam' | translate }}
              </p>

              <!-- Resend Button -->
              <div class="space-y-3">
                <button
                  type="button"
                  (click)="onResend()"
                  [disabled]="resendCooldown() > 0 || loading()"
                  class="text-primary-500 hover:text-primary-600 disabled:text-neutral-400 text-sm font-medium transition-colors"
                >
                  @if (resendCooldown() > 0) {
                    {{ 'auth.forgotPasswordPage.resendIn' | translate: { seconds: resendCooldown() } }}
                  } @else {
                    {{ 'auth.forgotPasswordPage.resendEmail' | translate }}
                  }
                </button>
              </div>
            </div>
          }

          <!-- Back to Login -->
          <div class="mt-6 text-center">
            <a
              routerLink="/auth/login"
              class="inline-flex items-center gap-2 text-sm text-primary-500 hover:text-primary-600 transition-colors"
            >
              <span class="material-icons text-lg" aria-hidden="true">arrow_back</span>
              {{ 'auth.forgotPasswordPage.backToLogin' | translate }}
            </a>
          </div>
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
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  loading = signal(false);
  error = signal<string | null>(null);
  emailSent = signal(false);
  submittedEmail = signal('');
  resendCooldown = signal(0);

  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  forgotPasswordForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    const email = this.forgotPasswordForm.value.email!;

    this.authService.forgotPassword({ email }).pipe(
      catchError(err => {
        console.error('Forgot password error:', err);
        // Don't reveal if email exists or not for security
        // Always show success message
        return of({ message: 'Success' });
      }),
      finalize(() => this.loading.set(false))
    ).subscribe(() => {
      this.submittedEmail.set(email);
      this.emailSent.set(true);
      this.startResendCooldown();
    });
  }

  onResend(): void {
    if (this.resendCooldown() > 0 || this.loading()) return;

    this.loading.set(true);
    const email = this.submittedEmail();

    this.authService.forgotPassword({ email }).pipe(
      catchError(() => of({ message: 'Success' })),
      finalize(() => this.loading.set(false))
    ).subscribe(() => {
      this.startResendCooldown();
    });
  }

  private startResendCooldown(): void {
    this.resendCooldown.set(60);

    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }

    this.cooldownInterval = setInterval(() => {
      const current = this.resendCooldown();
      if (current > 0) {
        this.resendCooldown.set(current - 1);
      } else if (this.cooldownInterval) {
        clearInterval(this.cooldownInterval);
        this.cooldownInterval = null;
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
  }
}
