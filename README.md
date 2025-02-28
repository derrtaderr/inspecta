# InspectorAI

InspectorAI is a powerful browser automation and analysis tool designed to enhance the Cursor agent's ability to autonomously verify website designs and diagnose errors.

## Features

- **Browser Automation**: Control browser instances to navigate and interact with web pages
- **Screenshot Service**: Capture full-page or element-specific screenshots
- **Console Log Analysis**: Collect, filter, and analyze console logs for error patterns
- **Network Monitoring**: Track and analyze network requests, responses, and performance metrics
- **RESTful API**: Access all functionality through a clean API interface

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

### Running the Server

Start the development server:
```bash
npm run dev
```

Or run the production build:
```bash
npm run build
npm start
```

The server will be available at http://localhost:3000 by default.

## API Endpoints

### Screenshot Service

- `POST /api/screenshot`: Capture a screenshot of a URL or element
  ```json
  {
    "url": "https://example.com",
    "selector": ".element-class", // Optional
    "fullPage": true, // Optional
    "format": "png", // Optional: "png" or "jpeg"
    "quality": 80, // Optional: 1-100 (for jpeg)
    "width": 1280, // Optional
    "height": 800, // Optional
    "waitForSelector": ".wait-for-this", // Optional
    "waitTime": 1000 // Optional: milliseconds
  }
  ```

### Console Log Analysis

- `POST /api/console-logs`: Collect and analyze console logs from a URL
  ```json
  {
    "url": "https://example.com",
    "timeoutMs": 5000, // Optional
    "navigationOptions": { // Optional
      "waitUntil": "networkidle2" // Optional: "load", "domcontentloaded", "networkidle0", "networkidle2"
    },
    "filters": { // Optional
      "logLevel": ["error", "warning"], // Optional
      "includePatterns": ["error pattern"], // Optional
      "excludePatterns": ["ignore pattern"] // Optional
    }
  }
  ```

### Network Monitoring

- `POST /api/network`: Monitor network requests and analyze performance
  ```json
  {
    "url": "https://example.com",
    "timeoutMs": 5000, // Optional
    "navigationOptions": { // Optional
      "waitUntil": "networkidle2" // Optional: "load", "domcontentloaded", "networkidle0", "networkidle2"
    },
    "filters": { // Optional
      "methods": ["GET", "POST"], // Optional: Filter by HTTP methods
      "resourceTypes": ["fetch", "script", "stylesheet"], // Optional: Filter by resource types 
      "statusCodes": [200, 404, 500], // Optional: Filter by status codes
      "urlPatterns": ["api", "assets"], // Optional: Include URLs matching patterns
      "excludeUrlPatterns": ["analytics"], // Optional: Exclude URLs matching patterns
      "includeRequestBody": false, // Optional: Include request body data
      "includeResponseBody": false // Optional: Include response body data
    }
  }
  ```

## Development

### Project Structure

```
inspecta/
├── src/
│   ├── api/          # API controllers and routes
│   ├── browser/      # Browser automation core
│   ├── analysis/     # Analysis services
│   ├── config/       # Configuration
│   └── index.ts      # Application entry point
├── tests/
│   ├── unit/         # Unit tests
│   ├── integration/  # Integration tests
│   └── e2e/          # End-to-end tests
├── docs/             # Documentation
└── dist/             # Compiled output
```

### Running Tests

```bash
npm test
```

## License

This project is licensed under the ISC License.

## Roadmap

See the [Product Roadmap](./cursorrule/ProductRoadmap.md) for the development plan and upcoming features. 