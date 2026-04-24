import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import Constants from "expo-constants";

import { notificationService } from "@/services/notification-service";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  notificationPermissionsAllowPresentation,
  requestNotificationPermissionsForPushAsync,
} from "@/utils/notification-permissions";

function getRnFirebaseMessagingModule(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("@react-native-firebase/messaging");
    return mod?.default ?? mod;
  } catch {
    return null;
  }
}

function getExpoNotificationsModule(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("expo-notifications");
    return mod?.default ?? mod;
  } catch {
    return null;
  }
}

const TOKEN_DEBOUNCE_MS = 400;

/**
 * 1) Xin quyền thông báo (hộp thoại iOS + Android 13+ POST_NOTIFICATIONS) sau khi đăng nhập
 * 2) Đăng ký token FCM / APNs lên backend (bản dev / production, không dùng Expo Go cho remote)
 * 3) Làm mới token khi app từ Cài đặt quay lại (user vừa bật quyền)
 */
export function useFcmToken() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  const lastTokenRef = useRef<string | null>(null);
  const appStateSubRef = useRef<ReturnType<typeof AppState.addEventListener> | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;

    const isExpoGo = Constants.appOwnership === "expo";
    const rnMessaging = getRnFirebaseMessagingModule();
    const expoNotifications = isExpoGo ? null : getExpoNotificationsModule();

    let isMounted = true;
    let messagingCleanup: (() => void) | null = null;

    const uploadToken = async (token: string) => {
      if (!isMounted) return;
      if (lastTokenRef.current === token) return;
      lastTokenRef.current = token;
      try {
        await notificationService.upsertFcmToken(token);
      } catch (e) {
        console.warn("[FCM] upsertFcmToken failed", e);
      }
    };

    const tryRegisterPushToken = async () => {
      if (!isMounted) return;
      if (!getExpoNotificationsModule() && !getRnFirebaseMessagingModule()) {
        return;
      }

      try {
        if (rnMessaging) {
          await rnMessaging.requestPermission();
          const token = await rnMessaging.getToken();
          if (token) await uploadToken(String(token));
          return;
        }
        if (expoNotifications) {
          const current = await expoNotifications.getPermissionsAsync?.();
          if (!current || !notificationPermissionsAllowPresentation(current)) {
            return;
          }
          const pushToken = await expoNotifications.getDevicePushTokenAsync?.();
          const t =
            pushToken?.data != null
              ? String(pushToken.data)
              : pushToken != null
                ? String(pushToken)
                : null;
          if (t) await uploadToken(t);
        }
      } catch (e) {
        console.warn("[FCM] token register skipped", e);
      }
    };

    const run = async () => {
      try {
        await requestNotificationPermissionsForPushAsync();
      } catch (e) {
        console.warn("[FCM] permission request", e);
      }
      if (!isMounted) return;

      if (isExpoGo) {
        console.warn(
          "[FCM] Expo Go: quyền thông báo (local) đã xin; push remote cần bản dev/production.",
        );
        return;
      }

      if (!rnMessaging && !expoNotifications) {
        return;
      }

      await tryRegisterPushToken();

      if (rnMessaging?.onTokenRefresh) {
        messagingCleanup = rnMessaging.onTokenRefresh(async (token: string | null) => {
          if (!token || !isMounted) return;
          await uploadToken(String(token));
        });
      }
    };

    void run().catch(() => undefined);

    const scheduleTokenRefresh = () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        if (!isExpoGo) void tryRegisterPushToken();
      }, TOKEN_DEBOUNCE_MS);
    };

    const onAppState = (next: AppStateStatus) => {
      if (next === "active") scheduleTokenRefresh();
    };
    appStateSubRef.current = AppState.addEventListener("change", onAppState);

    return () => {
      isMounted = false;
      messagingCleanup?.();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      appStateSubRef.current?.remove();
      appStateSubRef.current = null;
    };
  }, [isAuthenticated, isInitialized]);
}
