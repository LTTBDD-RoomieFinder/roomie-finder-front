import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CreatePostModal } from "@/components/home/create-post-modal";
import { EditPostModal } from "@/components/home/edit-post-modal";
import { MyPostsSheet } from "@/components/home/my-posts-sheet";
import { PostEntry } from "@/components/home/post-entry";
import { PostList } from "@/components/home/post-list";
import { PostResponse } from "@/data/response";
import { useAppTheme } from "@/hooks/use-app-theme";
import { postService } from "@/services/post-service";
import { useAuthStore } from "@/stores/useAuthStore";

export default function HomeScreen() {
  const { color } = useAppTheme();
  const user = useAuthStore((state) => state.user);

  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [isCreatePostVisible, setCreatePostVisible] = useState(false);
  const [isMyPostsVisible, setMyPostsVisible] = useState(false);
  const [editingPost, setEditingPost] = useState<PostResponse | null>(null);

  const fetchPosts = useCallback(async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) setLoading(true);
      const data = await postService.getAllPosts();
      // Show newest first
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

  const handleRefresh = () => {
    setRefreshing(true);
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
    <ThemedView style={[styles.root]}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Roomie Finder
        </ThemedText>
        <Pressable
          onPress={() => setMyPostsVisible(true)}
          style={({ pressed }) => [
            styles.headerIconBtn,
            { backgroundColor: pressed ? color.backgroundSecondary : "transparent" },
          ]}
        >
          <Ionicons name="list" size={24} color={color.tint} />
        </Pressable>
      </View>

      <View style={{ flex: 1, backgroundColor: color.background }}>
        {/* Create Post Entry */}
        <PostEntry onPress={() => setCreatePostVisible(true)} />
        <View style={{ height: 8, backgroundColor: color.backgroundSecondary }} />

        {/* Feed */}
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

      {/* Modals */}
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
  },
  headerTitle: {
    fontSize: 26,
  },
  headerIconBtn: {
    padding: 8,
    borderRadius: 20,
  },
});
