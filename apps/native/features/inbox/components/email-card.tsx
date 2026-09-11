import { Pressable, StyleSheet, Text, View } from "react-native";

import type { FeedUrgency, PriorityFeedItem } from "@/features/inbox/types";
import { relativeTime } from "@/lib/reltime";
import { useThemeColors } from "@/lib/theme";

const URGENCY_LABEL: Record<FeedUrgency, string> = {
  urgent: "Urgent",
  today: "Today",
  later: "Later",
};

type Props = {
  item: PriorityFeedItem;
  onPress?: () => void;
};

export function EmailCard({ item, onPress }: Props) {
  const colors = useThemeColors();
  const urgency = item.classification?.urgency ?? "later";
  const urgencyColor = colors[urgency];
  const time = relativeTime(item.receivedAt);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.sender}: ${item.subject}`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.separator,
          opacity: item.isRead ? 0.82 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      <View style={styles.dotColumn}>
        <View
          style={[
            styles.unreadDot,
            {
              backgroundColor: item.isRead
                ? "transparent"
                : colors.brandPrimary,
            },
          ]}
        />
      </View>

      <View
        style={[styles.avatar, { backgroundColor: colors.brandPrimarySoft }]}
      >
        <Text style={[styles.avatarText, { color: colors.brandPrimary }]}>
          {initials(item.sender)}
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text
            numberOfLines={1}
            style={[
              styles.sender,
              {
                color: item.isRead ? colors.muted : colors.foreground,
                fontFamily: item.isRead
                  ? "Manrope_500Medium"
                  : "Manrope_700Bold",
              },
            ]}
          >
            {item.sender}
          </Text>
          <Text style={[styles.time, { color: colors.muted }]}>{time}</Text>
        </View>

        <Text
          numberOfLines={1}
          style={[
            styles.subject,
            {
              color: item.isRead ? colors.muted : colors.foreground,
              fontFamily: item.isRead
                ? "Manrope_500Medium"
                : "Manrope_600SemiBold",
            },
          ]}
        >
          {item.subject}
        </Text>

        <View style={styles.reasonRow}>
          {item.classification ? (
            <View
              style={[
                styles.urgencyPill,
                { backgroundColor: withAlpha(urgencyColor, 0.12) },
              ]}
            >
              <View
                style={[styles.urgencyDot, { backgroundColor: urgencyColor }]}
              />
              <Text
                style={[styles.urgencyLabel, { color: urgencyColor }]}
                numberOfLines={1}
              >
                {URGENCY_LABEL[urgency]}
                {item.classification.reason
                  ? ` · ${item.classification.reason}`
                  : ""}
              </Text>
            </View>
          ) : (
            <Text
              numberOfLines={1}
              style={[styles.snippet, { color: colors.muted }]}
            >
              {item.snippet}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function withAlpha(hex: string, alpha: number): string {
  if (hex.startsWith("#") && (hex.length === 7 || hex.length === 9)) {
    const a = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, "0");
    return `${hex.slice(0, 7)}${a}`;
  }
  return hex;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    paddingRight: 16,
    paddingLeft: 4,
  },
  dotColumn: {
    width: 10,
    paddingTop: 6,
    alignItems: "center",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 15,
    fontFamily: "Manrope_700Bold",
  },
  body: {
    flex: 1,
    gap: 3,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  sender: {
    flex: 1,
    fontSize: 15,
    letterSpacing: -0.2,
  },
  time: {
    fontSize: 12,
    fontFamily: "Manrope_500Medium",
  },
  subject: {
    fontSize: 14,
    letterSpacing: -0.1,
  },
  reasonRow: {
    marginTop: 3,
    flexDirection: "row",
  },
  urgencyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    maxWidth: "100%",
  },
  urgencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  urgencyLabel: {
    flexShrink: 1,
    fontSize: 12,
    fontFamily: "Manrope_600SemiBold",
  },
  snippet: {
    fontSize: 13,
    fontFamily: "Manrope_400Regular",
  },
});
