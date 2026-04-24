import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
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

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ focus?: string; keyword?: string }>();
  const { color } = useAppTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const [keyword, setKeyword] = useState("");
  const [filters, setFilters] = useState<Omit<PostSearchRequest, "keyword" | "cursor" | "size">>({});
  const [posts, setPosts] = useState<PostSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination cursor
  const cursorRef = useRef<number | null>(null);

  // Debounce ref
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<any>(null);

  const fetchResults = useCallback(async (isLoadMore = false, currentKeyword = keyword, currentFilters = filters) => {
    if (isLoadMore) {
      if (!hasMore || loadingMore) return;
      setLoadingMore(true);
    } else {
      setLoading(true);
      cursorRef.current = null;
    }

    try {
      const requestPayload: PostSearchRequest = {
        keyword: currentKeyword,
        ...currentFilters,
        size: 50,
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

    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, keyword, filters]);

  // Initial load
  useEffect(() => {
    const initialKeyword = typeof params.keyword === "string" ? params.keyword : "";
    if (initialKeyword) setKeyword(initialKeyword);
    fetchResults(false, initialKeyword, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (params.focus === "1") {
      requestAnimationFrame(() => {
        inputRef.current?.focus?.();
      });
    }
  }, [params.focus]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // Handle Search Input Change with Debounce (500ms)
  const handleSearchChange = (text: string) => {
    setKeyword(text);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      fetchResults(false, text, filters);
    }, 500);
  };

  const handleApplyFilters = (newFilters: Omit<PostSearchRequest, "keyword" | "cursor" | "size">) => {
    setFilters(newFilters);
    fetchResults(false, keyword, newFilters);
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
    if (typeof filters.minPrice === "number" || typeof filters.maxPrice === "number") {
      const min = filters.minPrice ?? 0;
      const max = filters.maxPrice ?? 20000000;
      chips.push({
        key: "price",
        label: t("search.priceChip", {
          min: (min / 1_000_000).toFixed(0),
          max: (max / 1_000_000).toFixed(0),
        }),
        onClear: () => setFilters((p) => ({ ...p, minPrice: undefined, maxPrice: undefined })),
      });
    }
    if (filters.cityName) {
      chips.push({
        key: "cityName",
        label: filters.cityName,
        onClear: () => setFilters((p) => ({ ...p, cityName: undefined })),
      });
    }
    if ((filters.amenityIds?.length ?? 0) > 0) {
      chips.push({
        key: "amenityIds",
        label: `Tiện ích (${filters.amenityIds?.length ?? 0})`,
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

  useEffect(() => {
    // Re-search when filters change (but not while typing debounce runs)
    fetchResults(false, keyword, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchResults(false);
    } finally {
      setRefreshing(false);
    }
  }, [fetchResults]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: color.background }]} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 8), borderBottomColor: color.border, backgroundColor: color.background }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={color.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <SearchBar
              value={keyword}
              onChangeText={handleSearchChange}
              onFilterPress={() => setFilterModalVisible(true)}
              hasActiveFilters={hasActiveFilters}
              placeholder={t("search.placeholderFull")}
              inputRef={inputRef}
            />
          </View>
        </View>

        {!!activeFilterChips.length && (
          <View style={[styles.chipsRow, { backgroundColor: color.background, borderBottomColor: color.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContent}>
              <Pressable
                onPress={() => setFilters({})}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: pressed ? color.border : color.card,
                    borderColor: color.border,
                  },
                ]}
              >
                <ThemedText style={{ fontWeight: "700" }}>{t("search.clearAll")}</ThemedText>
              </Pressable>

              {activeFilterChips.map((c) => (
                <Pressable
                  key={c.key}
                  onPress={c.onClear}
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      backgroundColor: pressed ? color.border : color.card,
                      borderColor: color.border,
                    },
                  ]}
                >
                  <ThemedText numberOfLines={1} style={{ maxWidth: 160 }}>
                    {c.label}
                  </ThemedText>
                  <Feather name="x" size={14} color={color.icon} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <FlatList
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <PostSearchResultCard
              post={item}
              onAuthorPress={() => {
                const uid = item.author?.id ?? item.user?.id;
                if (uid == null || String(uid).length === 0) return;
                router.push({
                  pathname: "/user/[id]",
                  params: { id: String(uid) },
                });
              }}
              onPress={() => {
                const roomId = item.room?.id;
                if (roomId == null) return;
                router.push({
                  pathname: "/(tabs)/room/[id]",
                  params: { id: roomId },
                });
              }}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            posts.length === 0 ? { flexGrow: 1, justifyContent: "center" } : null,
          ]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.primary} />}
          onEndReached={() => fetchResults(true)}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={color.primary} />
                <ThemedText style={{ marginTop: 12 }}>{t("search.searching")}</ThemedText>
              </View>
            ) : (
              <View style={styles.centerContainer}>
                <Feather name="search" size={48} color={color.placeholder} />
                <ThemedText style={{ marginTop: 16, color: color.placeholder, textAlign: "center" }}>
                  {t("search.noResults")}
                </ThemedText>
                <ThemedText style={{ marginTop: 8, color: color.textSecondary, textAlign: "center" }}>
                  {t("search.noResultsHint")}
                </ThemedText>
              </View>
            )
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={color.primary} />
              </View>
            ) : null
          }
        />
      </KeyboardAvoidingView>

      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: "center",
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
});
