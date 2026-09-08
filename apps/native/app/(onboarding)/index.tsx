import { Ionicons } from "@expo/vector-icons";
import { Button } from "heroui-native";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useThemeColors } from "@/lib/theme";
import { useRouter } from "expo-router";

export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  const themed = useMemo(
    () => ({
      screen: { backgroundColor: colors.background },
      title: { color: colors.foreground },
      subtitle: { color: colors.muted },
    }),
    [colors],
  );

  return (
    <View style={[styles.screen, themed.screen]}>
      <View style={styles.body}>
        <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
          <Ionicons name="mail-open-outline" size={48} color={colors.accent} />
        </View>

        <Text style={[styles.title, themed.title]}>
          A quiet inbox.{"\n"}Only what matters.
        </Text>

        <Text style={[styles.subtitle, themed.subtitle]}>
          Sift watches your email and surfaces only what needs your attention —
          deadlines, offers, messages from people who matter.
        </Text>
      </View>

      <View className="mb-4 gap-y-4">
        <Button
          variant="primary"
          className="w-full"
          onPress={() => router.push("/(onboarding)/slides")}
        >
          <Button.Label>Get Started</Button.Label>
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24, justifyContent: "space-between" },
  body: { alignItems: "center", marginTop: 120, gap: 28 },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.6,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 8,
  },
});
