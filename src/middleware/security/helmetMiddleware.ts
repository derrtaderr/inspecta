import helmet from 'helmet';
import { RequestHandler } from 'express';
import config from '../../config/config';

/**
 * Configure Helmet middleware with appropriate security headers
 * Helmet helps secure Express apps by setting HTTP response headers
 */
export function configureHelmet(): RequestHandler {
  // If helmet is disabled, return empty middleware
  if (!config.security.helmet.enabled) {
    return (req, res, next) => next();
  }

  // Define CSP options if enabled
  const helmetOptions: helmet.HelmetOptions = {};
  
  if (config.security.helmet.contentSecurityPolicy) {
    helmetOptions.contentSecurityPolicy = {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Needed for some UI components
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        frameAncestors: ["'none'"], // Helps prevent clickjacking
        // Report violations to /api/csp-report
        reportUri: '/api/csp-report',
      },
    };
  } else {
    // Disable CSP if not explicitly enabled
    helmetOptions.contentSecurityPolicy = false;
  }
  
  // Configure other security headers
  return helmet({
    ...helmetOptions,
    // Strict Transport Security
    // Tells browsers to prefer HTTPS over HTTP
    strictTransportSecurity: {
      maxAge: 63072000, // 2 years
      includeSubDomains: true,
      preload: true,
    },
    // X-XSS-Protection header
    // Stops pages from loading when they detect reflected XSS attacks
    xssFilter: true,
    // X-Frame-Options header
    // Prevents clickjacking by not allowing the site to be embedded in frames
    frameguard: {
      action: 'deny',
    },
    // X-Content-Type-Options header
    // Prevents browsers from MIME-sniffing a response from the declared content-type
    noSniff: true,
    // Referrer-Policy header
    // Controls how much referrer information should be included with requests
    referrerPolicy: {
      policy: 'same-origin',
    },
    // Feature-Policy / Permissions-Policy
    // Allows you to control which browser features are available to use
    permissionsPolicy: {
      features: {
        geolocation: ["'none'"],
        camera: ["'none'"],
        microphone: ["'none'"],
        notifications: ["'none'"],
        push: ["'none'"],
      },
    },
    // Don't set X-Powered-By header
    // Removes the default Express X-Powered-By header
    hidePoweredBy: true,
    // Set Cross-Origin-Embedder-Policy
    // Prevents document from loading any cross-origin resources without explicit permission
    crossOriginEmbedderPolicy: false, // Set to false to allow loading resources
    // Set Cross-Origin-Opener-Policy
    // Ensures a top-level document does not share a browsing context with cross-origin documents
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    // Set Cross-Origin-Resource-Policy
    // Prevents other domains from reading resources
    crossOriginResourcePolicy: { policy: 'same-site' },
    // Origin-Agent-Cluster header
    // Provides a mechanism to isolate browsing contexts by origin
    originAgentCluster: true,
  });
} 