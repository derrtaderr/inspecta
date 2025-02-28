import { Request, Response } from 'express';
import { DomManipulator, ElementStateType, ElementActionType } from '../analysis/DomManipulator';
import { DomManipulatorRequestSchema } from './schemas';

const domManipulator = new DomManipulator();

/**
 * Controller for handling DOM manipulation requests
 */
export const domManipulatorController = {
  /**
   * Check element state on a webpage
   */
  async checkElementState(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const result = DomManipulatorRequestSchema.safeParse(req.body);
      
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          details: result.error.format(),
        });
        return;
      }
      
      const options = result.data;
      
      if (!options.stateType) {
        res.status(400).json({
          success: false,
          error: 'Missing stateType parameter',
        });
        return;
      }
      
      // Check element state
      const stateResult = await domManipulator.checkElementState(
        options.url,
        options.selector,
        options.stateType as ElementStateType,
        options.timeoutMs
      );
      
      if (!stateResult.success) {
        res.status(500).json({
          success: false,
          error: stateResult.error,
        });
        return;
      }
      
      // Return state result
      res.status(200).json({
        success: true,
        data: {
          state: stateResult.value,
          url: options.url,
          selector: options.selector,
          stateType: options.stateType,
        },
      });
      
    } catch (error) {
      console.error('DOM state check error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  
  /**
   * Get element properties from a webpage
   */
  async getElementProperties(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const result = DomManipulatorRequestSchema.safeParse(req.body);
      
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          details: result.error.format(),
        });
        return;
      }
      
      const options = result.data;
      
      if (!options.properties || !options.properties.length) {
        res.status(400).json({
          success: false,
          error: 'Missing properties parameter',
        });
        return;
      }
      
      // Get element properties
      const propertiesResult = await domManipulator.getElementProperties(
        options.url,
        options.selector,
        options.properties,
        options.timeoutMs
      );
      
      if (!propertiesResult.success) {
        res.status(500).json({
          success: false,
          error: propertiesResult.error,
        });
        return;
      }
      
      // Return properties result
      res.status(200).json({
        success: true,
        data: {
          properties: propertiesResult.value,
          url: options.url,
          selector: options.selector,
        },
      });
      
    } catch (error) {
      console.error('DOM properties error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  
  /**
   * Perform an action on an element
   */
  async performElementAction(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const result = DomManipulatorRequestSchema.safeParse(req.body);
      
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          details: result.error.format(),
        });
        return;
      }
      
      const options = result.data;
      
      if (!options.actionType) {
        res.status(400).json({
          success: false,
          error: 'Missing actionType parameter',
        });
        return;
      }
      
      // Perform element action
      const actionResult = await domManipulator.performElementAction(
        options.url,
        options.selector,
        options.actionType as ElementActionType,
        options.actionValue,
        options.timeoutMs
      );
      
      if (!actionResult.success) {
        res.status(500).json({
          success: false,
          error: actionResult.error,
        });
        return;
      }
      
      // Return action result
      res.status(200).json({
        success: true,
        data: {
          success: actionResult.value,
          url: options.url,
          selector: options.selector,
          actionType: options.actionType,
        },
      });
      
    } catch (error) {
      console.error('DOM action error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
  
  /**
   * Find elements matching a selector
   */
  async findElements(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const result = DomManipulatorRequestSchema.safeParse(req.body);
      
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          details: result.error.format(),
        });
        return;
      }
      
      const options = result.data;
      
      // Find elements
      const findResult = await domManipulator.findElements(
        options.url,
        options.selector,
        options.properties,
        options.limit,
        options.timeoutMs
      );
      
      if (!findResult.success) {
        res.status(500).json({
          success: false,
          error: findResult.error,
        });
        return;
      }
      
      // Return elements result
      res.status(200).json({
        success: true,
        data: {
          elements: findResult.value || [],
          count: findResult.value?.length || 0,
          url: options.url,
          selector: options.selector,
        },
      });
      
    } catch (error) {
      console.error('DOM find elements error:', error);
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
      service: 'dom-manipulation',
      timestamp: new Date().toISOString(),
    });
  },
}; 