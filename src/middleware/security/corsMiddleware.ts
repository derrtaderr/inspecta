import cors from 'cors';
import { RequestHandler } from 'express';
import config from '../../config/config';

/**
 * Configure CORS middleware with appropriate settings
 * Controls Cross-Origin Resource Sharing
 */
export function configureCors(): RequestHandler {
  return cors({
    // Origin configuration
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Check allowed origins from config
      const allowedOrigins = config.security.cors.allowOrigins;
      
      // If wildcard is allowed, accept all origins
      if (allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      
      // Check if the origin is in the allowed list
      if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
        return callback(null, true);
      }
      
      // Origin not allowed
      callback(new Error('Not allowed by CORS'));
    },
    // Methods allowed
    methods: config.security.cors.allowMethods,
    // Allowed headers
    allowedHeaders: config.security.cors.allowHeaders,
    // Expose these headers to the client
    exposedHeaders: config.security.cors.exposedHeaders,
    // Allow credentials (cookies, authorization headers)
    credentials: config.security.cors.allowCredentials,
    // Sets Access-Control-Max-Age header
    maxAge: config.security.cors.maxAge,
    // Handle preflight requests
    preflightContinue: false,
    // Return accurate success status for preflight requests
    optionsSuccessStatus: 204,
  });
} 