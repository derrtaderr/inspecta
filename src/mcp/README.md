# InspectorAI MCP Server

This directory contains the Model Context Protocol (MCP) server implementation for InspectorAI. The MCP server allows AI assistants to use InspectorAI's browser automation capabilities through a standardized protocol.

## What is MCP?

The Model Context Protocol (MCP) is an open standard for connecting AI assistants to external tools and data sources. It provides a standardized way for AI models to discover, invoke, and receive responses from tools.

Learn more about MCP at [modelcontextprotocol.io](https://modelcontextprotocol.io).

## Available Tools

InspectorAI exposes the following tools via MCP:

1. **analyze_network_requests** - Monitors and analyzes all network requests made by a webpage
2. **check_console_logs** - Collects and analyzes console logs from a web page
3. **edit_element** - Manipulates DOM elements on a web page

## Usage

### As a standalone server

You can run the MCP server as a standalone application:

```bash
# Using the CLI script
npm run mcp

# With custom port
npm run mcp -- --port 3002

# With verbose logging
npm run mcp -- --verbose

# With custom configuration file
npm run mcp -- --config ./config.json
```

After installation, you can also use the global command:

```bash
inspecta-mcp --port 3002
```

### Integrated with the main API server

The MCP server is also integrated with the main InspectorAI API server. You can enable it by setting the `MCP_SERVER_ENABLED` environment variable to `true`:

```bash
MCP_SERVER_ENABLED=true npm start
```

## Configuration

You can configure the MCP server using environment variables or a configuration file:

| Environment Variable | Description | Default |
|----------------------|-------------|---------|
| `MCP_SERVER_ENABLED` | Enable the MCP server | `false` |
| `MCP_SERVER_PORT` | Port to run the MCP server on | `3001` |
| `MCP_SERVER_BASE_PATH` | Base path for the MCP server | `/mcp` |
| `MCP_SERVER_ALLOW_ORIGIN` | CORS allow-origin setting | `*` |

## Development

### Adding a new tool

To add a new tool to the MCP server:

1. Create a new tool class in the `src/mcp/tools` directory
2. Extend the `BaseTool` class
3. Implement the `execute` method
4. Register the tool in `src/mcp/tools/index.ts`

Example:

```typescript
import { z } from 'zod';
import { BaseTool } from '../BaseTool';

export class MyNewTool extends BaseTool<z.ZodType<MyParams>, MyResult> {
  constructor() {
    const paramsSchema = z.object({
      // Define your parameters schema
    });
    
    const responseSchema = z.object({
      // Define your response schema
    });
    
    super(
      'my_new_tool',
      'Description of my new tool',
      paramsSchema,
      responseSchema
    );
  }
  
  public async execute(params: MyParams): Promise<MyResult> {
    // Implement your tool logic
  }
}
```

Then register it in `src/mcp/tools/index.ts`:

```typescript
import { MyNewTool } from './MyNewTool';

export function getAllTools(): Tool<any, any>[] {
  const tools: Tool<any, any>[] = [
    // Existing tools
    new MyNewTool().toMCPTool(),
  ];
  
  return tools;
}
``` 