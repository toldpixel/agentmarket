// src/keycloak-admin.ts
import { Tier, TIER_SCOPES } from "../types/tiers.js";
interface CreatedClient {
  clientId: string;
  secret: string;
}

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

  // create the client
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
    scopes,
  );

  return { clientId, secret };
}

async function assignScopesToServiceAccount(
  adminToken: string,
  realm: string,
  clientUUID: string,
  clientId: string,
  scopes: string[],
) {
  // get the service account user
  const saRes = await fetch(
    `https://${process.env.AUTH_HOST}/admin/realms/${realm}/clients/${clientUUID}/service-account-user`,
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );
  const serviceAccount = await saRes.json();
  const userId = serviceAccount.id;

  // add tier attribute to user for easy identification
  await fetch(
    `https://${process.env.AUTH_HOST}/admin/realms/${realm}/users/${userId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        attributes: { tier: [realm], agentClientId: [clientId] },
      }),
    },
  );
}
