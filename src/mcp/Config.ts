import fs from 'fs';
import path from 'path';
import { z } from 'zod';

/**
 * Configuration options for the InspectorAI MCP Server
 */
export interface MCPServerOptions {
  port: number;
  basePath: string;
  allowOrigin: string | string[];
  browserPoolSize: number;
  corsEnabled: boolean;
  rateLimit: {
    windowMs: number;
    max: number;
  };
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: MCPServerOptions = {
  port: 3000,
  basePath: '/mcp',
  allowOrigin: '*',
  browserPoolSize: 5,
  corsEnabled: true,
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    max: 60 // 60 requests per minute
  }
};

/**
 * Validation schema for configuration
 */
const configSchema = z.object({
  port: z.number().int().positive().default(DEFAULT_CONFIG.port),
  basePath: z.string().default(DEFAULT_CONFIG.basePath),
  allowOrigin: z.union([
    z.string(),
    z.array(z.string())
  ]).default(DEFAULT_CONFIG.allowOrigin),
  browserPoolSize: z.number().int().positive().default(DEFAULT_CONFIG.browserPoolSize),
  corsEnabled: z.boolean().default(DEFAULT_CONFIG.corsEnabled),
  rateLimit: z.object({
    windowMs: z.number().int().positive().default(DEFAULT_CONFIG.rateLimit.windowMs),
    max: z.number().int().positive().default(DEFAULT_CONFIG.rateLimit.max)
  }).default(DEFAULT_CONFIG.rateLimit)
});

/**
 * Utility class for loading and managing server configuration
 */
export class ConfigLoader {
  /**
   * Load configuration from a file
   * @param configPath Path to the configuration file
   * @returns Validated configuration object
   */
  public static loadConfig(configPath: string): MCPServerOptions {
    try {
      // Check if the file exists
      if (!fs.existsSync(configPath)) {
        console.warn(`Configuration file ${configPath} not found. Using default configuration.`);
        return DEFAULT_CONFIG;
      }

      // Read the file
      const configData = fs.readFileSync(configPath, 'utf-8');
      
      // Parse JSON
      const parsedConfig = JSON.parse(configData);
      
      // Validate against schema
      const validatedConfig = configSchema.parse(parsedConfig);
      
      return validatedConfig;
    } catch (error) {
      console.error(`Error loading configuration from ${configPath}:`, error);
      console.warn('Using default configuration.');
      return DEFAULT_CONFIG;
    }
  }

  /**
   * Get the default configuration
   * @returns Default configuration object
   */
  public static getDefaultConfig(): MCPServerOptions {
    return DEFAULT_CONFIG;
  }

  /**
   * Merge provided options with default configuration
   * @param options Partial configuration options
   * @returns Complete configuration with defaults for missing values
   */
  public static mergeWithDefaults(options: Partial<MCPServerOptions>): MCPServerOptions {
    try {
      const validatedConfig = configSchema.parse(options);
      return validatedConfig;
    } catch (error) {
      console.error('Error validating configuration:', error);
      return DEFAULT_CONFIG;
    }
  }
} 