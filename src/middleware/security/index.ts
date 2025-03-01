import { Express, RequestHandler } from 'express';
import { authenticate, authorize, hasPermission } from './authMiddleware';
import { defaultRateLimiter, apiRateLimiter, authRateLimiter, createRateLimiter } from './rateLimitMiddleware';
import { configureHelmet } from './helmetMiddleware';
import { configureCors } from './corsMiddleware';
import config from '../../config/config';

// Export individual middleware
export { 
  authenticate, 
  authorize, 
  hasPermission,
  defaultRateLimiter, 
  apiRateLimiter, 
  authRateLimiter, 
  createRateLimiter,
  configureHelmet,
  configureCors
};

/**
 * Configuration for security middleware setup
 */
interface SecurityOptions {
  helmetEnabled?: boolean;
  corsEnabled?: boolean;
  rateLimitEnabled?: boolean;
  authEnabled?: boolean;
}

/**
 * Apply all security middleware to an Express application
 * @param app - Express application
 * @param options - Configuration options
 */
export function setupSecurity(app: Express, options: SecurityOptions = {}): void {
  console.log('Setting up security middleware...');
  
  // Merge options with config
  const securityConfig = {
    helmetEnabled: options.helmetEnabled ?? config.security.helmet.enabled,
    corsEnabled: options.corsEnabled ?? true,
    rateLimitEnabled: options.rateLimitEnabled ?? config.security.rateLimit.enabled,
    authEnabled: options.authEnabled ?? config.security.auth.enabled,
  };
  
  // Apply security middleware in correct order
  
  // 1. Helmet (HTTP headers security)
  if (securityConfig.helmetEnabled) {
    console.log('- Adding Helmet security headers');
    app.use(configureHelmet());
  }
  
  // 2. CORS (Cross-Origin Resource Sharing)
  if (securityConfig.corsEnabled) {
    console.log('- Configuring CORS protection');
    app.use(configureCors());
  }
  
  // 3. Rate limiting (protection against brute force)
  if (securityConfig.rateLimitEnabled) {
    console.log('- Setting up rate limiting protection');
    // Apply default rate limiter to all routes
    app.use(defaultRateLimiter);
    
    // Apply stricter rate limiting to auth endpoints
    app.use('/api/auth/*', authRateLimiter);
  }
  
  // End of global middleware
  console.log('Security middleware configuration complete');
}

/**
 * Create a middleware function that validates request data
 * @param schema - Zod schema to validate against
 * @param source - Source of data to validate ('body', 'query', 'params')
 */
export function validateRequest(schema: any, source: 'body' | 'query' | 'params' = 'body'): RequestHandler {
  return (req, res, next) => {
    try {
      const data = req[source];
      const validatedData = schema.parse(data);
      
      // Replace the request data with the validated data
      req[source] = validatedData;
      
      next();
    } catch (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'The request data failed validation',
        details: error
      });
    }
  };
} 