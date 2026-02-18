import { Link } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { Image } from "expo-image";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PasswordInput } from "@/components/ui/password-input";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColor } from "@/hooks/use-theme-color";
import Divider from "@/components/ui/divider";
import { useThemeLogo } from "@/hooks/use-theme-logo";

export default function Login() {
  const colorScheme = useColorScheme() ?? "light";

  const logo = useThemeLogo();
  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");
  const tintColor = useThemeColor({}, "tint");
  const borderColor = useThemeColor({}, "icon");

  const placeholderTextColor = useMemo(() => {
    const base = Colors[colorScheme].icon;
    return base;
  }, [colorScheme]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <ThemedView style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Image
              source={logo}
              style={styles.logo}
              contentFit="contain"
            />
            <ThemedText type="title">Sign In</ThemedText>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <ThemedText type="defaultSemiBold">Email</ThemedText>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="roomie@example.com"
                placeholderTextColor={placeholderTextColor}
                style={[
                  styles.input,
                  {
                    color: textColor,
                    borderColor,
                    backgroundColor,
                  },
                ]}
              />
            </View>

            <PasswordInput
              label="Password"
              value={password}
              onChangeText={setPassword}
            />

            <Link href="/(auth)/forgot-password" asChild>
              <Pressable style={styles.linkRow}>
                <ThemedText type="link">Forgot password?</ThemedText>
              </Pressable>
            </Link>

            <Pressable
              onPress={() => {
                // Mock UI: implement real login later
              }}
              style={[
                styles.primaryButton,
                { backgroundColor: tintColor, borderColor: tintColor },
              ]}
            >
              <ThemedText
                style={{
                  color:
                    colorScheme === "dark"
                      ? Colors.dark.background
                      : Colors.light.background,
                }}
                type="defaultSemiBold"
              >
                Login
              </ThemedText>
            </Pressable>

            <Divider
              text="Or continue with"
              textStyle={{ color: textColor, opacity: 0.6 }}
            />

            <Pressable
              onPress={() => {
                // Mock UI: implement real social login later
              }}
              style={[
                styles.primaryButton,
                { backgroundColor: backgroundColor, borderColor: borderColor },
              ]}
            >
              <Image
                source={require("@/assets/icons/google.png")}
                style={{ width: 20, height: 20, marginRight: 8 }}
              />
              <ThemedText
                style={{
                  color: textColor,
                }}
                type="defaultSemiBold"
              >
                Continue with Google
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <ThemedText>Don&apos;t have an account?</ThemedText>
            <Link href="/(auth)/register" asChild>
              <Pressable>
                <ThemedText type="link">Sign Up</ThemedText>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
    justifyContent: "center",
    gap: 24,
  },
  header: {
    gap: 8,
    alignItems: "center",
  },
  logo: {
    width: 250,
    height: 250,
  },
  subtitle: {
    opacity: 0.8,
    textAlign: "center",
  },
  form: {
    gap: 5,
  },
  field: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  linkRow: {
    alignSelf: "flex-end",
    paddingVertical: 6,
  },
  primaryButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
});
