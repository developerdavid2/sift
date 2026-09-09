import { useSignIn, useSignUp } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter, type Href } from "expo-router";
import {
  Button,
  FieldError,
  Input,
  Label,
  Spinner,
  TextField,
  useToast,
} from "heroui-native";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { AppleSignInButton } from "@/features/auth/components/apple-sign-in-button";
import { GoogleSignInButton } from "@/features/auth/components/google-sign-in-button";
import { useThemeColors } from "@/lib/theme";

export default function SignInScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { signIn, fetchStatus } = useSignIn();
  const { signUp } = useSignUp();
  const { toast } = useToast();
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

  const isSubmitting = fetchStatus === "fetching";

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

  const canSubmit =
    !validateEmail(emailAddress) &&
    !validatePassword(password) &&
    !isSubmitting;

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
    const errors = {
      email: validateEmail(emailAddress) ?? undefined,
      password: validatePassword(password) ?? undefined,
    };
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    const { error } = await signIn.password({ emailAddress, password });

    if (error) {
      if (
        signUp?.status === "missing_requirements" &&
        signUp.unverifiedFields?.includes("email_address") &&
        signUp.emailAddress?.toLowerCase() === emailAddress.toLowerCase()
      ) {
        toast.show({
          variant: "warning",
          label: "Email not verified",
          description: "Redirecting you to complete verification...",
        });
        await signUp.verifications.sendEmailCode().catch(() => {});
        router.push({
          pathname: "/(auth)/verify-otp",
          params: { flow: "sign-up", email: emailAddress },
        } as Href);
        return;
      }

      toast.show({
        variant: "danger",
        label: "Sign-in failed",
        description: "Please check your credentials and try again.",
      });
      return;
    }

    if (signIn.status === "complete") {
      await finalizeAndGo();
    } else if (signIn.status === "needs_client_trust") {
      try {
        await signIn.mfa.sendEmailCode();
      } catch {}
      router.push({
        pathname: "/(auth)/verify-otp",
        params: { flow: "sign-in-trust", email: emailAddress },
      } as Href);
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
          <TextField
            isInvalid={!!fieldErrors.email}
            isRequired
            isDisabled={isSubmitting}
          >
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
              multiline={false}
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
              className="overflow-hidden"
            />
            <FieldError>{fieldErrors.email}</FieldError>
          </TextField>

          <TextField
            isInvalid={!!fieldErrors.password}
            isRequired
            isDisabled={isSubmitting}
          >
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
                multiline={false}
                onChangeText={(text) => {
                  setPassword(text);
                  clearError("password");
                }}
                onBlur={() => {
                  if (!password) {
                    clearError("password");
                    return;
                  }
                  const err = validatePassword(password);
                  setFieldErrors((prev) => ({
                    ...prev,
                    ...(err && { password: err }),
                  }));
                }}
                placeholder="••••••••"
                className="flex-1 pr-10 overflow-hidden"
                secureTextEntry={!showPassword}
                textContentType="password"
                autoComplete="current-password"
              />
              <Pressable
                className="absolute right-4"
                onPress={() => setShowPassword((v) => !v)}
                disabled={isSubmitting}
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
            {isSubmitting ? (
              <View className="flex-row items-center gap-2">
                <Spinner size="md" color="#FFFFFF" />
                <Button.Label>Signing in...</Button.Label>
              </View>
            ) : (
              <Button.Label>Log In</Button.Label>
            )}
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
            <GoogleSignInButton disabled={isSubmitting} />
            <AppleSignInButton disabled={isSubmitting} />
          </View>

          <View style={styles.footer}>
            <Text style={themed.subtitle}>Don't have an account? </Text>
            <Link href="/(auth)/sign-up">
              <Text
                style={{
                  color: colors.brandPrimarySoftForeground,
                  fontWeight: "600",
                  fontSize: 17,
                }}
              >
                Sign up
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
    alignItems: "baseline",
    marginTop: 24,
  },
});
