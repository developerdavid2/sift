import { Modal, StyleSheet, Text, View } from "react-native";

import { Container } from "@/components/container";
import type {
  TabPagerHeaderProps,
  TabPagerPageProps,
} from "@/components/tab-pager-types";
import { useThemeColors } from "@/lib/theme";
import { useMemo, useState } from "react";
import { BottomSheet, Button } from "heroui-native";
import { UserProfileView } from "@clerk/expo/native";
import { Ionicons } from "@expo/vector-icons";

export const SettingsScreen = (_props: TabPagerPageProps) => {
  const colors = useThemeColors();
  const themedStyles = useMemo(
    () => ({
      sectionTitle: {
        ...styles.sectionTitle,
        color: colors.muted,
      },
    }),
    [colors],
  );
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <Container isScrollable={false}>
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Account & preferences
        </Text>
        <Text style={[styles.hint, { color: colors.muted }]}>
          Inboxes, VIPs, notifications and subscription will live here.
        </Text>
      </View>

      <Button onPress={() => setIsAuthOpen(true)}>User Profile</Button>

      <Modal
        animationType="slide"
        visible={isAuthOpen}
        presentationStyle="pageSheet"
        onRequestClose={() => setIsAuthOpen(false)}
      >
        <UserProfileView onDismiss={() => setIsAuthOpen(false)} />
      </Modal>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons
            name="albums-outline"
            size={16}
            color={colors.brandPrimary}
          />
          <Text style={themedStyles.sectionTitle}>Bottom Sheet</Text>
        </View>
        <BottomSheet>
          <BottomSheet.Trigger asChild>
            <Button variant="outline">
              <Button.Label>Open Sheet</Button.Label>
            </Button>
          </BottomSheet.Trigger>
          <BottomSheet.Portal>
            <BottomSheet.Overlay />
            <BottomSheet.Content detached={false} className="rounded-t-3xl">
              <BottomSheet.Close />
              <BottomSheet.Title>Snooze or archive</BottomSheet.Title>
              <BottomSheet.Description>
                Choose what happens next to this message.
              </BottomSheet.Description>
              <View style={styles.buttonStack} className="mt-4">
                <Button variant="secondary" className="w-full">
                  <Button.Label>Snooze</Button.Label>
                </Button>
                <Button variant="secondary" className="w-full">
                  <Button.Label>Archive</Button.Label>
                </Button>
              </View>
            </BottomSheet.Content>
          </BottomSheet.Portal>
        </BottomSheet>
      </View>
    </Container>
  );
};

export function SettingsHeader({ title }: TabPagerHeaderProps) {
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
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  buttonStack: {
    gap: 10,
  },
});
