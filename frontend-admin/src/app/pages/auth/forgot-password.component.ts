import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { ButtonComponent } from '@core/components/ui/button.component';
import { InputComponent } from '@core/components/ui/input.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ButtonComponent, InputComponent],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div class="w-full max-w-md">
        <!-- Logo -->
        <div class="text-center mb-8">
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">SureWork</h1>
          <span class="inline-block mt-2 rounded-md bg-gray-900 px-3 py-1 text-sm font-medium text-white dark:bg-white dark:text-gray-900">Admin Portal</span>
        </div>

        <!-- Card -->
        <div class="rounded-lg border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
          @if (!submitted()) {
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Forgot Password</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form (ngSubmit)="onSubmit()" class="space-y-5">
              @if (errorMessage()) {
                <div class="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  {{ errorMessage() }}
                </div>
              }
              <app-input
                label="Email"
                type="email"
                placeholder="admin@surework.co.za"
                [(ngModel)]="email"
                name="email"
                [required]="true"
              />

              <app-button
                type="submit"
                [loading]="loading()"
                [fullWidth]="true"
              >
                Send Reset Link
              </app-button>
            </form>
          } @else {
            <div class="text-center">
              <div class="mx-auto mb-4 h-12 w-12 rounded-md bg-emerald-50 flex items-center justify-center dark:bg-emerald-900/20">
                <svg class="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Check Your Email</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
                We've sent a password reset link to {{ email }}.
              </p>
            </div>
          }

          <div class="mt-6 text-center">
            <a routerLink="/auth/signin" class="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
              Back to Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);

  email = '';
  loading = signal(false);
  submitted = signal(false);
  errorMessage = signal('');

  onSubmit(): void {
    if (!this.email) return;

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.loading.set(false);
        this.submitted.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message || 'Failed to send reset link. Please try again.');
      }
    });
  }
}
