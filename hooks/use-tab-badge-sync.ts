import { useCallback, useEffect } from "react";

import { AppState, type AppStateStatus } from "react-native";



import { useAuthStore } from "@/stores/useAuthStore";

import { useNotificationStore } from "@/stores/use-notification-store";

import { syncTabBadgesToStore } from "@/services/tab-badge-service";



/** Khoảng gọi lại GET /me/tab-badges khi app đang foreground (bù khi STOMP không kịp / mất frame). */

const TAB_BADGE_POLL_MS = 12000;



/** Loads tab badge counts after auth (single GET /me/tab-badges). */

export function useTabBadgeSync() {

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const isInitialized = useAuthStore((s) => s.isInitialized);

  const accessToken = useAuthStore((s) => s.accessToken);



  const refresh = useCallback(() => {

    void syncTabBadgesToStore();

  }, []);



  // Không gating theo accessToken trong Zustand: interceptor đọc token từ storage;

  // gating theo token store dễ bỏ lỡ sync sau login (race) hoặc khi store chưa kịp cập nhật.

  useEffect(() => {

    if (!isInitialized) return;

    if (!isAuthenticated) {

      useNotificationStore.getState().setRequestUnreadCount(0);

      useNotificationStore.getState().setChatUnreadRoomsCount(0);

      return;

    }

    void syncTabBadgesToStore();

  }, [isAuthenticated, isInitialized, accessToken]);



  useEffect(() => {

    if (!isInitialized || !isAuthenticated) return;



    const runIfActive = () => {

      if (AppState.currentState === "active") {

        void syncTabBadgesToStore();

      }

    };



    const interval = setInterval(runIfActive, TAB_BADGE_POLL_MS);



    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {

      if (next === "active") {

        void syncTabBadgesToStore();

      }

    });



    return () => {

      clearInterval(interval);

      sub.remove();

    };

  }, [isAuthenticated, isInitialized, accessToken]);



  return refresh;

}

