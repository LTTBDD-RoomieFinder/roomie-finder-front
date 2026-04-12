import { postSearchApi } from "@/apis/post-search-api";
import { PostSearchRequest } from "@/data/request";

/**
 * Backend search endpoint returns items with `user: UserResponse`
 * (same shape as PostResponse), but PostSearchResultCard expects `author`.
 * Normalise here so the UI always has a populated `author` field.
 */
function normaliseItems(items: unknown[]): unknown[] {
  return items.map((item) => {
    const it = item as Record<string, unknown>;
    if (it.author) return it; // already normalised
    const user = it.user as Record<string, unknown> | undefined;
    if (!user) return it;
    return {
      ...it,
      author: {
        id: user.id,
        fullName: user.fullName || user.username || null,
        avatarUrl: user.avatarUrl ?? null,
      },
    };
  });
}

export const postSearchService = {
  async searchPosts(request: PostSearchRequest) {
    const response = await postSearchApi.searchPosts(request);
    const page = (response as any)?.data;
    if (!page) return page;

    // Handle both { data: [...] } and { content: [...] } pagination shapes
    if (Array.isArray(page.data)) {
      return { ...page, data: normaliseItems(page.data) };
    }
    if (Array.isArray(page.content)) {
      return { ...page, content: normaliseItems(page.content) };
    }
    // Flat array fallback
    if (Array.isArray(page)) {
      return normaliseItems(page);
    }
    return page;
  },
};