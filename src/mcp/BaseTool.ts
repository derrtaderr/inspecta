// import { Tool, ToolSchema } from '@modelcontextprotocol/sdk';
// Using our custom type declarations instead
import { z } from 'zod';

/**
 * Base class for creating MCP tools
 * Provides common functionality for all tools
 */
export abstract class BaseTool<TParams extends z.ZodTypeAny, TResult> {
  /**
   * The name of the tool
   */
  public readonly name: string;
  
  /**
   * The description of the tool
   */
  public readonly description: string;
  
  /**
   * The parameter schema for the tool
   */
  public readonly parameters: TParams;
  
  /**
   * The result schema for the tool
   */
  public readonly resultSchema: z.ZodType<TResult>;

  /**
   * Create a new tool
   * @param name The name of the tool
   * @param description The description of the tool
   * @param parameters The parameter schema for the tool
   * @param resultSchema The result schema for the tool
   */
  constructor(
    name: string,
    description: string,
    parameters: TParams,
    resultSchema: z.ZodType<TResult>
  ) {
    this.name = name;
    this.description = description;
    this.parameters = parameters;
    this.resultSchema = resultSchema;
  }

  /**
   * Execute the tool
   * @param params The parameters for the tool
   * @returns A promise that resolves to the result of the tool execution
   */
  public abstract execute(params: z.infer<TParams>): Promise<TResult>;

  /**
   * Convert this tool to an MCP Tool object
   * @returns An MCP Tool object
   */
  public toMCPTool(): Tool {
    return {
      name: this.name,
      description: this.description,
      schema: this.parameters,
      execute: async (params: z.infer<TParams>) => {
        try {
          const result = await this.execute(params);
          return this.resultSchema.parse(result);
        } catch (error) {
          console.error(`Error executing tool ${this.name}:`, error);
          throw error;
        }
      }
    };
  }

  /**
   * Create a tool schema for this tool
   * @returns A tool schema object
   */
  public toToolSchema(): ToolSchema {
    return {
      type: 'object',
      properties: this.parameters,
    };
  }
} 