import axiosRequest from "@/config/axios";
import { CreateProfileRequest, UpdateProfileRequest } from "@/data/request";

export const profileApi = {
  getProfile: () => {
    return axiosRequest.get("/me/profile");
  },

  createProfile: (data: CreateProfileRequest) => {
    return axiosRequest.post("/me/profile", data);
  },

  updateProfile: (data: UpdateProfileRequest) => {
    return axiosRequest.put("/me/profile", data);
  },
};
