import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { isOnboardingDone, setOnboardingDone } from "@/lib/onboarding";

type AppReadyContextValue = {
  onboardingComplete: boolean;
  isReady: boolean;
  completeOnboarding: () => Promise<void>;
};

const AppReadyContext = createContext<AppReadyContextValue | null>(null);

export function AppReadyGate({ children }: { children: ReactNode }) {
  const [onboardingComplete, setOnboardingCompleteState] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    isOnboardingDone().then((done) => {
      setOnboardingCompleteState(done);
      setIsReady(true);
    });
  }, []);

  const completeOnboarding = async () => {
    await setOnboardingDone();
    setOnboardingCompleteState(true);
  };

  if (!isReady) return null;

  return (
    <AppReadyContext.Provider
      value={{ onboardingComplete, isReady, completeOnboarding }}
    >
      {children}
    </AppReadyContext.Provider>
  );
}

export function useAppReady() {
  const ctx = useContext(AppReadyContext);
  if (!ctx) throw new Error("useAppReady must be used within AppReadyGate");
  return ctx;
}
