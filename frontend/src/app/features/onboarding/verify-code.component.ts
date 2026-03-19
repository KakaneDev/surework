import { Component, signal, inject, OnInit, OnDestroy, ViewChildren, QueryList, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OnboardingService } from './onboarding.service';
import { AuthService } from '../../core/services/auth.service';
import { catchError, of, finalize } from 'rxjs';

@Component({
  selector: 'app-verify-code',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-primary-500 to-primary-800 flex items-center justify-center py-12 px-4">
      <div class="max-w-md w-full">
        <!-- Logo/Brand -->
        <div class="text-center mb-8">
          <a href="/" class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg mb-4">
            <span class="text-3xl font-bold text-primary-500">S</span>
          </a>
          <h1 class="text-2xl font-bold text-white">Check your email</h1>
          <p class="text-primary-100 mt-1">
            @if (email()) {
              We sent a 6-digit code to <strong class="text-white">{{ email() }}</strong>
            } @else {
              We sent a 6-digit verification code to your email
            }
          </p>
        </div>

        <!-- Verify Card -->
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">

          <!-- Digit inputs -->
          <div class="flex justify-center gap-3 mb-6">
            @for (i of digitIndices; track i) {
              <input
                #digitInput
                type="text"
                inputmode="numeric"
                maxlength="1"
                pattern="[0-9]"
                [value]="digits()[i]"
                (input)="onDigitInput($event, i)"
                (keydown)="onKeyDown($event, i)"
                (paste)="onPaste($event)"
                (focus)="onFocus($event)"
                class="w-12 h-14 text-center text-xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition dark:bg-gray-800 dark:text-white"
                [class.border-red-400]="showError()"
                [class.border-gray-300]="!showError()"
                [attr.aria-label]="'Digit ' + (i + 1) + ' of 6'"
              />
            }
          </div>

          <!-- Error message -->
          @if (errorMessage()) {
            <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-sm text-red-600 text-center">{{ errorMessage() }}</p>
            </div>
          }

          <!-- Verify button -->
          <button
            type="button"
            (click)="verify()"
            [disabled]="verifying() || !isCodeComplete()"
            class="w-full py-3 px-4 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold rounded-lg text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center justify-center gap-2"
          >
            @if (verifying()) {
              <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              Verifying...
            } @else {
              Verify &amp; continue
            }
          </button>

          <!-- Resend -->
          <div class="mt-4 text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Didn't receive it?
              @if (cooldown() > 0) {
                <span class="text-gray-400"> Resend in {{ cooldown() }}s</span>
              } @else {
                <button
                  type="button"
                  (click)="resendCode()"
                  [disabled]="resending()"
                  class="ml-1 text-primary-500 hover:text-primary-600 font-medium underline disabled:opacity-50"
                >
                  {{ resending() ? 'Sending...' : 'Resend code' }}
                </button>
              }
            </p>
          </div>

          <!-- Change email -->
          <div class="mt-4 text-center">
            <button
              type="button"
              (click)="goBack()"
              class="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              &larr; Use a different email
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VerifyCodeComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly onboardingService = inject(OnboardingService);
  private readonly authService = inject(AuthService);

  @ViewChildren('digitInput') digitInputs!: QueryList<ElementRef<HTMLInputElement>>;

  readonly digitIndices = [0, 1, 2, 3, 4, 5];

  email = signal<string | null>(null);
  digits = signal<string[]>(['', '', '', '', '', '']);
  verifying = signal(false);
  resending = signal(false);
  errorMessage = signal<string | null>(null);
  showError = signal(false);
  cooldown = signal(0);

  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    const email = sessionStorage.getItem('signup_email');
    if (!email) {
      this.router.navigate(['/signup']);
      return;
    }
    this.email.set(email);
  }

  ngOnDestroy(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
  }

  isCodeComplete(): boolean {
    return this.digits().every(d => d.length === 1);
  }

  getCode(): string {
    return this.digits().join('');
  }

  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');

    // Take only the last character in case browser allows more
    const digit = value.slice(-1);

    const updated = [...this.digits()];
    updated[index] = digit;
    this.digits.set(updated);

    // Ensure input reflects the clean value
    input.value = digit;

    this.showError.set(false);
    this.errorMessage.set(null);

    // Advance focus if a digit was entered
    if (digit && index < 5) {
      this.focusInput(index + 1);
    }

    // Auto-submit when last digit entered
    if (digit && index === 5 && this.isCodeComplete()) {
      this.verify();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      const updated = [...this.digits()];
      if (updated[index]) {
        // Clear current cell
        updated[index] = '';
        this.digits.set(updated);
        (event.target as HTMLInputElement).value = '';
      } else if (index > 0) {
        // Move to previous cell and clear it
        updated[index - 1] = '';
        this.digits.set(updated);
        this.focusInput(index - 1);
        const inputs = this.digitInputs.toArray();
        if (inputs[index - 1]) {
          inputs[index - 1].nativeElement.value = '';
        }
      }
      this.showError.set(false);
      this.errorMessage.set(null);
    } else if (event.key === 'ArrowLeft' && index > 0) {
      this.focusInput(index - 1);
    } else if (event.key === 'ArrowRight' && index < 5) {
      this.focusInput(index + 1);
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') ?? '';
    const digits = pasted.replace(/\D/g, '').slice(0, 6).split('');

    const updated = ['', '', '', '', '', ''];
    digits.forEach((d, i) => { updated[i] = d; });
    this.digits.set(updated);

    // Sync DOM values
    const inputs = this.digitInputs.toArray();
    updated.forEach((d, i) => {
      if (inputs[i]) inputs[i].nativeElement.value = d;
    });

    this.showError.set(false);
    this.errorMessage.set(null);

    // Focus the first empty cell or the last cell
    const firstEmpty = updated.findIndex(d => !d);
    this.focusInput(firstEmpty === -1 ? 5 : firstEmpty);

    if (this.isCodeComplete()) {
      this.verify();
    }
  }

  onFocus(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
  }

  verify(): void {
    if (!this.isCodeComplete() || this.verifying()) return;

    const email = this.email();
    if (!email) return;

    this.verifying.set(true);
    this.errorMessage.set(null);
    this.showError.set(false);

    this.onboardingService.verify({ email, code: this.getCode() }).pipe(
      catchError(error => {
        const message = this.getVerifyErrorMessage(error);
        this.errorMessage.set(message);
        this.showError.set(true);
        return of(null);
      }),
      finalize(() => this.verifying.set(false))
    ).subscribe(response => {
      if (response) {
        this.authService.storeTokens(response.accessToken, response.refreshToken);
        sessionStorage.removeItem('signup_email');
        this.router.navigate(['/dashboard']);
      }
    });
  }

  resendCode(): void {
    const email = this.email();
    if (!email || this.cooldown() > 0 || this.resending()) return;

    this.resending.set(true);
    this.errorMessage.set(null);

    this.onboardingService.resendCode(email).pipe(
      catchError(() => {
        this.errorMessage.set('Failed to resend code. Please try again.');
        return of(null);
      }),
      finalize(() => this.resending.set(false))
    ).subscribe(result => {
      if (result !== null || true) {
        // Start cooldown regardless (treat void success as truthy)
        this.startCooldown();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/signup']);
  }

  private focusInput(index: number): void {
    const inputs = this.digitInputs.toArray();
    if (inputs[index]) {
      inputs[index].nativeElement.focus();
    }
  }

  private startCooldown(): void {
    this.cooldown.set(60);
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
    this.cooldownInterval = setInterval(() => {
      const current = this.cooldown();
      if (current <= 1) {
        this.cooldown.set(0);
        if (this.cooldownInterval) {
          clearInterval(this.cooldownInterval);
          this.cooldownInterval = null;
        }
      } else {
        this.cooldown.set(current - 1);
      }
    }, 1000);
  }

  private getVerifyErrorMessage(error: any): string {
    if (error.status === 0) return 'Network error. Please check your connection.';
    if (error.status === 400) return 'Invalid code. Please check and try again.';
    if (error.status === 410) return 'This code has expired. Please request a new one.';
    if (error.status === 429) return 'Too many attempts. Please wait before trying again.';
    if (error.status >= 500) return 'Server error. Please try again in a moment.';
    return error.error?.message || 'Verification failed. Please try again.';
  }
}
