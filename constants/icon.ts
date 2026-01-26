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

  "map.fill": "map",
  "location.fill": "location-on",
  "person.fill": "person",
  magnifyingglass: "search",
} as IconMapping;
