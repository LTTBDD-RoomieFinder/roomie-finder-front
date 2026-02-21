import axiosRequest from "@/config/axios";
import { LoginRequest, RegisterRequest } from "@/data/request";

export const authApi = {
  login: (data: LoginRequest) => axiosRequest.post("/auth/login", data),

  googleLogin: (token: string) =>
    axiosRequest.post("/auth/outbound", { token }),

  register: (data: RegisterRequest) =>
    axiosRequest.post("/auth/register", data),

  logout: () => axiosRequest.post("/auth/logout"),
};
