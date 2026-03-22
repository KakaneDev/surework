import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-kpi-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-card">
      <div class="flex items-center justify-between">
        <div>
          <span class="stats-card-label">{{ label }}</span>
          <h4 class="stats-card-value">{{ formattedValue }}</h4>
        </div>
        <div class="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800">
          <span class="text-gray-600 dark:text-gray-400" [innerHTML]="safeIcon"></span>
        </div>
      </div>
      @if (trend !== undefined) {
        <div class="mt-3 flex items-center gap-1.5">
          @if (trend > 0) {
            <svg class="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
            </svg>
          } @else if (trend < 0) {
            <svg class="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
            </svg>
          }
          <span [class]="trend >= 0 ? 'text-emerald-600' : 'text-red-600'" class="text-sm font-medium">
            {{ trend > 0 ? '+' : '' }}{{ trend }}%
          </span>
          <span class="text-sm text-gray-500 dark:text-gray-400">vs last month</span>
        </div>
      }
    </div>
  `
})
export class KpiStatsComponent {
  private sanitizer = inject(DomSanitizer);

  @Input() label!: string;
  @Input() value!: string | number;
  @Input() trend?: number;
  @Input() icon = '';
  @Input() isCurrency = false;

  get formattedValue(): string {
    if (typeof this.value === 'number' && this.isCurrency) {
      return `R${this.value.toLocaleString('en-ZA')}`;
    }
    return String(this.value);
  }

  get safeIcon(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.icon);
  }
}
