import { SCOPE_TOOLS } from "../types/tiers.js";

export class InsufficientScopeError extends Error {
  constructor(requiredScope: string, toolName: string) {
    super(
      `insufficient_scope: "${requiredScope}" required to use "${toolName}"`,
    );
    this.name = "InsufficientScopeError";
  }
}

export function requireToolScope(toolName: string, scopes: string[]) {
  const error = checkToolScope(toolName, scopes);
  if (error) throw new InsufficientScopeError(error, toolName);
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
