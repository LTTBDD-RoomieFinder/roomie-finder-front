import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { ChatRoomItem } from "@/types/chat";
import { formatDateVi } from "@/utils/format-date";

type Props = {
  room: ChatRoomItem;
  onPress: (id: number) => void;
};

/** Single row in the ChatListScreen. */
export function ChatRoomItem({ room, onPress }: Props) {
  const { color } = useAppTheme();
  const unread = room.unreadCount ?? 0;
  const hasUnread = unread > 0;
  const title = room.postTitle?.trim()
    ? room.postTitle
    : `Phòng chat #${room.id}`;
  const preview = room.lastMessagePreview?.trim()
    ? room.lastMessagePreview
    : "Tin nhắn mới sẽ xuất hiện ở đây";
  const time = room.lastMessageAt ?? room.createdAt;

  return (
    <Pressable
      style={[styles.container, { borderBottomColor: color.border + "30" }]}
      onPress={() => onPress(room.id)}
    >
      <View style={[styles.avatar, { backgroundColor: color.primary + "18" }]}>
        <IconSymbol
          name="bubble.left.and.bubble.right.fill"
          size={26}
          color={color.primary}
        />
      </View>

      <View style={styles.info}>
        <ThemedText
          style={[
            styles.title,
            { color: color.text, fontWeight: hasUnread ? "800" : "600" },
          ]}
          numberOfLines={1}
        >
          {title}
        </ThemedText>
        <ThemedText
          style={[styles.sub, { color: color.icon, fontWeight: hasUnread ? "700" : "500" }]}
          numberOfLines={1}
        >
          {preview}
        </ThemedText>
        <ThemedText style={[styles.time, { color: color.icon }]}>
          {formatDateVi(time)}
        </ThemedText>
      </View>

      {hasUnread ? (
        <View style={[styles.badge, { backgroundColor: color.tint + "22", borderColor: color.tint + "55" }]}>
          <ThemedText style={[styles.badgeText, { color: color.tint }]}>
            {unread}
          </ThemedText>
        </View>
      ) : null}

      <IconSymbol name="chevron.right" size={18} color={color.icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1 },
  title: { fontSize: 16 },
  sub: { fontSize: 13, marginTop: 3, opacity: 0.92 },
  time: { fontSize: 11, marginTop: 2, opacity: 0.7 },
  badge: {
    alignSelf: "center",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginRight: 2,
  },
  badgeText: { fontSize: 12, fontWeight: "800" },
});
