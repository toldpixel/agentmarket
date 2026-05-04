import { OAuthMetadata } from "@modelcontextprotocol/sdk/shared/auth.js";
import { checkResourceAllowed } from "@modelcontextprotocol/sdk/shared/auth-utils.js";
import { getOAuthProtectedResourceMetadataUrl } from "@modelcontextprotocol/sdk/server/auth/router.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import dotenv from "dotenv";

dotenv.config();

// config
const CONFIG = {
  host: process.env.MCP_HOST || "localhost",
  port: Number(process.env.MCP_PORT) || 5022,
  auth: {
    host: process.env.AUTH_HOST || "localhost",
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
    console.log("[auth] verifyAccessToken called");

    const endpoint = oauthMetadata.introspection_endpoint;
    console.log("[auth] introspection endpoint:", endpoint);

    const params = new URLSearchParams({
      token: token,
      client_id: CONFIG.auth.clientId,
    });

    if (CONFIG.auth.clientSecret) {
      params.set("client_secret", CONFIG.auth.clientSecret);
    } else {
      console.warn("[auth] WARNING: client_secret is empty!");
    }

    let response: Response;
    try {
      console.log("[auth] calling introspection...");
      response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      console.log("[auth] introspection status:", response.status);
    } catch (e) {
      console.error("[auth] introspection fetch threw:", e);
      throw e;
    }

    const txt = await response.text();
    console.log("[auth] introspection raw response:", txt);

    if (!response.ok) {
      throw new Error(`Introspection failed: ${txt}`);
    }

    let data: any;
    try {
      data = JSON.parse(txt);
    } catch (e) {
      console.error("[auth] failed to parse JSON:", txt);
      throw e;
    }

    console.log("[auth] introspection data:", JSON.stringify(data, null, 2));

    if (data.active === false) {
      throw new Error("Inactive token");
    }

    console.log("[auth] aud claim:", data.aud);
    console.log("[auth] mcpServerUrl:", mcpServerUrl.toString());

    // audiences check
    const audiences: string[] = Array.isArray(data.aud)
      ? data.aud
      : data.aud
        ? [data.aud]
        : [];

    console.log("[auth] audiences:", audiences);

    if (audiences.length === 0) {
      console.warn("[auth] no aud claim — trusting active token");
      return {
        token,
        clientId: data.client_id,
        scopes: data.scope ? data.scope.split(" ") : [],
        expiresAt: data.exp,
      };
    }

    const allowed = audiences.some((a) => {
      try {
        const result = checkResourceAllowed({
          requestedResource: a,
          configuredResource: mcpServerUrl,
        });
        console.log(`[auth] checkResourceAllowed(${a}) =`, result);
        return result;
      } catch (e) {
        console.log(`[auth] checkResourceAllowed(${a}) threw:`, e);
        return a === CONFIG.auth.clientId || a === "mcp-broker";
      }
    });

    if (!allowed) {
      throw new Error(
        `Audience not allowed. Expected ${mcpServerUrl}, got: ${audiences.join(", ")}`,
      );
    }

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
