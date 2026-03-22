import { Component, ChangeDetectionStrategy, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeService, Theme } from '@core/services/theme.service';
import { LanguageService } from '@core/services/language.service';

interface ThemeOption {
  value: Theme;
  labelKey: string;
  icon: string;
  descriptionKey: string;
}

interface DateFormatOption {
  value: string;
  labelKey: string;
  example: string;
}

@Component({
  selector: 'app-appearance',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Theme Selection -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
        <div class="p-6 border-b border-neutral-200 dark:border-dark-border">
          <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{{ 'settings.theme.title' | translate }}</h2>
          <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{{ 'settings.theme.description' | translate }}</p>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            @for (option of themeOptions; track option.value) {
              <button
                type="button"
                (click)="setTheme(option.value)"
                [class]="getThemeButtonClass(option.value)"
              >
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-lg flex items-center justify-center" [class]="getThemeIconClass(option.value)">
                    <span class="material-icons text-2xl">{{ option.icon }}</span>
                  </div>
                  <div class="text-left">
                    <p class="font-medium">{{ option.labelKey | translate }}</p>
                    <p class="text-sm opacity-70">{{ option.descriptionKey | translate }}</p>
                  </div>
                </div>
                @if (themeService.theme() === option.value) {
                  <span class="material-icons text-primary-500">check_circle</span>
                }
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Language Selection -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
        <div class="p-6 border-b border-neutral-200 dark:border-dark-border">
          <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{{ 'settings.language.title' | translate }}</h2>
          <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{{ 'settings.language.description' | translate }}</p>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            @for (lang of languageService.supportedLanguages; track lang.code) {
              <button
                type="button"
                (click)="setLanguage(lang.code)"
                [class]="getLanguageButtonClass(lang.code)"
              >
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" [class]="getLanguageFlagClass(lang.code)">
                    {{ getLanguageFlag(lang.code) }}
                  </div>
                  <div class="text-left">
                    <p class="font-medium">{{ lang.nativeName }}</p>
                    <p class="text-sm opacity-70">{{ lang.name }}</p>
                  </div>
                </div>
                @if (languageService.currentLang() === lang.code) {
                  <span class="material-icons text-primary-500">check_circle</span>
                }
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Date Format Selection -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
        <div class="p-6 border-b border-neutral-200 dark:border-dark-border">
          <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{{ 'settings.dateFormat.title' | translate }}</h2>
          <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{{ 'settings.dateFormat.description' | translate }}</p>
        </div>
        <div class="p-6">
          <div class="space-y-3">
            @for (format of dateFormatOptions; track format.value) {
              <label
                class="flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors"
                [class]="selectedDateFormat() === format.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-neutral-200 dark:border-dark-border hover:border-neutral-300 dark:hover:border-neutral-600'"
              >
                <div class="flex items-center gap-4">
                  <input
                    type="radio"
                    name="dateFormat"
                    [value]="format.value"
                    [checked]="selectedDateFormat() === format.value"
                    (change)="setDateFormat(format.value)"
                    class="w-4 h-4 text-primary-600 border-neutral-300 focus:ring-primary-500"
                  />
                  <div>
                    <p class="font-medium text-neutral-800 dark:text-neutral-100">{{ format.labelKey | translate }}</p>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'common.example' | translate }}: {{ format.example }}</p>
                  </div>
                </div>
              </label>
            }
          </div>
        </div>
      </div>

      <!-- Preview Section -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
        <div class="p-6 border-b border-neutral-200 dark:border-dark-border">
          <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{{ 'settings.preview.title' | translate }}</h2>
          <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{{ 'settings.preview.description' | translate }}</p>
        </div>
        <div class="p-6">
          <div class="p-4 rounded-lg border border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-elevated">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <span class="text-primary-600 dark:text-primary-400 font-semibold">JD</span>
              </div>
              <div>
                <p class="font-medium text-neutral-800 dark:text-neutral-100">John Doe</p>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ formatPreviewDate() }}</p>
              </div>
            </div>
            <p class="text-neutral-600 dark:text-neutral-400">
              {{ 'settings.preview.sampleText' | translate }}
              {{ 'settings.preview.themeSetTo' | translate }} <strong>{{ getThemeLabelKey() | translate }}</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AppearanceComponent implements OnInit {
  readonly themeService = inject(ThemeService);
  readonly languageService = inject(LanguageService);
  private readonly platformId = inject(PLATFORM_ID);

  selectedDateFormat = signal('DD/MM/YYYY');

  readonly themeOptions: ThemeOption[] = [
    { value: 'light', labelKey: 'settings.theme.light', icon: 'light_mode', descriptionKey: 'settings.theme.lightDescription' },
    { value: 'dark', labelKey: 'settings.theme.dark', icon: 'dark_mode', descriptionKey: 'settings.theme.darkDescription' },
    { value: 'system', labelKey: 'settings.theme.system', icon: 'settings_suggest', descriptionKey: 'settings.theme.systemDescription' }
  ];

  readonly dateFormatOptions: DateFormatOption[] = [
    { value: 'DD/MM/YYYY', labelKey: 'settings.dateFormat.dayMonthYear', example: '25/01/2026' },
    { value: 'MM/DD/YYYY', labelKey: 'settings.dateFormat.monthDayYear', example: '01/25/2026' },
    { value: 'YYYY-MM-DD', labelKey: 'settings.dateFormat.yearMonthDay', example: '2026-01-25' }
  ];

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Load saved date format preference
      const savedDateFormat = localStorage.getItem('sw-date-format') || 'DD/MM/YYYY';
      this.selectedDateFormat.set(savedDateFormat);
    }
  }

  setTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
  }

  setLanguage(lang: string): void {
    this.languageService.setLanguage(lang);
  }

  setDateFormat(format: string): void {
    this.selectedDateFormat.set(format);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('sw-date-format', format);
    }
  }

  getThemeButtonClass(theme: Theme): string {
    const baseClasses = 'flex items-center justify-between p-4 rounded-lg border transition-colors';
    if (this.themeService.theme() === theme) {
      return `${baseClasses} border-primary-500 bg-primary-50 dark:bg-primary-900/20`;
    }
    return `${baseClasses} border-neutral-200 dark:border-dark-border hover:border-neutral-300 dark:hover:border-neutral-600`;
  }

  getThemeIconClass(theme: Theme): string {
    switch (theme) {
      case 'light':
        return 'bg-yellow-100 text-yellow-600';
      case 'dark':
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400';
      case 'system':
        return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400';
      default:
        return '';
    }
  }

  getThemeLabelKey(): string {
    return this.themeOptions.find(o => o.value === this.themeService.theme())?.labelKey || 'settings.theme.system';
  }

  getLanguageButtonClass(langCode: string): string {
    const baseClasses = 'flex items-center justify-between p-4 rounded-lg border transition-colors';
    if (this.languageService.currentLang() === langCode) {
      return `${baseClasses} border-primary-500 bg-primary-50 dark:bg-primary-900/20`;
    }
    return `${baseClasses} border-neutral-200 dark:border-dark-border hover:border-neutral-300 dark:hover:border-neutral-600`;
  }

  getLanguageFlagClass(langCode: string): string {
    return 'bg-neutral-100 dark:bg-neutral-800';
  }

  getLanguageFlag(langCode: string): string {
    switch (langCode) {
      case 'en':
        return '🇬🇧';
      case 'af':
        return '🇿🇦';
      case 'zu':
        return '🇿🇦';
      default:
        return '🌐';
    }
  }

  formatPreviewDate(): string {
    const now = new Date();
    const format = this.selectedDateFormat();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();

    switch (format) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      default:
        return `${day}/${month}/${year}`;
    }
  }
}
