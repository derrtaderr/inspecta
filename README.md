# InspectorAI

InspectorAI is a powerful browser automation and analysis tool designed to enhance the Cursor agent's ability to autonomously verify website designs and diagnose errors.

## Features

- **Browser Automation**: Control browser instances to navigate and interact with web pages
- **Screenshot Service**: Capture full-page or element-specific screenshots
- **Console Log Analysis**: Collect, filter, and analyze console logs for error patterns
- **Network Monitoring**: Track and analyze network requests, responses, and performance metrics
- **DOM Manipulation**: Interact with and modify DOM elements on web pages
- **Image Analysis**: Extract text from images using OCR and compare visual elements
- **RESTful API**: Access all functionality through a clean API interface
- **MCP Integration**: Use InspectorAI as a Model Context Protocol (MCP) tool provider

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm 7.x or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/derrtaderr/inspecta.git
   cd inspecta
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Start the server:
   ```bash
   npm start
   ```

## API Endpoints

### Screenshot Service

```
POST /api/screenshot
```

Example payload:
```json
{
  "url": "https://example.com",
  "selector": "#main-content",
  "fullPage": false,
  "format": "png"
}
```

### Console Log Analysis

```
POST /api/console-logs
```

Example payload:
```json
{
  "url": "https://example.com",
  "timeout": 5000,
  "logTypes": ["error", "warning"]
}
```

### Network Monitoring

```
POST /api/network
```

Example payload:
```json
{
  "url": "https://example.com",
  "timeout": 5000,
  "includeResources": true
}
```

### DOM Manipulation

```
POST /api/dom/check-state
```

Example payload:
```json
{
  "url": "https://example.com",
  "selector": "#submit-button",
  "property": "disabled"
}
```

```
POST /api/dom/properties
```

Example payload:
```json
{
  "url": "https://example.com",
  "selector": ".product-card",
  "properties": ["textContent", "className"]
}
```

```
POST /api/dom/action
```

Example payload:
```json
{
  "url": "https://example.com",
  "selector": "#login-button",
  "action": "click"
}
```

### Image Analysis

```
POST /api/image-analysis/extract-text
```

Example payload:
```json
{
  "url": "https://example.com",
  "selector": ".product-image",
  "ocrLanguage": "eng",
  "ocrConfidence": 0.7
}
```

```
POST /api/image-analysis/find-text
```

Example payload:
```json
{
  "url": "https://example.com",
  "textToFind": "Add to Cart",
  "selector": ".product-card"
}
```

```
POST /api/image-analysis/compare
```

Example payload (multipart form data):
- `url`: "https://example.com"
- `selector`: ".logo"
- `referenceImage`: [file upload]
- `threshold`: 0.1

## MCP Integration

InspectorAI can be used as a Model Context Protocol (MCP) tool provider, allowing AI assistants to utilize its capabilities through a standardized protocol.

### Running the MCP Server

You can run the MCP server standalone:

```bash
npm run mcp
# or with custom port
npm run mcp -- --port 3002
```

Or alongside the main API server:

```bash
MCP_SERVER_ENABLED=true npm start
```

### Available MCP Tools

- **analyze_network_requests** - Monitors and analyzes all network requests made by a webpage
- **check_console_logs** - Collects and analyzes console logs from a web page
- **edit_element** - Manipulates DOM elements on a web page
- **extract_text_from_ui** - Extracts text from UI elements using OCR

See the [MCP Server README](src/mcp/README.md) for more details on using InspectorAI with MCP.

## Project Structure

```
inspecta/
├── src/
│   ├── api/           # API controllers and routes
│   ├── browser/       # Browser automation core
│   ├── analysis/      # Analysis modules
│   │   ├── console/   # Console log analysis
│   │   ├── network/   # Network request analysis
│   │   └── image/     # Image analysis and OCR
│   ├── config/        # Configuration
│   └── mcp/           # MCP integration
├── tests/             # Test suite
└── dist/              # Compiled output
```

## Running Tests

```bash
npm test
```

## License

This project is licensed under the ISC License.

## Roadmap

See the [Product Roadmap](cursorrule/ProductRoadmap.md) for details on upcoming features and development plans.

## Using with Cursor's Model Context Protocol (MCP)

InspectorAI provides tools that can be used with Cursor's [Model Context Protocol (MCP)](https://docs.cursor.com/context/model-context-protocol). This allows AI assistants in Cursor to directly interact with the web browser through InspectorAI.

### Available MCP Tools

- **check_console_logs**: Collects and analyzes console logs from a web page
- **analyze_network_requests**: Monitors and analyzes all network requests made by a webpage
- **edit_element**: Manipulates DOM elements on a web page
- **extract_text_from_ui**: Extracts text from UI elements using OCR

### Setting Up

There are two ways to connect InspectorAI to Cursor:

#### Method 1: SSE Transport (Recommended)

1. Start InspectorAI with MCP enabled:
   ```bash
   npx inspectorai serve --mcp --disable-auth
   ```

2. In Cursor, go to `Settings` > `Features` > `MCP`

3. Click `+ Add New MCP Server`

4. Fill in the form:
   - **Name**: InspectorAI
   - **Type**: SSE
   - **URL**: http://localhost:3001/sse

5. Click `Save`

#### Method 2: stdio Transport

1. In Cursor, go to `Settings` > `Features` > `MCP`

2. Click `+ Add New MCP Server`

3. Fill in the form:
   - **Name**: InspectorAI
   - **Type**: stdio
   - **Command**: `npx inspectorai-mcp`

4. Click `Save`

#### Project-Specific Configuration

You can also add InspectorAI to specific projects by creating a `.cursor/mcp.json` file:

```json
{
  "mcpServers": {
    "inspectorai-sse": {
      "url": "http://localhost:3001/sse"
    },
    "inspectorai-stdio": {
      "command": "npx",
      "args": [
        "inspectorai-mcp"
      ]
    }
  }
}
```

### Using MCP Tools in Cursor

Once set up, the Cursor Agent will automatically use InspectorAI tools when appropriate. You can prompt the Agent to use specific tools by describing what you want to do with a web page.

For example:
- "Capture a screenshot of example.com"
- "Check the console logs on this page"
- "Monitor network requests when I click this button" 