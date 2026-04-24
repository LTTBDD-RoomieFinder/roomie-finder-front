import { VerificationStatus } from "@/types/enums";
import type { VerificationResponse } from "@/types/reputation";

function str(
  o: Record<string, unknown>,
  camel: string,
  snake: string,
): string | null {
  const v = o[camel] ?? o[snake];
  if (v == null || v === "") return null;
  return String(v);
}

/**
 * Maps Spring / mixed JSON (snake_case, optional admin-only fields) to VerificationResponse.
 */
export function normalizeVerificationResponse(input: unknown): VerificationResponse {
  const o =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};

  const id = Number(o.id);
  const userId = Number(o.userId ?? o.user_id);

  const rawStatus = o.status;
  const allowed = Object.values(VerificationStatus) as string[];
  const status =
    typeof rawStatus === "string" && allowed.includes(rawStatus)
      ? (rawStatus as VerificationStatus)
      : VerificationStatus.PENDING;

  const created =
    str(o, "createdAt", "created_at") ?? new Date().toISOString();

  const masked = str(o, "documentNumberMasked", "document_number_masked");
  const fullNum = str(o, "documentNumber", "document_number");

  return {
    id: Number.isFinite(id) ? id : 0,
    userId: Number.isFinite(userId) ? userId : 0,
    status,
    documentNumberMasked: masked ?? fullNum,
    documentNumber: fullNum ?? undefined,
    reviewNote: str(o, "reviewNote", "review_note"),
    verifiedAt: str(o, "verifiedAt", "verified_at"),
    expiresAt: str(o, "expiresAt", "expires_at"),
    createdAt: created,
    selfieImageUrl: str(o, "selfieImageUrl", "selfie_image_url") ?? undefined,
    documentImageUrl:
      str(o, "documentImageUrl", "document_image_url") ?? undefined,
    documentBackImageUrl:
      str(o, "documentBackImageUrl", "document_back_image_url") ?? undefined,
  };
}

export function extractVerificationList(raw: unknown): VerificationResponse[] {
  let arr: unknown[] = [];
  if (Array.isArray(raw)) arr = raw;
  else if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    if (Array.isArray(r.content)) arr = r.content;
    else if (Array.isArray(r.data)) arr = r.data;
    else if (Array.isArray(r.items)) arr = r.items;
  }
  return arr.map((item) => normalizeVerificationResponse(item));
}
