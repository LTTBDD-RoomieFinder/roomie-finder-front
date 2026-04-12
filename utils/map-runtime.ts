import Constants from "expo-constants";
import { Platform } from "react-native";
import { PROVIDER_GOOGLE } from "react-native-maps";

/**
 * Key từ `app.config` → `extra.googleMapsApiKey` (build time) hoặc env đã inline.
 * Dùng để quyết định có bật Google Maps trên Android hay không.
 */
export function getGoogleMapsApiKey(): string {
  const extra = Constants.expoConfig?.extra as { googleMapsApiKey?: string } | undefined;
  const fromExtra = extra?.googleMapsApiKey?.trim() ?? "";
  if (fromExtra) return fromExtra;
  return (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "").trim();
}

/** iOS: Apple Maps (mặc định). Android: Google chỉ khi có API key hợp lệ. */
export function getNativeMapProvider(): typeof PROVIDER_GOOGLE | undefined {
  if (Platform.OS !== "android") return undefined;
  return getGoogleMapsApiKey() ? PROVIDER_GOOGLE : undefined;
}

export function mapUsesGoogleOnAndroid(): boolean {
  return Platform.OS === "android" && Boolean(getGoogleMapsApiKey());
}
