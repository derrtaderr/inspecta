// import { Tool } from '@modelcontextprotocol/sdk';
// Using our custom type declarations instead

/**
 * Registry for MCP tools that maintains a collection of all registered tools
 * and provides methods for retrieving them.
 */
export class ToolRegistry {
  private tools: Map<string, Tool>;

  constructor() {
    this.tools = new Map();
  }

  /**
   * Register a tool with the registry
   * @param tool The tool to register
   * @throws Error if a tool with the same name is already registered
   */
  public registerTool(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool with name "${tool.name}" is already registered`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Get a tool by name
   * @param name The name of the tool to retrieve
   * @returns The tool, or undefined if no tool with that name exists
   */
  public getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools
   * @returns Array of all registered tools
   */
  public getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get all registered tool names
   * @returns Array of all registered tool names
   */
  public getAllToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Check if a tool with the given name is registered
   * @param name The name to check
   * @returns true if a tool with the given name is registered, false otherwise
   */
  public hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get the number of registered tools
   * @returns The number of registered tools
   */
  public getToolCount(): number {
    return this.tools.size;
  }
} 