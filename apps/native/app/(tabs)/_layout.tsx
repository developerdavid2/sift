import { Stack } from "expo-router";

export default function TabsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "ios_from_right",
        animationTypeForReplace: "push",
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
