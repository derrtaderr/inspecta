import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../../config/config';

/**
 * Extended Express Request interface with user information
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
    permissions: string[];
  };
}

/**
 * API key authentication middleware
 * Verifies the API key in the request header
 */
export const apiKeyAuth = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  // Skip if authentication is disabled
  if (!config.security.auth.enabled) {
    return next();
  }

  const apiKey = req.header(config.security.auth.apiKeyHeader);
  
  // This is a simplified example - in production, you'd verify against a database
  // of valid API keys, potentially with rate limiting per key
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid or missing API key'
    });
  }

  // For simplicity, we're setting a default user with admin role
  // In a real app, you'd look up the user/permissions associated with this API key
  req.user = {
    id: 'api-user',
    username: 'api-client',
    role: 'api',
    permissions: ['read:all', 'write:all']
  };

  next();
};

/**
 * JWT authentication middleware
 * Verifies the JWT token in the Authorization header
 */
export const jwtAuth = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  // Skip if authentication is disabled
  if (!config.security.auth.enabled) {
    return next();
  }

  // Get token from header
  const authHeader = req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'No token provided'
    });
  }

  // Extract token
  const token = authHeader.split(' ')[1];

  try {
    // Verify token
    const decoded = jwt.verify(token, config.security.auth.jwtSecret);
    
    // Add user info to request
    req.user = decoded as AuthenticatedRequest['user'];
    
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }
};

/**
 * Authentication middleware that tries multiple authentication methods
 * First checks for JWT, then falls back to API key
 */
export const authenticate = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  // Skip if authentication is disabled
  if (!config.security.auth.enabled) {
    return next();
  }

  // Check if Authorization header is present (JWT)
  const authHeader = req.header('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // JWT auth path
    return jwtAuth(req, res, next);
  } else {
    // API key auth path
    return apiKeyAuth(req, res, next);
  }
};

/**
 * Role-based authorization middleware
 * @param roles - Array of allowed roles
 */
export const authorize = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Skip if authentication is disabled
    if (!config.security.auth.enabled) {
      return next();
    }

    // Check if user exists (set by authentication middleware)
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // Check if user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Permission-based authorization middleware
 * @param requiredPermissions - Array of required permissions
 */
export const hasPermission = (requiredPermissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Skip if authentication is disabled
    if (!config.security.auth.enabled) {
      return next();
    }

    // Check if user exists (set by authentication middleware)
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every(permission => 
      req.user?.permissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    }

    next();
  };
}; 