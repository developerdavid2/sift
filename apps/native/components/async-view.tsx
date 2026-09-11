import type { ReactNode } from "react";
import { View } from "react-native";

import { Spinner } from "heroui-native";

import { ErrorState } from "@/components/error-state";
import { useThemeColors } from "@/lib/theme";

type Props = {
  isLoading?: boolean;
  error?: unknown;
  isEmpty?: boolean;
  loading?: ReactNode;
  empty?: ReactNode;
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;
  children: ReactNode;
};

export function AsyncView({
  isLoading,
  error,
  isEmpty,
  loading,
  empty,
  errorTitle,
  errorMessage,
  onRetry,
  children,
}: Props) {
  if (error) {
    return (
      <ErrorState title={errorTitle} message={errorMessage} onRetry={onRetry} />
    );
  }

  if (isLoading) {
    return loading ?? <DefaultLoading />;
  }

  if (isEmpty) {
    return empty ?? null;
  }

  return <>{children}</>;
}

function DefaultLoading() {
  const colors = useThemeColors();
  return (
    <View style={styles.loading}>
      <Spinner color={colors.brandPrimary} />
    </View>
  );
}

const styles = {
  loading: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 48,
  },
};
