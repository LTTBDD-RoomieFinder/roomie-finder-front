import { reviewApi } from "@/apis/review-api";
import type { CreateReviewRequest } from "@/data/request";
import type { ReviewResponse, ReviewSummaryResponse } from "@/types/reputation";
import { ReviewContext } from "@/types/enums";

function unwrap<T>(res: unknown): T {
  if (res !== null && typeof res === "object" && "data" in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function str(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function pickContext(v: unknown): ReviewContext {
  if (v === ReviewContext.LANDLORD_EXPERIENCE || v === "LANDLORD_EXPERIENCE") {
    return ReviewContext.LANDLORD_EXPERIENCE;
  }
  return ReviewContext.ROOMMATE_EXPERIENCE;
}

function normalizeReview(raw: unknown): ReviewResponse | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = num(o.id);
  if (!id) return null;

  let reviewerId = num(o.reviewerId ?? o.reviewer_id);
  let reviewerFullName = str(o.reviewerFullName ?? o.reviewer_full_name) ?? "";
  let reviewerAvatarUrl = str(o.reviewerAvatarUrl ?? o.reviewer_avatar_url);

  const reviewerNest = o.reviewer;
  if (reviewerNest && typeof reviewerNest === "object") {
    const r = reviewerNest as Record<string, unknown>;
    if (!reviewerId) {
      reviewerId = num(r.id ?? r.userId ?? r.user_id);
    }
    if (!reviewerFullName) {
      reviewerFullName =
        str(r.fullName ?? r.full_name ?? r.username ?? r.user_name) ?? "";
    }
    if (!reviewerAvatarUrl) {
      reviewerAvatarUrl = str(r.avatarUrl ?? r.avatar_url);
    }
  }

  return {
    id,
    reviewerId,
    reviewerFullName,
    reviewerAvatarUrl,
    revieweeId: num(o.revieweeId ?? o.reviewee_id),
    rating: Math.min(5, Math.max(0, num(o.rating))),
    comment: str(o.comment),
    context: pickContext(o.context),
    createdAt: str(o.createdAt ?? o.created_at) ?? "",
  };
}

function normalizeReviewSummaryResponse(raw: unknown): ReviewSummaryResponse {
  if (!raw || typeof raw !== "object") {
    return { userId: 0, averageRating: 0, totalReviews: 0, reviews: [] };
  }
  const o = raw as Record<string, unknown>;
  const reviewsRaw = o.reviews;
  const reviews = Array.isArray(reviewsRaw)
    ? (reviewsRaw.map(normalizeReview).filter(Boolean) as ReviewResponse[])
    : [];
  return {
    userId: num(o.userId ?? o.user_id),
    averageRating: Number(o.averageRating ?? o.average_rating ?? 0),
    totalReviews: Number(o.totalReviews ?? o.total_reviews ?? 0),
    reviews,
  };
}

export const reviewService = {
  async create(body: CreateReviewRequest): Promise<ReviewResponse> {
    const raw = unwrap<unknown>(await reviewApi.create(body));
    const n = normalizeReview(raw);
    if (n) return n;
    return raw as ReviewResponse;
  },

  async getSummaryByUserId(userId: number | string): Promise<ReviewSummaryResponse> {
    const raw = unwrap<unknown>(await reviewApi.getSummaryByUserId(userId));
    return normalizeReviewSummaryResponse(raw);
  },
};
