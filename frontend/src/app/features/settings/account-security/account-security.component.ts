import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { selectCurrentUser } from '@core/store/auth/auth.selectors';
import { SettingsService, MfaSetupResponse } from '@core/services/settings.service';
import { AuthService, ActiveSession } from '@core/services/auth.service';
import { SpinnerComponent, ToastService, ButtonComponent, ConfirmActionDialogComponent, DialogService } from '@shared/ui';
import { loadCurrentUser } from '@core/store/auth/auth.actions';
import QRCode from 'qrcode';

@Component({
  selector: 'app-account-security',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SpinnerComponent, ButtonComponent, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Change Password Section -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
        <div class="p-6 border-b border-neutral-200 dark:border-dark-border">
          <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{{ 'settings.accountSecurity.changePasswordTitle' | translate }}</h2>
          <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{{ 'settings.accountSecurity.changePasswordDesc' | translate }}</p>
        </div>
        <form [formGroup]="passwordForm" (ngSubmit)="onChangePassword()" class="p-6 space-y-4">
          <div>
            <label class="sw-label">{{ 'settings.accountSecurity.currentPasswordLabel' | translate }}</label>
            <input
              type="password"
              formControlName="currentPassword"
              class="sw-input"
              [class.sw-input-error]="passwordForm.get('currentPassword')?.invalid && passwordForm.get('currentPassword')?.touched"
              [placeholder]="'settings.accountSecurity.currentPasswordPlaceholder' | translate"
            />
            @if (passwordForm.get('currentPassword')?.hasError('required') && passwordForm.get('currentPassword')?.touched) {
              <p class="sw-error-text">{{ 'settings.accountSecurity.currentPasswordRequired' | translate }}</p>
            }
          </div>

          <div>
            <label class="sw-label">{{ 'settings.accountSecurity.newPasswordLabel' | translate }}</label>
            <input
              type="password"
              formControlName="newPassword"
              class="sw-input"
              [class.sw-input-error]="passwordForm.get('newPassword')?.invalid && passwordForm.get('newPassword')?.touched"
              [placeholder]="'settings.accountSecurity.newPasswordPlaceholder' | translate"
            />
            @if (passwordForm.get('newPassword')?.hasError('required') && passwordForm.get('newPassword')?.touched) {
              <p class="sw-error-text">{{ 'settings.accountSecurity.newPasswordRequired' | translate }}</p>
            }
            @if (passwordForm.get('newPassword')?.hasError('minlength') && passwordForm.get('newPassword')?.touched) {
              <p class="sw-error-text">{{ 'settings.accountSecurity.passwordMinLength' | translate }}</p>
            }
          </div>

          <div>
            <label class="sw-label">{{ 'settings.accountSecurity.confirmPasswordLabel' | translate }}</label>
            <input
              type="password"
              formControlName="confirmPassword"
              class="sw-input"
              [class.sw-input-error]="passwordForm.get('confirmPassword')?.invalid && passwordForm.get('confirmPassword')?.touched"
              [placeholder]="'settings.accountSecurity.confirmPasswordPlaceholder' | translate"
            />
            @if (passwordForm.get('confirmPassword')?.hasError('required') && passwordForm.get('confirmPassword')?.touched) {
              <p class="sw-error-text">{{ 'settings.accountSecurity.confirmPasswordRequired' | translate }}</p>
            }
            @if (passwordForm.hasError('passwordMismatch') && passwordForm.get('confirmPassword')?.touched) {
              <p class="sw-error-text">{{ 'settings.accountSecurity.passwordMismatch' | translate }}</p>
            }
          </div>

          <div class="pt-2">
            <button
              type="submit"
              [disabled]="passwordForm.invalid || changingPassword()"
              class="sw-btn sw-btn-primary sw-btn-md"
            >
              @if (changingPassword()) {
                <sw-spinner size="sm" color="white" />
                <span>{{ 'settings.accountSecurity.changing' | translate }}</span>
              } @else {
                <span>{{ 'settings.accountSecurity.changePasswordButton' | translate }}</span>
              }
            </button>
          </div>
        </form>
      </div>

      <!-- Two-Factor Authentication Section -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
        <div class="p-6 border-b border-neutral-200 dark:border-dark-border">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{{ 'settings.accountSecurity.mfaTitle' | translate }}</h2>
              <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{{ 'settings.accountSecurity.mfaDesc' | translate }}</p>
            </div>
            <div class="flex items-center gap-2">
              @if (currentUser()?.mfaEnabled) {
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300 text-sm font-medium">
                  <span class="w-2 h-2 rounded-full bg-success-500"></span>
                  {{ 'settings.accountSecurity.mfaEnabled' | translate }}
                </span>
              } @else {
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-300 text-sm font-medium">
                  <span class="w-2 h-2 rounded-full bg-warning-500"></span>
                  {{ 'settings.accountSecurity.mfaDisabled' | translate }}
                </span>
              }
            </div>
          </div>
        </div>

        <div class="p-6">
          @if (!showMfaSetup() && !currentUser()?.mfaEnabled) {
            <div class="text-center py-8">
              <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">phonelink_lock</span>
              <p class="text-neutral-600 dark:text-neutral-400 mb-4">
                {{ 'settings.accountSecurity.mfaSetupDesc' | translate }}
              </p>
              <button
                type="button"
                (click)="startMfaSetup()"
                [disabled]="settingUpMfa()"
                class="sw-btn sw-btn-primary sw-btn-md"
              >
                @if (settingUpMfa()) {
                  <sw-spinner size="sm" color="white" />
                  <span>{{ 'settings.accountSecurity.settingUp' | translate }}</span>
                } @else {
                  <span class="material-icons text-sm">add</span>
                  <span>{{ 'settings.accountSecurity.enable2FAButton' | translate }}</span>
                }
              </button>
            </div>
          }

          @if (showMfaSetup() && mfaSetupData()) {
            <div class="space-y-6">
              <div class="flex flex-col md:flex-row gap-6 items-start">
                <!-- QR Code -->
                <div class="flex-shrink-0 p-4 bg-white rounded-lg border border-neutral-200">
                  @if (qrCodeDataUrl()) {
                    <img [src]="qrCodeDataUrl()" [alt]="'settings.accountSecurity.qrCodeAlt' | translate" class="w-48 h-48" />
                  } @else {
                    <div class="w-48 h-48 flex items-center justify-center">
                      <sw-spinner size="md" />
                    </div>
                  }
                </div>

                <!-- Instructions -->
                <div class="flex-1 space-y-4">
                  <div>
                    <h3 class="text-sm font-semibold text-neutral-800 dark:text-neutral-100 mb-2">{{ 'settings.accountSecurity.setupInstructions' | translate }}</h3>
                    <ol class="list-decimal list-inside text-sm text-neutral-600 dark:text-neutral-400 space-y-2">
                      <li>{{ 'settings.accountSecurity.installAuthApp' | translate }}</li>
                      <li>{{ 'settings.accountSecurity.scanQRCode' | translate }}</li>
                      <li>{{ 'settings.accountSecurity.enter6DigitCode' | translate }}</li>
                    </ol>
                  </div>

                  <div>
                    <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{{ 'settings.accountSecurity.manualEntryKey' | translate }}</p>
                    <code class="text-sm bg-neutral-100 dark:bg-dark-elevated px-2 py-1 rounded font-mono">
                      {{ mfaSetupData()!.secret }}
                    </code>
                  </div>
                </div>
              </div>

              <!-- Verification Form -->
              <div class="border-t border-neutral-200 dark:border-dark-border pt-4">
                <label class="sw-label">{{ 'settings.accountSecurity.verificationCodeLabel' | translate }}</label>
                <div class="flex gap-3">
                  <input
                    type="text"
                    [(ngModel)]="mfaVerifyCode"
                    maxlength="6"
                    pattern="[0-9]*"
                    class="sw-input w-40 text-center tracking-widest text-lg font-mono"
                    [placeholder]="'settings.accountSecurity.verificationCodePlaceholder' | translate"
                  />
                  <button
                    type="button"
                    (click)="verifyMfaSetup()"
                    [disabled]="mfaVerifyCode.length !== 6 || verifyingMfa()"
                    class="sw-btn sw-btn-primary sw-btn-md"
                  >
                    @if (verifyingMfa()) {
                      <sw-spinner size="sm" color="white" />
                    } @else {
                      <span>{{ 'settings.accountSecurity.verifyAndEnable' | translate }}</span>
                    }
                  </button>
                  <button
                    type="button"
                    (click)="cancelMfaSetup()"
                    class="sw-btn sw-btn-secondary sw-btn-md"
                  >
                    {{ 'settings.accountSecurity.cancel' | translate }}
                  </button>
                </div>
              </div>

              <!-- Backup Codes -->
              @if (mfaSetupData()!.backupCodes.length > 0) {
                <div class="bg-warning-50 dark:bg-warning-900/20 rounded-lg p-4">
                  <h4 class="text-sm font-semibold text-warning-800 dark:text-warning-200 mb-2">
                    <span class="material-icons text-sm align-middle mr-1">warning</span>
                    {{ 'settings.accountSecurity.saveBackupCodes' | translate }}
                  </h4>
                  <p class="text-xs text-warning-700 dark:text-warning-300 mb-3">
                    {{ 'settings.accountSecurity.backupCodesWarning' | translate }}
                  </p>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                    @for (code of mfaSetupData()!.backupCodes; track code) {
                      <code class="text-sm bg-white dark:bg-dark-surface px-2 py-1 rounded font-mono text-center">
                        {{ code }}
                      </code>
                    }
                  </div>
                </div>
              }
            </div>
          }

          @if (currentUser()?.mfaEnabled && !showMfaSetup()) {
            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <p class="text-neutral-600 dark:text-neutral-400">
                  {{ 'settings.accountSecurity.mfaEnabledDesc' | translate }}
                </p>
              </div>
              <button
                type="button"
                (click)="showDisableMfa.set(true)"
                class="sw-btn sw-btn-danger-outline sw-btn-md"
              >
                <span class="material-icons text-sm">remove_circle</span>
                <span>{{ 'settings.accountSecurity.disable2FAButton' | translate }}</span>
              </button>
            </div>

            @if (showDisableMfa()) {
              <div class="mt-4 p-4 bg-error-50 dark:bg-error-900/20 rounded-lg border border-error-200 dark:border-error-800">
                <p class="text-sm text-error-700 dark:text-error-300 mb-3">
                  {{ 'settings.accountSecurity.enter2FAToDisable' | translate }}
                </p>
                <div class="flex gap-3">
                  <input
                    type="text"
                    [(ngModel)]="mfaDisableCode"
                    maxlength="6"
                    pattern="[0-9]*"
                    class="sw-input w-40 text-center tracking-widest text-lg font-mono"
                    [placeholder]="'settings.accountSecurity.verificationCodePlaceholder' | translate"
                  />
                  <button
                    type="button"
                    (click)="disableMfa()"
                    [disabled]="mfaDisableCode.length !== 6 || disablingMfa()"
                    class="sw-btn sw-btn-danger sw-btn-md"
                  >
                    @if (disablingMfa()) {
                      <sw-spinner size="sm" color="white" />
                    } @else {
                      <span>{{ 'settings.accountSecurity.disable' | translate }}</span>
                    }
                  </button>
                  <button
                    type="button"
                    (click)="showDisableMfa.set(false); mfaDisableCode = ''"
                    class="sw-btn sw-btn-secondary sw-btn-md"
                  >
                    {{ 'settings.accountSecurity.cancel' | translate }}
                  </button>
                </div>
              </div>
            }
          }
        </div>
      </div>

      <!-- Active Sessions Section -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
        <div class="p-6 border-b border-neutral-200 dark:border-dark-border">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{{ 'settings.accountSecurity.activeSessionsTitle' | translate }}</h2>
              <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{{ 'settings.accountSecurity.activeSessionsDesc' | translate }}</p>
            </div>
            @if (sessions().length > 1) {
              <button
                type="button"
                (click)="revokeAllOtherSessions()"
                [disabled]="revokingAllSessions()"
                class="sw-btn sw-btn-danger-outline sw-btn-sm"
              >
                @if (revokingAllSessions()) {
                  <sw-spinner size="sm" />
                } @else {
                  <span class="material-icons text-sm">logout</span>
                  <span>{{ 'settings.accountSecurity.signOutAllOther' | translate }}</span>
                }
              </button>
            }
          </div>
        </div>

        <div class="divide-y divide-neutral-200 dark:divide-dark-border">
          @if (loadingSessions()) {
            <div class="p-8 text-center">
              <sw-spinner size="md" />
              <p class="mt-2 text-sm text-neutral-500">{{ 'settings.accountSecurity.loadingSessions' | translate }}</p>
            </div>
          } @else if (sessions().length === 0) {
            <div class="p-8 text-center">
              <span class="material-icons text-4xl text-neutral-300 dark:text-neutral-600">devices</span>
              <p class="mt-2 text-sm text-neutral-500">{{ 'settings.accountSecurity.noActiveSessions' | translate }}</p>
            </div>
          } @else {
            @for (session of sessions(); track session.id) {
              <div class="p-4 flex items-center gap-4 hover:bg-neutral-50 dark:hover:bg-dark-elevated transition-colors">
                <!-- Device Icon -->
                <div class="flex-shrink-0 w-10 h-10 rounded-full bg-neutral-100 dark:bg-dark-elevated flex items-center justify-center">
                  <span class="material-icons text-neutral-500 dark:text-neutral-400">
                    {{ getDeviceIcon(session.deviceType) }}
                  </span>
                </div>

                <!-- Session Details -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate">
                      {{ session.browser }} {{ 'settings.accountSecurity.on' | translate }} {{ session.deviceName }}
                    </p>
                    @if (session.isCurrent) {
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                        {{ 'settings.accountSecurity.currentSession' | translate }}
                      </span>
                    }
                  </div>
                  <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {{ session.ipAddress }}
                    @if (session.location) {
                      <span class="mx-1">&bull;</span>
                      {{ session.location }}
                    }
                  </p>
                  <p class="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                    {{ 'settings.accountSecurity.lastActive' | translate }}: {{ formatDate(session.lastActiveAt) }}
                  </p>
                </div>

                <!-- Revoke Button -->
                @if (!session.isCurrent) {
                  <button
                    type="button"
                    (click)="revokeSession(session)"
                    [disabled]="revokingSessionId() === session.id"
                    class="flex-shrink-0 p-2 text-neutral-400 hover:text-error-500 dark:hover:text-error-400 transition-colors rounded-lg hover:bg-error-50 dark:hover:bg-error-900/20"
                    [title]="'settings.accountSecurity.revokeSession' | translate"
                  >
                    @if (revokingSessionId() === session.id) {
                      <sw-spinner size="sm" />
                    } @else {
                      <span class="material-icons text-xl">close</span>
                    }
                  </button>
                }
              </div>
            }
          }
        </div>
      </div>
    </div>
  `
})
export class AccountSecurityComponent {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly settingsService = inject(SettingsService);
  private readonly authService = inject(AuthService);
  private readonly dialogService = inject(DialogService);
  private readonly toast = inject(ToastService);

  readonly currentUser = toSignal(this.store.select(selectCurrentUser));

  // Password change state
  changingPassword = signal(false);
  passwordForm: FormGroup;

  // MFA state
  showMfaSetup = signal(false);
  mfaSetupData = signal<MfaSetupResponse | null>(null);
  qrCodeDataUrl = signal<string | null>(null);
  settingUpMfa = signal(false);
  verifyingMfa = signal(false);
  mfaVerifyCode = '';

  showDisableMfa = signal(false);
  disablingMfa = signal(false);
  mfaDisableCode = '';

  // Session management state
  sessions = signal<ActiveSession[]>([]);
  loadingSessions = signal(false);
  revokingSessionId = signal<string | null>(null);
  revokingAllSessions = signal(false);

  constructor() {
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    // Generate QR code when MFA setup data is received
    effect(() => {
      const data = this.mfaSetupData();
      if (data?.qrCodeUrl) {
        this.generateQrCode(data.qrCodeUrl);
      } else {
        this.qrCodeDataUrl.set(null);
      }
    });

    // Load sessions on init
    this.loadSessions();
  }

  loadSessions(): void {
    this.loadingSessions.set(true);
    this.authService.getActiveSessions().pipe(
      catchError(err => {
        console.error('Error loading sessions:', err);
        return of([]);
      }),
      finalize(() => this.loadingSessions.set(false))
    ).subscribe(sessions => {
      this.sessions.set(sessions);
    });
  }

  getDeviceIcon(deviceType: string): string {
    switch (deviceType) {
      case 'desktop': return 'computer';
      case 'mobile': return 'smartphone';
      case 'tablet': return 'tablet_android';
      default: return 'devices';
    }
  }

  formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch {
      return dateStr;
    }
  }

  async revokeSession(session: ActiveSession): Promise<void> {
    const dialogRef = this.dialogService.open<ConfirmActionDialogComponent, boolean>(ConfirmActionDialogComponent, {
      data: {
        title: 'Revoke Session',
        message: `Are you sure you want to sign out the session on ${session.deviceName}?`,
        confirmText: 'Sign Out',
        confirmVariant: 'danger'
      }
    });

    const confirmed = await dialogRef.afterClosed();
    if (confirmed) {
      this.revokingSessionId.set(session.id);
      this.authService.revokeSession(session.id).pipe(
        catchError(err => {
          console.error('Error revoking session:', err);
          this.toast.error('Failed to revoke session');
          return of(null);
        }),
        finalize(() => this.revokingSessionId.set(null))
      ).subscribe(result => {
        if (result !== null) {
          this.toast.success('Session revoked successfully');
          this.sessions.update(sessions => sessions.filter(s => s.id !== session.id));
        }
      });
    }
  }

  async revokeAllOtherSessions(): Promise<void> {
    const dialogRef = this.dialogService.open<ConfirmActionDialogComponent, boolean>(ConfirmActionDialogComponent, {
      data: {
        title: 'Sign Out All Other Sessions',
        message: 'Are you sure you want to sign out all other sessions? This will log you out from all other devices.',
        confirmText: 'Sign Out All',
        confirmVariant: 'danger'
      }
    });

    const confirmed = await dialogRef.afterClosed();
    if (confirmed) {
      this.revokingAllSessions.set(true);
      this.authService.revokeAllOtherSessions().pipe(
        catchError(err => {
          console.error('Error revoking all sessions:', err);
          this.toast.error('Failed to revoke sessions');
          return of(null);
        }),
        finalize(() => this.revokingAllSessions.set(false))
      ).subscribe(result => {
        if (result !== null) {
          this.toast.success('All other sessions have been signed out');
          this.sessions.update(sessions => sessions.filter(s => s.isCurrent));
        }
      });
    }
  }

  private async generateQrCode(otpauthUrl: string): Promise<void> {
    try {
      const dataUrl = await QRCode.toDataURL(otpauthUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      this.qrCodeDataUrl.set(dataUrl);
    } catch (err) {
      console.error('Failed to generate QR code:', err);
      this.toast.error('Failed to generate QR code');
    }
  }

  private passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) return;

    this.changingPassword.set(true);
    const values = this.passwordForm.value;

    this.settingsService.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      confirmPassword: values.confirmPassword
    }).pipe(
      catchError(err => {
        console.error('Error changing password:', err);
        const message = err.error?.message || 'Failed to change password';
        this.toast.error(message);
        return of(null);
      }),
      finalize(() => this.changingPassword.set(false))
    ).subscribe(result => {
      if (result !== null) {
        this.toast.success('Password changed successfully');
        this.passwordForm.reset();
      }
    });
  }

  startMfaSetup(): void {
    const userId = this.currentUser()?.userId;
    if (!userId) return;

    this.settingUpMfa.set(true);

    this.settingsService.setupMfa(userId).pipe(
      catchError(err => {
        console.error('Error setting up MFA:', err);
        this.toast.error('Failed to setup 2FA');
        return of(null);
      }),
      finalize(() => this.settingUpMfa.set(false))
    ).subscribe(data => {
      if (data) {
        this.mfaSetupData.set(data);
        this.showMfaSetup.set(true);
      }
    });
  }

  verifyMfaSetup(): void {
    const userId = this.currentUser()?.userId;
    if (!userId || this.mfaVerifyCode.length !== 6) return;

    this.verifyingMfa.set(true);

    this.settingsService.verifyMfaSetup(userId, this.mfaVerifyCode).pipe(
      catchError(err => {
        console.error('Error verifying MFA:', err);
        this.toast.error('Invalid verification code');
        return of(null);
      }),
      finalize(() => this.verifyingMfa.set(false))
    ).subscribe(result => {
      if (result !== null) {
        this.toast.success('Two-factor authentication enabled');
        this.store.dispatch(loadCurrentUser());
        this.cancelMfaSetup();
      }
    });
  }

  cancelMfaSetup(): void {
    this.showMfaSetup.set(false);
    this.mfaSetupData.set(null);
    this.qrCodeDataUrl.set(null);
    this.mfaVerifyCode = '';
  }

  disableMfa(): void {
    const userId = this.currentUser()?.userId;
    if (!userId || this.mfaDisableCode.length !== 6) return;

    this.disablingMfa.set(true);

    this.settingsService.disableMfa(userId, this.mfaDisableCode).pipe(
      catchError(err => {
        console.error('Error disabling MFA:', err);
        this.toast.error('Invalid verification code');
        return of(null);
      }),
      finalize(() => this.disablingMfa.set(false))
    ).subscribe(result => {
      if (result !== null) {
        this.toast.success('Two-factor authentication disabled');
        this.store.dispatch(loadCurrentUser());
        this.showDisableMfa.set(false);
        this.mfaDisableCode = '';
      }
    });
  }
}
