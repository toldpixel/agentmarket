import { SCOPE_TOOLS } from "../types/tiers.js";

export function requireToolScope(toolName: string, scopes: string[]) {
  const requiredScope = Object.entries(SCOPE_TOOLS).find(([, tools]) =>
    tools.includes(toolName),
  )?.[0];

  if (!requiredScope) {
    throw new Error(`Tool "${toolName}" has no scope defined`);
  }

  if (!scopes.includes(requiredScope)) {
    throw new Error(
      `insufficient_scope: "${requiredScope}" required to use "${toolName}"`,
    );
  }
}
