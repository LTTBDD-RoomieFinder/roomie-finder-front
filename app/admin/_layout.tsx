import { ActivityIndicator, View } from "react-native";
import { Redirect, Stack } from "expo-router";

import { useAuthStore } from "@/stores/useAuthStore";
import { decodeJwtPayload } from "@/utils/jwt";

export default function AdminLayout() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const user = useAuthStore((s) => s.user);

  // Wait until store is hydrated from AsyncStorage before deciding
  if (!isInitialized) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  // Primary check: in-memory user roles (set at login)
  const rolesFromUser = user?.roles ?? [];

  // Fallback: decode JWT scope — works even after app restart when user obj is null
  const jwtPayload = accessToken ? decodeJwtPayload(accessToken) : null;
  const scopeFromJwt = typeof jwtPayload?.scope === "string" ? jwtPayload.scope : "";
  const rolesFromJwt = Array.isArray(jwtPayload?.roles)
    ? (jwtPayload!.roles as string[])
    : [];

  const isAdmin =
    rolesFromUser.includes("ADMIN") ||
    rolesFromJwt.includes("ADMIN") ||
    scopeFromJwt === "ADMIN";

  if (!isAdmin) {
    return <Redirect href="/(tabs)/profile" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="verifications" />
    </Stack>
  );
}
