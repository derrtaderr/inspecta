import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './api/routes';
import config from './config/config';
import { InspectorAIMCPServer } from './mcp';
import { registerAllTools } from './mcp/tools';
import { cacheMiddleware, cacheRoute } from './middleware/cacheMiddleware';
import { BrowserPool } from './browser/BrowserPool';
import { ResponseCache } from './browser/ResponseCache';

// Create Express application
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize performance optimization features (Sprint 4.2)
console.log('Initializing performance optimization features...');

// Initialize browser pool
const browserPool = BrowserPool.getInstance();
console.log(`Browser pool initialized with max ${config.browser.maxInstances} instances`);

// Add caching middleware if enabled
if (config.cache.enabled) {
  console.log('Response caching enabled for API routes');
  
  // Global cache middleware for routes that don't need special handling
  app.use(cacheMiddleware());
  
  // Use more specific cache routes for frequently accessed endpoints
  app.use('/api/screenshot', cacheRoute('/api/screenshot', { 
    ttl: 2 * 60 * 1000 // 2 minutes for screenshots
  }));
  
  app.use('/api/console-logs', cacheRoute('/api/console-logs', { 
    ttl: 5 * 60 * 1000 // 5 minutes for console logs
  }));
  
  // Cache static resources much longer
  app.use('/static', express.static('public', { 
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }));
} else {
  console.log('Response caching disabled');
}

// API routes
app.use('/api', routes);

// Cache stats endpoint
app.get('/api/stats/cache', (_req, res) => {
  const responseCache = ResponseCache.getInstance();
  const cachedPages = browserPool.getCachedPageCount();
  const cachedResponses = responseCache.getSize();
  const browserCount = browserPool.getBrowserCount();
  
  res.json({
    cacheEnabled: config.cache.enabled,
    responseCacheEnabled: config.cache.responseCache.enabled,
    stats: {
      browserInstances: browserCount,
      cachedPages,
      cachedResponses,
      maxBrowserInstances: config.browser.maxInstances,
      maxPageCacheSize: config.cache.maxPageCacheSize,
      maxResponseCacheSize: config.cache.responseCache.maxSize
    }
  });
});

// Default route
app.get('/', (_req, res) => {
  res.json({
    name: 'InspectorAI API',
    version: '1.0.0',
    status: 'running',
    performanceOptimized: true // Indicate Sprint 4.2 features are implemented
  });
});

// Create and configure MCP server (if enabled)
let mcpServer: InspectorAIMCPServer | null = null;

if (config.features.mcpServer && config.features.mcpServer.enabled) {
  const mcpPort = config.features.mcpServer.port || 3001;
  mcpServer = new InspectorAIMCPServer(mcpPort);
  
  // Register all tools with the MCP server
  registerAllTools(mcpServer);
  
  // Start MCP server
  mcpServer.start()
    .then(() => {
      console.log(`MCP Server running on port ${mcpPort}`);
    })
    .catch(err => {
      console.error('Failed to start MCP server:', err);
    });
}

// Start server
const PORT = config.server.port;
const HOST = config.server.host;

app.listen(PORT, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
  console.log(`Performance optimizations: ${config.cache.enabled ? 'ENABLED' : 'DISABLED'}`);
  console.log(`Page caching (${browserPool.getCachedPageCount()}/` + 
              `${config.cache.maxPageCacheSize}): ${config.cache.enabled ? 'ENABLED' : 'DISABLED'}`);
  console.log(`Response caching (${ResponseCache.getInstance().getSize()}/` + 
              `${config.cache.responseCache.maxSize}): ${config.cache.responseCache.enabled ? 'ENABLED' : 'DISABLED'}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  
  // Clean up resources
  browserPool.closeAll().catch(err => {
    console.error('Error closing browser pool:', err);
  });
  
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  
  // Clean up resources
  browserPool.closeAll().catch(err => {
    console.error('Error closing browser pool:', err);
  });
  
  process.exit(0);
});

export default app;
export { mcpServer }; 