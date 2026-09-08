import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const KEY = "sift_onboarding_done";

export async function isOnboardingDone(): Promise<boolean> {
  if (Platform.OS === "web") return false; // or read from localStorage
  const value = await SecureStore.getItemAsync(KEY);
  return value === "1";
}

export async function setOnboardingDone(): Promise<void> {
  if (Platform.OS === "web") return;
  await SecureStore.setItemAsync(KEY, "1");
}
