import axiosRequest from "@/config/axios";
import { LoginRequest, RegisterRequest } from "@/data/request";

export const authApi = {
  login: async (data: LoginRequest) => {
    const { data: response } = await axiosRequest.post("/auth/login", data);
    return response;
  },

  googleLogin: async (token: string) => {
    const { data: response } = await axiosRequest.post("/auth/outbound", {
      token,
    });
    return response;
  },

  register: async (data: RegisterRequest) => {
    const { data: response } = await axiosRequest.post("/auth/register", data);
    return response;
  },

  logout: async () => {
    await axiosRequest.post("/auth/logout");
  },
};
