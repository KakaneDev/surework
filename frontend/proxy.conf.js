const PROXY_CONFIG = [
  {
    // Route employee and department APIs directly to employee-service
    // Bypassing API Gateway which has corrupted chunked encoding
    context: ['/api/v1/employees', '/api/v1/departments'],
    target: 'http://localhost:8086',
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
