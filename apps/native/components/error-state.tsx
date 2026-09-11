import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "heroui-native";

import { EmptyState, type EmptyStateTone } from "@/components/empty-state";
import { useThemeColors } from "@/lib/theme";

type Props = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  tone?: EmptyStateTone;
};

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this. Please try again.",
  onRetry,
  retryLabel = "Try again",
  tone = "urgent",
}: Props) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <EmptyState
        icon="cloud-offline-outline"
        title={title}
        subtitle={message}
        tone={tone}
      />
      {onRetry ? (
        <Button variant="secondary" onPress={onRetry} className="mt-2">
          <Ionicons name="refresh" size={16} color={colors.brandPrimary} />
          <Button.Label>{retryLabel}</Button.Label>
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
});
