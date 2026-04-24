import type { SmartMatchProfile } from "@/components/discovery/types";
import type { EnhancedMatchSuggestionResponse } from "@/types/reputation";

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function str(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  return String(v).trim();
}

/**
 * Gỡ snake_case / camelCase từ JSON backend.
 */
export function normalizeRawEnhanced(raw: unknown): EnhancedMatchSuggestionResponse | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const userId = str(o.userId ?? o.user_id ?? "");
  if (!userId) return null;
  return {
    userId,
    fullName: str(o.fullName ?? o.full_name) || "—",
    avatarUrl: str(o.avatarUrl ?? o.avatar_url) || null,
    score: num(o.score),
    label: o.label != null ? str(o.label) : null,
    hardFiltered: Boolean(o.hardFiltered ?? o.hard_filtered),
    hardFilterReasons: (() => {
      const r = o.hardFilterReasons ?? o.hard_filter_reasons;
      if (!Array.isArray(r)) return null;
      return r.map((x) => str(x)).filter(Boolean);
    })(),
    verificationStatus: o.verificationStatus ?? o.verification_status ?? null,
    identityVerified: Boolean(o.identityVerified ?? o.identity_verified),
    trustScore: num(o.trustScore ?? o.trust_score),
    trustLabel: o.trustLabel != null ? str(o.trustLabel) : o.trust_label != null ? str(o.trust_label) : null,
  } as EnhancedMatchSuggestionResponse;
}

/** 0–1 hoặc 0–100 → % hiển thị */
export function scoreToMatchPercent(score: number | null | undefined): number {
  if (score == null || Number.isNaN(Number(score))) return 0;
  const s = Number(score);
  if (s >= 0 && s <= 1) return Math.round(s * 100);
  return Math.min(100, Math.max(0, Math.round(s)));
}

type TFn = (key: string, options?: Record<string, string | number>) => string;

/**
 * Một dòng gợi ý từ API → thẻ Smart Match.
 */
export function mapEnhancedToSmartProfile(raw: unknown, t: TFn): SmartMatchProfile | null {
  const s = normalizeRawEnhanced(raw);
  if (!s) return null;

  const id = s.userId;
  const name = s.fullName || t("common.user");
  const matchPercent = scoreToMatchPercent(s.score);
  const verified = s.identityVerified;

  const tags: SmartMatchProfile["tags"] = [];
  const reasons = s.hardFilterReasons?.filter((x) => x.length > 0) ?? [];
  if (reasons.length > 0) {
    reasons.forEach((label, j) => {
      tags.push({ id: `r-${id}-${j}`, label, type: "conflict" });
    });
  }
  if (s.trustLabel) {
    tags.push({
      id: `trust-${id}`,
      label: s.trustLabel,
      type: "match",
    });
  } else if (s.label) {
    const isStrong = matchPercent >= 60;
    tags.push({
      id: `lbl-${id}`,
      label: s.label,
      type: isStrong ? "match" : "neutral",
    });
  }
  if (tags.length === 0) {
    tags.push({
      id: `def-${id}`,
      label: t("smartMatch.tagCompatibility"),
      type: "neutral",
    });
  }

  const subtitle = [s.trustLabel, s.label].filter((x) => x && str(x).length > 0).join(" · ")
    || t("smartMatch.defaultSubtitle");

  return {
    id,
    name,
    age: null,
    subtitle,
    imageUrl: s.avatarUrl,
    matchPercent,
    verified,
    tags: tags.slice(0, 6),
  };
}

export function mapEnhancedListToProfiles(
  list: unknown,
  t: TFn,
): SmartMatchProfile[] {
  if (!Array.isArray(list)) return [];
  const out: SmartMatchProfile[] = [];
  list.forEach((raw) => {
    const p = mapEnhancedToSmartProfile(raw, t);
    if (p) out.push(p);
  });
  return out;
}
