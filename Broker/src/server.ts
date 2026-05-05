import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/express";
import express from "express";
import { registerAllTools } from "./tools/index.js";
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

dotenv.config();

const app = createMcpExpressApp({
  allowedHosts: ["broker.luchsnode.com"],
});
const MCP_PORT = process.env.MCP_PORT
  ? Number.parseInt(process.env.MCP_PORT, 10)
  : 3000;
const HOST = "0.0.0.0";

export const server = new McpServer({
  name: "job_exchange",
  version: "1.0.0",
});

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
    scopesSupported: ["mcp:tools"],
    resourceName: "MCP Demo Server",
  }),
);
app.use(router);

registerAllTools(server);

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
