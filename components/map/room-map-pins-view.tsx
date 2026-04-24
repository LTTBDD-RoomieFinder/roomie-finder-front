import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import MapView, { type Region } from "react-native-maps";
import { BlurView } from "expo-blur";
import { isAxiosError } from "axios";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MapRadarCircles } from "@/components/map/map-radar-circles";
import { MapScanSweepOverlay } from "@/components/map/map-scan-sweep-overlay";
import { RoomMapPin } from "@/components/map/room-map-pin";
import { RoomPreviewSheet } from "@/components/map/room-preview-sheet";
import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { mapPinsService } from "@/services/map-pins-service";
import { postService } from "@/services/post-service";
import type { MapPinGeoItem, PostResponse } from "@/data/response";
import { regionToMapPinsQuery } from "@/utils/map-bbox";
import { getNativeMapProvider, mapUsesGoogleOnAndroid } from "@/utils/map-runtime";
import { mergeMapPinIntoPostPreview } from "@/utils/normalize-post";

const DEFAULT_REGION: Region = {
  latitude: 21.0285,
  longitude: 105.8542,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

/** Giới hạn marker để tránh jank khi payload lớn. */
const MAX_VISIBLE_PINS = 220;
const DEBOUNCE_MS = 420;

const NEARBY_DELTA = 0.028;

function parseHexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "").trim();
  if (h.length === 6) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }
  if (h.length === 3) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    };
  }
  return { r: 99, g: 102, b: 241 };
}

function hasRenderableCoordinates(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  // (0,0) hoặc gần 0 — thường là dữ liệu thiếu, marker không nên vẽ
  if (Math.abs(lat) < 1e-6 && Math.abs(lng) < 1e-6) return false;
  return true;
}

type Props = {
  initialRegion?: Region;
};

export function RoomMapPinsView({ initialRegion = DEFAULT_REGION }: Props) {
  const router = useRouter();
  const { color, scheme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { t, locale } = useLanguage();
  const mapRef = useRef<MapView | null>(null);
  const primaryRgb = useMemo(() => parseHexToRgb(color.primary), [color.primary]);

  const [pins, setPins] = useState<MapPinGeoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected pin + preview sheet state
  const [selectedPinId, setSelectedPinId] = useState<number | null>(null);
  const [previewPost, setPreviewPost] = useState<PostResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewFetchSeqRef = useRef(0);
  const [showUserLocation, setShowUserLocation] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [scanCenter, setScanCenter] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const regionRef = useRef<Region>(initialRegion);
  const abortRef = useRef<AbortController | null>(null);
  const fetchSeqRef = useRef(0);

  const mapProvider = useMemo(() => getNativeMapProvider(), []);

  const pinsOnMap = useMemo(
    () => pins.filter((p) => hasRenderableCoordinates(p.lat, p.lng)),
    [pins],
  );
  const visiblePins = useMemo(
    () => pinsOnMap.slice(0, MAX_VISIBLE_PINS),
    [pinsOnMap],
  );
  const hiddenCount = Math.max(0, pinsOnMap.length - visiblePins.length);

  const runDebouncedFetch = useCallback(
    (region: Region) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const seq = ++fetchSeqRef.current;
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        const bbox = regionToMapPinsQuery(region);
        const signal = controller.signal;

        if (__DEV__) {
          console.log("[map-pins] bbox → GET /search/map-pins", bbox);
        }

        setLoading(true);
        setError(null);

        mapPinsService
          .getPinsInBounds(bbox, signal)
          .then((data) => {
            if (seq !== fetchSeqRef.current || signal.aborted) return;
            setPins(data);
          })
          .catch((e) => {
            if (seq !== fetchSeqRef.current || signal.aborted) return;
            if (isAxiosError(e) && e.code === "ERR_CANCELED") return;
            const msg =
              typeof e === "string"
                ? e
                : e instanceof Error
                  ? e.message
                  : t("map.loadPinsError");
            setError(msg);
            setPins([]);
          })
          .finally(() => {
            if (seq === fetchSeqRef.current) setLoading(false);
          });
      }, DEBOUNCE_MS);
    },
    [t],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!cancelled) setShowUserLocation(status === Location.PermissionStatus.GRANTED);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onRegionChangeComplete = useCallback(
    (region: Region) => {
      regionRef.current = region;
      runDebouncedFetch(region);
    },
    [runDebouncedFetch],
  );

  const onMapReady = useCallback(() => {
    regionRef.current = initialRegion;
    runDebouncedFetch(initialRegion);
  }, [initialRegion, runDebouncedFetch]);

  /** Tap on a pin → fetch post detail and open preview sheet. */
  const handlePinPress = useCallback(
    async (pin: MapPinGeoItem) => {
      // If same pin tapped twice → close
      if (selectedPinId === pin.id) {
        setSelectedPinId(null);
        setPreviewPost(null);
        return;
      }

      setSelectedPinId(pin.id);
      setPreviewPost(null);
      setPreviewLoading(true);

      const seq = ++previewFetchSeqRef.current;
      try {
        const post = await postService.getPostById(pin.id);
        if (seq !== previewFetchSeqRef.current) return;
        setPreviewPost(mergeMapPinIntoPostPreview(post, pin));
      } catch (e) {
        if (seq !== previewFetchSeqRef.current) return;
        const msg =
          typeof e === "string"
            ? e
            : e instanceof Error
              ? e.message
              : t("map.openRoomFailed");
        Alert.alert(t("common.error"), msg);
        setSelectedPinId(null);
      } finally {
        if (seq === previewFetchSeqRef.current) setPreviewLoading(false);
      }
    },
    [selectedPinId, t],
  );

  const handleCloseSheet = useCallback(() => {
    setSelectedPinId(null);
    setPreviewPost(null);
    setPreviewLoading(false);
  }, []);

  const handleViewDetails = useCallback(
    (roomId: number) => {
      handleCloseSheet();
      router.push({
        pathname: "/(tabs)/room/[id]",
        params: { id: roomId, from: "map" },
      });
    },
    [handleCloseSheet, router],
  );

  const retry = useCallback(() => {
    runDebouncedFetch(regionRef.current);
  }, [runDebouncedFetch]);

  const ensureLocationPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === Location.PermissionStatus.GRANTED) return true;
    const { status: next } = await Location.requestForegroundPermissionsAsync();
    if (next === Location.PermissionStatus.GRANTED) {
      setShowUserLocation(true);
      return true;
    }
    Alert.alert(
      t("map.locationPermissionTitle"),
      t("map.locationPermissionBody"),
    );
    return false;
  }, [t]);

  const centerOnUser = useCallback(async () => {
    const ok = await ensureLocationPermission();
    if (!ok) return;
    setShowUserLocation(true);
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      const region: Region = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: NEARBY_DELTA,
        longitudeDelta: NEARBY_DELTA,
      };
      regionRef.current = region;
      mapRef.current?.animateToRegion(region, 600);
      runDebouncedFetch(region);
    } catch {
      Alert.alert(t("common.error"), t("map.locationError"));
    }
  }, [ensureLocationPermission, runDebouncedFetch, t]);

  const toggleScanMode = useCallback(async () => {
    if (scanMode) {
      setScanMode(false);
      setScanCenter(null);
      return;
    }
    const ok = await ensureLocationPermission();
    if (!ok) return;
    setShowUserLocation(true);
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      setScanCenter({ latitude: lat, longitude: lng });
      setScanMode(true);
      const region: Region = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: NEARBY_DELTA,
        longitudeDelta: NEARBY_DELTA,
      };
      regionRef.current = region;
      mapRef.current?.animateToRegion(region, 700);
      runDebouncedFetch(region);
    } catch {
      Alert.alert(t("common.error"), t("map.locationError"));
    }
  }, [ensureLocationPermission, runDebouncedFetch, scanMode, t]);

  const sheetVisible = selectedPinId !== null;

  const directionsTarget = useMemo(() => {
    if (selectedPinId == null) return null;
    const p = pinsOnMap.find((x) => x.id === selectedPinId);
    return p && hasRenderableCoordinates(p.lat, p.lng)
      ? { lat: p.lat, lng: p.lng }
      : null;
  }, [selectedPinId, pinsOnMap]);

  if (Platform.OS === "web") {
    return (
      <View style={[styles.webFallback, { backgroundColor: color.backgroundSecondary }]}>
        <ThemedText style={[styles.webText, { color: color.textSecondary }]}>
          {t("map.webUnsupported")}
        </ThemedText>
      </View>
    );
  }

  const showAndroidNoKeyHint = Platform.OS === "android" && !mapUsesGoogleOnAndroid();

  const PillWrap = useCallback(
    ({ children }: { children: React.ReactNode }) => {
      if (Platform.OS === "ios") {
        return (
          <View style={[styles.pillBlurRing, { borderColor: color.border + "4D" }]}>
            <BlurView
              intensity={50}
              tint={scheme === "dark" ? "dark" : "light"}
              style={styles.pillBlurInner}
            >
              {children}
            </BlurView>
          </View>
        );
      }
      return (
        <View
          style={[
            styles.pillBlurRing,
            { backgroundColor: color.card + "F2", borderColor: color.border + "80" },
          ]}
        >
          {children}
        </View>
      );
    },
    [color.card, color.border, scheme],
  );

  return (
    <View style={styles.root} accessibilityLabel={t("map.a11yMapArea")}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={mapProvider}
        initialRegion={initialRegion}
        onMapReady={onMapReady}
        onRegionChangeComplete={onRegionChangeComplete}
        onPress={sheetVisible ? handleCloseSheet : undefined}
        rotateEnabled={false}
        pitchEnabled={false}
        mapType="standard"
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
      >
        {scanMode && scanCenter ? (
          <MapRadarCircles
            center={scanCenter}
            active={scanMode}
            primaryHex={color.primary}
          />
        ) : null}
        {visiblePins.map((pin) => (
          <RoomMapPin
            key={pin.id}
            pin={pin}
            isSelected={pin.id === selectedPinId}
            t={t}
            locale={locale}
            onPress={handlePinPress}
          />
        ))}
      </MapView>

      {scanMode ? (
        <MapScanSweepOverlay visible={scanMode} colorRgb={primaryRgb} />
      ) : null}

      {/* ── Status pills (glass) ─────────────────────────────────── */}
      <View style={[styles.topBar, { pointerEvents: "box-none" }]}>
        {loading && (
          <PillWrap>
            <View style={styles.pillRow}>
            <ActivityIndicator size="small" color={color.primary} />
            <ThemedText style={[styles.pillText, { color: color.textSecondary }]}>
              {t("map.loadingPins")}
            </ThemedText>
            </View>
          </PillWrap>
        )}
        {!loading && pinsOnMap.length > 0 && (
          <PillWrap>
            <View style={styles.pillRow}>
            <ThemedText style={[styles.pillText, { color: color.text }]}>
              {t("map.pinCount", { count: pinsOnMap.length })}
              {hiddenCount > 0
                ? ` · ${t("map.moreHidden", { count: hiddenCount })}`
                : ""}
            </ThemedText>
            </View>
          </PillWrap>
        )}
        {!loading && !error && pins.length > 0 && pinsOnMap.length === 0 && (
          <PillWrap>
            <View style={styles.pillRow}>
            <ThemedText style={[styles.pillText, { color: color.textSecondary }]}>
              {t("map.invalidCoordsHint", { count: pins.length })}
            </ThemedText>
            </View>
          </PillWrap>
        )}
        {!loading && !error && pins.length === 0 && (
          <PillWrap>
            <View style={styles.pillRow}>
            <ThemedText style={[styles.pillText, { color: color.textSecondary }]}>
              {t("map.emptyHint")}
            </ThemedText>
            </View>
          </PillWrap>
        )}
      </View>

      {/* ── Error banner ─────────────────────────────────────────────── */}
      {error && !loading && (
        <Pressable
          onPress={retry}
          style={[
            styles.errorBanner,
            { backgroundColor: color.card, borderColor: color.error },
          ]}
          accessibilityRole="button"
        >
          <ThemedText style={{ color: color.error, fontSize: 13, fontWeight: "600" }}>
            {error} · {t("common.retry")}
          </ThemedText>
        </Pressable>
      )}

      {!sheetVisible ? (
        <View
          style={[styles.bottomStack, { paddingBottom: insets.bottom + 8, zIndex: 2 }]}
          pointerEvents="box-none"
        >
          {showAndroidNoKeyHint && (
            <View
              style={[
                styles.androidKeyBanner,
                { backgroundColor: color.card, borderColor: color.border },
              ]}
            >
              <ThemedText style={[styles.hintText, { color: color.textSecondary }]}>
                {t("map.androidNoGoogleKeyHint")}
              </ThemedText>
            </View>
          )}

          <View style={styles.bottomRow} pointerEvents="box-none">
            <View style={styles.bottomLeft} pointerEvents="box-none">
              {scanMode ? (
                <View
                  style={[
                    styles.subtlePill,
                    {
                      backgroundColor: color.card + "F5",
                      borderColor: color.border + "60",
                    },
                  ]}
                >
                  <ThemedText
                    style={[styles.scanTitle, { color: color.text }]}
                    numberOfLines={2}
                  >
                    {t("map.scanningNearby")}
                  </ThemedText>
                </View>
              ) : (
                <>
                  <View
                    style={[
                      styles.subtlePill,
                      {
                        backgroundColor: color.card + "F2",
                        borderColor: color.border + "55",
                      },
                    ]}
                  >
                    <Ionicons name="hand-left-outline" size={16} color={color.primary} />
                    <ThemedText
                      style={[styles.tapText, { color: color.textSecondary }]}
                      numberOfLines={2}
                    >
                      {t("map.tapPinHint")}
                    </ThemedText>
                  </View>
                  {Platform.OS === "ios" && (
                    <ThemedText
                      style={[styles.iosMapNote, { color: color.textSecondary }]}
                      numberOfLines={2}
                    >
                      {t("map.iosAppleMapsNote")}
                    </ThemedText>
                  )}
                </>
              )}
            </View>

            <View style={styles.fabCol}>
              <Pressable
                onPress={() => void centerOnUser()}
                style={({ pressed }) => [
                  styles.fab,
                  {
                    backgroundColor: color.card,
                    borderColor: color.border + "99",
                    opacity: pressed ? 0.88 : 1,
                    shadowColor: color.text,
                  },
                ]}
                accessibilityLabel={t("map.locateA11y")}
                hitSlop={6}
              >
                <Ionicons name="navigate" size={22} color={color.primary} />
              </Pressable>
              <Pressable
                onPress={() => void toggleScanMode()}
                style={({ pressed }) => [
                  styles.fab,
                  {
                    backgroundColor: scanMode ? color.primary : color.card,
                    borderColor: scanMode ? color.primary : color.border + "99",
                    opacity: pressed ? 0.9 : 1,
                    shadowColor: scanMode ? color.primary : color.text,
                    shadowOpacity: scanMode ? 0.45 : 0.12,
                  },
                ]}
                accessibilityLabel={t("map.scanA11y")}
                hitSlop={6}
              >
                <Ionicons
                  name="pulse"
                  size={24}
                  color={scanMode ? color.primaryText : color.primary}
                />
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}

      {/* ── Room preview sheet ─────────────────────────────────────── */}
      <RoomPreviewSheet
        visible={sheetVisible}
        post={previewPost}
        loading={previewLoading}
        directionsTarget={directionsTarget}
        onClose={handleCloseSheet}
        onViewDetails={handleViewDetails}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  webFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  webText: {
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
  },
  topBar: {
    position: "absolute",
    top: 8,
    left: 12,
    right: 12,
    zIndex: 2,
    alignItems: "center",
    gap: 8,
  },
  pillBlurRing: {
    maxWidth: "100%",
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillBlurInner: {
    borderRadius: 22,
    overflow: "hidden",
  },
  pillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: "100%",
  },
  pillText: {
    fontSize: 13,
    flexShrink: 1,
  },
  bottomStack: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    gap: 6,
  },
  androidKeyBanner: {
    width: "100%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    width: "100%",
    gap: 10,
  },
  bottomLeft: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    justifyContent: "flex-end",
  },
  subtlePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "stretch",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  scanTitle: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  tapText: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  iosMapNote: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500",
  },
  fabCol: {
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    flexShrink: 0,
    paddingBottom: 2,
  },
  fab: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  errorBanner: {
    position: "absolute",
    top: 64,
    left: 12,
    right: 12,
    zIndex: 3,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  hintText: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
});
