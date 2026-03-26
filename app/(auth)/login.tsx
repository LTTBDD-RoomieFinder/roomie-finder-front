import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
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
import Divider from "@/components/ui/divider";
import FormError from "@/components/ui/form-error";
import { PasswordInput } from "@/components/ui/password-input";
import { AUTH_TEXT } from "@/constants/auth-text";
import { useAppTheme } from "@/hooks/use-app-theme";
import { authService } from "@/services/auth";

export default function Login() {
  const router = useRouter();
  const { logo, color } = useAppTheme();

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
      alert(AUTH_TEXT.SUCCESS.LOGIN_SUCCESS);
      router.replace("/(tabs)/home");
    } catch (error: any) {
      const message =
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={[styles.root, { backgroundColor: color.background }]}>
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
                placeholder="user"
                placeholderTextColor={color.placeholder}
                style={[
                  styles.input,
                  {
                    color: color.text,
                    borderColor: color.border,
                    backgroundColor: color.background,
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
              onPress={handleLogin}
              style={[
                styles.primaryButton,
                {
                  backgroundColor: color.primary,
                  borderColor: color.border,
                },
              ]}
            >
              <ThemedText
                type="defaultSemiBold"
                style={{ color: color.primaryText }}
              >
                Login
              </ThemedText>
            </Pressable>

            <Divider
              text="Or continue with"
              textStyle={{ color: color.text, opacity: 0.6 }}
            />

            <Pressable
              style={[
                styles.primaryButton,
                {
                  backgroundColor: color.background,
                  borderColor: color.border,
                },
              ]}
            >
              <Image
                source={require("@/assets/icons/google.png")}
                style={{ width: 20, height: 20, marginRight: 8 }}
              />
              <ThemedText type="defaultSemiBold">
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
    alignItems: "center",
    gap: 8,
  },
  logo: {
    width: 220,
    height: 220,
  },
  form: {
    gap: 10,
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
    gap: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
});
