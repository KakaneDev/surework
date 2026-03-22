import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ElementRef, inject, HostListener, signal, ViewChild, TemplateRef, ViewContainerRef, OnDestroy, AfterViewInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { Overlay, OverlayRef, OverlayModule, ConnectedPosition } from '@angular/cdk/overlay';
import { TemplatePortal, PortalModule } from '@angular/cdk/portal';

let dropdownIdCounter = 0;

@Component({
  selector: 'sw-dropdown',
  standalone: true,
  imports: [NgClass, OverlayModule, PortalModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Trigger -->
    <div
      #trigger
      (click)="toggle()"
      (keydown)="onTriggerKeydown($event)"
      [attr.aria-haspopup]="'menu'"
      [attr.aria-expanded]="isOpen()"
      [attr.aria-controls]="menuId"
    >
      <ng-content select="[trigger]" />
    </div>

    <!-- Menu Template (rendered via CDK Overlay) - TailAdmin style -->
    <ng-template #menuTemplate>
      <div
        #menuContainer
        [id]="menuId"
        class="min-w-[200px] py-2 rounded-xl shadow-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 animate-fade-in"
        role="menu"
        [attr.aria-labelledby]="triggerId"
        (click)="close()"
        (keydown)="onMenuKeydown($event)"
      >
        <ng-content />
      </div>
    </ng-template>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class DropdownComponent implements OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private readonly overlay = inject(Overlay);
  private readonly viewContainerRef = inject(ViewContainerRef);

  @ViewChild('trigger', { static: true }) triggerRef!: ElementRef;
  @ViewChild('menuTemplate', { static: true }) menuTemplate!: TemplateRef<unknown>;

  @Input() align: 'left' | 'right' = 'left';
  @Input() width = 'auto';

  @Output() opened = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  readonly menuId = `sw-dropdown-menu-${++dropdownIdCounter}`;
  readonly triggerId = `sw-dropdown-trigger-${dropdownIdCounter}`;

  isOpen = signal(false);
  private overlayRef: OverlayRef | null = null;
  private focusedItemIndex = -1;

  toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  open(): void {
    if (this.isOpen()) return;

    const positions: ConnectedPosition[] = this.align === 'right'
      ? [
          { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 4 },
          { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -4 }
        ]
      : [
          { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
          { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 }
        ];

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.triggerRef)
      .withPositions(positions)
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop'
    });

    const portal = new TemplatePortal(this.menuTemplate, this.viewContainerRef);
    this.overlayRef.attach(portal);

    this.overlayRef.backdropClick().subscribe(() => this.close());

    this.isOpen.set(true);
    this.opened.emit();
    this.focusedItemIndex = -1;

    // Focus first menu item after open
    setTimeout(() => this.focusItem(0), 0);
  }

  close(): void {
    if (!this.isOpen()) return;

    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.isOpen.set(false);
    this.closed.emit();
    this.focusedItemIndex = -1;

    // Return focus to trigger
    const triggerButton = this.triggerRef.nativeElement.querySelector('button');
    if (triggerButton) {
      triggerButton.focus();
    }
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      if (!this.isOpen()) {
        event.preventDefault();
        this.open();
      }
    }
  }

  onMenuKeydown(event: KeyboardEvent): void {
    const items = this.getMenuItems();
    if (!items.length) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusItem(this.focusedItemIndex + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusItem(this.focusedItemIndex - 1);
        break;
      case 'Home':
        event.preventDefault();
        this.focusItem(0);
        break;
      case 'End':
        event.preventDefault();
        this.focusItem(items.length - 1);
        break;
      case 'Tab':
        // Allow tab to close menu naturally
        this.close();
        break;
    }
  }

  private getMenuItems(): HTMLElement[] {
    if (!this.overlayRef) return [];
    const menu = this.overlayRef.overlayElement.querySelector('[role="menu"]');
    if (!menu) return [];
    return Array.from(menu.querySelectorAll('[role="menuitem"]:not([disabled])')) as HTMLElement[];
  }

  private focusItem(index: number): void {
    const items = this.getMenuItems();
    if (!items.length) return;

    // Wrap around
    if (index < 0) {
      index = items.length - 1;
    } else if (index >= items.length) {
      index = 0;
    }

    this.focusedItemIndex = index;
    items[index]?.focus();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  ngOnDestroy(): void {
    this.overlayRef?.dispose();
  }
}

@Component({
  selector: 'sw-dropdown-item',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      [disabled]="disabled"
      [ngClass]="itemClasses"
      class="w-full px-4 py-2.5 text-sm text-left transition-colors duration-150 flex items-center gap-3 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800"
      role="menuitem"
      [attr.tabindex]="disabled ? -1 : 0"
      (click)="onClick.emit($event)"
      (keydown.enter)="onClick.emit($any($event))"
      (keydown.space)="onSpaceKey($any($event))"
    >
      @if (icon) {
        <span class="material-icons text-lg" aria-hidden="true">{{ icon }}</span>
      }
      <ng-content />
    </button>
  `
})
export class DropdownItemComponent {
  @Input() icon = '';
  @Input() disabled = false;
  @Input() danger = false;

  @Output() onClick = new EventEmitter<MouseEvent>();

  get itemClasses(): string {
    // TailAdmin style dropdown items
    if (this.disabled) {
      return 'text-gray-400 cursor-not-allowed';
    }
    if (this.danger) {
      return 'text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 focus:bg-red-50 dark:focus:bg-red-900/20';
    }
    return 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800';
  }

  onSpaceKey(event: KeyboardEvent): void {
    event.preventDefault();
    this.onClick.emit(event as unknown as MouseEvent);
  }
}

@Component({
  selector: 'sw-dropdown-divider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="my-2 border-t border-gray-200 dark:border-gray-700"></div>`
})
export class DropdownDividerComponent {}
