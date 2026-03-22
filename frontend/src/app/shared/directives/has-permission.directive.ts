import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  inject,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import { selectUserPermissions } from '@core/store/auth/auth.selectors';

/**
 * Structural directive that conditionally displays content based on user permissions.
 *
 * @example
 * ```html
 * <!-- Show if user has PAYROLL_READ permission -->
 * <button *hasPermission="'PAYROLL_READ'">View Payroll</button>
 *
 * <!-- Show if user has ANY of these permissions -->
 * <button *hasPermission="['LEAVE_APPROVE', 'LEAVE_MANAGE']">Approve Leave</button>
 *
 * <!-- With else template -->
 * <button *hasPermission="'ADMIN_ACCESS'; else noAccess">Admin Panel</button>
 * <ng-template #noAccess>
 *   <span>No access</span>
 * </ng-template>
 * ```
 */
@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy, OnChanges {
  private readonly store = inject(Store);
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly destroy$ = new Subject<void>();

  @Input('hasPermission') requiredPermissions: string | string[] = [];
  @Input('hasPermissionElse') elseTemplate?: TemplateRef<unknown>;

  private hasView = false;
  private currentPermissions: string[] = [];

  ngOnInit(): void {
    this.store.select(selectUserPermissions).pipe(
      takeUntil(this.destroy$)
    ).subscribe(permissions => {
      this.currentPermissions = permissions;
      this.updateView();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['requiredPermissions'] && !changes['requiredPermissions'].firstChange) {
      this.updateView();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateView(): void {
    const hasPermission = this.checkPermission();

    if (hasPermission && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      this.viewContainer.clear();
      if (this.elseTemplate) {
        this.viewContainer.createEmbeddedView(this.elseTemplate);
      }
      this.hasView = false;
    } else if (!hasPermission && !this.hasView && this.elseTemplate) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.elseTemplate);
    }
  }

  private checkPermission(): boolean {
    // Super admin bypasses all checks
    if (this.currentPermissions.includes('ALL') ||
        this.currentPermissions.includes('*') ||
        this.currentPermissions.includes('TENANT_ALL')) {
      return true;
    }

    const required = Array.isArray(this.requiredPermissions)
      ? this.requiredPermissions
      : [this.requiredPermissions];

    // If no permissions required, show content
    if (required.length === 0 || (required.length === 1 && required[0] === '')) {
      return true;
    }

    // Check if user has ANY of the required permissions
    return required.some(p => this.currentPermissions.includes(p));
  }
}

/**
 * Directive that hides content unless user has ALL specified permissions.
 * More restrictive than hasPermission which requires only one.
 */
@Directive({
  selector: '[hasAllPermissions]',
  standalone: true
})
export class HasAllPermissionsDirective implements OnInit, OnDestroy, OnChanges {
  private readonly store = inject(Store);
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly destroy$ = new Subject<void>();

  @Input('hasAllPermissions') requiredPermissions: string[] = [];
  @Input('hasAllPermissionsElse') elseTemplate?: TemplateRef<unknown>;

  private hasView = false;
  private currentPermissions: string[] = [];

  ngOnInit(): void {
    this.store.select(selectUserPermissions).pipe(
      takeUntil(this.destroy$)
    ).subscribe(permissions => {
      this.currentPermissions = permissions;
      this.updateView();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['requiredPermissions'] && !changes['requiredPermissions'].firstChange) {
      this.updateView();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateView(): void {
    const hasAllPermissions = this.checkPermissions();

    if (hasAllPermissions && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasAllPermissions && this.hasView) {
      this.viewContainer.clear();
      if (this.elseTemplate) {
        this.viewContainer.createEmbeddedView(this.elseTemplate);
      }
      this.hasView = false;
    } else if (!hasAllPermissions && !this.hasView && this.elseTemplate) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.elseTemplate);
    }
  }

  private checkPermissions(): boolean {
    // Super admin bypasses all checks
    if (this.currentPermissions.includes('ALL') ||
        this.currentPermissions.includes('*') ||
        this.currentPermissions.includes('TENANT_ALL')) {
      return true;
    }

    // If no permissions required, show content
    if (this.requiredPermissions.length === 0) {
      return true;
    }

    // Check if user has ALL required permissions
    return this.requiredPermissions.every(p => this.currentPermissions.includes(p));
  }
}
