import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { useAuthStore } from "@/stores/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

type Props = {
  onPress: () => void;
};

export function PostEntry({ onPress }: Props) {
  const { color } = useAppTheme();
  const { t } = useLanguage();
  const user = useAuthStore((state) => state.user);
  const firstName = user?.fullName?.split(" ")[0] || t("home.postEntryYou");

  return (
    <ThemedView style={styles.container}>
      <View style={styles.topRow}>
        <UserAvatar
          userId={user?.id}
          hintUrl={user?.avatarUrl}
          name={user?.fullName || user?.username || firstName}
          size={40}
          style={[styles.avatar, { backgroundColor: color.backgroundSecondary }]}
        />
        <Pressable
          style={({ pressed }) => [
            styles.inputButton,
            { backgroundColor: pressed ? color.border : color.backgroundSecondary },
          ]}
          onPress={onPress}
        >
          <ThemedText style={{ color: color.textSecondary, fontSize: 15 }}>
            {t("home.postEntryPrompt", { name: firstName })}
          </ThemedText>

          <Pressable style={styles.actionButton} onPress={onPress}>
            <Ionicons name="home-outline" size={24} color="#4ade80" />
            {/* <ThemedText style={[styles.actionText, { color: color.textSecondary }]}>Add Room</ThemedText> */}
          </Pressable>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ccc",
  },
  inputButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    justifyContent: "space-between",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  divider: {
    height: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
