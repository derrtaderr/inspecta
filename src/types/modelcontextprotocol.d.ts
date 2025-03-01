declare module '@modelcontextprotocol/sdk' {
  export interface Tool {
    name: string;
    description: string;
    schema: ToolSchema;
    execute: (params: any) => Promise<any>;
  }

  export interface ToolSchema {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  }

  export interface MCPServerConfig {
    port: number;
    host: string;
    tools: Tool[];
  }

  export class MCPServer {
    constructor(config: MCPServerConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
  }
} 