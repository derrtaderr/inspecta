import express from 'express';
// import { Tool, ToolSchema, MCPServerConfig, MCPServer } from '@modelcontextprotocol/sdk';
// Using our custom type declarations instead
import cors from 'cors';
import { ToolRegistry } from './ToolRegistry';
import { RequestHandler } from './RequestHandler';
import { ConfigLoader } from './Config';

/**
 * InspectorAI MCP Server implementation that exposes browser automation
 * capabilities as tools that can be used by AI assistants.
 */
export class InspectorAIMCPServer {
  private server: MCPServer;
  private app: express.Express;
  private toolRegistry: ToolRegistry;
  private port: number;
  private requestHandler: RequestHandler;
  private sseClients: Set<express.Response> = new Set();

  /**
   * Create a new InspectorAI MCP server instance
   * @param port The port number to listen on
   * @param config Optional configuration options
   */
  constructor(port: number = 3000, configPath?: string) {
    this.port = port;
    this.app = express();
    
    // Load configuration
    const config = configPath ? ConfigLoader.loadConfig(configPath) : ConfigLoader.getDefaultConfig();
    
    // Set up middleware
    this.app.use(cors());
    this.app.use(express.json());
    
    // Create tool registry and request handler
    this.toolRegistry = new ToolRegistry();
    this.requestHandler = new RequestHandler(this.toolRegistry);
    
    // Create MCP server with Express app
    const serverConfig: MCPServerConfig = {
      port: this.port,
      host: 'localhost',
      tools: []
    };
    
    // Mock implementation since we're not actually using the real SDK
    this.server = {
      start: async () => {},
      stop: async () => {}
    } as MCPServer;
    
    // Set up routes
    this.setupRoutes();
  }

  /**
   * Register a tool with the server
   * @param tool The tool to register
   */
  public registerTool(tool: Tool) {
    this.toolRegistry.registerTool(tool);
    // this.server.addTool(tool); // Not needed with our mock implementation
  }

  /**
   * Register multiple tools with the server
   * @param tools An array of tools to register
   */
  public registerTools(tools: Tool[]) {
    tools.forEach(tool => this.registerTool(tool));
  }

  /**
   * Set up the server routes
   */
  private setupRoutes() {
    // Add health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok' });
    });

    // Add tools endpoint - returns list of available tools
    this.app.get('/tools', (req, res) => {
      const tools = this.toolRegistry.getAllTools().map(tool => ({
        name: tool.name,
        description: tool.description,
        schema: tool.schema
      }));
      
      res.status(200).json({ tools });
    });

    // Add SSE endpoint for Cursor compatibility
    this.app.get('/sse', (req, res) => {
      // Set headers for SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // Send initial connection established event
      res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
      
      // Add client to the set
      this.sseClients.add(res);
      
      // Handle client disconnect
      req.on('close', () => {
        this.sseClients.delete(res);
      });
    });

    // Add tool execution endpoint
    this.app.post('/execute', async (req, res) => {
      try {
        const { name, parameters } = req.body;
        
        if (!name) {
          return res.status(400).json({ error: 'Tool name is required' });
        }
        
        const response = await this.requestHandler.processRequest({
          name,
          parameters: parameters || {}
        });
        
        res.status(200).json(response);
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
    });

    // Traditional MCP endpoint for backward compatibility
    this.app.post('/mcp', async (req, res) => {
      try {
        const { name, parameters } = req.body;
        
        if (!name) {
          return res.status(400).json({ error: 'Tool name is required' });
        }
        
        const response = await this.requestHandler.processRequest({
          name,
          parameters: parameters || {}
        });
        
        res.status(200).json(response);
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
    });
  }

  /**
   * Start the server
   * @returns A promise that resolves when the server starts
   */
  public async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.log(`InspectorAI MCP Server running on port ${this.port}`);
        console.log(`SSE endpoint available at http://localhost:${this.port}/sse`);
        resolve();
      });
    });
  }

  /**
   * Get the list of registered tools
   * @returns Array of registered tools
   */
  public getTools(): Tool[] {
    return this.toolRegistry.getAllTools();
  }
  
  /**
   * Execute a tool request directly (for stdio mode)
   * @param request The tool request to execute
   * @returns A promise that resolves to the tool response
   */
  public async executeToolRequest(request: { name: string; parameters?: Record<string, any> }): Promise<any> {
    try {
      return await this.requestHandler.processRequest({
        name: request.name,
        parameters: request.parameters || {}
      });
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
} 