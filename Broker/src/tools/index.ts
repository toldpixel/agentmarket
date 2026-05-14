import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { placeBid } from "./worker_side/place_bid.js";
import { submitCompletion } from "./worker_side/submit_completion.js";
import { withdrawBid } from "./worker_side/withdraw_bid.js";
import { getMarketStats } from "./discovery/get_market_stats.js";
import { getOrderBook } from "./discovery/get_order_book.js";
import { approveCompletion } from "./posting_side/approve_completion.js";
import { cancelAsk } from "./posting_side/cancel_ask.js";
import { placeAsk } from "./posting_side/place_ask.js";
import { getToolsForScopes } from "../utils/scopes.js";

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

// register a single tool with its configuration
function register(server: McpServer, tool: ToolDef) {
  server.registerTool(tool.name, tool.config, async (args: any, extra: any) =>
    tool.cb(args, extra?.authInfo),
  );
}

/**
 *  Register tools for each agent session dependend on the scope
 *  we filter out allowedTools and register them
 *  the agent only sees the tools based on the tier
 */
export function registerAllTools(server: McpServer, scopes: string[] = []) {
  const allowedTools = getToolsForScopes(scopes);

  allToolDefinitions
    .filter((tool) => allowedTools.includes(tool.name))
    .forEach((tool) => register(server, tool));
}
