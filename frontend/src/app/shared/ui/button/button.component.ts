import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, HostBinding } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'sw-button',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [ngClass]="buttonClasses"
      [attr.aria-label]="ariaLabel || null"
      (click)="handleClick($event)"
    >
      @if (loading) {
        <span class="sw-spinner sw-spinner-sm mr-2"></span>
      }
      <ng-content />
    </button>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    :host(.sw-btn-block) button {
      width: 100%;
    }
  `]
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() loading = false;
  @Input() disabled = false;
  @Input() block = false;
  @Input() ariaLabel = '';

  @Output() clicked = new EventEmitter<MouseEvent>();

  @HostBinding('class.sw-btn-block')
  get isBlock(): boolean {
    return this.block;
  }

  get buttonClasses(): string {
    // TailAdmin style with teal primary and smooth transitions
    const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed';

    const sizes: Record<string, string> = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2.5'
    };

    const variants: Record<string, string> = {
      primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700',
      secondary: 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100 dark:bg-dark-surface dark:border-dark-border dark:text-neutral-200 dark:hover:bg-dark-elevated',
      outline: 'border border-neutral-300 bg-transparent text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100 dark:border-dark-border dark:text-neutral-300 dark:hover:bg-dark-elevated',
      ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-dark-elevated',
      danger: 'bg-error-500 text-white hover:bg-error-600 active:bg-error-700 focus:ring-error-500/50',
      link: 'bg-transparent text-primary-500 hover:text-primary-600 hover:underline dark:text-primary-400 dark:hover:text-primary-300 !px-0 !py-0'
    };

    return `${base} ${sizes[this.size]} ${variants[this.variant]}`;
  }

  handleClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit(event);
    }
  }
}
