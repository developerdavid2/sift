import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useEffect } from "react";
import { BackHandler, Text, View } from "react-native";

import { useThemeColors } from "@/lib/theme";

export default function OAuthCompleteScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { result, message } = useLocalSearchParams<{
    result?: string;
    message?: string;
  }>();

  const ok = result === "connected" || result === "already-connected";
  const title =
    result === "already-connected"
      ? "Inbox already connected"
      : ok
        ? "Connected to Gmail"
        : "Connection failed";
  const subtitle = ok
    ? "Taking you back to your inbox…"
    : typeof message === "string" && message
      ? message
      : "Couldn't connect your Gmail.";

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(tabs)" as Href);
    }, 1200);
    return () => clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, []);

  return (
    <View className="flex-1 items-center justify-center gap-4 px-8">
      <View
        className="items-center justify-center"
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: colors.accentSoft,
        }}
      >
        <Ionicons
          name={ok ? "checkmark-circle" : "alert-circle"}
          size={56}
          color={ok ? colors.accent : "#f87171"}
        />
      </View>
      <Text
        className="text-center text-xl font-extrabold"
        style={{ color: colors.foreground }}
      >
        {title}
      </Text>
      <Text
        className="text-center text-base"
        style={{ color: colors.muted }}
      >
        {subtitle}
      </Text>
    </View>
  );
}