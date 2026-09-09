import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BottomSheet, Button, Card, Chip, Input, Switch } from "heroui-native";
import { useCallback, useMemo, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/contexts/app-theme-context";
import { useThemeColors } from "@/lib/theme";
import { Modal } from "react-native";
import { AuthView, UserButton, UserProfileView } from "@clerk/expo/native";
import { Link } from "expo-router";

// ---------------------------------------------------------------
// Static structural styles. Defined once at module scope so they are
// never recreated per render. Theme-dependent colors are injected via
// useMemo (recreated only when the resolved colors change).
// ---------------------------------------------------------------
const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.5,
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
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  swatch: {
    width: 72,
    borderRadius: 12,
    overflow: "hidden",
  },
  swatchColor: {
    height: 48,
  },
  swatchLabel: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: "center",
  },
  swatchName: {
    fontSize: 11,
    fontWeight: "600",
  },
  urgencyRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 12,
    paddingVertical: 6,
  },
  typeLabel: {
    width: 92,
    fontSize: 11,
    opacity: 0.6,
  },
  buttonStack: {
    gap: 10,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
});

const SWATCHES: { name: string; className: string }[] = [
  { name: "background", className: "bg-background" },
  { name: "surface", className: "bg-surface" },
  { name: "surface-2", className: "bg-surface-secondary" },
  { name: "surface-3", className: "bg-surface-tertiary" },
  { name: "foreground", className: "bg-foreground" },
  { name: "muted", className: "bg-muted" },
  { name: "border", className: "bg-border" },
  { name: "brand", className: "bg-brand-primary" },
  { name: "success", className: "bg-success" },
  { name: "warning", className: "bg-warning" },
  { name: "danger", className: "bg-danger" },
];

const URGENCY: {
  level: string;
  color: "danger" | "warning" | "default";
  dotClass: string;
}[] = [
  { level: "urgent", color: "danger", dotClass: "bg-urgent" },
  { level: "today", color: "warning", dotClass: "bg-today" },
  { level: "later", color: "default", dotClass: "bg-later" },
];

export default function DesignSystemScreen() {
  const { isLight, toggleTheme } = useAppTheme();
  const [inputValue, setInputValue] = useState("");
  const [vipEnabled, setVipEnabled] = useState(false);
  const [digestEnabled, setDigestEnabled] = useState(true);
  const [quietHours, setQuietHours] = useState(false);
  const [pressedVariant, setPressedVariant] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const colors = useThemeColors();

  const themedStyles = useMemo(
    () => ({
      typeLabel: {
        ...styles.typeLabel,
        color: colors.muted,
      },
      screen: {
        ...styles.screen,
        backgroundColor: colors.background,
      },
      sectionTitle: {
        ...styles.sectionTitle,
        color: colors.muted,
      },
      headerTitle: {
        ...styles.headerTitle,
        color: colors.foreground,
      },
    }),
    [colors],
  );

  const handlePress = useCallback((label: string) => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setPressedVariant(label);
  }, []);

  return (
    <View style={themedStyles.screen}>
      {/* Header */}
      <View style={[styles.header]}>
        <Text style={themedStyles.headerTitle}>Sift Design</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text
            style={{ color: colors.muted, fontSize: 12, fontWeight: "600" }}
          >
            {isLight ? "Light" : "Dark"}
          </Text>
          <Switch isSelected={!isLight} onSelectedChange={toggleTheme} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Colors */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="color-palette-outline"
              size={16}
              color={colors.brandPrimary}
            />
            <Text style={themedStyles.sectionTitle}>Color Tokens</Text>
          </View>
          <View style={styles.colorRow}>
            {SWATCHES.map((swatch) => (
              <View
                key={swatch.name}
                className="border-border border"
                style={styles.swatch}
              >
                <View className={swatch.className} style={styles.swatchColor} />
                <View
                  className="bg-surface-secondary"
                  style={styles.swatchLabel}
                >
                  <Text
                    style={{
                      color: colors.muted,
                      fontSize: 11,
                      fontWeight: "600",
                    }}
                  >
                    {swatch.name}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Urgency system */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="pulse-outline"
              size={16}
              color={colors.brandPrimary}
            />
            <Text style={themedStyles.sectionTitle}>Urgency System</Text>
          </View>
          <View style={styles.urgencyRow}>
            {URGENCY.map((u) => (
              <Chip key={u.level} variant="soft" color={u.color}>
                <View className={`w-2 h-2 rounded-full ${u.dotClass}`} />
                <Chip.Label>{u.level}</Chip.Label>
              </Chip>
            ))}
          </View>
        </View>

        {/* Typography */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="text-outline"
              size={16}
              color={colors.brandPrimary}
            />
            <Text style={themedStyles.sectionTitle}>Typography · Manrope</Text>
          </View>
          <Text
            className="text-foreground font-bold text-3xl"
            style={{ fontFamily: "Manrope_800ExtraBold" }}
          >
            A quiet inbox.
          </Text>
          <Text
            className="text-surface-foreground text-lg font-semibold"
            style={{ fontFamily: "Manrope_700Bold" }}
          >
            Priority, without the noise.
          </Text>
          <Text
            className="text-muted text-base"
            style={{ fontFamily: "Manrope_400Regular", lineHeight: 24 }}
          >
            This is body text in Manrope Regular. Sift watches your inbox and
            tells you only what matters — a deadline, an offer, a message from
            someone important.
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="hand-left-outline"
              size={16}
              color={colors.brandPrimary}
            />
            <Text style={themedStyles.sectionTitle}>
              Buttons · Click Response
            </Text>
          </View>

          <View style={styles.fieldLabel}>
            <Text style={{ color: colors.muted }} className="text-xs">
              {pressedVariant
                ? `Last pressed: ${pressedVariant}`
                : "Tap any button"}
            </Text>
          </View>
          <View style={styles.buttonStack}>
            {[
              { label: "Primary", variant: "primary" as const },
              { label: "Secondary", variant: "secondary" as const },
              { label: "Outline", variant: "outline" as const },
              { label: "Ghost", variant: "ghost" as const },
            ].map((btn) => (
              <Button
                key={btn.label}
                variant={btn.variant}
                className="w-full"
                onPress={() => handlePress(btn.label)}
              >
                <Button.Label>{btn.label}</Button.Label>
              </Button>
            ))}
          </View>

          <View style={styles.buttonStack}>
            <Button
              variant="primary"
              className="w-full"
              onPress={() => handlePress("Brand")}
            >
              <Button.Label>Brand</Button.Label>
            </Button>
            <Button
              variant="danger"
              className="w-full"
              onPress={() => handlePress("Danger")}
            >
              <Button.Label>Danger</Button.Label>
            </Button>
            <Button
              className="w-full bg-success"
              animation={{
                highlight: {
                  backgroundColor: { value: colors.successPressed },
                },
              }}
              onPress={() => handlePress("Success")}
            >
              <Button.Label className="text-success-foreground">
                Success
              </Button.Label>
            </Button>
          </View>

          <View style={styles.buttonStack}>
            {(["sm", "md", "lg"] as const).map((size) => (
              <Button
                key={size}
                variant="secondary"
                size={size}
                className="w-full"
                onPress={() => handlePress(size)}
              >
                <Button.Label>{size}</Button.Label>
              </Button>
            ))}
          </View>
        </View>

        {/* Inputs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="create-outline"
              size={16}
              color={colors.brandPrimary}
            />
            <Text style={themedStyles.sectionTitle}>Inputs</Text>
          </View>
          <View style={styles.fieldLabel}>
            <Text style={{ color: colors.muted }} className="text-xs">
              Email address
            </Text>
          </View>
          <Input
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            className="bg-surface border-border border px-4 py-3 rounded-lg text-foreground font-sans"
          />
        </View>

        <Link href="/congrats">
          <Text style={{ color: colors.accent, fontWeight: "600" }}>
            Congrats
          </Text>
        </Link>

        {/* Switches */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="toggle-outline"
              size={16}
              color={colors.brandPrimary}
            />
            <Text style={themedStyles.sectionTitle}>Switches</Text>
          </View>
          <Card variant="secondary" className="p-4 rounded-xl">
            {[
              {
                label: "Notifications",
                value: digestEnabled,
                onChange: setDigestEnabled,
              },
              {
                label: "VIP senders first",
                value: vipEnabled,
                onChange: setVipEnabled,
              },
              {
                label: "Quiet hours",
                value: quietHours,
                onChange: setQuietHours,
              },
            ].map((row) => (
              <View key={row.label} style={{ marginBottom: 12 }}>
                <View className="flex-row items-center justify-between">
                  <Text className="text-foreground text-sm font-medium">
                    {row.label}
                  </Text>
                  <Switch
                    isSelected={row.value}
                    onSelectedChange={row.onChange}
                  >
                    <Switch.Thumb></Switch.Thumb>
                  </Switch>
                </View>
              </View>
            ))}
          </Card>
        </View>
        <Button onPress={() => setIsAuthOpen(true)}>Sign In</Button>

        <Modal
          animationType="slide"
          visible={isAuthOpen}
          presentationStyle="pageSheet"
          onRequestClose={() => setIsAuthOpen(false)}
        >
          <UserProfileView onDismiss={() => setIsAuthOpen(false)} />
        </Modal>

        {/* Bottom Sheet */}
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
      </ScrollView>
    </View>
  );
}
