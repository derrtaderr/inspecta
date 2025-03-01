import { Browser, ElementHandle, Page } from 'puppeteer';
import { ImageAnalyzer, ImageAnalysisOptions, BoundingBox, OCRResult, ImageComparisonResult } from './ImageAnalyzer';
import { BrowserManager } from '../../browser/BrowserManager';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import os from 'os';

/**
 * Options for UI verification
 */
export interface UIVerificationOptions extends ImageAnalysisOptions {
  screenshotTimeout?: number;  // Timeout for taking screenshots
  waitForSelector?: string;     // Selector to wait for before taking screenshots
  waitForTimeout?: number;      // Time to wait before taking screenshots
  fullPage?: boolean;           // Whether to capture full page screenshots
}

/**
 * Result of UI verification
 */
export interface UIVerificationResult {
  success: boolean;
  error?: string;
  comparison?: ImageComparisonResult;
  textResults?: OCRResult;
  screenshotPath?: string;
  referenceScreenshotPath?: string;
}

/**
 * Class for verifying UI elements and layouts using image analysis
 */
export class UIVerifier {
  private imageAnalyzer: ImageAnalyzer;
  private browserManager: BrowserManager;
  private options: UIVerificationOptions;
  private tempDir: string;

  /**
   * Create a new UI verifier
   * @param browserManager Browser manager for taking screenshots
   * @param options Options for UI verification
   */
  constructor(browserManager?: BrowserManager, options: UIVerificationOptions = {}) {
    this.browserManager = browserManager || new BrowserManager();
    this.imageAnalyzer = new ImageAnalyzer(options);
    
    this.options = {
      screenshotTimeout: 30000,
      waitForTimeout: 1000,
      fullPage: false,
      ...options
    };
    
    this.tempDir = path.join(os.tmpdir(), 'inspecta-ui-verification');
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Take a screenshot of a page or element
   * @param url URL to navigate to
   * @param selector Optional selector to screenshot a specific element
   * @param options Screenshot options
   * @returns Promise resolving to screenshot buffer and metadata
   */
  public async takeScreenshot(
    url: string,
    selector?: string,
    options: UIVerificationOptions = {}
  ): Promise<{ buffer: Buffer; path: string; width: number; height: number }> {
    const browser = await this.browserManager.getBrowser();
    const page = await browser.newPage();
    
    try {
      const mergedOptions = { ...this.options, ...options };
      
      // Navigate to URL
      await page.goto(url, {
        timeout: mergedOptions.screenshotTimeout,
        waitUntil: 'networkidle2'
      });
      
      // Wait for selector if specified
      if (mergedOptions.waitForSelector) {
        await page.waitForSelector(mergedOptions.waitForSelector, {
          timeout: mergedOptions.screenshotTimeout
        });
      }
      
      // Wait for timeout if specified
      if (mergedOptions.waitForTimeout) {
        await new Promise(resolve => setTimeout(resolve, mergedOptions.waitForTimeout));
      }
      
      // Take screenshot of element or page
      let screenshotBuffer: Buffer;
      let elementWidth = 0;
      let elementHeight = 0;
      
      if (selector) {
        // Find element
        const element = await page.$(selector);
        
        if (!element) {
          throw new Error(`Element not found: ${selector}`);
        }
        
        // Get element dimensions
        const boundingBox = await element.boundingBox();
        
        if (!boundingBox) {
          throw new Error(`Element has no bounding box: ${selector}`);
        }
        
        elementWidth = boundingBox.width;
        elementHeight = boundingBox.height;
        
        // Take screenshot of element
        screenshotBuffer = await element.screenshot({
          type: 'png',
          omitBackground: true
        });
      } else {
        // Take screenshot of page
        screenshotBuffer = await page.screenshot({
          type: 'png',
          fullPage: mergedOptions.fullPage
        });
        
        // Get page dimensions
        const dimensions = await page.evaluate(() => {
          return {
            width: document.documentElement.clientWidth,
            height: document.documentElement.clientHeight
          };
        });
        
        elementWidth = dimensions.width;
        elementHeight = dimensions.height;
      }
      
      // Save screenshot to temp file
      const screenshotPath = path.join(this.tempDir, `screenshot-${uuidv4()}.png`);
      fs.writeFileSync(screenshotPath, screenshotBuffer);
      
      return {
        buffer: screenshotBuffer,
        path: screenshotPath,
        width: elementWidth,
        height: elementHeight
      };
    } catch (error) {
      throw new Error(`Failed to take screenshot: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      await page.close();
    }
  }

  /**
   * Compare the current state of a UI element to a reference image
   * @param url URL to navigate to
   * @param referenceImage Path or buffer of reference image
   * @param selector Optional selector to compare a specific element
   * @param options Comparison options
   * @returns Promise resolving to verification result
   */
  public async compareWithReference(
    url: string,
    referenceImage: string | Buffer,
    selector?: string,
    options: UIVerificationOptions = {}
  ): Promise<UIVerificationResult> {
    try {
      // Take screenshot
      const screenshot = await this.takeScreenshot(url, selector, options);
      
      // Compare with reference
      const comparison = await this.imageAnalyzer.compareImages(
        screenshot.buffer,
        referenceImage,
        options
      );
      
      return {
        success: comparison.matches,
        comparison,
        screenshotPath: screenshot.path,
        referenceScreenshotPath: typeof referenceImage === 'string' ? referenceImage : undefined
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Extract text from a UI element using OCR
   * @param url URL to navigate to
   * @param selector Optional selector to extract text from a specific element
   * @param options OCR options
   * @returns Promise resolving to verification result with text
   */
  public async extractTextFromUI(
    url: string,
    selector?: string,
    options: UIVerificationOptions = {}
  ): Promise<UIVerificationResult> {
    try {
      // Take screenshot
      const screenshot = await this.takeScreenshot(url, selector, options);
      
      // Extract text
      const textResults = await this.imageAnalyzer.extractText(
        screenshot.buffer,
        options
      );
      
      return {
        success: true,
        textResults,
        screenshotPath: screenshot.path
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Check if text content is visible in a UI element
   * @param url URL to navigate to
   * @param textToFind Text to search for
   * @param selector Optional selector to limit the search area
   * @param options OCR options
   * @returns Promise resolving to verification result
   */
  public async findTextInUI(
    url: string,
    textToFind: string,
    selector?: string,
    options: UIVerificationOptions = {}
  ): Promise<UIVerificationResult> {
    try {
      // Extract text
      const result = await this.extractTextFromUI(url, selector, options);
      
      if (!result.success || !result.textResults) {
        return {
          success: false,
          error: result.error || 'Failed to extract text',
          screenshotPath: result.screenshotPath
        };
      }
      
      // Check if text is found
      const textFound = result.textResults.text.includes(textToFind);
      
      return {
        success: textFound,
        textResults: result.textResults,
        screenshotPath: result.screenshotPath,
        error: textFound ? undefined : `Text "${textToFind}" not found in element`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Clean up temporary files
   */
  public cleanup(): void {
    try {
      this.imageAnalyzer.cleanup();
      
      if (fs.existsSync(this.tempDir)) {
        // Read all files in temp directory
        const files = fs.readdirSync(this.tempDir);
        
        // Delete each file
        for (const file of files) {
          if (file.startsWith('screenshot-')) {
            fs.unlinkSync(path.join(this.tempDir, file));
          }
        }
      }
    } catch (error) {
      console.error('Failed to clean up temporary files:', error);
    }
  }
} 