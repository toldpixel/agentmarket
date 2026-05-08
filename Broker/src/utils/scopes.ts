import { SCOPE_TOOLS } from "../types/tiers.js";

export function getToolsForScopes(scopes: string[]): string[] {
  return Object.entries(SCOPE_TOOLS)
    .filter(([scope]) => scopes.includes(scope))
    .flatMap(([, tools]) => tools);
}

export function checkToolScope(
  toolName: string,
  scopes: string[],
): string | null {
  console.log("Check scopes: ", scopes);
  const requiredScope = Object.entries(SCOPE_TOOLS).find(([, tools]) =>
    tools.includes(toolName),
  )?.[0];

  if (!requiredScope) return `Tool "${toolName}" has no scope defined`;
  if (!scopes.includes(requiredScope)) {
    return `insufficient_scope: "${requiredScope}" required to use "${toolName}"`;
  }
  return null;
}
