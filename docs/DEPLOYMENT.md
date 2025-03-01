# InspectorAI Deployment Guide

This document outlines the deployment process for InspectorAI, covering both manual deployments and automated CI/CD deployments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Manual Deployment](#manual-deployment)
- [CI/CD Deployment](#cicd-deployment)
- [Environment Variables](#environment-variables)
- [NPM Package Deployment](#npm-package-deployment)
- [Docker Deployment](#docker-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying InspectorAI, ensure you have the following:

- Node.js 16.x or later
- npm 8.x or later
- Access to the deployment server or platform
- Required environment variables and secrets

For browser automation to work properly in production:

- A server with at least 2GB RAM
- Chrome or Chromium browser installed
- For headless operation: a Linux environment with necessary dependencies

## Manual Deployment

### Server Deployment

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/inspecta.git
   cd inspecta
   ```

2. Install dependencies:
   ```bash
   npm ci
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Configure environment variables (see [Environment Variables](#environment-variables) section).

5. Start the server:
   ```bash
   npm start
   ```

### PM2 Deployment (Recommended for Production)

For long-running services, we recommend using PM2:

1. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```

2. Create a PM2 ecosystem file (`ecosystem.config.js`):
   ```javascript
   module.exports = {
     apps: [{
       name: 'inspecta',
       script: 'dist/index.js',
       instances: 1,
       autorestart: true,
       watch: false,
       max_memory_restart: '1G',
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       }
     }]
   };
   ```

3. Start the service with PM2:
   ```bash
   pm2 start ecosystem.config.js
   ```

4. To ensure the service starts on system reboot:
   ```bash
   pm2 startup
   pm2 save
   ```

## CI/CD Deployment

InspectorAI uses GitHub Actions for continuous integration and deployment.

### Automated Workflows

Three main workflows are defined:

1. **CI Workflow** (`.github/workflows/ci.yml`):
   - Runs on every push to main and pull requests
   - Executes linting and unit tests
   - Builds the project and uploads artifacts

2. **E2E Test Workflow** (`.github/workflows/e2e-tests.yml`):
   - Runs end-to-end tests in a browser environment
   - Executes daily and on main branch pushes
   - Can be manually triggered

3. **Deployment Workflow** (`.github/workflows/deploy.yml`):
   - Publishes to npm when tags starting with 'v' are pushed
   - Deploys to staging or production environments
   - Can be manually triggered with environment selection

### Setting Up GitHub Actions

To use these workflows, you need to configure the following GitHub secrets:

- `NPM_TOKEN`: Your npm authentication token for publishing
- `STAGING_DEPLOY_KEY`: SSH deployment key for staging server
- `STAGING_HOST`: Hostname for staging server
- `PRODUCTION_DEPLOY_KEY`: SSH deployment key for production server
- `PRODUCTION_HOST`: Hostname for production server

### Manual Deployments via GitHub

You can manually trigger deployments:

1. Go to "Actions" tab in your GitHub repository
2. Select "Deploy" workflow
3. Click "Run workflow"
4. Choose the target environment (staging or production)
5. Trigger the workflow

## Environment Variables

Configure the following environment variables for deployment:

### Server Configuration
- `PORT`: Server port (default: 3000)
- `HOST`: Server host (default: 'localhost')
- `NODE_ENV`: Environment ('development', 'test', or 'production')

### Browser Configuration
- `BROWSER_HEADLESS`: Whether to run browser in headless mode ('true' or 'false')
- `VIEWPORT_WIDTH`: Default viewport width (default: 1280)
- `VIEWPORT_HEIGHT`: Default viewport height (default: 800)
- `BROWSER_TIMEOUT`: Browser operation timeout in ms (default: 30000)
- `MAX_BROWSER_INSTANCES`: Maximum concurrent browser instances (default: 5)

### Caching Configuration
- `CACHE_ENABLED`: Enable/disable all caching features ('true' or 'false')
- `MAX_PAGE_CACHE_SIZE`: Maximum number of cached pages (default: 20)
- `PAGE_CACHE_TTL`: Time-to-live for cached pages in ms (default: 300000)
- `RESPONSE_CACHE_ENABLED`: Enable/disable API response caching ('true' or 'false')
- `RESPONSE_CACHE_SIZE`: Maximum number of cached API responses (default: 100)
- `RESPONSE_CACHE_TTL`: Default TTL for cached responses in ms (default: 600000)

### MCP Server Configuration
- `MCP_SERVER_ENABLED`: Enable/disable MCP server ('true' or 'false')
- `MCP_SERVER_PORT`: MCP server port (default: 3001)
- `MCP_SERVER_BASE_PATH`: Base path for MCP server (default: '/mcp')
- `MCP_SERVER_ALLOW_ORIGIN`: CORS allow-origin setting (default: '*')

## NPM Package Deployment

InspectorAI can also be deployed as an npm package:

1. Update version in `package.json`
2. Build the package:
   ```bash
   npm run build
   ```
3. Publish to npm:
   ```bash
   npm publish
   ```

Alternatively, push a tag starting with 'v' to automatically publish via GitHub Actions:
```bash
git tag v1.0.0
git push origin v1.0.0
```

## Docker Deployment

For containerized deployment, you can use Docker:

1. Build the Docker image:
   ```bash
   docker build -t inspecta:latest .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 -p 3001:3001 --name inspecta inspecta:latest
   ```

## Troubleshooting

### Common Issues

#### Browser Automation Fails
- Ensure Chrome/Chromium is installed on the server
- Check if required dependencies are installed for headless mode
- Verify there's enough memory available
- Check file permissions for browser executable

#### Performance Issues
- Scale up the server resources if needed
- Adjust cache settings to optimize memory usage
- Configure browser instance limits appropriately

#### Deployment Failures
- Check GitHub Actions logs for detailed error information
- Verify all required secrets are configured correctly
- Ensure the deployment server is accessible
- Check network connectivity and firewall settings 