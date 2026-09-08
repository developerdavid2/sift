import { useSignInWithGoogle } from "@clerk/expo/google";
import { AntDesign } from "@expo/vector-icons";
import { Button, Spinner } from "heroui-native";
import { useState } from "react";
import { Alert, Platform } from "react-native";

export function GoogleSignInButton({ disabled }: { disabled?: boolean }) {
  const { startGoogleAuthenticationFlow } = useSignInWithGoogle();
  const [isLoading, setIsLoading] = useState(false);

  if (Platform.OS === "web") return null;

  const handlePress = async () => {
    setIsLoading(true);
    try {
      const { createdSessionId, setActive } =
        await startGoogleAuthenticationFlow();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err: any) {
      if (err?.code === "SIGN_IN_CANCELLED" || err?.code === "-5") return;
      Alert.alert("Sign-in error", err?.message ?? "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full rounded-2xl"
      onPress={handlePress}
      isDisabled={disabled || isLoading}
    >
      {isLoading ? (
        <Spinner size="md" />
      ) : (
        <>
          <AntDesign name="google" size={20} color="#DB4437" />
          <Button.Label>Continue with Google</Button.Label>
        </>
      )}
    </Button>
  );
}
