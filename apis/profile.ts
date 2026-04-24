import axiosRequest from "@/config/axios";
import { CreateProfileRequest, UpdateProfileRequest } from "@/data/request";

export const profileApi = {
  getProfile: () => axiosRequest.get("/me/profile"),

  createProfile: (data: CreateProfileRequest) =>
    axiosRequest.post("/me/profile", data),

  updateProfile: (data: UpdateProfileRequest) =>
    axiosRequest.put("/me/profile", data),

  /** Public endpoint — returns another user's profile (avatarUrl, fullName…). */
  getUserProfile: (userId: string | number) => {
    const id = String(userId).trim();
    if (!id) {
      return Promise.reject("Invalid user id");
    }
    return axiosRequest.get(
      `/users/${encodeURIComponent(id)}/profile`,
    );
  },
};
