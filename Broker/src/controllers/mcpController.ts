import type { Response, Request } from "express";
import { mcp } from "../server.js";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { randomUUID } from "node:crypto";
import { InMemoryEventStore } from "@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore";

// Map to store transports by session id
const transports: { [sessionId: string]: NodeStreamableHTTPServerTransport } =
  {};

// Controller to handle Post request for StreamableHTTP MCP
export const mcpPostHandler = async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (sessionId) {
    console.log(`Received MCP request for session: ${sessionId}`);
    console.log(`[POST] Command received for session: ${sessionId}`);
  } else {
    console.log("Request body:", req.body);
  }

  try {
    let transport: NodeStreamableHTTPServerTransport;
    if (sessionId && transports[sessionId]) {
      // Reuse existing transport
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // New initialization request
      const eventStore = new InMemoryEventStore();
      transport = new NodeStreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        eventStore,
        onsessioninitialized: (sessionId) => {
          // Store the transport by session ID when session is initialized
          // This avoids race conditions where requests might come in before the session is stored
          console.log(`Session initialized with ID: ${sessionId}`);
          transports[sessionId] = transport;
        },
      });

      // Set up onclose handler to clean up transport when closed
      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && transports[sid]) {
          console.log(
            `Transport closed for session ${sid}, removing from transports map`,
          );
          delete transports[sid];
        }
      };

      await mcp.connect(transport);

      await transport.handleRequest(req, res, req.body);
      return; // Already handled
    } else if (sessionId) {
      // 404 Session not found
      res.status(404).json({
        jsonrpc: "2.0",
        error: { code: -32_001, message: "Session not found" },
        id: null,
      });
      return;
    } else {
      res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32_000, message: "Bad Request: Session ID required" },
        id: null,
      });
      return;
    }

    // Handle the request with existing transport - no need to reconnect
    // The existing transport is already connected to the server
    await transport.handleRequest(req, res, req.body);
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

export const mcpGetHandler = async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (!sessionId) {
    res.status(400).send("Missing session ID");
    return;
  }

  const transport = transports[sessionId];
  if (!transport) {
    res.status(404).send("Session not found");
    return;
  }

  req.on("close", () => {
    console.log(`HTTP Connection closed for session ${sessionId}`);
    // Note: In MCP, a closed SSE stream doesn't ALWAYS mean the session is dead
    // (due to resumability). But if you want to force cleanup on Postman disconnect:
    // transport.close();
  });

  // Check for Last-Event-ID header for resumability
  const lastEventId = req.headers["last-event-id"] as string | undefined;

  if (lastEventId) {
    console.log(`Client reconnecting with Last-Event-ID: ${lastEventId}`);
    console.log(`[GET] Resuming stream for ${sessionId} from ${lastEventId}`);
  } else {
    console.log(`Establishing new SSE stream for session ${sessionId}`);
    console.log(`[GET] Opening new stream for ${sessionId}`);
  }

  await transport.handleRequest(req, res);
};

export const mcpDeleteHandler = async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId) {
    res.status(400).send("Missing session ID");
    return;
  }
  if (!transports[sessionId]) {
    res.status(404).send("Session not found");
    return;
  }

  console.log(`Received session termination request for session ${sessionId}`);

  try {
    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error("Error handling session termination:", error);
    if (!res.headersSent) {
      res.status(500).send("Error processing session termination");
    }
  }
};

process.on("SIGINT", async () => {
  console.log("Shutting down server...");

  // Close all active transports to properly clean up resources
  for (const sessionId in transports) {
    try {
      console.log(`Closing transport for session ${sessionId}`);
      await transports[sessionId]!.close();
      delete transports[sessionId];
    } catch (error) {
      console.error(`Error closing transport for session ${sessionId}:`, error);
    }
  }
  console.log("Waiting briefly for buffers to clear...");
  // Give the OS 500ms to flush the TCP buffers to the clients
  setTimeout(() => {
    console.log("Server shutdown complete");
    process.exit(0);
  }, 500);
});
