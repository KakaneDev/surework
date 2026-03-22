import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center text-center p-5 bg-neutral-100 dark:bg-dark-bg">
      <h1 class="text-8xl font-bold text-primary-500 mb-0">404</h1>
      <h2 class="text-2xl font-semibold text-neutral-800 dark:text-neutral-200 mt-2 mb-4">{{ 'errors.notFound' | translate }}</h2>
      <p class="text-neutral-500 mb-6">{{ 'errors.pageNotFoundDescription' | translate }}</p>
      <a routerLink="/dashboard"
         class="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors duration-fast">
        <span class="material-icons">home</span>
        {{ 'errors.goHome' | translate }}
      </a>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotFoundComponent {}
