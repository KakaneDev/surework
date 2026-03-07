import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'sw-card',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [ngClass]="cardClasses">
      @if (hasHeader) {
        <div class="flex items-center justify-between mb-4 pb-4 border-b border-neutral-200 dark:border-dark-border">
          <div>
            @if (title) {
              <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {{ title }}
              </h3>
            }
            @if (subtitle) {
              <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                {{ subtitle }}
              </p>
            }
          </div>
          <ng-content select="[cardActions]" />
        </div>
      }

      <ng-content />

      @if (hasFooter) {
        <div class="mt-4 pt-4 border-t border-neutral-200 dark:border-dark-border">
          <ng-content select="[cardFooter]" />
        </div>
      }
    </div>
  `
})
export class CardComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
  @Input() hover = false;
  @Input() hasHeader = false;
  @Input() hasFooter = false;

  get cardClasses(): string {
    // TailAdmin style with subtle shadow and border
    const base = 'bg-white rounded-xl shadow-sm border border-neutral-200 dark:bg-dark-surface dark:border-dark-border transition-shadow duration-200';
    const paddingMap: Record<string, string> = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    };
    const hoverClass = this.hover ? 'hover:shadow cursor-pointer' : '';

    return `${base} ${paddingMap[this.padding]} ${hoverClass}`;
  }
}
