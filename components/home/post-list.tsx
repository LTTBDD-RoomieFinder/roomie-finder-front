import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { PostResponse } from "@/data/response";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { PostCard } from "./post-card";

type Props = {
  posts: PostResponse[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  currentUserId?: number | string;
  onEdit?: (post: PostResponse) => void;
  onDelete?: (post: PostResponse) => void;
  scoresByPostId?: Record<
    number,
    {
      totalScore: number;
      profileAvgScore: number;
      roomScore: number;
    }
  >;
};

export function PostList({
  posts,
  loading,
  refreshing,
  onRefresh,
  currentUserId,
  onEdit,
  onDelete,
  scoresByPostId,
}: Props) {
  const { color } = useAppTheme();
  const { t } = useLanguage();

  if (loading && posts.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={color.tint} />
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id.toString()}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingBottom: 32, paddingTop: 4 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={color.tint}
        />
      }
      renderItem={({ item }) => (
        <PostCard
          post={item}
          currentUserId={currentUserId}
          onEdit={onEdit}
          onDelete={onDelete}
          scoreInfo={scoresByPostId?.[item.id]}
        />
      )}
      ItemSeparatorComponent={() => <View style={{ height: 8, backgroundColor: color.backgroundSecondary }} />}
      ListEmptyComponent={
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 80,
            gap: 16,
          }}
        >
          <Ionicons name="newspaper-outline" size={52} color={color.textSecondary} />
          <ThemedText style={{ color: color.textSecondary, textAlign: "center" }}>
            {t("post.feedEmpty")}
          </ThemedText>
        </View>
      }
    />
  );
}
