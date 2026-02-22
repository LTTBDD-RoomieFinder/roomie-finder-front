import React, { useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { IconSymbol } from "./icon-symbol";

export type PasswordInputProps = Omit<TextInputProps, "secureTextEntry"> & {
  label: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export function PasswordInput({
  label,
  value,
  onChangeText,
  placeholder = "••••••••",
  containerStyle,
  style,
  ...rest
}: PasswordInputProps) {
  const colorScheme = useColorScheme() ?? "light";

  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");
  const tintColor = useThemeColor({}, "tint");
  const borderColor = useThemeColor({}, "icon");

  const placeholderTextColor = useMemo(() => {
    return Colors[colorScheme].icon;
  }, [colorScheme]);

  const [isSecure, setIsSecure] = useState(true);

  return (
    <View style={[styles.field, containerStyle]}>
      <ThemedText type="defaultSemiBold">{label}</ThemedText>
      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          secureTextEntry={isSecure}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          style={[
            styles.input,
            {
              color: textColor,
              borderColor,
              backgroundColor,
            },
            style,
          ]}
          {...rest}
        />

        <Pressable
          onPress={() => setIsSecure((prev) => !prev)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={isSecure ? "Show password" : "Hide password"}
          style={styles.toggle}
        >
          <ThemedText style={[styles.toggleText, { color: tintColor }]}>
            {isSecure ? <IconSymbol name="eye.slash" color={tintColor} size={16} /> : <IconSymbol name="eye" color={tintColor} size={16} /> }
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  inputWrap: {
    position: "relative",
    justifyContent: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingRight: 72,
    fontSize: 16,
  },
  toggle: {
    position: "absolute",
    right: 12,
    height: "100%",
    justifyContent: "center",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
