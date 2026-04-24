import { ReportCategory, ReportStatus, ReportTargetType } from "@/types/enums";
import type { ReportResponse } from "@/types/reputation";

function str(o: Record<string, unknown>, camel: string, snake: string): string | null {
  const v = o[camel] ?? o[snake];
  if (v == null || v === "") return null;
  return String(v);
}

const TARGETS = Object.values(ReportTargetType) as string[];
const CATS = Object.values(ReportCategory) as string[];
const STATUSES = Object.values(ReportStatus) as string[];

export function normalizeReportResponse(input: unknown): ReportResponse {
  const o =
    input && typeof input === "object" ? (input as Record<string, unknown>) : {};

  const id = Number(o.id);
  const reporterId = Number(o.reporterId ?? o.reporter_id);
  const targetId = Number(o.targetId ?? o.target_id);

  const rawTarget = o.targetType ?? o.target_type;
  const targetType =
    typeof rawTarget === "string" && TARGETS.includes(rawTarget)
      ? (rawTarget as ReportTargetType)
      : ReportTargetType.USER;

  const rawCat = o.category;
  const category =
    typeof rawCat === "string" && CATS.includes(rawCat)
      ? (rawCat as ReportCategory)
      : ReportCategory.OTHER;

  const rawStatus = o.status;
  const status =
    typeof rawStatus === "string" && STATUSES.includes(rawStatus)
      ? (rawStatus as ReportStatus)
      : ReportStatus.PENDING;

  const created = str(o, "createdAt", "created_at") ?? new Date().toISOString();
  const detailsRaw = o.details;
  const details = typeof detailsRaw === "string" ? detailsRaw : "";

  return {
    id: Number.isFinite(id) ? id : 0,
    reporterId: Number.isFinite(reporterId) ? reporterId : 0,
    targetType,
    targetId: Number.isFinite(targetId) ? targetId : 0,
    category,
    details,
    status,
    createdAt: created,
    adminNote: str(o, "adminNote", "admin_note"),
    reviewedAt: str(o, "reviewedAt", "reviewed_at"),
  };
}

export function extractReportList(raw: unknown): ReportResponse[] {
  let arr: unknown[] = [];
  if (Array.isArray(raw)) arr = raw;
  else if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    if (Array.isArray(r.content)) arr = r.content;
    else if (Array.isArray(r.data)) arr = r.data;
    else if (Array.isArray(r.items)) arr = r.items;
  }
  return arr.map((item) => normalizeReportResponse(item));
}
