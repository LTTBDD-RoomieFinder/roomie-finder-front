import { Stack } from "expo-router";

/**
 * Lightweight layout — NO zustand, NO auth checks here.
 * Role guard lives inside each screen to avoid expo-router
 * pre-render triggering useSyncExternalStore loops.
 */
export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="verifications" />
      <Stack.Screen name="reports" />
    </Stack>
  );
}
