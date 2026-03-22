import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import {
  NotificationSettingsService,
  GroupedSettingsResponse,
  CategoryGroup,
  TenantSettingResponse,
  NotificationType
} from '@core/services/notification-settings.service';
import { SpinnerComponent, ToastService } from '@shared/ui';

type ChannelType = 'email' | 'sms' | 'inApp';

@Component({
  selector: 'app-notification-channels',
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
              <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{{ 'settings.notificationChannels.pageTitle' | translate }}</h2>
              <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                {{ 'settings.notificationChannels.pageDescription' | translate }}
              </p>
            </div>
            @if (saving()) {
              <div class="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                <sw-spinner size="sm" />
                <span>{{ 'settings.notificationChannels.saving' | translate }}</span>
              </div>
            }
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-16 gap-4" aria-live="polite" aria-busy="true">
          <sw-spinner size="lg" />
          <p class="text-neutral-500 dark:text-neutral-400">{{ 'settings.notificationChannels.loadingSettings' | translate }}</p>
        </div>
      } @else if (error()) {
        <div class="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-xl p-6" role="alert" aria-live="assertive">
          <div class="flex items-center gap-3">
            <span class="material-icons text-danger-600 dark:text-danger-400" aria-hidden="true">error_outline</span>
            <div>
              <p class="font-medium text-danger-800 dark:text-danger-200">{{ 'settings.notificationChannels.failedToLoadSettings' | translate }}</p>
              <p class="text-sm text-danger-600 dark:text-danger-400">{{ error() }}</p>
            </div>
          </div>
          <button
            (click)="loadSettings()"
            class="mt-4 px-4 py-2 min-h-[44px] bg-danger-600 hover:bg-danger-700 active:bg-danger-800 text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-danger-500 focus-visible:ring-offset-2"
          >
            {{ 'settings.notificationChannels.retry' | translate }}
          </button>
        </div>
      } @else {
        <!-- Channel Legend -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          <div class="p-4 border-b border-neutral-200 dark:border-dark-border">
            <h3 class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{{ 'settings.notificationChannels.deliveryChannelsLabel' | translate }}</h3>
          </div>
          <div class="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <span class="material-icons text-blue-600 dark:text-blue-400 text-lg" aria-hidden="true">email</span>
              </div>
              <div>
                <p class="text-sm font-medium text-neutral-800 dark:text-neutral-100">{{ 'settings.notificationChannels.emailLabel' | translate }}</p>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ 'settings.notificationChannels.emailDescription' | translate }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <span class="material-icons text-green-600 dark:text-green-400 text-lg" aria-hidden="true">sms</span>
              </div>
              <div>
                <p class="text-sm font-medium text-neutral-800 dark:text-neutral-100">{{ 'settings.notificationChannels.smsLabel' | translate }}</p>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ 'settings.notificationChannels.smsDescription' | translate }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <span class="material-icons text-purple-600 dark:text-purple-400 text-lg" aria-hidden="true">notifications_active</span>
              </div>
              <div>
                <p class="text-sm font-medium text-neutral-800 dark:text-neutral-100">{{ 'settings.notificationChannels.inAppLabel' | translate }}</p>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ 'settings.notificationChannels.inAppDescription' | translate }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Categories -->
        @for (category of settings()?.categories ?? []; track category.name) {
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
            <div class="p-4 border-b border-neutral-200 dark:border-dark-border flex items-center gap-3">
              <span class="material-icons text-neutral-400" aria-hidden="true">{{ category.icon }}</span>
              <h3 class="text-base font-semibold text-neutral-800 dark:text-neutral-100">{{ category.name }}</h3>
            </div>

            <!-- Settings Table -->
            <div class="overflow-x-auto">
              <table class="w-full" role="grid" [attr.aria-label]="category.name + ' notification settings'">
                <thead>
                  <tr class="bg-neutral-50 dark:bg-dark-elevated">
                    <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      {{ 'settings.notificationChannels.notificationType' | translate }}
                    </th>
                    <th scope="col" class="px-4 py-3 text-center text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-24" [attr.aria-label]="'settings.notificationChannels.emailNotifications' | translate">
                      <span class="material-icons text-blue-600 dark:text-blue-400 text-base align-middle" aria-hidden="true">email</span>
                      <span class="sr-only">{{ 'settings.notificationChannels.emailLabel' | translate }}</span>
                    </th>
                    <th scope="col" class="px-4 py-3 text-center text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-24" [attr.aria-label]="'settings.notificationChannels.smsNotifications' | translate">
                      <span class="material-icons text-green-600 dark:text-green-400 text-base align-middle" aria-hidden="true">sms</span>
                      <span class="sr-only">{{ 'settings.notificationChannels.smsLabel' | translate }}</span>
                    </th>
                    <th scope="col" class="px-4 py-3 text-center text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-24" [attr.aria-label]="'settings.notificationChannels.inAppNotifications' | translate">
                      <span class="material-icons text-purple-600 dark:text-purple-400 text-base align-middle" aria-hidden="true">notifications_active</span>
                      <span class="sr-only">{{ 'settings.notificationChannels.inAppLabel' | translate }}</span>
                    </th>
                    <th scope="col" class="px-4 py-3 text-center text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-24">
                      {{ 'settings.notificationChannels.status' | translate }}
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-neutral-200 dark:divide-dark-border">
                  @for (setting of category.settings; track setting.type) {
                    <tr class="hover:bg-neutral-50 dark:hover:bg-dark-elevated active:bg-neutral-100 dark:active:bg-dark-elevated/80 transition-colors">
                      <td class="px-4 py-4">
                        <div>
                          <p class="text-sm font-medium text-neutral-800 dark:text-neutral-100">{{ setting.displayName }}</p>
                          <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ setting.description }}</p>
                        </div>
                      </td>
                      <td class="px-4 py-4 text-center">
                        <label
                          class="relative inline-flex items-center justify-center cursor-pointer min-w-[44px] min-h-[44px]"
                          [attr.aria-label]="('settings.notificationChannels.enableChannelFor' | translate: {channel: ('settings.notificationChannels.emailLabel' | translate), type: setting.displayName})"
                        >
                          <input
                            type="checkbox"
                            [checked]="setting.emailEnabled"
                            [disabled]="saving()"
                            (change)="toggleChannel(setting, 'email', $event)"
                            class="sr-only peer"
                          />
                          <div class="w-9 h-5 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-offset-dark-surface rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:left-[calc(50%-18px+2px)] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                        </label>
                      </td>
                      <td class="px-4 py-4 text-center">
                        <label
                          class="relative inline-flex items-center justify-center cursor-pointer min-w-[44px] min-h-[44px]"
                          [attr.aria-label]="('settings.notificationChannels.enableChannelFor' | translate: {channel: ('settings.notificationChannels.smsLabel' | translate), type: setting.displayName})"
                        >
                          <input
                            type="checkbox"
                            [checked]="setting.smsEnabled"
                            [disabled]="saving()"
                            (change)="toggleChannel(setting, 'sms', $event)"
                            class="sr-only peer"
                          />
                          <div class="w-9 h-5 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-offset-dark-surface rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:left-[calc(50%-18px+2px)] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                        </label>
                      </td>
                      <td class="px-4 py-4 text-center">
                        <label
                          class="relative inline-flex items-center justify-center cursor-pointer min-w-[44px] min-h-[44px]"
                          [attr.aria-label]="('settings.notificationChannels.enableChannelFor' | translate: {channel: ('settings.notificationChannels.inAppLabel' | translate), type: setting.displayName})"
                        >
                          <input
                            type="checkbox"
                            [checked]="setting.inAppEnabled"
                            [disabled]="saving()"
                            (change)="toggleChannel(setting, 'inApp', $event)"
                            class="sr-only peer"
                          />
                          <div class="w-9 h-5 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-offset-dark-surface rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:left-[calc(50%-18px+2px)] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                        </label>
                      </td>
                      <td class="px-4 py-4 text-center">
                        @if (setting.mandatory) {
                          <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                            <span class="material-icons text-sm align-middle" aria-hidden="true">lock</span>
                            {{ 'settings.notificationChannels.required' | translate }}
                          </span>
                        } @else {
                          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                            {{ 'settings.notificationChannels.optional' | translate }}
                          </span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }
    </div>
  `
})
export class NotificationChannelsComponent implements OnInit {
  private readonly settingsService = inject(NotificationSettingsService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  loading = signal(true);
  error = signal<string | null>(null);
  settings = signal<GroupedSettingsResponse | null>(null);
  saving = signal(false);

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading.set(true);
    this.error.set(null);

    this.settingsService.getTenantSettings().pipe(
      catchError(err => {
        console.error('Error loading notification settings:', err);
        this.error.set(err.message || 'Failed to load notification settings');
        return of(null);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe(response => {
      if (response) {
        this.settings.set(response);
      }
    });
  }

  toggleChannel(setting: TenantSettingResponse, channel: ChannelType, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    // Create update request based on current state
    const request = {
      emailEnabled: channel === 'email' ? checked : setting.emailEnabled,
      smsEnabled: channel === 'sms' ? checked : setting.smsEnabled,
      inAppEnabled: channel === 'inApp' ? checked : setting.inAppEnabled
    };

    // Optimistically update the UI
    this.updateSettingInState(setting.type, request);

    this.saving.set(true);
    this.settingsService.updateTenantSetting(setting.type, request).pipe(
      catchError(err => {
        console.error('Error updating setting:', err);
        this.toast.error(this.translate.instant('settings.notificationChannels.failedToUpdateSetting'));
        // Revert the change
        this.updateSettingInState(setting.type, {
          emailEnabled: setting.emailEnabled,
          smsEnabled: setting.smsEnabled,
          inAppEnabled: setting.inAppEnabled
        });
        return of(null);
      }),
      finalize(() => this.saving.set(false))
    ).subscribe(result => {
      if (result) {
        this.toast.success(this.translate.instant('settings.notificationChannels.settingUpdated'));
      }
    });
  }

  private updateSettingInState(type: NotificationType, update: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    inAppEnabled: boolean;
  }): void {
    const current = this.settings();
    if (!current) return;

    const updated: GroupedSettingsResponse = {
      categories: current.categories.map(cat => ({
        ...cat,
        settings: cat.settings.map(s =>
          s.type === type
            ? { ...s, ...update }
            : s
        )
      }))
    };

    this.settings.set(updated);
  }
}
