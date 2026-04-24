import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, View, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useLanguage } from "@/hooks/use-language";
import { useAuthStore } from "@/stores/useAuthStore";

export default function AdminHubScreen() {
  const { color, scheme } = useAppTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const isDark = scheme === "dark";

  const isAdmin = useIsAdmin();
  const authInitialized = useAuthStore((s) => s.isInitialized);
  useEffect(() => {
    if (!authInitialized) return;
    if (!isAdmin) router.replace("/(tabs)/profile");
  }, [isAdmin, authInitialized]);

  if (!isAdmin) {
    return <View style={{ flex: 1, backgroundColor: color.background }} />;
  }

  const primaryLight = isDark ? "#1f3333" : "#e6faf9";
  const primaryBorder = isDark ? "#2e5c58" : "#99ddd9";

  return (
    <View style={[s.root, { backgroundColor: color.background }]}>
      <View
        style={[
          s.header,
          {
            paddingTop: insets.top + 10,
            backgroundColor: color.card,
            borderBottomColor: color.border,
          },
        ]}
      >
        <View style={s.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("common.goBack")}
            onPress={() => router.back()}
            style={({ pressed }) => [
              s.iconBtn,
              { backgroundColor: color.backgroundSecondary },
              pressed && { opacity: 0.72 },
            ]}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={22} color={color.text} />
          </Pressable>
          <View style={s.headerText}>
            <ThemedText style={[s.eyebrow, { color: color.textSecondary }]}>
              {t("adminHub.eyebrow")}
            </ThemedText>
            <ThemedText style={[s.title, { color: color.text }]}>{t("adminHub.title")}</ThemedText>
            <ThemedText style={[s.sub, { color: color.textSecondary }]}>{t("adminHub.subtitle")}</ThemedText>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <HubCard
          icon="shield-checkmark"
          iconBg={primaryLight}
          iconBorder={primaryBorder}
          iconColor={color.primary}
          title={t("adminHub.cardVerifyTitle")}
          description={t("adminHub.cardVerifyDesc")}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/admin/verifications");
          }}
          color={color}
        />
        <HubCard
          icon="flag"
          iconBg={isDark ? "#3b2a20" : "#fff4e6"}
          iconBorder={isDark ? "#6b4420" : "#fdba74"}
          iconColor="#ea580c"
          title={t("adminHub.cardReportsTitle")}
          description={t("adminHub.cardReportsDesc")}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/admin/reports");
          }}
          color={color}
        />

        <View style={[s.hintBox, { backgroundColor: color.backgroundSecondary, borderColor: color.border }]}>
          <Ionicons name="information-circle-outline" size={20} color={color.textSecondary} />
          <ThemedText style={[s.hintText, { color: color.textSecondary }]}>{t("adminHub.footerHint")}</ThemedText>
        </View>
      </ScrollView>
    </View>
  );
}

type HubTheme = {
  card: string;
  border: string;
  backgroundSecondary: string;
  text: string;
  textSecondary: string;
  primary: string;
};

function HubCard({
  icon,
  iconBg,
  iconBorder,
  iconColor,
  title,
  description,
  onPress,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  title: string;
  description: string;
  onPress: () => void;
  color: HubTheme;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.card,
        {
          backgroundColor: color.card,
          borderColor: color.border,
          opacity: pressed ? (Platform.OS === "ios" ? 0.9 : 1) : 1,
          transform: pressed && Platform.OS === "ios" ? [{ scale: 0.985 }] : [],
        },
      ]}
      android_ripple={{ color: `${color.primary}22` }}
    >
      <View style={[s.cardIcon, { backgroundColor: iconBg, borderColor: iconBorder }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <View style={s.cardBody}>
        <ThemedText style={[s.cardTitle, { color: color.text }]}>{title}</ThemedText>
        <ThemedText style={[s.cardDesc, { color: color.textSecondary }]}>{description}</ThemedText>
      </View>
      <View style={[s.chevron, { backgroundColor: color.backgroundSecondary, borderColor: color.border }]}>
        <Ionicons name="chevron-forward" size={18} color={color.textSecondary} />
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1, minWidth: 0, gap: 3 },
  eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },
  title: { fontSize: 20, fontWeight: "600", letterSpacing: -0.3 },
  sub: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  scroll: { padding: 16, gap: 14 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: "continuous",
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardBody: { flex: 1, minWidth: 0, gap: 4 },
  cardTitle: { fontSize: 16, fontWeight: "600", letterSpacing: -0.15 },
  cardDesc: { fontSize: 13, lineHeight: 18 },
  chevron: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  hintBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  hintText: { flex: 1, fontSize: 12, lineHeight: 17 },
});
