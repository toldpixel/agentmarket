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

      return {
        tools: allToolDefinitions
          .filter((tool) => allowedToolNames.includes(tool.name))
          .map((tool) => {
            let inputSchema: any;

            try {
              const full = zodToJsonSchema(tool.config.inputSchema, {
                target: "jsonSchema7",
                $refStrategy: "none", // ← inline all refs, no $ref
              }) as any;

              const { $schema, definitions, $ref, ...rest } = full;

              inputSchema = {
                type: "object",
                properties: rest.properties ?? {},
                ...(rest.required ? { required: rest.required } : {}),
              };
            } catch (err) {
              console.error(
                `[tools] failed to convert schema for ${tool.name}:`,
                err,
              );
              inputSchema = { type: "object", properties: {} };
            }

            console.log(
              `[tools] ${tool.name}:`,
              JSON.stringify(inputSchema, null, 2),
            );

            return {
              name: tool.name,
              description: tool.config.description,
              inputSchema,
            };
          }),
      };
    },
  );
}
