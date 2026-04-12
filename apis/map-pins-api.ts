import axiosRequest from "@/config/axios";
import { MapPinsBBoxRequest } from "@/data/request";

/**
 * Backend: `GET /api/v1/search/map-pins`
 * Query bắt buộc (camelCase): minLat, maxLat, minLng, maxLng — thiếu → 400 validation.
 */
export const mapPinsApi = {
  getPinsInBounds(params: MapPinsBBoxRequest, signal?: AbortSignal) {
    return axiosRequest.get("/search/map-pins", {
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