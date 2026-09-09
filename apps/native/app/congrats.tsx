import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter, type Href } from "expo-router";
import { Button } from "heroui-native";
import { useEffect } from "react";
import { BackHandler, Text, View } from "react-native";

import { useThemeColors } from "@/lib/theme";
import { AuthProgressHeader } from "@/features/auth/components/auth-progress-header";

export default function CongratsScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AuthProgressHeader step={3} />

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

      <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        <Button
          variant="primary"
          className="w-full rounded-2xl"
          onPress={() => router.replace("/(dev)" as Href)}
        >
          <Button.Label>Go to Home</Button.Label>
        </Button>
      </View>
    </View>
  );
}
