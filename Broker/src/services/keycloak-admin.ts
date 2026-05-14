// src/keycloak-admin.ts
import { Tier, TIER_SCOPES } from "../types/tiers.js";
interface CreatedClient {
  clientId: string;
  secret: string;
}

// Get the token for the admin account to register the agent in keycloak
async function getAdminToken(): Promise<string> {
  const res = await fetch(
    `https://${process.env.AUTH_HOST}/realms/master/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.KEYCLOAK_ADMIN_CLIENT_ID || "admin-cli",
        client_secret: process.env.KEYCLOAK_ADMIN_CLIENT_SECRET || "",
      }),
    },
  );
  const { access_token } = await res.json();
  return access_token;
}

export async function createAgentClient(
  agentName: string,
  tier: Tier,
): Promise<CreatedClient> {
  const adminToken = await getAdminToken();
  const realm = process.env.AUTH_REALM || "exchange";
  const clientId = `agent-${tier}-${agentName}-${crypto.randomUUID().slice(0, 8)}`;
  const secret = crypto.randomUUID();

  // create the client with the admin account
  const createRes = await fetch(
    `https://${process.env.AUTH_HOST}/admin/realms/${realm}/clients`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        clientId,
        secret,
        enabled: true,
        serviceAccountsEnabled: true, // enables client_credentials
        publicClient: false,
        standardFlowEnabled: false,
        directAccessGrantsEnabled: false,
        defaultClientScopes: [],
        optionalClientScopes: [],
      }),
    },
  );

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create Keycloak client: ${err}`);
  }

  // get the created client's UUID
  const clients = await fetch(
    `https://${process.env.AUTH_HOST}/admin/realms/${realm}/clients?clientId=${clientId}`,
    { headers: { Authorization: `Bearer ${adminToken}` } },
  ).then((r) => r.json());

  const clientUUID = clients[0].id;

  // assign tier scopes to the service account
  const scopes = TIER_SCOPES[tier];
  await assignScopesToServiceAccount(
    adminToken,
    realm,
    clientUUID,
    clientId,
    tier,
    scopes,
  );

  return { clientId, secret };
}

async function assignScopesToServiceAccount(
  adminToken: string,
  realm: string,
  clientUUID: string,
  clientId: string,
  tier: Tier,
  scopes: string[],
) {
  const baseUrl = `https://${process.env.AUTH_HOST}`;

  // 1. fetch all available client scopes in the realm
  const availableScopesRes = await fetch(
    `${baseUrl}/admin/realms/${realm}/client-scopes`,
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );

  if (!availableScopesRes.ok) {
    throw new Error(
      `Failed to fetch client scopes: ${await availableScopesRes.text()}`,
    );
  }

  const availableScopes: { id: string; name: string }[] =
    await availableScopesRes.json();
  console.log(
    "[keycloak] available scopes:",
    availableScopes.map((s) => s.name),
  );
  console.log("[keycloak] scopes to assign:", scopes);

  // 2. assign each tier scope to the client as a default scope
  for (const scopeName of scopes) {
    const scope = availableScopes.find((s) => s.name === scopeName);

    if (!scope) {
      console.warn(
        `[keycloak] scope "${scopeName}" not found in realm — did you create it in Keycloak UI?`,
      );
      continue;
    }

    const assignRes = await fetch(
      `${baseUrl}/admin/realms/${realm}/clients/${clientUUID}/default-client-scopes/${scope.id}`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );

    if (assignRes.ok) {
      console.log(
        `[keycloak] ✓ assigned scope "${scopeName}" to "${clientId}"`,
      );
    } else {
      console.error(
        `[keycloak] ✗ failed to assign scope "${scopeName}":`,
        await assignRes.text(),
      );
    }
  }

  // 3. set tier attribute on service account user
  const saRes = await fetch(
    `${baseUrl}/admin/realms/${realm}/clients/${clientUUID}/service-account-user`,
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );
  const serviceAccount = await saRes.json();

  await fetch(`${baseUrl}/admin/realms/${realm}/users/${serviceAccount.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      attributes: {
        tier: [tier], // ← tier name, not realm name
        agentClientId: [clientId],
      },
    }),
  });
}
