/**
 * Converts HTTP(S) API base URL into WS(S) base URL.
 * - Keeps the original host/port
 * - Removes any trailing `/api/v{n}` segment
 * - Removes trailing slashes
 */
export function getWsBaseUrl(): string {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "";
  const base = apiUrl.replace(/\/api\/v\d+\/?$/, "").replace(/\/$/, "");

  if (base.startsWith("https://")) return base.replace("https://", "wss://");
  if (base.startsWith("http://")) return base.replace("http://", "ws://");
  return base;
}

