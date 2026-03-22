import {
  Component,
  inject,
  output,
  signal,
  computed,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  HostListener,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { GlobalSearchService, SearchResult, SearchCategory } from '@core/services/global-search.service';

@Component({
  selector: 'app-search-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div
      class="fixed inset-0 z-[100] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-modal-title"
    >
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
        (click)="close.emit()"
      ></div>

      <!-- Modal -->
      <div class="flex min-h-full items-start justify-center p-4 pt-[10vh] sm:pt-[15vh]">
        <div
          class="relative w-full max-w-2xl transform rounded-xl bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-gray-900/5 dark:ring-white/10 transition-all"
          (click)="$event.stopPropagation()"
        >
          <!-- Search Input -->
          <div class="flex items-center border-b border-gray-200 dark:border-gray-700 px-4">
            <svg class="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              #searchInput
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="onSearchChange($event)"
              [placeholder]="'globalSearch.placeholder' | translate"
              class="flex-1 bg-transparent py-4 px-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none text-base"
              autocomplete="off"
              spellcheck="false"
            />
            @if (searchQuery()) {
              <button
                type="button"
                (click)="clearSearch()"
                class="p-1.5 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            }
            <kbd class="hidden sm:inline-flex items-center px-2 py-1 ml-2 text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
              ESC
            </kbd>
          </div>

          <!-- Results Area -->
          <div class="max-h-[60vh] overflow-y-auto py-2">
            @if (loading()) {
              <!-- Loading State -->
              <div class="flex items-center justify-center py-12">
                <div class="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                  <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{{ 'common.loading' | translate }}</span>
                </div>
              </div>
            } @else if (!searchQuery() || searchQuery().length < 2) {
              <!-- Empty State - Type to Search -->
              <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
                <svg class="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {{ 'globalSearch.typeToSearch' | translate }}
                </p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {{ 'globalSearch.hint' | translate }}
                </p>
              </div>
            } @else if (results().length === 0) {
              <!-- No Results -->
              <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
                <svg class="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {{ 'globalSearch.noResults' | translate }}
                </p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {{ 'globalSearch.tryDifferentQuery' | translate }}
                </p>
              </div>
            } @else {
              <!-- Results -->
              @for (category of groupedResults(); track category.category) {
                <div class="px-2">
                  <!-- Category Header -->
                  <div class="px-3 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {{ searchService.getCategoryLabel(category.category) }}
                  </div>
                  <!-- Category Items -->
                  @for (result of category.results; track result.id; let idx = $index) {
                    <button
                      type="button"
                      (click)="selectResult(result)"
                      [class]="getResultClasses(result)"
                      (mouseenter)="selectedIndex.set(getGlobalIndex(category.category, idx))"
                    >
                      <span class="material-icons text-[20px] text-gray-400 dark:text-gray-500 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
                        {{ result.icon }}
                      </span>
                      <div class="flex-1 min-w-0 text-left">
                        <div class="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {{ result.title }}
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {{ result.subtitle }}
                        </div>
                      </div>
                      <svg class="h-4 w-4 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                      </svg>
                    </button>
                  }
                </div>
              }

              <!-- Results Count -->
              <div class="px-4 py-2 text-xs text-gray-400 dark:text-gray-500 text-center border-t border-gray-100 dark:border-gray-700 mt-2">
                {{ results().length }} {{ 'globalSearch.resultsFound' | translate }}
              </div>
            }
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-4 py-3 text-xs text-gray-400 dark:text-gray-500">
            <div class="flex items-center gap-4">
              <span class="flex items-center gap-1.5">
                <kbd class="inline-flex items-center justify-center w-5 h-5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                  </svg>
                </kbd>
                <kbd class="inline-flex items-center justify-center w-5 h-5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </kbd>
                <span>{{ 'globalSearch.navigate' | translate }}</span>
              </span>
              <span class="flex items-center gap-1.5">
                <kbd class="inline-flex items-center justify-center px-1.5 h-5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-[10px] font-medium">Enter</kbd>
                <span>{{ 'globalSearch.select' | translate }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchModalComponent implements AfterViewInit, OnDestroy {
  close = output<void>();

  protected readonly searchService = inject(GlobalSearchService);
  private readonly router = inject(Router);
  private destroy$ = new Subject<void>();

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  searchQuery = signal('');
  results = signal<SearchResult[]>([]);
  loading = signal(false);
  selectedIndex = signal(0);

  groupedResults = computed(() => {
    const grouped = this.searchService.getResultsByCategory(this.results());
    const categories: { category: SearchCategory; results: SearchResult[] }[] = [];

    const order: SearchCategory[] = ['employees', 'candidates', 'jobs', 'documents', 'invoices', 'payrollRuns'];
    for (const cat of order) {
      const items = grouped.get(cat);
      if (items && items.length > 0) {
        categories.push({ category: cat, results: items });
      }
    }
    return categories;
  });

  flatResults = computed(() => {
    return this.groupedResults().flatMap(g => g.results);
  });

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.searchInput?.nativeElement?.focus();
    }, 50);

    this.searchService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.results.set(state.results);
        this.loading.set(state.loading);
        if (state.results.length > 0) {
          this.selectedIndex.set(0);
        }
      });
  }

  ngOnDestroy(): void {
    this.searchService.clearSearch();
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const flat = this.flatResults();

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.close.emit();
        break;

      case 'ArrowDown':
        event.preventDefault();
        if (flat.length > 0) {
          this.selectedIndex.update(i => (i + 1) % flat.length);
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (flat.length > 0) {
          this.selectedIndex.update(i => (i - 1 + flat.length) % flat.length);
        }
        break;

      case 'Enter':
        event.preventDefault();
        const selected = flat[this.selectedIndex()];
        if (selected) {
          this.selectResult(selected);
        }
        break;
    }
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.searchService.search(query);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.searchService.clearSearch();
    this.searchInput?.nativeElement?.focus();
  }

  selectResult(result: SearchResult): void {
    this.router.navigate([result.route]);
    this.close.emit();
  }

  getGlobalIndex(category: SearchCategory, localIndex: number): number {
    const grouped = this.groupedResults();
    let globalIndex = 0;

    for (const group of grouped) {
      if (group.category === category) {
        return globalIndex + localIndex;
      }
      globalIndex += group.results.length;
    }
    return 0;
  }

  getResultClasses(result: SearchResult): string {
    const flat = this.flatResults();
    const globalIndex = flat.indexOf(result);
    const isSelected = globalIndex === this.selectedIndex();

    const base = 'group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer';
    const selected = isSelected
      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50';

    return `${base} ${selected}`;
  }
}
