/**
 * Shared avatar URL cache + background refresh.
 *
 * - **Hints** from list/search payloads (`applyHint`) update the cache when the URL
 *   changes so UI stays in sync before/without a profile fetch.
 * - **Revalidate**: after `AVATAR_REVALIDATE_MS`, the next `fetchAvatar` refetches
 *   `GET /users/{id}/profile` so admin/user avatar changes propagate app-wide.
 * - **force**: `fetchAvatar(id, { force: true })` after saving profile to pull server truth.
 * - **Errors**: failed fetches do not write `null` into cache (allows retry); confirmed
 *   “no avatar” only comes from a successful API response.
 */
import { create } from "zustand";
import { profileApi } from "@/apis/profile";

/** Background re-fetch interval (ms). */
export const AVATAR_REVALIDATE_MS = 3 * 60 * 1000;

interface ProfileAvatarStore {
  /**
   * userId → avatar URL. `null` = loaded, user has no avatar.
   * Missing key = never successfully resolved in this session.
   */
  cache: Record<string, string | null>;

  fetching: Record<string, true>;

  /** userId → last time cache was set from hint, fetch, or setAvatar. */
  fetchedAt: Record<string, number>;

  setAvatar: (userId: string | number, avatarUrl: string | null) => void;

  /**
   * Apply a non-empty URL from an API payload (post, search, chat member…).
   * Updates cache when it differs so new Cloudinary URLs replace stale cache.
   */
  applyHint: (userId: string | number, hintUrl: string | null | undefined) => void;

  fetchAvatar: (
    userId: string | number,
    options?: { force?: boolean },
  ) => void;
}

export const useProfileAvatarStore = create<ProfileAvatarStore>((set, get) => ({
  cache: {},
  fetching: {},
  fetchedAt: {},

  setAvatar: (userId, avatarUrl) => {
    const key = String(userId);
    const now = Date.now();
    set((s) => ({
      cache: { ...s.cache, [key]: avatarUrl },
      fetchedAt: { ...s.fetchedAt, [key]: now },
      fetching: withoutKey(s.fetching, key),
    }));
  },

  applyHint: (userId, hintUrl) => {
    const key = String(userId);
    const hint =
      typeof hintUrl === "string" && hintUrl.trim() ? hintUrl.trim() : null;
    if (!hint) return;
    if (get().cache[key] === hint) return;
    const now = Date.now();
    set((s) => ({
      cache: { ...s.cache, [key]: hint },
      fetchedAt: { ...s.fetchedAt, [key]: now },
      fetching: withoutKey(s.fetching, key),
    }));
  },

  fetchAvatar: (userId, options) => {
    const force = options?.force ?? false;
    const key = String(userId);
    const { cache, fetching, fetchedAt } = get();
    if (fetching[key]) return;

    const now = Date.now();
    const hasCached = key in cache;
    const age = hasCached ? now - (fetchedAt[key] ?? 0) : Number.POSITIVE_INFINITY;
    const stale = age > AVATAR_REVALIDATE_MS;
    if (hasCached && !stale && !force) return;

    set((s) => ({ fetching: { ...s.fetching, [key]: true } }));

    profileApi
      .getUserProfile(key)
      .then((res: unknown) => {
        const body = res as Record<string, unknown>;
        const data = (body?.data ?? body) as Record<string, unknown>;
        const raw =
          typeof data?.avatarUrl === "string" && data.avatarUrl.trim()
            ? data.avatarUrl.trim()
            : typeof data?.avatar_url === "string" && data.avatar_url.trim()
              ? data.avatar_url.trim()
              : null;
        get().setAvatar(key, raw);
      })
      .catch(() => {
        set((s) => ({ fetching: withoutKey(s.fetching, key) }));
      });
  },
}));

function withoutKey(
  obj: Record<string, true>,
  key: string,
): Record<string, true> {
  const next = { ...obj };
  delete next[key];
  return next;
}
