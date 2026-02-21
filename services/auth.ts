import { authApi } from "@/apis/auth";
import { LoginRequest, RegisterRequest } from "@/data/request";
import { clearTokens, setAccessToken, setRefreshToken } from "@/storage/token";
import { useAuthStore } from "@/stores/useAuthStore";

export const authService = {
  async login(req: LoginRequest) {
    const response = await authApi.login(req);
    console.log(response);
    if (
      typeof response?.data?.accessToken !== "string" ||
      typeof response?.data?.refreshToken !== "string"
    ) {
      throw new Error("Invalid login response");
    }

    await setAccessToken(response.data?.accessToken);
    await setRefreshToken(response.data?.refreshToken);

    if (response?.data?.user) {
      useAuthStore.getState().setSession({
        user: response.data?.user,
        accessToken: response.data?.accessToken,
        refreshToken: response.data?.refreshToken,
      });
    }

    return response;
  },

  async googleLogin(token: string) {
    const response = await authApi.googleLogin(token);
    if (
      typeof response?.data?.accessToken === "string" &&
      typeof response?.data?.refreshToken === "string"
    ) {
      await setAccessToken(response?.data?.accessToken);
      await setRefreshToken(response?.data?.refreshToken);

      if (response?.data?.user) {
        useAuthStore.getState().setSession({
          user: response?.data?.user,
          accessToken: response?.data?.accessToken,
          refreshToken: response?.data?.refreshToken,
        });
      }
    }

    return response;
  },

  async register(req: RegisterRequest) {
    const data: any = await authApi.register(req);
    return data;
  },

  async logout() {
    try {
      await authApi.logout();
    } finally {
      await clearTokens();
      useAuthStore.getState().logout();
    }
  },
};
