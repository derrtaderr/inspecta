import { z } from 'zod';
import { BaseTool } from '../BaseTool';
import { NetworkMonitor, NetworkMonitorOptions, NetworkRequestEntry } from '../../analysis/NetworkMonitor';

/**
 * Response schema for network monitoring results
 */
export interface NetworkMonitorResponse {
  success: boolean;
  requests?: NetworkRequestEntry[];
  error?: string;
  stats?: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalSize: number;
    averageResponseTime: number;
    statusCodeDistribution: Record<string, number>;
    resourceTypeDistribution: Record<string, number>;
  };
}

/**
 * MCP tool for monitoring network requests on a web page
 */
export class NetworkMonitorTool extends BaseTool<z.ZodType<NetworkMonitorOptions>, NetworkMonitorResponse> {
  private networkMonitor: NetworkMonitor;

  constructor() {
    // Define the parameters schema
    const paramsSchema = z.object({
      url: z.string().url(),
      timeoutMs: z.number().positive().optional(),
      navigationOptions: z.object({
        waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle0', 'networkidle2']).optional(),
      }).optional(),
      filters: z.object({
        methods: z.array(z.string()).optional(),
        resourceTypes: z.array(z.string()).optional(),
        statusCodes: z.array(z.number().int()).optional(),
        urlPatterns: z.array(z.string()).optional(),
        includeRequestBody: z.boolean().optional(),
        includeResponseBody: z.boolean().optional(),
        excludeUrlPatterns: z.array(z.string()).optional(),
      }).optional(),
    });

    // Define the response schema
    const responseSchema = z.object({
      success: z.boolean(),
      requests: z.array(
        z.object({
          id: z.string(),
          url: z.string(),
          method: z.string(),
          resourceType: z.string(),
          status: z.number().nullable(),
          statusText: z.string().nullable(),
          requestStatus: z.enum(['success', 'error', 'timeout', 'aborted']),
          requestHeaders: z.record(z.string()),
          responseHeaders: z.record(z.string()).nullable(),
          timing: z.object({
            startTime: z.number(),
            endTime: z.number().nullable(),
            duration: z.number().nullable(),
          }),
          errorText: z.string().optional(),
          size: z.object({
            request: z.number().nullable(),
            response: z.number().nullable(),
          }),
          postData: z.string().nullable().optional(),
          redirectChain: z.array(z.string()),
          isRedirect: z.boolean(),
        })
      ).optional(),
      error: z.string().optional(),
      stats: z.object({
        totalRequests: z.number(),
        successfulRequests: z.number(),
        failedRequests: z.number(),
        totalSize: z.number(),
        averageResponseTime: z.number(),
        statusCodeDistribution: z.record(z.number()),
        resourceTypeDistribution: z.record(z.number()),
      }).optional(),
    });

    super(
      'analyze_network_requests',
      'Monitors and analyzes all network requests made by a webpage',
      paramsSchema,
      responseSchema
    );

    this.networkMonitor = new NetworkMonitor();
  }

  /**
   * Execute the network monitoring tool
   * @param params The parameters for network monitoring
   * @returns A promise that resolves to the network monitoring results
   */
  public async execute(params: NetworkMonitorOptions): Promise<NetworkMonitorResponse> {
    try {
      console.log(`[MCP Tool] Executing analyze_network_requests for URL: ${params.url}`);
      const result = await this.networkMonitor.monitorNetwork(params);
      console.log(`[MCP Tool] Network analysis complete. Success: ${result.success}`);
      return result;
    } catch (error) {
      console.error('[MCP Tool] Error in analyze_network_requests:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
} 