import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
  DestroyRef,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, Subject } from 'rxjs';
import { selectUserPermissions, selectCurrentEmployeeId } from '@core/store/auth/auth.selectors';
import { OrgChartService } from './org-chart.service';
import { OrgChartNodeComponent } from './org-chart-node.component';
import { OrgChartNode, OrgChartConfig, OrgChartAccessMode } from './org-chart.models';
import { SpinnerComponent } from '@shared/ui';

/**
 * Main organizational chart container component.
 * Handles access control, data loading, and provides controls for the tree display.
 */
@Component({
  selector: 'app-org-chart',
  standalone: true,
  imports: [CommonModule, FormsModule, OrgChartNodeComponent, SpinnerComponent],
  template: `
    <div class="org-chart-container" [class.org-chart-container--compact]="config?.compact">
      <!-- Loading State -->
      @if (loading()) {
        <div class="flex justify-center items-center py-12">
          <sw-spinner size="lg" />
        </div>
      } @else if (error()) {
        <!-- Error State -->
        <div class="text-center py-12">
          <span class="material-icons text-4xl text-neutral-300 mb-2">error_outline</span>
          <p class="text-neutral-500 dark:text-neutral-400">{{ error() }}</p>
          <button
            type="button"
            class="mt-4 px-4 py-2 text-sm font-medium text-primary-500 hover:text-primary-600"
            (click)="loadData()"
          >
            Try Again
          </button>
        </div>
      } @else if (nodes().length === 0) {
        <!-- Empty State -->
        <div class="text-center py-12">
          <span class="material-icons text-4xl text-neutral-300 mb-2">account_tree</span>
          <p class="text-neutral-500 dark:text-neutral-400">No organizational data available</p>
        </div>
      } @else {
        <!-- Controls (hide in compact mode) -->
        @if (!config?.compact) {
          <div class="org-chart-controls">
            <!-- Search Bar -->
            <div class="org-search-container">
              <span class="material-icons org-search-icon">search</span>
              <input
                type="text"
                class="org-search-input"
                placeholder="Search employees..."
                [ngModel]="searchQuery()"
                (ngModelChange)="onSearchInput($event)"
              />
              @if (searchQuery()) {
                <button
                  type="button"
                  class="org-search-clear"
                  (click)="clearSearch()"
                  title="Clear search"
                >
                  <span class="material-icons text-sm">close</span>
                </button>
              }
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="org-control-btn"
                (click)="expandAll()"
                title="Expand All"
              >
                <span class="material-icons text-lg">unfold_more</span>
                <span class="hidden sm:inline">Expand All</span>
              </button>
              <button
                type="button"
                class="org-control-btn"
                (click)="collapseAll()"
                title="Collapse All"
              >
                <span class="material-icons text-lg">unfold_less</span>
                <span class="hidden sm:inline">Collapse All</span>
              </button>
            </div>
            <div class="text-sm text-neutral-500 dark:text-neutral-400">
              @if (searchMatchCount() > 0) {
                {{ searchMatchCount() }} match{{ searchMatchCount() !== 1 ? 'es' : '' }} found
              } @else {
                {{ totalEmployees() }} employee{{ totalEmployees() !== 1 ? 's' : '' }}
              }
            </div>
          </div>
        }

        <!-- Tree Container -->
        <div class="org-chart-scroll" [class.org-chart-scroll--compact]="config?.compact">
          <div class="org-chart-tree">
            @for (root of nodes(); track root.id) {
              <app-org-chart-node
                [node]="root"
                [compact]="config?.compact ?? false"
                [maxDepth]="config?.maxDepth"
                [searchQuery]="searchQuery()"
                (nodeClick)="onNodeClick($event)"
                (toggleExpand)="onToggleExpand($event)"
                (showMore)="onShowMore($event)"
              />
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .org-chart-container {
      width: 100%;
    }

    .org-chart-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: rgb(249 250 251);
      border: 1px solid rgb(229 231 235);
      border-radius: 0.5rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    :host-context(.dark) .org-chart-controls {
      background: rgb(38 38 38);
      border-color: rgb(64 64 64);
    }

    .org-search-container {
      position: relative;
      flex: 1;
      min-width: 200px;
      max-width: 320px;
    }

    .org-search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1.25rem;
      color: rgb(156 163 175);
      pointer-events: none;
    }

    .org-search-input {
      width: 100%;
      padding: 0.5rem 2.25rem 0.5rem 2.5rem;
      font-size: 0.875rem;
      border: 1px solid rgb(209 213 219);
      border-radius: 0.375rem;
      background: white;
      color: rgb(17 24 39);
    }

    :host-context(.dark) .org-search-input {
      background: rgb(30 30 30);
      border-color: rgb(64 64 64);
      color: rgb(243 244 246);
    }

    .org-search-input:focus {
      outline: none;
      border-color: rgb(63 156 99);
      box-shadow: 0 0 0 2px rgba(63, 156, 99, 0.2);
    }

    .org-search-input::placeholder {
      color: rgb(156 163 175);
    }

    .org-search-clear {
      position: absolute;
      right: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.5rem;
      height: 1.5rem;
      border: none;
      background: rgb(229 231 235);
      border-radius: 50%;
      cursor: pointer;
      color: rgb(107 114 128);
    }

    :host-context(.dark) .org-search-clear {
      background: rgb(64 64 64);
      color: rgb(156 163 175);
    }

    .org-search-clear:hover {
      background: rgb(209 213 219);
    }

    :host-context(.dark) .org-search-clear:hover {
      background: rgb(82 82 82);
    }

    .org-control-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: rgb(55 65 81);
      background: white;
      border: 1px solid rgb(209 213 219);
      border-radius: 0.375rem;
      cursor: pointer;
      transition: opacity 0.15s ease;
    }

    :host-context(.dark) .org-control-btn {
      color: rgb(209 213 219);
      background: rgb(30 30 30);
      border-color: rgb(64 64 64);
    }

    .org-control-btn:hover {
      background: rgb(249 250 251);
      border-color: rgb(156 163 175);
    }

    :host-context(.dark) .org-control-btn:hover {
      background: rgb(38 38 38);
      border-color: rgb(82 82 82);
    }

    .org-chart-scroll {
      overflow-x: auto;
      overflow-y: visible;
      padding: 1rem 0 2rem;
    }

    .org-chart-scroll--compact {
      padding: 0.5rem 0 1rem;
    }

    .org-chart-tree {
      display: flex;
      justify-content: center;
      gap: 2rem;
      min-width: min-content;
      padding: 0 1rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrgChartComponent implements OnInit {
  private readonly orgChartService = inject(OrgChartService);
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  @Input() config?: OrgChartConfig;
  @Output() employeeClick = new EventEmitter<OrgChartNode>();

  // State
  nodes = signal<OrgChartNode[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Search state
  searchQuery = signal('');
  private searchSubject = new Subject<string>();
  searchMatchCount = signal(0);

  // User permissions
  private userPermissions = toSignal(this.store.select(selectUserPermissions), { initialValue: [] as string[] });
  private currentEmployeeId = toSignal(this.store.select(selectCurrentEmployeeId), { initialValue: null as string | null });

  // Computed access mode based on permissions
  accessMode = computed<OrgChartAccessMode>(() => {
    const perms = this.userPermissions();

    // Super admin / HR Admin gets full view
    const isAdmin = perms.some(p =>
      ['ALL', '*', 'TENANT_ALL', 'EMPLOYEE_MANAGE'].includes(p)
    );
    if (isAdmin) return 'full';

    // Check if user is a manager (has direct reports) - will be determined after data loads
    // For now, managers with LEAVE_APPROVE can see their subtree
    const isManager = perms.some(p => ['LEAVE_APPROVE', 'DEPARTMENT_MANAGE'].includes(p));
    if (isManager) return 'subtree';

    // Regular employees see chain
    return 'chain';
  });

  // Total employee count in current view
  totalEmployees = computed(() => {
    return this.countNodes(this.nodes());
  });

  ngOnInit(): void {
    this.loadData();

    // Set up debounced search
    this.searchSubject.pipe(
      debounceTime(300),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(query => {
      this.performSearch(query);
    });
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    const mode = this.config?.mode ?? this.accessMode();
    const rootId = this.config?.rootEmployeeId ?? this.currentEmployeeId();

    switch (mode) {
      case 'full':
        this.loadFullHierarchy();
        break;
      case 'subtree':
        if (rootId) {
          this.loadSubtree(rootId);
        } else {
          // Fallback to full if no root ID
          this.loadFullHierarchy();
        }
        break;
      case 'chain':
        if (rootId) {
          this.loadManagerChain(rootId);
        } else {
          this.loading.set(false);
          this.error.set('Unable to determine your position in the organization');
        }
        break;
    }
  }

  private loadFullHierarchy(): void {
    this.orgChartService.getFullHierarchy().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (roots) => {
        this.nodes.set(roots);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load org chart:', err);
        this.error.set('Failed to load organizational chart');
        this.loading.set(false);
      }
    });
  }

  private loadSubtree(managerId: string): void {
    this.orgChartService.getSubtree(managerId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (node) => {
        this.nodes.set(node ? [node] : []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load org chart subtree:', err);
        this.error.set('Failed to load your team hierarchy');
        this.loading.set(false);
      }
    });
  }

  private loadManagerChain(employeeId: string): void {
    this.orgChartService.getManagerChain(employeeId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (chain) => {
        this.nodes.set(chain);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load manager chain:', err);
        this.error.set('Failed to load your reporting chain');
        this.loading.set(false);
      }
    });
  }

  onNodeClick(node: OrgChartNode): void {
    this.employeeClick.emit(node);
    // Navigate to employee profile by default
    this.router.navigate(['/employees', node.id]);
  }

  onToggleExpand(node: OrgChartNode): void {
    // Accordion behavior: collapse siblings when expanding a node
    if (node.expanded) {
      this.collapseSiblings(node);
      this.nodes.set([...this.nodes()]); // Trigger change detection
    }
  }

  /**
   * Collapse sibling nodes when a node is expanded (accordion behavior).
   */
  private collapseSiblings(expandedNode: OrgChartNode): void {
    const parent = this.findParent(this.nodes(), expandedNode.id);
    if (parent) {
      parent.children.forEach(child => {
        if (child.id !== expandedNode.id && child.expanded) {
          this.collapseRecursive(child);
        }
      });
    }
  }

  /**
   * Find the parent node of a given node ID.
   */
  private findParent(nodes: OrgChartNode[], targetId: string): OrgChartNode | null {
    for (const node of nodes) {
      if (node.children.some(child => child.id === targetId)) {
        return node;
      }
      const found = this.findParent(node.children, targetId);
      if (found) return found;
    }
    return null;
  }

  /**
   * Recursively collapse a node and all its descendants.
   */
  private collapseRecursive(node: OrgChartNode): void {
    node.expanded = false;
    node.children.forEach(child => this.collapseRecursive(child));
  }

  // Search methods
  onSearchInput(query: string): void {
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.clearSearchHighlights(this.nodes());
    this.searchMatchCount.set(0);
    this.nodes.set([...this.nodes()]);
  }

  private performSearch(query: string): void {
    const trimmedQuery = query.trim().toLowerCase();

    // Clear previous highlights
    this.clearSearchHighlights(this.nodes());

    if (!trimmedQuery) {
      this.searchMatchCount.set(0);
      this.nodes.set([...this.nodes()]);
      return;
    }

    // Find matching nodes and expand paths to them
    const matchCount = this.findAndHighlightMatches(this.nodes(), trimmedQuery);
    this.searchMatchCount.set(matchCount);
    this.nodes.set([...this.nodes()]);
  }

  private clearSearchHighlights(nodes: OrgChartNode[]): void {
    nodes.forEach(node => {
      node.isSearchMatch = false;
      this.clearSearchHighlights(node.children);
    });
  }

  private findAndHighlightMatches(nodes: OrgChartNode[], query: string): number {
    let matchCount = 0;

    for (const node of nodes) {
      // Check if this node matches
      const matches = this.nodeMatchesQuery(node, query);
      if (matches) {
        node.isSearchMatch = true;
        matchCount++;
        // Expand path from root to this node
        this.expandPathToNode(node.id);
      }

      // Continue searching in children
      matchCount += this.findAndHighlightMatches(node.children, query);
    }

    return matchCount;
  }

  private nodeMatchesQuery(node: OrgChartNode, query: string): boolean {
    return (
      node.fullName.toLowerCase().includes(query) ||
      node.employeeNumber.toLowerCase().includes(query) ||
      (node.jobTitle?.toLowerCase().includes(query) ?? false) ||
      (node.department?.toLowerCase().includes(query) ?? false)
    );
  }

  private expandPathToNode(targetId: string): void {
    // Find and expand all ancestors of the target node
    const expandPath = (nodes: OrgChartNode[], target: string): boolean => {
      for (const node of nodes) {
        if (node.id === target) {
          return true;
        }
        if (this.expandPath(node.children, target)) {
          node.expanded = true;
          return true;
        }
      }
      return false;
    };

    this.expandPath(this.nodes(), targetId);
  }

  private expandPath(nodes: OrgChartNode[], targetId: string): boolean {
    for (const node of nodes) {
      if (node.id === targetId) {
        return true;
      }
      if (this.expandPath(node.children, targetId)) {
        node.expanded = true;
        return true;
      }
    }
    return false;
  }

  // Pagination: Show more children
  onShowMore(node: OrgChartNode): void {
    node.visibleChildCount += 10;
    this.nodes.set([...this.nodes()]); // Trigger change detection
  }

  expandAll(): void {
    const expanded = this.setAllExpanded(this.nodes(), true);
    this.nodes.set([...expanded]);
  }

  collapseAll(): void {
    const collapsed = this.setAllExpanded(this.nodes(), false);
    this.nodes.set([...collapsed]);
  }

  private setAllExpanded(nodes: OrgChartNode[], expanded: boolean): OrgChartNode[] {
    return nodes.map(node => ({
      ...node,
      expanded,
      children: this.setAllExpanded(node.children, expanded)
    }));
  }

  private countNodes(nodes: OrgChartNode[]): number {
    return nodes.reduce((count, node) => {
      return count + 1 + this.countNodes(node.children);
    }, 0);
  }
}
