// import { Tool } from '@modelcontextprotocol/sdk';
// Using our custom type declarations instead
import { InspectorAIMCPServer } from '../Server';
import { NetworkMonitorTool } from './NetworkMonitorTool';
import { ConsoleLogTool } from './ConsoleLogTool';
import { DomManipulatorTool } from './DomManipulatorTool';
import { ImageAnalysisTool } from './ImageAnalysisTool';

/**
 * Get all available MCP tools
 * @returns Array of MCP tools
 */
export function getAllTools(): Tool[] {
  const tools: Tool[] = [
    new NetworkMonitorTool().toMCPTool(),
    new ConsoleLogTool().toMCPTool(),
    new DomManipulatorTool().toMCPTool(),
    new ImageAnalysisTool().toMCPTool(),
  ];
  
  return tools;
}

/**
 * Register all tools with an MCP server
 * @param server The MCP server to register tools with
 */
export function registerAllTools(server: InspectorAIMCPServer): void {
  const tools = getAllTools();
  server.registerTools(tools);
  
  console.log(`Registered ${tools.length} tools with MCP server:`);
  tools.forEach(tool => {
    console.log(`  - ${tool.name}: ${tool.description}`);
  });
}

// Export all tool classes
export { NetworkMonitorTool } from './NetworkMonitorTool';
export { ConsoleLogTool } from './ConsoleLogTool';
export { DomManipulatorTool } from './DomManipulatorTool'; 