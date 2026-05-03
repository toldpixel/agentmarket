import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { placeBid } from "./worker_side/place_bid.js";
import { submitCompletion } from "./worker_side/submit_completion.js";
import { withdrawBid } from "./worker_side/withdraw_bid.js";
import { getMarketStats } from "./discovery/get_market_stats.js";
import { getOrderBook } from "./discovery/get_order_book.js";
import { approveCompletion } from "./posting_side/approve_completion.js";
import { cancelAsk } from "./posting_side/cancel_ask.js";
import { placeAsk } from "./posting_side/place_ask.js";

export function registerAllTools(server: McpServer) {
  // --- Discovery ---
  server.registerTool(getOrderBook.name, getOrderBook.config, getOrderBook.cb);

  server.registerTool(
    getMarketStats.name,
    getMarketStats.config,
    getMarketStats.cb,
  );

  // --- Worker (bid side) ---
  server.registerTool(placeBid.name, placeBid.config, placeBid.cb);

  server.registerTool(withdrawBid.name, withdrawBid.config, withdrawBid.cb);

  server.registerTool(
    submitCompletion.name,
    submitCompletion.config,
    submitCompletion.cb,
  );

  // --- Poster (ask side) ---
  server.registerTool(placeAsk.name, placeAsk.config, placeAsk.cb);

  server.registerTool(cancelAsk.name, cancelAsk.config, cancelAsk.cb);

  server.registerTool(
    approveCompletion.name,
    approveCompletion.config,
    approveCompletion.cb,
  );
}
