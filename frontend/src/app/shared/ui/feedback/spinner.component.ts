import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'sw-spinner',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [ngClass]="spinnerClasses" role="status" aria-label="Loading">
      <span class="sr-only">Loading...</span>
    </div>
  `,
  styles: [`
    :host {
      display: inline-flex;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
  `]
})
export class SpinnerComponent {
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() color: 'primary' | 'white' | 'neutral' = 'primary';

  get spinnerClasses(): string {
    const sizes: Record<string, string> = {
      sm: 'w-4 h-4 border-2',
      md: 'w-6 h-6 border-2',
      lg: 'w-8 h-8 border-[3px]',
      xl: 'w-12 h-12 border-4'
    };

    const colors: Record<string, string> = {
      primary: 'border-neutral-200 border-t-primary-500 dark:border-dark-border dark:border-t-primary-400',
      white: 'border-white/30 border-t-white',
      neutral: 'border-neutral-200 border-t-neutral-600 dark:border-dark-border dark:border-t-neutral-400'
    };

    return `animate-spin rounded-full ${sizes[this.size]} ${colors[this.color]}`;
  }
}
