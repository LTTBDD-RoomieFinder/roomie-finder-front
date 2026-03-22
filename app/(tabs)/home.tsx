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
import { postService } from "@/services/post-service";
import { syncTabBadgesToStore } from "@/services/tab-badge-service";
import { useAuthStore } from "@/stores/useAuthStore";

export default function HomeScreen() {
  const { color } = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const insets = useSafeAreaInsets(); // Lấy thông số vùng an toàn của màn hình

  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useFocusEffect(
    useCallback(() => {
      void syncTabBadgesToStore();
    }, []),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    void syncTabBadgesToStore();
    fetchPosts(false);
  };

  const handleDeleteFromFeed = (post: PostResponse) => {
    Alert.alert(
      "Xoá bài đăng",
      `Bạn có chắc muốn xoá "${post.title}" không?`,
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Xoá",
          style: "destructive",
          onPress: async () => {
            try {
              await postService.deletePost(post.id);
              setPosts((prev) => prev.filter((p) => p.id !== post.id));
            } catch (e: any) {
              Alert.alert("Lỗi", e?.toString() ?? "Không thể xoá bài đăng.");
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
              { backgroundColor: pressed ? color.border : color.backgroundSecondary },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Tìm kiếm"
          >
            <Ionicons name="search" size={22} color={color.text} />
          </Pressable>

          <ThemedText type="title" style={[styles.headerTitle, { color: color.primary }]}>
            Roomie Finder
          </ThemedText>

          <View style={styles.headerRight}>
            <Pressable
              onPress={() => setMyPostsVisible(true)}
              style={({ pressed }) => [
                styles.iconButton,
                { backgroundColor: pressed ? color.border : color.backgroundSecondary },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Bài đăng của tôi"
            >
              <Ionicons name="list" size={22} color={color.text} />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={{ flex: 1, backgroundColor: color.background }}>
        {/* Vùng bấm để tạo bài viết */}
        <PostEntry onPress={() => setCreatePostVisible(true)} />
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
    width: 40,
    height: 40,
    borderRadius: 20, // Bo tròn tuyệt đối thành hình tròn
    alignItems: "center",
    justifyContent: "center",
  },
});