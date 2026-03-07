import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonComponent, SpinnerComponent } from '@shared/ui';
import { ToastService } from '@shared/ui';
import { OnboardingService, SignupRequest } from './onboarding.service';
import { AccountStepComponent } from './steps/account-step.component';
import { CompanyStepComponent } from './steps/company-step.component';
import { ComplianceStepComponent } from './steps/compliance-step.component';
import { ContactStepComponent } from './steps/contact-step.component';
import { ReviewStepComponent } from './steps/review-step.component';
import { catchError, of, finalize } from 'rxjs';

interface WizardStep {
  id: number;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-onboarding-wizard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    RouterLink,
    ButtonComponent,
    SpinnerComponent,
    AccountStepComponent,
    CompanyStepComponent,
    ComplianceStepComponent,
    ContactStepComponent,
    ReviewStepComponent
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-primary-500 to-primary-800 py-8 px-4">
      <div class="max-w-3xl mx-auto">
        <!-- Logo/Brand -->
        <div class="text-center mb-8">
          <a href="/" class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg mb-4">
            <span class="text-3xl font-bold text-primary-500">S</span>
          </a>
          <h1 class="text-2xl font-bold text-white">{{ 'onboarding.title' | translate }}</h1>
          <p class="text-primary-100 mt-1">{{ 'onboarding.subtitle' | translate }}</p>
        </div>

        <!-- Progress Bar -->
        <nav class="mb-8" [attr.aria-label]="'onboarding.progress.label' | translate">
          <ol class="flex items-center justify-between relative" role="list">
            <!-- Progress Line -->
            <div class="absolute top-5 left-0 right-0 h-0.5 bg-primary-300/30 -z-10" aria-hidden="true"></div>
            <div
              class="absolute top-5 left-0 h-0.5 bg-white transition-all duration-300 -z-10"
              [style.width.%]="(currentStep() / (steps.length - 1)) * 100"
              aria-hidden="true"
            ></div>

            @for (step of steps; track step.id) {
              <li class="flex flex-col items-center relative z-10">
                <button
                  type="button"
                  [disabled]="step.id > currentStep()"
                  [attr.aria-current]="step.id === currentStep() ? 'step' : null"
                  [attr.aria-label]="getStepAriaLabel(step)"
                  (click)="goToStep(step.id)"
                  (keydown.enter)="goToStep(step.id)"
                  (keydown.space)="goToStep(step.id); $event.preventDefault()"
                  class="flex flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-600 rounded-full"
                  [ngClass]="{
                    'cursor-pointer hover:scale-110': step.id <= currentStep(),
                    'cursor-not-allowed opacity-70': step.id > currentStep()
                  }"
                >
                  <div [ngClass]="{
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300': true,
                    'bg-white text-primary-600': step.id <= currentStep(),
                    'bg-primary-300/30 text-white': step.id > currentStep()
                  }">
                    <span class="material-icons text-lg" aria-hidden="true">{{ step.id < currentStep() ? 'check' : step.icon }}</span>
                  </div>
                  <span class="text-xs text-white mt-2 hidden sm:block" aria-hidden="true">{{ step.label | translate }}</span>
                </button>
              </li>
            }
          </ol>
        </nav>

        <!-- Wizard Card -->
        <div class="bg-white dark:bg-dark-surface rounded-2xl shadow-xl overflow-hidden">
          <!-- Step Content with Animation -->
          <div
            class="p-6 md:p-8 animate-fade-in"
            [class.animate-slide-in-right]="stepDirection() === 'forward'"
            [class.animate-slide-in-left]="stepDirection() === 'backward'"
            role="region"
            [attr.aria-label]="steps[currentStep()].label | translate"
          >
            @switch (currentStep()) {
              @case (0) {
                <app-account-step [form]="accountForm"></app-account-step>
              }
              @case (1) {
                <app-company-step [form]="companyForm"></app-company-step>
              }
              @case (2) {
                <app-compliance-step [form]="complianceForm"></app-compliance-step>
              }
              @case (3) {
                <app-contact-step [form]="contactForm"></app-contact-step>
              }
              @case (4) {
                <app-review-step [data]="getAllFormData()" [termsForm]="termsForm"></app-review-step>
              }
            }
          </div>

          <!-- Navigation Buttons -->
          <div class="border-t border-neutral-200 dark:border-neutral-700 px-6 py-4 bg-neutral-50 dark:bg-neutral-800/50">
            <div class="flex justify-between items-center">
              <sw-button
                type="button"
                variant="outline"
                (click)="previousStep()"
                [disabled]="currentStep() === 0 || submitting()"
              >
                <span class="flex items-center gap-2">
                  <span class="material-icons text-lg">arrow_back</span>
                  {{ 'onboarding.navigation.back' | translate }}
                </span>
              </sw-button>

              @if (currentStep() < steps.length - 1) {
                <sw-button
                  type="button"
                  variant="primary"
                  (click)="nextStep()"
                  [disabled]="!isCurrentStepValid()"
                >
                  <span class="flex items-center gap-2">
                    {{ 'onboarding.navigation.next' | translate }}
                    <span class="material-icons text-lg">arrow_forward</span>
                  </span>
                </sw-button>
              } @else {
                <sw-button
                  type="button"
                  variant="primary"
                  (click)="submitSignup()"
                  [disabled]="!isFormValid() || submitting()"
                  [loading]="submitting()"
                >
                  <span class="flex items-center gap-2">
                    {{ submitting() ? ('onboarding.navigation.creating' | translate) : ('onboarding.navigation.createAccount' | translate) }}
                    @if (!submitting()) {
                      <span class="material-icons text-lg">rocket_launch</span>
                    }
                  </span>
                </sw-button>
              }
            </div>
          </div>
        </div>

        <!-- Already have account link -->
        <p class="text-center text-primary-100 text-sm mt-6">
          {{ 'onboarding.alreadyHaveAccount' | translate }}
          <a routerLink="/auth/login" class="text-white hover:underline font-medium">
            {{ 'onboarding.signIn' | translate }}
          </a>
        </p>
      </div>
    </div>

    <!-- Loading Overlay -->
    @if (submitting()) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-dark-surface rounded-xl p-8 text-center max-w-sm mx-4">
          <sw-spinner size="lg"></sw-spinner>
          <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mt-4">
            {{ 'onboarding.creating.title' | translate }}
          </h3>
          <p class="text-neutral-600 dark:text-neutral-400 mt-2">
            {{ 'onboarding.creating.message' | translate }}
          </p>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnboardingWizardComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly onboardingService = inject(OnboardingService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  currentStep = signal(0);
  submitting = signal(false);
  stepDirection = signal<'forward' | 'backward' | null>(null);

  steps: WizardStep[] = [
    { id: 0, label: 'onboarding.steps.account', icon: 'person' },
    { id: 1, label: 'onboarding.steps.company', icon: 'business' },
    { id: 2, label: 'onboarding.steps.compliance', icon: 'verified' },
    { id: 3, label: 'onboarding.steps.contact', icon: 'contact_phone' },
    { id: 4, label: 'onboarding.steps.review', icon: 'checklist' }
  ];

  // Account form (Step 1)
  accountForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [
      Validators.required,
      Validators.minLength(12),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
    ]],
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]]
  });

  // Company form (Step 2)
  companyForm = this.fb.group({
    companyName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    tradingName: ['', [Validators.maxLength(200)]],
    registrationNumber: ['', [Validators.required, Validators.pattern(/^\d{4}\/\d{6}\/\d{2}$/)]],
    companyType: ['', Validators.required],
    industrySector: ['', Validators.required]
  });

  // Compliance form (Step 3)
  complianceForm = this.fb.group({
    taxNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    vatNumber: ['', [Validators.pattern(/^(4\d{9})?$/)]],
    uifReference: ['', [Validators.required, Validators.pattern(/^U\d{8}$/)]],
    sdlNumber: ['', [Validators.required, Validators.pattern(/^L\d{8}$/)]],
    payeReference: ['', [Validators.required, Validators.pattern(/^\d{7}\/\d{3}\/\d{4}$/)]]
  });

  // Contact form (Step 4)
  contactForm = this.fb.group({
    phone: ['', [Validators.required, Validators.pattern(/^\+27[0-9]{9}$/)]],
    companyEmail: ['', [Validators.required, Validators.email]],
    streetAddress: ['', [Validators.required, Validators.maxLength(500)]],
    city: ['', [Validators.required, Validators.maxLength(100)]],
    province: ['', Validators.required],
    postalCode: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]]
  });

  // Terms form (Step 5)
  termsForm = this.fb.group({
    acceptTerms: [false, Validators.requiredTrue]
  });

  nextStep(): void {
    if (this.isCurrentStepValid() && this.currentStep() < this.steps.length - 1) {
      this.markCurrentFormAsTouched();
      this.stepDirection.set('forward');
      this.currentStep.set(this.currentStep() + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousStep(): void {
    if (this.currentStep() > 0) {
      this.stepDirection.set('backward');
      this.currentStep.set(this.currentStep() - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Navigate directly to a step (only allowed for completed/current steps)
   */
  goToStep(stepId: number): void {
    if (stepId <= this.currentStep() && stepId >= 0) {
      this.stepDirection.set(stepId < this.currentStep() ? 'backward' : 'forward');
      this.currentStep.set(stepId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Returns the aria-label for a progress step button
   */
  getStepAriaLabel(step: WizardStep): string {
    const stepLabel = this.translate.instant(step.label);
    const stepNumber = step.id + 1;
    const totalSteps = this.steps.length;

    if (step.id < this.currentStep()) {
      return this.translate.instant('onboarding.progress.completedStep', {
        stepNumber,
        totalSteps,
        stepLabel
      });
    } else if (step.id === this.currentStep()) {
      return this.translate.instant('onboarding.progress.currentStep', {
        stepNumber,
        totalSteps,
        stepLabel
      });
    } else {
      return this.translate.instant('onboarding.progress.futureStep', {
        stepNumber,
        totalSteps,
        stepLabel
      });
    }
  }

  isCurrentStepValid(): boolean {
    switch (this.currentStep()) {
      case 0:
        return this.accountForm.valid;
      case 1:
        return this.companyForm.valid;
      case 2:
        return this.complianceForm.valid;
      case 3:
        return this.contactForm.valid;
      case 4:
        return this.termsForm.valid;
      default:
        return false;
    }
  }

  isFormValid(): boolean {
    return this.accountForm.valid &&
           this.companyForm.valid &&
           this.complianceForm.valid &&
           this.contactForm.valid &&
           this.termsForm.valid;
  }

  getAllFormData(): any {
    return {
      ...this.accountForm.value,
      ...this.companyForm.value,
      ...this.complianceForm.value,
      ...this.contactForm.value
    };
  }

  submitSignup(): void {
    if (!this.isFormValid()) {
      return;
    }

    this.submitting.set(true);

    const request: SignupRequest = {
      ...this.accountForm.value as any,
      ...this.companyForm.value as any,
      ...this.complianceForm.value as any,
      ...this.contactForm.value as any,
      acceptTerms: this.termsForm.value.acceptTerms!
    };

    this.onboardingService.signup(request).pipe(
      catchError(error => {
        console.error('Signup failed:', error);
        const message = this.getErrorMessage(error);
        const title = this.translate.instant('onboarding.errors.signupFailedTitle');
        this.toast.error(message, title);
        return of(null);
      }),
      finalize(() => this.submitting.set(false))
    ).subscribe(response => {
      if (response) {
        // Store the tenant info for the success page
        sessionStorage.setItem('signup_email', request.email);
        sessionStorage.setItem('signup_subdomain', response.subdomain);
        this.router.navigate(['/signup/success']);
      }
    });
  }

  private getErrorMessage(error: any): string {
    // Handle specific HTTP status codes
    if (error.status === 0) {
      return this.translate.instant('onboarding.errors.networkError');
    }
    if (error.status === 404) {
      return this.translate.instant('onboarding.errors.serviceUnavailable');
    }
    if (error.status === 409) {
      // Conflict - email or registration number already exists
      return error.error?.message || this.translate.instant('onboarding.errors.alreadyExists');
    }
    if (error.status === 422 || error.status === 400) {
      // Validation error
      return error.error?.message || this.translate.instant('onboarding.errors.validationFailed');
    }
    if (error.status >= 500) {
      return this.translate.instant('onboarding.errors.serverError');
    }
    // Default message
    return error.error?.message || this.translate.instant('onboarding.errors.signupFailed');
  }

  private markCurrentFormAsTouched(): void {
    switch (this.currentStep()) {
      case 0:
        this.accountForm.markAllAsTouched();
        break;
      case 1:
        this.companyForm.markAllAsTouched();
        break;
      case 2:
        this.complianceForm.markAllAsTouched();
        break;
      case 3:
        this.contactForm.markAllAsTouched();
        break;
      case 4:
        this.termsForm.markAllAsTouched();
        break;
    }
  }
}
