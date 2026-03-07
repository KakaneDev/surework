import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly themeSignal = signal<Theme>('system');
  private readonly effectiveThemeSignal = signal<'light' | 'dark'>('light');

  readonly theme = this.themeSignal.asReadonly();
  readonly effectiveTheme = this.effectiveThemeSignal.asReadonly();
  readonly isDark = () => this.effectiveThemeSignal() === 'dark';

  private mediaQuery: MediaQueryList | null = null;

  constructor() {
    if (this.isBrowser) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      // Load saved preference
      const saved = localStorage.getItem('sw-theme') as Theme | null;
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        this.themeSignal.set(saved);
      }

      // Listen for system preference changes
      this.mediaQuery.addEventListener('change', this.handleSystemChange);

      // Apply theme when signal changes
      effect(() => {
        this.applyTheme(this.themeSignal());
      }, { allowSignalWrites: true });

      // Initial application
      this.applyTheme(this.themeSignal());
    }
  }

  private handleSystemChange = (e: MediaQueryListEvent) => {
    if (this.themeSignal() === 'system') {
      this.applyEffectiveTheme(e.matches ? 'dark' : 'light');
    }
  };

  setTheme(theme: Theme): void {
    if (!this.isBrowser) return;

    this.themeSignal.set(theme);
    localStorage.setItem('sw-theme', theme);
    this.applyTheme(theme);
  }

  toggleTheme(): void {
    const current = this.effectiveThemeSignal();
    this.setTheme(current === 'light' ? 'dark' : 'light');
  }

  private applyTheme(theme: Theme): void {
    if (!this.isBrowser) return;

    let effective: 'light' | 'dark';

    if (theme === 'system') {
      effective = this.mediaQuery?.matches ? 'dark' : 'light';
    } else {
      effective = theme;
    }

    this.applyEffectiveTheme(effective);
  }

  private applyEffectiveTheme(theme: 'light' | 'dark'): void {
    if (!this.isBrowser) return;

    this.effectiveThemeSignal.set(theme);

    const html = document.documentElement;
    html.classList.remove('light', 'dark');
    html.classList.add(theme);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#1a1a1a' : '#ffffff');
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser && this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.handleSystemChange);
    }
  }
}
