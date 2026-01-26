import { authApi } from "@/apis/auth";
import { LoginRequest } from "@/data/request";
import { setAccessToken, setRefreshToken } from "@/storage/token";
import { useAuthStore } from "@/stores/useAuthStore";

export const authService = {
  async login(req: LoginRequest) {
    const { data } = await authApi.login(req);
    await setAccessToken(data.accessToken);
    await setRefreshToken(data.refreshToken);

    useAuthStore.getState().setSession({
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });

    return data;
  },

  async logout() {
    await useAuthStore.getState().logout();
  },
};
