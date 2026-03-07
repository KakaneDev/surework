import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-9999 flex items-center justify-center overflow-y-auto overflow-x-hidden p-4">
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
          (click)="closeOnBackdrop && close.emit()"
        ></div>

        <!-- Modal -->
        <div [class]="modalClasses" role="dialog" aria-modal="true">
          <!-- Header -->
          @if (title || showCloseButton) {
            <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              @if (title) {
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white/90">{{ title }}</h3>
              }
              @if (showCloseButton) {
                <button
                  type="button"
                  class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-white/[0.05] dark:hover:text-gray-300 transition-colors"
                  (click)="close.emit()"
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              }
            </div>
          }

          <!-- Body -->
          <div class="p-6">
            <ng-content></ng-content>
          </div>

          <!-- Footer -->
          <ng-content select="[modal-footer]"></ng-content>
        </div>
      </div>
    }
  `
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title?: string;
  @Input() size: ModalSize = 'md';
  @Input() showCloseButton = true;
  @Input() closeOnBackdrop = true;
  @Input() closeOnEscape = true;
  @Output() close = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen && this.closeOnEscape) {
      this.close.emit();
    }
  }

  get modalClasses(): string {
    // TailAdmin: rounded-2xl with shadow-theme-xl
    const baseClasses = 'relative z-50 w-full rounded-2xl border border-gray-200 bg-white shadow-theme-xl dark:border-gray-800 dark:bg-gray-dark animate-slide-up';

    const sizeClasses: Record<ModalSize, string> = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'max-w-4xl'
    };

    return `${baseClasses} ${sizeClasses[this.size]}`;
  }
}
