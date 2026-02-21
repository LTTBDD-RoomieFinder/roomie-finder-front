import { Link, useRouter } from "expo-router";
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
import Divider from "@/components/ui/divider";
import { PasswordInput } from "@/components/ui/password-input";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useThemeLogo } from "@/hooks/use-theme-logo";
import { authService } from "@/services/auth";
import { AUTH_TEXT } from "@/constants/auth-text";
import FormError from "@/components/ui/form-error";

export default function Login() {
  const router = useRouter();
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
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) return;

    if (!userName || !password) {
      setError(AUTH_TEXT.ERRORS.EMPTY_FIELDS);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await authService.login({ username: userName, password });
      router.replace("/(tabs)/home");
    } catch (error) {
      console.error("Login failed:", error);
      setError(AUTH_TEXT.ERRORS.LOGIN_FAILED);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (idToken: string) => {
    try {
      setLoading(true);
      setError(null);

      await authService.googleLogin(idToken);
      router.replace("/(tabs)/home");
    } catch (error) {
      setError(AUTH_TEXT.ERRORS.GOOGLE_LOGIN_FAILED);
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
            <Image source={logo} style={styles.logo} contentFit="contain" />
            <ThemedText type="title">Sign In</ThemedText>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <ThemedText type="defaultSemiBold">Username</ThemedText>
              <TextInput
                value={userName}
                onChangeText={setUserName}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="default"
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

            <PasswordInput
              label="Password"
              value={password}
              onChangeText={setPassword}
            />

            <FormError message={error} />

            <Link href="/(auth)/forgot-password" asChild>
              <Pressable style={styles.linkRow}>
                <ThemedText type="link">Forgot password?</ThemedText>
              </Pressable>
            </Link>

            <Pressable
              onPress={() => {
                handleLogin();
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
                handleGoogleLogin("mock-google-id-token");
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
