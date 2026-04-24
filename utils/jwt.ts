/**
 * Decode a JWT token's payload section without verifying the signature.
 * Safe to use client-side for reading non-sensitive claims like userId.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return null;
    const padded = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

const ADMIN_TOKENS = new Set(["ADMIN", "ROLE_ADMIN"]);

function claimListIndicatesAdmin(raw: unknown): boolean {
  if (!Array.isArray(raw)) return false;
  return (raw as unknown[]).some(
    (x) => typeof x === "string" && ADMIN_TOKENS.has(x),
  );
}

/** Heuristic for Spring-style JWTs (`roles`, `authorities`, `scope`). */
export function jwtIndicatesAdmin(payload: Record<string, unknown> | null): boolean {
  if (!payload) return false;
  if (payload.scope === "ADMIN") return true;
  const roles = payload.roles;
  if (typeof roles === "string" && ADMIN_TOKENS.has(roles)) return true;
  if (claimListIndicatesAdmin(roles)) return true;
  if (claimListIndicatesAdmin(payload.authorities)) return true;
  return false;
}
