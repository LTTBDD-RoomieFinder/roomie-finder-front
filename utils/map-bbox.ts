import type { Region } from "react-native-maps";

import type { MapPinsBBoxRequest } from "@/data/request";

/**
 * Spring `MapPinRequest`: minLat, maxLat, minLng, maxLng — camelCase, @NotNull.
 * Luôn đảm bảo min ≤ max để `BETWEEN` trên backend không rỗng do đảo min/max.
 */
export function regionToMapPinsQuery(region: Region): MapPinsBBoxRequest {
  const halfLat = Math.max(region.latitudeDelta / 2, 1e-8);
  const halfLng = Math.max(region.longitudeDelta / 2, 1e-8);

  let minLat = region.latitude - halfLat;
  let maxLat = region.latitude + halfLat;
  let minLng = region.longitude - halfLng;
  let maxLng = region.longitude + halfLng;

  if (minLat > maxLat) {
    const t = minLat;
    minLat = maxLat;
    maxLat = t;
  }
  if (minLng > maxLng) {
    const t = minLng;
    minLng = maxLng;
    maxLng = t;
  }

  minLat = clamp(minLat, -90, 90);
  maxLat = clamp(maxLat, -90, 90);
  minLng = clamp(minLng, -180, 180);
  maxLng = clamp(maxLng, -180, 180);

  return {
    minLat: round6(minLat),
    maxLat: round6(maxLat),
    minLng: round6(minLng),
    maxLng: round6(maxLng),
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
