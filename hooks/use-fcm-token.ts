import { useEffect, useRef } from "react";
import Constants from "expo-constants";

import { notificationService } from "@/services/notification-service";
import { useAuthStore } from "@/stores/useAuthStore";

function getRnFirebaseMessagingModule(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("@react-native-firebase/messaging");
    return mod?.default ?? mod;
  } catch (e) {
    return null;
  }
}

function getExpoNotificationsModule(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("expo-notifications");
    return mod?.default ?? mod;
  } catch (e) {
    return null;
  }
}

/**
 * Upload device FCM token to backend.
 * - When app opens/foreground -> token is uploaded (used for FCM background delivery)
 * - onTokenRefresh -> keep backend token in sync
 */
export function useFcmToken() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  const lastTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;

    const isExpoGo = Constants.appOwnership === "expo";
    const rnMessaging = getRnFirebaseMessagingModule();
    // expo-notifications remote push support is removed from Expo Go (SDK 53+).
    // In Expo Go, skip requiring the module so the app doesn't spam errors.
    const expoNotifications = isExpoGo ? null : getExpoNotificationsModule();

    if (isExpoGo) {
      console.warn(
        "[FCM] Running in Expo Go: skip expo-notifications token registration. Use a development build for remote push.",
      );
    }

    if (!rnMessaging && !expoNotifications) {
      // Dependencies not installed/configured yet; keep app running.
      return;
    }

    let isMounted = true;

    const run = async () => {
      try {
        let token: string | null = null;
        let unsubscribe: (() => void) | null = null;

        if (rnMessaging) {
          // RNFirebase permissions + token
          await rnMessaging.requestPermission();
          token = await rnMessaging.getToken();
        } else if (expoNotifications) {
          // expo-notifications permissions + device token (Android FCM / iOS APNs)
          const current = await expoNotifications.getPermissionsAsync?.();
          if (current?.status !== "granted") {
            await expoNotifications.requestPermissionsAsync?.();
          }
          const pushToken = await expoNotifications.getDevicePushTokenAsync?.();
          token = pushToken?.data ?? pushToken ?? null;
        }

        if (!isMounted) return;

        if (!token) return;
        if (lastTokenRef.current === token) return;

        lastTokenRef.current = token;
        await notificationService.upsertFcmToken(token);
      } catch (e) {
        // Do not crash app if FCM isn't configured.
        console.warn("[FCM] token upload skipped", e);
      }
    };

    run().catch(() => undefined);

    let cleanup: (() => void) | null = null;
    if (rnMessaging?.onTokenRefresh) {
      cleanup = rnMessaging.onTokenRefresh(async (token: string | null) => {
        try {
          if (!token) return;
          if (!isMounted) return;
          if (lastTokenRef.current === token) return;
          lastTokenRef.current = token;
          await notificationService.upsertFcmToken(token);
        } catch (e) {
          console.warn("[FCM] onTokenRefresh upload failed", e);
        }
      });
    }

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [isAuthenticated, isInitialized]);
}

