import { BlurView } from "expo-blur";
import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/ui/icon-symbol";
import type { ThemeAesthetic, ThemeMode } from "@/constants/theme-presets";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { useTheme } from "@/hooks/use-theme";
import type { LocaleCode } from "@/lib/i18n-core";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const AESTHETICS: ThemeAesthetic[] = ["cute", "modern", "classic"];
const MODES: ThemeMode[] = ["light", "dark", "system"];

export function SettingsModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { color, radius, scheme } = useAppTheme();
  const { aesthetic, setAesthetic, mode, setMode } = useTheme();
  const { locale, setLocale, t } = useLanguage();

  const cardRadius = radius.lg;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"}
      onRequestClose={onClose}
    >
      <View style={[styles.root, { backgroundColor: color.background }]}>
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={scheme === "dark" ? 40 : 55}
            tint={scheme === "dark" ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
        ) : null}

        <View
          style={[
            styles.header,
            {
              paddingTop: Math.max(insets.top, 12),
              borderBottomColor: color.border,
              backgroundColor:
                Platform.OS === "ios" ? "transparent" : color.backgroundSecondary,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: color.text }]}>
                {t("settings.title")}
              </Text>
              <Text style={[styles.subtitle, { color: color.textSecondary }]}>
                {t("settings.subtitle")}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.doneBtn,
                {
                  backgroundColor: pressed ? color.backgroundSecondary : color.card,
                  borderRadius: radius.md,
                },
              ]}
            >
              <Text style={[styles.doneText, { color: color.primary }]}>
                {t("settings.done")}
              </Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.body,
            { paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.sectionLabel, { color: color.textSecondary }]}>
            {t("settings.appearance")}
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: color.card,
                borderColor: color.border,
                borderRadius: cardRadius,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: color.text }]}>
              {t("settings.colorMode")}
            </Text>
            {MODES.map((m, i) => (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                style={[
                  styles.row,
                  i < MODES.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: color.border,
                  },
                ]}
              >
                <Text style={[styles.rowLabel, { color: color.text }]}>
                  {m === "light"
                    ? t("settings.modeLight")
                    : m === "dark"
                      ? t("settings.modeDark")
                      : t("settings.modeSystem")}
                </Text>
                <View
                  style={[
                    styles.radio,
                    mode === m && {
                      borderColor: color.primary,
                      backgroundColor: color.backgroundSecondary,
                    },
                  ]}
                >
                  {mode === m ? (
                    <View
                      style={[
                        styles.radioDot,
                        { backgroundColor: color.primary },
                      ]}
                    />
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>

          <Text
            style={[
              styles.sectionLabel,
              { color: color.textSecondary, marginTop: 20 },
            ]}
          >
            {t("settings.themeStyle")}
          </Text>

          <View style={{ gap: 12 }}>
            {AESTHETICS.map((a) => {
              const selected = aesthetic === a;
              const title =
                a === "cute"
                  ? t("settings.themeCute")
                  : a === "modern"
                    ? t("settings.themeModern")
                    : t("settings.themeClassic");
              const desc =
                a === "cute"
                  ? t("settings.themeCuteDesc")
                  : a === "modern"
                    ? t("settings.themeModernDesc")
                    : t("settings.themeClassicDesc");
              return (
                <Pressable
                  key={a}
                  onPress={() => setAesthetic(a)}
                  style={[
                    styles.themeCard,
                    {
                      borderColor: selected ? color.primary : color.border,
                      backgroundColor: color.card,
                      borderRadius: cardRadius,
                    },
                  ]}
                >
                  <View style={styles.themeCardHeader}>
                    <Text style={[styles.themeTitle, { color: color.text }]}>
                      {title}
                    </Text>
                    {selected ? (
                      <IconSymbol
                        name="checkmark.circle.fill"
                        size={22}
                        color={color.primary}
                      />
                    ) : null}
                  </View>
                  <Text
                    style={[styles.themeDesc, { color: color.textSecondary }]}
                  >
                    {desc}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text
            style={[
              styles.sectionLabel,
              { color: color.textSecondary, marginTop: 24 },
            ]}
          >
            {t("settings.language")}
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: color.card,
                borderColor: color.border,
                borderRadius: cardRadius,
              },
            ]}
          >
            {(["en", "vi"] as LocaleCode[]).map((code, i) => (
              <Pressable
                key={code}
                onPress={() => setLocale(code)}
                style={[
                  styles.row,
                  i === 0 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: color.border,
                  },
                ]}
              >
                <Text style={[styles.rowLabel, { color: color.text }]}>
                  {code === "en" ? t("settings.langEn") : t("settings.langVi")}
                </Text>
                {locale === code ? (
                  <IconSymbol
                    name="checkmark.circle.fill"
                    size={22}
                    color={color.primary}
                  />
                ) : null}
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
    lineHeight: 20,
  },
  doneBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  doneText: {
    fontSize: 16,
    fontWeight: "600",
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  card: {
    borderWidth: 1,
    paddingVertical: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowLabel: {
    fontSize: 16,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#999",
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  themeCard: {
    borderWidth: 2,
    padding: 16,
  },
  themeCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  themeTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  themeDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
});
