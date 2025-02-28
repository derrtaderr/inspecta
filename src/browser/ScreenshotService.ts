import { Page } from 'puppeteer';
import { BrowserPool } from './BrowserPool';
import { PageUtils } from './PageUtils';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import config from '../config/config';

// Define screenshot options interface
export interface ScreenshotOptions {
  url: string;
  selector?: string;
  fullPage?: boolean;
  format?: 'png' | 'jpeg';
  quality?: number;
  width?: number;
  height?: number;
  waitForSelector?: string;
  waitTime?: number;
  saveToFile?: boolean;
  outputPath?: string;
}

// Default screenshot options
const defaultOptions: Partial<ScreenshotOptions> = {
  fullPage: true,
  format: 'png',
  quality: 80,
  width: config.browser.defaultViewport.width,
  height: config.browser.defaultViewport.height,
  waitTime: 1000,
  saveToFile: false,
};

/**
 * Service for capturing screenshots of web pages or elements
 */
export class ScreenshotService {
  private browserPool: BrowserPool;
  
  constructor() {
    this.browserPool = BrowserPool.getInstance();
  }
  
  /**
   * Take a screenshot of a URL or element
   */
  async takeScreenshot(options: ScreenshotOptions): Promise<{ 
    success: boolean; 
    data?: Buffer | string; 
    error?: string; 
  }> {
    // Merge defaults with provided options
    const opts = { ...defaultOptions, ...options };
    const browserId = uuidv4();
    const pageId = uuidv4();
    
    try {
      // Get a browser page
      const page = await this.browserPool.getPage(browserId, pageId);
      
      // Set viewport if custom dimensions are provided
      if (opts.width && opts.height) {
        await page.setViewport({
          width: opts.width,
          height: opts.height,
        });
      }
      
      // Navigate to the URL
      const navigationSuccess = await PageUtils.navigateToUrl(page, opts.url);
      if (!navigationSuccess) {
        return { 
          success: false, 
          error: `Failed to navigate to URL: ${opts.url}` 
        };
      }
      
      // Wait for specific selector if provided
      if (opts.waitForSelector) {
        const element = await PageUtils.waitForSelector(page, opts.waitForSelector);
        if (!element) {
          return { 
            success: false, 
            error: `Timeout waiting for selector: ${opts.waitForSelector}` 
          };
        }
      }
      
      // Additional wait time if specified
      if (opts.waitTime && opts.waitTime > 0) {
        // Use page.evaluate to create a delay since waitForTimeout is not available
        await page.evaluate((delay) => {
          return new Promise((resolve) => setTimeout(resolve, delay));
        }, opts.waitTime);
      }
      
      // Take screenshot of specific element or full page
      let screenshotBuffer: Buffer;
      
      if (opts.selector) {
        // Take element screenshot
        const element = await page.$(opts.selector);
        if (!element) {
          return { 
            success: false, 
            error: `Element not found with selector: ${opts.selector}` 
          };
        }
        
        const elementScreenshot = await element.screenshot({
          type: opts.format,
          quality: opts.format === 'jpeg' ? opts.quality : undefined,
        });
        
        // Convert Uint8Array to Buffer if needed
        screenshotBuffer = Buffer.from(elementScreenshot);
      } else {
        // Take full page or viewport screenshot
        const pageScreenshot = await page.screenshot({
          fullPage: opts.fullPage,
          type: opts.format,
          quality: opts.format === 'jpeg' ? opts.quality : undefined,
        });
        
        // Convert Uint8Array to Buffer if needed
        screenshotBuffer = Buffer.from(pageScreenshot);
      }
      
      // Save to file if requested
      if (opts.saveToFile && opts.outputPath) {
        const directory = path.dirname(opts.outputPath);
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(directory)) {
          fs.mkdirSync(directory, { recursive: true });
        }
        
        fs.writeFileSync(opts.outputPath, screenshotBuffer);
        return { 
          success: true, 
          data: opts.outputPath 
        };
      }
      
      // Return buffer by default
      return { 
        success: true, 
        data: screenshotBuffer 
      };
      
    } catch (error) {
      console.error('Screenshot error:', error);
      return { 
        success: false, 
        error: `Failed to capture screenshot: ${error instanceof Error ? error.message : String(error)}` 
      };
    } finally {
      // Clean up browser resources
      await this.browserPool.closePage(browserId, pageId);
    }
  }
  
  /**
   * Close all browser instances
   */
  async cleanup(): Promise<void> {
    await this.browserPool.closeAll();
  }
} 