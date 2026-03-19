import { create } from "zustand";
import { clearTokens, getAccessToken, getRefreshToken } from "@/storage/token";
import { User } from "@/types/User";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;

  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  setSession: (payload: {
    user: User;
    accessToken: string;
    refreshToken: string;
  }) => void;
  /**
   * Update tokens after refresh without touching user/session.
   * Used so websocket code can reuse the latest access token.
   */
  updateTokens: (payload: {
    accessToken: string;
    refreshToken: string | null;
  }) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,

  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,

  initialize: async () => {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        getAccessToken(),
        getRefreshToken(),
      ]);

      const isAuthenticated = !!accessToken && !!refreshToken;

      set({
        accessToken,
        refreshToken,
        isAuthenticated,
        isLoading: false,
        isInitialized: true,
      });
    } catch {
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  setSession: ({ user, accessToken, refreshToken }) => {
    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },
  updateTokens: ({ accessToken, refreshToken }) => {
    set({
      accessToken,
      refreshToken,
      isAuthenticated: !!accessToken && !!refreshToken,
      isLoading: false,
      isInitialized: true,
    });
  },

  logout: async () => {
    await clearTokens();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true,
    });
  },
}));
