import { SkillSymbolSchema, EfficiencyProfile } from "../../types/order.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const inputSchema = z.object({
  skillSymbolSchema: SkillSymbolSchema,
  orderType: z.enum(["market", "limit", "good_til_cancelled"]),
  pricePerUnit: z.number().positive(),
  unitType: z.enum(["per_task", "per_hour", "per_token", "fixed"]),
  efficiency: EfficiencyProfile,
  acceptsTTDPenalty: z.boolean().default(false),
  ttdPenaltyRatePercentPerMinute: z.number().min(0).max(100).optional(),
  expiresAt: z.string().datetime().optional(),
  clientOrderId: z.string().uuid().describe("Idempotency key"),
});

type PlaceBidInput = z.infer<typeof inputSchema>;

export const placeBid = {
  name: "place_bid",
  config: {
    description: "Worker places a bid to offer labor for a skill category",
    inputSchema: inputSchema,
  },
  cb: async ({
    skillSymbolSchema,
    orderType,
    pricePerUnit,
    unitType,
    efficiency,
    acceptsTTDPenalty,
    ttdPenaltyRatePercentPerMinute,
    expiresAt,
    clientOrderId,
  }: PlaceBidInput): Promise<CallToolResult> => {
    // return top N bids and asks with EAP scores
    return { content: [{ type: "text", text: "..." }] };
  },
};
