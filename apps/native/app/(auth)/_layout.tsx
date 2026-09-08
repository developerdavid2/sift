import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "ios_from_right",
        animationTypeForReplace: "push",
      }}
    >
      <Stack.Screen name="congrats" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
