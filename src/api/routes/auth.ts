import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import config from '../../config/config';
import { validateRequest } from '../../middleware/security';
import { authRateLimiter } from '../../middleware/security/rateLimitMiddleware';
import { authenticate, hasPermission } from '../../middleware/security/authMiddleware';

const router = Router();

// Define validation schemas for auth requests
const LoginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(100),
});

const RegisterSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(100),
  email: z.string().email(),
  fullName: z.string().min(1).max(100).optional(),
});

const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});

const ApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.string()).optional(),
  expiresIn: z.string().optional(), // e.g., '30d', '1y'
});

// Simulated users database (replace with actual database in production)
// In a real implementation, passwords would be hashed using bcrypt
const users = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123!',
    email: 'admin@example.com',
    role: 'admin',
    permissions: ['read:all', 'write:all', 'delete:all', 'admin:all'],
  }
];

// Simulated refresh tokens (replace with database storage in production)
const refreshTokens = new Map();

// Simulated API keys (replace with database storage in production)
const apiKeys = new Map();

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and get tokens
 * @access Public
 */
router.post('/login', authRateLimiter, validateRequest(LoginSchema), (req, res) => {
  const { username, password } = req.body;
  
  // Find user (in real app, you'd query a database)
  const user = users.find(u => u.username === username);
  
  if (!user || user.password !== password) {
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid username or password'
    });
  }
  
  // Create tokens
  const accessToken = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      permissions: user.permissions
    },
    config.security.auth.jwtSecret,
    { expiresIn: config.security.auth.tokenExpiration }
  );
  
  // Create refresh token
  const refreshToken = uuidv4();
  refreshTokens.set(refreshToken, {
    userId: user.id,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });
  
  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email
    }
  });
});

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', authRateLimiter, validateRequest(RegisterSchema), (req, res) => {
  const { username, password, email, fullName } = req.body;
  
  // Check if username already exists
  if (users.some(u => u.username === username)) {
    return res.status(400).json({
      error: 'Registration failed',
      message: 'Username already exists'
    });
  }
  
  // Check if email already exists
  if (users.some(u => u.email === email)) {
    return res.status(400).json({
      error: 'Registration failed',
      message: 'Email already exists'
    });
  }
  
  // Create new user (in real app, you'd store in a database)
  const newUser = {
    id: uuidv4(),
    username,
    password, // In a real app, you'd hash this with bcrypt
    email,
    fullName: fullName || username,
    role: 'user', // Default role
    permissions: ['read:own'] // Default permissions
  };
  
  users.push(newUser);
  
  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role
    }
  });
});

/**
 * @route POST /api/auth/refresh
 * @desc Refresh JWT token
 * @access Public
 */
router.post('/refresh', authRateLimiter, validateRequest(RefreshTokenSchema), (req, res) => {
  const { refreshToken } = req.body;
  
  // Validate refresh token
  const tokenData = refreshTokens.get(refreshToken);
  
  if (!tokenData) {
    return res.status(401).json({
      error: 'Invalid refresh token',
      message: 'Refresh token is invalid or expired'
    });
  }
  
  // Check if token is expired
  if (new Date() > new Date(tokenData.expires)) {
    refreshTokens.delete(refreshToken);
    return res.status(401).json({
      error: 'Expired refresh token',
      message: 'Refresh token has expired'
    });
  }
  
  // Find user
  const user = users.find(u => u.id === tokenData.userId);
  
  if (!user) {
    return res.status(401).json({
      error: 'User not found',
      message: 'User associated with this token no longer exists'
    });
  }
  
  // Create new access token
  const accessToken = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      permissions: user.permissions
    },
    config.security.auth.jwtSecret,
    { expiresIn: config.security.auth.tokenExpiration }
  );
  
  // Create new refresh token
  const newRefreshToken = uuidv4();
  refreshTokens.set(newRefreshToken, {
    userId: user.id,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });
  
  // Delete old refresh token
  refreshTokens.delete(refreshToken);
  
  res.json({
    accessToken,
    refreshToken: newRefreshToken
  });
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user and invalidate refresh token
 * @access Protected
 */
router.post('/logout', authenticate, (req, res) => {
  const refreshToken = req.body.refreshToken;
  
  if (refreshToken) {
    // Invalidate refresh token
    refreshTokens.delete(refreshToken);
  }
  
  res.json({
    message: 'Logged out successfully'
  });
});

/**
 * @route GET /api/auth/me
 * @desc Get current user
 * @access Protected
 */
router.get('/me', authenticate, (req, res) => {
  // User is already attached to request by authenticate middleware
  const user = req.user;
  
  res.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      permissions: user.permissions
    }
  });
});

/**
 * @route POST /api/auth/apikeys
 * @desc Create a new API key
 * @access Protected, Admin only
 */
router.post('/apikeys', authenticate, hasPermission(['admin:all']), validateRequest(ApiKeySchema), (req, res) => {
  const { name, permissions = ['read:all'], expiresIn = '365d' } = req.body;
  
  // Generate API key
  const apiKey = uuidv4();
  
  // Parse expiration time
  let expirationDate = null;
  const match = expiresIn.match(/^(\d+)([dmy])$/);
  
  if (match) {
    const [_, amount, unit] = match;
    const now = new Date();
    
    switch (unit) {
      case 'd': // days
        expirationDate = new Date(now.setDate(now.getDate() + parseInt(amount)));
        break;
      case 'm': // months
        expirationDate = new Date(now.setMonth(now.getMonth() + parseInt(amount)));
        break;
      case 'y': // years
        expirationDate = new Date(now.setFullYear(now.getFullYear() + parseInt(amount)));
        break;
    }
  }
  
  // Store API key (in real app, you'd store in a database)
  apiKeys.set(apiKey, {
    name,
    permissions,
    createdBy: req.user.id,
    createdAt: new Date(),
    expiresAt: expirationDate
  });
  
  res.status(201).json({
    message: 'API key created successfully',
    key: {
      name,
      apiKey,
      permissions,
      expiresAt: expirationDate
    }
  });
});

/**
 * @route GET /api/auth/apikeys
 * @desc List all API keys
 * @access Protected, Admin only
 */
router.get('/apikeys', authenticate, hasPermission(['admin:all']), (req, res) => {
  const keys = [];
  
  // Convert Map to array
  for (const [key, value] of apiKeys.entries()) {
    keys.push({
      apiKey: key.substring(0, 8) + '...', // Only show first 8 chars for security
      name: value.name,
      permissions: value.permissions,
      createdAt: value.createdAt,
      expiresAt: value.expiresAt
    });
  }
  
  res.json({
    keys
  });
});

/**
 * @route DELETE /api/auth/apikeys/:key
 * @desc Revoke an API key
 * @access Protected, Admin only
 */
router.delete('/apikeys/:key', authenticate, hasPermission(['admin:all']), (req, res) => {
  const apiKey = req.params.key;
  
  if (!apiKeys.has(apiKey)) {
    return res.status(404).json({
      error: 'Not found',
      message: 'API key not found'
    });
  }
  
  // Revoke API key
  apiKeys.delete(apiKey);
  
  res.json({
    message: 'API key revoked successfully'
  });
});

export default router; 