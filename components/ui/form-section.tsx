import React from "react";
import { useAppTheme } from "@/hooks/use-app-theme";
import { ThemedText } from "../themed-text";
import { StyleSheet, View } from "react-native";


export default function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { color } = useAppTheme();

  return (
    <View
      style={[
        styles.section,
        {
          backgroundColor: color.card,
        },
      ]}
    >
      <ThemedText type="subtitle" style={styles.sectionTitle}>{title}</ThemedText>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: 20,
    gap: 16,
    borderRadius: 24,
    borderCurve: "continuous",
    boxShadow: "0px 2px 12px rgba(0, 0, 0, 0.04)",
  },
  sectionTitle: {
    fontSize: 18,
  },
  sectionContent: {
    gap: 16,
  },
});