import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { SCOPE_TOOLS } from "../types/tiers.js";
import { ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types";
import { allToolDefinitions } from "../tools/index.js";
import { zodToJsonSchema } from "zod-to-json-schema";

export function getToolsForScopes(scopes: string[]): string[] {
  return Object.entries(SCOPE_TOOLS)
    .filter(([scope]) => scopes.includes(scope))
    .flatMap(([, tools]) => tools);
}

// Function to check if given scope is available for used tool in SCOPE_TOOLS
// otherwise the tool returns Error true
export function checkToolScope(
  toolName: string,
  scopes: string[],
): string | null {
  console.log("Check scopes: ", scopes);
  const requiredScope = Object.entries(SCOPE_TOOLS).find(([, tools]) =>
    tools.includes(toolName),
  )?.[0];

  if (!requiredScope) return `Tool "${toolName}" has no scope defined`;
  if (!scopes.includes(requiredScope)) {
    return `insufficient_scope: "${requiredScope}" required to use "${toolName}"`;
  }
  return null;
}

// List tools only shows tools in scope by connecting to mcp
// Custom setRequestHandler for listing Tools. Filtering for scopes,
// agents only see tools available in their scope
export function setupToolsListHandler(server: McpServer) {
  server.server.setRequestHandler(
    ListToolsRequestSchema,
    async (request, context) => {
      const scopes = (context as any).authInfo?.scopes ?? [];
      const allowedToolNames = getToolsForScopes(scopes);

      const tools = allToolDefinitions
        .filter((tool) => allowedToolNames.includes(tool.name))
        .map((tool) => {
          const fullSchema = zodToJsonSchema(tool.config.inputSchema) as any;
          const { $schema, $ref, definitions, additionalProperties, ...rest } =
            fullSchema;

          const inputSchema = {
            type: "object" as const,
            properties: rest.properties ?? {},
            ...(rest.required ? { required: rest.required } : {}),
          };

          console.log(
            `[tools] ${tool.name} inputSchema:`,
            JSON.stringify(inputSchema),
          );

          return {
            name: tool.name,
            description: tool.config.description,
            inputSchema,
          };
        });

      return { tools };
    },
  );
}
