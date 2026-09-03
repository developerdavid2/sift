import "@/global.css";
import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/manrope";
import { env } from "@sift/env/native";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { NavigationBar } from "expo-navigation-bar";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { HeroUINativeProvider } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Platform } from "react-native";
import { useEffect } from "react";

import { AppThemeProvider, useAppTheme } from "@/contexts/app-theme-context";
import { useThemeColors } from "@/lib/theme";

export const unstable_settings = {
  initialRouteName: "index",
};

const convex = new ConvexReactClient(env.EXPO_PUBLIC_CONVEX_URL, {
  unsavedChangesWarning: false,
});

function ThemedSafeArea({ children }: { children: React.ReactNode }) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingBottom: insets.bottom,
      }}

      edges={["top", "left", "right"]}
    >
      {children}
    </SafeAreaView>
  );
}

function SystemBars() {
  const { isLight } = useAppTheme();
  const statusBarStyle = isLight ? "dark" : "light";
  const navBarStyle = isLight ? "dark" : "light";

  useEffect(() => {
    if (Platform.OS !== "android") return;
    NavigationBar.setStyle(navBarStyle);
  }, [navBarStyle]);

  return <StatusBar style={statusBarStyle} />;
}

function StackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}

export default function Layout() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ClerkProvider
        tokenCache={tokenCache}
        publishableKey={env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
      >
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AppThemeProvider>
                <HeroUINativeProvider>
                  <ThemedSafeArea>
                    <SystemBars />
                    <StackLayout />
                  </ThemedSafeArea>
                </HeroUINativeProvider>
              </AppThemeProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}
