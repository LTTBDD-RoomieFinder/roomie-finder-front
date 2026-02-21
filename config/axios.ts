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
const API_URL = process.env.EXPO_PUBLIC_API_URL;

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

              const data = await refreshAxios.post("/auth/refresh", {
                refreshToken,
              });

              await setAccessToken(data.data.accessToken);
              if (data.data.refreshToken) {
                await setRefreshToken(data.data.refreshToken);
              }

              onRefreshed(data.data.accessToken);
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
      return Promise.reject("Network error");
    }

    const message =
      typeof error.response?.data === "object" &&
      error.response?.data &&
      "message" in error.response.data
        ? (error.response.data as any).message
        : "Unexpected error";

    return Promise.reject(message);
  },
);

export default axiosRequest;
