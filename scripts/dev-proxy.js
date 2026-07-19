/**
 * ConnectWorld Dev Proxy
 * 
 * Forwards port 3000 → port 5001
 * This is needed because OAuth providers (Google, GitHub) are configured
 * with redirect URIs pointing to localhost:3000, but the dev server
 * actually runs on port 5001.
 */

const http = require('http');

const TARGET_PORT = 5000;
const PROXY_PORT = 3000;
const TARGET_HOST = 'localhost';

const server = http.createServer((req, res) => {
  const options = {
    hostname: TARGET_HOST,
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${TARGET_HOST}:${TARGET_PORT}`,
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    // Forward the status code and headers
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    // Pipe the response body
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error(`[proxy] Error proxying ${req.method} ${req.url}:`, err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end(`Bad Gateway - Cannot connect to server on port ${TARGET_PORT}`);
    }
  });

  console.log(`[proxy] ${req.method} ${req.url} → :${TARGET_PORT}`);

  // Pipe the request body
  req.pipe(proxyReq);
});

server.listen(PROXY_PORT, () => {
  console.log(`\n🔁 Dev proxy running: :${PROXY_PORT} → :${TARGET_PORT}`);
  console.log(`   OAuth callbacks will work at http://localhost:${PROXY_PORT}/api/auth/*`);
  console.log(`   Links on the login page will use http://localhost:${PROXY_PORT}/api/auth/*\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => { console.log('\n[proxy] Shutting down...'); server.close(() => process.exit(0)); });
process.on('SIGINT', () => { console.log('\n[proxy] Shutting down...'); server.close(() => process.exit(0)); });
