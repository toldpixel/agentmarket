import { OAuthMetadata } from "@modelcontextprotocol/sdk/shared/auth.js";
import { checkResourceAllowed } from "@modelcontextprotocol/sdk/shared/auth-utils.js";
import { getOAuthProtectedResourceMetadataUrl } from "@modelcontextprotocol/sdk/server/auth/router.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import dotenv from "dotenv";

dotenv.config();

// config
const CONFIG = {
  host: process.env.MCP_HOST || "localhost",
  port: Number(process.env.MCP_PORT) || 3000,
  auth: {
    host: process.env.AUTH_HOST || process.env.HOST || "localhost",
    port: Number(process.env.AUTH_PORT) || 8080,
    realm: process.env.AUTH_REALM || "exchange",
    clientId: process.env.OAUTH_CLIENT_ID || "mcp-broker",
    clientSecret: process.env.OAUTH_CLIENT_SECRET || "",
  },
};

function createOAuthUrls() {
  const authBaseUrl = new URL(
    `https://${CONFIG.auth.host}/realms/${CONFIG.auth.realm}/`,
  );
  return {
    issuer: authBaseUrl.toString(),
    introspection_endpoint: new URL(
      "protocol/openid-connect/token/introspect",
      authBaseUrl,
    ).toString(),
    authorization_endpoint: new URL(
      "protocol/openid-connect/auth",
      authBaseUrl,
    ).toString(),
    token_endpoint: new URL(
      "protocol/openid-connect/token",
      authBaseUrl,
    ).toString(),
  };
}

export function createRequestLogger() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    res.on("finish", () => {
      const ms = Date.now() - start;
      console.log(
        `${req.method} ${req.originalUrl} -> ${res.statusCode} ${ms}ms`,
      );
    });
    next();
  };
}

export const mcpServerUrl = new URL(
  process.env.MCP_PUBLIC_URL || `https://${CONFIG.host}/mcp`,
);
const oauthUrls = createOAuthUrls();

export const oauthMetadata: OAuthMetadata = {
  ...oauthUrls,
  response_types_supported: ["code"],
};

const tokenVerifier = {
  verifyAccessToken: async (token: string) => {
    console.log("[auth] === verifyAccessToken start ===");
    console.log(
      "[auth] introspection_endpoint:",
      oauthMetadata.introspection_endpoint,
    );
    console.log("[auth] mcpServerUrl:", mcpServerUrl.toString());
    console.log("[auth] clientId:", CONFIG.auth.clientId);
    console.log("[auth] clientSecret set:", !!CONFIG.auth.clientSecret);

    const endpoint = oauthMetadata.introspection_endpoint!;
    const params = new URLSearchParams({
      token,
      client_id: CONFIG.auth.clientId,
      client_secret: CONFIG.auth.clientSecret,
    });

    let data: any;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      const txt = await response.text();
      console.log("[auth] introspection status:", response.status);
      console.log("[auth] introspection body:", txt);
      data = JSON.parse(txt);
    } catch (e) {
      console.error("[auth] introspection failed:", e);
      throw e;
    }

    if (!data.active) {
      console.error("[auth] token inactive");
      throw new Error("Inactive token");
    }

    console.log("[auth] aud:", data.aud);
    console.log("[auth] scope:", data.scope);
    console.log("[auth] client_id:", data.client_id);

    const audiences: string[] = data.aud
      ? Array.isArray(data.aud)
        ? data.aud
        : [data.aud]
      : [];

    console.log("[auth] audiences array:", audiences);

    // skip strict audience check for now — just trust active token
    // add audience enforcement back once we confirm basic flow works
    if (!data.active) throw new Error("Token not active");

    console.log("[auth] === token accepted ===");
    return {
      token,
      clientId: data.client_id,
      scopes: data.scope ? data.scope.split(" ") : [],
      expiresAt: data.exp,
    };
  },
};

export const authMiddleware = requireBearerAuth({
  verifier: tokenVerifier,
  requiredScopes: [],
  resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(mcpServerUrl),
});
