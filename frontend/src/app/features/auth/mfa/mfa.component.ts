import { Component, inject, ChangeDetectionStrategy, DestroyRef, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, take, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { verifyMfa } from '@core/store/auth/auth.actions';
import { selectAuthLoading, selectAuthError, selectMfaChallengeToken } from '@core/store/auth/auth.selectors';
import { SpinnerComponent, ButtonComponent } from '@shared/ui';

@Component({
  selector: 'app-mfa',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    SpinnerComponent,
    ButtonComponent
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-800 p-4">
      <div class="w-full max-w-md">
        <!-- Logo/Brand -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg mb-4">
            <span class="material-icons text-3xl text-primary-500" aria-hidden="true">security</span>
          </div>
          <h1 class="text-2xl font-bold text-white">{{ 'auth.mfa.title' | translate }}</h1>
          <p class="text-primary-100 mt-1">{{ 'auth.mfa.enterCode' | translate }}</p>
        </div>

        <!-- MFA Card -->
        <div class="bg-white dark:bg-dark-surface rounded-2xl shadow-xl p-8">
          <form [formGroup]="mfaForm" (ngSubmit)="onSubmit()" class="space-y-5">
            <!-- Code Field -->
            <div>
              <label for="code" class="sw-label text-center block">{{ 'auth.mfa.codeLabel' | translate }}</label>
              <div class="relative">
                <input
                  id="code"
                  type="text"
                  formControlName="code"
                  maxlength="6"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  placeholder="000000"
                  autocomplete="one-time-code"
                  class="sw-input text-center text-2xl tracking-[0.5em] font-mono"
                  [class.sw-input-error]="mfaForm.get('code')?.invalid && mfaForm.get('code')?.touched"
                  [attr.aria-invalid]="mfaForm.get('code')?.invalid && mfaForm.get('code')?.touched"
                  [attr.aria-describedby]="(mfaForm.get('code')?.invalid && mfaForm.get('code')?.touched) ? 'code-error' : 'code-hint'"
                  (paste)="onPaste($event)"
                />
                <!-- Auto-submit indicator -->
                @if (autoSubmitEnabled()) {
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                    {{ 'auth.mfa.autoSubmit' | translate }}
                  </span>
                }
              </div>
              <p id="code-hint" class="text-xs text-neutral-500 text-center mt-1">
                {{ 'auth.mfa.codeHint' | translate }}
              </p>
              @if (mfaForm.get('code')?.hasError('required') && mfaForm.get('code')?.touched) {
                <p id="code-error" class="sw-error-text text-center" role="alert">{{ 'auth.mfa.codeRequired' | translate }}</p>
              }
              @if (mfaForm.get('code')?.hasError('minlength') && mfaForm.get('code')?.touched) {
                <p id="code-error" class="sw-error-text text-center" role="alert">{{ 'auth.mfa.codeMustBe6Digits' | translate }}</p>
              }
              @if (mfaForm.get('code')?.hasError('pattern') && mfaForm.get('code')?.touched) {
                <p id="code-error" class="sw-error-text text-center" role="alert">{{ 'auth.mfa.codeDigitsOnly' | translate }}</p>
              }
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
              [disabled]="mfaForm.invalid"
              [loading]="(loading$ | async) ?? false"
            >
              {{ (loading$ | async) ? ('auth.mfa.verifying' | translate) : ('auth.mfa.verifyCode' | translate) }}
            </sw-button>
          </form>

          <!-- Help Text -->
          <div class="mt-6 space-y-3 text-center">
            <p class="text-sm text-neutral-500 dark:text-neutral-400">
              {{ 'auth.mfa.openAuthenticator' | translate }}
            </p>

            <!-- Resend Code Option (for SMS/Email MFA) -->
            @if (canResendCode()) {
              <button
                type="button"
                (click)="resendCode()"
                [disabled]="resendCooldown() > 0 || (loading$ | async)"
                class="text-sm text-primary-500 hover:text-primary-600 disabled:text-neutral-400 transition-colors"
              >
                @if (resendCooldown() > 0) {
                  {{ 'auth.mfa.resendIn' | translate: { seconds: resendCooldown() } }}
                } @else {
                  {{ 'auth.mfa.resendCode' | translate }}
                }
              </button>
            }
          </div>

          <!-- Back to Login -->
          <div class="mt-6 text-center">
            <button
              type="button"
              (click)="backToLogin()"
              class="inline-flex items-center gap-2 text-sm text-primary-500 hover:text-primary-600 transition-colors"
            >
              <span class="material-icons text-lg" aria-hidden="true">arrow_back</span>
              {{ 'auth.mfa.backToLogin' | translate }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MfaComponent {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  loading$ = this.store.select(selectAuthLoading);
  error$ = this.store.select(selectAuthError);
  challengeToken$ = this.store.select(selectMfaChallengeToken);

  autoSubmitEnabled = signal(true);
  canResendCode = signal(false); // Would be true for SMS/Email MFA
  resendCooldown = signal(0);

  private resendInterval: ReturnType<typeof setInterval> | null = null;
  private challengeToken: string | null = null;

  mfaForm = this.fb.group({
    code: ['', [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(6),
      Validators.pattern(/^\d+$/)
    ]],
  });

  constructor() {
    // Store challenge token and redirect if missing (with proper cleanup)
    this.challengeToken$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(token => {
      this.challengeToken = token;
      if (!token) {
        this.router.navigate(['/auth/login']);
      }
    });

    // Auto-submit when 6 valid digits entered
    this.mfaForm.get('code')?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      debounceTime(100),
      distinctUntilChanged(),
      filter(value => !!value && value.length === 6 && /^\d{6}$/.test(value))
    ).subscribe(() => {
      if (this.autoSubmitEnabled() && this.mfaForm.valid && this.challengeToken) {
        this.onSubmit();
      }
    });

    // Cleanup interval on destroy
    this.destroyRef.onDestroy(() => {
      if (this.resendInterval) {
        clearInterval(this.resendInterval);
      }
    });
  }

  onSubmit(): void {
    if (this.mfaForm.valid && this.challengeToken) {
      this.store.dispatch(verifyMfa({
        request: {
          challengeToken: this.challengeToken,
          mfaCode: this.mfaForm.value.code!
        }
      }));
    }
  }

  onPaste(event: ClipboardEvent): void {
    const pastedData = event.clipboardData?.getData('text');
    if (pastedData) {
      // Extract only digits from pasted content
      const digitsOnly = pastedData.replace(/\D/g, '').slice(0, 6);
      if (digitsOnly.length > 0) {
        event.preventDefault();
        this.mfaForm.get('code')?.setValue(digitsOnly);
      }
    }
  }

  resendCode(): void {
    if (this.resendCooldown() > 0) return;

    // TODO: Implement resend API call when SMS/Email MFA is supported
    // this.authService.resendMfaCode(this.challengeToken).subscribe();

    this.startResendCooldown();
  }

  private startResendCooldown(): void {
    this.resendCooldown.set(60);

    if (this.resendInterval) {
      clearInterval(this.resendInterval);
    }

    this.resendInterval = setInterval(() => {
      const current = this.resendCooldown();
      if (current > 0) {
        this.resendCooldown.set(current - 1);
      } else if (this.resendInterval) {
        clearInterval(this.resendInterval);
        this.resendInterval = null;
      }
    }, 1000);
  }

  backToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
