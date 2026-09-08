import { useSignIn, useSignUp } from "@clerk/expo";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AuthProgressHeader } from "@/features/auth/components/auth-progress-header";
import { OtpVerification } from "@/features/auth/components/otp-verification";
import { useThemeColors } from "@/lib/theme";

type Flow = "sign-up" | "sign-in-unverified" | "sign-in-trust";

export default function VerifyOtpScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { flow, email } = useLocalSearchParams<{
    flow: Flow;
    email?: string;
  }>();

  const { signUp } = useSignUp();
  const { signIn } = useSignIn();

  const goToCongrats = () => router.push("/(auth)/congrats" as Href);

  const handleVerify = async (code: string) => {
    if (flow === "sign-up") {
      await signUp.verifications.verifyEmailCode({ code });
      if (signUp.status !== "complete") {
        return { error: "Invalid or expired code. Please try again." };
      }
      await signUp.finalize({
        navigate: ({ session }) => {
          if (session?.currentTask) {
            console.log(session.currentTask);
            return;
          }
          goToCongrats();
        },
      });
      return {};
    }

    if (flow === "sign-in-trust") {
      try {
        await signIn.mfa.verifyEmailCode({ code });
        if (signIn.status === "complete") {
          await signIn.finalize({
            navigate: ({ session }) => {
              if (session?.currentTask) {
                console.log(session.currentTask);
                return;
              }
              router.replace("/(dev)" as Href);
            },
          });
          return {};
        }
        return { error: "Invalid or expired code. Please try again." };
      } catch {
        return { error: "Something went wrong. Please try again." };
      }
    }

    if (flow === "sign-in-unverified") {
      // TODO: confirm the exact Clerk call for verifying an email during
      // sign-in in your SDK version — this differs from the mfa.* methods
      // above, which are for device-trust verification, not identity
      // verification. Once verified, route to congrats since this is the
      // user's first time completing account setup, however late.
      try {
        // await signIn.verifications.verifyEmailCode({ code });
        if (signIn.status === "complete") {
          goToCongrats();
          return {};
        }
        return { error: "Invalid or expired code. Please try again." };
      } catch {
        return { error: "Something went wrong. Please try again." };
      }
    }

    return { error: "Something went wrong. Please try again." };
  };

  const handleResend = async () => {
    if (flow === "sign-up") {
      const { error } = await signUp.verifications.sendEmailCode();
      return error ? { error: "Failed to resend code. Please try again." } : {};
    }
    if (flow === "sign-in-trust") {
      try {
        await signIn.mfa.sendEmailCode();
        return {};
      } catch {
        return { error: "Failed to resend code. Please try again." };
      }
    }
    // TODO: sign-in-unverified resend call, same caveat as above.
    return {};
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AuthProgressHeader step={2} onBack={() => router.back()} />
      <OtpVerification
        title="Verify your email"
        subtitle={
          email
            ? `We sent a code to ${email}`
            : "Enter the code sent to your email."
        }
        onVerify={handleVerify}
        onResend={handleResend}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  iconWrap: { alignItems: "center", marginVertical: 20 },
});
