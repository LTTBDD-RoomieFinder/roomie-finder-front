import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  PanResponder,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";

import { ThemedText } from "@/components/themed-text";
import { SearchBar } from "@/components/ui/search-bar";
import { FilterModal } from "@/components/room/filter-modal";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { genderReqLabelKey, roomTypeLabelKey } from "@/lib/i18n-labels";
import { postSearchService } from "@/services/post-search-service";
import { PostSearchRequest } from "@/data/request";
import { PostSearchResultCard, type PostSearchResult } from "@/components/search/post-search-result-card";
import { GenderRequirement, RoomType } from "@/types/enums";

type PostSearchPage = {
  data?: PostSearchResult[];
  nextCursor?: number | null;
  hasNext?: boolean;
};

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function HomeSearchOverlay({ visible, onClose }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { color } = useAppTheme();
  const { t } = useLanguage();

  const [keyword, setKeyword] = useState("");
  const [filters, setFilters] = useState<Omit<PostSearchRequest, "keyword" | "cursor" | "size">>({});
  const [posts, setPosts] = useState<PostSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);

  const cursorRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<any>(null);

  const screenH = Dimensions.get("window").height;
  const translateY = useRef(new Animated.Value(screenH)).current;
  const [mounted, setMounted] = useState(false);

  const closeAnimated = useCallback(() => {
    Animated.timing(translateY, {
      toValue: screenH,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setMounted(false);
        onClose();
      }
    });
  }, [onClose, screenH, translateY]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6 && Math.abs(g.dx) < 20,
        onPanResponderMove: (_, g) => {
          if (g.dy > 0) translateY.setValue(g.dy);
        },
        onPanResponderRelease: (_, g) => {
          if (g.dy > 120 || g.vy > 1.2) {
            closeAnimated();
            return;
          }
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 18,
            stiffness: 220,
            mass: 0.9,
          }).start();
        },
      }),
    [closeAnimated, translateY],
  );

  const fetchResults = useCallback(
    async (isLoadMore = false, currentKeyword = keyword, currentFilters = filters) => {
      if (isLoadMore) {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
      } else {
        setLoading(true);
        cursorRef.current = null;
      }

      try {
        setSearchError(null);
        const requestPayload: PostSearchRequest = {
          keyword: currentKeyword,
          ...currentFilters,
          size: 20,
        };

        if (isLoadMore && cursorRef.current !== null) {
          requestPayload.cursor = cursorRef.current;
        }

        const data = (await postSearchService.searchPosts(requestPayload)) as PostSearchPage;

        const newPosts = data.data || [];
        const nextCursor = data.nextCursor ?? null;
        const hasNext = Boolean(data.hasNext);

        setPosts((prev) => (isLoadMore ? [...prev, ...newPosts] : newPosts));
        setHasMore(hasNext);
        cursorRef.current = hasNext ? nextCursor : null;
      } catch (e: any) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          t("search.searchError");
        if (!isLoadMore) setSearchError(msg);
        console.error("[Search] failed:", msg, e?.response?.data);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters, hasMore, keyword, loadingMore],
  );

  useEffect(() => {
    if (!visible) return;
    setMounted(true);
    // Reset for a fresh overlay experience
    setKeyword("");
    setFilters({});
    setPosts([]);
    setHasMore(true);
    cursorRef.current = null;
    translateY.setValue(screenH);
    requestAnimationFrame(() => inputRef.current?.focus?.());
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 220,
      mass: 0.9,
    }).start();
    // initial fetch (empty keyword) for "discover" feeling
    fetchResults(false, "", {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const handleSearchChange = (text: string) => {
    setKeyword(text);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchResults(false, text, filters);
    }, 500);
  };

  const hasActiveFilters = useMemo(() => Object.keys(filters).length > 0, [filters]);

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onClear: () => void }[] = [];

    if (filters.roomType) {
      const value = filters.roomType as RoomType;
      chips.push({
        key: "roomType",
        label: t(roomTypeLabelKey(value)),
        onClear: () => setFilters((p) => ({ ...p, roomType: undefined })),
      });
    }
    if (filters.genderRequirement) {
      const value = filters.genderRequirement as GenderRequirement;
      chips.push({
        key: "genderRequirement",
        label: t(genderReqLabelKey(value)),
        onClear: () => setFilters((p) => ({ ...p, genderRequirement: undefined })),
      });
    }
    if ((filters.amenityIds?.length ?? 0) > 0) {
      chips.push({
        key: "amenityIds",
        label: t("search.amenityChip", {
          count: filters.amenityIds?.length ?? 0,
        }),
        onClear: () => setFilters((p) => ({ ...p, amenityIds: undefined })),
      });
    }
    if (typeof filters.radiusInKm === "number") {
      chips.push({
        key: "radiusInKm",
        label: `${filters.radiusInKm}km`,
        onClear: () => setFilters((p) => ({ ...p, radiusInKm: undefined })),
      });
    }

    return chips;
  }, [filters, t]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchResults(false);
    } finally {
      setRefreshing(false);
    }
  }, [fetchResults]);

  const openFullSearch = () => {
    const keywordParam = keyword.trim();
    const query = keywordParam
      ? (`/search?focus=1&keyword=${encodeURIComponent(keywordParam)}` as const)
      : ("/search?focus=1" as const);
    setMounted(false);
    onClose();
    router.push(query);
  };

  return (
    <Modal visible={mounted} animationType="none" transparent onRequestClose={closeAnimated}>
      <Pressable style={styles.backdrop} onPress={closeAnimated} />
      <BlurView intensity={22} tint={color.text === "#ECEDEE" ? "dark" : "light"} style={styles.blurFill} />

      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: color.background,
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 12),
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={[styles.topBar, { borderBottomColor: color.border }]}>
          <View {...panResponder.panHandlers} style={styles.grabberWrap}>
            <View style={[styles.grabber, { backgroundColor: color.border }]} />
          </View>

          <TouchableOpacity onPress={closeAnimated} style={styles.iconHit}>
            <Feather name="x" size={22} color={color.text} />
          </TouchableOpacity>

          <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>
            {t("search.title")}
          </ThemedText>

          <TouchableOpacity onPress={openFullSearch} style={styles.iconHit}>
            <Feather name="arrow-right" size={22} color={color.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <SearchBar
            value={keyword}
            onChangeText={handleSearchChange}
            onFilterPress={() => setFilterModalVisible(true)}
            hasActiveFilters={hasActiveFilters}
            placeholder={t("search.placeholder")}
            inputRef={inputRef}
            autoFocus
          />
        </View>

        {!!activeFilterChips.length && (
          <View style={[styles.chipsRow, { borderBottomColor: color.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContent}>
              <Pressable
                onPress={() => setFilters({})}
                style={({ pressed }) => [
                  styles.chip,
                  { backgroundColor: pressed ? color.border : color.card, borderColor: color.border },
                ]}
              >
                <ThemedText style={{ fontWeight: "700" }}>{t("search.clearFilters")}</ThemedText>
              </Pressable>
              {activeFilterChips.map((c) => (
                <Pressable
                  key={c.key}
                  onPress={c.onClear}
                  style={({ pressed }) => [
                    styles.chip,
                    { backgroundColor: pressed ? color.border : color.card, borderColor: color.border },
                  ]}
                >
                  <ThemedText numberOfLines={1} style={{ maxWidth: 180 }}>
                    {c.label}
                  </ThemedText>
                  <Feather name="x" size={14} color={color.icon} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.results, posts.length === 0 ? { flexGrow: 1, justifyContent: "center" } : null]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.primary} />}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const distanceFromBottom = contentSize.height - (layoutMeasurement.height + contentOffset.y);
            if (distanceFromBottom < 240) fetchResults(true);
          }}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={color.primary} />
              <ThemedText style={{ marginTop: 12 }}>{t("search.searching")}</ThemedText>
            </View>
          ) : searchError ? (
            <View style={styles.center}>
              <Feather name="alert-circle" size={44} color={color.error} />
              <ThemedText style={{ marginTop: 12, color: color.error, textAlign: "center" }}>
                {searchError}
              </ThemedText>
              <TouchableOpacity
                onPress={() => fetchResults(false, keyword, filters)}
                style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: color.primary, borderRadius: 20 }}
              >
                <ThemedText style={{ color: "#fff", fontWeight: "700" }}>{t("common.retry")}</ThemedText>
              </TouchableOpacity>
            </View>
          ) : posts.length === 0 ? (
            <View style={styles.center}>
              <Feather name="search" size={44} color={color.placeholder} />
              <ThemedText style={{ marginTop: 12, color: color.textSecondary, textAlign: "center" }}>
                {t("search.emptyHint")}
              </ThemedText>
            </View>
          ) : (
            <>
              {posts.map((p) => (
                <PostSearchResultCard
                  key={p.id}
                  post={p}
                  onAuthorPress={() => {
                    const uid = p.author?.id ?? p.user?.id;
                    if (uid == null || String(uid).length === 0) return;
                    closeAnimated();
                    router.push({
                      pathname: "/user/[id]",
                      params: { id: String(uid) },
                    });
                  }}
                  onPress={() => {
                    const roomId = p.room?.id;
                    if (roomId == null) return;
                    closeAnimated();
                    router.push({
                      pathname: "/(tabs)/room/[id]",
                      params: { id: roomId },
                    });
                  }}
                />
              ))}
              {loadingMore && (
                <View style={{ paddingVertical: 14, alignItems: "center" }}>
                  <ActivityIndicator size="small" color={color.primary} />
                </View>
              )}
              {!loadingMore && hasMore && (
                <Pressable
                  onPress={() => fetchResults(true)}
                  style={({ pressed }) => [
                    styles.loadMore,
                    { backgroundColor: pressed ? color.border : color.card, borderColor: color.border },
                  ]}
                >
                  <ThemedText style={{ fontWeight: "700" }}>{t("search.loadMore")}</ThemedText>
                </Pressable>
              )}
            </>
          )}
        </ScrollView>

        <View style={[styles.bottomBar, { borderTopColor: color.border }]}>
          <Pressable
            onPress={openFullSearch}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: pressed ? color.border : color.primary },
            ]}
          >
            <ThemedText style={{ color: color.primaryText, fontWeight: "800" }}>
              {t("search.seeAll")}
            </ThemedText>
          </Pressable>
        </View>

        <FilterModal
          visible={isFilterModalVisible}
          onClose={() => setFilterModalVisible(false)}
          onApply={(newFilters) => {
            setFilters(newFilters);
            fetchResults(false, keyword, newFilters);
          }}
          initialFilters={filters}
        />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  blurFill: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 80,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  grabberWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 6,
    alignItems: "center",
  },
  grabber: {
    width: 44,
    height: 5,
    borderRadius: 999,
    opacity: 0.6,
  },
  iconHit: {
    padding: 8,
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  chipsRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chipsContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  results: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 16,
  },
  center: {
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  loadMore: {
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === "android" ? 10 : 0,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
});

