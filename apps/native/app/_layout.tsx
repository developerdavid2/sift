// app/_layout.tsx
import "@/global.css";
import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { env } from "@sift/env/native";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { NavigationBar } from "expo-navigation-bar";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { HeroUINativeProvider } from "heroui-native";
import { useEffect } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { AppReadyGate } from "@/contexts/app-ready-context";
import { AppThemeProvider, useAppTheme } from "@/contexts/app-theme-context";
import { useAppReady } from "@/contexts/app-ready-context";
import { useThemeColors } from "@/lib/theme";

SplashScreen.preventAutoHideAsync();

const convex = new ConvexReactClient(env.EXPO_PUBLIC_CONVEX_URL, {
  unsavedChangesWarning: false,
});

function ThemedSafeArea({ children }: { children: React.ReactNode }) {
  const colors = useThemeColors();
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "bottom", "left", "right"]}
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

function AppStack() {
  const { isSignedIn, isLoaded } = useAuth({ treatPendingAsSignedOut: false });
  const { onboardingComplete } = useAppReady();

  useEffect(() => {
    if (isLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoaded]);

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  console.log("[Layout]", { isSignedIn, onboardingComplete });

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Entry redirector */}
      <Stack.Screen name="index" />

      {/* Onboarding: only if never done and not signed in */}
      <Stack.Protected guard={!onboardingComplete && !isSignedIn}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>

      {/* Auth: only if onboarding done but not signed in */}
      <Stack.Protected guard={onboardingComplete && !isSignedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      {/* App: only if signed in */}
      <Stack.Protected guard={isSignedIn!}>
        <Stack.Screen name="(dev)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
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
                  <AppReadyGate>
                    <ThemedSafeArea>
                      <SystemBars />
                      <AppStack />
                    </ThemedSafeArea>
                  </AppReadyGate>
                </HeroUINativeProvider>
              </AppThemeProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}
