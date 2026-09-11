import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";

import { useNetworkStatus } from "@/hooks/use-network-status";
import { useThemeColors } from "@/lib/theme";

export function OfflineBanner() {
  const colors = useThemeColors();
  const { isOffline, isUnknown } = useNetworkStatus();

  if (isUnknown || !isOffline) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(250)}
      exiting={FadeOutUp.duration(250)}
      style={[styles.banner, { backgroundColor: colors.warningSoft }]}
      pointerEvents="none"
    >
      <Ionicons name="cloud-offline-outline" size={14} color={colors.warning} />
      <Text style={[styles.text, { color: colors.warning }]}>
        You're offline
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 13,
    fontFamily: "Manrope_600SemiBold",
  },
});
