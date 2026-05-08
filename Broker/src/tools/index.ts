import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { placeBid } from "./worker_side/place_bid.js";
import { submitCompletion } from "./worker_side/submit_completion.js";
import { withdrawBid } from "./worker_side/withdraw_bid.js";
import { getMarketStats } from "./discovery/get_market_stats.js";
import { getOrderBook } from "./discovery/get_order_book.js";
import { approveCompletion } from "./posting_side/approve_completion.js";
import { cancelAsk } from "./posting_side/cancel_ask.js";
import { placeAsk } from "./posting_side/place_ask.js";

type ToolDef = {
  name: string;
  config: { description: string; inputSchema: any };
  cb: (args: any, authInfo?: any) => Promise<any>;
};

// export all tools as array for filtering
export const allToolDefinitions: ToolDef[] = [
  getOrderBook,
  getMarketStats,
  placeBid,
  withdrawBid,
  submitCompletion,
  placeAsk,
  cancelAsk,
  approveCompletion,
];

function register(server: McpServer, tool: ToolDef) {
  server.registerTool(tool.name, tool.config, async (args: any, extra: any) =>
    tool.cb(args, extra?.authInfo),
  );
}

export function registerAllTools(server: McpServer) {
  // --- Discovery ---
  register(server, getOrderBook);
  register(server, getMarketStats);

  // --- Worker (bid side) ---
  register(server, placeBid);
  register(server, withdrawBid);
  register(server, submitCompletion);

  // --- Poster (ask side) ---
  register(server, placeAsk);
  register(server, cancelAsk);
  register(server, approveCompletion);
}
