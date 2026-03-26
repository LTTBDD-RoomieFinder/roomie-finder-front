import type { IconPack } from "@/constants/theme-presets";
import { ICON_MAPPING } from "@/constants/icon";

export type IconSymbolName = keyof typeof ICON_MAPPING;

/** Ionicons names for cute theme (playful / rounded). */
export const ICON_ION: Record<string, string> = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-forward",
  "chevron.left": "chevron-back",
  "map.fill": "map",
  "location.fill": "location",
  "person.fill": "person",
  "bed.double.fill": "bed",
  eye: "eye",
  "eye.slash": "eye-off",
  magnifyingglass: "search",
  "checkmark.circle.fill": "checkmark-circle",
  "xmark.circle.fill": "close-circle",
  "envelope.fill": "mail",
  "tray.and.arrow.down.fill": "download",
  "tray.and.arrow.up.fill": "share",
  "info.circle.fill": "information-circle",
  "exclamationmark.circle.fill": "warning",
  "clock.fill": "time",
  "checkmark.seal.fill": "shield-checkmark",
  "bubble.left.and.bubble.right.fill": "chatbubbles",
  "questionmark.circle": "help-circle",
  "bell.fill": "notifications",
  "camera.fill": "camera",
  "heart.fill": "heart",
  "dollarsign.circle.fill": "cash",
  "tag.fill": "pricetag",
  "gearshape.fill": "settings-outline",
};

/** Feather outline names for modern theme; missing → Material fallback. */
export const ICON_FEATHER: Partial<Record<IconSymbolName, string>> = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "map.fill": "map",
  "location.fill": "map-pin",
  "person.fill": "user",
  eye: "eye",
  "eye.slash": "eye-off",
  magnifyingglass: "search",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "x-circle",
  "envelope.fill": "mail",
  "info.circle.fill": "info",
  "exclamationmark.circle.fill": "alert-circle",
  "clock.fill": "clock",
  "bubble.left.and.bubble.right.fill": "message-circle",
  "questionmark.circle": "help-circle",
  "bell.fill": "bell",
  "camera.fill": "camera",
  "heart.fill": "heart",
  "dollarsign.circle.fill": "dollar-sign",
  "tag.fill": "tag",
  "gearshape.fill": "settings",
};

export function resolveIconForPack(
  pack: IconPack,
  name: IconSymbolName,
): { family: "material" | "ion" | "feather"; glyph: string } {
  const material = ICON_MAPPING[name];

  if (pack === "material") {
    return { family: "material", glyph: material };
  }

  if (pack === "ion") {
    return { family: "ion", glyph: ICON_ION[name as string] ?? material };
  }

  const feather = ICON_FEATHER[name];
  if (feather) {
    return { family: "feather", glyph: feather };
  }

  return { family: "material", glyph: material };
}
