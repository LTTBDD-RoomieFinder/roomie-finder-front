import React from "react";
import { TextProps } from "react-native";

import { ThemedText } from "../themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";

type FormErrorProps = TextProps & {
  message?: string | null;
};

export default function FormError({ style, message }: FormErrorProps) {
  const errorColor = useThemeColor({}, "error");
  if (!message) return null;
  return (
    <ThemedText style={[style, { color: errorColor }]}>{message}</ThemedText>
  );
}
