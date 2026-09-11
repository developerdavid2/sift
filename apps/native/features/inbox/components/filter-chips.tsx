import { Pressable, StyleSheet, ScrollView, Text, View } from "react-native";

import type { FeedUrgency } from "@/features/inbox/types";
import { useThemeColors } from "@/lib/theme";

export const FILTERS: {
  key: FeedUrgency | "all";
  label: string;
  urgency?: FeedUrgency;
}[] = [
  { key: "all", label: "All mail" },
  { key: "urgent", label: "Urgent", urgency: "urgent" },
  { key: "today", label: "Today", urgency: "today" },
  { key: "later", label: "Later", urgency: "later" },
];

type Props = {
  selected: FeedUrgency | "all";
  counts?: { urgent: number; today: number; later: number } | null;
  onChange: (key: FeedUrgency | "all") => void;
};

export function FilterChips({ selected, counts, onChange }: Props) {
  const colors = useThemeColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={styles.scroller}
    >
      {FILTERS.map((filter) => {
        const isSelected = selected === filter.key;
        const tint = filter.urgency
          ? colors[filter.urgency]
          : colors.brandPrimary;
        const count =
          filter.urgency && counts ? counts[filter.urgency] : undefined;

        return (
          <Pressable
            key={filter.key}
            onPress={() => onChange(filter.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: isSelected ? tint : colors.surfaceSecondary,
                opacity: pressed ? 0.75 : 1,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              },
            ]}
          >
            {filter.urgency ? (
              <View
                style={[
                  styles.dot,
                  { backgroundColor: isSelected ? colors.surface : tint },
                ]}
              />
            ) : null}
            <Text
              style={[
                styles.label,
                { color: isSelected ? colors.surface : colors.foreground },
              ]}
            >
              {filter.label}
            </Text>
            {count !== undefined && count > 0 ? (
              <View
                style={[
                  styles.count,
                  {
                    backgroundColor: isSelected ? colors.surface : tint,
                    opacity: 0.15,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.countLabel,
                    { color: isSelected ? tint : colors.foreground },
                  ]}
                >
                  {count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroller: {
    flexGrow: 0,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 14,
    fontFamily: "Manrope_600SemiBold",
    letterSpacing: -0.1,
  },
  count: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  countLabel: {
    fontSize: 12,
    fontFamily: "Manrope_700Bold",
  },
});
