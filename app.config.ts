import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * - Không thêm `react-native-maps` vào `plugins` (package không có Expo config plugin hợp lệ).
 * - Google Maps Android: `android.config.googleMaps.apiKey` (prebuild / EAS).
 * - Runtime đọc key qua `extra.googleMapsApiKey` + `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  const android = { ...(config.android ?? {}) };
  const ios = { ...(config.ios ?? {}) };
  const iosAts = ios.infoPlist?.NSAppTransportSecurity;
  const extra = {
    ...(typeof config.extra === "object" && config.extra !== null ? config.extra : {}),
    googleMapsApiKey,
  };

  const plugins = [...((config.plugins ?? []) as NonNullable<ExpoConfig["plugins"]>), [
    "expo-location",
    {
      locationWhenInUsePermission:
        "Roomie Finder cần vị trí của bạn để hiển thị trên bản đồ và mở chỉ đường trên Google Maps.",
    },
  ] as const];

  return {
    ...config,
    extra,
    plugins,
    android: {
      ...android,
      // HTTP API (EXPO_PUBLIC_API_URL) — without this, Android blocks cleartext and axios reports ERR_NETWORK.
      usesCleartextTraffic: true,
      config: {
        ...android.config,
        googleMaps: {
          ...android.config?.googleMaps,
          apiKey: googleMapsApiKey,
        },
      },
    },
    ios: {
      ...ios,
      infoPlist: {
        ...ios.infoPlist,
        NSAppTransportSecurity: {
          ...(typeof iosAts === "object" && iosAts !== null ? iosAts : {}),
          NSAllowsLocalNetworking: true,
        },
      },
      config: {
        ...ios.config,
        googleMapsApiKey,
      },
    },
  } as ExpoConfig;
};
