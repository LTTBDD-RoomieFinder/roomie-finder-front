import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import qs from "qs";
import { Platform } from "react-native";

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "@/storage/token";

import { useAuthStore } from "@/stores/useAuthStore";

/** Android emulator: localhost is the emulator itself, not the dev machine. */
function rewriteLocalhostForAndroidEmulator(url: string): string {
  if (Platform.OS !== "android") return url;
  try {
    const normalized = /^https?:\/\//i.test(url) ? url : `http://${url}`;
    const u = new URL(normalized);
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h === "127.0.0.1") {
      u.hostname = "10.0.2.2";
      return `${u.protocol}//${u.host}${u.pathname}`.replace(/\/+$/, "");
    }
  } catch {
    /* keep url */
  }
  return url;
}

// Base URL: full API root (…/api/v1) or server root (…:8080); /api/v1 is appended when missing.
const RAW_API_URL = rewriteLocalhostForAndroidEmulator(
  (process.env.EXPO_PUBLIC_API_URL?.trim() || "http://localhost:8080").replace(
    /\/+$/,
    "",
  ),
);
const base = RAW_API_URL;
const API_URL = base.endsWith("/api/v1") ? base : base + "/api/v1";

const axiosRequest: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  paramsSerializer: (params: any) =>
    qs.stringify(params, {
      arrayFormat: "indices",
      allowDots: true,
    }),
});

const refreshAxios = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

type RefreshSubscriber = {
  onSuccess: (token: string) => void;
  onError: (error: unknown) => void;
};

let isRefreshing = false;
let subscribers: RefreshSubscriber[] = [];

const subscribeTokenRefresh = (cb: RefreshSubscriber) => {
  subscribers.push(cb);
};

const onRefreshed = (newToken: string) => {
  subscribers.forEach(({ onSuccess }) => onSuccess(newToken));
  subscribers = [];
};

const onRefreshFailed = (error: unknown) => {
  subscribers.forEach(({ onError }) => onError(error));
  subscribers = [];
};

axiosRequest.interceptors.request.use(
  async (config: any) => {
    const token = await getAccessToken();

    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    return config;
  },
  (error: any) => Promise.reject(error),
);

axiosRequest.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401) {
      if (originalRequest._retry) {
        await clearTokens();
        useAuthStore.getState().logout();
        return Promise.reject("Unauthorized");
      }

      originalRequest._retry = true;

      return new Promise((resolve, reject) => {
        subscribeTokenRefresh({
          onSuccess: (newToken: string) => {
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${newToken}`,
            };

            resolve(axiosRequest(originalRequest));
          },
          onError: (refreshError: unknown) => {
            reject(refreshError);
          },
        });

        if (!isRefreshing) {
          isRefreshing = true;

          (async () => {
            try {
              const refreshToken = await getRefreshToken();
              if (!refreshToken) throw new Error("No refresh token");

              const response = await refreshAxios.post("/auth/refresh", {
                refreshToken,
              });
              const body = response.data as {
                data: { accessToken: string; refreshToken?: string };
              };

              await setAccessToken(body.data.accessToken);
              if (body.data.refreshToken) {
                await setRefreshToken(body.data.refreshToken);
              }

              onRefreshed(body.data.accessToken);
            } catch {
              await clearTokens();
              useAuthStore.getState().logout();
              const sessionExpiredError = "Session expired";
              onRefreshFailed(sessionExpiredError);
              reject(sessionExpiredError);
            } finally {
              isRefreshing = false;
            }
          })();
        }
      });
    }

    if (error.code === AxiosError.ERR_NETWORK) {
      const hint =
        "Cannot reach server. Check: (1) Backend running on port 8080. (2) EXPO_PUBLIC_API_URL — use http://10.0.2.2:8080 on Android emulator if you mean your PC, or your PC LAN IP for a physical device. (3) After changing app.config (cleartext), rebuild Android dev client if not using Expo Go. Restart bundler: npx expo start -c.";
      return Promise.reject(hint);
    }

    const data = error.response?.data;
    const status = error.response?.status;
    let message: string;

    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      const msg =
        typeof obj.message === "string"
          ? obj.message
          : typeof obj.error === "string"
            ? obj.error
            : null;
      message =
        msg && msg.trim() ? msg : `Server error (${status ?? "?"})`;
    } else if (typeof data === "string" && data.trim()) {
      message = data.length > 200 ? data.slice(0, 200) + "…" : data;
    } else {
      message =
        status === 403
          ? "You don't have permission for this action"
          : status === 404
            ? "Not found"
            : status === 500
              ? "Server error, please try again later"
              : `Unexpected error (${status ?? "?"})`;
    }

    return Promise.reject(message);
  },
);

export default axiosRequest;