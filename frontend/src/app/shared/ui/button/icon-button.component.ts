import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'sw-icon-button',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [ngClass]="buttonClasses"
      [attr.aria-label]="ariaLabel"
      [attr.aria-busy]="loading"
      (click)="handleClick($event)"
    >
      @if (loading) {
        <span class="sw-spinner" [ngClass]="spinnerSizeClass"></span>
      } @else {
        <ng-content />
      }
    </button>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class IconButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' = 'ghost';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() ariaLabel = '';

  @Output() clicked = new EventEmitter<MouseEvent>();

  get buttonClasses(): string {
    // TailAdmin style with teal primary
    const base = 'inline-flex items-center justify-center rounded-lg transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed';

    const sizes: Record<string, string> = {
      sm: 'p-1.5',
      md: 'p-2',
      lg: 'p-3'
    };

    const variants: Record<string, string> = {
      primary: 'bg-primary-500 text-white hover:bg-primary-600',
      secondary: 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 dark:bg-dark-surface dark:border-dark-border dark:text-neutral-300 dark:hover:bg-dark-elevated',
      outline: 'border border-neutral-300 bg-transparent text-neutral-700 hover:bg-neutral-50 dark:border-dark-border dark:text-neutral-300 dark:hover:bg-dark-elevated',
      ghost: 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-dark-elevated',
      danger: 'text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 focus:ring-error-500/50'
    };

    return `${base} ${sizes[this.size]} ${variants[this.variant]}`;
  }

  get spinnerSizeClass(): string {
    const spinnerSizes: Record<string, string> = {
      sm: 'sw-spinner-sm',
      md: 'sw-spinner-sm',
      lg: 'sw-spinner-md'
    };
    return spinnerSizes[this.size];
  }

  handleClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit(event);
    }
  }
}
