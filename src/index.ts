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
import { setupSecurity } from './middleware/security';

// Create Express application
const app = express();

// Basic middleware
app.use(express.json());
app.use(morgan('dev'));

// Set up security middleware (Sprint 5.1)
console.log('Initializing enterprise security features...');
setupSecurity(app, {
  // Override settings from config if needed
});

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

// Add security monitoring endpoint
app.get('/api/stats/security', (req, res) => {
  res.json({
    status: 'secure',
    auth: {
      enabled: config.security.auth.enabled,
      method: config.security.auth.enabled ? 'JWT+ApiKey' : 'None'
    },
    rateLimit: {
      enabled: config.security.rateLimit.enabled,
      window: `${config.security.rateLimit.windowMs / 60000} minutes`,
      limit: config.security.rateLimit.maxRequests
    },
    helmet: {
      enabled: config.security.helmet.enabled,
      csp: config.security.helmet.contentSecurityPolicy
    },
    cors: {
      origins: config.security.cors.allowOrigins.includes('*') ? 
        'All' : config.security.cors.allowOrigins.join(', ')
    }
  });
});

// Performance monitoring endpoint
app.get('/api/stats/cache', function(req, res) {
  // Return metrics about the caching system
  const browserPool = BrowserPool.getInstance();
  
  return res.json({
    enabled: config.cache.enabled,
    pageCacheSize: browserPool.getCachedPageCount(),
    pageCacheMaxSize: config.cache.maxPageCacheSize,
    pagesCached: browserPool.getCachedPageCount(),
    browserInstances: browserPool.getBrowserCount()
  });
});

// API routes
app.use('/api', routes);

// Default route
app.get('/', (req, res) => {
  res.json({
    name: 'InspectorAI',
    status: 'operational',
    features: [
      'Screenshot capture',
      'Console log analysis',
      'Network monitoring',
      'DOM manipulation',
      'Image analysis',
      'Performance optimization',
      'Enterprise security'
    ]
  });
});

// Start the server
const server = app.listen(config.server.port, () => {
  console.log(`InspectorAI server listening on port ${config.server.port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Security features: ${config.security.auth.enabled ? 'Enabled' : 'Disabled'}`);
  console.log(`Caching: ${config.cache.enabled ? 'Enabled' : 'Disabled'}`);
  
  // Report resource counts
  console.log(`Resources: ${browserPool.getBrowserCount()} browser instances`);
  
  if (config.cache.enabled) {
    const responseCache = ResponseCache.getInstance();
    console.log(`Cache capacity: ${config.cache.responseCache.maxSize} responses`);
  }
});

// Start MCP server if enabled
if (config.features.mcpServer.enabled) {
  console.log('Starting MCP server...');
  const mcpServer = new InspectorAIMCPServer(config.features.mcpServer.port);
  
  registerAllTools(mcpServer);
  
  mcpServer.start().then(() => {
    console.log(`MCP server listening on port ${config.features.mcpServer.port}`);
  });
}

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await server.close();
  console.log('HTTP server closed');
  // Close browser instances
  await BrowserPool.getInstance().closeAll();
  console.log('Browser instances closed');
  process.exit(0);
});

// Clean up resources on shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  // Close all browser instances
  await BrowserPool.getInstance().closeAll();
  console.log('All browser instances closed.');
  process.exit(0);
});

// Type for error parameter
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
}); 