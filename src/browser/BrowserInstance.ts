import puppeteer, { Browser, Page } from 'puppeteer';
import config from '../config/config';

/**
 * Manages a single Puppeteer browser instance and its pages
 */
export class BrowserInstance {
  private browser: Browser | null = null;
  private pages: Map<string, Page> = new Map();
  private lastUsed: number = Date.now();
  
  /**
   * Initializes and launches a browser instance
   */
  async initialize(): Promise<void> {
    if (this.browser) {
      return;
    }
    
    try {
      this.browser = await puppeteer.launch({
        headless: config.browser.headless,
        defaultViewport: config.browser.defaultViewport,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        timeout: config.browser.timeout,
      });
      
      // Handle browser disconnection
      this.browser.on('disconnected', () => {
        this.browser = null;
        this.pages.clear();
      });
      
    } catch (error) {
      console.error('Failed to launch browser instance:', error);
      throw new Error('Failed to initialize browser instance');
    }
  }
  
  /**
   * Creates a new page in the browser
   */
  async createPage(pageId: string): Promise<Page> {
    this.updateLastUsed();
    
    if (!this.browser) {
      await this.initialize();
    }
    
    if (!this.browser) {
      throw new Error('Browser instance is not available');
    }
    
    // Clean up existing page with the same ID if it exists
    await this.closePage(pageId);
    
    try {
      const page = await this.browser.newPage();
      
      // Configure page settings
      await page.setDefaultNavigationTimeout(config.browser.timeout);
      
      // Set up error handling
      page.on('error', (error) => {
        console.error(`Page error on page ${pageId}:`, error);
      });
      
      // Store the page reference
      this.pages.set(pageId, page);
      return page;
      
    } catch (error) {
      console.error('Failed to create new page:', error);
      throw new Error('Failed to create new browser page');
    }
  }
  
  /**
   * Gets an existing page or creates a new one
   */
  async getPage(pageId: string): Promise<Page> {
    this.updateLastUsed();
    
    const existingPage = this.pages.get(pageId);
    if (existingPage) {
      return existingPage;
    }
    
    return this.createPage(pageId);
  }
  
  /**
   * Closes a specific page
   */
  async closePage(pageId: string): Promise<void> {
    const page = this.pages.get(pageId);
    if (page) {
      try {
        this.pages.delete(pageId);
        await page.close();
      } catch (error) {
        console.error(`Error closing page ${pageId}:`, error);
      }
    }
  }
  
  /**
   * Closes the browser instance and all pages
   */
  async close(): Promise<void> {
    if (this.browser) {
      try {
        // Close all pages
        for (const [pageId, _] of this.pages) {
          await this.closePage(pageId);
        }
        
        this.pages.clear();
        await this.browser.close();
        this.browser = null;
      } catch (error) {
        console.error('Error closing browser instance:', error);
      }
    }
  }
  
  /**
   * Updates the last used timestamp
   */
  updateLastUsed(): void {
    this.lastUsed = Date.now();
  }
  
  /**
   * Gets the last used timestamp
   */
  getLastUsed(): number {
    return this.lastUsed;
  }
  
  /**
   * Checks if the browser instance is active
   */
  isActive(): boolean {
    return this.browser !== null;
  }
  
  /**
   * Gets the number of active pages
   */
  getPageCount(): number {
    return this.pages.size;
  }
} 