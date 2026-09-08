import { Ionicons } from "@expo/vector-icons";
import { useSession, useSignIn } from "@clerk/expo";
import {
  Button,
  Input,
  TextField,
  Label,
  FieldError,
  useToast,
} from "heroui-native";
import { Link, type Href, useRouter } from "expo-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { useThemeColors } from "@/lib/theme";
import { GoogleSignInButton } from "@/features/auth/components/google-sign-in-button";
import { AppleSignInButton } from "@/features/auth/components/apple-sign-in-button";
import { OtpVerification } from "@/features/auth/components/otp-verification";

type Mode = "form" | "otp";

export default function SignInScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { signIn, fetchStatus } = useSignIn();
  const { session } = useSession();
  const { toast } = useToast();

  const [mode, setMode] = useState<Mode>("form");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const themed = useMemo(
    () => ({
      screen: { backgroundColor: colors.background },
      title: { color: colors.foreground },
      subtitle: { color: colors.muted },
    }),
    [colors],
  );

  /* -------------------------- effects -------------------------- */

  useEffect(() => {
    if (session?.status === "active") {
      router.replace("/(dev)" as Href);
    }
  }, [session?.status, router]);

  /* --------------------- semantic validation --------------------- */
  // Same shape as sign-up: pure functions, called from handleSubmit.

  const validateEmail = useCallback((email: string) => {
    if (!email) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Please enter a valid email address";
    return null;
  }, []);

  const validatePassword = useCallback((password: string) => {
    if (!password) return "Password is required";
    return null;
  }, []);

  const clearError = useCallback((field: "email" | "password") => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  // Same gate shape as sign-up's canSubmit: valid fields + not mid-request.
  const canSubmit =
    !validateEmail(emailAddress) &&
    !validatePassword(password) &&
    fetchStatus !== "fetching";

  /* -------------------------- handlers -------------------------- */

  const finalizeAndGo = async () => {
    await signIn.finalize({
      navigate: ({ session: s }) => {
        if (s?.currentTask) {
          console.log(s.currentTask);
          return;
        }
        router.replace("/(dev)" as Href);
      },
    });
  };

  const handleSubmit = async () => {
    // Mirrors sign-up's handleSubmit exactly: build the whole errors object,
    // set it once, bail if anything is truthy.
    const errors = {
      email: validateEmail(emailAddress) ?? undefined,
      password: validatePassword(password) ?? undefined,
    };
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    const { error } = await signIn.password({ emailAddress, password });

    if (error) {
      // Security: never reveal whether email exists, password wrong, or unverified
      toast.show({
        variant: "danger",
        label: "Sign-in failed",
        description: "Please check your credentials and try again.",
      });
      return;
    }

    if (signIn.status === "complete") {
      // Clerk deliberately doesn't expose email-verification status on
      // signIn.userData (it's typed as PublicUserData — firstName, lastName,
      // imageUrl, identifier, userId, username; no emailAddresses or
      // verification info). That's intentional: leaking verification state
      // to an unauthenticated client would let someone probe account status.
      // If you need to gate sign-in on a verified email, that has to be
      // enforced on Clerk's side (dashboard setting / server-side check),
      // not read out of the client SignIn object.
      await finalizeAndGo();
    } else if (signIn.status === "needs_client_trust") {
      const emailCodeFactor = signIn.supportedSecondFactors?.find(
        (factor) => factor.strategy === "email_code",
      );
      if (emailCodeFactor) {
        try {
          await signIn.mfa.sendEmailCode();
          setMode("otp");
        } catch {
          toast.show({
            variant: "danger",
            label: "Couldn't send code",
            description: "Failed to send verification code. Please try again.",
          });
        }
      }
    } else if (signIn.status === "needs_second_factor") {
      toast.show({
        variant: "warning",
        label: "Additional verification required",
        description: "Please complete your second-factor authentication.",
      });
    } else {
      toast.show({
        variant: "danger",
        label: "Unable to sign in",
        description: "Something went wrong. Please try again.",
      });
    }
  };

  const handleVerify = async (code: string) => {
    try {
      await signIn.mfa.verifyEmailCode({ code });
      if (signIn.status === "complete") {
        await finalizeAndGo();
        return {};
      }
      return { error: "Invalid or expired code. Please try again." };
    } catch {
      return { error: "Something went wrong. Please try again." };
    }
  };

  const handleResend = async () => {
    try {
      await signIn.mfa.sendEmailCode();
      return {};
    } catch {
      return { error: "Failed to resend code. Please try again." };
    }
  };

  if (mode === "otp") {
    return (
      <OtpVerification
        title="Verify your account"
        subtitle="Enter the code we sent to confirm it's you"
        onVerify={handleVerify}
        onResend={handleResend}
        onBack={() => {
          setMode("form");
          signIn.reset();
        }}
      />
    );
  }

  return (
    <View style={[styles.screen, themed.screen]}>
      <KeyboardAwareScrollView
        mode="layout"
        bottomOffset={32}
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, themed.title]}>Welcome back</Text>
          <Text style={[styles.subtitle, themed.subtitle]}>
            Log in to your quiet inbox
          </Text>
        </View>

        <View style={styles.iconWrap}>
          <View
            style={[styles.iconCircle, { backgroundColor: colors.accentSoft }]}
          >
            <Ionicons
              name="mail-unread-outline"
              size={48}
              color={colors.accent}
            />
          </View>
        </View>

        <View style={styles.form}>
          <TextField isInvalid={!!fieldErrors.email} isRequired>
            <Label>
              <Label.Text
                className="text-sm font-semibold text-muted"
                classNames={{
                  text: "font-bold",
                  asterisk: "text-brand-primary",
                }}
              >
                Email
              </Label.Text>
            </Label>
            <Input
              value={emailAddress}
              onChangeText={(text) => {
                setEmailAddress(text);
                clearError("email");
              }}
              onBlur={() => {
                if (!emailAddress.trim()) {
                  clearError("email");
                  return;
                }
                const err = validateEmail(emailAddress);
                setFieldErrors((prev) => ({
                  ...prev,
                  ...(err && { email: err }),
                }));
              }}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />
            <FieldError>{fieldErrors.email}</FieldError>
          </TextField>

          <TextField isInvalid={!!fieldErrors.password} isRequired>
            <Label>
              <Label.Text
                className="text-sm font-semibold text-muted"
                classNames={{
                  text: "font-bold",
                  asterisk: "text-brand-primary",
                }}
              >
                Password
              </Label.Text>
            </Label>
            <View className="w-full flex-row items-center">
              <Input
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  clearError("password");
                }}
                placeholder="••••••••"
                className="flex-1 pr-10"
                secureTextEntry={!showPassword}
                textContentType="password"
                autoComplete="current-password"
              />
              <Pressable
                className="absolute right-4"
                onPress={() => setShowPassword((v) => !v)}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.muted}
                />
              </Pressable>
            </View>
            <FieldError>{fieldErrors.password}</FieldError>
          </TextField>

          <Button
            variant="primary"
            className="w-full mt-2 rounded-2xl"
            onPress={handleSubmit}
            isDisabled={!canSubmit}
          >
            <Button.Label>Log In</Button.Label>
          </Button>

          <View style={styles.divider}>
            <View
              style={[styles.dividerLine, { backgroundColor: colors.border }]}
            />
            <Text style={[styles.dividerText, themed.subtitle]}>
              or continue with
            </Text>
            <View
              style={[styles.dividerLine, { backgroundColor: colors.border }]}
            />
          </View>

          <View className="flex-row gap-2">
            <GoogleSignInButton />
            <AppleSignInButton />
          </View>

          <View style={styles.footer}>
            <Text style={themed.subtitle}>Don't have an account? </Text>
            <Link href="/(auth)/sign-up">
              <Text style={{ color: colors.accent, fontWeight: "600" }}>
                Sign up
              </Text>
            </Link>
            <Link href="/(auth)/verify-otp">
              <Text style={{ color: colors.accent, fontWeight: "600" }}>
                OTP Demo
              </Text>
            </Link>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    gap: 6,
    marginBottom: 10,
    marginTop: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
  },
  iconWrap: {
    alignItems: "center",
    marginVertical: 20,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
  },
  form: {
    gap: 16,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontSize: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
});
