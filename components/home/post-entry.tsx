import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { useAuthStore } from "@/stores/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

type Props = {
  onPress: () => void;
};

export function PostEntry({ onPress }: Props) {
  const { color, radius } = useAppTheme();
  const { t } = useLanguage();
  const user = useAuthStore((state) => state.user);
  const firstName = user?.fullName?.split(" ")[0] || t("home.postEntryYou");

  return (
    <ThemedView style={styles.container}>
      <View style={styles.row}>
        <Pressable
          onPress={() => {
            if (user?.id == null) return;
            router.push({ pathname: "/user/[id]", params: { id: String(user.id) } });
          }}
          disabled={!user?.id}
          style={({ pressed }) => [pressed && { opacity: 0.88 }]}
          accessibilityRole="button"
          accessibilityLabel={t("home.postEntryAvatarA11y")}
        >
          <UserAvatar
            userId={user?.id}
            hintUrl={user?.avatarUrl}
            name={user?.fullName || user?.username || firstName}
            size={48}
            style={[styles.avatar, { backgroundColor: color.backgroundSecondary }]}
          />
        </Pressable>
        <View style={styles.col}>
          <Pressable
            style={({ pressed }) => [
              styles.composer,
              {
                backgroundColor: pressed ? color.border + "80" : color.backgroundSecondary,
                borderColor: color.border,
                borderRadius: radius.md,
              },
            ]}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={t("home.postEntryPrompt", { name: firstName })}
          >
            <ThemedText
              style={[styles.prompt, { color: color.textSecondary }]}
              numberOfLines={1}
            >
              {t("home.postEntryPrompt", { name: firstName })}
            </ThemedText>
            <View
              style={[styles.iconBadge, { backgroundColor: color.primary + "18" }]}
              pointerEvents="none"
            >
              <Ionicons name="add" size={24} color={color.primary} />
            </View>
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  col: { flex: 1, minWidth: 0 },
  avatar: {
    flexShrink: 0,
  },
  composer: {
    minHeight: 48,
    maxHeight: 48,
    paddingLeft: 14,
    paddingRight: 6,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  prompt: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
