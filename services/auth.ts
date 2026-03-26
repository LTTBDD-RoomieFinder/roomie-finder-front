import { authApi } from "@/apis/auth";
import { LoginRequest, RegisterRequest } from "@/data/request";
import { clearTokens, setAccessToken, setRefreshToken } from "@/storage/token";
import { useAuthStore } from "@/stores/useAuthStore";

export const authService = {
  async login(req: LoginRequest) {
    const response = await authApi.login(req);
    const payload = response?.data ?? response;
    if (
      typeof payload?.accessToken !== "string" ||
      typeof payload?.refreshToken !== "string"
    ) {
      throw new Error("Invalid login response");
    }

    await setAccessToken(payload.accessToken);
    await setRefreshToken(payload.refreshToken);

    if (payload?.user) {
      useAuthStore.getState().setSession({
        user: payload.user,
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
      });
    }

    return payload;
  },

  async googleLogin(token: string) {
    const response = await authApi.googleLogin(token);
    const payload = response?.data ?? response;
    if (
      typeof payload?.accessToken === "string" &&
      typeof payload?.refreshToken === "string"
    ) {
      await setAccessToken(payload.accessToken);
      await setRefreshToken(payload.refreshToken);

      if (payload?.user) {
        useAuthStore.getState().setSession({
          user: payload.user,
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
        });
      }
    }

    return payload;
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
