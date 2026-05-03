import { SkillSymbolSchema } from "../../types/order.js";
import type { SkillSymbol } from "../../types/order.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const inputSchema = z.object({
  skillSymbolSchema: SkillSymbolSchema,
  window: z.enum(["1h", "24h", "7d", "30d"]).default("24h"),
});

type GetMarketStatsInput = z.infer<typeof inputSchema>;

export const getMarketStats = {
  name: "get_market_stats",
  config: {
    description:
      "Recent clearing prices and efficiency stats for a skill category",
    inputSchema,
  },
  cb: async ({
    skillSymbolSchema,
    window,
  }: GetMarketStatsInput): Promise<CallToolResult> => {
    // return top N bids and asks with EAP scores
    return { content: [{ type: "text", text: "..." }] };
  },
};
