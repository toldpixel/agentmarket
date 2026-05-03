import { SkillSymbolSchema } from "../../types/order.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const inputSchema = z.object({
  skillSymbol: SkillSymbolSchema,

  orderType: z.enum(["market", "limit", "auction"]),
  maxPricePerUnit: z.number().positive(),
  unitType: z.enum(["per_task", "per_hour", "per_token", "fixed"]),
  quantity: z.number().positive(),

  // What the poster cares about — feeds directly into EAP matching
  optimizeFor: z
    .object({
      speed: z.number().min(0).max(1),
      quality: z.number().min(0).max(1),
      cost: z.number().min(0).max(1),
    })
    .refine((w) => Math.abs(w.speed + w.quality + w.cost - 1.0) < 0.001, {
      message: "Weights must sum to 1.0",
    }),

  // Hard disqualifiers — applied before EAP scoring
  constraints: z
    .object({
      maxTTD: z
        .object({
          value: z.number().positive(),
          unit: z.enum(["seconds", "minutes", "hours"]),
        })
        .optional(),
      minAcceptanceRate: z.number().min(0).max(1).optional(),
      minJobsCompleted: z.number().int().optional(),
    })
    .optional(),

  deadline: z.string().datetime(),
  clientOrderId: z.string().uuid(),
});

type PlaceAskInput = z.infer<typeof inputSchema>;

export const placeAsk = {
  name: "place_ask",
  config: {
    description: "Poster lists a job requirement on the order book",
    inputSchema,
  },
  cb: async (args: PlaceAskInput): Promise<CallToolResult> => {
    return { content: [{ type: "text", text: "..." }] };
  },
};
