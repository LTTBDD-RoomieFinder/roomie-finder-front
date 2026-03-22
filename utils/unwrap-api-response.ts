/** Normalizes axios interceptor payload shape `{ data: T }` vs raw `T`. */
export function unwrapApiData<T>(res: unknown): T {
  if (res !== null && typeof res === "object" && "data" in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}
