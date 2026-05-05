import type { Response, Request } from "express";
import {
  RegisterSchema,
  TIER_REGISTRATION_KEYS,
  TIER_SCOPES,
  type Tier,
} from "../types/tiers.js";
import dotenv from "dotenv";
import { createAgentClient } from "../services/keycloak-admin.js";

dotenv.config();

export const registerAgent = async (req: Request, res: Response) => {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "invalid_request",
        details: parsed.error.flatten(),
      });
    }

    const { agentName, tier, registrationKey } = parsed.data;

    // validate tier registration key
    const expectedKey = TIER_REGISTRATION_KEYS[tier];
    if (!expectedKey || registrationKey !== expectedKey) {
      return res.status(401).json({
        error: "invalid_registration_key",
        error_description:
          "Invalid or missing registration key for requested tier",
      });
    }

    try {
      const { clientId, secret } = await createAgentClient(
        agentName,
        tier as Tier,
      );

      console.log(`[register] agent registered: ${clientId} tier=${tier}`);

      return res.status(201).json({
        client_id: clientId,
        client_secret: secret,
        tier,
        scopes: TIER_SCOPES[tier as Tier],
        token_endpoint: `${process.env.AUTH_HOST}/realms/${process.env.AUTH_REALM}/protocol/openid-connect/token`,
      });
    } catch (err) {
      console.error("[register] failed to create agent:", err);
      throw err;
    }
  } catch (error) {
    return res.status(500).json({
      error: "registration_failed",
      error_description: "Failed to register agent",
    });
  }
};
