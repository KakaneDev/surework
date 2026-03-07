import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

/**
 * Selective preloading strategy that preloads routes marked with `data: { preload: true }`.
 * This improves navigation performance for frequently accessed routes while avoiding
 * unnecessary network requests for rarely used routes.
 *
 * Usage in route config:
 * ```typescript
 * {
 *   path: 'dashboard',
 *   loadComponent: () => import('./dashboard.component'),
 *   data: { preload: true }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class SelectivePreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    // Preload if route has data.preload = true
    if (route.data?.['preload'] === true) {
      return load();
    }
    return of(null);
  }
}
