import axiosRequest from "@/config/axios";

export const amenityApi = {
  getAllAmenities() {
    return axiosRequest.get("/amenities");
  },
}