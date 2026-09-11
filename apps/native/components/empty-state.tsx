import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useThemeColors, type ThemeColors } from "@/lib/theme";

export type EmptyStateTone =
  "brand" | "success" | "urgent" | "warning" | "muted";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  tone?: EmptyStateTone;
  compact?: boolean;
};

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
  tone = "brand",
  compact,
}: Props) {
  const colors = useThemeColors();
  const palette = useMemo(() => TONE_PALETTES[tone](colors), [tone, colors]);

  return (
    <View style={[styles.container, compact && styles.compact]}>
      <View
        style={[
          styles.iconRing,
          compact && styles.iconRingCompact,
          { backgroundColor: palette.soft },
        ]}
      >
        <Ionicons name={icon} size={compact ? 30 : 38} color={palette.icon} />
      </View>
      <Text
        style={[
          styles.title,
          compact && styles.titleCompact,
          { color: colors.foreground },
        ]}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {subtitle}
        </Text>
      ) : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const TONE_PALETTES: Record<
  EmptyStateTone,
  (colors: ThemeColors) => { soft: string; icon: string }
> = {
  brand: (colors) => ({
    soft: colors.brandPrimarySoft,
    icon: colors.brandPrimary,
  }),
  success: (colors) => ({ soft: colors.successSoft, icon: colors.success }),
  urgent: (colors) => ({ soft: colors.urgentSoft, icon: colors.urgent }),
  warning: (colors) => ({ soft: colors.warningSoft, icon: colors.warning }),
  muted: (colors) => ({ soft: colors.surfaceSecondary, icon: colors.muted }),
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  compact: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  iconRingCompact: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -0.3,
    textAlign: "center",
    marginBottom: 6,
  },
  titleCompact: {
    fontSize: 16,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Manrope_400Regular",
    lineHeight: 21,
    textAlign: "center",
    maxWidth: 280,
  },
  action: {
    marginTop: 20,
    alignSelf: "stretch",
    alignItems: "center",
  },
});
