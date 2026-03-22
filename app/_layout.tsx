import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef } from "react";
import "react-native-reanimated";

import { useGlobalChatBadgeRealtime } from "@/hooks/use-global-chat-badge-realtime";
import { useNotificationSocket } from "@/hooks/use-notification-socket";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNotificationStore } from "@/stores/use-notification-store";
import { useRequestListRealtimeStore } from "@/stores/use-request-list-realtime-store";
import { useFcmToken } from "@/hooks/use-fcm-token";
import { useTabBadgeSync } from "@/hooks/use-tab-badge-sync";
import { syncTabBadgesToStore } from "@/services/tab-badge-service";
import { isRequestNotificationType } from "@/utils/notification-helpers";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const initialize = useAuthStore((s) => s.initialize);

  const requestBadgeSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const requestBadgeSyncFollowUpRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useNotificationSocket((notif) => {
    useNotificationStore.getState().notify(notif);
    const isReq = isRequestNotificationType(notif.type);
    if (isReq) {
      useRequestListRealtimeStore.getState().bumpRequestList();
      // Sau commit notification trên BE, GET thường đã đúng; sync ngay để badge khỏi chờ debounce/poll.
      void syncTabBadgesToStore();
      // Debounce thêm để bù race hiếm hoặc replica chậm.
      if (requestBadgeSyncTimerRef.current) {
        clearTimeout(requestBadgeSyncTimerRef.current);
      }
      if (requestBadgeSyncFollowUpRef.current) {
        clearTimeout(requestBadgeSyncFollowUpRef.current);
      }
      requestBadgeSyncTimerRef.current = setTimeout(() => {
        requestBadgeSyncTimerRef.current = null;
        void syncTabBadgesToStore();
      }, 450);
      requestBadgeSyncFollowUpRef.current = setTimeout(() => {
        requestBadgeSyncFollowUpRef.current = null;
        void syncTabBadgesToStore();
      }, 1200);
    } else {
      void syncTabBadgesToStore();
    }
  });

  // Upload FCM token to backend so we can push when app is background/killed.
  useFcmToken();

  useTabBadgeSync();

  // Badge + đồng bộ danh sách phòng khi có tin (không cần mở tab Chats trước).
  useGlobalChatBadgeRealtime();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isInitialized) return;

    // `useSegments()` typing can be strict; cast to string[] for safe includes().
    const seg = segments as unknown as string[];
    const first = seg[0];
    const inAuthGroup = seg.some((s) => s === "(auth)" || s.startsWith("(auth)"));
    const inTabsGroup = seg.some((s) => s === "(tabs)" || s.startsWith("(tabs)"));
    // Expo-router segments may vary by anchor/navigation; be tolerant.
    const inChat = seg.some((s) => s === "chat" || s.startsWith("chat"));
    const inRequest = seg.some((s) => s === "request" || s.startsWith("request"));
    const inPost = seg.some((s) => s === "post" || s.startsWith("post"));

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
      return;
    }

    if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)/home");
      return;
    }

    if (isAuthenticated && !inTabsGroup && !inAuthGroup && !inChat && !inRequest && !inPost) {
      router.replace("/(tabs)/home");
    }
  }, [isAuthenticated, isInitialized, router, segments]);

  if (!isInitialized) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="request" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="post" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
