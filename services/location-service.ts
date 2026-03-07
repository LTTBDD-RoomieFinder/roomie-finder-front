import { locationApi } from "@/apis/location-api";

export const locationService = {
  async getCities() {
    const response = await locationApi.getCities();
    return response.data;
  },

  async getDistricts(cityId: number) {
    const response = await locationApi.getDistricts(cityId);
    return response.data;
  },

  async getWards(districtId: number) {
    const response = await locationApi.getWards(districtId);
    return response.data;
  },
}