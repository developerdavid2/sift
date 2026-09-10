import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";

import { useAppReady } from "@/contexts/app-ready-context";

export default function Index() {
  const { isSignedIn } = useAuth();
  const { onboardingComplete } = useAppReady();

  if (isSignedIn) return <Redirect href="/(tabs)" />;
  if (onboardingComplete) return <Redirect href="/(auth)/sign-in" />;
  return <Redirect href="/(onboarding)" />;
}
