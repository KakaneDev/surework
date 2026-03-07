const PROXY_CONFIG = [
  {
    context: ['/admin-api'],
    target: 'http://localhost:8080',
    secure: false,
    changeOrigin: true,
    logLevel: 'debug',
    // Fix chunked transfer encoding issues - don't use http2 and handle response properly
    headers: {
      Connection: 'keep-alive'
    },
    onProxyRes: (proxyRes, req, res) => {
      // Remove transfer-encoding to avoid chunked encoding issues with the dev server
      if (proxyRes.headers['transfer-encoding']) {
        delete proxyRes.headers['transfer-encoding'];
      }
    },
    onProxyReq: (proxyReq, req, res) => {
      // Public paths that don't need auth headers
      const publicPaths = ['/admin-api/v1/auth/login', '/admin-api/v1/auth/refresh'];
      const isPublicPath = publicPaths.some(path => req.url.startsWith(path));

      // Add mock headers for development if no JWT present
      if (!req.headers.authorization && !isPublicPath) {
        proxyReq.setHeader('X-User-Id', '00000000-0000-0000-0000-000000000100');
        proxyReq.setHeader('X-User-Tenant', '00000000-0000-0000-0000-000000000001');
        proxyReq.setHeader('X-User-Roles', 'SUPER_ADMIN,PORTAL_ADMIN');
        proxyReq.setHeader('X-User-Username', 'admin@surework.co.za');
      }
    }
  },
  {
    context: ['/ws'],
    target: 'ws://localhost:8090',
    ws: true,
    secure: false,
    changeOrigin: true,
    logLevel: 'debug'
  }
];

module.exports = PROXY_CONFIG;
