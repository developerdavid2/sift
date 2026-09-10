import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Container } from "@/components/container";
import type {
  TabPagerHeaderProps,
  TabPagerPageProps,
} from "@/components/tab-pager-types";
import { useThemeColors } from "@/lib/theme";

export const DigestScreen = (_props: TabPagerPageProps) => {
  const colors = useThemeColors();

  return (
    <Container isScrollable={false}>
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Today's digest
        </Text>
        <Text style={[styles.hint, { color: colors.muted }]}>
          Your daily plain-English summary arrives here.
        </Text>
      </View>
    </Container>
  );
};

export function DigestHeader({ title }: TabPagerHeaderProps) {
  const colors = useThemeColors();
  return (
    <View style={styles.header}>
      <Text style={[styles.headerTitle, { color: colors.foreground }]}>
        {title}
      </Text>
      <Ionicons name="chevron-down" size={20} color={colors.foreground} />
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
});
