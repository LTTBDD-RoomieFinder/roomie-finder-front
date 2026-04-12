import { mapPinsApi } from "@/apis/map-pins-api";
import { MapPinsBBoxRequest } from "@/data/request";
import { MapPinGeoItem } from "@/data/response";

/**
 * Backend: `ApiResponse<List<PostMapResponse>>` — body JSON có field `data` là mảng.
 * Interceptor axios trả về `response.data` (= toàn bộ body), nên cần lấy `.data`.
 */
function extractMapPinsPayload(raw: unknown): unknown {
  if (raw === null || typeof raw !== "object") return raw;
  if ("data" in raw && (raw as { data: unknown }).data !== undefined) {
    return (raw as { data: unknown }).data;
  }
  return raw;
}

function normalizePin(row: unknown): MapPinGeoItem | null {
  if (row === null || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  const id = Number(o.id);
  const lat = Number(o.lat);
  const lng = Number(o.lng);
  const price = Number(o.price);
  if (!Number.isFinite(id) || !Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(price)) {
    return null;
  }
  const title = typeof o.title === "string" ? o.title : "";
  const thumbnailUrl =
    o.thumbnailUrl === null || o.thumbnailUrl === undefined
      ? null
      : typeof o.thumbnailUrl === "string"
        ? o.thumbnailUrl
        : null;
  const shortTitle =
    o.shortTitle === null || o.shortTitle === undefined
      ? undefined
      : typeof o.shortTitle === "string"
        ? o.shortTitle
        : undefined;

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
    bounds: MapPinsBBoxRequest,
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
