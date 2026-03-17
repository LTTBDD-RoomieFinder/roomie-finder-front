import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PostResponse } from "@/data/response";
import { useAppTheme } from "@/hooks/use-app-theme";
import { postService } from "@/services/post-service";
import { STATUS_COLORS, STATUS_LABELS } from "@/constants/post-constants";

type Props = {
  visible: boolean;
  onClose: () => void;
  onEdit: (post: PostResponse) => void;
  onDeleted: () => void;
};

export function MyPostsSheet({ visible, onClose, onEdit, onDeleted }: Props) {
  const { color } = useAppTheme();
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) fetchMyPosts();
  }, [visible]);

  const fetchMyPosts = async () => {
    try {
      setLoading(true);
      const data = await postService.getMyPosts();
      setPosts(data);
    } catch (e) {
      console.error("Failed to fetch my posts", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (post: PostResponse) => {
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
              onDeleted();
            } catch (e: any) {
              Alert.alert("Lỗi", e?.toString() ?? "Không thể xoá bài đăng.");
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: PostResponse }) => (
    <View style={[styles.item, { borderBottomColor: color.border }]}>
      <View style={{ flex: 1 }}>
        <ThemedText type="defaultSemiBold" numberOfLines={1} style={{ fontSize: 15 }}>
          {item.title}
        </ThemedText>
        <View style={styles.itemMeta}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: STATUS_COLORS[item.status] },
            ]}
          />
          <ThemedText style={{ color: color.textSecondary, fontSize: 12 }}>
            {STATUS_LABELS[item.status]}
          </ThemedText>
          <ThemedText style={{ color: color.textSecondary, fontSize: 12, marginLeft: 8 }}>
            · {item.viewCount} lượt xem
          </ThemedText>
        </View>
      </View>
      <View style={styles.itemActions}>
        <Pressable
          style={({ pressed }) => [
            styles.iconBtn,
            { backgroundColor: pressed ? color.backgroundSecondary : "transparent" },
          ]}
          onPress={() => {
            onClose();
            setTimeout(() => onEdit(item), 300);
          }}
        >
          <Ionicons name="pencil-outline" size={20} color={color.tint} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.iconBtn,
            { backgroundColor: pressed ? color.backgroundSecondary : "transparent" },
          ]}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash-outline" size={20} color={color.error} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ThemedView style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: color.border, paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 14) : 14 }]}>
          <ThemedText type="subtitle" style={{ flex: 1 }}>
            Bài đăng của tôi
          </ThemedText>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={color.text} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={color.tint} />
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="document-text-outline" size={52} color={color.textSecondary} />
            <ThemedText style={{ color: color.textSecondary, marginTop: 16, textAlign: "center" }}>
              Bạn chưa có bài đăng nào.
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 32 }}
            contentInsetAdjustmentBehavior="automatic"
          />
        )}
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 4,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemActions: {
    flexDirection: "row",
    gap: 4,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 8,
  },
});
