import { Page, HTTPRequest, HTTPResponse } from 'puppeteer';
import { BrowserPool } from '../browser/BrowserPool';
import { PageUtils } from '../browser/PageUtils';
import { v4 as uuidv4 } from 'uuid';

/**
 * Status of the network request
 */
export type RequestStatus = 'success' | 'error' | 'timeout' | 'aborted';

/**
 * Interface for a network request entry
 */
export interface NetworkRequestEntry {
  id: string;
  url: string;
  method: string;
  resourceType: string;
  status: number | null;
  statusText: string | null;
  requestStatus: RequestStatus;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string> | null;
  timing: {
    startTime: number;
    endTime: number | null;
    duration: number | null;
  };
  errorText?: string;
  size: {
    request: number | null;
    response: number | null;
  };
  postData?: string | null;
  redirectChain: string[];
  isRedirect: boolean;
}

/**
 * Options for network monitoring
 */
export interface NetworkMonitorOptions {
  url: string;
  timeoutMs?: number;
  navigationOptions?: {
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
  };
  filters?: {
    methods?: string[];
    resourceTypes?: string[];
    statusCodes?: number[];
    urlPatterns?: string[];
    includeRequestBody?: boolean;
    includeResponseBody?: boolean;
    excludeUrlPatterns?: string[];
  };
}

/**
 * Default options for network monitoring
 */
const defaultOptions: Partial<NetworkMonitorOptions> = {
  timeoutMs: 30000,
  navigationOptions: {
    waitUntil: 'networkidle2',
  },
  filters: {
    includeRequestBody: false,
    includeResponseBody: false,
  },
};

/**
 * Service for monitoring and analyzing network requests and responses
 */
export class NetworkMonitor {
  private browserPool: BrowserPool;
  
  constructor() {
    this.browserPool = BrowserPool.getInstance();
  }
  
  /**
   * Monitor network activity on a web page
   */
  async monitorNetwork(options: NetworkMonitorOptions): Promise<{
    success: boolean;
    requests?: NetworkRequestEntry[];
    error?: string;
    stats?: {
      totalRequests: number;
      successfulRequests: number;
      failedRequests: number;
      totalSize: number;
      averageResponseTime: number;
      statusCodeDistribution: Record<string, number>;
      resourceTypeDistribution: Record<string, number>;
    };
  }> {
    // Merge defaults with provided options
    const opts = { ...defaultOptions, ...options };
    const browserId = uuidv4();
    const pageId = uuidv4();
    
    try {
      console.log(`Starting network monitoring for URL: ${opts.url}`);
      // Get a browser page
      const page = await this.browserPool.getPage(browserId, pageId);
      console.log('Browser page acquired');
      
      // Array to store collected network requests
      const requests: NetworkRequestEntry[] = [];
      
      // Map to track pending requests
      const pendingRequests = new Map<string, NetworkRequestEntry>();
      
      // Set up network request listeners
      await this.setupNetworkListeners(page, requests, pendingRequests, opts.filters);
      
      // Navigate to the URL
      console.log(`Navigating to URL: ${opts.url}`);
      const navigationSuccess = await PageUtils.navigateToUrl(page, opts.url);
      console.log(`Navigation ${navigationSuccess ? 'succeeded' : 'failed'}`);
      if (!navigationSuccess) {
        return {
          success: false,
          error: `Failed to navigate to URL: ${opts.url}`,
        };
      }
      
      // Wait for the specified timeout to collect network requests
      console.log(`Waiting ${opts.timeoutMs || 5000}ms to collect network requests`);
      await page.evaluate((delay) => {
        return new Promise((resolve) => setTimeout(resolve, delay));
      }, opts.timeoutMs || 5000);
      
      // Complete any pending requests with timeout
      this.completePendingRequests(pendingRequests);
      
      // Apply filters if specified
      let filteredRequests = requests;
      if (opts.filters) {
        filteredRequests = this.filterRequests(requests, opts.filters);
      }
      
      console.log(`Collected ${filteredRequests.length} network requests`);
      
      // Generate statistics
      const stats = this.generateStatistics(filteredRequests);
      
      return {
        success: true,
        requests: filteredRequests,
        stats,
      };
      
    } catch (error) {
      console.error('Network monitoring error:', error);
      return {
        success: false,
        error: `Failed to monitor network: ${error instanceof Error ? error.message : String(error)}`,
      };
    } finally {
      // Clean up browser resources
      await this.browserPool.closePage(browserId, pageId);
    }
  }
  
  /**
   * Set up network request and response listeners
   */
  private async setupNetworkListeners(
    page: Page, 
    requests: NetworkRequestEntry[],
    pendingRequests: Map<string, NetworkRequestEntry>,
    filters?: NetworkMonitorOptions['filters']
  ): Promise<void> {
    console.log('Setting up network listeners');
    
    // Create a request map to track request objects by their internal IDs
    const requestMap = new Map<string, string>();
    
    // Listen for network requests
    page.on('request', (request) => {
      try {
        // Create a consistent ID based on the unique identifier from Puppeteer
        const internalId = request.url();
        const requestId = `${internalId}-${Date.now()}`;
        
        // Store the mapping between internal ID and our request ID
        requestMap.set(internalId, requestId);
        
        console.log(`Request detected: ${request.method()} ${request.url()}`);
        
        // Create network request entry
        const entry: NetworkRequestEntry = {
          id: requestId,
          url: request.url(),
          method: request.method(),
          resourceType: request.resourceType(),
          status: null,
          statusText: null,
          requestStatus: 'success',
          requestHeaders: request.headers(),
          responseHeaders: null,
          timing: {
            startTime: Date.now(),
            endTime: null,
            duration: null,
          },
          size: {
            request: this.calculateRequestSize(request),
            response: null,
          },
          postData: filters?.includeRequestBody ? request.postData() : null,
          redirectChain: request.redirectChain().map(req => req.url()),
          isRedirect: request.isNavigationRequest() && request.redirectChain().length > 0,
        };
        
        // Store the request in the pending map
        pendingRequests.set(requestId, entry);
      } catch (error) {
        console.error('Error tracking request:', error);
      }
    });
    
    // Listen for network responses
    page.on('response', (response) => {
      try {
        const request = response.request();
        const internalId = request.url();
        
        // Get the request ID using the consistent internal ID
        const requestId = requestMap.get(internalId);
        if (!requestId) {
          console.log(`No requestId found for response to ${internalId}`);
          return;
        }
        
        console.log(`Response received for: ${request.method()} ${request.url()}`);
        
        // Get the pending request entry
        const entry = pendingRequests.get(requestId);
        if (!entry) {
          console.log(`No entry found for requestId ${requestId}`);
          return;
        }
        
        // Update with response information
        entry.status = response.status();
        entry.statusText = response.statusText();
        entry.responseHeaders = response.headers();
        entry.timing.endTime = Date.now();
        entry.timing.duration = entry.timing.endTime - entry.timing.startTime;
        entry.size.response = this.calculateResponseSize(response);
        
        // Determine request status based on HTTP status code
        if (entry.status >= 400) {
          entry.requestStatus = 'error';
        }
        
        // Remove from pending and add to completed requests
        pendingRequests.delete(requestId);
        requests.push(entry);
      } catch (error) {
        console.error('Error tracking response:', error);
      }
    });
    
    // Listen for request failures
    page.on('requestfailed', (request) => {
      try {
        const internalId = request.url();
        
        // Get the request ID using the consistent internal ID
        const requestId = requestMap.get(internalId);
        if (!requestId) {
          console.log(`No requestId found for failed request to ${internalId}`);
          return;
        }
        
        console.log(`Request failed: ${request.method()} ${request.url()}`);
        
        // Get the pending request entry
        const entry = pendingRequests.get(requestId);
        if (!entry) {
          console.log(`No entry found for requestId ${requestId}`);
          return;
        }
        
        // Update with error information
        entry.requestStatus = 'error';
        entry.errorText = request.failure()?.errorText || 'Unknown error';
        entry.timing.endTime = Date.now();
        entry.timing.duration = entry.timing.endTime - entry.timing.startTime;
        
        // Remove from pending and add to completed requests
        pendingRequests.delete(requestId);
        requests.push(entry);
      } catch (error) {
        console.error('Error tracking request failure:', error);
      }
    });
    
    // Listen for request finished events
    page.on('requestfinished', (request) => {
      try {
        const internalId = request.url();
        
        // Get the request ID using the consistent internal ID
        const requestId = requestMap.get(internalId);
        if (!requestId) {
          console.log(`No requestId found for finished request to ${internalId}`);
          return;
        }
        
        console.log(`Request finished: ${request.method()} ${request.url()}`);
        
        // Get the pending request entry
        const entry = pendingRequests.get(requestId);
        if (!entry) {
          console.log(`No entry found for requestId ${requestId}`);
          return;
        }
        
        // If the entry hasn't been processed by response event
        if (entry.timing.endTime === null) {
          entry.timing.endTime = Date.now();
          entry.timing.duration = entry.timing.endTime - entry.timing.startTime;
          
          // Remove from pending and add to completed requests
          pendingRequests.delete(requestId);
          requests.push(entry);
        }
      } catch (error) {
        console.error('Error tracking request finish:', error);
      }
    });
  }
  
  /**
   * Complete any pending requests with timeout status
   */
  private completePendingRequests(pendingRequests: Map<string, NetworkRequestEntry>): void {
    const now = Date.now();
    
    for (const [requestId, entry] of pendingRequests.entries()) {
      entry.requestStatus = 'timeout';
      entry.timing.endTime = now;
      entry.timing.duration = now - entry.timing.startTime;
      
      pendingRequests.delete(requestId);
    }
  }
  
  /**
   * Filter requests based on specified criteria
   */
  private filterRequests(
    requests: NetworkRequestEntry[],
    filters: NonNullable<NetworkMonitorOptions['filters']>
  ): NetworkRequestEntry[] {
    return requests.filter((request) => {
      // Filter by HTTP method
      if (filters.methods && filters.methods.length > 0 && !filters.methods.includes(request.method)) {
        return false;
      }
      
      // Filter by resource type
      if (filters.resourceTypes && filters.resourceTypes.length > 0 && !filters.resourceTypes.includes(request.resourceType)) {
        return false;
      }
      
      // Filter by status code
      if (filters.statusCodes && filters.statusCodes.length > 0 && request.status !== null && !filters.statusCodes.includes(request.status)) {
        return false;
      }
      
      // Filter by URL patterns
      if (filters.urlPatterns && filters.urlPatterns.length > 0) {
        const matchesUrlPattern = filters.urlPatterns.some((pattern) => {
          const regex = new RegExp(pattern, 'i');
          return regex.test(request.url);
        });
        
        if (!matchesUrlPattern) {
          return false;
        }
      }
      
      // Filter by exclude URL patterns
      if (filters.excludeUrlPatterns && filters.excludeUrlPatterns.length > 0) {
        const matchesExcludePattern = filters.excludeUrlPatterns.some((pattern) => {
          const regex = new RegExp(pattern, 'i');
          return regex.test(request.url);
        });
        
        if (matchesExcludePattern) {
          return false;
        }
      }
      
      return true;
    });
  }
  
  /**
   * Calculate the size of a request
   */
  private calculateRequestSize(request: HTTPRequest): number | null {
    try {
      const headers = request.headers();
      const headersSize = JSON.stringify(headers).length;
      const postData = request.postData();
      const postDataSize = postData ? postData.length : 0;
      
      return headersSize + postDataSize;
    } catch (error) {
      console.error('Error calculating request size:', error);
      return null;
    }
  }
  
  /**
   * Calculate the size of a response
   */
  private calculateResponseSize(response: HTTPResponse): number | null {
    try {
      const headers = response.headers();
      const headersSize = JSON.stringify(headers).length;
      
      // Get content-length header if available
      const contentLength = headers['content-length'] || headers['Content-Length'];
      const bodySize = contentLength ? parseInt(contentLength, 10) : 0;
      
      return headersSize + bodySize;
    } catch (error) {
      console.error('Error calculating response size:', error);
      return null;
    }
  }
  
  /**
   * Generate statistics from network requests
   */
  private generateStatistics(requests: NetworkRequestEntry[]): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalSize: number;
    averageResponseTime: number;
    statusCodeDistribution: Record<string, number>;
    resourceTypeDistribution: Record<string, number>;
  } {
    // Initialize statistics
    const totalRequests = requests.length;
    const successfulRequests = requests.filter(r => r.requestStatus === 'success').length;
    const failedRequests = totalRequests - successfulRequests;
    
    // Calculate total size
    let totalSize = 0;
    for (const request of requests) {
      if (request.size.request) totalSize += request.size.request;
      if (request.size.response) totalSize += request.size.response;
    }
    
    // Calculate average response time
    const validDurations = requests
      .filter(r => r.timing.duration !== null)
      .map(r => r.timing.duration as number);
      
    const averageResponseTime = validDurations.length > 0
      ? validDurations.reduce((sum, duration) => sum + duration, 0) / validDurations.length
      : 0;
    
    // Generate status code distribution
    const statusCodeDistribution: Record<string, number> = {};
    for (const request of requests) {
      if (request.status === null) continue;
      
      // Group by hundreds (e.g., 2xx, 3xx, 4xx, 5xx)
      const statusGroup = `${Math.floor(request.status / 100)}xx`;
      
      if (statusCodeDistribution[statusGroup]) {
        statusCodeDistribution[statusGroup]++;
      } else {
        statusCodeDistribution[statusGroup] = 1;
      }
    }
    
    // Generate resource type distribution
    const resourceTypeDistribution: Record<string, number> = {};
    for (const request of requests) {
      if (resourceTypeDistribution[request.resourceType]) {
        resourceTypeDistribution[request.resourceType]++;
      } else {
        resourceTypeDistribution[request.resourceType] = 1;
      }
    }
    
    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      totalSize,
      averageResponseTime,
      statusCodeDistribution,
      resourceTypeDistribution,
    };
  }
  
  /**
   * Analyze network requests for error patterns
   */
  analyzeErrorPatterns(requests: NetworkRequestEntry[]): {
    errorCount: number;
    errorByStatusCode: Record<number, number>;
    slowestRequests: NetworkRequestEntry[];
    commonErrorUrls: { pattern: string; count: number }[];
  } {
    // Count errors
    const errorRequests = requests.filter(r => r.requestStatus === 'error' || (r.status && r.status >= 400));
    const errorCount = errorRequests.length;
    
    // Group errors by status code
    const errorByStatusCode: Record<number, number> = {};
    for (const request of errorRequests) {
      if (request.status === null) continue;
      
      if (errorByStatusCode[request.status]) {
        errorByStatusCode[request.status]++;
      } else {
        errorByStatusCode[request.status] = 1;
      }
    }
    
    // Find slowest requests
    const requestsWithDuration = requests.filter(r => r.timing.duration !== null);
    const slowestRequests = [...requestsWithDuration]
      .sort((a, b) => (b.timing.duration || 0) - (a.timing.duration || 0))
      .slice(0, 5);
    
    // Find common error URL patterns
    const errorUrlPatterns: Record<string, number> = {};
    for (const request of errorRequests) {
      // Extract domain and path from URL
      try {
        const url = new URL(request.url);
        const domain = url.hostname;
        const pathParts = url.pathname.split('/').filter(Boolean);
        const simplifiedPath = pathParts.length > 0 ? `/${pathParts[0]}/...` : '/';
        const pattern = `${domain}${simplifiedPath}`;
        
        if (errorUrlPatterns[pattern]) {
          errorUrlPatterns[pattern]++;
        } else {
          errorUrlPatterns[pattern] = 1;
        }
      } catch (error) {
        // Skip invalid URLs
        continue;
      }
    }
    
    // Sort patterns by frequency
    const commonErrorUrls = Object.entries(errorUrlPatterns)
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return {
      errorCount,
      errorByStatusCode,
      slowestRequests,
      commonErrorUrls,
    };
  }
  
  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    // No specific cleanup needed for this service
  }
} 