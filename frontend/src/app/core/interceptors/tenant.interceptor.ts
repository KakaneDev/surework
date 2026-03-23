import { HttpInterceptorFn } from '@angular/common/http';
import { getTenantId } from '@core/utils/tenant.util';

/**
 * HTTP interceptor that adds tenant ID header to all API requests.
 */
export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  // Only add tenant header to API requests
  if (req.url.includes('/api/')) {
    const clonedReq = req.clone({
      setHeaders: {
        'X-Tenant-ID': getTenantId()
      }
    });
    return next(clonedReq);
  }

  return next(req);
};
