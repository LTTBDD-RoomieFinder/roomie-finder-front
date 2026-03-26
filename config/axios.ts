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
              reject("Session expired");
            } finally {
              isRefreshing = false;
            }
          })();
        }
      });
    }

    if (error.code === AxiosError.ERR_NETWORK) {
      const hint =
        "Cannot reach server. Ensure backend is running (e.g. port 8080) and EXPO_PUBLIC_API_URL in .env is correct (e.g. http://localhost:8080). Restart with: npx expo start -c.";
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
