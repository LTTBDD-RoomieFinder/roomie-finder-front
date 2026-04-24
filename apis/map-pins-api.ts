import axiosRequest from "@/config/axios";
import type { MapPinRequest } from "@/data/request";

/**
 * Map pins — khớp backend:
 * `@GetMapping("/map-pins") ApiResponse<List<PostMapResponse>> getMapPins(@Valid MapPinRequest request)`
 *
 * Controller cần có prefix **`/search`** (vd. `@RequestMapping("/api/v1/search")`) để full path là
 * `GET /api/v1/search/map-pins` — trùng với `axios` `baseURL` + `MAP_PINS_PATH`.
 *
 * Query (camelCase): `minLat`, `maxLat`, `minLng`, `maxLng`.
 * Response `data[]`: `id`, `lat`, `lng`, `title`, `price`, `thumbnailUrl` (`PostMapResponse`).
 */
export const MAP_PINS_PATH = "/search/map-pins" as const;

export const mapPinsApi = {
  getPinsInBounds(params: MapPinRequest, signal?: AbortSignal) {
    return axiosRequest.get(MAP_PINS_PATH, {
      params: {
        minLat: params.minLat,
        maxLat: params.maxLat,
        minLng: params.minLng,
        maxLng: params.maxLng,
      },
      signal,
    });
  },
};