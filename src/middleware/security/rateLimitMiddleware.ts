import rateLimit from 'express-rate-limit';
import config from '../../config/config';

/**
 * Default rate limiter middleware
 * Limits the number of requests per IP address
 */
export const defaultRateLimiter = rateLimit({
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: `Too many requests from this IP, please try again after ${Math.ceil(config.security.rateLimit.windowMs / 60000)} minutes`
  },
  skip: (req) => !config.security.rateLimit.enabled // Skip if rate limiting is disabled
});

/**
 * Create a custom rate limiter with specific settings
 * @param options - Custom rate limit options
 */
export function createRateLimiter(options: {
  windowMs?: number;
  maxRequests?: number;
  message?: string | object;
}) {
  return rateLimit({
    windowMs: options.windowMs || config.security.rateLimit.windowMs,
    max: options.maxRequests || config.security.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: options.message || {
      error: 'Too Many Requests',
      message: `Too many requests from this IP, please try again after ${Math.ceil((options.windowMs || config.security.rateLimit.windowMs) / 60000)} minutes`
    },
    skip: (req) => !config.security.rateLimit.enabled // Skip if rate limiting is disabled
  });
}

/**
 * Stricter rate limiter for sensitive endpoints like authentication
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Too many login attempts, please try again after 15 minutes'
  },
  skip: (req) => !config.security.rateLimit.enabled // Skip if rate limiting is disabled
});

/**
 * API specific rate limiter
 * Uses a higher limit for API endpoints
 */
export const apiRateLimiter = rateLimit({
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.maxRequests * 2, // Double the default limit for API
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: `API rate limit exceeded, please try again after ${Math.ceil(config.security.rateLimit.windowMs / 60000)} minutes`
  },
  skip: (req) => !config.security.rateLimit.enabled // Skip if rate limiting is disabled
}); 