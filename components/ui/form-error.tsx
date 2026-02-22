import React from "react";
import { ThemedText } from "../themed-text";
import { TextProps, useColorScheme } from "react-native";
import { Colors } from "@/constants/theme";

type FormErrorProps = TextProps & {
  message?: string | null;
};

export default function FormError({ style, message }: FormErrorProps) {
  const colorScheme = useColorScheme() ?? "light";
  if (!message) return null;
  return (
    <ThemedText style={[style, { color: Colors[colorScheme].error }]}>
      {message}
    </ThemedText>
  );
}
