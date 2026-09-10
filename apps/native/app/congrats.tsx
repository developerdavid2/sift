import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { Button, LinkButton } from "heroui-native";
import { useEffect } from "react";
import { BackHandler, ScrollView, Text, View } from "react-native";

import { AuthProgressHeader } from "@/features/auth/components/auth-progress-header";
import { useThemeColors } from "@/lib/theme";

export default function CongratsScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <AuthProgressHeader step={3} />

      <View className="px-4 flex items-center">
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            paddingHorizontal: 32,
          }}
        >
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: colors.accentSoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="checkmark-circle" size={56} color={colors.accent} />
          </View>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "800",
              color: colors.foreground,
              textAlign: "center",
            }}
          >
            You're all set up!
          </Text>
          <Text
            style={{ fontSize: 15, color: colors.muted, textAlign: "center" }}
          >
            Your quiet inbox is ready. Let's get started.
          </Text>
        </View>
        <Button
          onPress={() => router.replace("/(tabs)" as Href)}
          className="w-full rounded-2xl mt-auto"
        >
          Go to Home
        </Button>
      </View>
    </ScrollView>
  );
}
