import { Ionicons } from "@expo/vector-icons";
import { Children, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { useThemeColors } from "@/lib/theme";

type SettingsGroupProps = {
  title: string;
  children: ReactNode;
  style?: ViewStyle;
};

export function SettingsGroup({ title, children, style }: SettingsGroupProps) {
  const colors = useThemeColors();
  const rows = Children.toArray(children);

  return (
    <View style={[styles.group, style]}>
      <Text style={[styles.groupTitle, { color: colors.muted }]}>{title}</Text>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.separator },
        ]}
      >
        {rows.map((row, index) => {
          const isLast = index === rows.length - 1;
          return (
            <View
              key={index}
              style={[
                !isLast && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.separator,
                },
              ]}
            >
              {row}
            </View>
          );
        })}
      </View>
    </View>
  );
}

type SettingsRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  disabled?: boolean;
  tone?: "brand" | "danger" | "success";
  accessibilityLabel?: string;
};

type RowTone = {
  soft: keyof ReturnType<typeof useThemeColors>;
  icon: keyof ReturnType<typeof useThemeColors>;
};

const TINTS: Record<string, RowTone> = {
  brand: { soft: "brandPrimarySoft", icon: "brandPrimary" },
  danger: { soft: "dangerSoft", icon: "danger" },
  success: { soft: "successSoft", icon: "success" },
};

export function SettingsRow({
  icon,
  label,
  value,
  onPress,
  disabled,
  tone = "brand",
  accessibilityLabel,
}: SettingsRowProps) {
  const colors = useThemeColors();
  const tint = TINTS[tone];
  const isInteractive = !!onPress && !disabled;

  const inner = (
    <View style={styles.rowInner}>
      <View style={[styles.iconRing, { backgroundColor: colors[tint.soft] }]}>
        <Ionicons name={icon} size={18} color={colors[tint.icon]} />
      </View>
      <Text
        style={[
          styles.label,
          { color: disabled ? colors.muted : colors.foreground },
        ]}
      >
        {label}
      </Text>
      <View style={styles.rowEnd}>
        {value ? (
          <Text style={[styles.value, { color: colors.muted }]}>{value}</Text>
        ) : disabled ? (
          <Text style={[styles.value, { color: colors.muted }]}>Soon</Text>
        ) : null}
        {onPress && !disabled ? (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.separatorSecondary}
          />
        ) : null}
      </View>
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={!isInteractive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !isInteractive }}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
    >
      {inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 13,
    fontFamily: "Manrope_600SemiBold",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  row: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: "center",
  },
  rowInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Manrope_500Medium",
  },
  rowEnd: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  value: {
    fontSize: 14,
    fontFamily: "Manrope_500Medium",
  },
});
