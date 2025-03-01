import { z } from 'zod';
import { BaseTool } from '../BaseTool';
import { 
  DomManipulator, 
  ElementStateType, 
  ElementActionType, 
  DomOperationResult 
} from '../../analysis/DomManipulator';

/**
 * Parameters for DOM manipulation operations
 */
export interface DomManipulationParams {
  url: string;
  operation: 'check_state' | 'get_properties' | 'perform_action';
  selector: string;
  stateType?: ElementStateType;
  actionType?: ElementActionType;
  properties?: string[];
  actionValue?: string;
  timeoutMs?: number;
}

/**
 * MCP tool for DOM manipulation operations
 */
export class DomManipulatorTool extends BaseTool<z.ZodType<DomManipulationParams>, DomOperationResult> {
  private domManipulator: DomManipulator;

  constructor() {
    // Define the parameters schema
    const paramsSchema = z.object({
      url: z.string().url(),
      operation: z.enum([
        'check_state', 
        'get_properties', 
        'perform_action'
      ]),
      selector: z.string(),
      stateType: z.nativeEnum(ElementStateType).optional(),
      actionType: z.nativeEnum(ElementActionType).optional(),
      properties: z.array(z.string()).optional(),
      actionValue: z.string().optional(),
      timeoutMs: z.number().positive().optional(),
    });

    // Define the response schema
    const responseSchema = z.object({
      success: z.boolean(),
      error: z.string().optional(),
      value: z.any().optional(),
    });

    super(
      'edit_element',
      'Manipulates DOM elements on a web page',
      paramsSchema,
      responseSchema
    );

    this.domManipulator = new DomManipulator();
  }

  /**
   * Execute the DOM manipulation tool
   * @param params The parameters for DOM manipulation
   * @returns A promise that resolves to the DOM operation result
   */
  public async execute(params: DomManipulationParams): Promise<DomOperationResult> {
    try {
      console.log(`[MCP Tool] Executing edit_element operation: ${params.operation} on URL: ${params.url}`);
      
      switch (params.operation) {
        case 'check_state':
          if (!params.stateType) {
            return {
              success: false,
              error: 'stateType is required for check_state operation'
            };
          }
          return await this.domManipulator.checkElementState(
            params.url,
            params.selector,
            params.stateType,
            params.timeoutMs
          );
          
        case 'get_properties':
          if (!params.properties || params.properties.length === 0) {
            return {
              success: false,
              error: 'properties array is required for get_properties operation'
            };
          }
          return await this.domManipulator.getElementProperties(
            params.url,
            params.selector,
            params.properties,
            params.timeoutMs
          );
          
        case 'perform_action':
          if (!params.actionType) {
            return {
              success: false,
              error: 'actionType is required for perform_action operation'
            };
          }
          return await this.domManipulator.performElementAction(
            params.url,
            params.selector,
            params.actionType,
            params.actionValue,
            params.timeoutMs
          );
          
        default:
          return {
            success: false,
            error: `Unknown operation: ${params.operation}`
          };
      }
    } catch (error) {
      console.error('[MCP Tool] Error in edit_element:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
} 