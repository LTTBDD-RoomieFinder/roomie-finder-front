//use MaterialIcons from Google, add more if need

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";

type IconMapping = Record<
  SymbolViewProps["name"],
  ComponentProps<typeof MaterialIcons>["name"]
>;

export const ICON_MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",

  "map.fill": "map",
  "location.fill": "location-on",
  "person.fill": "person",

  "bed.double.fill": "hotel",

  "eye": "visibility",
  "eye.slash": "visibility-off",
  magnifyingglass: "search",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  "envelope.fill": "mail",
  "tray.and.arrow.down.fill": "inbox",
  "tray.and.arrow.up.fill": "send",

  "info.circle.fill": "info",
  "exclamationmark.circle.fill": "error",
  "clock.fill": "schedule",
  "checkmark.seal.fill": "verified",
  "bubble.left.and.bubble.right.fill": "chat",
  "questionmark.circle": "help",
} as IconMapping;
