#!/usr/bin/env node

import config from './config/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './api/routes';
import { InspectorAIMCPServer } from './mcp';
import { registerAllTools } from './mcp/tools';
import { setupSecurity } from './middleware/security';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

/**
 * Start the InspectorAI server
 */
export function startServer(options: {
  port?: number;
  mcpEnabled?: boolean;
  mcpPort?: number;
  disableAuth?: boolean;
}) {
  const app = express();
  const port = options.port || config.server.port;
  
  // Apply middleware
  app.use(express.json());
  app.use(morgan('dev'));
  
  // Set up security middleware
  console.log('Initializing enterprise security features...');
  setupSecurity(app, {
    authEnabled: !options.disableAuth
  });
  
  // API routes
  app.use('/api', routes);
  
  // Default route
  app.get('/', (req, res) => {
    res.json({
      name: 'InspectorAI',
      version: '1.0.0',
      status: 'operational',
      features: [
        'Screenshot capture',
        'Console log analysis',
        'Network monitoring',
        'DOM manipulation',
        'Image analysis',
        'Enterprise security'
      ]
    });
  });
  
  // Start the main server
  const server = app.listen(port, () => {
    console.log(`
    ╔════════════════════════════════════════════════╗
    ║                                                ║
    ║   InspectorAI Server Running                   ║
    ║   Version: 1.0.0                               ║
    ║   Port: ${port.toString().padEnd(38)}║
    ║   Security: ${options.disableAuth ? 'Disabled' : 'Enabled'.padEnd(32)}║
    ║                                                ║
    ╚════════════════════════════════════════════════╝
    `);
  });
  
  // Start MCP server if enabled
  if (options.mcpEnabled) {
    const mcpPort = options.mcpPort || config.features.mcpServer.port;
    console.log('Starting MCP server...');
    
    // Override config
    process.env.MCP_SERVER_ENABLED = 'true';
    if (mcpPort) {
      process.env.MCP_SERVER_PORT = mcpPort.toString();
    }
    
    // Create MCP server
    const mcpServer = new InspectorAIMCPServer(mcpPort);
    
    registerAllTools(mcpServer);
    
    mcpServer.start().then(() => {
      console.log(`
      ╔════════════════════════════════════════════════╗
      ║                                                ║
      ║   InspectorAI MCP Server Running               ║
      ║   Port: ${mcpPort.toString().padEnd(38)}║
      ║                                                ║
      ║   To use in Cursor:                            ║
      ║   1. Go to Cursor Settings > Features > MCP    ║
      ║   2. Click "+ Add New MCP Server"              ║
      ║   3. Select "SSE" as Type                      ║
      ║   4. Name it "InspectorAI"                     ║
      ║   5. Use URL: http://localhost:${mcpPort}/sse  ${" ".repeat(Math.max(0, 17 - mcpPort.toString().length))}║
      ║                                                ║
      ╚════════════════════════════════════════════════╝
      `);
    });
  }
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close();
  });
  
  return server;
}

// If this file is run directly
if (require.main === module) {
  // Parse command line arguments with yargs
  const argv = yargs(hideBin(process.argv))
    .command('serve', 'Start the InspectorAI server', {
      port: {
        alias: 'p',
        description: 'Port to run the server on',
        type: 'number'
      },
      mcp: {
        description: 'Enable MCP server',
        type: 'boolean',
        default: false
      },
      'mcp-port': {
        description: 'Port for MCP server',
        type: 'number'
      },
      'disable-auth': {
        description: 'Disable authentication',
        type: 'boolean',
        default: false
      }
    })
    .demandCommand(1, 'You need to specify a command')
    .help()
    .alias('help', 'h')
    .parseSync();
  
  // Start the server based on command
  if (argv._[0] === 'serve') {
    startServer({
      port: argv.port as number | undefined,
      mcpEnabled: Boolean(argv.mcp),
      mcpPort: argv['mcp-port'] as number | undefined,
      disableAuth: Boolean(argv['disable-auth']),
    });
  }
}

export default { startServer }; 