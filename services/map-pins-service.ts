import { mapPinsApi } from "@/apis/map-pins-api";
import type { MapPinRequest } from "@/data/request";
import { MapPinGeoItem } from "@/data/response";

/**
 * `getMapPins(MapPinRequest)` → `PostMapResponse[]` trong `ApiResponse.data`.
 * Interceptor axios trả về body JSON; unwrap một lớp `data` nếu có.
 */
function extractMapPinsPayload(raw: unknown): unknown {
  if (raw === null || typeof raw !== "object") return raw;
  if ("data" in raw && (raw as { data: unknown }).data !== undefined) {
    return (raw as { data: unknown }).data;
  }
  return raw;
}

/** Jackson có thể gửi BigDecimal là number hoặc string. */
function toFiniteNumber(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Khớp `com.group5.roomiefinder.dto.response.post.PostMapResponse`:
 * id, lat, lng, title, price, thumbnailUrl; shortTitle thường không được serialize
 * từ default method — fallback giống `getShortTitle()` phía Java.
 */
function shortTitleLikeJava(title: string): string | undefined {
  const t = title.trim();
  if (!t) return undefined;
  if (t.length > 30) return `${t.slice(0, 30)}...`;
  return t;
}

function normalizePin(row: unknown): MapPinGeoItem | null {
  if (row === null || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  const id = Number(o.id);
  const lat = Number(o.lat);
  const lng = Number(o.lng);
  if (!Number.isFinite(id) || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  const price = toFiniteNumber(o.price) ?? 0;

  const title =
    typeof o.title === "string"
      ? o.title
      : typeof o.post_title === "string"
        ? o.post_title
        : "";

  const thumbRaw = o.thumbnailUrl ?? o.thumbnail_url;
  let thumbnailUrl: string | null = null;
  if (typeof thumbRaw === "string") {
    const u = thumbRaw.trim();
    if (u.length > 0) thumbnailUrl = u;
  }

  const shortRaw = o.shortTitle ?? o.short_title;
  let shortTitle: string | undefined;
  if (typeof shortRaw === "string" && shortRaw.trim() !== "") {
    shortTitle = shortRaw.trim();
  } else {
    shortTitle = shortTitleLikeJava(title);
  }

  return {
    id,
    lat,
    lng,
    price,
    title,
    thumbnailUrl,
    shortTitle,
  };
}

export const mapPinsService = {
  async getPinsInBounds(
    bounds: MapPinRequest,
    signal?: AbortSignal,
  ): Promise<MapPinGeoItem[]> {
    const raw = await mapPinsApi.getPinsInBounds(bounds, signal);
    const payload = extractMapPinsPayload(raw);
    if (!Array.isArray(payload)) return [];

    const out: MapPinGeoItem[] = [];
    for (const row of payload) {
      const pin = normalizePin(row);
      if (pin) out.push(pin);
    }
    return out;
  },
};
