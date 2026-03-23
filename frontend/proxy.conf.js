/**
 * Angular Development Proxy Configuration
 *
 * SECURITY WARNING: This file contains hardcoded development credentials!
 * ========================================================================
 *
 * This proxy configuration is STRICTLY for local development only.
 * It injects mock authentication headers to bypass the API Gateway's
 * JWT validation, allowing direct service access during development.
 *
 * NEVER deploy this file or its configuration to production environments.
 * NEVER commit production credentials to this file.
 *
 * Production Authentication Flow:
 * 1. User authenticates via /api/admin/auth/login
 * 2. JWT token is stored in browser
 * 3. All requests include Authorization: Bearer <token> header
 * 4. API Gateway validates JWT and forwards user claims as X-User-* headers
 *
 * The mock headers below simulate step 4 for development convenience.
 */

// Verify we're in development mode
if (process.env.NODE_ENV === 'production') {
  throw new Error(
    'SECURITY ERROR: proxy.conf.js should never be used in production! ' +
    'This file contains hardcoded development credentials.'
  );
}

/**
 * Extract user claims from JWT and set X-User-* headers for services that
 * expect the API Gateway to have done this. In dev, the proxy acts as the gateway.
 */
function setHeadersFromJwt(proxyReq, req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split('.')[1];
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      if (payload.userId || payload.sub) proxyReq.setHeader('X-User-Id', payload.userId || payload.sub);
      if (payload.tenantId) proxyReq.setHeader('X-User-Tenant', payload.tenantId);
      if (payload.username) proxyReq.setHeader('X-User-Username', payload.username);
      if (payload.roles) proxyReq.setHeader('X-User-Roles', Array.isArray(payload.roles) ? payload.roles.join(',') : payload.roles);
      if (payload.employeeId) proxyReq.setHeader('X-Employee-Id', payload.employeeId);
      return true; // JWT headers set
    } catch (e) { /* ignore parse errors */ }
  }
  return false; // no JWT
}

const PROXY_CONFIG = [
  {
    // Route accounting APIs directly to accounting-service
    context: ['/api/v1/accounting'],
    target: 'http://localhost:8084',
    secure: false,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      // If request has JWT, extract claims into X-User-* headers; else use mock headers
      if (!setHeadersFromJwt(proxyReq, req)) {
        proxyReq.setHeader('X-User-Id', '00000000-0000-0000-0000-000000000100');
        proxyReq.setHeader('X-User-Tenant', '00000000-0000-0000-0000-000000000001');
        proxyReq.setHeader('X-User-Roles', 'SUPER_ADMIN,ACCOUNTANT,FINANCE_MANAGER');
        proxyReq.setHeader('X-User-Username', 'dev@surework.co.za');
      }
    }
  },
  {
    // Route reporting APIs directly to reporting-service
    context: ['/api/reporting'],
    target: 'http://localhost:8091',
    secure: false,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      // If request has JWT, extract claims into X-User-* headers; else use mock headers
      if (!setHeadersFromJwt(proxyReq, req)) {
        proxyReq.setHeader('X-User-Id', '00000000-0000-0000-0000-000000000100');
        proxyReq.setHeader('X-User-Tenant', '00000000-0000-0000-0000-000000000099');
        proxyReq.setHeader('X-User-Roles', 'SUPER_ADMIN,HR_MANAGER,REPORTS_ADMIN');
        proxyReq.setHeader('X-User-Username', 'dev@surework.co.za');
      }
    }
  },
  {
    // Route HR APIs directly to hr-service
    // Self-service endpoints use JWT token, admin endpoints use mock headers
    context: ['/api/v1/employees', '/api/v1/departments', '/api/v1/leave', '/api/v1/job-titles', '/api/hr'],
    target: 'http://localhost:8082',
    secure: false,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      // If request has Authorization header (JWT), don't override with mock headers
      // This allows self-service endpoints (/balances, /my-requests) to work with real user auth
      if (!req.headers.authorization) {
        proxyReq.setHeader('X-User-Id', '00000000-0000-0000-0000-000000000100');
        proxyReq.setHeader('X-User-Tenant', '00000000-0000-0000-0000-000000000001');
        proxyReq.setHeader('X-User-Roles', 'SUPER_ADMIN,HR_MANAGER,DEPARTMENT_MANAGER');
        proxyReq.setHeader('X-User-Username', 'dev@surework.co.za');
        // Link to Sipho Dlamini (EMP-1001) for self-service testing
        proxyReq.setHeader('X-Employee-Id', 'e0000001-0000-0000-0000-000000000001');
      }
    }
  },
  {
    // Route payroll APIs directly to payroll-service
    // Self-service endpoints use JWT token, admin endpoints use mock headers
    context: ['/api/v1/payroll'],
    target: 'http://localhost:8083',
    secure: false,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      // If request has Authorization header (JWT), don't override with mock headers
      // This allows self-service endpoints (/my-payslips) to work with real user auth
      if (!req.headers.authorization) {
        proxyReq.setHeader('X-User-Id', '00000000-0000-0000-0000-000000000100');
        proxyReq.setHeader('X-User-Tenant', '00000000-0000-0000-0000-000000000001');
        proxyReq.setHeader('X-User-Roles', 'SUPER_ADMIN,HR_MANAGER,PAYROLL_ADMIN');
        proxyReq.setHeader('X-User-Username', 'dev@surework.co.za');
        // Link to Lindiwe Sithole (EMP-1010) for self-service testing
        proxyReq.setHeader('X-Employee-Id', 'e0000001-0000-0000-0000-000000000010');
      }
    }
  },
  {
    // Public careers API — no auth required (public-facing job listings)
    context: ['/api/public'],
    target: 'http://localhost:8075',
    secure: false,
    changeOrigin: true
  },
  {
    // Route recruitment APIs directly to recruitment-service (Docker host port 8075)
    context: ['/api/recruitment'],
    target: 'http://localhost:8075',
    secure: false,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('X-User-Id', '00000000-0000-0000-0000-000000000100');
      proxyReq.setHeader('X-User-Tenant', '00000000-0000-0000-0000-000000000001');
      proxyReq.setHeader('X-User-Roles', 'SUPER_ADMIN,HR_MANAGER,RECRUITER');
      proxyReq.setHeader('X-User-Username', 'dev@surework.co.za');
    }
  },
  {
    // Route document APIs directly to document-service (Docker host port 8089)
    context: ['/api/documents'],
    target: 'http://localhost:8089',
    secure: false,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('X-User-Id', '00000000-0000-0000-0000-000000000100');
      proxyReq.setHeader('X-User-Tenant', '00000000-0000-0000-0000-000000000001');
      proxyReq.setHeader('X-User-Roles', 'SUPER_ADMIN,HR_MANAGER,RECRUITER');
      proxyReq.setHeader('X-User-Username', 'dev@surework.co.za');
    }
  },
  {
    // Route support APIs directly to support-service
    // Self-service endpoints use JWT token, admin endpoints use mock headers
    context: ['/api/support'],
    target: 'http://localhost:8089',
    secure: false,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      // If request has JWT, extract claims into X-User-* headers; else use mock headers
      if (!setHeadersFromJwt(proxyReq, req)) {
        proxyReq.setHeader('X-User-Id', '00000000-0000-0000-0000-000000000100');
        proxyReq.setHeader('X-User-Tenant', '00000000-0000-0000-0000-000000000001');
        proxyReq.setHeader('X-User-Roles', 'SUPER_ADMIN,HR_MANAGER,SUPPORT_ADMIN');
        proxyReq.setHeader('X-User-Username', 'dev@surework.co.za');
      }
    }
  },
  {
    // Route admin APIs to admin-service (runs on port 8088 via Docker)
    // Includes auth endpoints (login/refresh) and all admin management endpoints
    context: ['/api/admin'],
    target: 'http://localhost:8088',
    secure: false,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      // Public auth endpoints don't need mock headers
      const publicPaths = ['/api/admin/auth/login', '/api/admin/auth/refresh'];
      const isPublicPath = publicPaths.some(path => req.url.startsWith(path));

      // If request has JWT, extract claims into headers; else use mock headers
      // For public paths, skip adding any headers
      if (!isPublicPath && !setHeadersFromJwt(proxyReq, req)) {
        proxyReq.setHeader('X-User-Id', '00000000-0000-0000-0000-000000000100');
        proxyReq.setHeader('X-User-Tenant', '00000000-0000-0000-0000-000000000099'); // Test Company tenant
        proxyReq.setHeader('X-User-Roles', 'SUPER_ADMIN,TENANT_ADMIN,HR_MANAGER');
        proxyReq.setHeader('X-User-Username', 'dev@surework.co.za');
      }
    }
  },
  {
    // Route notification APIs directly to notification-service (runs on port 8090)
    context: ['/api/notifications'],
    target: 'http://localhost:8090',
    secure: false,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      // If request has JWT, extract claims into X-User-* headers; else use mock headers
      if (!setHeadersFromJwt(proxyReq, req)) {
        proxyReq.setHeader('X-User-Id', '00000000-0000-0000-0000-000000000100');
        proxyReq.setHeader('X-User-Tenant', '00000000-0000-0000-0000-000000000001');
        proxyReq.setHeader('X-User-Roles', 'SUPER_ADMIN,HR_MANAGER');
        proxyReq.setHeader('X-User-Username', 'dev@surework.co.za');
      }
    }
  },
  {
    // WebSocket proxy for notifications (runs on port 8090)
    context: ['/ws/notifications'],
    target: 'http://localhost:8090',
    secure: false,
    changeOrigin: true,
    ws: true
  },
  {
    // Route signup APIs directly to tenant-service (public endpoint, no auth required)
    context: ['/api/v1/signup'],
    target: 'http://localhost:8081',
    secure: false,
    changeOrigin: true,
    logLevel: 'debug'
  },
  {
    // Other APIs through gateway (excludes specific service routes handled above)
    context: (pathname, req) => {
      // Don't proxy paths already handled by specific services
      if (pathname.startsWith('/api/v1/accounting')) return false;
      if (pathname.startsWith('/api/v1/employees')) return false;
      if (pathname.startsWith('/api/v1/departments')) return false;
      if (pathname.startsWith('/api/v1/leave')) return false;
      if (pathname.startsWith('/api/v1/job-titles')) return false;
      if (pathname.startsWith('/api/v1/payroll')) return false;
      if (pathname.startsWith('/api/hr')) return false;
      if (pathname.startsWith('/api/public')) return false;
      if (pathname.startsWith('/api/recruitment')) return false;
      if (pathname.startsWith('/api/documents')) return false;
      if (pathname.startsWith('/api/support')) return false;
      if (pathname.startsWith('/api/admin')) return false;
      if (pathname.startsWith('/api/notifications')) return false;
      if (pathname.startsWith('/api/reporting')) return false;
      if (pathname.startsWith('/api/v1/signup')) return false;
      return pathname.startsWith('/api');
    },
    target: 'http://localhost:8080',
    secure: false,
    changeOrigin: true
  }
];

module.exports = PROXY_CONFIG;
