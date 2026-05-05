// src/tiers.ts
import z from "zod";

export const SCOPE_TOOLS: Record<string, string[]> = {
  "discovery:market": ["get_market_stats", "get_order_book"],
  "posting:side": ["cancel_ask", "place_ask", "approve_completion"],
  "worker:side": ["place_bid", "submit_completion", "withdraw_bid"],
  "mcp:tools": ["listTools", "getToolSchema"],
};

export const RegisterSchema = z.object({
  agentName: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  tier: z.enum(["free", "standard", "premium", "internal"]),
  registrationKey: z.string().min(1),
});

export type Tier = "free" | "standard" | "premium" | "internal";

export const TIER_SCOPES: Record<Tier, string[]> = {
  free: ["discovery:market"],
  standard: ["discovery:market", "posting:side"],
  premium: ["discovery:market", "posting:side", "worker:side"],
  internal: ["discovery:market", "posting:side", "worker:side", "mcp:tools"],
};

// pre-shared registration keys per tier
// agents present one of these to prove they're allowed to register at that tier
export const TIER_REGISTRATION_KEYS: Record<Tier, string> = {
  free: process.env.REG_KEY_FREE || "",
  standard: process.env.REG_KEY_STANDARD || "",
  premium: process.env.REG_KEY_PREMIUM || "",
  internal: process.env.REG_KEY_INTERNAL || "",
};
