import axiosRequest from "@/config/axios";
import { LoginRequest } from "@/data/request";

export const authApi = {
  login: (data: LoginRequest) => {
    return axiosRequest.post("/auth/login", data);
  },
};
