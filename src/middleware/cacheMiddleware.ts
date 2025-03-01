import { Request, Response, NextFunction } from 'express';
import { ResponseCache } from '../browser/ResponseCache';
import config from '../config/config';

/**
 * Options for the cache middleware
 */
export interface CacheOptions {
  ttl?: number;
  keyFn?: (req: Request) => string | Record<string, any>;
  condition?: (req: Request) => boolean;
}

/**
 * Default function to generate cache keys from requests
 */
const defaultKeyFn = (req: Request): Record<string, any> => {
  return {
    method: req.method,
    url: req.originalUrl || req.url,
    // Include query parameters for GET requests
    ...(req.method === 'GET' && { query: req.query }),
    // Include body for POST requests if it's not a file upload
    ...(req.method === 'POST' && 
        !req.is('multipart/form-data') && 
        { body: req.body })
  };
};

/**
 * Default condition to determine if a request should be cached
 */
const defaultCondition = (req: Request): boolean => {
  // Only cache GET and POST requests by default
  if (req.method !== 'GET' && req.method !== 'POST') {
    return false;
  }
  
  // Don't cache file uploads
  if (req.is('multipart/form-data')) {
    return false;
  }
  
  // Don't cache if the client explicitly requests no caching
  const noCache = req.headers['cache-control'] === 'no-cache' || 
                 req.headers.pragma === 'no-cache';
  
  return !noCache;
};

/**
 * Middleware for caching API responses
 * @param options Cache configuration options
 * @returns Express middleware function
 */
export const cacheMiddleware = (options: CacheOptions = {}) => {
  // Only initialize if caching is enabled
  if (!config.cache.responseCache.enabled) {
    return (req: Request, res: Response, next: NextFunction) => next();
  }
  
  const cache = ResponseCache.getInstance();
  const keyFn = options.keyFn || defaultKeyFn;
  const condition = options.condition || defaultCondition;
  const ttl = options.ttl || config.cache.responseCache.ttl;
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip caching if condition is not met
    if (!condition(req)) {
      return next();
    }
    
    // Generate cache key
    const cacheKey = keyFn(req);
    
    // Check if response is in cache
    const cachedResponse = cache.get<{
      status: number;
      headers: Record<string, string>;
      body: any;
    }>(cacheKey);
    
    if (cachedResponse) {
      // Set headers to indicate cache hit
      res.set('X-Cache', 'HIT');
      
      // Set original headers from cached response
      Object.entries(cachedResponse.headers).forEach(([key, value]) => {
        res.set(key, value);
      });
      
      // Send cached response with original status code
      return res.status(cachedResponse.status).send(cachedResponse.body);
    }
    
    // Cache miss - flag and store original response methods
    res.set('X-Cache', 'MISS');
    
    // Store original response methods
    const originalSend = res.send;
    const originalJson = res.json;
    const originalStatus = res.status;
    
    // Track response status
    let responseStatus = 200;
    
    // Override status method
    res.status = function(code: number) {
      responseStatus = code;
      return originalStatus.apply(this, [code]);
    };
    
    // Function to cache response
    const cacheResponse = (body: any) => {
      // Only cache successful responses
      if (responseStatus >= 200 && responseStatus < 400) {
        // Capture headers to cache
        const headers: Record<string, string> = {};
        const headersToCache = ['content-type', 'etag', 'last-modified'];
        
        headersToCache.forEach(header => {
          const value = res.getHeader(header);
          if (value) {
            headers[header] = String(value);
          }
        });
        
        // Store in cache
        cache.set(
          cacheKey,
          {
            status: responseStatus,
            headers,
            body
          },
          ttl
        );
      }
      
      return body;
    };
    
    // Override send method to intercept and cache response
    res.send = function(body: any) {
      return originalSend.apply(this, [cacheResponse(body)]);
    };
    
    // Override json method to intercept and cache response
    res.json = function(body: any) {
      return originalJson.apply(this, [cacheResponse(body)]);
    };
    
    next();
  };
};

/**
 * Factory function to create route-specific cache middleware
 * @param routePath The route path pattern
 * @param options Cache options for this route
 * @returns Express middleware function
 */
export const cacheRoute = (routePath: string | RegExp, options: CacheOptions = {}) => {
  const middleware = cacheMiddleware(options);
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if the route matches
    const url = req.originalUrl || req.url;
    const matches = typeof routePath === 'string'
      ? url.startsWith(routePath)
      : routePath.test(url);
    
    if (matches) {
      middleware(req, res, next);
    } else {
      next();
    }
  };
};

/**
 * Clear the cache for a specific route or pattern
 * @param pattern Route pattern to clear cache for
 */
export const clearRouteCache = (pattern: string | RegExp): void => {
  const cache = ResponseCache.getInstance();
  
  // Since we can't easily query the cache by pattern,
  // we would need to implement a separate tracking mechanism
  // This is a limitation of how LRU cache keys work
  
  // For now, we'll just clear the entire cache
  // In a future optimization, we could track keys by route
  cache.clear();
  
  console.log(`Cleared cache for pattern: ${pattern}`);
}; 