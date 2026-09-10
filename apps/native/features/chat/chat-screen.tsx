import { StyleSheet, Text, View } from "react-native";

import { Container } from "@/components/container";
import type {
  TabPagerHeaderProps,
  TabPagerPageProps,
} from "@/components/tab-pager-types";
import { useThemeColors } from "@/lib/theme";

export const ChatScreen = (_props: TabPagerPageProps) => {
  const colors = useThemeColors();

  return (
    <Container isScrollable={false}>
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Ask about your inbox
        </Text>
        <Text style={[styles.hint, { color: colors.muted }]}>
          "What's urgent today?" will work here.
        </Text>
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
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 8,
  },
  title: {
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
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  header: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
});
