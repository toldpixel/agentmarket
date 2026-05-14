import type { Response, Request } from "express";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { registerAllTools } from "../tools/index.js";
import { setupToolsListHandler } from "../utils/scopes.js";

//! Only for development not for production
import { InMemoryEventStore } from "@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore";

// Map to store transports by session id
const transports = new Map<string, NodeStreamableHTTPServerTransport>();

// Controller to handle Post request for StreamableHTTP MCP
export const mcpPostHandler = async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (sessionId) {
    console.log(`Received MCP request for session: ${sessionId}`);
  } else {
    console.log("Request body:", req.body);
  }

  try {
    // Reuse existing transport
    if (sessionId && transports.has(sessionId)) {
      await transports.get(sessionId)!.handleRequest(req, res, req.body);
      return;
    }

    if (!sessionId && isInitializeRequest(req.body)) {
      // Create a New server instance (Session) per connection
      const mcp = new McpServer({
        name: "job_exchange",
        version: "1.0.0",
      });

      registerAllTools(mcp);
      //setupToolsListHandler(mcp); // scope filtering for list/tools

      const transport = new NodeStreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        eventStore: new InMemoryEventStore(),
        onsessioninitialized: (sid) => {
          console.log(`Session initialized: ${sid}`);
          transports.set(sid, transport);
        },
      });

      // Set up onclose handler to clean up transport when closed
      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid) {
          console.log(
            `Transport closed for session ${sid}, removing from transports map`,
          );
          transports.delete(sid);
        }
      };

      await mcp.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    }

    // 404 Session not found
    if (sessionId) {
      res.status(404).json({
        jsonrpc: "2.0",
        error: { code: -32_001, message: "Session not found" },
        id: null,
      });
      return;
    }

    // no session ID and not an initialize request
    res.status(400).json({
      jsonrpc: "2.0",
      error: { code: -32_000, message: "Bad Request: Session ID required" },
      id: null,
    });
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32_603,
          message: `Internal server error: ${error}`,
        },
        id: null,
      });
    }
  }
};

// ─── GET (SSE stream) ────────────────────────────────────────────────────────

export const mcpGetHandler = async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (!sessionId) {
    res.status(400).send("Missing session ID");
    return;
  }

  const transport = transports.get(sessionId);
  if (!transport) {
    res.status(404).send("Session not found");
    return;
  }

  // Check for Last-Event-ID header for resumability
  const lastEventId = req.headers["last-event-id"] as string | undefined;

  if (lastEventId) {
    console.log(`Client reconnecting with Last-Event-ID: ${lastEventId}`);
    console.log(`[GET] Resuming stream for ${sessionId} from ${lastEventId}`);
  } else {
    console.log(`Establishing new SSE stream for session ${sessionId}`);
    console.log(`[GET] Opening new stream for ${sessionId}`);
  }

  req.on("close", () => {
    console.log(`HTTP Connection closed for session ${sessionId}`);
    // Note: In MCP, a closed SSE stream doesn't ALWAYS mean the session is dead
    // (due to resumability). But if you want to force cleanup on Postman disconnect:
    // transport.close();
  });

  await transport.handleRequest(req, res);
};

// ─── DELETE ──────────────────────────────────────────────────────────────────

export const mcpDeleteHandler = async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId) {
    res.status(400).send("Missing session ID");
    return;
  }

  const transport = transports.get(sessionId);
  if (!transport) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  console.log(`[DELETE] terminating session ${sessionId}`);

  try {
    await transport.handleRequest(req, res);
    transports.delete(sessionId);
  } catch (error) {
    console.error("[DELETE] error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Error terminating session" });
    }
  }
};

// ─── Cleanup on shutdown ─────────────────────────────────────────────────────
process.on("SIGINT", async () => {
  console.log("[shutdown] closing all sessions...");
  for (const [sessionId, transport] of transports) {
    try {
      await transport.close();
      transports.delete(sessionId);
    } catch (error) {
      console.error(`[shutdown] error closing session ${sessionId}:`, error);
    }
  }
  setTimeout(() => process.exit(0), 500);
});
