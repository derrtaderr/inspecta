import { Page, ElementHandle } from 'puppeteer';
import { BrowserPool } from '../browser/BrowserPool';
import { PageUtils } from '../browser/PageUtils';
import { v4 as uuidv4 } from 'uuid';

/**
 * Types of element state to check
 */
export enum ElementStateType {
  EXISTS = 'exists',
  VISIBLE = 'visible',
  ENABLED = 'enabled',
  CHECKED = 'checked',
  FOCUSED = 'focused',
  SELECTED = 'selected',
}

/**
 * Types of element actions
 */
export enum ElementActionType {
  CLICK = 'click',
  TYPE = 'type',
  SELECT = 'select',
  CLEAR = 'clear',
  HOVER = 'hover',
  FOCUS = 'focus',
  SCROLL_INTO_VIEW = 'scrollIntoView',
}

/**
 * Result of a DOM operation
 */
export interface DomOperationResult<T = any> {
  success: boolean;
  error?: string;
  value?: T;
}

/**
 * Service for DOM manipulation operations
 */
export class DomManipulator {
  private browserPool: BrowserPool;

  constructor() {
    this.browserPool = BrowserPool.getInstance();
  }

  /**
   * Check the state of an element
   */
  async checkElementState(
    url: string,
    selector: string,
    stateType: ElementStateType,
    timeoutMs?: number
  ): Promise<DomOperationResult<boolean>> {
    const browserId = uuidv4();
    const pageId = uuidv4();
    
    try {
      const page = await this.browserPool.getPage(browserId, pageId);
      const navigationResult = await PageUtils.navigateToUrl(page, url);
      
      if (!navigationResult) {
        return {
          success: false,
          error: `Failed to navigate to ${url}`,
        };
      }

      let result = false;
      
      switch (stateType) {
        case ElementStateType.EXISTS:
          result = await PageUtils.elementExists(page, selector);
          break;
          
        case ElementStateType.VISIBLE:
          result = await PageUtils.elementIsVisible(page, selector);
          break;
          
        case ElementStateType.ENABLED:
          result = await this.isElementEnabled(page, selector);
          break;
          
        case ElementStateType.CHECKED:
          result = await this.isElementChecked(page, selector);
          break;
          
        case ElementStateType.FOCUSED:
          result = await this.isElementFocused(page, selector);
          break;
          
        case ElementStateType.SELECTED:
          result = await this.isElementSelected(page, selector);
          break;
          
        default:
          return {
            success: false,
            error: `Unknown state type: ${stateType}`,
          };
      }
      
      return {
        success: true,
        value: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      await this.browserPool.closePage(browserId, pageId);
    }
  }

  /**
   * Get element properties
   */
  async getElementProperties(
    url: string,
    selector: string,
    properties: string[],
    timeoutMs?: number
  ): Promise<DomOperationResult<Record<string, any>>> {
    const browserId = uuidv4();
    const pageId = uuidv4();
    
    try {
      const page = await this.browserPool.getPage(browserId, pageId);
      const navigationResult = await PageUtils.navigateToUrl(page, url);
      
      if (!navigationResult) {
        return {
          success: false,
          error: `Failed to navigate to ${url}`,
        };
      }

      const element = await page.$(selector);
      if (!element) {
        return {
          success: false,
          error: `Element not found: ${selector}`,
        };
      }

      const result: Record<string, any> = {};
      
      for (const property of properties) {
        try {
          // Special handling for common properties
          if (property === 'text') {
            result['text'] = await PageUtils.getElementText(page, selector);
          } else if (property === 'html') {
            result['html'] = await page.evaluate(el => el.outerHTML, element);
          } else if (property === 'value') {
            result['value'] = await page.evaluate(el => (el as HTMLInputElement).value, element);
          } else if (property === 'attributes') {
            result['attributes'] = await page.evaluate(el => {
              const attrs: Record<string, string> = {};
              for (let i = 0; i < el.attributes.length; i++) {
                const attr = el.attributes[i];
                attrs[attr.name] = attr.value;
              }
              return attrs;
            }, element);
          } else if (property === 'boundingBox') {
            const box = await element.boundingBox();
            result['boundingBox'] = box;
          } else {
            // Get arbitrary property
            result[property] = await page.evaluate((el, prop) => {
              return (el as any)[prop];
            }, element, property);
          }
        } catch (error) {
          console.error(`Error getting property ${property}:`, error);
          result[property] = null;
        }
      }
      
      return {
        success: true,
        value: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      await this.browserPool.closePage(browserId, pageId);
    }
  }

  /**
   * Perform an action on an element
   */
  async performElementAction(
    url: string,
    selector: string,
    actionType: ElementActionType,
    actionValue?: string,
    timeoutMs?: number
  ): Promise<DomOperationResult<boolean>> {
    const browserId = uuidv4();
    const pageId = uuidv4();
    
    try {
      const page = await this.browserPool.getPage(browserId, pageId);
      const navigationResult = await PageUtils.navigateToUrl(page, url);
      
      if (!navigationResult) {
        return {
          success: false,
          error: `Failed to navigate to ${url}`,
        };
      }

      const element = await PageUtils.waitForSelector(page, selector, timeoutMs);
      if (!element) {
        return {
          success: false,
          error: `Element not found or not visible: ${selector}`,
        };
      }

      switch (actionType) {
        case ElementActionType.CLICK:
          await element.click();
          break;
          
        case ElementActionType.TYPE:
          if (!actionValue) {
            return {
              success: false,
              error: 'Action value is required for TYPE action',
            };
          }
          await element.type(actionValue);
          break;
          
        case ElementActionType.SELECT:
          if (!actionValue) {
            return {
              success: false,
              error: 'Action value is required for SELECT action',
            };
          }
          await page.select(selector, actionValue);
          break;
          
        case ElementActionType.CLEAR:
          await page.evaluate(el => {
            if ('value' in el) {
              (el as HTMLInputElement).value = '';
            }
          }, element);
          break;
          
        case ElementActionType.HOVER:
          await element.hover();
          break;
          
        case ElementActionType.FOCUS:
          await element.focus();
          break;
          
        case ElementActionType.SCROLL_INTO_VIEW:
          await page.evaluate(el => {
            el.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          }, element);
          break;
          
        default:
          return {
            success: false,
            error: `Unknown action type: ${actionType}`,
          };
      }
      
      return {
        success: true,
        value: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      await this.browserPool.closePage(browserId, pageId);
    }
  }

  /**
   * Check if an element is enabled
   */
  private async isElementEnabled(page: Page, selector: string): Promise<boolean> {
    try {
      const element = await page.$(selector);
      if (!element) {
        return false;
      }
      
      return await page.evaluate(el => {
        return !(el as HTMLInputElement).disabled;
      }, element);
    } catch (error) {
      console.error(`Error checking if element is enabled ${selector}:`, error);
      return false;
    }
  }

  /**
   * Check if an element is checked
   */
  private async isElementChecked(page: Page, selector: string): Promise<boolean> {
    try {
      const element = await page.$(selector);
      if (!element) {
        return false;
      }
      
      return await page.evaluate(el => {
        return !!(el as HTMLInputElement).checked;
      }, element);
    } catch (error) {
      console.error(`Error checking if element is checked ${selector}:`, error);
      return false;
    }
  }

  /**
   * Check if an element is focused
   */
  private async isElementFocused(page: Page, selector: string): Promise<boolean> {
    try {
      const focused = await page.evaluate(() => {
        return document.activeElement?.outerHTML || '';
      });
      
      const element = await page.$(selector);
      if (!element) {
        return false;
      }
      
      const outerHTML = await page.evaluate(el => {
        return el.outerHTML;
      }, element);
      
      return focused === outerHTML;
    } catch (error) {
      console.error(`Error checking if element is focused ${selector}:`, error);
      return false;
    }
  }

  /**
   * Check if an option element is selected
   */
  private async isElementSelected(page: Page, selector: string): Promise<boolean> {
    try {
      const element = await page.$(selector);
      if (!element) {
        return false;
      }
      
      return await page.evaluate(el => {
        return !!(el as HTMLOptionElement).selected;
      }, element);
    } catch (error) {
      console.error(`Error checking if element is selected ${selector}:`, error);
      return false;
    }
  }

  /**
   * Find elements matching a selector and return information about them
   */
  async findElements(
    url: string,
    selector: string,
    includeProperties: string[] = ['text'],
    limit: number = 10,
    timeoutMs?: number
  ): Promise<DomOperationResult<any[]>> {
    const browserId = uuidv4();
    const pageId = uuidv4();
    
    try {
      const page = await this.browserPool.getPage(browserId, pageId);
      const navigationResult = await PageUtils.navigateToUrl(page, url);
      
      if (!navigationResult) {
        return {
          success: false,
          error: `Failed to navigate to ${url}`,
        };
      }

      const elements = await page.$$(selector);
      if (elements.length === 0) {
        return {
          success: true,
          value: [],
        };
      }

      const limitedElements = elements.slice(0, limit);
      const results = [];
      
      for (const element of limitedElements) {
        const elementInfo: Record<string, any> = {};
        
        for (const property of includeProperties) {
          try {
            if (property === 'text') {
              elementInfo['text'] = await page.evaluate(el => el.textContent?.trim() || '', element);
            } else if (property === 'html') {
              elementInfo['html'] = await page.evaluate(el => el.outerHTML, element);
            } else if (property === 'value') {
              elementInfo['value'] = await page.evaluate(el => (el as HTMLInputElement).value || '', element);
            } else if (property === 'attributes') {
              elementInfo['attributes'] = await page.evaluate(el => {
                const attrs: Record<string, string> = {};
                for (let i = 0; i < el.attributes.length; i++) {
                  const attr = el.attributes[i];
                  attrs[attr.name] = attr.value;
                }
                return attrs;
              }, element);
            } else if (property === 'boundingBox') {
              const box = await element.boundingBox();
              elementInfo['boundingBox'] = box;
            } else {
              // Get arbitrary property
              elementInfo[property] = await page.evaluate((el, prop) => {
                return (el as any)[prop];
              }, element, property);
            }
          } catch (error) {
            console.error(`Error getting property ${property}:`, error);
            elementInfo[property] = null;
          }
        }
        
        results.push(elementInfo);
      }
      
      return {
        success: true,
        value: results,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      await this.browserPool.closePage(browserId, pageId);
    }
  }
} 