import { authApi } from "@/apis/auth";
import { LoginRequest, RegisterRequest } from "@/data/request";
import { setAccessToken, setRefreshToken } from "@/storage/token";
import { useAuthStore } from "@/stores/useAuthStore";

export const authService = {
  async login(req: LoginRequest) {
    const { data: response } = await authApi.login(req);
    if (
      typeof response?.accessToken !== "string" ||
      typeof response?.refreshToken !== "string"
    ) {
      throw new Error("Invalid login response");
    }

    await setAccessToken(response.accessToken);
    await setRefreshToken(response.refreshToken);

    if (response?.user) {
      useAuthStore.getState().setSession({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });
    }

    return response;
  },

  async googleLogin(token: string) {
    const { data } = await authApi.googleLogin(token);
    if (
      typeof data?.accessToken === "string" &&
      typeof data?.refreshToken === "string"
    ) {
      await setAccessToken(data.accessToken);
      await setRefreshToken(data.refreshToken);

      if (data?.user) {
        useAuthStore.getState().setSession({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });
      }
    }

    return data;
  },

  async register(req: RegisterRequest) {
    const data: any = await authApi.register(req);
    return data;
  },

  async logout() {
    await useAuthStore.getState().logout();
    await authApi.logout();
  },
};
