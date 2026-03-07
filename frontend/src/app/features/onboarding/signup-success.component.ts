import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonComponent, SpinnerComponent } from '@shared/ui';
import { ToastService } from '@shared/ui';
import { OnboardingService } from './onboarding.service';
import { catchError, of, finalize } from 'rxjs';

@Component({
  selector: 'app-signup-success',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    ButtonComponent,
    SpinnerComponent
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-primary-500 to-primary-800 flex items-center justify-center p-4">
      <div class="max-w-md w-full">
        <!-- Success Card -->
        <div class="bg-white dark:bg-dark-surface rounded-2xl shadow-xl p-8 text-center">
          <!-- Success Icon -->
          <div class="w-20 h-20 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <span class="material-icons text-success-500 text-4xl">check_circle</span>
          </div>

          <!-- Title -->
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            {{ 'onboarding.success.title' | translate }}
          </h1>

          <!-- Subtitle -->
          <p class="text-neutral-600 dark:text-neutral-400 mb-6">
            {{ 'onboarding.success.subtitle' | translate }}
          </p>

          <!-- Email Info -->
          @if (email()) {
            <div class="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 mb-6">
              <p class="text-sm text-neutral-500 dark:text-neutral-400">
                {{ 'onboarding.success.emailSentTo' | translate }}
              </p>
              <p class="font-medium text-neutral-900 dark:text-neutral-100 mt-1">
                {{ email() }}
              </p>
            </div>
          }

          <!-- Instructions -->
          <div class="text-left mb-6">
            <h3 class="font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
              {{ 'onboarding.success.nextSteps' | translate }}
            </h3>
            <ol class="space-y-3">
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-sm font-semibold">1</span>
                <span class="text-sm text-neutral-600 dark:text-neutral-400">{{ 'onboarding.success.step1' | translate }}</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-sm font-semibold">2</span>
                <span class="text-sm text-neutral-600 dark:text-neutral-400">{{ 'onboarding.success.step2' | translate }}</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-sm font-semibold">3</span>
                <span class="text-sm text-neutral-600 dark:text-neutral-400">{{ 'onboarding.success.step3' | translate }}</span>
              </li>
            </ol>
          </div>

          <!-- Subdomain Info -->
          @if (subdomain()) {
            <div class="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 mb-6">
              <p class="text-sm text-primary-700 dark:text-primary-300 mb-1">
                {{ 'onboarding.success.yourSubdomain' | translate }}
              </p>
              <p class="font-mono text-primary-900 dark:text-primary-100 font-medium">
                {{ subdomain() }}.surework.co.za
              </p>
            </div>
          }

          <!-- Actions -->
          <div class="space-y-3">
            <sw-button
              type="button"
              variant="outline"
              [block]="true"
              (click)="resendEmail()"
              [loading]="resending()"
              [disabled]="resending() || cooldown() > 0"
            >
              @if (cooldown() > 0) {
                {{ 'onboarding.success.resendIn' | translate: { seconds: cooldown() } }}
              } @else {
                {{ 'onboarding.success.resendEmail' | translate }}
              }
            </sw-button>

            <a routerLink="/auth/login" class="block">
              <sw-button
                type="button"
                variant="primary"
                [block]="true"
              >
                {{ 'onboarding.success.goToLogin' | translate }}
              </sw-button>
            </a>
          </div>

          <!-- Help Link -->
          <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-6">
            {{ 'onboarding.success.needHelp' | translate }}
            <a href="mailto:support@surework.co.za" class="text-primary-500 hover:text-primary-600">
              {{ 'onboarding.success.contactSupport' | translate }}
            </a>
          </p>
        </div>

        <!-- Back to landing -->
        <p class="text-center text-primary-100 text-sm mt-6">
          <a href="/" class="hover:text-white">
            {{ 'onboarding.success.backToHome' | translate }}
          </a>
        </p>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignupSuccessComponent implements OnInit {
  private readonly onboardingService = inject(OnboardingService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  email = signal<string | null>(null);
  subdomain = signal<string | null>(null);
  resending = signal(false);
  cooldown = signal(0);

  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    // Get signup info from session storage
    const email = sessionStorage.getItem('signup_email');
    const subdomain = sessionStorage.getItem('signup_subdomain');

    if (email) {
      this.email.set(email);
    }
    if (subdomain) {
      this.subdomain.set(subdomain);
    }

    // Clear session storage
    sessionStorage.removeItem('signup_email');
    sessionStorage.removeItem('signup_subdomain');
  }

  resendEmail(): void {
    const email = this.email();
    if (!email || this.cooldown() > 0) {
      return;
    }

    this.resending.set(true);

    this.onboardingService.resendVerificationEmail(email).pipe(
      catchError(error => {
        console.error('Failed to resend email:', error);
        this.toast.error(this.translate.instant('onboarding.success.resendFailed'));
        return of(null);
      }),
      finalize(() => this.resending.set(false))
    ).subscribe(() => {
      this.toast.success(this.translate.instant('onboarding.success.emailResent'));
      this.startCooldown();
    });
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

  ngOnDestroy(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
  }
}
