import { useSignUp } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { type Href, Link, useRouter } from "expo-router";
import {
  Button,
  Checkbox,
  ControlField,
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

import { AuthProgressHeader } from "@/features/auth/components/auth-progress-header";
import { GoogleSignInButton } from "@/features/auth/components/google-sign-in-button";
import { useThemeColors } from "@/lib/theme";

export default function SignUpScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { signUp, fetchStatus } = useSignUp();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const themed = useMemo(
    () => ({
      title: { color: colors.foreground },
      subtitle: { color: colors.muted },
    }),
    [colors],
  );

  const validateName = (value: string, label: string) => {
    const trimmed = value.trim();
    if (!trimmed) return `${label} is required`;
    if (trimmed.length < 2) return `${label} must be at least 2 characters`;
    return null;
  };

  const validateEmail = useCallback((email: string) => {
    if (!email) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Please enter a valid email address";
    return null;
  }, []);

  const validatePassword = useCallback((password: string) => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(password))
      return "Password must contain at least one uppercase letter";
    if (!/[0-9]/.test(password))
      return "Password must contain at least one number";
    return null;
  }, []);

  const validateConfirmPassword = useCallback(
    (confirmPassword: string) => {
      if (!confirmPassword) return "Please confirm your password";
      if (confirmPassword !== password) return "Passwords do not match";
      return null;
    },
    [password],
  );

  const clearError = useCallback((field: keyof typeof fieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const canSubmit =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    !validateEmail(emailAddress) &&
    !validatePassword(password) &&
    password === confirmPassword &&
    agreedToTerms &&
    fetchStatus !== "fetching";

  const handleSubmit = async () => {
    const errors = {
      firstName: validateName(firstName, "First name") ?? undefined,
      lastName: validateName(lastName, "Last name") ?? undefined,
      email: validateEmail(emailAddress) ?? undefined,
      password: validatePassword(password) ?? undefined,
      confirmPassword: validateConfirmPassword(confirmPassword) ?? undefined,
    };
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean) || !agreedToTerms) return;

    const { error } = await signUp.password({
      emailAddress,
      password,
      firstName,
      lastName,
    });

    if (error) {
      console.error("signUp.password error:", JSON.stringify(error, null, 2));

      const clerkErrors =
        (
          error as {
            errors?: {
              code?: string;
              message?: string;
              meta?: { paramName?: string };
            }[];
          }
        )?.errors ?? [];
      const paramToField: Record<string, keyof typeof fieldErrors> = {
        email_address: "email",
        password: "password",
        first_name: "firstName",
        last_name: "lastName",
      };

      const newFieldErrors: typeof fieldErrors = {};
      for (const e of clerkErrors) {
        const field = e.meta?.paramName && paramToField[e.meta.paramName];
        if (field && e.message) {
          newFieldErrors[field] = e.message;
        }
      }

      if (Object.keys(newFieldErrors).length > 0) {
        setFieldErrors((prev) => ({ ...prev, ...newFieldErrors }));
        toast.show({
          variant: "danger",
          label: "Unable to create account",
          description: "Please fix the highlighted field and try again.",
        });
      } else {
        toast.show({
          variant: "danger",
          label: "Unable to create account",
          description: "Please check your details and try again.",
        });
      }
      return;
    }

    const { error: sendErr } = await signUp.verifications.sendEmailCode();
    if (sendErr) {
      toast.show({
        variant: "danger",
        label: "Couldn't send code",
        description: "Please try again in a moment.",
      });
      return;
    }

    router.push({
      pathname: "/(auth)/verify-otp",
      params: { flow: "sign-up", email: emailAddress },
    } as Href);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AuthProgressHeader step={1} onBack={() => router.back()} />

      <KeyboardAwareScrollView
        mode="layout"
        bottomOffset={32}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, themed.title]}>Create your account</Text>
        </View>

        <View style={styles.iconWrap}>
          <View
            style={[styles.iconCircle, { backgroundColor: colors.accentSoft }]}
          >
            <Ionicons name="person" size={48} color={colors.accent} />
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.nameRow}>
            <TextField
              isInvalid={!!fieldErrors.firstName}
              isRequired
              isDisabled={fetchStatus === "fetching"}
              style={{ flex: 1 }}
            >
              <Label>
                <Label.Text
                  className="text-sm text-foreground"
                  classNames={{
                    text: "font-black",
                    asterisk: "text-brand-primary",
                  }}
                >
                  First name
                </Label.Text>
              </Label>
              <Input
                value={firstName}
                multiline={false}
                onChangeText={(text) => {
                  setFirstName(text);
                  clearError("firstName");
                }}
                onBlur={() => {
                  if (!firstName.trim()) {
                    clearError("firstName");
                    return;
                  }
                  const err = validateName(firstName, "First name");
                  setFieldErrors((prev) => ({
                    ...prev,
                    ...(err && { firstName: err }),
                  }));
                }}
                placeholder="Ada"
                autoCapitalize="words"
                autoComplete="given-name"
                textContentType="givenName"
                className="overflow-hidden"
              />
              <FieldError>{fieldErrors.firstName}</FieldError>
            </TextField>

            <TextField
              isInvalid={!!fieldErrors.lastName}
              isRequired
              isDisabled={fetchStatus === "fetching"}
              style={{ flex: 1 }}
            >
              <Label>
                <Label.Text
                  className="text-sm text-foreground"
                  classNames={{
                    text: "font-black",
                    asterisk: "text-brand-primary",
                  }}
                >
                  Last name
                </Label.Text>
              </Label>
              <Input
                value={lastName}
                multiline={false}
                onChangeText={(text) => {
                  setLastName(text);
                  clearError("lastName");
                }}
                onBlur={() => {
                  if (!lastName.trim()) {
                    clearError("lastName");
                    return;
                  }
                  const err = validateName(lastName, "Last name");
                  setFieldErrors((prev) => ({
                    ...prev,
                    ...(err && { lastName: err }),
                  }));
                }}
                placeholder="Lovelace"
                autoCapitalize="words"
                autoComplete="family-name"
                textContentType="familyName"
                className="overflow-hidden"
              />
              <FieldError>{fieldErrors.lastName}</FieldError>
            </TextField>
          </View>

          <TextField
            isInvalid={!!fieldErrors.email}
            isRequired
            isDisabled={fetchStatus === "fetching"}
          >
            <Label>
              <Label.Text
                className="text-sm text-foreground"
                classNames={{
                  text: "font-black",
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
            isDisabled={fetchStatus === "fetching"}
          >
            <Label>
              <Label.Text
                className="text-sm text-foreground"
                classNames={{
                  text: "font-black",
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
                autoComplete="password"
                textContentType="password"
              />
              <Pressable
                className="absolute right-4"
                onPress={() => setShowPassword((v) => !v)}
                disabled={fetchStatus === "fetching"}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.muted}
                />
              </Pressable>
            </View>
            <FieldError>{fieldErrors.password}</FieldError>
            {!fieldErrors.password && (
              <Text className="text-xs text-muted mt-1">
                At least 8 characters, with an uppercase letter and a number.
              </Text>
            )}
          </TextField>

          <TextField
            isInvalid={!!fieldErrors.confirmPassword}
            isRequired
            isDisabled={fetchStatus === "fetching"}
          >
            <Label>
              <Label.Text
                className="text-sm text-foreground"
                classNames={{
                  text: "font-black",
                  asterisk: "text-brand-primary",
                }}
              >
                Confirm Password
              </Label.Text>
            </Label>
            <View className="w-full flex-row items-center">
              <Input
                value={confirmPassword}
                multiline={false}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  clearError("confirmPassword");
                }}
                onBlur={() => {
                  if (!confirmPassword) {
                    clearError("confirmPassword");
                    return;
                  }
                  const err = validateConfirmPassword(confirmPassword);
                  setFieldErrors((prev) => ({
                    ...prev,
                    ...(err && { confirmPassword: err }),
                  }));
                }}
                placeholder="••••••••"
                className="flex-1 pr-10 overflow-hidden"
                secureTextEntry={!showConfirmPassword}
                autoComplete="password"
                textContentType="password"
              />
              <Pressable
                className="absolute right-4"
                onPress={() => setShowConfirmPassword((v) => !v)}
                disabled={fetchStatus === "fetching"}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.muted}
                />
              </Pressable>
            </View>
            <FieldError>{fieldErrors.confirmPassword}</FieldError>
          </TextField>

          <ControlField
            isSelected={agreedToTerms}
            onSelectedChange={setAgreedToTerms}
            className="mt-1"
            isDisabled={fetchStatus === "fetching"}
          >
            <ControlField.Indicator>
              <Checkbox
                isSelected={agreedToTerms}
                onSelectedChange={setAgreedToTerms}
              />
            </ControlField.Indicator>
            <View className="flex-1">
              <Text className="text-muted text-sm">
                I certify that I am 16 years of age or older, and I agree to the{" "}
                <Link
                  href={"/terms" as Href}
                  style={{ color: colors.accent, fontWeight: "600" }}
                >
                  Terms of Service
                </Link>{" "}
                and have read the{" "}
                <Link
                  href={"/privacy" as Href}
                  style={{ color: colors.accent, fontWeight: "600" }}
                >
                  Privacy Policy
                </Link>
                .
              </Text>
            </View>
          </ControlField>

          <Button
            variant="primary"
            className="w-full mt-2 rounded-2xl"
            onPress={handleSubmit}
            isDisabled={!canSubmit}
          >
            {fetchStatus === "fetching" ? (
              <View className="flex-row items-center gap-2">
                <Spinner size="md" color="#FFFFFF" />
                <Button.Label>Signing up...</Button.Label>
              </View>
            ) : (
              <Button.Label>Sign Up</Button.Label>
            )}
          </Button>

          <View style={styles.divider}>
            <View
              style={[styles.dividerLine, { backgroundColor: colors.border }]}
            />
            <Text style={[styles.dividerText, { color: colors.muted }]}>
              or continue with
            </Text>
            <View
              style={[styles.dividerLine, { backgroundColor: colors.border }]}
            />
          </View>

          <GoogleSignInButton disabled={fetchStatus === "fetching"} />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { gap: 6, marginBottom: 10, marginTop: 8 },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  iconWrap: { alignItems: "center", marginVertical: 20 },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
  },
  form: { gap: 16 },
  nameRow: { flexDirection: "row", gap: 12 },
  divider: { flexDirection: "row", alignItems: "center", gap: 8 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { fontSize: 12 },
});
