import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ContentChildren, QueryList, AfterContentInit, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, inject } from '@angular/core';
import { NgClass } from '@angular/common';

export interface Tab {
  id: string;
  label: string;
  disabled?: boolean;
  icon?: string;
}

@Component({
  selector: 'sw-tab-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [style.display]="active ? 'block' : 'none'" role="tabpanel">
      <ng-content />
    </div>
  `
})
export class TabPanelComponent {
  @Input() id = '';

  private _active = false;
  private cdr = inject(ChangeDetectorRef);

  @Input()
  get active(): boolean {
    return this._active;
  }
  set active(value: boolean) {
    if (this._active !== value) {
      this._active = value;
      this.cdr.markForCheck();
    }
  }
}

@Component({
  selector: 'sw-tabs',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="border-b border-neutral-200 dark:border-dark-border">
      <nav class="flex gap-1" role="tablist" [attr.aria-label]="ariaLabel">
        @for (tab of normalizedTabs; track $index; let i = $index) {
          <button
            type="button"
            role="tab"
            [attr.aria-selected]="selectedIndex === i"
            [attr.aria-controls]="'tab-panel-' + i"
            [id]="'tab-' + i"
            [disabled]="tab.disabled"
            [ngClass]="getTabClasses(i, tab.disabled)"
            (click)="selectTab(i, tab.disabled)"
          >
            {{ tab.label }}
          </button>
        }
      </nav>
    </div>

    <div class="mt-4">
      <ng-content />
    </div>
  `
})
export class TabsComponent implements OnInit, OnChanges, AfterContentInit {
  @Input() tabs: (Tab | string)[] = [];
  @Input() defaultTab = 0;
  @Input() ariaLabel = 'Tabs';

  // Support two-way binding with [(activeTab)]
  @Input() activeTab = 0;
  @Output() activeTabChange = new EventEmitter<number>();

  @ContentChildren(TabPanelComponent) tabPanels!: QueryList<TabPanelComponent>;

  selectedIndex = 0;

  @Output() tabChange = new EventEmitter<number>();

  private cdr = inject(ChangeDetectorRef);

  get normalizedTabs(): Tab[] {
    return this.tabs.map((tab, i) => {
      if (typeof tab === 'string') {
        return { id: `tab-${i}`, label: tab };
      }
      return tab;
    });
  }

  ngOnInit(): void {
    this.selectedIndex = this.activeTab ?? this.defaultTab;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activeTab'] && !changes['activeTab'].firstChange) {
      this.selectedIndex = this.activeTab;
      this.updatePanels();
    }
  }

  ngAfterContentInit(): void {
    // Initial sync
    setTimeout(() => this.updatePanels(), 0);

    // Watch for dynamic changes
    this.tabPanels.changes.subscribe(() => {
      setTimeout(() => this.updatePanels(), 0);
    });
  }

  selectTab(index: number, disabled?: boolean): void {
    if (disabled) return;
    this.selectedIndex = index;
    this.tabChange.emit(index);
    this.activeTabChange.emit(index);
    this.updatePanels();
  }

  private updatePanels(): void {
    if (!this.tabPanels) return;

    const panels = this.tabPanels.toArray();
    panels.forEach((panel, i) => {
      panel.active = i === this.selectedIndex;
    });
    this.cdr.markForCheck();
  }

  getTabClasses(index: number, disabled?: boolean): string {
    const base = 'px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2';

    if (disabled) {
      return `${base} text-neutral-400 cursor-not-allowed`;
    }

    if (this.selectedIndex === index) {
      return `${base} text-primary-600 border-b-2 border-primary-500 dark:text-primary-400 -mb-px`;
    }

    return `${base} text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-dark-elevated`;
  }
}
