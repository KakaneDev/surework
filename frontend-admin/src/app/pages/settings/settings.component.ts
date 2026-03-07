import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { ProfileService, ChangePasswordRequest, MfaSetupResponse } from '@core/services/profile.service';
import { CardComponent } from '@core/components/ui/card.component';
import { ButtonComponent } from '@core/components/ui/button.component';
import { InputComponent } from '@core/components/ui/input.component';
import { SelectComponent, SelectOption } from '@core/components/ui/select.component';
import { ModalComponent } from '@core/components/ui/modal.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    ButtonComponent,
    InputComponent,
    SelectComponent,
    ModalComponent
  ],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Page Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Settings</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your preferences, security, and notification settings.</p>
        </div>
      </div>

      <!-- Preferences Section -->
      <app-card title="Preferences" subtitle="Customize your experience.">
        <div class="space-y-4">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <app-select
              label="Timezone"
              [options]="timezoneOptions"
              [(ngModel)]="preferences.timezone"
              (ngModelChange)="onPreferenceChange()"
            />
            <app-select
              label="Language"
              [options]="languageOptions"
              [(ngModel)]="preferences.language"
              (ngModelChange)="onPreferenceChange()"
            />
            <app-select
              label="Date Format"
              [options]="dateFormatOptions"
              [(ngModel)]="preferences.dateFormat"
              (ngModelChange)="onPreferenceChange()"
            />
          </div>
          @if (preferencesChanged()) {
            <div class="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
              <app-button variant="outline" (onClick)="resetPreferences()">Cancel</app-button>
              <app-button (onClick)="savePreferences()" [loading]="savingPreferences()">Save Changes</app-button>
            </div>
          }
        </div>
      </app-card>

      <!-- Notifications Section -->
      <app-card title="Notifications" subtitle="Choose what notifications you receive.">
        <div class="space-y-4">
          <!-- Email Notifications -->
          <div class="flex items-center justify-between rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</p>
              <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Receive notifications via email</p>
            </div>
            <label class="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                class="peer sr-only"
                [(ngModel)]="notifications.email"
                (ngModelChange)="onNotificationChange()"
              />
              <div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-brand-500/20 dark:bg-gray-700 dark:after:border-gray-600"></div>
            </label>
          </div>

          <!-- SMS Notifications -->
          <div class="flex items-center justify-between rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">SMS Notifications</p>
              <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Receive notifications via text message</p>
            </div>
            <label class="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                class="peer sr-only"
                [(ngModel)]="notifications.sms"
                (ngModelChange)="onNotificationChange()"
              />
              <div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-brand-500/20 dark:bg-gray-700 dark:after:border-gray-600"></div>
            </label>
          </div>

          <!-- Push Notifications -->
          <div class="flex items-center justify-between rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">Push Notifications</p>
              <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Receive browser push notifications</p>
            </div>
            <label class="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                class="peer sr-only"
                [(ngModel)]="notifications.push"
                (ngModelChange)="onNotificationChange()"
              />
              <div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-brand-500/20 dark:bg-gray-700 dark:after:border-gray-600"></div>
            </label>
          </div>

          @if (notificationsChanged()) {
            <div class="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
              <app-button variant="outline" (onClick)="resetNotifications()">Cancel</app-button>
              <app-button (onClick)="saveNotifications()" [loading]="savingNotifications()">Save Changes</app-button>
            </div>
          }
        </div>
      </app-card>

      <!-- Security Section -->
      <app-card title="Security" subtitle="Manage your account security settings.">
        <div class="space-y-4">
          <!-- Change Password -->
          <div class="flex items-center justify-between rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">Password</p>
              <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Update your account password</p>
            </div>
            <app-button variant="outline" size="sm" (onClick)="openPasswordModal()">
              Change Password
            </app-button>
          </div>

          <!-- Two-Factor Authentication -->
          <div class="flex items-center justify-between rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
              <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                @if (user()?.mfaEnabled) {
                  MFA is enabled on your account
                } @else {
                  Add an extra layer of security to your account
                }
              </p>
            </div>
            @if (user()?.mfaEnabled) {
              <app-button variant="outline" size="sm" (onClick)="openDisableMfaModal()">
                Disable MFA
              </app-button>
            } @else {
              <app-button variant="outline" size="sm" (onClick)="openMfaSetupModal()">
                Enable MFA
              </app-button>
            }
          </div>

          <!-- Active Sessions -->
          <div class="flex items-center justify-between rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">Active Sessions</p>
              <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Manage devices where you're logged in</p>
            </div>
            <app-button variant="ghost" size="sm" (onClick)="signOutAllDevices()" [loading]="signingOutAll()">
              Sign out all devices
            </app-button>
          </div>
        </div>
      </app-card>

      <!-- Danger Zone -->
      <app-card>
        <div class="flex items-center gap-4">
          <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-error-50 dark:bg-error-900/20">
            <svg class="h-5 w-5 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-900 dark:text-white">Danger Zone</p>
            <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">These actions are permanent and cannot be undone.</p>
          </div>
        </div>
        <div class="mt-4 flex flex-wrap gap-3">
          <app-button variant="danger" size="sm" (onClick)="signOutAllDevices()" [loading]="signingOutAll()">
            Sign out of all devices
          </app-button>
        </div>
      </app-card>

      <!-- Change Password Modal -->
      <app-modal
        [isOpen]="passwordModalOpen()"
        title="Change Password"
        (close)="closePasswordModal()"
      >
        <form (ngSubmit)="changePassword()" class="space-y-4">
          <app-input
            label="Current Password"
            type="password"
            [(ngModel)]="passwordForm.currentPassword"
            name="currentPassword"
            placeholder="Enter your current password"
            [required]="true"
            [error]="passwordErrors.currentPassword"
          />
          <app-input
            label="New Password"
            type="password"
            [(ngModel)]="passwordForm.newPassword"
            name="newPassword"
            placeholder="Enter a new password"
            [required]="true"
            hint="At least 8 characters with uppercase, lowercase, and numbers"
            [error]="passwordErrors.newPassword"
          />
          <app-input
            label="Confirm New Password"
            type="password"
            [(ngModel)]="passwordForm.confirmPassword"
            name="confirmPassword"
            placeholder="Confirm your new password"
            [required]="true"
            [error]="passwordErrors.confirmPassword"
          />
        </form>
        <div modal-footer class="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
          <app-button variant="outline" (onClick)="closePasswordModal()">Cancel</app-button>
          <app-button (onClick)="changePassword()" [loading]="changingPassword()">Change Password</app-button>
        </div>
      </app-modal>

      <!-- MFA Setup Modal -->
      <app-modal
        [isOpen]="mfaSetupModalOpen()"
        title="Enable Two-Factor Authentication"
        size="lg"
        (close)="closeMfaSetupModal()"
      >
        @if (mfaSetupStep() === 'loading') {
          <div class="flex flex-col items-center py-8">
            <svg class="h-8 w-8 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">Setting up MFA...</p>
          </div>
        } @else if (mfaSetupStep() === 'scan') {
          <ng-container>
            <div class="space-y-4">
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              <div class="flex justify-center">
                <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700">
                  @if (mfaSetupData()?.qrCodeUrl) {
                    <img [src]="mfaSetupData()!.qrCodeUrl" alt="QR Code" class="h-48 w-48" />
                  }
                </div>
              </div>
              <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Manual entry key</p>
                <p class="mt-1 font-mono text-sm text-gray-900 dark:text-white break-all">{{ mfaSetupData()?.secret }}</p>
              </div>
              <div class="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
                <app-button variant="outline" (onClick)="closeMfaSetupModal()">Cancel</app-button>
                <app-button (onClick)="mfaSetupStep.set('verify')">Continue</app-button>
              </div>
            </div>
          </ng-container>
        } @else if (mfaSetupStep() === 'verify') {
          <ng-container>
            <div class="space-y-4">
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Enter the 6-digit code from your authenticator app to verify setup.
              </p>
              <app-input
                label="Verification Code"
                [(ngModel)]="mfaVerifyCode"
                placeholder="000000"
                [error]="mfaVerifyError()"
              />
              <div class="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
                <app-button variant="outline" (onClick)="mfaSetupStep.set('scan')">Back</app-button>
                <app-button (onClick)="verifyMfa()" [loading]="verifyingMfa()">Verify & Enable</app-button>
              </div>
            </div>
          </ng-container>
        } @else if (mfaSetupStep() === 'backup') {
          <ng-container>
            <div class="space-y-4">
              <div class="rounded-xl border border-warning-200 bg-warning-50 p-4 dark:border-warning-800 dark:bg-warning-900/20">
                <div class="flex gap-3">
                  <svg class="h-5 w-5 flex-shrink-0 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  <div>
                    <p class="text-sm font-medium text-warning-800 dark:text-warning-200">Save your backup codes</p>
                    <p class="mt-1 text-sm text-warning-700 dark:text-warning-300">
                      If you lose access to your authenticator app, you can use these codes to log in.
                    </p>
                  </div>
                </div>
              </div>
              <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Backup Codes</p>
                <div class="grid grid-cols-2 gap-2">
                  @for (code of mfaSetupData()?.backupCodes; track code) {
                    <code class="rounded bg-white px-2 py-1 font-mono text-sm text-gray-900 dark:bg-gray-800 dark:text-white">{{ code }}</code>
                  }
                </div>
              </div>
              <div class="flex justify-end pt-4">
                <app-button (onClick)="closeMfaSetupModal()">Done</app-button>
              </div>
            </div>
          </ng-container>
        }
      </app-modal>

      <!-- Disable MFA Modal -->
      <app-modal
        [isOpen]="disableMfaModalOpen()"
        title="Disable Two-Factor Authentication"
        (close)="closeDisableMfaModal()"
      >
        <div class="space-y-4">
          <div class="rounded-xl border border-warning-200 bg-warning-50 p-4 dark:border-warning-800 dark:bg-warning-900/20">
            <div class="flex gap-3">
              <svg class="h-5 w-5 flex-shrink-0 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <div>
                <p class="text-sm font-medium text-warning-800 dark:text-warning-200">Warning</p>
                <p class="mt-1 text-sm text-warning-700 dark:text-warning-300">
                  Disabling MFA will make your account less secure. You'll only need your password to sign in.
                </p>
              </div>
            </div>
          </div>
          <app-input
            label="Enter your password to confirm"
            type="password"
            [(ngModel)]="disableMfaPassword"
            placeholder="Your current password"
            [error]="disableMfaError()"
          />
        </div>
        <div modal-footer class="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
          <app-button variant="outline" (onClick)="closeDisableMfaModal()">Cancel</app-button>
          <app-button variant="danger" (onClick)="disableMfa()" [loading]="disablingMfa()">Disable MFA</app-button>
        </div>
      </app-modal>

      <!-- Toast Notification -->
      @if (toast().show) {
        <div
          class="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-theme-lg animate-slide-up"
          [ngClass]="{
            'border-success-200 bg-success-50 text-success-800 dark:border-success-800 dark:bg-success-900/50 dark:text-success-200': toast().type === 'success',
            'border-error-200 bg-error-50 text-error-800 dark:border-error-800 dark:bg-error-900/50 dark:text-error-200': toast().type === 'error'
          }"
        >
          @if (toast().type === 'success') {
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          } @else {
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          }
          <span class="text-sm font-medium">{{ toast().message }}</span>
        </div>
      }
    </div>
  `
})
export class SettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);

  user = this.authService.currentUser;

  // Timezone options
  timezoneOptions: SelectOption[] = [
    { label: 'Africa/Johannesburg (SAST)', value: 'Africa/Johannesburg' },
    { label: 'Africa/Cairo (EET)', value: 'Africa/Cairo' },
    { label: 'Africa/Lagos (WAT)', value: 'Africa/Lagos' },
    { label: 'Africa/Nairobi (EAT)', value: 'Africa/Nairobi' },
    { label: 'Europe/London (GMT/BST)', value: 'Europe/London' },
    { label: 'Europe/Paris (CET/CEST)', value: 'Europe/Paris' },
    { label: 'America/New_York (EST/EDT)', value: 'America/New_York' },
    { label: 'America/Los_Angeles (PST/PDT)', value: 'America/Los_Angeles' },
    { label: 'Asia/Singapore (SGT)', value: 'Asia/Singapore' },
    { label: 'Asia/Tokyo (JST)', value: 'Asia/Tokyo' },
    { label: 'Australia/Sydney (AEST/AEDT)', value: 'Australia/Sydney' },
    { label: 'UTC', value: 'UTC' }
  ];

  // Language options
  languageOptions: SelectOption[] = [
    { label: 'English (South Africa)', value: 'en-ZA' },
    { label: 'English (US)', value: 'en-US' },
    { label: 'English (UK)', value: 'en-GB' },
    { label: 'Afrikaans', value: 'af-ZA' },
    { label: 'Zulu', value: 'zu-ZA' },
    { label: 'Xhosa', value: 'xh-ZA' }
  ];

  // Date format options
  dateFormatOptions: SelectOption[] = [
    { label: 'DD/MM/YYYY (31/01/2026)', value: 'dd/MM/yyyy' },
    { label: 'MM/DD/YYYY (01/31/2026)', value: 'MM/dd/yyyy' },
    { label: 'YYYY-MM-DD (2026-01-31)', value: 'yyyy-MM-dd' },
    { label: 'DD MMM YYYY (31 Jan 2026)', value: 'dd MMM yyyy' },
    { label: 'MMM DD, YYYY (Jan 31, 2026)', value: 'MMM dd, yyyy' }
  ];

  // Preferences state
  preferences = {
    timezone: 'Africa/Johannesburg',
    language: 'en-ZA',
    dateFormat: 'dd/MM/yyyy'
  };
  originalPreferences = { ...this.preferences };
  preferencesChanged = signal(false);
  savingPreferences = signal(false);

  // Notifications state
  notifications = {
    email: true,
    sms: false,
    push: true
  };
  originalNotifications = { ...this.notifications };
  notificationsChanged = signal(false);
  savingNotifications = signal(false);

  // Password modal state
  passwordModalOpen = signal(false);
  changingPassword = signal(false);
  passwordForm: ChangePasswordRequest = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  passwordErrors = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  // MFA setup state
  mfaSetupModalOpen = signal(false);
  mfaSetupStep = signal<'loading' | 'scan' | 'verify' | 'backup'>('loading');
  mfaSetupData = signal<MfaSetupResponse | null>(null);
  mfaVerifyCode = '';
  mfaVerifyError = signal('');
  verifyingMfa = signal(false);

  // Disable MFA state
  disableMfaModalOpen = signal(false);
  disableMfaPassword = '';
  disableMfaError = signal('');
  disablingMfa = signal(false);

  // Sign out all state
  signingOutAll = signal(false);

  // Toast state
  toast = signal<{ show: boolean; type: 'success' | 'error'; message: string }>({
    show: false,
    type: 'success',
    message: ''
  });

  ngOnInit(): void {
    this.loadUserPreferences();
  }

  private loadUserPreferences(): void {
    const currentUser = this.user();
    if (currentUser) {
      this.preferences = {
        timezone: currentUser.timezone || 'Africa/Johannesburg',
        language: currentUser.language || 'en-ZA',
        dateFormat: 'dd/MM/yyyy'
      };
      this.originalPreferences = { ...this.preferences };
    }
  }

  // Preferences methods
  onPreferenceChange(): void {
    this.preferencesChanged.set(
      this.preferences.timezone !== this.originalPreferences.timezone ||
      this.preferences.language !== this.originalPreferences.language ||
      this.preferences.dateFormat !== this.originalPreferences.dateFormat
    );
  }

  resetPreferences(): void {
    this.preferences = { ...this.originalPreferences };
    this.preferencesChanged.set(false);
  }

  savePreferences(): void {
    this.savingPreferences.set(true);
    this.profileService.updatePreferences({
      timezone: this.preferences.timezone,
      language: this.preferences.language,
      dateFormat: this.preferences.dateFormat
    }).subscribe({
      next: () => {
        this.savingPreferences.set(false);
        this.originalPreferences = { ...this.preferences };
        this.preferencesChanged.set(false);
        this.showToast('success', 'Preferences saved successfully');
      },
      error: (err) => {
        this.savingPreferences.set(false);
        this.showToast('error', 'Failed to save preferences');
        console.error('Save preferences failed:', err);
      }
    });
  }

  // Notifications methods
  onNotificationChange(): void {
    this.notificationsChanged.set(
      this.notifications.email !== this.originalNotifications.email ||
      this.notifications.sms !== this.originalNotifications.sms ||
      this.notifications.push !== this.originalNotifications.push
    );
  }

  resetNotifications(): void {
    this.notifications = { ...this.originalNotifications };
    this.notificationsChanged.set(false);
  }

  saveNotifications(): void {
    this.savingNotifications.set(true);
    this.profileService.updatePreferences({
      notifications: {
        emailNotifications: this.notifications.email,
        smsNotifications: this.notifications.sms,
        pushNotifications: this.notifications.push
      }
    }).subscribe({
      next: () => {
        this.savingNotifications.set(false);
        this.originalNotifications = { ...this.notifications };
        this.notificationsChanged.set(false);
        this.showToast('success', 'Notification settings saved');
      },
      error: (err) => {
        this.savingNotifications.set(false);
        this.showToast('error', 'Failed to save notification settings');
        console.error('Save notifications failed:', err);
      }
    });
  }

  // Password methods
  openPasswordModal(): void {
    this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
    this.passwordErrors = { currentPassword: '', newPassword: '', confirmPassword: '' };
    this.passwordModalOpen.set(true);
  }

  closePasswordModal(): void {
    this.passwordModalOpen.set(false);
  }

  changePassword(): void {
    // Reset errors
    this.passwordErrors = { currentPassword: '', newPassword: '', confirmPassword: '' };

    // Validate
    let hasErrors = false;
    if (!this.passwordForm.currentPassword) {
      this.passwordErrors.currentPassword = 'Current password is required';
      hasErrors = true;
    }
    if (!this.passwordForm.newPassword) {
      this.passwordErrors.newPassword = 'New password is required';
      hasErrors = true;
    } else if (this.passwordForm.newPassword.length < 8) {
      this.passwordErrors.newPassword = 'Password must be at least 8 characters';
      hasErrors = true;
    }
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.passwordErrors.confirmPassword = 'Passwords do not match';
      hasErrors = true;
    }

    if (hasErrors) return;

    this.changingPassword.set(true);
    this.profileService.changePassword(this.passwordForm).subscribe({
      next: () => {
        this.changingPassword.set(false);
        this.closePasswordModal();
        this.showToast('success', 'Password changed successfully');
      },
      error: (err) => {
        this.changingPassword.set(false);
        if (err.status === 400) {
          this.passwordErrors.currentPassword = 'Current password is incorrect';
        } else {
          this.showToast('error', 'Failed to change password');
        }
        console.error('Change password failed:', err);
      }
    });
  }

  // MFA setup methods
  openMfaSetupModal(): void {
    this.mfaSetupStep.set('loading');
    this.mfaSetupData.set(null);
    this.mfaVerifyCode = '';
    this.mfaVerifyError.set('');
    this.mfaSetupModalOpen.set(true);

    this.profileService.setupMfa().subscribe({
      next: (data) => {
        this.mfaSetupData.set(data);
        this.mfaSetupStep.set('scan');
      },
      error: (err) => {
        this.closeMfaSetupModal();
        this.showToast('error', 'Failed to initialize MFA setup');
        console.error('MFA setup failed:', err);
      }
    });
  }

  closeMfaSetupModal(): void {
    this.mfaSetupModalOpen.set(false);
  }

  verifyMfa(): void {
    if (!this.mfaVerifyCode || this.mfaVerifyCode.length !== 6) {
      this.mfaVerifyError.set('Please enter a valid 6-digit code');
      return;
    }

    this.verifyingMfa.set(true);
    this.mfaVerifyError.set('');

    this.profileService.verifyMfa(this.mfaVerifyCode).subscribe({
      next: () => {
        this.verifyingMfa.set(false);
        this.mfaSetupStep.set('backup');
        this.showToast('success', 'Two-factor authentication enabled');
      },
      error: (err) => {
        this.verifyingMfa.set(false);
        this.mfaVerifyError.set('Invalid verification code');
        console.error('MFA verify failed:', err);
      }
    });
  }

  // Disable MFA methods
  openDisableMfaModal(): void {
    this.disableMfaPassword = '';
    this.disableMfaError.set('');
    this.disableMfaModalOpen.set(true);
  }

  closeDisableMfaModal(): void {
    this.disableMfaModalOpen.set(false);
  }

  disableMfa(): void {
    if (!this.disableMfaPassword) {
      this.disableMfaError.set('Password is required');
      return;
    }

    this.disablingMfa.set(true);
    this.disableMfaError.set('');

    this.profileService.disableMfa(this.disableMfaPassword).subscribe({
      next: () => {
        this.disablingMfa.set(false);
        this.closeDisableMfaModal();
        this.showToast('success', 'Two-factor authentication disabled');
      },
      error: (err) => {
        this.disablingMfa.set(false);
        if (err.status === 400 || err.status === 401) {
          this.disableMfaError.set('Incorrect password');
        } else {
          this.showToast('error', 'Failed to disable MFA');
        }
        console.error('Disable MFA failed:', err);
      }
    });
  }

  // Sign out all devices
  signOutAllDevices(): void {
    this.signingOutAll.set(true);
    this.profileService.signOutAllDevices().subscribe({
      next: () => {
        this.signingOutAll.set(false);
        this.showToast('success', 'Signed out of all devices');
        // Log out the current user after a short delay
        setTimeout(() => {
          this.authService.logout();
        }, 1500);
      },
      error: (err) => {
        this.signingOutAll.set(false);
        this.showToast('error', 'Failed to sign out of all devices');
        console.error('Sign out all failed:', err);
      }
    });
  }

  // Toast helper
  private showToast(type: 'success' | 'error', message: string): void {
    this.toast.set({ show: true, type, message });
    setTimeout(() => {
      this.toast.set({ show: false, type: 'success', message: '' });
    }, 3000);
  }
}
