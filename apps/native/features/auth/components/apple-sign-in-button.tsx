import { Ionicons } from "@expo/vector-icons";
import { useSignInWithApple } from "@clerk/expo/apple";
import { Button, Spinner } from "heroui-native";
import { useState } from "react";
import { Alert, Platform } from "react-native";

export function AppleSignInButton({ disabled }: { disabled?: boolean }) {
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const [isLoading, setIsLoading] = useState(false);

  if (Platform.OS !== "ios") return null;

  const handlePress = async () => {
    setIsLoading(true);
    try {
      const { createdSessionId, setActive } =
        await startAppleAuthenticationFlow();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err: any) {
      if (err?.code === "ERR_REQUEST_CANCELED") return;
      Alert.alert("Sign-in error", err?.message ?? "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full"
      onPress={handlePress}
      isDisabled={disabled || isLoading}
    >
      {isLoading ? (
        <Spinner size="sm" />
      ) : (
        <>
          <Ionicons name="logo-apple" size={18} />
          <Button.Label>Continue with Apple</Button.Label>
        </>
      )}
    </Button>
  );
}
