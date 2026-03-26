import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/constants/token";

function isWeb() {
  return Platform.OS === "web";
}

function getWebStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export async function getAccessToken() {
  if (isWeb()) {
    const storage = getWebStorage();
    return storage?.getItem(ACCESS_TOKEN_KEY) ?? null;
  }
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function setAccessToken(token: string) {
  if (isWeb()) {
    const storage = getWebStorage();
    storage?.setItem(ACCESS_TOKEN_KEY, token);
    return;
  }
  return SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export async function getRefreshToken() {
  if (isWeb()) {
    const storage = getWebStorage();
    return storage?.getItem(REFRESH_TOKEN_KEY) ?? null;
  }
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function setRefreshToken(token: string) {
  if (isWeb()) {
    const storage = getWebStorage();
    storage?.setItem(REFRESH_TOKEN_KEY, token);
    return;
  }
  return SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

export async function clearTokens() {
  if (isWeb()) {
    const storage = getWebStorage();
    storage?.removeItem(ACCESS_TOKEN_KEY);
    storage?.removeItem(REFRESH_TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
