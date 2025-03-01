import { z } from 'zod';
import { BaseTool } from '../BaseTool';
import { ConsoleLogCollector, ConsoleLogOptions, ConsoleLogEntry, LogLevel } from '../../analysis/ConsoleLogCollector';

/**
 * Response schema for console log collection results
 */
export interface ConsoleLogResponse {
  success: boolean;
  logs?: ConsoleLogEntry[];
  error?: string;
  analysis?: {
    errorCount: number;
    warningCount: number;
    commonErrors: { pattern: string; count: number }[];
  };
}

/**
 * MCP tool for collecting console logs from a web page
 */
export class ConsoleLogTool extends BaseTool<z.ZodType<ConsoleLogOptions>, ConsoleLogResponse> {
  private consoleLogCollector: ConsoleLogCollector;

  constructor() {
    // Define the parameters schema
    const paramsSchema = z.object({
      url: z.string().url(),
      timeoutMs: z.number().positive().optional(),
      navigationOptions: z.object({
        waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle0', 'networkidle2']).optional(),
      }).optional(),
      filters: z.object({
        logLevel: z.array(z.enum(['debug', 'info', 'warning', 'error'])).optional(),
        includePatterns: z.array(z.string()).optional(),
        excludePatterns: z.array(z.string()).optional(),
      }).optional(),
    });

    // Define the response schema
    const responseSchema = z.object({
      success: z.boolean(),
      logs: z.array(
        z.object({
          level: z.enum(['debug', 'info', 'warning', 'error']),
          message: z.string(),
          timestamp: z.number(),
          url: z.string(),
          location: z.object({
            lineNumber: z.number().optional(),
            columnNumber: z.number().optional(),
            fileName: z.string().optional(),
          }).optional(),
        })
      ).optional(),
      error: z.string().optional(),
      analysis: z.object({
        errorCount: z.number(),
        warningCount: z.number(),
        commonErrors: z.array(
          z.object({
            pattern: z.string(),
            count: z.number(),
          })
        ),
      }).optional(),
    });

    super(
      'check_console_logs',
      'Collects and analyzes console logs from a web page',
      paramsSchema,
      responseSchema
    );

    this.consoleLogCollector = new ConsoleLogCollector();
  }

  /**
   * Execute the console log collection tool
   * @param params The parameters for console log collection
   * @returns A promise that resolves to the console log collection results
   */
  public async execute(params: ConsoleLogOptions): Promise<ConsoleLogResponse> {
    try {
      console.log(`[MCP Tool] Executing check_console_logs for URL: ${params.url}`);
      const result = await this.consoleLogCollector.collectLogs(params);
      
      // If logs were collected successfully, analyze them
      if (result.success && result.logs) {
        const analysis = this.consoleLogCollector.analyzeErrorPatterns(result.logs);
        return {
          ...result,
          analysis,
        };
      }
      
      console.log(`[MCP Tool] Console log collection complete. Success: ${result.success}`);
      return result;
    } catch (error) {
      console.error('[MCP Tool] Error in check_console_logs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
} 