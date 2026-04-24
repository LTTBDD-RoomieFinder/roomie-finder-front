import { amenityApi } from "@/apis/amenity-api"

export const AmenityService = {
  async getAllAmenities() {
    const res = await amenityApi.getAllAmenities();
    return res.data;
  }
}