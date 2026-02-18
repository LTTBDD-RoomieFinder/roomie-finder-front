import { Image } from "expo-image";
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

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PasswordInput } from "@/components/ui/password-input";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useThemeLogo } from "@/hooks/use-theme-logo";
import { authService } from "@/services/auth";

export default function Register() {
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

  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (loading) return;

    if (!userName || !email || !password || !confirmPassword) {
      alert("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const response = await authService.register({
        username: userName,
        email,
        password,
      });
      console.log("Registration successful:", response);
      alert("Registration successful!");
    } catch (error) {
      console.error("Registration failed:", error);
      alert("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
            <ThemedText type="title">Sign Up</ThemedText>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <ThemedText type="defaultSemiBold">Username</ThemedText>
              <TextInput
                value={userName}
                onChangeText={setUserName}
                autoCapitalize="words"
                placeholder="user"
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

            <View style={styles.field}>
              <ThemedText type="defaultSemiBold">Email</ThemedText>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="you@example.com"
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
              placeholder="••••••••"
            />

            <PasswordInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
            />

            <Pressable
              onPress={() => {
                handleRegister();
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
                Sign Up
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <ThemedText>Already have an account?</ThemedText>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <ThemedText type="link">Sign In</ThemedText>
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
    // gap: 8,
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 200,
  },
  subtitle: {
    opacity: 0.8,
    textAlign: "center",
  },
  form: {
    gap: 14,
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
  primaryButton: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
});
