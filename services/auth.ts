import { authApi } from "@/apis/auth";
import { LoginRequest, RegisterRequest } from "@/data/request";
import { setAccessToken, setRefreshToken } from "@/storage/token";
import { useAuthStore } from "@/stores/useAuthStore";

export const authService = {
  async login(req: LoginRequest) {
    const { data } = await authApi.login(req);
    console.log("Login successful, response data:", data);
    await setAccessToken(data.accessToken);
    await setRefreshToken(data.refreshToken);

    useAuthStore.getState().setSession({
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });

    return data;
  },

  async googleLogin(token: string) {
    const { data } = await authApi.googleLogin(token);
    console.log("Google login successful, response data:", data);
  },

  async register(req: RegisterRequest) {
    const { data } = await authApi.register(req);
    return data;
  },

  async logout() {
    await useAuthStore.getState().logout();
  },
};
