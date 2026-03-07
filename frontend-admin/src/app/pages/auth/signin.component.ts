import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { ButtonComponent } from '@core/components/ui/button.component';
import { InputComponent } from '@core/components/ui/input.component';

@Component({
  selector: 'app-signin',
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

        <!-- Login Card -->
        <div class="rounded-lg border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">Sign In</h2>

          @if (error()) {
            <div class="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              {{ error() }}
            </div>
          }

          <form (ngSubmit)="onSubmit()" class="space-y-5">
            <app-input
              label="Email"
              type="email"
              placeholder="admin@surework.co.za"
              [(ngModel)]="email"
              name="email"
              [error]="emailError()"
              [required]="true"
            />

            <app-input
              label="Password"
              type="password"
              placeholder="Enter your password"
              [(ngModel)]="password"
              name="password"
              [error]="passwordError()"
              [required]="true"
            />

            <div class="flex items-center justify-between">
              <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input type="checkbox" class="rounded border-gray-300 text-gray-900 focus:ring-gray-500" />
                Remember me
              </label>
              <a routerLink="/auth/forgot-password" class="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                Forgot password?
              </a>
            </div>

            <app-button
              type="submit"
              [loading]="loading()"
              [fullWidth]="true"
            >
              Sign In
            </app-button>
          </form>
        </div>

        <p class="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          SureWork Admin Dashboard v1.0.0
        </p>
      </div>
    </div>
  `
})
export class SigninComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);
  emailError = signal<string | undefined>(undefined);
  passwordError = signal<string | undefined>(undefined);

  onSubmit(): void {
    this.error.set(null);
    this.emailError.set(undefined);
    this.passwordError.set(undefined);

    // Validation
    if (!this.email) {
      this.emailError.set('Email is required');
      return;
    }
    if (!this.password) {
      this.passwordError.set('Password is required');
      return;
    }

    this.loading.set(true);

    this.authService.login({ username: this.email, password: this.password }).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Invalid email or password');
      }
    });
  }
}
