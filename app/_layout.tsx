import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuthStore } from "@/stores/useAuthStore";

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
