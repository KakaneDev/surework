import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Header Page Object
 *
 * Test Case Coverage:
 * - TC-SEARCH-001: Search bar displays correctly
 * - TC-SEARCH-002: Search functionality works
 * - TC-SEARCH-003: Keyboard shortcuts work
 * - TC-SEARCH-004: Search results display correctly
 * - TC-SEARCH-005: Search result navigation works
 */
export class HeaderPage extends BasePage {
  // Header locators
  readonly header: Locator;
  readonly searchInput: Locator;
  readonly searchIcon: Locator;
  readonly keyboardShortcutHint: Locator;
  readonly loadingIndicator: Locator;
  readonly searchResultsDropdown: Locator;
  readonly noResultsMessage: Locator;

  // Header actions
  readonly darkModeToggle: Locator;
  readonly notificationButton: Locator;
  readonly notificationDropdown: Locator;
  readonly userMenu: Locator;
  readonly connectionStatus: Locator;

  constructor(page: Page) {
    super(page);

    // Search bar elements
    this.header = page.locator('header').first();
    this.searchInput = page.locator('input[aria-label="Global search"], input[placeholder*="Search"]').first();
    this.searchIcon = page.locator('header svg path[d*="M21 21l-6-6"]').first();
    this.keyboardShortcutHint = page.locator('header kbd').first();
    this.loadingIndicator = page.locator('header svg.animate-spin').first();
    this.searchResultsDropdown = page.locator('#search-results, [role="listbox"]').first();
    this.noResultsMessage = page.locator('text=No results found').first();

    // Header action buttons
    this.darkModeToggle = page.locator('header button').filter({ has: page.locator('svg path[d*="M12 3v1"]') }).first();
    this.notificationButton = page.locator('header button').filter({ has: page.locator('svg path[d*="M15 17h5"]') }).first();
    this.notificationDropdown = page.locator('header .shadow-dropdown').first();
    this.userMenu = page.locator('header [trigger]').first();
    this.connectionStatus = page.locator('header text=connected, header text=connecting, header text=disconnected').first();
  }

  /**
   * Verify header is displayed correctly
   */
  async assertHeaderDisplayed(): Promise<void> {
    await this.assertVisible(this.header, 'Header should be visible');
  }

  /**
   * Verify search bar is displayed correctly
   */
  async assertSearchBarDisplayed(): Promise<void> {
    await this.assertVisible(this.searchInput, 'Search input should be visible');
  }

  /**
   * Verify keyboard shortcut hint is displayed
   */
  async assertKeyboardShortcutHintDisplayed(): Promise<void> {
    await this.assertVisible(this.keyboardShortcutHint, 'Keyboard shortcut hint should be visible');
  }

  /**
   * Focus search bar by clicking
   */
  async focusSearchBar(): Promise<void> {
    await this.searchInput.click();
    await expect(this.searchInput).toBeFocused();
  }

  /**
   * Focus search bar using keyboard shortcut (Cmd/Ctrl + K)
   */
  async focusSearchBarWithShortcut(): Promise<void> {
    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';
    await this.page.keyboard.press(`${modifier}+k`);
    await expect(this.searchInput).toBeFocused();
  }

  /**
   * Type into search bar
   */
  async search(query: string): Promise<void> {
    await this.focusSearchBar();
    await this.searchInput.clear();
    await this.searchInput.fill(query);
  }

  /**
   * Wait for search results to appear
   */
  async waitForSearchResults(timeout = 5000): Promise<void> {
    await this.searchResultsDropdown.waitFor({ state: 'visible', timeout });
  }

  /**
   * Wait for loading indicator to disappear
   */
  async waitForSearchComplete(timeout = 5000): Promise<void> {
    // Wait for loading to start if it hasn't
    await this.page.waitForTimeout(400); // debounce time
    // Then wait for loading to complete
    try {
      await this.loadingIndicator.waitFor({ state: 'hidden', timeout });
    } catch {
      // Loading might have already completed
    }
  }

  /**
   * Get search result groups
   */
  async getSearchResultGroups(): Promise<string[]> {
    const groups = this.searchResultsDropdown.locator('h4');
    return groups.allTextContents();
  }

  /**
   * Get search result items
   */
  async getSearchResultItems(): Promise<Locator> {
    return this.searchResultsDropdown.locator('a[role="option"]');
  }

  /**
   * Get search result count
   */
  async getSearchResultCount(): Promise<number> {
    const items = await this.getSearchResultItems();
    return items.count();
  }

  /**
   * Click on a search result by index
   */
  async clickSearchResult(index: number): Promise<void> {
    const items = await this.getSearchResultItems();
    await items.nth(index).click();
  }

  /**
   * Click on a search result by text
   */
  async clickSearchResultByText(text: string): Promise<void> {
    const result = this.searchResultsDropdown.locator(`a:has-text("${text}")`).first();
    await result.click();
  }

  /**
   * Navigate search results with keyboard
   */
  async navigateResultsWithKeyboard(direction: 'up' | 'down'): Promise<void> {
    const key = direction === 'down' ? 'ArrowDown' : 'ArrowUp';
    await this.page.keyboard.press(key);
  }

  /**
   * Select current search result with Enter key
   */
  async selectResultWithEnter(): Promise<void> {
    await this.page.keyboard.press('Enter');
  }

  /**
   * Close search dropdown with Escape key
   */
  async closeSearchWithEscape(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }

  /**
   * Clear search input
   */
  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
  }

  /**
   * Get the current search input value
   */
  async getSearchValue(): Promise<string> {
    return this.searchInput.inputValue();
  }

  /**
   * Assert search dropdown is visible
   */
  async assertSearchDropdownVisible(): Promise<void> {
    await this.assertVisible(this.searchResultsDropdown, 'Search results dropdown should be visible');
  }

  /**
   * Assert search dropdown is hidden
   */
  async assertSearchDropdownHidden(): Promise<void> {
    await this.assertHidden(this.searchResultsDropdown, 'Search results dropdown should be hidden');
  }

  /**
   * Assert no results message is shown
   */
  async assertNoResultsMessage(): Promise<void> {
    await this.assertVisible(this.noResultsMessage, 'No results message should be visible');
  }

  /**
   * Assert loading indicator is shown
   */
  async assertLoadingIndicator(): Promise<void> {
    await this.assertVisible(this.loadingIndicator, 'Loading indicator should be visible');
  }

  /**
   * Toggle dark mode
   */
  async toggleDarkMode(): Promise<void> {
    await this.safeClick(this.darkModeToggle);
  }

  /**
   * Open notifications dropdown
   */
  async openNotifications(): Promise<void> {
    await this.safeClick(this.notificationButton);
    await this.assertVisible(this.notificationDropdown);
  }

  /**
   * Check if dark mode is enabled
   */
  async isDarkModeEnabled(): Promise<boolean> {
    const htmlClasses = await this.page.locator('html').getAttribute('class');
    return htmlClasses?.includes('dark') ?? false;
  }

  /**
   * Get connection status text
   */
  async getConnectionStatus(): Promise<string> {
    return this.getText(this.connectionStatus);
  }
}
