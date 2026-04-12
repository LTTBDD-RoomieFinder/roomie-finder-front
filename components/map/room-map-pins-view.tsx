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
import { isAxiosError } from "axios";
import { useRouter } from "expo-router";

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

const DEFAULT_REGION: Region = {
  latitude: 21.0285,
  longitude: 105.8542,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

/** Giới hạn marker để tránh jank khi payload lớn. */
const MAX_VISIBLE_PINS = 220;
const DEBOUNCE_MS = 420;

type Props = {
  initialRegion?: Region;
};

export function RoomMapPinsView({ initialRegion = DEFAULT_REGION }: Props) {
  const router = useRouter();
  const { color } = useAppTheme();
  const { t, locale } = useLanguage();

  const [pins, setPins] = useState<MapPinGeoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected pin + preview sheet state
  const [selectedPinId, setSelectedPinId] = useState<number | null>(null);
  const [previewPost, setPreviewPost] = useState<PostResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewFetchSeqRef = useRef(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const regionRef = useRef<Region>(initialRegion);
  const abortRef = useRef<AbortController | null>(null);
  const fetchSeqRef = useRef(0);

  const mapProvider = useMemo(() => getNativeMapProvider(), []);

  const visiblePins = useMemo(() => pins.slice(0, MAX_VISIBLE_PINS), [pins]);
  const hiddenCount = Math.max(0, pins.length - visiblePins.length);

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
        setPreviewPost(post);
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

  const sheetVisible = selectedPinId !== null;

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

  return (
    <View style={styles.root} accessibilityLabel={t("map.a11yMapArea")}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={mapProvider}
        initialRegion={initialRegion}
        onMapReady={onMapReady}
        onRegionChangeComplete={onRegionChangeComplete}
        onPress={sheetVisible ? handleCloseSheet : undefined}
        rotateEnabled={false}
        pitchEnabled={false}
        mapType="standard"
      >
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

      {/* ── Status pills ────────────────────────────────────────────── */}
      <View style={[styles.topBar, { pointerEvents: "box-none" }]}>
        {loading && (
          <View style={[styles.pill, { backgroundColor: color.card, borderColor: color.border }]}>
            <ActivityIndicator size="small" color={color.primary} />
            <ThemedText style={[styles.pillText, { color: color.textSecondary }]}>
              {t("map.loadingPins")}
            </ThemedText>
          </View>
        )}
        {!loading && visiblePins.length > 0 && (
          <View style={[styles.pill, { backgroundColor: color.card, borderColor: color.border }]}>
            <ThemedText style={[styles.pillText, { color: color.text }]}>
              {t("map.pinCount", { count: visiblePins.length })}
              {hiddenCount > 0
                ? ` · ${t("map.moreHidden", { count: hiddenCount })}`
                : ""}
            </ThemedText>
          </View>
        )}
        {!loading && !error && pins.length === 0 && (
          <View style={[styles.pill, { backgroundColor: color.card, borderColor: color.border }]}>
            <ThemedText style={[styles.pillText, { color: color.textSecondary }]}>
              {t("map.emptyHint")}
            </ThemedText>
          </View>
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

      {showAndroidNoKeyHint && (
        <View style={[styles.hintBanner, { backgroundColor: color.card, borderColor: color.border }]}>
          <ThemedText style={[styles.hintText, { color: color.textSecondary }]}>
            {t("map.androidNoGoogleKeyHint")}
          </ThemedText>
        </View>
      )}

      {Platform.OS === "ios" && !sheetVisible && (
        <View style={[styles.footerNote, { backgroundColor: color.card, borderColor: color.border }]}>
          <ThemedText style={[styles.footerNoteText, { color: color.textSecondary }]}>
            {t("map.iosAppleMapsNote")}
          </ThemedText>
        </View>
      )}

      {/* ── Room preview sheet ─────────────────────────────────────── */}
      <RoomPreviewSheet
        visible={sheetVisible}
        post={previewPost}
        loading={previewLoading}
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
    top: 10,
    left: 12,
    right: 12,
    alignItems: "center",
    gap: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: "100%",
  },
  pillText: {
    fontSize: 13,
    flexShrink: 1,
  },
  errorBanner: {
    position: "absolute",
    top: 58,
    left: 16,
    right: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  hintBanner: {
    position: "absolute",
    bottom: 52,
    left: 14,
    right: 14,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  hintText: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
  footerNote: {
    position: "absolute",
    bottom: 12,
    left: 14,
    right: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  footerNoteText: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 15,
  },
});
