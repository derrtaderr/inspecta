# InspectorAI: MCP Integration Guide

This document outlines how to package InspectorAI as an npm module that works via the Model Context Protocol (MCP), enabling the Cursor agent to interact with it through a standardized interface.

## Overview

The Model Context Protocol (MCP) is an open standard for connecting AI assistants to external tools and data sources. By implementing InspectorAI as an MCP server, we can expose its screenshot capture, console log analysis, and DOM manipulation capabilities as tools that the Cursor agent can call through the protocol.

## Implementation Approach

### Architecture

InspectorAI will be packaged as an MCP server with the following components:

1. **MCP Server Core**: Handles the protocol communication, tool registration, and request dispatching.
2. **Puppeteer Integration**: Manages browser instances and provides the core functionality.
3. **Tool Definitions**: Exposes InspectorAI's features as callable tools via MCP.
4. **Configuration System**: Allows users to customize the behavior through environment variables or config files.

```
┌─────────────────────────────────────┐
│              Cursor Agent           │
└───────────────┬─────────────────────┘
                │
                │ MCP Protocol
                ▼
┌─────────────────────────────────────┐
│         InspectorAI MCP Server      │
│                                     │
│  ┌─────────────┐    ┌────────────┐  │
│  │  Tool       │    │ MCP Server │  │
│  │  Definitions│◄───┤ Core       │  │
│  └──────┬──────┘    └────────────┘  │
│         │                           │
│         │                           │
│  ┌──────▼──────┐    ┌────────────┐  │
│  │  Puppeteer  │    │Configuration│  │
│  │  Integration│    │ System     │  │
│  └─────────────┘    └────────────┘  │
└─────────────────────────────────────┘
```

### MCP Tools Implementation

InspectorAI will expose the following tools via MCP:

#### 1. `take_screenshot`

Takes a screenshot of a webpage or specific element.

**Input Parameters:**
- `url` (required): URL to navigate to
- `selector` (optional): CSS selector to capture a specific element
- `viewport` (optional): Viewport dimensions
- `format` (optional): Image format (png, jpeg)

**Output:**
- Type: `image`
- Format: Base64-encoded image blob

#### 2. `check_console_logs`

Retrieves console logs from a webpage.

**Input Parameters:**
- `url` (required): URL to navigate to
- `logLevel` (optional): Filter by log level (error, warning, info)
- `limit` (optional): Maximum number of logs to return

**Output:**
- Type: `text`
- Format: Structured log information as JSON

#### 3. `analyze_network_requests`

Analyzes network requests made by a webpage.

**Input Parameters:**
- `url` (required): URL to navigate to
- `status` (optional): Filter by status (error, success)
- `resourceType` (optional): Filter by resource type

**Output:**
- Type: `text`
- Format: Structured network request information as JSON

#### 4. `edit_element`

Modifies a DOM element on a webpage.

**Input Parameters:**
- `url` (required): URL to navigate to
- `selector` (required): CSS selector for the target element
- `action` (required): Action to perform (setText, setAttribute, etc.)
- `value` (required): Value to apply

**Output:**
- Type: `text`
- Format: Success message or error information

## npm Package Structure

```
inspectorai/
├── src/
│   ├── index.ts                  # Main entry point
│   ├── server.ts                 # MCP server implementation
│   ├── tools/                    # Tool implementations
│   │   ├── screenshot.ts         # Screenshot tool
│   │   ├── console-logs.ts       # Console logs tool
│   │   ├── network-requests.ts   # Network requests tool
│   │   └── element-editor.ts     # DOM manipulation tool
│   ├── browser/                  # Browser automation logic
│   │   ├── browser-pool.ts       # Browser instance management
│   │   ├── page-handler.ts       # Page creation and navigation
│   │   └── utils.ts              # Browser utility functions
│   └── config/                   # Configuration logic
│       ├── schema.ts             # Config schema validation
│       └── loader.ts             # Config loading from env/files
├── bin/                          # CLI entry points
│   └── inspectorai.js            # npx executable
├── dist/                         # Compiled JavaScript
├── tests/                        # Test files
├── package.json                  # npm package definition
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # Package documentation
```

## Usage Example

### Installation

```bash
npm install -g inspectorai
# or
npm install inspectorai
```

### Running as MCP Server

```bash
# Run globally installed package
npx inspectorai

# Run locally installed package
npx inspectorai
```

### Configuration

Configure via environment variables:

```bash
# Set the port for the MCP server
export INSPECTORAI_PORT=3000

# Configure Chrome executable path
export INSPECTORAI_CHROME_PATH=/path/to/chrome

# Run with specific configuration
npx inspectorai
```

Or create a configuration file:

```json
// inspectorai.config.json
{
  "port": 3000,
  "chromePath": "/path/to/chrome",
  "maxBrowserInstances": 2,
  "defaultViewport": {
    "width": 1920,
    "height": 1080
  }
}
```

Then run with:

```bash
npx inspectorai --config inspectorai.config.json
```

## Integration with Cursor Agent

### Connection

The Cursor agent connects to InspectorAI via MCP:

```typescript
// Example Cursor agent integration code
import { MCPClient } from '@modelcontextprotocol/sdk';

const client = new MCPClient({
  serverUrl: 'http://localhost:3000',
});

// Connect to InspectorAI
await client.connect();

// Get available tools
const tools = await client.listTools();
```

### Tool Usage Example

```typescript
// Take a screenshot of a hero section
const screenshot = await client.callTool('take_screenshot', {
  url: 'https://example.com',
  selector: '.hero-section',
  viewport: { width: 1920, height: 1080 }
});

// Check console logs for errors
const logs = await client.callTool('check_console_logs', {
  url: 'https://example.com',
  logLevel: 'error'
});

// Edit a DOM element
const editResult = await client.callTool('edit_element', {
  url: 'https://example.com',
  selector: '#title',
  action: 'setText',
  value: 'Hello World'
});
```

## Technical Considerations

### Browser Instance Management

InspectorAI optimizes performance by maintaining a pool of browser instances:

- **Single Browser Strategy**: By default, the package maintains a single browser instance with multiple pages to reduce memory usage.
- **Pooling**: For high-load scenarios, a configurable pool of browser instances can be used.
- **Lifecycle Management**: Browser instances are created on demand and reused across requests, with proper cleanup mechanisms.

### Error Handling

The MCP server implements robust error handling:

- **Input Validation**: Uses Zod schemas to validate all tool inputs.
- **Graceful Degradation**: Falls back to alternative methods if primary approaches fail.
- **Detailed Error Messages**: Provides actionable error information to the Cursor agent.

### Security Considerations

- **URL Validation**: Validates URLs to prevent accessing internal resources.
- **Sandbox Mode**: Runs Puppeteer in sandbox mode for isolation.
- **Resource Limits**: Implements timeouts and resource limits to prevent DoS attacks.

## Performance Optimization

- **Browser Warm-up**: Pre-launches browser instances to reduce initial latency.
- **Page Caching**: Reuses pages for the same URLs when appropriate.
- **Parallel Processing**: Handles multiple requests concurrently where safe.

## Development Setup

To develop or contribute to the InspectorAI MCP package:

```bash
# Clone the repository
git clone https://github.com/your-org/inspectorai.git

# Install dependencies
cd inspectorai
npm install

# Run in development mode
npm run dev

# Build the package
npm run build

# Run tests
npm test
```

## Troubleshooting

Common issues and their solutions:

| Issue | Solution |
|-------|----------|
| Browser fails to launch | Check Chrome installation and path configuration |
| MCP server connection timeout | Verify port settings and firewall rules |
| High memory usage | Adjust maxBrowserInstances in configuration |
| Slow screenshot capture | Optimize viewport size or use element selectors |

## Conclusion

Packaging InspectorAI as an npm module that integrates with MCP provides a powerful and standardized way for the Cursor agent to verify website designs and diagnose issues. This approach leverages the benefits of MCP's protocol while maintaining the core functionality and performance of InspectorAI. 