import { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types";
import { SkillSymbolSchema } from "../../types/order.js";
import type { SkillSymbol } from "../../types/order.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { requireToolScope } from "../../utils/scopes.js";

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
  cb: async (
    { skillSymbolSchema, window }: GetMarketStatsInput,
    authInfo?: AuthInfo,
  ): Promise<CallToolResult> => {
    requireToolScope("get_market_stats", authInfo?.scopes ?? []);
    return { content: [{ type: "text", text: "..." }] };
  },
};
