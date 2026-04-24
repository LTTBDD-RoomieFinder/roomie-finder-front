import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { ThemedView } from "@/components/themed-view";
import { CreatePostModal } from "@/components/home/create-post-modal";
import { EditPostModal } from "@/components/home/edit-post-modal";
import { HomeSearchOverlay } from "@/components/home/home-search-overlay";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { MyPostsSheet } from "@/components/home/my-posts-sheet";
import { PostEntry } from "@/components/home/post-entry";
import { PostList } from "@/components/home/post-list";
import { profileApi } from "@/apis/profile";
import { PostResponse } from "@/data/response";
import { normalizeRoom } from "@/utils/normalize-post";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { postService } from "@/services/post-service";
import {
  RecommendedPostResponse,
  postSearchService,
} from "@/services/post-search-service";
import { syncTabBadgesToStore } from "@/services/tab-badge-service";
import { useAuthStore } from "@/stores/useAuthStore";

export default function HomeScreen() {
  const { color, radius } = useAppTheme();
  const { t } = useLanguage();
  const user = useAuthStore((state) => state.user);

  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"feed" | "recommended">("feed");
  const [canUseRecommended, setCanUseRecommended] = useState(false);

  const [isCreatePostVisible, setCreatePostVisible] = useState(false);
  const [isMyPostsVisible, setMyPostsVisible] = useState(false);
  const [editingPost, setEditingPost] = useState<PostResponse | null>(null);
  const [isSearchVisible, setSearchVisible] = useState(false);

  const fetchPosts = useCallback(async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) setLoading(true);
      const data = await postService.getAllPosts();
      // Hiển thị bài mới nhất lên đầu
      setPosts([...data].reverse());
    } catch (e) {
      const msg = typeof e === "string" ? e : String(e);
      if (__DEV__ && /cannot reach server|ERR_NETWORK|Network Error/i.test(msg)) {
        console.warn(
          "Failed to fetch posts (check backend + EXPO_PUBLIC_API_URL):",
          msg.length > 220 ? `${msg.slice(0, 220)}…` : msg,
        );
      } else {
        console.error("Failed to fetch posts", e);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const toFeedPost = useCallback((item: RecommendedPostResponse): PostResponse => {
    const post = item.post;
    const displayName =
      post.author?.fullName ||
      post.author?.username ||
      post.user?.fullName ||
      post.user?.username ||
      t("postSearch.anonymous");
    const aid = post.author?.id;
    const uid = post.user?.id;
    const displayUserIdRaw = aid ?? uid;
    const displayUserId =
      displayUserIdRaw != null && String(displayUserIdRaw).trim() !== ""
        ? String(displayUserIdRaw).trim()
        : undefined;
    const posterAvatar =
      post.author?.avatarUrl ??
      post.user?.avatarUrl ??
      null;

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      status: post.status as any,
      viewCount: post.viewCount,
      expirationDate: null,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      room: normalizeRoom((post as { room?: unknown }).room ?? null),
      user: {
        id: String(displayUserId ?? ""),
        username: displayName,
        email: "",
        fullName: displayName,
        roles: [],
        avatarUrl: posterAvatar,
      },
    };
  }, [t]);

  const fetchRecommendedPosts = useCallback(async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) setLoading(true);
      const res = await postSearchService.getRecommendedPosts({ size: 50 });
      const items = res?.data ?? [];
      setPosts(items.map(toFeedPost));
    } catch (e) {
      const msg = typeof e === "string" ? e : String(e);
      if (__DEV__ && /cannot reach server|ERR_NETWORK|Network Error/i.test(msg)) {
        console.warn(
          "Failed to fetch recommended posts (check backend + EXPO_PUBLIC_API_URL):",
          msg.length > 220 ? `${msg.slice(0, 220)}…` : msg,
        );
      } else {
        console.error("Failed to fetch recommended posts", e);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toFeedPost]);

  const checkProfileAvailability = useCallback(async () => {
    try {
      await profileApi.getProfile();
      setCanUseRecommended(true);
    } catch {
      setCanUseRecommended(false);
      setActiveTab("feed");
    }
  }, []);

  useEffect(() => {
    checkProfileAvailability();
  }, [checkProfileAvailability]);

  /**
   * Bảng tin: tải từ effect khi ở tab "Feed".
   * Tab "Đề xuất" chỉ tải khi user bấm (segment / nút header / pull-to-refresh) — gọi thẳng `fetchRecommendedPosts`.
   */
  useEffect(() => {
    if (canUseRecommended && activeTab === "recommended") {
      return;
    }
    void fetchPosts();
  }, [activeTab, canUseRecommended, fetchPosts]);

  const goRecommended = useCallback(() => {
    if (!canUseRecommended) {
      void checkProfileAvailability();
      return;
    }
    setActiveTab("recommended");
    void fetchRecommendedPosts(true);
  }, [canUseRecommended, checkProfileAvailability, fetchRecommendedPosts]);

  useFocusEffect(
    useCallback(() => {
      void syncTabBadgesToStore();
    }, []),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    void syncTabBadgesToStore();
    void checkProfileAvailability();
    if (canUseRecommended && activeTab === "recommended") {
      fetchRecommendedPosts(false);
      return;
    }
    fetchPosts(false);
  };

  const handleDeleteFromFeed = (post: PostResponse) => {
    Alert.alert(
      t("home.deletePostTitle"),
      t("home.deletePostMessage", { title: post.title }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await postService.deletePost(post.id);
              setPosts((prev) => prev.filter((p) => p.id !== post.id));
            } catch (e: any) {
              Alert.alert(t("common.error"), e?.toString() ?? t("home.deleteFailed"));
            }
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.root}>
      <View style={[styles.header, { backgroundColor: color.primary }]}>
        <View style={styles.headerContent}>
          <View style={[styles.headerIconWrap, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <IconSymbol name="house.fill" size={24} color={color.primaryText} />
          </View>
          <View style={styles.headerTextWrap}>
            <Text
              style={[styles.headerTitle, { color: color.primaryText }]}
              numberOfLines={2}
              ellipsizeMode="clip"
            >
              {t("home.title")}
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: color.primaryText, opacity: 0.95 }]}
              numberOfLines={3}
              ellipsizeMode="clip"
            >
              {t("home.subtitle")}
            </Text>
          </View>
          <View style={styles.headerActionsRow}>
            <Pressable
              onPress={() => setSearchVisible(true)}
              style={({ pressed }) => [
                styles.headerActionBtn,
                { backgroundColor: pressed ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.18)" },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t("home.searchA11y")}
            >
              <Ionicons name="search" size={20} color={color.primaryText} />
            </Pressable>
            <Pressable
              onPress={() => setMyPostsVisible(true)}
              style={({ pressed }) => [
                styles.headerActionBtn,
                { backgroundColor: pressed ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.18)" },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t("home.myPostsA11y")}
            >
              <Ionicons name="list" size={20} color={color.primaryText} />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={{ flex: 1, backgroundColor: color.background }}>
        {/* Vùng bấm để tạo bài viết */}
        <PostEntry onPress={() => setCreatePostVisible(true)} />
        {canUseRecommended ? (
          <View style={styles.segmentOuter}>
            <View
              style={[
                styles.segmentTrack,
                {
                  backgroundColor: color.backgroundSecondary,
                  borderColor: color.border + "99",
                  borderRadius: radius.md,
                },
              ]}
            >
              <Pressable
                onPress={() => setActiveTab("feed")}
                style={({ pressed }) => {
                  const on = activeTab === "feed";
                  return [
                    styles.segmentBtn,
                    {
                      backgroundColor: on ? color.card : "transparent",
                      borderRadius: radius.sm,
                      borderColor: on ? color.primary : "transparent",
                      opacity: pressed ? 0.88 : 1,
                    },
                  ];
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === "feed" }}
              >
                <Ionicons
                  name="newspaper-outline"
                  size={18}
                  color={activeTab === "feed" ? color.primary : color.textSecondary}
                />
                <Text
                  style={[
                    styles.segmentLabel,
                    {
                      color: activeTab === "feed" ? color.primary : color.text,
                      fontWeight: activeTab === "feed" ? "800" : "600",
                    },
                  ]}
                  numberOfLines={1}
                >
                  {t("home.feedTab")}
                </Text>
              </Pressable>
              <Pressable
                onPress={goRecommended}
                style={({ pressed }) => {
                  const on = activeTab === "recommended";
                  return [
                    styles.segmentBtn,
                    {
                      backgroundColor: on ? color.card : "transparent",
                      borderRadius: radius.sm,
                      borderColor: on ? color.primary : "transparent",
                      opacity: pressed ? 0.88 : 1,
                    },
                  ];
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === "recommended" }}
              >
                <Ionicons
                  name="sparkles-outline"
                  size={18}
                  color={
                    activeTab === "recommended" ? color.primary : color.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.segmentLabel,
                    {
                      color: activeTab === "recommended" ? color.primary : color.text,
                      fontWeight: activeTab === "recommended" ? "800" : "600",
                    },
                  ]}
                  numberOfLines={1}
                >
                  {t("home.recommendedTab")}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}
        <View style={{ height: 6, backgroundColor: color.backgroundSecondary }} />

        {/* Danh sách bài viết */}
        <PostList
          posts={posts}
          loading={loading}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          currentUserId={user?.id}
          onEdit={(post) => setEditingPost(post)}
          onDelete={handleDeleteFromFeed}
          emptyMessageKey={
            activeTab === "recommended" && canUseRecommended
              ? "home.recommendedEmpty"
              : "post.feedEmpty"
          }
        />
      </View>

      {/* Modals giữ nguyên logic */}
      <CreatePostModal
        visible={isCreatePostVisible}
        onClose={() => setCreatePostVisible(false)}
        onSuccess={() => {
          void fetchPosts(false);
        }}
      />

      <EditPostModal
        visible={editingPost !== null}
        post={editingPost}
        onClose={() => setEditingPost(null)}
        onSuccess={() => {
          void fetchPosts(false);
        }}
      />

      <MyPostsSheet
        visible={isMyPostsVisible}
        onClose={() => setMyPostsVisible(false)}
        onEdit={(post) => setEditingPost(post)}
        onDeleted={() => {
          void fetchPosts(false);
        }}
      />

      <HomeSearchOverlay visible={isSearchVisible} onClose={() => setSearchVisible(false)} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    marginTop: 40,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    minHeight: 100,
    justifyContent: "center",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  headerActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
    marginTop: 0,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.2,
    lineHeight: 28,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
    fontWeight: "500",
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentOuter: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
  },
  segmentTrack: {
    flexDirection: "row",
    padding: 4,
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  segmentBtn: {
    flex: 1,
    flexBasis: 0,
    minHeight: 48,
    borderWidth: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  segmentLabel: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
});