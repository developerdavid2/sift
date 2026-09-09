import { Stack } from "expo-router";

import { useThemeColors } from "@/lib/theme";

export default function DevLayout() {
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "ios_from_right",
        animationTypeForReplace: "push",
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
