import { z } from "zod";

export const OrderRequestSchema = z.object({
  symbol: z.string().describe("The ticker symbol"),
  side: z.enum(["buy", "sell"]),
  price: z.number().positive(),
  orderType: z.string(),
  quantity: z.number().positive(),
});

export const SkillSymbolSchema = z
  .string()
  .regex(/^[A-Z_]+\.[A-Z]+$/)
  .describe("e.g. NLP.SENIOR, DEVOPS.MID, VISION.JUNIOR");

export const EfficiencyProfile = z.object({
  estimatedTTD: z.object({
    value: z.number().positive(),
    unit: z.enum(["seconds", "minutes", "hours"]),
  }),
  ttdConfidence: z.number().min(0).max(1),
  currentCapacity: z.number().int().positive(),
  expectedQuality: z.number().min(0).max(1),
});

export type OrderRequest = z.infer<typeof OrderRequestSchema>;
export type SkillSymbol = z.infer<typeof SkillSymbolSchema>;
export type EfficiencyProfile = z.infer<typeof EfficiencyProfile>;
