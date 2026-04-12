/**
 * Shared, in-memory avatar URL cache.
 *
 * - Own profile: populated by profile.tsx after a successful `/me/profile` fetch.
 * - Other users:  fetched on-demand via `GET /users/{id}/profile`.
 *
 * The store deduplicates concurrent requests — if 10 PostCards all ask for the
 * same userId at once, only one HTTP call goes out.
 */
import { create } from "zustand";
import { profileApi } from "@/apis/profile";

interface ProfileAvatarStore {
  /**
   * userId (string) → avatarUrl string   = resolved (has or null = no avatar)
   *                    undefined          = not yet fetched
   */
  cache: Record<string, string | null>;

  /** userIds currently in-flight so we don't double-fetch. */
  fetching: Record<string, true>;

  /**
   * Set a known avatar directly (e.g. after loading own profile).
   * Pass `null` when the user has no avatar.
   */
  setAvatar: (userId: string | number, avatarUrl: string | null) => void;

  /**
   * Trigger a background fetch for this userId if not already cached/fetching.
   * No-op if the value is already in cache.
   */
  fetchAvatar: (userId: string | number) => void;
}

export const useProfileAvatarStore = create<ProfileAvatarStore>((set, get) => ({
  cache: {},
  fetching: {},

  setAvatar: (userId, avatarUrl) => {
    const key = String(userId);
    set((s) => ({
      cache: { ...s.cache, [key]: avatarUrl },
      fetching: withoutKey(s.fetching, key),
    }));
  },

  fetchAvatar: (userId) => {
    const key = String(userId);
    const { cache, fetching } = get();

    // Already resolved or in-flight — nothing to do
    if (key in cache || fetching[key]) return;

    // Mark as in-flight immediately (synchronous) to prevent duplicate requests
    set((s) => ({ fetching: { ...s.fetching, [key]: true } }));

    profileApi
      .getUserProfile(key)
      .then((res: unknown) => {
        // Axios interceptor already unwraps to response.data (backend body)
        // Backend body: { code, data: { avatarUrl, fullName, … } }
        const body = res as Record<string, unknown>;
        const data = (body?.data ?? body) as Record<string, unknown>;
        const avatarUrl =
          typeof data?.avatarUrl === "string" ? data.avatarUrl : null;
        get().setAvatar(key, avatarUrl);
      })
      .catch(() => {
        // On 403/404 or network error: cache null (no avatar) so we don't retry endlessly
        get().setAvatar(key, null);
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
