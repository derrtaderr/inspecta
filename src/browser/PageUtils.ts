import { Page, ElementHandle } from 'puppeteer';
import config from '../config/config';

/**
 * Utility functions for page navigation and element interaction
 */
export class PageUtils {
  /**
   * Navigate to a URL
   */
  static async navigateToUrl(page: Page, url: string): Promise<boolean> {
    try {
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: config.browser.timeout,
      });
      return true;
    } catch (error) {
      console.error(`Navigation error to ${url}:`, error);
      return false;
    }
  }
  
  /**
   * Wait for an element to be visible on the page
   */
  static async waitForSelector(page: Page, selector: string, timeout?: number): Promise<ElementHandle | null> {
    try {
      return await page.waitForSelector(selector, {
        visible: true,
        timeout: timeout || config.browser.timeout,
      });
    } catch (error) {
      console.error(`Timeout waiting for selector ${selector}:`, error);
      return null;
    }
  }
  
  /**
   * Get all elements matching a selector
   */
  static async getElements(page: Page, selector: string): Promise<ElementHandle[]> {
    try {
      return await page.$$(selector);
    } catch (error) {
      console.error(`Error getting elements with selector ${selector}:`, error);
      return [];
    }
  }
  
  /**
   * Count elements matching a selector
   */
  static async countElements(page: Page, selector: string): Promise<number> {
    const elements = await this.getElements(page, selector);
    return elements.length;
  }
  
  /**
   * Check if an element exists on the page
   */
  static async elementExists(page: Page, selector: string): Promise<boolean> {
    const element = await page.$(selector);
    return element !== null;
  }
  
  /**
   * Check if an element is visible on the page
   */
  static async elementIsVisible(page: Page, selector: string): Promise<boolean> {
    try {
      const element = await page.$(selector);
      if (!element) {
        return false;
      }
      
      return await page.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      }, element);
    } catch (error) {
      console.error(`Error checking visibility of ${selector}:`, error);
      return false;
    }
  }
  
  /**
   * Get text content of an element
   */
  static async getElementText(page: Page, selector: string): Promise<string | null> {
    try {
      const element = await page.$(selector);
      if (!element) {
        return null;
      }
      
      return await page.evaluate((el) => el.textContent?.trim() || '', element);
    } catch (error) {
      console.error(`Error getting text from ${selector}:`, error);
      return null;
    }
  }
  
  /**
   * Click an element on the page
   */
  static async clickElement(page: Page, selector: string): Promise<boolean> {
    try {
      const element = await this.waitForSelector(page, selector);
      if (!element) {
        return false;
      }
      
      await element.click();
      return true;
    } catch (error) {
      console.error(`Error clicking element ${selector}:`, error);
      return false;
    }
  }
  
  /**
   * Fill an input field
   */
  static async fillInput(page: Page, selector: string, value: string): Promise<boolean> {
    try {
      const element = await this.waitForSelector(page, selector);
      if (!element) {
        return false;
      }
      
      await element.type(value);
      return true;
    } catch (error) {
      console.error(`Error filling input ${selector}:`, error);
      return false;
    }
  }
  
  /**
   * Get page title
   */
  static async getPageTitle(page: Page): Promise<string> {
    try {
      return await page.title();
    } catch (error) {
      console.error('Error getting page title:', error);
      return '';
    }
  }
  
  /**
   * Get page URL
   */
  static async getPageUrl(page: Page): Promise<string> {
    try {
      return page.url();
    } catch (error) {
      console.error('Error getting page URL:', error);
      return '';
    }
  }
  
  /**
   * Check if page has JS errors
   */
  static setupErrorListener(page: Page): string[] {
    const jsErrors: string[] = [];
    
    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
    });
    
    page.on('error', (error) => {
      jsErrors.push(`Page crashed: ${error.message}`);
    });
    
    return jsErrors;
  }
} 