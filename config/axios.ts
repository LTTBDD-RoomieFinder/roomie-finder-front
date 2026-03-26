import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import qs from "qs";

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "@/storage/token";

import { useAuthStore } from "@/stores/useAuthStore";

// Base URL: use full path to API (e.g. http://localhost:8080/api/v1) or server root (http://localhost:8080).
// If root is given, /api/v1 is appended to match backend (AuthController, RequestController).
const RAW_API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";
const base = RAW_API_URL.replace(/\/+$/, "");
const API_URL = (() => {
  // Handle common typo: /auth/v1 -> /api/v1
  const normalized = base.replace(/\/auth\/v\d+$/i, "/api/v1");
  // If URL already points to an API version, keep it.
  if (/\/api\/v\d+$/i.test(normalized)) return normalized;
  return normalized + "/api/v1";
})();

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

type RefreshSubscriber = (token: string) => void;

let isRefreshing = false;
let subscribers: RefreshSubscriber[] = [];

const subscribeTokenRefresh = (cb: RefreshSubscriber) => {
  subscribers.push(cb);
};

const onRefreshed = (newToken: string) => {
  subscribers.forEach((cb) => cb(newToken));
  subscribers = [];
};

const isAuthPublicPath = (url?: string) => {
  if (!url) return false;
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/outbound") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/logout")
  );
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
    const requestUrl = originalRequest?.url;

    if (error.response?.status === 401 && !isAuthPublicPath(requestUrl)) {
      if (originalRequest._retry) {
        await clearTokens();
        useAuthStore.getState().logout();
        return Promise.reject("Unauthorized");
      }

      originalRequest._retry = true;

      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newToken: string) => {
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${newToken}`,
          };

          resolve(axiosRequest(originalRequest));
        });

        if (!isRefreshing) {
          isRefreshing = true;

          (async () => {
            try {
              const refreshToken = await getRefreshToken();
              if (!refreshToken) throw new Error("No refresh token");

              const data = await refreshAxios.post("/auth/refresh", {
                refreshToken,
              });
              const payload = data?.data ?? data;

              await setAccessToken(payload.accessToken);
              if (payload.refreshToken) {
                await setRefreshToken(payload.refreshToken);
              }
              useAuthStore.getState().updateTokens({
                accessToken: payload.accessToken,
                refreshToken: payload.refreshToken ?? null,
              });

              onRefreshed(payload.accessToken);
            } catch {
              await clearTokens();
              useAuthStore.getState().logout();
              reject("Session expired");
            } finally {
              isRefreshing = false;
            }
          })();
        }
      });
    }

    if (error.code === AxiosError.ERR_NETWORK) {
      const cfg = error.config as AxiosRequestConfig | undefined;
      const url = cfg?.url ? `${cfg.baseURL ?? ""}${cfg.url}` : API_URL;
      const hint =
        `Cannot reach backend (no response) at ${url}. This usually means wrong EXPO_PUBLIC_API_URL, device can't access host, or browser blocked the request (CORS/preflight).
        Open browser Console/Network to see the real CORS/preflight error. Original error: ${error.message}`;
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
              : status == null
                ? "Request failed before reaching backend (possible CORS/network issue)"
                : `Unexpected error (${status})`;
    }

    return Promise.reject(message);
  },
);

export default axiosRequest;
