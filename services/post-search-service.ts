import { postSearchApi } from "@/apis/post-search-api";
import { PostSearchRequest } from "@/data/request";
import { RoomResponse } from "@/data/response";

export type PostSearchAuthorResponse = {
  id?: number;
  fullName: string;
  username?: string;
  phoneNumber?: string;
  avatarUrl?: string | null;
};

export type PostSearchUserResponse = {
  id?: number | string;
  fullName?: string;
  username?: string;
  avatarUrl?: string | null;
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

function numOr(v: unknown, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

/**
 * Một số bản API bọc: `{ data: [...] }`, `{ data: { data, nextCursor } }`, hoặc trả mảng gốc.
 */
function extractArrayFromRecommendedBody(root: unknown): unknown[] {
  if (root == null) return [];
  if (Array.isArray(root)) return root;
  if (typeof root !== "object") return [];
  const o = root as Record<string, unknown>;

  const d = o.data;
  if (Array.isArray(d)) return d;
  if (d && typeof d === "object" && !Array.isArray(d)) {
    const inner = d as Record<string, unknown>;
    if (Array.isArray(inner.data)) return inner.data;
    if (Array.isArray(inner.content)) return inner.content;
    if (Array.isArray(inner.records)) return inner.records;
    if (Array.isArray(inner.items)) return inner.items;
  }

  if (Array.isArray(o.content)) return o.content;
  if (Array.isArray(o.items)) return o.items;
  if (Array.isArray(o.results)) return o.results;
  return [];
}

function rowToRecommendedItem(row: unknown): RecommendedPostResponse | null {
  if (row == null || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;

  if (o.post != null) {
    const postNorm = normaliseSearchPostRecord(o.post) as PostSearchResponse;
    if (postNorm?.id == null) return null;
    return {
      post: postNorm,
      profileAvgScore: numOr(o.profileAvgScore ?? o.profile_avg_score, 0),
      roomScore: numOr(o.roomScore ?? o.room_score, 0),
      totalScore: numOr(o.totalScore ?? o.total_score, 0),
    };
  }

  if (o.id == null) return null;
  const postNorm = normaliseSearchPostRecord(row) as PostSearchResponse;
  if (postNorm?.id == null) return null;
  return {
    post: postNorm,
    profileAvgScore: numOr(o.profileAvgScore ?? o.profile_avg_score, 0),
    roomScore: numOr(o.roomScore ?? o.room_score, 0),
    totalScore: numOr(o.totalScore ?? o.total_score, 0),
  };
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
  const u =
    o.avatarUrl ??
    o.avatar_url ??
    o.profilePictureUrl ??
    o.profile_picture_url ??
    o.profileImageUrl ??
    o.profile_image_url ??
    o.photoUrl ??
    o.photo_url;
  if (u == null || u === "") return null;
  return typeof u === "string" ? u.trim() : null;
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
      const response = await postSearchApi.getRecommendedPosts({
        size: 50,
        ...params,
      });
      const body = response as unknown;
      const list = extractArrayFromRecommendedBody(body);
      const data = list
        .map((row) => rowToRecommendedItem(row))
        .filter((x): x is RecommendedPostResponse => x != null);

      let nextCursor: number | null = null;
      let hasNext = false;
      if (body && typeof body === "object" && !Array.isArray(body)) {
        const b = body as Record<string, unknown>;
        const pack = b.data;
        const source =
          pack && typeof pack === "object" && !Array.isArray(pack)
            ? (pack as Record<string, unknown>)
            : b;
        const nc = source.nextCursor ?? source.next_cursor;
        const hn = source.hasNext ?? source.has_next;
        nextCursor = typeof nc === "number" && Number.isFinite(nc) ? nc : null;
        hasNext = Boolean(hn);
      }

      return { data, nextCursor, hasNext } satisfies CursorResponse<RecommendedPostResponse>;
    } catch (error: unknown) {
      const anyErr = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      console.error("🚨 [Recommended API Error]:", {
        status: (error as { response?: { status?: number } })?.response?.status,
        message: anyErr?.message,
        backendError: anyErr?.response?.data,
      });

      const errorMessage =
        anyErr?.response?.data?.message ||
        anyErr?.message ||
        "Đã có lỗi xảy ra khi tải danh sách đề xuất.";
      throw new Error(errorMessage);
    }
  },
};