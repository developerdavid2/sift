import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewProps,
} from "react-native";

import { useThemeColors } from "@/lib/theme";

type AppHeaderProps = {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
  style?: ViewProps["style"];
};

export function AppHeader({
  title,
  showBackButton = false,
  onBack,
  right,
  style,
}: AppHeaderProps) {
  const navigation = useNavigation();
  const colors = useThemeColors();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View
      style={[styles.container, { borderBottomColor: colors.separator }, style]}
    >
      <View style={styles.side}>
        {showBackButton && (
          <Pressable
            onPress={handleBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor: pressed
                  ? colors.surfaceSecondary
                  : "transparent",
              },
            ]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.foreground} />
          </Pressable>
        )}
      </View>

      <Text
        style={[styles.title, { color: colors.foreground }]}
        numberOfLines={1}
      >
        {title}
      </Text>

      <View style={[styles.side, styles.rightSide]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  side: {
    width: 44,
  },
  rightSide: {
    alignItems: "flex-end",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -0.3,
  },
});
