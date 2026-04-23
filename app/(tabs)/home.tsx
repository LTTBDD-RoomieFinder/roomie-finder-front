import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context"; // Thêm để xử lý tai thỏ chuẩn xác

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CreatePostModal } from "@/components/home/create-post-modal";
import { EditPostModal } from "@/components/home/edit-post-modal";
import { HomeSearchOverlay } from "@/components/home/home-search-overlay";
import { MyPostsSheet } from "@/components/home/my-posts-sheet";
import { PostEntry } from "@/components/home/post-entry";
import { PostList } from "@/components/home/post-list";
import { PostResponse } from "@/data/response";
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
  const insets = useSafeAreaInsets(); // Lấy thông số vùng an toàn của màn hình

  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [recommendedScores, setRecommendedScores] = useState<
    Record<number, { totalScore: number; profileAvgScore: number; roomScore: number }>
  >({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"feed" | "recommended">("feed");

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
      console.error("Failed to fetch posts", e);
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
    const displayUserId =
      post.author?.id ??
      (typeof post.user?.id === "number" ? post.user.id : undefined);

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      status: post.status as any,
      viewCount: post.viewCount,
      expirationDate: null,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      room: post.room,
      user: {
        id: String(displayUserId ?? ""),
        username: displayName,
        email: "",
        fullName: displayName,
        roles: [],
      },
    };
  }, [t]);

  const fetchRecommendedPosts = useCallback(async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) setLoading(true);
      const res = await postSearchService.getRecommendedPosts({ size: 20 });
      const items = res?.data ?? [];
      const mappedPosts = items.map(toFeedPost);
      const scores = items.reduce<
        Record<number, { totalScore: number; profileAvgScore: number; roomScore: number }>
      >((acc, item) => {
        if (item.post?.id !== undefined && item.post?.id !== null) {
          acc[item.post.id] = {
            totalScore: item.totalScore,
            profileAvgScore: item.profileAvgScore,
            roomScore: item.roomScore,
          };
        }
        return acc;
      }, {});
      setRecommendedScores(scores);
      setPosts(mappedPosts);
    } catch (e) {
      console.error("Failed to fetch recommended posts", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toFeedPost]);

  useEffect(() => {
    if (activeTab === "recommended") {
      fetchRecommendedPosts();
      return;
    }
    fetchPosts();
  }, [activeTab, fetchPosts, fetchRecommendedPosts]);

  useFocusEffect(
    useCallback(() => {
      void syncTabBadgesToStore();
    }, []),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    void syncTabBadgesToStore();
    if (activeTab === "recommended") {
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
      {/* Header: icon 3 gạch + icon search sát nhau */}
      <View 
        style={[
          styles.header, 
          { paddingTop: Math.max(insets.top, 16) + 12 } // Cách top an toàn + padding
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => setSearchVisible(true)}
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: pressed ? color.border : color.backgroundSecondary,
                borderRadius: radius.md,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t("home.searchA11y")}
          >
            <Ionicons name="search" size={22} color={color.text} />
          </Pressable>

          <ThemedText type="title" style={[styles.headerTitle, { color: color.primary }]}>
            {t("home.title")}
          </ThemedText>

          <View style={styles.headerRight}>
            <Pressable
              onPress={() => setMyPostsVisible(true)}
              style={({ pressed }) => [
                styles.iconButton,
                {
                  backgroundColor: pressed ? color.border : color.backgroundSecondary,
                  borderRadius: radius.md,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t("home.myPostsA11y")}
            >
              <Ionicons name="list" size={22} color={color.text} />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={{ flex: 1, backgroundColor: color.background }}>
        {/* Vùng bấm để tạo bài viết */}
        <PostEntry onPress={() => setCreatePostVisible(true)} />
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 16,
            paddingBottom: 10,
            gap: 8,
          }}
        >
          <Pressable
            onPress={() => setActiveTab("feed")}
            style={({ pressed }) => [
              styles.tabBtn,
              {
                backgroundColor:
                  activeTab === "feed"
                    ? color.primary
                    : pressed
                    ? color.border
                    : color.backgroundSecondary,
              },
            ]}
          >
            <ThemedText
              type="defaultSemiBold"
              style={{ color: activeTab === "feed" ? color.primaryText : color.text }}
            >
              {t("home.feedTab")}
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("recommended")}
            style={({ pressed }) => [
              styles.tabBtn,
              {
                backgroundColor:
                  activeTab === "recommended"
                    ? color.primary
                    : pressed
                    ? color.border
                    : color.backgroundSecondary,
              },
            ]}
          >
            <ThemedText
              type="defaultSemiBold"
              style={{ color: activeTab === "recommended" ? color.primaryText : color.text }}
            >
              {t("home.recommendedTab")}
            </ThemedText>
          </Pressable>
        </View>
        <View style={{ height: 8, backgroundColor: color.backgroundSecondary }} />

        {/* Danh sách bài viết */}
        <PostList
          posts={posts}
          loading={loading}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          currentUserId={user?.id}
          onEdit={(post) => setEditingPost(post)}
          onDelete={handleDeleteFromFeed}
          scoresByPostId={activeTab === "recommended" ? recommendedScores : undefined}
        />
      </View>

      {/* Modals giữ nguyên logic */}
      <CreatePostModal
        visible={isCreatePostVisible}
        onClose={() => setCreatePostVisible(false)}
        onSuccess={() => fetchPosts(false)}
      />

      <EditPostModal
        visible={editingPost !== null}
        post={editingPost}
        onClose={() => setEditingPost(null)}
        onSuccess={() => fetchPosts(false)}
      />

      <MyPostsSheet
        visible={isMyPostsVisible}
        onClose={() => setMyPostsVisible(false)}
        onEdit={(post) => setEditingPost(post)}
        onDeleted={() => fetchPosts(false)}
      />

      <HomeSearchOverlay visible={isSearchVisible} onClose={() => setSearchVisible(false)} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12, // Tạo khoảng cách với PostEntry ở dưới
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12, // Khoảng cách đều giữa các nút
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
});