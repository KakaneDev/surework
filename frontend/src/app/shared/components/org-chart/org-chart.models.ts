import { EmploymentStatus } from '@core/services/employee.service';

/**
 * Represents a node in the organizational chart hierarchy.
 */
export interface OrgChartNode {
  id: string;
  employeeNumber: string;
  fullName: string;
  jobTitle: string | null;
  department: string | null;
  status: EmploymentStatus;
  initials: string;
  children: OrgChartNode[];
  expanded: boolean;
  level: number;
  managerId?: string;
  visibleChildCount: number;  // Tracks how many children to show (pagination)
  isSearchMatch?: boolean;    // Highlights node when it matches search
}

/**
 * Configuration options for the org chart display.
 */
export interface OrgChartConfig {
  /** Display mode: full tree, subtree from a root, or upward chain */
  mode: 'full' | 'subtree' | 'chain';
  /** Root employee ID for subtree/chain modes */
  rootEmployeeId?: string;
  /** Compact display for dashboard widget */
  compact?: boolean;
  /** Maximum depth to display (for compact mode) */
  maxDepth?: number;
}

/**
 * Access mode for role-based org chart viewing.
 */
export type OrgChartAccessMode = 'full' | 'subtree' | 'chain';
