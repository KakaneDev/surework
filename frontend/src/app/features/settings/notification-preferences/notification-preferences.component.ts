import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import {
  NotificationSettingsService,
  GroupedUserPreferencesResponse,
  UserCategoryGroup,
  UserPreferenceResponse,
  NotificationType
} from '@core/services/notification-settings.service';
import { SpinnerComponent, ToastService } from '@shared/ui';

type ChannelType = 'email' | 'sms' | 'inApp';

@Component({
  selector: 'app-notification-preferences',
  standalone: true,
  imports: [CommonModule, TranslateModule, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
        <div class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{{ 'settings.notificationPreferences.title' | translate }}</h2>
              <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                {{ 'settings.notificationPreferences.description' | translate }}
              </p>
            </div>
            @if (saving()) {
              <div class="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                <sw-spinner size="sm" />
                <span>{{ 'common.saving' | translate }}</span>
              </div>
            }
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-16 gap-4" aria-live="polite" aria-busy="true">
          <sw-spinner size="lg" />
          <p class="text-neutral-500 dark:text-neutral-400">{{ 'settings.notificationPreferences.loading' | translate }}</p>
        </div>
      } @else if (error()) {
        <div class="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-xl p-6" role="alert" aria-live="assertive">
          <div class="flex items-center gap-3">
            <span class="material-icons text-danger-600 dark:text-danger-400" aria-hidden="true">error_outline</span>
            <div>
              <p class="font-medium text-danger-800 dark:text-danger-200">{{ 'settings.notificationPreferences.loadError' | translate }}</p>
              <p class="text-sm text-danger-600 dark:text-danger-400">{{ error() }}</p>
            </div>
          </div>
          <button
            (click)="loadPreferences()"
            class="mt-4 px-4 py-2 min-h-[44px] bg-danger-600 hover:bg-danger-700 active:bg-danger-800 text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-danger-500 focus-visible:ring-offset-2"
          >
            {{ 'common.retry' | translate }}
          </button>
        </div>
      } @else {
        <!-- Channel Legend -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          <div class="p-4 border-b border-neutral-200 dark:border-dark-border">
            <h3 class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{{ 'settings.notificationPreferences.deliveryChannels' | translate }}</h3>
          </div>
          <div class="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <span class="material-icons text-blue-600 dark:text-blue-400 text-lg" aria-hidden="true">email</span>
              </div>
              <div>
                <p class="text-sm font-medium text-neutral-800 dark:text-neutral-100">{{ 'settings.notificationPreferences.channelEmail' | translate }}</p>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ 'settings.notificationPreferences.channelEmailDesc' | translate }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <span class="material-icons text-green-600 dark:text-green-400 text-lg" aria-hidden="true">sms</span>
              </div>
              <div>
                <p class="text-sm font-medium text-neutral-800 dark:text-neutral-100">{{ 'settings.notificationPreferences.channelSms' | translate }}</p>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ 'settings.notificationPreferences.channelSmsDesc' | translate }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <span class="material-icons text-purple-600 dark:text-purple-400 text-lg" aria-hidden="true">notifications_active</span>
              </div>
              <div>
                <p class="text-sm font-medium text-neutral-800 dark:text-neutral-100">{{ 'settings.notificationPreferences.channelInApp' | translate }}</p>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ 'settings.notificationPreferences.channelInAppDesc' | translate }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Categories -->
        @for (category of preferences()?.categories ?? []; track category.name) {
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
            <div class="p-4 border-b border-neutral-200 dark:border-dark-border flex items-center gap-3">
              <span class="material-icons text-neutral-400" aria-hidden="true">{{ category.icon }}</span>
              <h3 class="text-base font-semibold text-neutral-800 dark:text-neutral-100">{{ 'settings.notificationPreferences.category.' + category.name | translate }}</h3>
            </div>

            <div class="divide-y divide-neutral-200 dark:divide-dark-border" role="list" [attr.aria-label]="(category.name + '_notificationPreferences' | translate)">
              @for (pref of category.preferences; track pref.type) {
                <div class="p-4" role="listitem" [class.bg-neutral-50]="pref.mandatory" [class.dark:bg-dark-elevated]="pref.mandatory">
                  <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 flex-wrap">
                        <p class="font-medium text-neutral-800 dark:text-neutral-100">{{ pref.displayName }}</p>
                        @if (pref.mandatory) {
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                            <span class="material-icons text-xs align-middle" aria-hidden="true">lock</span>
                            {{ 'settings.notificationPreferences.required' | translate }}
                          </span>
                        }
                      </div>
                      <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{{ pref.description }}</p>
                    </div>

                    <div class="flex items-center gap-4 sm:gap-6">
                      <!-- Email Toggle -->
                      <div class="flex flex-col items-center gap-1 min-w-[44px]">
                        <span class="material-icons text-blue-600 dark:text-blue-400 text-sm" aria-hidden="true">email</span>
                        @if (!pref.emailEnabled) {
                          <span class="material-icons text-neutral-300 dark:text-neutral-600 text-lg" [attr.aria-label]="'settings.notificationPreferences.emailNotAvailable' | translate">block</span>
                        } @else if (pref.mandatory) {
                          <span class="material-icons text-blue-600 dark:text-blue-400 text-lg" [attr.aria-label]="'settings.notificationPreferences.emailRequired' | translate">check_circle</span>
                        } @else {
                          <label
                            class="relative inline-flex items-center justify-center cursor-pointer min-w-[44px] min-h-[44px]"
                            [attr.aria-label]="('settings.notificationPreferences.enableChannel' | translate: { channel: 'Email', notification: pref.displayName })"
                          >
                            <input
                              type="checkbox"
                              [checked]="!pref.emailDisabled"
                              [disabled]="saving()"
                              (change)="toggleChannel(pref, 'email', $event)"
                              class="sr-only peer"
                            />
                            <div class="w-9 h-5 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-offset-dark-surface rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:left-[calc(50%-18px+2px)] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                          </label>
                        }
                      </div>

                      <!-- SMS Toggle -->
                      <div class="flex flex-col items-center gap-1 min-w-[44px]">
                        <span class="material-icons text-green-600 dark:text-green-400 text-sm" aria-hidden="true">sms</span>
                        @if (!pref.smsEnabled) {
                          <span class="material-icons text-neutral-300 dark:text-neutral-600 text-lg" [attr.aria-label]="'settings.notificationPreferences.smsNotAvailable' | translate">block</span>
                        } @else if (pref.mandatory) {
                          <span class="material-icons text-green-600 dark:text-green-400 text-lg" [attr.aria-label]="'settings.notificationPreferences.smsRequired' | translate">check_circle</span>
                        } @else {
                          <label
                            class="relative inline-flex items-center justify-center cursor-pointer min-w-[44px] min-h-[44px]"
                            [attr.aria-label]="('settings.notificationPreferences.enableChannel' | translate: { channel: 'SMS', notification: pref.displayName })"
                          >
                            <input
                              type="checkbox"
                              [checked]="!pref.smsDisabled"
                              [disabled]="saving()"
                              (change)="toggleChannel(pref, 'sms', $event)"
                              class="sr-only peer"
                            />
                            <div class="w-9 h-5 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-offset-dark-surface rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:left-[calc(50%-18px+2px)] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                          </label>
                        }
                      </div>

                      <!-- In-App Toggle -->
                      <div class="flex flex-col items-center gap-1 min-w-[44px]">
                        <span class="material-icons text-purple-600 dark:text-purple-400 text-sm" aria-hidden="true">notifications_active</span>
                        @if (!pref.inAppEnabled) {
                          <span class="material-icons text-neutral-300 dark:text-neutral-600 text-lg" [attr.aria-label]="'settings.notificationPreferences.inAppNotAvailable' | translate">block</span>
                        } @else if (pref.mandatory) {
                          <span class="material-icons text-purple-600 dark:text-purple-400 text-lg" [attr.aria-label]="'settings.notificationPreferences.inAppRequired' | translate">check_circle</span>
                        } @else {
                          <label
                            class="relative inline-flex items-center justify-center cursor-pointer min-w-[44px] min-h-[44px]"
                            [attr.aria-label]="('settings.notificationPreferences.enableChannel' | translate: { channel: 'InApp', notification: pref.displayName })"
                          >
                            <input
                              type="checkbox"
                              [checked]="!pref.inAppDisabled"
                              [disabled]="saving()"
                              (change)="toggleChannel(pref, 'inApp', $event)"
                              class="sr-only peer"
                            />
                            <div class="w-9 h-5 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-offset-dark-surface rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:left-[calc(50%-18px+2px)] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                          </label>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      }
    </div>
  `
})
export class NotificationPreferencesComponent implements OnInit {
  private readonly settingsService = inject(NotificationSettingsService);
  private readonly toast = inject(ToastService);
  private readonly translateService = inject(TranslateService);

  loading = signal(true);
  error = signal<string | null>(null);
  preferences = signal<GroupedUserPreferencesResponse | null>(null);
  saving = signal(false);

  ngOnInit(): void {
    this.loadPreferences();
  }

  loadPreferences(): void {
    this.loading.set(true);
    this.error.set(null);

    this.settingsService.getUserPreferences().pipe(
      catchError(err => {
        console.error('Error loading notification preferences:', err);
        this.error.set(err.message || this.translateService.instant('settings.notificationPreferences.loadError'));
        return of(null);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe(response => {
      if (response) {
        this.preferences.set(response);
      }
    });
  }

  toggleChannel(pref: UserPreferenceResponse, channel: ChannelType, event: Event): void {
    // Checked means NOT disabled
    const checked = (event.target as HTMLInputElement).checked;
    const disabled = !checked;

    // Create update request
    const request = {
      emailDisabled: channel === 'email' ? disabled : pref.emailDisabled,
      smsDisabled: channel === 'sms' ? disabled : pref.smsDisabled,
      inAppDisabled: channel === 'inApp' ? disabled : pref.inAppDisabled
    };

    // Optimistically update the UI
    this.updatePreferenceInState(pref.type, request);

    this.saving.set(true);
    this.settingsService.updateUserPreference(pref.type, request).pipe(
      catchError(err => {
        console.error('Error updating preference:', err);
        this.toast.error(this.translateService.instant('settings.notificationPreferences.updateError'));
        // Revert the change
        this.updatePreferenceInState(pref.type, {
          emailDisabled: pref.emailDisabled,
          smsDisabled: pref.smsDisabled,
          inAppDisabled: pref.inAppDisabled
        });
        return of(null);
      }),
      finalize(() => this.saving.set(false))
    ).subscribe(result => {
      if (result) {
        this.toast.success(this.translateService.instant('settings.notificationPreferences.updateSuccess'));
      }
    });
  }

  private updatePreferenceInState(type: NotificationType, update: {
    emailDisabled: boolean;
    smsDisabled: boolean;
    inAppDisabled: boolean;
  }): void {
    const current = this.preferences();
    if (!current) return;

    const updated: GroupedUserPreferencesResponse = {
      categories: current.categories.map(cat => ({
        ...cat,
        preferences: cat.preferences.map(p =>
          p.type === type
            ? { ...p, ...update }
            : p
        )
      }))
    };

    this.preferences.set(updated);
  }
}
