import { Component, Output, EventEmitter, inject, OnInit, OnDestroy, signal, computed, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { NotificationService, AdminNotification } from '../services/notification.service';
import { WebSocketService } from '../services/websocket.service';
import { GlobalSearchService, SearchResultGroup, SearchResultItem } from '../services/global-search.service';
import { DropdownComponent, DropdownItem } from '../components/ui/dropdown.component';
import { RelativeTimePipe } from '../pipes/relative-time.pipe';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DropdownComponent, RelativeTimePipe],
  template: `
    <header class="sticky top-0 z-999 flex h-16 w-full items-center border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-dark/80">
      <div class="flex flex-grow items-center gap-4 px-4 md:px-6">
        <!-- Hamburger (mobile only) -->
        <button
          class="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden dark:hover:bg-white/[0.05] flex-shrink-0"
          (click)="toggleSidebar.emit()"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>

        <!-- Search Bar - Takes up available space -->
        <div class="hidden sm:block flex-1 min-w-0">
          <div class="relative w-full max-w-3xl" #searchContainer>
            <input
              #searchInput
              type="text"
              [placeholder]="'Search tenants, tickets... (' + shortcutKey + '+K)'"
              [(ngModel)]="searchTerm"
              (ngModelChange)="onSearchTermChange($event)"
              (focus)="searchFocused = true"
              (blur)="onSearchBlur()"
              (keydown)="onSearchKeydown($event)"
              class="w-full h-11 rounded-lg border border-gray-300 bg-gray-50/80 pl-11 pr-4 text-sm
                     placeholder:text-gray-500 hover:bg-white hover:border-gray-400
                     focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20
                     focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200
                     dark:placeholder-gray-400 dark:hover:border-gray-500 dark:hover:bg-gray-750
                     dark:focus:border-brand-400 dark:focus:ring-brand-400/20 transition-colors"
              aria-label="Global search"
              aria-expanded="searchResultsVisible()"
              aria-haspopup="listbox"
              aria-controls="search-results"
              role="combobox"
              [attr.aria-activedescendant]="selectedIndex >= 0 ? 'search-result-' + selectedIndex : null"
            />
            <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>

            <!-- Keyboard shortcut hint -->
            @if (!searchFocused && !searchTerm) {
              <div class="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1">
                <kbd class="px-1.5 py-0.5 text-xs font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-500">{{ shortcutKey }}</kbd>
                <kbd class="px-1.5 py-0.5 text-xs font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-500">K</kbd>
              </div>
            }

            <!-- Loading indicator -->
            @if (isSearching()) {
              <div class="absolute right-3 top-1/2 -translate-y-1/2">
                <svg class="h-4 w-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            }

            <!-- Search Results Dropdown -->
            @if (searchResultsVisible()) {
              <div
                id="search-results"
                role="listbox"
                class="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border
                       border-gray-200 shadow-dropdown z-50 max-h-96 overflow-y-auto
                       dark:bg-gray-800 dark:border-gray-700 animate-fade-in"
              >
                @if (searchResults().groups.length > 0) {
                  @for (group of searchResults().groups; track group.type; let groupIdx = $index) {
                    <div class="p-2">
                      <h4 class="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-1 uppercase tracking-wide">
                        @if (group.icon === 'building') {
                          <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                          </svg>
                        } @else if (group.icon === 'ticket') {
                          <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
                          </svg>
                        }
                        {{ group.type }}
                      </h4>
                      @for (result of group.items; track result.id; let itemIdx = $index) {
                        <a
                          [id]="'search-result-' + getGlobalIndex(groupIdx, itemIdx)"
                          [routerLink]="result.link"
                          role="option"
                          [attr.aria-selected]="selectedIndex === getGlobalIndex(groupIdx, itemIdx)"
                          class="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                          [ngClass]="{'bg-brand-50 dark:bg-brand-500/10': selectedIndex === getGlobalIndex(groupIdx, itemIdx)}"
                          (click)="selectResult(result)"
                          (mouseenter)="selectedIndex = getGlobalIndex(groupIdx, itemIdx)"
                        >
                          <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ result.title }}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ result.subtitle }}</p>
                          </div>
                          <svg class="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                          </svg>
                        </a>
                      }
                    </div>
                  }
                } @else if (searchTerm && searchTerm.length >= 2 && !isSearching()) {
                  <div class="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No results found for "{{ searchTerm }}"
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Mobile Search Button -->
        <button
          class="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 sm:hidden dark:hover:bg-white/[0.05] flex-shrink-0"
          (click)="mobileSearchOpen = !mobileSearchOpen"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </button>

        <!-- Right side -->
        <div class="flex items-center gap-3 flex-shrink-0 ml-auto">
          <!-- Dark Mode Toggle -->
          <button
            class="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
            (click)="toggleDarkMode()"
          >
            @if (isDarkMode) {
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
            } @else {
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
              </svg>
            }
          </button>

          <!-- Notifications -->
          <div class="relative">
            <button
              class="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
              (click)="notificationOpen = !notificationOpen"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              @if (notificationService.hasUnread()) {
                <span class="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-error-500"></span>
              }
            </button>

            @if (notificationOpen) {
              <div class="absolute right-0 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-dropdown dark:border-gray-800 dark:bg-gray-dark animate-fade-in">
                <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                  <h5 class="text-sm font-medium text-gray-900 dark:text-white/90">Notifications</h5>
                  @if (notificationService.hasUnread()) {
                    <button
                      class="text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
                      (click)="markAllAsRead()"
                    >
                      Mark all as read
                    </button>
                  }
                </div>
                <div class="max-h-80 overflow-y-auto">
                  @for (notification of notifications; track notification.id) {
                    <div
                      class="flex gap-3 border-b border-gray-100 px-4 py-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                      [ngClass]="!notification.readAt ? 'bg-brand-50/50 dark:bg-brand-500/5' : ''"
                    >
                      <div class="flex-1">
                        <p class="text-sm font-medium text-gray-900 dark:text-white/90">{{ notification.title }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">{{ notification.message }}</p>
                        <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">{{ notification.createdAt | relativeTime }}</p>
                      </div>
                    </div>
                  } @empty {
                    <div class="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      No notifications
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Connection Status -->
          <div class="hidden items-center gap-1.5 border-l border-gray-200 pl-3 sm:flex dark:border-gray-800">
            <span
              class="h-2 w-2 rounded-full"
              [class.bg-success-500]="connectionStatus === 'connected'"
              [class.bg-warning-500]="connectionStatus === 'connecting'"
              [class.bg-gray-300]="connectionStatus === 'disconnected'"
            ></span>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ connectionStatus }}</span>
          </div>

          <!-- User Menu -->
          <div class="border-l border-gray-200 pl-3 dark:border-gray-800">
            <app-dropdown [items]="userMenuItems" (select)="onUserMenuSelect($event)">
              <button trigger class="flex items-center gap-2">
                <span class="hidden text-right lg:block">
                  <span class="block text-sm font-medium text-gray-900 dark:text-white/90">{{ user?.firstName }} {{ user?.lastName }}</span>
                  <span class="block text-xs text-gray-500 dark:text-gray-400">{{ user?.roles?.[0]?.name }}</span>
                </span>
                <span class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  <span class="text-sm font-medium">{{ user?.firstName?.charAt(0) }}{{ user?.lastName?.charAt(0) }}</span>
                </span>
              </button>
            </app-dropdown>
          </div>
        </div>
      </div>
    </header>

    <!-- Mobile Search Overlay -->
    @if (mobileSearchOpen) {
      <div class="fixed inset-0 z-9999 bg-black/50 sm:hidden" (click)="mobileSearchOpen = false">
        <div class="bg-white dark:bg-gray-800 p-4" (click)="$event.stopPropagation()">
          <div class="relative">
            <input
              type="text"
              placeholder="Search tenants, tickets, users..."
              [(ngModel)]="searchTerm"
              (ngModelChange)="onSearchTermChange($event)"
              (keydown)="onSearchKeydown($event)"
              class="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-11 pr-4 text-sm
                     shadow-theme-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20
                     focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200
                     dark:placeholder-gray-400 dark:focus:border-brand-400"
              autofocus
            />
            <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>

          <!-- Mobile Search Results -->
          @if (searchResults().groups.length > 0) {
            <div class="mt-4 max-h-[60vh] overflow-y-auto">
              @for (group of searchResults().groups; track group.type; let groupIdx = $index) {
                <div class="mb-4">
                  <h4 class="text-xs font-medium text-gray-500 dark:text-gray-400 px-1 py-1 uppercase tracking-wide">{{ group.type }}</h4>
                  @for (result of group.items; track result.id; let itemIdx = $index) {
                    <a
                      [routerLink]="result.link"
                      class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5"
                      (click)="selectResult(result)"
                    >
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ result.title }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ result.subtitle }}</p>
                      </div>
                    </a>
                  }
                </div>
              }
            </div>
          }
        </div>
      </div>
    }
  `
})
export class HeaderComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  protected notificationService = inject(NotificationService);
  private wsService = inject(WebSocketService);
  private globalSearchService = inject(GlobalSearchService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();
  private searchTerms$ = new Subject<string>();

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('searchContainer') searchContainer!: ElementRef<HTMLDivElement>;

  @Output() toggleSidebar = new EventEmitter<void>();

  // Search state
  searchTerm = '';
  searchFocused = false;
  mobileSearchOpen = false;
  selectedIndex = -1;

  searchResults = signal<{ groups: SearchResultGroup[]; totalCount: number; loading: boolean }>({
    groups: [],
    totalCount: 0,
    loading: false
  });

  isSearching = signal(false);

  searchResultsVisible = computed(() => {
    return this.searchFocused && this.searchTerm.length >= 2 && (this.searchResults().groups.length > 0 || this.isSearching() || this.searchTerm.length >= 2);
  });

  // Detect platform for keyboard shortcut display
  shortcutKey = navigator.platform.toLowerCase().includes('mac') ? 'Cmd' : 'Ctrl';

  // Other state
  notificationOpen = false;
  isDarkMode = false;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';

  userMenuItems: DropdownItem[] = [
    { label: 'Profile', value: 'profile' },
    { label: 'Settings', value: 'settings' },
    { label: '', value: '', divider: true },
    { label: 'Sign Out', value: 'logout' }
  ];

  get user() {
    return this.authService.currentUser();
  }

  get notifications(): AdminNotification[] {
    return this.notificationService.notifications().slice(0, 5);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    // Cmd/Ctrl + K to focus search
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.searchInput?.nativeElement?.focus();
    }
  }

  ngOnInit(): void {
    // Check for saved dark mode preference
    this.isDarkMode = document.documentElement.classList.contains('dark');

    // Connect WebSocket
    this.wsService.connect();
    this.wsService.connectionStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => this.connectionStatus = status);

    // Load notifications
    this.notificationService.loadNotifications().subscribe();
    this.notificationService.getUnreadCount().subscribe();

    // Listen for real-time notifications
    this.wsService.events$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (['TICKET_CREATED', 'PAYMENT_RECEIVED', 'CHURN_ALERT', 'SLA_BREACH'].includes(event.type)) {
          this.notificationService.addNotification({
            id: crypto.randomUUID(),
            type: event.type as any,
            title: event.type.replace(/_/g, ' ').toLowerCase(),
            message: event.payload.message || 'New notification',
            createdAt: event.timestamp
          });
        }
      });

    // Set up debounced search
    this.searchTerms$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(term => {
          if (term.length < 2) {
            return of({ groups: [], totalCount: 0, loading: false });
          }
          this.isSearching.set(true);
          return this.globalSearchService.search(term);
        })
      )
      .subscribe(results => {
        this.searchResults.set(results);
        this.isSearching.set(false);
        this.selectedIndex = -1;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.wsService.disconnect();
  }

  onSearchTermChange(term: string): void {
    this.searchTerms$.next(term);
  }

  onSearchBlur(): void {
    // Delay to allow click on results
    setTimeout(() => {
      this.searchFocused = false;
    }, 200);
  }

  onSearchKeydown(event: KeyboardEvent): void {
    const totalItems = this.getTotalResultCount();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, totalItems - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.selectedIndex >= 0) {
          const result = this.getResultByIndex(this.selectedIndex);
          if (result) {
            this.selectResult(result);
          }
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.searchFocused = false;
        this.searchInput?.nativeElement?.blur();
        break;
    }
  }

  getGlobalIndex(groupIdx: number, itemIdx: number): number {
    const groups = this.searchResults().groups;
    let index = 0;
    for (let i = 0; i < groupIdx; i++) {
      index += groups[i].items.length;
    }
    return index + itemIdx;
  }

  getTotalResultCount(): number {
    return this.searchResults().groups.reduce((sum, group) => sum + group.items.length, 0);
  }

  getResultByIndex(index: number): SearchResultItem | null {
    const groups = this.searchResults().groups;
    let currentIndex = 0;
    for (const group of groups) {
      if (index < currentIndex + group.items.length) {
        return group.items[index - currentIndex];
      }
      currentIndex += group.items.length;
    }
    return null;
  }

  selectResult(result: SearchResultItem): void {
    this.router.navigate([result.link]);
    this.searchTerm = '';
    this.searchResults.set({ groups: [], totalCount: 0, loading: false });
    this.searchFocused = false;
    this.mobileSearchOpen = false;
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    document.documentElement.classList.toggle('dark', this.isDarkMode);
    localStorage.setItem('darkMode', this.isDarkMode ? 'true' : 'false');
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }

  onUserMenuSelect(item: DropdownItem): void {
    switch (item.value) {
      case 'logout':
        this.authService.logout();
        break;
      case 'profile':
        this.router.navigate(['/profile']);
        break;
      case 'settings':
        this.router.navigate(['/settings']);
        break;
    }
  }
}
