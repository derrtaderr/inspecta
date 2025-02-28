import { Page } from 'puppeteer';
import { BrowserInstance } from './BrowserInstance';
import config from '../config/config';

/**
 * Manages a pool of browser instances for efficient resource use
 */
export class BrowserPool {
  private static instance: BrowserPool;
  private browserInstances: Map<string, BrowserInstance> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
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
   * Get a page from a specific browser instance
   */
  async getPage(browserId: string, pageId: string): Promise<Page> {
    const browserInstance = this.getBrowserInstance(browserId);
    return browserInstance.getPage(pageId);
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
   * Check if we can create a new browser instance
   */
  canCreateNewBrowser(): boolean {
    return this.browserInstances.size < config.browser.maxInstances;
  }
  
  /**
   * Close all browser instances
   */
  async closeAll(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    const browserIds = Array.from(this.browserInstances.keys());
    
    for (const browserId of browserIds) {
      await this.closeBrowserInstance(browserId);
    }
    
    this.browserInstances.clear();
  }
} 