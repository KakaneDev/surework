import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '@env/environment';

/**
 * HTTP interceptor that adds tenant ID header to all API requests.
 */
export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  // Only add tenant header to API requests
  if (req.url.includes('/api/')) {
    const clonedReq = req.clone({
      setHeaders: {
        'X-Tenant-ID': environment.tenantId
      }
    });
    return next(clonedReq);
  }

  return next(req);
};
