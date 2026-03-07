import { Component, Input, Output, EventEmitter, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DropdownItem {
  label: string;
  value: string;
  icon?: string;
  disabled?: boolean;
  divider?: boolean;
}

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative inline-block">
      <div (click)="toggle()">
        <ng-content select="[trigger]"></ng-content>
      </div>

      @if (isOpen) {
        <div
          [class]="dropdownClasses"
          role="menu"
          aria-orientation="vertical"
        >
          @for (item of items; track item.value) {
            @if (item.divider) {
              <div class="my-1 border-t border-gray-200 dark:border-gray-800"></div>
            } @else {
              <button
                type="button"
                class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.05] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                [disabled]="item.disabled"
                (click)="selectItem(item)"
                role="menuitem"
              >
                {{ item.label }}
              </button>
            }
          }
          <ng-content></ng-content>
        </div>
      }
    </div>
  `
})
export class DropdownComponent {
  private elementRef = inject(ElementRef);

  @Input() items: DropdownItem[] = [];
  @Input() position: 'left' | 'right' = 'right';
  @Input() width = 'w-48';
  @Output() select = new EventEmitter<DropdownItem>();

  isOpen = false;

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
  }

  selectItem(item: DropdownItem): void {
    if (!item.disabled) {
      this.select.emit(item);
      this.isOpen = false;
    }
  }

  get dropdownClasses(): string {
    // TailAdmin: rounded-xl with shadow-dropdown
    const baseClasses = `absolute z-50 mt-2 ${this.width} rounded-xl border border-gray-200 bg-white py-1 shadow-dropdown dark:border-gray-800 dark:bg-gray-dark animate-fade-in`;
    const positionClass = this.position === 'left' ? 'left-0' : 'right-0';

    return `${baseClasses} ${positionClass}`;
  }
}
