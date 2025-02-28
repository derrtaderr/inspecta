import { Page, ConsoleMessage } from 'puppeteer';
import { BrowserPool } from '../browser/BrowserPool';
import { PageUtils } from '../browser/PageUtils';
import { v4 as uuidv4 } from 'uuid';

/**
 * Log level types for console messages
 */
export type LogLevel = 'debug' | 'info' | 'warning' | 'error';

/**
 * Interface for a console log entry
 */
export interface ConsoleLogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  url: string;
  location?: {
    lineNumber?: number;
    columnNumber?: number;
    fileName?: string;
  };
}

/**
 * Options for console log collection
 */
export interface ConsoleLogOptions {
  url: string;
  timeoutMs?: number;
  navigationOptions?: {
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
  };
  filters?: {
    logLevel?: LogLevel[];
    includePatterns?: string[];
    excludePatterns?: string[];
  };
}

/**
 * Default options for console log collection
 */
const defaultOptions: Partial<ConsoleLogOptions> = {
  timeoutMs: 30000,
  navigationOptions: {
    waitUntil: 'networkidle2',
  },
  filters: {
    logLevel: ['debug', 'info', 'warning', 'error'],
  },
};

/**
 * Service for collecting and analyzing console logs from web pages
 */
export class ConsoleLogCollector {
  private browserPool: BrowserPool;
  
  constructor() {
    this.browserPool = BrowserPool.getInstance();
  }
  
  /**
   * Collect console logs from a web page
   */
  async collectLogs(options: ConsoleLogOptions): Promise<{
    success: boolean;
    logs?: ConsoleLogEntry[];
    error?: string;
  }> {
    // Merge defaults with provided options
    const opts = { ...defaultOptions, ...options };
    const browserId = uuidv4();
    const pageId = uuidv4();
    
    try {
      // Get a browser page
      const page = await this.browserPool.getPage(browserId, pageId);
      
      // Array to store collected logs
      const logs: ConsoleLogEntry[] = [];
      
      // Set up console log listener
      await this.setupConsoleListener(page, logs);
      
      // Navigate to the URL
      const navigationSuccess = await PageUtils.navigateToUrl(page, opts.url);
      if (!navigationSuccess) {
        return {
          success: false,
          error: `Failed to navigate to URL: ${opts.url}`,
        };
      }
      
      // Wait for the specified timeout to collect logs
      await page.evaluate((delay) => {
        return new Promise((resolve) => setTimeout(resolve, delay));
      }, opts.timeoutMs || 5000);
      
      // Apply filters if specified
      let filteredLogs = logs;
      
      if (opts.filters) {
        filteredLogs = this.filterLogs(logs, opts.filters);
      }
      
      return {
        success: true,
        logs: filteredLogs,
      };
      
    } catch (error) {
      console.error('Console log collection error:', error);
      return {
        success: false,
        error: `Failed to collect console logs: ${error instanceof Error ? error.message : String(error)}`,
      };
    } finally {
      // Clean up browser resources
      await this.browserPool.closePage(browserId, pageId);
    }
  }
  
  /**
   * Set up console message listener on the page
   */
  private async setupConsoleListener(page: Page, logs: ConsoleLogEntry[]): Promise<void> {
    page.on('console', (message) => {
      try {
        // Get message type and map to log level
        const type = message.type();
        let level: LogLevel = 'info';
        
        switch (type) {
          case 'debug':
            level = 'debug';
            break;
          case 'info':
          case 'log':
            level = 'info';
            break;
          case 'warn':
            level = 'warning';
            break;
          case 'error':
            level = 'error';
            break;
          default:
            level = 'info';
        }
        
        // Create log entry
        const logEntry: ConsoleLogEntry = {
          level,
          message: message.text(),
          timestamp: Date.now(),
          url: page.url(),
        };
        
        // Try to get location information if available
        const location = message.location();
        if (location) {
          logEntry.location = {
            lineNumber: location.lineNumber,
            columnNumber: location.columnNumber,
            fileName: location.url,
          };
        }
        
        logs.push(logEntry);
      } catch (error) {
        console.error('Error processing console message:', error);
      }
    });
    
    // Also capture page errors
    page.on('pageerror', (error) => {
      logs.push({
        level: 'error',
        message: `Uncaught exception: ${error.message}`,
        timestamp: Date.now(),
        url: page.url(),
      });
    });
  }
  
  /**
   * Filter logs based on specified criteria
   */
  private filterLogs(logs: ConsoleLogEntry[], filters: NonNullable<ConsoleLogOptions['filters']>): ConsoleLogEntry[] {
    return logs.filter((log) => {
      // Filter by log level
      if (filters.logLevel && !filters.logLevel.includes(log.level)) {
        return false;
      }
      
      // Filter by include patterns
      if (filters.includePatterns && filters.includePatterns.length > 0) {
        const matchesInclude = filters.includePatterns.some((pattern) => {
          const regex = new RegExp(pattern, 'i');
          return regex.test(log.message);
        });
        
        if (!matchesInclude) {
          return false;
        }
      }
      
      // Filter by exclude patterns
      if (filters.excludePatterns && filters.excludePatterns.length > 0) {
        const matchesExclude = filters.excludePatterns.some((pattern) => {
          const regex = new RegExp(pattern, 'i');
          return regex.test(log.message);
        });
        
        if (matchesExclude) {
          return false;
        }
      }
      
      return true;
    });
  }
  
  /**
   * Analyze logs for error patterns
   */
  analyzeErrorPatterns(logs: ConsoleLogEntry[]): {
    errorCount: number;
    warningCount: number;
    commonErrors: { pattern: string; count: number }[];
  } {
    // Count errors and warnings
    const errorLogs = logs.filter((log) => log.level === 'error');
    const warningLogs = logs.filter((log) => log.level === 'warning');
    
    // Identify common error patterns
    const errorPatterns: Record<string, number> = {};
    
    for (const log of errorLogs) {
      // Simplify error message to identify patterns
      // Remove specific values like line numbers, timestamps, etc.
      const simplifiedMessage = this.simplifyErrorMessage(log.message);
      
      if (errorPatterns[simplifiedMessage]) {
        errorPatterns[simplifiedMessage]++;
      } else {
        errorPatterns[simplifiedMessage] = 1;
      }
    }
    
    // Sort patterns by frequency
    const commonErrors = Object.entries(errorPatterns)
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 most common errors
    
    return {
      errorCount: errorLogs.length,
      warningCount: warningLogs.length,
      commonErrors,
    };
  }
  
  /**
   * Simplify error message to identify patterns
   */
  private simplifyErrorMessage(message: string): string {
    // Replace specific values with placeholders
    return message
      .replace(/\d+/g, '{NUM}') // Replace numbers
      .replace(/(['"])(?:(?=(\\?))\2.)*?\1/g, '{STR}') // Replace strings
      .replace(/https?:\/\/[^\s]+/g, '{URL}') // Replace URLs
      .replace(/\b[a-f0-9]{8,}\b/g, '{ID}'); // Replace IDs/hashes
  }
  
  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    // No specific cleanup needed for this service
  }
} 