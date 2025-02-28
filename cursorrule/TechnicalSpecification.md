# InspectorAI: Technical Specification

This document outlines the technical architecture, implementation details, and project structure for the InspectorAI system.

## System Architecture

InspectorAI follows a microservices architecture with the following key components:

1. **Browser Automation Service**
   - Responsible for browser interactions (screenshots, console logs, network monitoring)
   - Communicates with the API Gateway

2. **API Gateway**
   - Exposes REST endpoints for the Cursor agent
   - Routes requests to appropriate microservices
   - Handles authentication and rate limiting

3. **Analysis Service**
   - Processes screenshots and extracted data
   - Identifies errors and issues
   - Generates reports for the Cursor agent

4. **Logging and Monitoring Service**
   - Tracks system health and performance
   - Records interactions for auditing and improvement

## Technology Stack

| Component | Technology | Justification |
|-----------|------------|---------------|
| Browser Automation | Puppeteer | Industry standard for headless Chrome automation with full API access |
| Backend Framework | Node.js + Express | High performance, non-blocking I/O ideal for browser automation |
| API Documentation | OpenAPI/Swagger | Self-documenting API for easier integration |
| Image Analysis | Tesseract.js | OCR capabilities for text extraction from screenshots |
| Logging | Winston | Flexible logging with multiple transport options |
| Configuration | dotenv | Environment-based configuration management |
| Testing | Jest + Supertest | Comprehensive testing framework for Node.js applications |
| CI/CD | GitHub Actions | Automated testing and deployment pipeline |

## Project Structure

```
inspecta/
├── src/
│   ├── browser/                  # Browser automation logic
│   │   ├── index.js              # Main entry point for browser service
│   │   ├── screenshot.js         # Screenshot capture functionality
│   │   ├── console-logger.js     # Console log extraction
│   │   ├── network-monitor.js    # Network request monitoring
│   │   └── element-manipulator.js # DOM manipulation functions
│   │
│   ├── api/                      # API gateway implementation
│   │   ├── index.js              # Main entry point for API
│   │   ├── routes/               # API route definitions
│   │   │   ├── screenshot.js     # Screenshot endpoints
│   │   │   ├── console.js        # Console log endpoints
│   │   │   ├── network.js        # Network monitoring endpoints
│   │   │   └── elements.js       # Element manipulation endpoints
│   │   └── middleware/           # API middleware (auth, logging, etc.)
│   │
│   ├── analysis/                 # Analysis service implementation
│   │   ├── index.js              # Main entry point for analysis
│   │   ├── image-processor.js    # Screenshot analysis logic
│   │   ├── error-detector.js     # Error detection in logs and network
│   │   └── report-generator.js   # Report generation for Cursor agent
│   │
│   ├── logging/                  # Logging and monitoring service
│   │   ├── index.js              # Main entry point for logging
│   │   ├── logger.js             # Winston logger configuration
│   │   └── metrics.js            # Performance metrics collection
│   │
│   └── config/                   # Configuration files
│       ├── index.js              # Configuration loader
│       └── default.js            # Default configuration values
│
├── tests/                        # Test files
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   └── e2e/                      # End-to-end tests
│
├── docs/                         # Documentation
│   ├── api/                      # API documentation
│   └── examples/                 # Usage examples
│
├── scripts/                      # Utility scripts
│   ├── setup.js                  # Setup script
│   └── deploy.js                 # Deployment script
│
├── .env.example                  # Example environment variables
├── .gitignore                    # Git ignore file
├── package.json                  # Node.js dependencies
├── tsconfig.json                 # TypeScript configuration (if using TS)
└── README.md                     # Project readme
```

## API Endpoints

### Screenshot Service

#### `POST /api/screenshot`
Captures a screenshot of a webpage or specific element.

**Request Body:**
```json
{
  "url": "https://example.com",
  "selector": ".hero-section",  // Optional, defaults to full page
  "viewport": {                 // Optional
    "width": 1920,
    "height": 1080
  },
  "format": "png"               // Optional, defaults to png
}
```

**Response:**
```json
{
  "id": "screenshot-123",
  "url": "https://storage.example.com/screenshots/screenshot-123.png",
  "timestamp": "2023-07-15T14:30:00Z",
  "metadata": {
    "url": "https://example.com",
    "selector": ".hero-section",
    "viewport": { "width": 1920, "height": 1080 }
  }
}
```

### Console Log Service

#### `GET /api/console-logs`
Retrieves console logs from a webpage.

**Request Parameters:**
```json
{
  "url": "https://example.com",
  "logLevel": "error",  // Optional, filters by log level
  "limit": 50          // Optional, limits the number of logs returned
}
```

**Response:**
```json
{
  "logs": [
    {
      "level": "error",
      "message": "Uncaught TypeError: Cannot read property 'map' of undefined",
      "source": "https://example.com/app.js",
      "lineNumber": 42,
      "timestamp": "2023-07-15T14:30:05Z",
      "stackTrace": "..."
    }
  ],
  "metadata": {
    "url": "https://example.com",
    "timestamp": "2023-07-15T14:30:00Z"
  }
}
```

### Network Monitoring Service

#### `GET /api/network-requests`
Retrieves network requests made by a webpage.

**Request Parameters:**
```json
{
  "url": "https://example.com",
  "status": "error",    // Optional, filters by status (error, success)
  "resourceType": "xhr" // Optional, filters by resource type
}
```

**Response:**
```json
{
  "requests": [
    {
      "url": "https://api.example.com/data",
      "method": "GET",
      "status": 404,
      "statusText": "Not Found",
      "resourceType": "xhr",
      "timing": {
        "startTime": "2023-07-15T14:30:02Z",
        "endTime": "2023-07-15T14:30:03Z"
      },
      "request": {
        "headers": {},
        "body": null
      },
      "response": {
        "headers": {},
        "body": "..."
      }
    }
  ],
  "metadata": {
    "url": "https://example.com",
    "timestamp": "2023-07-15T14:30:00Z"
  }
}
```

### Element Manipulation Service

#### `POST /api/elements/modify`
Modifies a DOM element on a webpage.

**Request Body:**
```json
{
  "url": "https://example.com",
  "selector": "#title",
  "action": "setText",
  "value": "Hello World"
}
```

**Response:**
```json
{
  "success": true,
  "element": {
    "selector": "#title",
    "tagName": "h1",
    "attributes": {
      "id": "title",
      "class": "heading"
    },
    "text": "Hello World"
  },
  "metadata": {
    "url": "https://example.com",
    "timestamp": "2023-07-15T14:30:10Z"
  }
}
```

## Database Schema

For storing historical data and analysis results:

### Screenshots Collection
```json
{
  "_id": "ObjectId",
  "url": "https://example.com",
  "selector": ".hero-section",
  "imagePath": "/storage/screenshots/screenshot-123.png",
  "timestamp": "ISODate",
  "viewport": {
    "width": 1920,
    "height": 1080
  },
  "metadata": {
    "userAgent": "...",
    "sessionId": "..."
  }
}
```

### Console Logs Collection
```json
{
  "_id": "ObjectId",
  "url": "https://example.com",
  "timestamp": "ISODate",
  "logs": [
    {
      "level": "error",
      "message": "...",
      "source": "...",
      "lineNumber": 42,
      "timestamp": "ISODate",
      "stackTrace": "..."
    }
  ],
  "metadata": {
    "userAgent": "...",
    "sessionId": "..."
  }
}
```

### Network Requests Collection
```json
{
  "_id": "ObjectId",
  "url": "https://example.com",
  "timestamp": "ISODate",
  "requests": [
    {
      "url": "...",
      "method": "GET",
      "status": 404,
      "resourceType": "xhr",
      "timing": { ... },
      "request": { ... },
      "response": { ... }
    }
  ],
  "metadata": {
    "userAgent": "...",
    "sessionId": "..."
  }
}
```

## Implementation Plan

### Phase 1: Core Functionality
- Browser automation service with screenshot capabilities
- Basic API gateway with screenshot endpoints
- Simple console log extraction

### Phase 2: Enhanced Analysis
- Network request monitoring
- Error detection and analysis
- DOM element manipulation

### Phase 3: Advanced Features
- Image analysis for UI verification
- Integration with CI/CD pipelines
- Performance optimization

## Security Considerations

1. **Input Validation**
   - All API inputs must be validated to prevent injection attacks
   - URL validation to prevent accessing internal resources

2. **Browser Sandboxing**
   - Puppeteer instances must run in sandboxed environments
   - Resource limits to prevent DoS attacks

3. **Authentication and Authorization**
   - API key authentication for all endpoints
   - Role-based access control for different operations

4. **Data Protection**
   - Sensitive data in screenshots must be identified and redacted
   - Temporary files must be securely deleted after use

## Performance Considerations

1. **Browser Pool Management**
   - Implement a pool of browser instances for faster response times
   - Reuse browser contexts when possible to reduce overhead

2. **Caching Strategy**
   - Cache frequently accessed pages and resources
   - Implement cache invalidation for dynamic content

3. **Parallel Processing**
   - Process multiple analysis tasks in parallel
   - Use worker threads for CPU-intensive tasks

## Monitoring and Logging

1. **System Metrics**
   - CPU and memory usage
   - Request latency and throughput
   - Error rates and types

2. **Business Metrics**
   - Number of screenshots taken
   - Types of errors detected
   - Resolution success rate

3. **Alerting**
   - Critical error notifications
   - Performance degradation alerts
   - Resource exhaustion warnings 