import { ToolRegistry } from './ToolRegistry';
import { z } from 'zod';

/**
 * Interface for a tool request
 */
export interface ToolRequest {
  name: string;
  parameters: Record<string, any>;
}

/**
 * Interface for a tool response
 */
export interface ToolResponse {
  result: any;
  error?: string;
}

/**
 * Handler for MCP tool requests
 */
export class RequestHandler {
  private toolRegistry: ToolRegistry;

  /**
   * Create a new request handler
   * @param toolRegistry The tool registry to use for tool lookup
   */
  constructor(toolRegistry: ToolRegistry) {
    this.toolRegistry = toolRegistry;
  }

  /**
   * Process a tool request
   * @param request The tool request to process
   * @returns A promise that resolves to the tool response
   */
  public async processRequest(request: ToolRequest): Promise<ToolResponse> {
    try {
      // Validate request
      this.validateRequest(request);

      // Get the tool
      const tool = this.toolRegistry.getTool(request.name);
      if (!tool) {
        throw new Error(`Tool "${request.name}" not found`);
      }

      // Validate parameters against the tool's schema
      const validatedParams = await this.validateParameters(request.parameters, tool.parameters);

      // Execute the tool
      const result = await tool.handler(validatedParams);

      // Return the result
      return { result };
    } catch (error) {
      console.error(`Error processing request for tool "${request.name}":`, error);
      return {
        result: null,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Validate a tool request
   * @param request The request to validate
   * @throws Error if the request is invalid
   */
  private validateRequest(request: ToolRequest): void {
    const requestSchema = z.object({
      name: z.string().min(1),
      parameters: z.record(z.any())
    });

    requestSchema.parse(request);
  }

  /**
   * Validate parameters against a schema
   * @param parameters The parameters to validate
   * @param schema The schema to validate against
   * @returns The validated parameters
   * @throws Error if the parameters are invalid
   */
  private async validateParameters(parameters: Record<string, any>, schema: z.ZodType<any>): Promise<any> {
    try {
      return schema.parse(parameters);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join('; ');
        throw new Error(`Invalid parameters: ${formattedErrors}`);
      }
      throw error;
    }
  }
} 