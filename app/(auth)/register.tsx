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
import { PasswordInput } from "@/components/ui/password-input";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { authService } from "@/services/auth";

export default function Register() {
  const router = useRouter();
  const { logo, color } = useAppTheme();
  const { t } = useLanguage();

  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (loading) return;

    if (!userName || !email || !password || !confirmPassword) {
      alert(t("auth.errors.allFieldsRequired"));
      return;
    }

    if (password !== confirmPassword) {
      alert(t("auth.errors.passwordMismatch"));
      return;
    }

    try {
      setLoading(true);

      await authService.register({
        username: userName,
        email,
        password,
      });

      await authService.login({ username: userName, password });
      router.replace("/(tabs)/home");
    } catch (error) {
      alert(error);
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
            <ThemedText type="title">{t("auth.signUp")}</ThemedText>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <ThemedText type="defaultSemiBold">{t("auth.username")}</ThemedText>
              <TextInput
                value={userName}
                onChangeText={setUserName}
                autoCapitalize="words"
                placeholder={t("auth.userPlaceholder")}
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

            <View style={styles.field}>
              <ThemedText type="defaultSemiBold">{t("auth.email")}</ThemedText>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder={t("auth.emailPlaceholder")}
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
              label={t("auth.password")}
              value={password}
              onChangeText={setPassword}
            />

            <PasswordInput
              label={t("auth.confirmPassword")}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <Pressable
              onPress={handleRegister}
              style={[
                styles.primaryButton,
                {
                  backgroundColor: color.primary,
                  borderColor: color.primary,
                },
              ]}
            >
              <ThemedText
                type="defaultSemiBold"
                style={{ color: color.primaryText }}
              >
                {t("auth.signUp")}
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <ThemedText>{t("auth.hasAccount")}</ThemedText>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <ThemedText type="link">{t("auth.signIn")}</ThemedText>
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
  },
  logo: {
    width: 200,
    height: 200,
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
