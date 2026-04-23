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

function str(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return String(v).trim();
}

/** Gom tên hiển thị từ DTO user/author (camelCase + snake_case). */
function pickDisplayName(o: Record<string, unknown>): string {
  return (
    str(o.fullName) ||
    str(o.full_name) ||
    str(o.name) ||
    str(o.displayName) ||
    str(o.display_name) ||
    str(o.nickname) ||
    str(o.username) ||
    str(o.user_name) ||
    str(o.login) ||
    ""
  );
}

function pickUsername(o: Record<string, unknown>): string {
  return str(o.username) || str(o.user_name) || str(o.login) || "";
}

function pickAvatar(o: Record<string, unknown>): string | null {
  const u = o.avatarUrl ?? o.avatar_url;
  if (u == null || u === "") return null;
  return typeof u === "string" ? u : null;
}

function toAuthorShape(o: Record<string, unknown> | undefined): {
  id: string | number | undefined;
  fullName: string;
  username: string;
  avatarUrl: string | null;
} | null {
  if (!o) return null;
  const name = pickDisplayName(o);
  const username = pickUsername(o);
  const display = name || username;
  if (!display && o.id == null) return null;
  return {
    id: o.id as string | number | undefined,
    fullName: display,
    username: username || name,
    avatarUrl: pickAvatar(o),
  };
}

/**
 * Search / recommended items: `user` thường chứa đủ thông tin; `author` có thể
 * rỗng hoặc snake_case. Luôn tạo `author` đầy đủ cho UI.
 */
export function normaliseSearchPostRecord(item: unknown): unknown {
  if (!item || typeof item !== "object") return item;
  const it = item as Record<string, unknown>;

  const userObj = (
    it.user ??
    it.postedBy ??
    it.posted_by ??
    it.owner ??
    it.creator
  ) as Record<string, unknown> | undefined;
  const authorObj = it.author as Record<string, unknown> | undefined;

  const fromUser = toAuthorShape(userObj);
  const fromAuthor = toAuthorShape(authorObj);

  // Ưu tiên user (người đăng thật); author chỉ bổ sung khi user thiếu
  const id = fromUser?.id ?? fromAuthor?.id;
  const fullName =
    (fromUser?.fullName && str(fromUser.fullName)) ||
    (fromAuthor?.fullName && str(fromAuthor.fullName)) ||
    "";
  const username =
    (fromUser?.username && str(fromUser.username)) ||
    (fromAuthor?.username && str(fromAuthor.username)) ||
    "";
  const avatarUrl = fromUser?.avatarUrl ?? fromAuthor?.avatarUrl ?? null;

  const author = {
    id,
    fullName: fullName || username || "",
    username: username || undefined,
    avatarUrl,
  };

  return { ...it, author };
}

function normaliseItems(items: unknown[]): unknown[] {
  return items.map((item) => normaliseSearchPostRecord(item));
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
      const raw = (response as any)?.data as
        | CursorResponse<RecommendedPostResponse>
        | undefined;
      if (!raw || !Array.isArray(raw.data)) return raw;

      return {
        ...raw,
        data: raw.data.map((row) => {
          if (!row || typeof row !== "object") return row;
          const r = row as RecommendedPostResponse;
          return {
            ...r,
            post: normaliseSearchPostRecord(r.post) as PostSearchResponse,
          };
        }),
      };
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