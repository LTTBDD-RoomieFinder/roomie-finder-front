import type { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useNotificationStore } from "@/stores/use-notification-store";

type IconName = ComponentProps<typeof IconSymbol>["name"];

type Props = {
  name: IconName;
  color: string;
  /** Đọc count trực tiếp từ store trong component này — tránh React Navigation cache tabBarIcon (count cũ). */
  variant: "requests" | "chats";
  size?: number;
};

/**
 * Badge vẽ trên icon (không dùng tabBarBadge của React Navigation) để số luôn cập nhật
 * theo Zustand — tránh lỗi tab bar không re-render khi chỉ đổi options.
 */
export function TabBarIconWithBadge({
  name,
  color,
  variant,
  size = 28,
}: Props) {
  const count = useNotificationStore((s) =>
    variant === "requests" ? s.requestUnreadCount : s.chatUnreadRoomsCount,
  );

  const label =
    count <= 0 || !Number.isFinite(count)
      ? null
      : count > 99
        ? "99+"
        : String(count);

  return (
    <View style={styles.wrap}>
      <IconSymbol size={size} name={name} color={color} />
      {label != null ? (
        <View
          style={[
            styles.badge,
            { backgroundColor: Colors.light.error },
          ]}
        >
          <Text style={styles.badgeText}>{label}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 36,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -8,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
