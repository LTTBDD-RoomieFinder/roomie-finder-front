import type {
  DealBreakerType,
  ReportCategory,
  ReportStatus,
  ReportTargetType,
  ReviewContext,
  VerificationStatus,
} from "@/types/enums";

// ── Identity Verification ────────────────────────────────────────────────────

export type VerificationResponse = {
  id: number;
  userId: number;
  status: VerificationStatus;
  documentNumberMasked: string | null;
  /** Present when API returns full number (e.g. admin detail). */
  documentNumber?: string | null;
  reviewNote: string | null;
  verifiedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  /** Only present in admin responses. */
  selfieImageUrl?: string | null;
  documentImageUrl?: string | null;
  documentBackImageUrl?: string | null;
};

// ── Trust Score ──────────────────────────────────────────────────────────────

export type TrustScoreResponse = {
  userId: number;
  totalScore: number;
  label: string;
  verificationStatus: VerificationStatus | null;
  identityVerified: boolean;
  verificationBonus: number;
  profileCompletenessScore: number;
  responseRateScore: number;
  reviewScore: number;
  reportPenalty: number;
};

// ── Reviews ──────────────────────────────────────────────────────────────────

export type ReviewResponse = {
  id: number;
  reviewerId: number;
  reviewerFullName: string;
  reviewerAvatarUrl: string | null;
  revieweeId: number;
  rating: number;
  comment: string | null;
  context: ReviewContext;
  createdAt: string;
};

export type ReviewSummaryResponse = {
  userId: number;
  averageRating: number;
  totalReviews: number;
  reviews: ReviewResponse[];
};

// ── Reports ──────────────────────────────────────────────────────────────────

export type ReportResponse = {
  id: number;
  reporterId: number;
  targetType: ReportTargetType;
  targetId: number;
  category: ReportCategory;
  details: string;
  status: ReportStatus;
  createdAt: string;
  /** Only present in admin responses. */
  adminNote?: string | null;
  reviewedAt?: string | null;
};

// ── Enhanced Matching ─────────────────────────────────────────────────────────

export type MatchSuggestionResponse = {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  score: number | null;
  label: string | null;
};

export type EnhancedMatchSuggestionResponse = MatchSuggestionResponse & {
  hardFiltered: boolean;
  hardFilterReasons: string[] | null;
  verificationStatus: VerificationStatus | null;
  identityVerified: boolean;
  trustScore: number | null;
  trustLabel: string | null;
};

// ── Room Fit Score ────────────────────────────────────────────────────────────

export type CriterionBreakdown = {
  criterion: string;
  score: number;
  weight: number;
};

export type OccupantCompatibility = {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  identityVerified: boolean;
  trustScore: number | null;
  score: number | null;
  label: string | null;
  hardFiltered: boolean;
  dealBreakerViolations: string[] | null;
  breakdown: CriterionBreakdown[] | null;
};

export type RoomFitScoreResponse = {
  postId: number;
  overallFitScore: number | null;
  overallLabel: string;
  occupantCount: number;
  hardFiltered: boolean;
  hardFilterReasons: string[] | null;
  occupantCompatibilities: OccupantCompatibility[];
};

// ── Deal-breakers ─────────────────────────────────────────────────────────────

export type DealBreakersResponse = {
  dealBreakers: DealBreakerType[];
};
