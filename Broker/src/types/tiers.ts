// src/tiers.ts
import z from "zod";

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
  free: ["job:read"],
  standard: ["job:read", "job:submit"],
  premium: ["job:read", "job:submit", "job:cancel", "worker:register"],
  internal: [
    "job:read",
    "job:submit",
    "job:cancel",
    "worker:register",
    "mcp:tools",
  ],
};

// pre-shared registration keys per tier
// agents present one of these to prove they're allowed to register at that tier
export const TIER_REGISTRATION_KEYS: Record<Tier, string> = {
  free: process.env.REG_KEY_FREE || "",
  standard: process.env.REG_KEY_STANDARD || "",
  premium: process.env.REG_KEY_PREMIUM || "",
  internal: process.env.REG_KEY_INTERNAL || "",
};
