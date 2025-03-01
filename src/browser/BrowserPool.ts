import { Page } from 'puppeteer';
import { BrowserInstance } from './BrowserInstance';
import { PageCache } from './PageCache';
import config from '../config/config';

/**
 * Manages a pool of browser instances for efficient resource use
 */
export class BrowserPool {
  private static instance: BrowserPool;
  private browserInstances: Map<string, BrowserInstance> = new Map();
  private pageCache: PageCache | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Initialize page cache if enabled
    if (config.cache.enabled) {
      this.pageCache = PageCache.getInstance();
      console.log('Page caching is enabled');
    } else {
      console.log('Page caching is disabled');
    }
    
    // Start periodic cleanup
    this.cleanupInterval = setInterval(() => this.cleanupIdleBrowsers(), 60000);
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): BrowserPool {
    if (!BrowserPool.instance) {
      BrowserPool.instance = new BrowserPool();
    }
    return BrowserPool.instance;
  }
  
  /**
   * Get or create a browser instance by ID
   */
  private getBrowserInstance(browserId: string): BrowserInstance {
    let instance = this.browserInstances.get(browserId);
    
    if (!instance) {
      instance = new BrowserInstance();
      this.browserInstances.set(browserId, instance);
    }
    
    return instance;
  }
  
  /**
   * Get a page from a browser instance
   * @param browserId The ID of the browser
   * @param pageId The ID for the page
   * @returns A Promise resolving to the page
   */
  async getPage(browserId: string, pageId: string): Promise<Page> {
    const browserInstance = this.getBrowserInstance(browserId);
    return browserInstance.getPage(pageId);
  }
  
  /**
   * Get a page for a specific URL, using cache if available
   * @param browserId The ID of the browser
   * @param pageId The ID for the page
   * @param url The URL to navigate to
   * @param options Navigation options
   * @returns A Promise resolving to the page
   */
  async getPageForUrl(
    browserId: string, 
    pageId: string, 
    url: string,
    options?: {
      bypassCache?: boolean;
      timeout?: number;
      waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
    }
  ): Promise<Page> {
    // Check if page caching is enabled and not bypassed
    if (this.pageCache && !options?.bypassCache) {
      const cachedEntry = this.pageCache.getPage(url);
      
      // If we have a cached page, return it
      if (cachedEntry) {
        console.log(`Using cached page for URL: ${url}`);
        return cachedEntry.page;
      }
    }
    
    // No cached page, get a new one
    console.log(`Creating new page for URL: ${url}`);
    const browserInstance = this.getBrowserInstance(browserId);
    const page = await browserInstance.getPage(pageId);
    
    // Navigate to the URL
    await page.goto(url, {
      timeout: options?.timeout || config.browser.timeout,
      waitUntil: options?.waitUntil || 'networkidle2'
    });
    
    // Cache the page if caching is enabled
    if (this.pageCache && !options?.bypassCache) {
      this.pageCache.addPage(url, page, browserId, pageId);
    }
    
    return page;
  }
  
  /**
   * Close a specific page
   */
  async closePage(browserId: string, pageId: string): Promise<void> {
    const browserInstance = this.browserInstances.get(browserId);
    if (browserInstance) {
      await browserInstance.closePage(pageId);
      
      // If there are no more pages, close the browser instance
      if (browserInstance.getPageCount() === 0) {
        await this.closeBrowserInstance(browserId);
      }
    }
  }
  
  /**
   * Close a specific browser instance
   */
  async closeBrowserInstance(browserId: string): Promise<void> {
    const browserInstance = this.browserInstances.get(browserId);
    if (browserInstance) {
      await browserInstance.close();
      this.browserInstances.delete(browserId);
    }
  }
  
  /**
   * Clean up idle browser instances
   */
  private async cleanupIdleBrowsers(): Promise<void> {
    const currentTime = Date.now();
    const idleTimeout = 5 * 60 * 1000; // 5 minutes
    
    const browserIds = Array.from(this.browserInstances.keys());
    
    for (const browserId of browserIds) {
      const browserInstance = this.browserInstances.get(browserId);
      if (browserInstance && browserInstance.isActive()) {
        const lastUsed = browserInstance.getLastUsed();
        if (currentTime - lastUsed > idleTimeout) {
          console.log(`Closing idle browser instance: ${browserId}`);
          await this.closeBrowserInstance(browserId);
        }
      }
    }
  }
  
  /**
   * Get the count of active browser instances
   */
  getBrowserCount(): number {
    return this.browserInstances.size;
  }
  
  /**
   * Get the number of cached pages (if caching is enabled)
   */
  getCachedPageCount(): number {
    return this.pageCache ? this.pageCache.getSize() : 0;
  }
  
  /**
   * Checks if we can create a new browser instance based on configured limits
   */
  canCreateNewBrowser(): boolean {
    return this.browserInstances.size < config.browser.maxInstances;
  }
  
  /**
   * Preloads a URL into the cache
   * @param url The URL to preload
   * @returns A promise that resolves when the page is cached
   */
  async preloadUrl(url: string): Promise<void> {
    if (!this.pageCache || !config.cache.enabled) {
      console.log('Page caching is disabled, skipping preload');
      return;
    }
    
    try {
      // Generate unique IDs for this preload operation
      const browserId = `preload-${Date.now()}`;
      const pageId = `preload-${Date.now()}`;
      
      console.log(`Preloading URL: ${url}`);
      await this.getPageForUrl(browserId, pageId, url);
      console.log(`Successfully preloaded URL: ${url}`);
    } catch (error) {
      console.error(`Failed to preload URL ${url}:`, error);
    }
  }
  
  /**
   * Close all browser instances
   */
  async closeAll(): Promise<void> {
    // Stop the cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Shut down the page cache if it's active
    if (this.pageCache) {
      this.pageCache.shutdown();
    }
    
    // Close all browser instances
    const browserIds = Array.from(this.browserInstances.keys());
    
    for (const browserId of browserIds) {
      await this.closeBrowserInstance(browserId);
    }
    
    this.browserInstances.clear();
  }
} 