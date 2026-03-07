import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cardClasses">
      @if (title || subtitle) {
        <div class="mb-6">
          @if (title) {
            <h3 class="text-base font-semibold text-gray-900 dark:text-white/90">{{ title }}</h3>
          }
          @if (subtitle) {
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ subtitle }}</p>
          }
        </div>
      }
      <ng-content></ng-content>
    </div>
  `
})
export class CardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() noPadding = false;
  @Input() hover = false;

  get cardClasses(): string {
    // TailAdmin: rounded-xl with shadow-card
    const baseClasses = 'rounded-xl border border-gray-200 bg-white shadow-card dark:border-gray-800 dark:bg-white/[0.03]';
    const paddingClass = this.noPadding ? '' : 'p-6';
    const hoverClass = this.hover ? 'hover:shadow-card-hover transition-all duration-200 cursor-pointer' : '';

    return `${baseClasses} ${paddingClass} ${hoverClass}`;
  }
}
