import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { useThemeColors, type ThemeColors } from "@/lib/theme";

export type IconButtonTone = "brand" | "surface" | "danger" | "urgent";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  tone?: IconButtonTone;
  size?: number;
  badge?: boolean;
  accessibilityLabel: string;
  disabled?: boolean;
};

export function IconButton({
  icon,
  onPress,
  tone = "surface",
  size = 40,
  badge,
  accessibilityLabel,
  disabled,
}: Props) {
  const colors = useThemeColors();

  const palette = useMemo(() => TONE_PALETTES[tone](colors), [tone, colors]);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.background,
          opacity: pressed ? 0.7 : disabled ? 0.5 : 1,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
        styles.container,
      ]}
    >
      <Ionicons name={icon} size={size * 0.46} color={palette.foreground} />
      {badge ? (
        <View
          style={[styles.badge, { backgroundColor: colors.urgent }]}
          pointerEvents="none"
        />
      ) : null}
    </Pressable>
  );
}

const TONE_PALETTES: Record<
  IconButtonTone,
  (colors: ThemeColors) => { background: string; foreground: string }
> = {
  brand: (colors) => ({
    background: colors.brandPrimarySoft,
    foreground: colors.brandPrimary,
  }),
  surface: (colors) => ({
    background: colors.surfaceSecondary,
    foreground: colors.foreground,
  }),
  danger: (colors) => ({
    background: colors.dangerSoft,
    foreground: colors.danger,
  }),
  urgent: (colors) => ({
    background: colors.urgentSoft,
    foreground: colors.urgent,
  }),
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
});
