import { Browser, Page } from 'puppeteer';
import { BrowserPool } from './BrowserPool';
import { BrowserInstance } from './BrowserInstance';
import config from '../config/config';
import { v4 as uuidv4 } from 'uuid';

/**
 * Options for browser operations
 */
export interface BrowserManagerOptions {
  viewport?: {
    width: number;
    height: number;
  };
  headless?: boolean;
  timeout?: number;
  userAgent?: string;
  defaultNavigationTimeout?: number;
  bypassCache?: boolean;
}

/**
 * Class that manages browser instances and provides methods for browser operations
 */
export class BrowserManager {
  private browserPool: BrowserPool;
  private browserId: string;
  private options: BrowserManagerOptions;
  private pageCounter: number = 0;

  /**
   * Create a new browser manager
   * @param options Options for browser management
   */
  constructor(options?: BrowserManagerOptions) {
    this.options = {
      viewport: config.browser.defaultViewport,
      headless: config.browser.headless,
      timeout: config.browser.timeout,
      ...options
    };

    this.browserPool = BrowserPool.getInstance();
    this.browserId = uuidv4();
  }

  /**
   * Get a browser instance
   * @returns Promise resolving to a browser instance
   */
  public async getBrowser(): Promise<Browser> {
    const page = await this.browserPool.getPage(this.browserId, this.getNextPageId());
    return page.browser();
  }

  /**
   * Create and configure a new page
   * @param browser Browser instance to create page in
   * @param options Page options
   * @returns Promise resolving to configured page
   */
  public async createPage(
    browser: Browser,
    options?: BrowserManagerOptions
  ): Promise<Page> {
    const mergedOptions = { ...this.options, ...options };
    const page = await browser.newPage();

    // Set viewport
    if (mergedOptions.viewport) {
      await page.setViewport(mergedOptions.viewport);
    }

    // Set user agent
    if (mergedOptions.userAgent) {
      await page.setUserAgent(mergedOptions.userAgent);
    }

    // Set navigation timeout
    if (mergedOptions.defaultNavigationTimeout) {
      page.setDefaultNavigationTimeout(mergedOptions.defaultNavigationTimeout);
    }

    return page;
  }

  /**
   * Generate a unique page ID for this browser manager
   */
  private getNextPageId(): string {
    return `page-${this.browserId}-${this.pageCounter++}`;
  }

  /**
   * Execute a function with a browser instance
   * @param fn Function to execute with browser instance
   * @returns Promise resolving to function result
   */
  public async withBrowser<T>(fn: (browser: Browser) => Promise<T>): Promise<T> {
    const browser = await this.getBrowser();
    try {
      return await fn(browser);
    } finally {
      // We don't need to release the browser as it's managed by BrowserPool
    }
  }

  /**
   * Execute a function with a page instance
   * @param fn Function to execute with page
   * @param options Page options
   * @returns Promise resolving to function result
   */
  public async withPage<T>(
    fn: (page: Page) => Promise<T>,
    options?: BrowserManagerOptions
  ): Promise<T> {
    return this.withBrowser(async (browser) => {
      const page = await this.createPage(browser, options);
      try {
        return await fn(page);
      } finally {
        await page.close();
      }
    });
  }

  /**
   * Navigate to a URL and execute a function
   * @param url URL to navigate to
   * @param fn Function to execute with page after navigation
   * @param options Navigation options
   * @returns Promise resolving to function result
   */
  public async withNavigation<T>(
    url: string,
    fn: (page: Page) => Promise<T>,
    options?: BrowserManagerOptions & { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2' }
  ): Promise<T> {
    const mergedOptions = { ...this.options, ...options };
    
    // Use caching if enabled and not explicitly bypassed
    if (config.cache.enabled && !mergedOptions.bypassCache) {
      const pageId = this.getNextPageId();
      
      try {
        const page = await this.browserPool.getPageForUrl(
          this.browserId,
          pageId,
          url,
          {
            bypassCache: mergedOptions.bypassCache,
            timeout: mergedOptions.timeout,
            waitUntil: options?.waitUntil
          }
        );
        
        try {
          return await fn(page);
        } finally {
          // We don't explicitly close cached pages as they're managed by the page cache
        }
      } catch (error) {
        console.error(`Error using cached page for ${url}:`, error);
        // Fall back to non-cached approach on error
      }
    }
    
    // Fall back to standard navigation if caching is disabled or bypassed
    return this.withPage(async (page) => {
      await page.goto(url, {
        timeout: mergedOptions.timeout,
        waitUntil: options?.waitUntil || 'networkidle2'
      });
      
      return await fn(page);
    }, mergedOptions);
  }

  /**
   * Preload a URL into the cache without processing it
   * @param url The URL to preload
   * @param options Optional navigation options
   * @returns A Promise that resolves when preloading is complete
   */
  public async preloadUrl(
    url: string, 
    options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2' }
  ): Promise<void> {
    if (!config.cache.enabled) {
      return; // Don't do anything if caching is disabled
    }
    
    await this.browserPool.preloadUrl(url);
  }

  /**
   * Take a screenshot of a URL or element
   * @param url URL to navigate to
   * @param options Screenshot options
   * @returns Promise resolving to screenshot buffer
   */
  public async takeScreenshot(
    url: string,
    options?: {
      selector?: string;
      fullPage?: boolean;
      waitForSelector?: string;
      waitForTimeout?: number;
      bypassCache?: boolean;
    } & BrowserManagerOptions
  ): Promise<Buffer> {
    return this.withNavigation(url, async (page) => {
      // Wait for selector if specified
      if (options?.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, {
          timeout: this.options.timeout
        });
      }
      
      // Wait for timeout if specified
      if (options?.waitForTimeout) {
        await new Promise(resolve => setTimeout(resolve, options.waitForTimeout));
      }
      
      // Take screenshot of element or page
      if (options?.selector) {
        const element = await page.$(options.selector);
        
        if (!element) {
          throw new Error(`Element not found: ${options.selector}`);
        }
        
        return await element.screenshot({
          type: 'png',
          omitBackground: true
        }) as Buffer;
      } else {
        return await page.screenshot({
          type: 'png',
          fullPage: options?.fullPage
        }) as Buffer;
      }
    }, options);
  }

  /**
   * Close all browsers associated with this manager
   */
  public async closeAll(): Promise<void> {
    // The actual browser instances are managed by the BrowserPool
    // Nothing to do here as the pool handles cleanup automatically
  }
} 