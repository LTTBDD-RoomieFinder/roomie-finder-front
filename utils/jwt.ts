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
