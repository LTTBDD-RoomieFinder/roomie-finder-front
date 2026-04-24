import type { Profile } from "@/types/Profile";
import type { Address } from "@/types/Address";
import type { Tag } from "@/types/Tag";

function str(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  return String(v).trim();
}

function num(v: unknown, fallback = 0): number {
  if (v == null) return fallback;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function boolOrNull(v: unknown): boolean | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "boolean") return v;
  return null;
}

/**
 * Body từ axios (đã là `response.data` HTTP): `{ data: T }` hoặc trực tiếp `T`.
 */
export function unwrapApiPayload(res: unknown): unknown {
  if (res == null) return null;
  if (typeof res !== "object") return res;
  const o = res as Record<string, unknown>;
  if ("data" in o && o.data !== undefined) return o.data;
  return res;
}

function emptyAddress(): Address {
  return {
    id: 0,
    streetAddress: "",
    city: { id: 0, name: "", districts: [] },
    district: { id: 0, name: "", wards: [] },
    ward: { id: 0, name: "" },
  };
}

function normAddrPart(
  raw: unknown,
): { id: number; name: string } {
  if (!raw || typeof raw !== "object") return { id: 0, name: "" };
  const o = raw as Record<string, unknown>;
  return { id: num(o.id, 0), name: str(o.name) };
}

function normalizeAddressField(raw: unknown): Address {
  if (!raw || typeof raw !== "object") return emptyAddress();
  const o = raw as Record<string, unknown>;
  const cityR = o.city ?? o.City;
  const distR = o.district ?? o.District;
  const wardR = o.ward ?? o.Ward;
  return {
    id: num(o.id, 0),
    streetAddress: str(o.streetAddress ?? o.street_address),
    city: { ...normAddrPart(cityR), districts: [] },
    district: { ...normAddrPart(distR), wards: [] },
    ward: normAddrPart(wardR),
  };
}

function normalizeTagItem(raw: unknown): Tag | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = num(o.id, NaN);
  if (!Number.isFinite(id)) return null;
  const tag =
    str(o.tag) ||
    str(o.name) ||
    str(o.label) ||
    str(o.value) ||
    "";
  if (!tag) return null;
  return { id, tag };
}

function normalizeTagsField(raw: unknown): Tag[] {
  if (raw == null) return [];
  const arr = Array.isArray(raw) ? raw : Array.isArray((raw as { tags?: unknown }).tags) ? (raw as { tags: unknown[] }).tags : [];
  const out: Tag[] = [];
  for (const item of arr) {
    const t = normalizeTagItem(item);
    if (t) out.push(t);
  }
  return out;
}

/**
 * Map `ProfileResponse` backend (và biến thể snake_case) → `Profile` FE.
 */
export function normalizeProfileFromServer(raw: unknown): Profile | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = str(o.id) || str(o.userId) || str(o.user_id);
  if (!id) return null;

  return {
    id,
    fullName: str(o.fullName ?? o.full_name),
    gender: str(o.gender),
    avatarUrl: str(o.avatarUrl ?? o.avatar_url),
    budgetMin: num(o.budgetMin ?? o.budget_min, 0),
    budgetMax: num(o.budgetMax ?? o.budget_max, 0),
    isSmoker: boolOrNull(o.isSmoker ?? o.is_smoker),
    hasPet: boolOrNull(o.hasPet ?? o.has_pet),
    sleepSchedule:
      o.sleepSchedule != null || o.sleep_schedule != null
        ? str(o.sleepSchedule ?? o.sleep_schedule) || null
        : null,
    cleanliness: o.cleanliness != null ? num(o.cleanliness) : null,
    hometown: str(o.hometown),
    workplace: str(o.workplace),
    address: normalizeAddressField(o.address),
    tags: normalizeTagsField(o.tags),
  };
}

export type PublicUserFields = {
  fullName: string;
  username: string;
  avatarUrl: string | null;
};

/**
 * GET `/users/{id}/profile` — cùng DTO hồ sơ; có thể không có `username` (chỉ Roomie DTO).
 */
export function parsePublicUserProfileFromApi(res: unknown): PublicUserFields {
  const raw = unwrapApiPayload(res);
  if (raw == null || typeof raw !== "object") {
    return { fullName: "", username: "", avatarUrl: null };
  }
  const o = raw as Record<string, unknown>;
  const fullName =
    str(o.fullName ?? o.full_name) ||
    "";
  const username =
    str(o.username ?? o.user_name ?? o.login ?? o.preferredUsername ?? "");
  const avatar =
    (typeof o.avatarUrl === "string" && o.avatarUrl.trim()
      ? o.avatarUrl.trim()
      : null) ??
    (typeof o.avatar_url === "string" && o.avatar_url.trim() ? o.avatar_url.trim() : null);
  return { fullName, username, avatarUrl: avatar };
}

/** GET `/tags` (hoặc tương tự) — mảng tag hoặc `{ data: Tag[] }`. */
export function normalizeTagListFromApi(res: unknown): Tag[] {
  const raw = unwrapApiPayload(res);
  if (!Array.isArray(raw)) return [];
  const out: Tag[] = [];
  for (const item of raw) {
    const t = normalizeTagItem(item);
    if (t) out.push(t);
  }
  return out;
}
