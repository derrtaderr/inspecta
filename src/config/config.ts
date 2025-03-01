/**
 * Application configuration settings
 */
export interface Config {
  server: {
    port: number;
    host: string;
  };
  browser: {
    headless: boolean;
    defaultViewport: {
      width: number;
      height: number;
    };
    timeout: number;
    maxInstances: number;
  };
  logging: {
    level: string;
    enableConsole: boolean;
  };
  features: {
    mcpServer: {
      enabled: boolean;
      port: number;
      basePath: string;
      allowOrigin: string | string[];
    };
  };
  cache: {
    enabled: boolean;
    maxPageCacheSize: number;
    pageCacheTTL: number;
    responseCache: {
      enabled: boolean;
      maxSize: number;
      ttl: number;
    }
  };
  security: {
    auth: {
      enabled: boolean;
      jwtSecret: string;
      tokenExpiration: string;
      apiKeyHeader: string;
    };
    rateLimit: {
      enabled: boolean;
      windowMs: number;
      maxRequests: number;
    };
    helmet: {
      enabled: boolean;
      contentSecurityPolicy: boolean;
    };
    cors: {
      allowOrigins: string[];
      allowMethods: string[];
      allowHeaders: string[];
      allowCredentials: boolean;
      exposedHeaders: string[];
      maxAge: number;
    };
  };
}

const config: Config = {
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    host: process.env.HOST || 'localhost',
  },
  browser: {
    headless: process.env.BROWSER_HEADLESS !== 'false',
    defaultViewport: {
      width: process.env.VIEWPORT_WIDTH ? parseInt(process.env.VIEWPORT_WIDTH, 10) : 1280,
      height: process.env.VIEWPORT_HEIGHT ? parseInt(process.env.VIEWPORT_HEIGHT, 10) : 800,
    },
    timeout: process.env.BROWSER_TIMEOUT ? parseInt(process.env.BROWSER_TIMEOUT, 10) : 30000,
    maxInstances: process.env.MAX_BROWSER_INSTANCES
      ? parseInt(process.env.MAX_BROWSER_INSTANCES, 10)
      : 5,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: process.env.ENABLE_CONSOLE_LOGGING !== 'false',
  },
  features: {
    mcpServer: {
      enabled: process.env.MCP_SERVER_ENABLED === 'true',
      port: process.env.MCP_SERVER_PORT ? parseInt(process.env.MCP_SERVER_PORT, 10) : 3001,
      basePath: process.env.MCP_SERVER_BASE_PATH || '/mcp',
      allowOrigin: process.env.MCP_SERVER_ALLOW_ORIGIN || '*',
    },
  },
  cache: {
    enabled: process.env.CACHE_ENABLED !== 'false',
    maxPageCacheSize: process.env.MAX_PAGE_CACHE_SIZE 
      ? parseInt(process.env.MAX_PAGE_CACHE_SIZE, 10) 
      : 20,
    pageCacheTTL: process.env.PAGE_CACHE_TTL 
      ? parseInt(process.env.PAGE_CACHE_TTL, 10) 
      : 5 * 60 * 1000,
    responseCache: {
      enabled: process.env.RESPONSE_CACHE_ENABLED !== 'false',
      maxSize: process.env.RESPONSE_CACHE_SIZE 
        ? parseInt(process.env.RESPONSE_CACHE_SIZE, 10) 
        : 100,
      ttl: process.env.RESPONSE_CACHE_TTL 
        ? parseInt(process.env.RESPONSE_CACHE_TTL, 10) 
        : 10 * 60 * 1000,
    }
  },
  security: {
    auth: {
      enabled: process.env.AUTH_ENABLED === 'true',
      jwtSecret: process.env.JWT_SECRET || 'inspecta-default-jwt-secret-change-in-production',
      tokenExpiration: process.env.TOKEN_EXPIRATION || '24h',
      apiKeyHeader: process.env.API_KEY_HEADER || 'x-api-key',
    },
    rateLimit: {
      enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
      windowMs: process.env.RATE_LIMIT_WINDOW_MS 
        ? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) 
        : 15 * 60 * 1000, // 15 minutes
      maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS 
        ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) 
        : 100, // 100 requests per windowMs
    },
    helmet: {
      enabled: process.env.HELMET_ENABLED !== 'false',
      contentSecurityPolicy: process.env.CSP_ENABLED === 'true',
    },
    cors: {
      allowOrigins: process.env.CORS_ALLOW_ORIGINS 
        ? process.env.CORS_ALLOW_ORIGINS.split(',') 
        : ['*'],
      allowMethods: process.env.CORS_ALLOW_METHODS 
        ? process.env.CORS_ALLOW_METHODS.split(',') 
        : ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: process.env.CORS_ALLOW_HEADERS 
        ? process.env.CORS_ALLOW_HEADERS.split(',')
        : ['Content-Type', 'Authorization', 'x-api-key'],
      allowCredentials: process.env.CORS_ALLOW_CREDENTIALS === 'true',
      exposedHeaders: process.env.CORS_EXPOSED_HEADERS 
        ? process.env.CORS_EXPOSED_HEADERS.split(',')
        : [],
      maxAge: process.env.CORS_MAX_AGE 
        ? parseInt(process.env.CORS_MAX_AGE, 10)
        : 86400, // 24 hours
    },
  },
};

export default config; 