import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
}

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);

  private readonly STORAGE_KEY = 'sw-language';
  private readonly DEFAULT_LANG = 'en';

  readonly supportedLanguages: SupportedLanguage[] = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },
    { code: 'zu', name: 'isiZulu', nativeName: 'isiZulu' }
  ];

  readonly currentLang = signal(this.DEFAULT_LANG);

  initialize(): void {
    this.translate.addLangs(this.supportedLanguages.map(l => l.code));
    this.translate.setDefaultLang(this.DEFAULT_LANG);

    const savedLang = this.getSavedLanguage();
    this.setLanguage(savedLang);
  }

  setLanguage(langCode: string): void {
    const validLang = this.supportedLanguages.find(l => l.code === langCode);
    const lang = validLang ? langCode : this.DEFAULT_LANG;

    this.translate.use(lang);
    this.currentLang.set(lang);
    this.saveLanguage(lang);
    this.updateHtmlLang(lang);
  }

  getCurrentLanguage(): SupportedLanguage | undefined {
    return this.supportedLanguages.find(l => l.code === this.currentLang());
  }

  private getSavedLanguage(): string {
    if (typeof localStorage === 'undefined') {
      return this.DEFAULT_LANG;
    }
    return localStorage.getItem(this.STORAGE_KEY) || this.DEFAULT_LANG;
  }

  private saveLanguage(langCode: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, langCode);
    }
  }

  private updateHtmlLang(langCode: string): void {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = langCode;
    }
  }
}
