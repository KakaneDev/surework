import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from './button.component';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div class="error-state">
      <div class="error-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4m0 4h.01"/>
        </svg>
      </div>
      <h3 class="error-title">{{ title }}</h3>
      <p class="error-message">{{ message }}</p>
      @if (showRetry) {
        <app-button variant="outline" (onClick)="retry.emit()">
          <svg class="retry-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Try Again
        </app-button>
      }
    </div>
  `,
  styles: [`
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 2rem;
      text-align: center;
      gap: 1rem;
    }

    .error-icon {
      color: var(--text-muted);
      opacity: 0.4;
    }

    .error-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .error-message {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin: 0;
      max-width: 24rem;
    }

    .retry-icon {
      margin-right: 0.5rem;
    }
  `]
})
export class ErrorStateComponent {
  @Input() title = 'Something went wrong';
  @Input() message = 'We couldn\'t load the data. Please try again.';
  @Input() showRetry = true;
  @Output() retry = new EventEmitter<void>();
}
