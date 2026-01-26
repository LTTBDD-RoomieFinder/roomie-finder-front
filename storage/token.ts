import * as SecureStore from "expo-secure-store";

import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/constants/token";

export async function getAccessToken() {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function setAccessToken(token: string) {
  return SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export async function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function setRefreshToken(token: string) {
  return SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
