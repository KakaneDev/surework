import { Component, Input, ChangeDetectionStrategy, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Password requirements configuration
 */
export interface PasswordRequirement {
  key: string;
  label: string;
  validator: (password: string) => boolean;
}

/**
 * Default password requirements based on NIST 800-63B guidelines
 */
export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    key: 'minLength',
    label: 'auth.passwordStrength.minLength',
    validator: (p: string) => p.length >= 12
  },
  {
    key: 'uppercase',
    label: 'auth.passwordStrength.uppercase',
    validator: (p: string) => /[A-Z]/.test(p)
  },
  {
    key: 'lowercase',
    label: 'auth.passwordStrength.lowercase',
    validator: (p: string) => /[a-z]/.test(p)
  },
  {
    key: 'number',
    label: 'auth.passwordStrength.number',
    validator: (p: string) => /\d/.test(p)
  },
  {
    key: 'special',
    label: 'auth.passwordStrength.special',
    validator: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p)
  }
];

/**
 * Common passwords list (top 100 most common)
 */
const COMMON_PASSWORDS = [
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', '1234567',
  'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou', 'master', 'sunshine',
  'ashley', 'bailey', 'passw0rd', 'shadow', '123123', '654321', 'superman',
  'qazwsx', 'michael', 'football', 'password1', 'password123', 'welcome',
  'welcome1', 'admin', 'login', 'princess', 'starwars', 'qwerty123',
  'hello', 'charlie', 'donald', 'Password', 'Password1', 'P@ssw0rd',
  'admin123', 'root', 'toor', 'pass', 'test', 'guest', 'master123'
];

@Component({
  selector: 'sw-password-strength',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="space-y-3">
      <!-- Strength Meter -->
      <div class="space-y-1">
        <div class="flex items-center justify-between text-sm">
          <span class="text-neutral-600 dark:text-neutral-400">{{ 'auth.passwordStrength.title' | translate }}</span>
          <span [class]="strengthLabelClass()">{{ strengthLabel() | translate }}</span>
        </div>
        <div class="h-2 bg-neutral-200 dark:bg-dark-elevated rounded-full overflow-hidden">
          <div
            class="h-full transition-all duration-300 ease-out rounded-full"
            [class]="strengthBarClass()"
            [style.width.%]="strengthPercent()"
          ></div>
        </div>
      </div>

      <!-- Requirements Checklist -->
      @if (showRequirements) {
        <ul class="space-y-1.5 text-sm" role="list" [attr.aria-label]="'auth.passwordStrength.requirementsLabel' | translate">
          @for (req of requirements; track req.key) {
            <li class="flex items-center gap-2" [attr.aria-checked]="requirementsMet()[req.key]">
              @if (requirementsMet()[req.key]) {
                <span class="material-icons text-success-500 text-base" aria-hidden="true">check_circle</span>
              } @else {
                <span class="material-icons text-neutral-300 dark:text-neutral-600 text-base" aria-hidden="true">radio_button_unchecked</span>
              }
              <span [class]="requirementsMet()[req.key] ? 'text-success-600 dark:text-success-400' : 'text-neutral-500 dark:text-neutral-400'">
                {{ req.label | translate }}
              </span>
            </li>
          }
          <!-- Common password warning -->
          @if (isCommonPassword()) {
            <li class="flex items-center gap-2 text-warning-600 dark:text-warning-400">
              <span class="material-icons text-warning-500 text-base" aria-hidden="true">warning</span>
              <span>{{ 'auth.passwordStrength.commonPassword' | translate }}</span>
            </li>
          }
        </ul>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PasswordStrengthComponent {
  @Input() set password(value: string) {
    this._password.set(value || '');
  }
  @Input() requirements: PasswordRequirement[] = DEFAULT_PASSWORD_REQUIREMENTS;
  @Input() showRequirements = true;

  private _password = signal('');

  /**
   * Check which requirements are met
   */
  requirementsMet = computed(() => {
    const pwd = this._password();
    const met: Record<string, boolean> = {};
    for (const req of this.requirements) {
      met[req.key] = req.validator(pwd);
    }
    return met;
  });

  /**
   * Check if password is in common passwords list
   */
  isCommonPassword = computed(() => {
    const pwd = this._password().toLowerCase();
    return pwd.length > 0 && COMMON_PASSWORDS.includes(pwd);
  });

  /**
   * Calculate overall strength score (0-100)
   */
  strengthPercent = computed(() => {
    const pwd = this._password();
    if (!pwd) return 0;

    const met = this.requirementsMet();
    const metCount = Object.values(met).filter(Boolean).length;
    const total = this.requirements.length;

    // Base score from requirements
    let score = (metCount / total) * 80;

    // Bonus for length beyond minimum
    if (pwd.length > 12) {
      score += Math.min((pwd.length - 12) * 2, 15);
    }

    // Penalty for common password
    if (this.isCommonPassword()) {
      score = Math.min(score, 20);
    }

    // Penalty for sequential/repeated characters
    if (/(.)\1{2,}/.test(pwd) || /012|123|234|345|456|567|678|789|890|abc|bcd/i.test(pwd)) {
      score = Math.max(score - 15, 0);
    }

    return Math.min(Math.round(score), 100);
  });

  /**
   * Get strength level (weak, fair, good, strong)
   */
  strengthLevel = computed(() => {
    const percent = this.strengthPercent();
    if (percent === 0) return 'none';
    if (percent < 30) return 'weak';
    if (percent < 60) return 'fair';
    if (percent < 85) return 'good';
    return 'strong';
  });

  /**
   * Get translated strength label
   */
  strengthLabel = computed(() => {
    const level = this.strengthLevel();
    return `auth.passwordStrength.${level}`;
  });

  /**
   * Get CSS class for strength bar
   */
  strengthBarClass = computed(() => {
    const level = this.strengthLevel();
    const classes: Record<string, string> = {
      none: 'bg-neutral-300',
      weak: 'bg-error-500',
      fair: 'bg-warning-500',
      good: 'bg-primary-500',
      strong: 'bg-success-500'
    };
    return classes[level];
  });

  /**
   * Get CSS class for strength label
   */
  strengthLabelClass = computed(() => {
    const level = this.strengthLevel();
    const classes: Record<string, string> = {
      none: 'text-neutral-400',
      weak: 'text-error-500 font-medium',
      fair: 'text-warning-500 font-medium',
      good: 'text-primary-500 font-medium',
      strong: 'text-success-500 font-medium'
    };
    return classes[level];
  });

  /**
   * Check if password meets all requirements
   */
  isValid = computed(() => {
    const met = this.requirementsMet();
    return Object.values(met).every(Boolean) && !this.isCommonPassword();
  });
}
