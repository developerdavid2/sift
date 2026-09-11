import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { StyleSheet, Text, View } from "react-native";

import { Container } from "@/components/container";
import { EmptyState } from "@/components/empty-state";
import { IconButton } from "@/components/icon-button";
import type {
  TabPagerHeaderProps,
  TabPagerPageProps,
} from "@/components/tab-pager-types";
import { useThemeColors } from "@/lib/theme";

const SUGGESTIONS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: "flash-outline", label: "What's urgent today?" },
  { icon: "briefcase-outline", label: "Any job offers this week?" },
  { icon: "calendar-outline", label: "Which meetings need prep?" },
  { icon: "alert-circle-outline", label: "Anything time-sensitive?" },
];

export const ChatScreen = (_props: TabPagerPageProps) => {
  const colors = useThemeColors();

  return (
    <Container isScrollable={false}>
      <View style={styles.screen}>
        <View style={styles.center}>
          <EmptyState
            icon="chatbubble-ellipses-outline"
            title="Ask about your inbox"
            subtitle="Try one of these to see how Chat will work."
          />

          <View style={styles.suggestions}>
            {SUGGESTIONS.map((suggestion, index) => {
              const tint = colors.brandPrimary;
              return (
                <View
                  key={index}
                  style={[
                    styles.suggestion,
                    {
                      backgroundColor: colors.surfaceSecondary,
                      borderColor: colors.separator,
                    },
                  ]}
                >
                  <Ionicons name={suggestion.icon} size={14} color={tint} />
                  <View
                    style={[
                      styles.suggestionDot,
                      {
                        backgroundColor:
                          index === 0 ? colors.urgent : colors.muted,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.suggestionText,
                      { color: colors.foreground },
                    ]}
                  >
                    “{suggestion.label}”
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.composer}>
          <View
            style={[
              styles.composerField,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.separator,
              },
            ]}
          >
            <Text style={[styles.composerPlaceholder, { color: colors.muted }]}>
              Ask Sift anything about your inbox…
            </Text>
            <IconButton
              icon="arrow-up"
              tone="brand"
              size={36}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                  () => {},
                );
              }}
              accessibilityLabel="Send"
            />
          </View>
          <Text style={[styles.composerHint, { color: colors.muted }]}>
            Chat arrives in the next phase
          </Text>
        </View>
      </View>
    </Container>
  );
};

export function ChatHeader({ title }: TabPagerHeaderProps) {
  const colors = useThemeColors();
  return (
    <View style={styles.header}>
      <Text style={[styles.headerTitle, { color: colors.foreground }]}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  suggestions: {
    gap: 8,
    marginTop: 2,
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  suggestionDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Manrope_500Medium",
  },
  composer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 6,
  },
  composerField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 16,
    paddingRight: 6,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
  },
  composerPlaceholder: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Manrope_400Regular",
    marginRight: 8,
  },
  composerHint: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Manrope_400Regular",
  },
  header: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
});
