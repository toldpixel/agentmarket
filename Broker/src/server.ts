import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/express";
import express from "express";
import { allToolDefinitions, registerAllTools } from "./tools/index.js";
import { router } from "./routes/index.js";
import dotenv from "dotenv";
import cors from "cors";
import {
  createRequestLogger,
  oauthMetadata,
  mcpServerUrl,
} from "./auth/auth.js";
import {
  mcpAuthMetadataRouter,
  getOAuthProtectedResourceMetadataUrl,
} from "@modelcontextprotocol/sdk/server/auth/router.js";
import { ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types";
import { getToolsForScopes } from "./utils/scopes.js";
import { zodToJsonSchema } from "zod-to-json-schema";

dotenv.config();

export const mcp = new McpServer({
  name: "job_exchange",
  version: "1.0.0",
});

registerAllTools(mcp);

// Custom setRequestHandler for listing Tools. Filtering for scopes,
// agents only see tools available in their scope
mcp.server.setRequestHandler(
  ListToolsRequestSchema,
  async (request, context) => {
    const scopes = (context as any).authInfo?.scopes ?? [];
    const allowedToolNames = getToolsForScopes(scopes);

    return {
      tools: allToolDefinitions
        .filter((tool) => allowedToolNames.includes(tool.name))
        .map((tool) => ({
          name: tool.name,
          description: tool.config.description,
          inputSchema: zodToJsonSchema(tool.config.inputSchema),
        })),
    };
  },
);

const app = createMcpExpressApp({
  allowedHosts: ["broker.luchsnode.com"],
});

const MCP_PORT = process.env.MCP_PORT
  ? Number.parseInt(process.env.MCP_PORT, 10)
  : 3000;
const HOST = "0.0.0.0";

app.use(express.json());
app.use(
  cors({
    origin: "*",
    exposedHeaders: ["Mcp-Session-Id"],
  }),
);
app.use(createRequestLogger());
app.use(
  mcpAuthMetadataRouter({
    oauthMetadata,
    resourceServerUrl: mcpServerUrl,
    scopesSupported: [
      "discovery:market",
      "posting:side",
      "worker:side",
      "mcp:tools",
    ],
    resourceName: "Job Exchange MCP Broker",
  }),
);

app.use(router);

(async () => {
  try {
    app.listen(MCP_PORT, HOST, function () {
      console.error(`starting app on port: ${MCP_PORT}`);
      console.log(`🚀 MCP Server running on ${mcpServerUrl.origin}`);
      console.log(`📡 MCP endpoint available at ${mcpServerUrl.origin}`);
      console.log(
        `🔐 OAuth metadata available at ${getOAuthProtectedResourceMetadataUrl(mcpServerUrl)}`,
      );
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
