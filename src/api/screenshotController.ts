import { Request, Response } from 'express';
import { ScreenshotRequestSchema } from './schemas';
import { ScreenshotService } from '../browser/ScreenshotService';
import { z } from 'zod';

const screenshotService = new ScreenshotService();

/**
 * Controller for handling screenshot requests
 */
export const screenshotController = {
  /**
   * Take a screenshot of a URL or element
   */
  async takeScreenshot(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const result = ScreenshotRequestSchema.safeParse(req.body);
      
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          details: result.error.format(),
        });
        return;
      }
      
      const options = result.data;
      
      // Take screenshot
      const screenshot = await screenshotService.takeScreenshot({
        url: options.url,
        selector: options.selector,
        fullPage: options.fullPage,
        format: options.format,
        quality: options.quality,
        width: options.width,
        height: options.height,
        waitForSelector: options.waitForSelector,
        waitTime: options.waitTime,
      });
      
      if (!screenshot.success) {
        res.status(500).json({
          success: false,
          error: screenshot.error,
        });
        return;
      }
      
      // If data is a string (file path), return success response
      if (typeof screenshot.data === 'string') {
        res.status(200).json({
          success: true,
          filePath: screenshot.data,
        });
        return;
      }
      
      // If data is a buffer, return the image
      if (screenshot.data instanceof Buffer) {
        const format = options.format || 'png';
        res.set('Content-Type', `image/${format}`);
        res.status(200).send(screenshot.data);
        return;
      }
      
      // Should never reach here if takeScreenshot is implemented correctly
      res.status(500).json({
        success: false,
        error: 'Unexpected response format from screenshot service',
      });
      
    } catch (error) {
      console.error('Screenshot controller error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  
  /**
   * Health check endpoint
   */
  async healthCheck(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
      status: 'ok',
      service: 'screenshot',
      timestamp: new Date().toISOString(),
    });
  },
}; 