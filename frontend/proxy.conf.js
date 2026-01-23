const PROXY_CONFIG = [
  {
    // Route employee and department APIs directly to hr-service
    // Bypassing API Gateway which has corrupted chunked encoding
    context: ['/api/v1/employees', '/api/v1/departments'],
    target: 'http://localhost:8082',
    secure: false,
    changeOrigin: true
  },
  {
    // Route leave APIs directly to hr-service
    context: ['/api/v1/leave'],
    target: 'http://localhost:8082',
    secure: false,
    changeOrigin: true
  },
  {
    // Route recruitment APIs directly to recruitment-service
    context: ['/api/recruitment'],
    target: 'http://localhost:8085',
    secure: false,
    changeOrigin: true
  },
  {
    // Route document APIs directly to document-service
    context: ['/api/documents'],
    target: 'http://localhost:8088',
    secure: false,
    changeOrigin: true
  },
  {
    // Route auth APIs to admin-service
    context: ['/api/admin'],
    target: 'http://localhost:8081',
    secure: false,
    changeOrigin: true
  },
  {
    // Other APIs through gateway (will need fixing later)
    context: ['/api'],
    target: 'http://localhost:8080',
    secure: false,
    changeOrigin: true
  }
];

module.exports = PROXY_CONFIG;
