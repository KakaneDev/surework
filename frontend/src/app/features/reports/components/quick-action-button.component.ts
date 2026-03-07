import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type QuickActionVariant = 'blue' | 'green' | 'orange' | 'purple' | 'red';

@Component({
  selector: 'app-quick-action-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      class="group relative flex items-center gap-3 px-5 py-3 rounded-xl font-medium text-white transition-gpu duration-normal hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      [class]="getButtonClasses()"
      [disabled]="disabled || loading"
      (click)="handleClick()"
    >
      <!-- Background gradient -->
      <div class="absolute inset-0 rounded-xl transition-opacity duration-normal" [class]="getGradientClasses()"></div>

      <!-- Shimmer effect on hover -->
      <div class="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-normal bg-gradient-to-r from-transparent via-white to-transparent"></div>

      <!-- Content -->
      <div class="relative flex items-center gap-3">
        @if (loading) {
          <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        } @else if (icon) {
          <span class="material-icons text-xl transition-transform duration-fast group-hover:scale-110">{{ icon }}</span>
        }
        <span class="whitespace-nowrap">{{ label }}</span>
      </div>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickActionButtonComponent {
  @Input() label = 'Action';
  @Input() icon?: string;
  @Input() variant: QuickActionVariant = 'blue';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  @Output() actionClick = new EventEmitter<void>();

  private readonly gradients: Record<QuickActionVariant, { gradient: string; ring: string }> = {
    blue: { gradient: 'bg-gradient-to-br from-blue-500 to-blue-700', ring: 'focus:ring-blue-500' },
    green: { gradient: 'bg-gradient-to-br from-primary-500 to-primary-700', ring: 'focus:ring-primary-500' },
    orange: { gradient: 'bg-gradient-to-br from-orange-500 to-orange-700', ring: 'focus:ring-orange-500' },
    purple: { gradient: 'bg-gradient-to-br from-purple-500 to-purple-700', ring: 'focus:ring-purple-500' },
    red: { gradient: 'bg-gradient-to-br from-error-500 to-error-700', ring: 'focus:ring-error-500' }
  };

  getButtonClasses(): string {
    const ringClass = this.gradients[this.variant].ring;
    let sizeClasses = '';

    switch (this.size) {
      case 'sm':
        sizeClasses = 'text-sm px-4 py-2';
        break;
      case 'lg':
        sizeClasses = 'text-base px-6 py-4';
        break;
      default:
        sizeClasses = 'text-sm px-5 py-3';
    }

    return `${ringClass} ${sizeClasses}`;
  }

  getGradientClasses(): string {
    return this.gradients[this.variant].gradient;
  }

  handleClick(): void {
    if (!this.disabled && !this.loading) {
      this.actionClick.emit();
    }
  }
}
