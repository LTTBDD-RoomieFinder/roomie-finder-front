import { postSearchApi } from "@/apis/post-search-api";
import { PostSearchRequest } from "@/data/request";
import { RoomResponse } from "@/data/response";

export type PostSearchAuthorResponse = {
  id?: number;
  fullName: string;
  username?: string;
  phoneNumber?: string;
};

export type PostSearchUserResponse = {
  id?: number | string;
  fullName?: string;
  username?: string;
};

export type PostSearchResponse = {
  id: number;
  title: string;
  content: string;
  status: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  room: RoomResponse;
  author?: PostSearchAuthorResponse;
  user?: PostSearchUserResponse;
};

export type RecommendedPostResponse = {
  post: PostSearchResponse;
  profileAvgScore: number;
  roomScore: number;
  totalScore: number;
};

export type CursorResponse<T> = {
  data: T[];
  nextCursor: number | null;
  hasNext: boolean;
};

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

  async getRecommendedPosts(params?: { cursor?: number; size?: number }) {
    try {
      const response = await postSearchApi.getRecommendedPosts(params);
      return (response as any)?.data as CursorResponse<RecommendedPostResponse>;
    } catch (error: any) {
      console.error("🚨 [Recommended API Error]:", {
        status: error?.response?.status,
        message: error?.message,
        backendError: error?.response?.data,
      });

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Đã có lỗi xảy ra khi tải danh sách đề xuất.";
      throw new Error(errorMessage);
    }
  },
};