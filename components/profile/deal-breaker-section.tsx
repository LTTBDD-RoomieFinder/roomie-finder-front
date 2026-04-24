import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { matchingService } from "@/services/matching-service";
import { DealBreakerType } from "@/types/enums";

const CACHE_KEY = "deal_breakers_cache_v1";

type DealBreakerMeta = {
  type: DealBreakerType;
  emoji: string;
  i18nKey: string;
};

const DEAL_BREAKERS: DealBreakerMeta[] = [
  { type: DealBreakerType.NO_SMOKING,                emoji: "🚭", i18nKey: "dealBreaker.NO_SMOKING" },
  { type: DealBreakerType.NO_PETS,                   emoji: "🐾", i18nKey: "dealBreaker.NO_PETS" },
  { type: DealBreakerType.NO_NIGHT_OWL,              emoji: "🌙", i18nKey: "dealBreaker.NO_NIGHT_OWL" },
  { type: DealBreakerType.NO_EARLY_BIRD,             emoji: "🌅", i18nKey: "dealBreaker.NO_EARLY_BIRD" },
  { type: DealBreakerType.SAME_GENDER_ONLY,          emoji: "👥", i18nKey: "dealBreaker.SAME_GENDER_ONLY" },
  { type: DealBreakerType.QUIET_ENVIRONMENT_REQUIRED, emoji: "🤫", i18nKey: "dealBreaker.QUIET_ENVIRONMENT_REQUIRED" },
  { type: DealBreakerType.NO_FREQUENT_GUESTS,        emoji: "🚪", i18nKey: "dealBreaker.NO_FREQUENT_GUESTS" },
];

export function DealBreakerSection() {
  const { color, scheme, radius } = useAppTheme();
  const { t } = useLanguage();

  const [selected, setSelected] = useState<Set<DealBreakerType>>(new Set());
  const [savedSet, setSavedSet] = useState<Set<DealBreakerType>>(new Set());
  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const isDark = scheme === "dark";
  const onPrimary = isDark ? "#151718" : "#fff";
  const primaryLight = isDark ? "#1f3333" : "#e6faf9";

  const isDirty =
    selected.size !== savedSet.size ||
    [...selected].some((v) => !savedSet.has(v));

  /** Load cached deal-breakers from AsyncStorage on mount. */
  const loadCache = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached: DealBreakerType[] = JSON.parse(raw);
        const s = new Set<DealBreakerType>(cached);
        setSelected(s);
        setSavedSet(new Set(s));
      }
    } catch {
      // ignore cache errors
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCache();
  }, [loadCache]);

  const toggle = useCallback((type: DealBreakerType) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await matchingService.updateDealBreakers({
        dealBreakers: [...selected],
      });
      const saved = new Set(selected);
      setSavedSet(saved);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify([...saved]));
      Alert.alert(t("common.success"), t("dealBreaker.saveSuccess"));
    } catch (e) {
      Alert.alert(
        t("common.error"),
        typeof e === "string" ? e : t("dealBreaker.errors.11001")
      );
    } finally {
      setSaving(false);
    }
  }, [selected, t]);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: color.backgroundSecondary,
          borderColor: color.border,
          borderRadius: radius.lg,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.sectionHeader}>
        <View style={[styles.iconWrap, { backgroundColor: primaryLight }]}>
          <IconSymbol name="exclamationmark.circle.fill" size={18} color={color.primary} />
        </View>
        <View style={styles.headerText}>
          <ThemedText style={[styles.sectionTitle, { color: color.primary }]}>
            {t("dealBreaker.sectionTitle")}
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: color.textSecondary }]}>
            {t("dealBreaker.sectionSubtitle")}
          </ThemedText>
        </View>
      </View>

      {/* Count badge */}
      {selected.size > 0 && (
        <View
          style={[
            styles.countBadge,
            { backgroundColor: color.primary + "1a", borderColor: color.primary + "33" },
          ]}
        >
          <ThemedText style={[styles.countText, { color: color.primary }]}>
            {selected.size} / {DEAL_BREAKERS.length} {t("dealBreaker.sectionTitle").toLowerCase()}
          </ThemedText>
        </View>
      )}

      {/* Loading skeleton */}
      {initialLoading ? (
        <ActivityIndicator color={color.primary} style={styles.loader} />
      ) : (
        <>
          {/* Chip grid */}
          <View style={styles.chipGrid}>
            {DEAL_BREAKERS.map(({ type, emoji, i18nKey }) => {
              const active = selected.has(type);
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? color.primary : color.background,
                      borderColor: active ? color.primary : color.border,
                    },
                  ]}
                  onPress={() => toggle(type)}
                  activeOpacity={0.75}
                >
                  <ThemedText style={styles.chipEmoji}>{emoji}</ThemedText>
                  <ThemedText
                    style={[
                      styles.chipLabel,
                      { color: active ? onPrimary : color.text },
                    ]}
                    numberOfLines={2}
                  >
                    {t(i18nKey)}
                  </ThemedText>
                  {active && (
                    <View
                      style={[
                        styles.chipCheckmark,
                        { backgroundColor: "rgba(255,255,255,0.25)" },
                      ]}
                    >
                      <ThemedText style={[styles.chipCheckmarkText, { color: onPrimary }]}>
                        ✓
                      </ThemedText>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Empty state */}
          {selected.size === 0 && (
            <ThemedText
              style={[styles.emptyHint, { color: color.textSecondary }]}
            >
              {t("dealBreaker.none")}
            </ThemedText>
          )}

          {/* Save button — visible only when dirty */}
          {isDirty && (
            <TouchableOpacity
              style={[
                styles.saveBtn,
                {
                  backgroundColor: color.primary,
                  opacity: saving ? 0.7 : 1,
                  borderRadius: radius.lg,
                },
              ]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color={onPrimary} size="small" />
              ) : (
                <ThemedText style={[styles.saveBtnText, { color: onPrimary }]}>
                  {t("dealBreaker.save")}
                  {isDirty ? ` (${selected.size})` : ""}
                </ThemedText>
              )}
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    marginBottom: 20,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  countBadge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  countText: {
    fontSize: 13,
    fontWeight: "600",
  },
  loader: {
    paddingVertical: 12,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 4,
  },
  chip: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  chipEmoji: {
    fontSize: 20,
    lineHeight: 24,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
    lineHeight: 18,
  },
  chipCheckmark: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  chipCheckmarkText: {
    fontSize: 10,
    fontWeight: "800",
  },
  emptyHint: {
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 8,
    fontStyle: "italic",
  },
  saveBtn: {
    marginTop: 16,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  saveBtnText: {
    fontWeight: "700",
    fontSize: 15,
  },
});
