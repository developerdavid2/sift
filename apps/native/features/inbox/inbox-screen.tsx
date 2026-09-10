import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

import { Container } from "@/components/container";
import type {
  TabPagerHeaderProps,
  TabPagerPageProps,
} from "@/components/tab-pager-types";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useThemeColors } from "@/lib/theme";

export const InboxScreen = (_props: TabPagerPageProps) => {
  const colors = useThemeColors();
  const { user } = useCurrentUser();
  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <Container isScrollable={false}>
      <View style={styles.body}>
        <Text style={[styles.greeting, { color: colors.foreground }]}>
          Good {timeOfDay()}, {firstName}
        </Text>
        <Text style={[styles.hint, { color: colors.muted }]}>
          Your priority inbox will live here. Connecting Gmail comes next.
        </Text>
      </View>
    </Container>
  );
};

export function InboxHeader({ position }: TabPagerHeaderProps) {
  const colors = useThemeColors();
  const { user } = useCurrentUser();
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const actionsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(position.value, [0, 0.35], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          position.value,
          [0, 0.35],
          [0, -6],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <View style={styles.header}>
      <Text style={[styles.headerTitle, { color: colors.foreground }]}>
        Hello, {firstName}
      </Text>
      <Animated.View style={[styles.headerActions, actionsStyle]}>
        <Ionicons name="notifications-outline" size={22} color={colors.foreground} />
        <Ionicons name="search-outline" size={22} color={colors.foreground} />
      </Animated.View>
    </View>
  );
}

function timeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 8,
  },
  greeting: {
    fontSize: 22,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -0.5,
  },
  hint: {
    fontSize: 14,
    fontFamily: "Manrope_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  header: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingBottom: 2,
  },
});
