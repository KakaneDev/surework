import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from '@env/environment';
import { OrgChartNode } from './org-chart.models';
import { Employee, EmploymentStatus } from '@core/services/employee.service';

/**
 * Employee hierarchy item from backend API.
 * Matches EmployeeHierarchyItem from /api/v1/employees/hierarchy
 */
export interface OrgChartEmployee {
  id: string;
  employeeNumber: string;
  fullName: string;
  jobTitle: string | null;
  department: string | null;
  status: EmploymentStatus;
  managerId: string | null;
}

/**
 * Service for building and managing organizational chart hierarchies.
 */
@Injectable({
  providedIn: 'root'
})
export class OrgChartService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/v1/employees`;

  // Cache for org chart data
  private hierarchyCache$?: Observable<OrgChartNode[]>;

  /**
   * Get all employees with hierarchy data for building org chart.
   */
  getAllEmployeesForHierarchy(): Observable<OrgChartEmployee[]> {
    // Try the hierarchy endpoint first, fallback to paginated search
    return this.http.get<OrgChartEmployee[]>(`${this.apiUrl}/hierarchy`).pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  /**
   * Build hierarchy tree from flat employee list.
   */
  buildHierarchy(employees: OrgChartEmployee[]): OrgChartNode[] {
    const nodeMap = new Map<string, OrgChartNode>();

    // Create all nodes
    employees.forEach(emp => {
      nodeMap.set(emp.id, this.createNode(emp, 0));
    });

    // Build parent-child relationships
    employees.forEach(emp => {
      if (emp.managerId) {
        const parent = nodeMap.get(emp.managerId);
        const child = nodeMap.get(emp.id);
        if (parent && child) {
          parent.children.push(child);
        }
      }
    });

    // Calculate levels
    const calculateLevels = (node: OrgChartNode, level: number): void => {
      node.level = level;
      node.children.forEach(child => calculateLevels(child, level + 1));
    };

    // Get roots (employees without manager) and calculate levels
    const roots = Array.from(nodeMap.values()).filter(n => !n.managerId);
    roots.forEach(root => calculateLevels(root, 0));

    // Sort children by name at each level
    const sortChildren = (node: OrgChartNode): void => {
      node.children.sort((a, b) => a.fullName.localeCompare(b.fullName));
      node.children.forEach(sortChildren);
    };
    roots.forEach(sortChildren);

    return roots.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  /**
   * Get full organizational hierarchy (for HR/Admin users).
   */
  getFullHierarchy(): Observable<OrgChartNode[]> {
    if (!this.hierarchyCache$) {
      this.hierarchyCache$ = this.getAllEmployeesForHierarchy().pipe(
        map(employees => this.buildHierarchy(employees)),
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
    return this.hierarchyCache$;
  }

  /**
   * Get subtree starting from a specific manager (for managers viewing their reports).
   */
  getSubtree(managerId: string): Observable<OrgChartNode | null> {
    return this.getFullHierarchy().pipe(
      map(roots => this.findNodeById(roots, managerId))
    );
  }

  /**
   * Get manager chain from employee up to root (for employees viewing their position).
   */
  getManagerChain(employeeId: string): Observable<OrgChartNode[]> {
    return this.getAllEmployeesForHierarchy().pipe(
      map(employees => this.buildChain(employees, employeeId))
    );
  }

  /**
   * Get direct reports for a manager.
   */
  getDirectReports(managerId: string): Observable<OrgChartNode[]> {
    return this.getSubtree(managerId).pipe(
      map(node => node?.children ?? [])
    );
  }

  /**
   * Check if an employee has any direct reports.
   */
  hasDirectReports(employeeId: string): Observable<boolean> {
    return this.getFullHierarchy().pipe(
      map(roots => {
        const node = this.findNodeById(roots, employeeId);
        return node ? node.children.length > 0 : false;
      })
    );
  }

  /**
   * Clear cached hierarchy data.
   */
  clearCache(): void {
    this.hierarchyCache$ = undefined;
  }

  /**
   * Create an OrgChartNode from employee data.
   */
  private createNode(emp: OrgChartEmployee, level: number): OrgChartNode {
    return {
      id: emp.id,
      employeeNumber: emp.employeeNumber,
      fullName: emp.fullName,
      jobTitle: emp.jobTitle,
      department: emp.department,
      status: emp.status,
      initials: this.getInitials(emp.fullName),
      children: [],
      expanded: level < 1, // Only root expanded initially (CEO + direct reports visible)
      level,
      managerId: emp.managerId ?? undefined,
      visibleChildCount: 10 // Default pagination limit per node
    };
  }

  /**
   * Get initials from full name.
   */
  private getInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  /**
   * Find a node by ID in the hierarchy tree.
   */
  private findNodeById(nodes: OrgChartNode[], id: string): OrgChartNode | null {
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      }
      const found = this.findNodeById(node.children, id);
      if (found) {
        return found;
      }
    }
    return null;
  }

  /**
   * Build a chain from employee up to root.
   */
  private buildChain(employees: OrgChartEmployee[], employeeId: string): OrgChartNode[] {
    const employeeMap = new Map(employees.map(e => [e.id, e]));
    const chain: OrgChartNode[] = [];
    let currentId: string | null = employeeId;
    let level = 0;

    while (currentId) {
      const emp = employeeMap.get(currentId);
      if (!emp) break;

      const node = this.createNode(emp, level);
      chain.unshift(node); // Add to beginning so CEO is first
      currentId = emp.managerId;
      level++;
    }

    // Build parent-child links in the chain
    for (let i = 0; i < chain.length - 1; i++) {
      chain[i].children = [chain[i + 1]];
      chain[i].level = i;
      chain[i].expanded = true;
    }
    if (chain.length > 0) {
      chain[chain.length - 1].level = chain.length - 1;
      chain[chain.length - 1].children = [];
    }

    return chain.length > 0 ? [chain[0]] : [];
  }
}
