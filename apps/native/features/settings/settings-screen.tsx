import { Ionicons } from "@expo/vector-icons";
import { api } from "@sift/backend/convex/_generated/api";
import { UserProfileView } from "@clerk/expo/native";
import { useAuth } from "@clerk/expo";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { Container } from "@/components/container";
import { SettingsGroup, SettingsRow } from "@/components/settings-group";
import type {
  TabPagerHeaderProps,
  TabPagerPageProps,
} from "@/components/tab-pager-types";
import { useCurrentUser } from "@/hooks/queries/use-current-user";
import { useQueryState } from "@/hooks/queries/use-query";
import { useThemeColors } from "@/lib/theme";

export const SettingsScreen = (_props: TabPagerPageProps) => {
  const colors = useThemeColors();
  const { user } = useCurrentUser();
  const { signOut } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const inboxes = useQueryState(api.connectedInboxes.entries.list, {});
  const subscription = useQueryState(api.subscriptions.entries.get, {});

  const inboxCount = inboxes.data?.length ?? 0;
  const planLabel =
    subscription.data?.plan === "pro" || user?.plan === "pro"
      ? "Sift Pro"
      : "Free plan";

  const firstName = user?.name?.split(" ")[0] ?? "there";

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  return (
    <Container isScrollable>
      <View style={styles.content}>
        <Pressable
          onPress={() => setIsProfileOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="My account"
          style={({ pressed }) => [
            styles.profile,
            {
              backgroundColor: colors.surface,
              borderColor: colors.separator,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <View
            style={[
              styles.profileAvatar,
              { backgroundColor: colors.brandPrimarySoft },
            ]}
          >
            <Text
              style={[styles.profileInitials, { color: colors.brandPrimary }]}
            >
              {initials(user?.name)}
            </Text>
          </View>
          <View style={styles.profileMeta}>
            <Text
              numberOfLines={1}
              style={[styles.profileName, { color: colors.foreground }]}
            >
              {user?.name ?? "Guest"}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.profileEmail, { color: colors.muted }]}
            >
              {user?.email ?? "Sign in to sync"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>

        <SettingsGroup title="Account">
          <SettingsRow
            icon="person-outline"
            label="My account"
            value={firstName}
            onPress={() => setIsProfileOpen(true)}
          />
          <SettingsRow
            icon="diamond-outline"
            label="Sift plan"
            value={planLabel}
            onPress={handlePress}
          />
        </SettingsGroup>

        <SettingsGroup title="Inboxes">
          <SettingsRow
            icon="mail-unread-outline"
            label="Connected inboxes"
            value={inboxCount > 0 ? `${inboxCount}` : "Not connected"}
            disabled
          />
          <SettingsRow
            icon="notifications-outline"
            label="Notification rules"
            disabled
          />
        </SettingsGroup>

        <SettingsGroup title="Personalization">
          <SettingsRow icon="star-outline" label="VIP senders" disabled />
          <SettingsRow icon="funnel-outline" label="Category rules" disabled />
          <SettingsRow icon="mic-outline" label="Digest voice" disabled />
        </SettingsGroup>

        <SettingsGroup title="Support">
          <SettingsRow
            icon="help-buoy-outline"
            label="Help & feedback"
            onPress={handlePress}
          />
          <SettingsRow
            icon="log-out-outline"
            label="Sign out"
            tone="danger"
            onPress={signOut}
          />
        </SettingsGroup>
      </View>

      <Modal
        animationType="slide"
        visible={isProfileOpen}
        presentationStyle="pageSheet"
        onRequestClose={() => setIsProfileOpen(false)}
      >
        <UserProfileView onDismiss={() => setIsProfileOpen(false)} />
      </Modal>
    </Container>
  );
};

function initials(name?: string): string {
  const parts = (name ?? "?").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 26,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitials: {
    fontSize: 18,
    fontFamily: "Manrope_700Bold",
  },
  profileMeta: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 17,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: 13,
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
