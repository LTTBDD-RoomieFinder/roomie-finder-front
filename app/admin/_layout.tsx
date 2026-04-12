import { Redirect, Stack } from "expo-router";

import { useAuthStore } from "@/stores/useAuthStore";

export default function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.roles?.includes("ADMIN") ?? false;

  if (!isAdmin) {
    return <Redirect href="/(tabs)/profile" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="verifications" />
    </Stack>
  );
}
