import { useEffect } from "react";

import { useProfileAvatarStore } from "@/stores/useProfileAvatarStore";

/**
 * Resolves a user's avatar: Zustand cache + optional payload hint + background
 * `GET /users/{id}/profile` (with TTL revalidation — see store).
 */
export function useResolvedAvatarUrl(
  userId: string | number | null | undefined,
  hintUrl?: string | null,
): string | null {
  const key =
    userId !== null &&
    userId !== undefined &&
    String(userId).trim() !== ""
      ? String(userId).trim()
      : "";

  const trimmedHint =
    typeof hintUrl === "string" && hintUrl.trim() ? hintUrl.trim() : "";

  const cached = useProfileAvatarStore((s) => (key ? s.cache[key] : undefined));
  const applyHint = useProfileAvatarStore((s) => s.applyHint);
  const fetchAvatar = useProfileAvatarStore((s) => s.fetchAvatar);

  useEffect(() => {
    if (!key) return;
    applyHint(key, trimmedHint || undefined);
    fetchAvatar(key);
  }, [key, trimmedHint, applyHint, fetchAvatar]);

  if (!key) {
    return trimmedHint || null;
  }

  // Resolved URL from GET /users/{id}/profile
  if (typeof cached === "string" && cached.length > 0) {
    return cached;
  }

  /**
   * Payload snapshot (e.g. `reviewerAvatarUrl` on a review) must win over
   * `cache[key] === null` — public profile DTO may omit avatar while the
   * review row still stores the URL from when the review was created.
   */
  if (trimmedHint) {
    return trimmedHint;
  }

  if (cached === null) {
    return null;
  }

  return null;
}
