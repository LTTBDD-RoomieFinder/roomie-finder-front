import axiosRequest from "@/config/axios";

export const locationApi = {
  getCities: () => axiosRequest.get("/locations/cities"),
  getDistricts: (cityId: number) => axiosRequest.get(`/locations/cities/${cityId}/districts`),
  getWards: (districtId: number) => axiosRequest.get(`/locations/districts/${districtId}/wards`),
}