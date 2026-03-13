import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppTheme } from "@/hooks/use-app-theme";

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { color } = useAppTheme();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ThemedView style={[styles.container, { backgroundColor: color.background }]}>
        <View style={[styles.header, { borderBottomColor: color.border + "60" }]}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={12}
          >
            <IconSymbol name="chevron.left" size={24} color={color.primary} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Chat</ThemedText>
        </View>

        <View style={styles.content}>
          <View style={[styles.chatIconWrap, { backgroundColor: color.primary + "14" }]}>
            <IconSymbol name="bubble.left.and.bubble.right.fill" size={56} color={color.primary} />
          </View>
          <ThemedText style={[styles.title, { color: color.text }]}>
            Private chat room
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: color.text, opacity: 0.75 }]}>
            Message in real time to agree on price and house rules. (Coming soon)
          </ThemedText>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: { marginRight: 4 },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  chatIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 20,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 10,
    textAlign: "center",
    lineHeight: 22,
  },
});
