#!/usr/bin/env node

import { InspectorAIMCPServer } from './Server';
import { registerAllTools } from './tools';
import { ConfigLoader } from './Config';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

/**
 * CLI argument interface
 */
interface CliArgs {
  port: number;
  config?: string;
  verbose: boolean;
  [x: string]: unknown;
}

/**
 * Parse command line arguments
 */
const argv = yargs(hideBin(process.argv))
  .option('port', {
    alias: 'p',
    description: 'Port to run the MCP server on',
    type: 'number',
    default: 3001
  })
  .option('config', {
    alias: 'c',
    description: 'Path to configuration file',
    type: 'string'
  })
  .option('verbose', {
    alias: 'v',
    description: 'Enable verbose logging',
    type: 'boolean',
    default: false
  })
  .help()
  .alias('help', 'h')
  .version()
  .alias('version', 'V')
  .parseSync() as CliArgs;

/**
 * Main function to start the MCP server
 */
async function main() {
  console.log('Starting InspectorAI MCP Server...');
  
  // Create server instance
  const server = new InspectorAIMCPServer(
    argv.port,
    argv.config
  );
  
  // Register all tools
  registerAllTools(server);
  
  // Start server
  try {
    await server.start();
    console.log(`InspectorAI MCP Server is running on port ${argv.port}`);
    console.log('Press Ctrl+C to stop the server');
    
    // Log available tools if verbose mode is enabled
    if (argv.verbose) {
      const tools = server.getTools();
      console.log(`\nAvailable tools (${tools.length}):`);
      tools.forEach(tool => {
        console.log(`- ${tool.name}: ${tool.description}`);
      });
    }
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: shutting down MCP server');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nSIGTERM signal received: shutting down MCP server');
  process.exit(0);
});

// Start the server
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

/**
 * Main function to start an MCP server in stdio mode
 */
async function startStdioMCP() {
  // Parse command line arguments
  const argv = yargs(hideBin(process.argv))
    .option('port', {
      alias: 'p',
      description: 'Port to run the HTTP server on (if needed)',
      type: 'number',
      default: 3001,
    })
    .option('http', {
      description: 'Run in HTTP mode instead of stdio',
      type: 'boolean',
      default: false,
    })
    .help()
    .alias('help', 'h')
    .parseSync();

  // Create MCP server
  const server = new InspectorAIMCPServer(argv.port);
  
  // Register all tools
  registerAllTools(server);
  
  if (argv.http) {
    // Start HTTP server
    await server.start();
    console.log(`MCP Server running in HTTP mode on port ${argv.port}`);
    console.log(`Add to Cursor using SSE transport: http://localhost:${argv.port}/sse`);
  } else {
    // stdio mode - implement basic protocol
    console.log(`MCP Server running in stdio mode`);
    
    // Handle stdin
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', async (data) => {
      try {
        const input = data.toString().trim();
        const request = JSON.parse(input);
        
        // Process tool request
        if (request && request.name) {
          const response = await server.executeToolRequest(request);
          
          // Write response to stdout
          process.stdout.write(JSON.stringify(response) + '\n');
        } else {
          process.stdout.write(JSON.stringify({
            error: 'Invalid request format'
          }) + '\n');
        }
      } catch (error) {
        process.stdout.write(JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error'
        }) + '\n');
      }
    });
    
    // Handle process exit
    process.on('SIGTERM', () => {
      console.log('Shutting down MCP stdio server...');
      process.exit(0);
    });
    
    process.on('SIGINT', () => {
      console.log('Shutting down MCP stdio server...');
      process.exit(0);
    });
    
    // Keep the process alive
    setInterval(() => {}, 1000);
  }
}

// Run the main function if this file is run directly
if (require.main === module) {
  startStdioMCP().catch((error) => {
    console.error('Error starting MCP server:', error);
    process.exit(1);
  });
}

export default startStdioMCP; 