import { Request, Response } from 'express';
import { ConsoleLogRequestSchema } from './schemas';
import { ConsoleLogCollector } from '../analysis/ConsoleLogCollector';

const consoleLogCollector = new ConsoleLogCollector();

/**
 * Controller for handling console log analysis requests
 */
export const consoleLogController = {
  /**
   * Collect console logs from a URL
   */
  async collectLogs(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const result = ConsoleLogRequestSchema.safeParse(req.body);
      
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          details: result.error.format(),
        });
        return;
      }
      
      const options = result.data;
      
      // Collect console logs
      const logsResult = await consoleLogCollector.collectLogs({
        url: options.url,
        timeoutMs: options.timeoutMs,
        navigationOptions: options.navigationOptions,
        filters: options.filters,
      });
      
      if (!logsResult.success) {
        res.status(500).json({
          success: false,
          error: logsResult.error,
        });
        return;
      }
      
      // Analyze error patterns if logs were collected
      const logs = logsResult.logs || [];
      const analysis = consoleLogCollector.analyzeErrorPatterns(logs);
      
      // Return logs and analysis
      res.status(200).json({
        success: true,
        data: {
          logs,
          analysis,
          summary: {
            totalLogs: logs.length,
            errorCount: analysis.errorCount,
            warningCount: analysis.warningCount,
          },
        },
      });
      
    } catch (error) {
      console.error('Console log controller error:', error);
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
      service: 'console-log-analysis',
      timestamp: new Date().toISOString(),
    });
  },
}; 