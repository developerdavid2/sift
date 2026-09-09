import {
  Button,
  InputOTP,
  REGEXP_ONLY_DIGITS,
  Spinner,
  TextField,
  Label,
  FieldError,
  useToast,
  LinkButton,
} from "heroui-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { useThemeColors } from "@/lib/theme";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

type OtpVerificationProps = {
  title: string;
  subtitle: string;
  onVerify: (code: string) => Promise<{ error?: string } | void>;
  onResend: () => Promise<{ error?: string } | void>;
  onBack?: () => void;
};

const RESEND_COOLDOWN_SECONDS = 30;

export function OtpVerification({
  title,
  subtitle,
  onVerify,
  onResend,
  onBack,
}: OtpVerificationProps) {
  const colors = useThemeColors();
  const { toast } = useToast();

  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  const isBusy = isVerifying || isResending;

  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));
  const triggerShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-8, { duration: 40 }),
      withTiming(8, { duration: 40 }),
      withTiming(-6, { duration: 40 }),
      withTiming(6, { duration: 40 }),
      withTiming(0, { duration: 40 }),
    );
  }, [shakeX]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const validate = useCallback((value: string) => {
    if (!value) return "Code is required";
    if (!/^\d{6}$/.test(value)) return "Code must be 6 digits";
    return null;
  }, []);

  const clearError = useCallback(() => setFieldError(null), []);

  const handleVerify = async () => {
    const error = validate(code);
    if (error) {
      setFieldError(error);
      triggerShake();
      return;
    }
    setFieldError(null);
    setIsVerifying(true);

    const result = await onVerify(code);
    setIsVerifying(false);

    if (result?.error) {
      setFieldError(result.error);
      triggerShake();
      setCode("");
      toast.show({
        variant: "danger",
        label: "Verification failed",
        description: result.error,
      });
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isBusy) return;

    setIsResending(true);
    const result = await onResend();
    setIsResending(false);

    if (result?.error) {
      toast.show({
        variant: "danger",
        label: "Couldn't resend code",
        description: result.error,
      });
    } else {
      toast.show({
        variant: "success",
        label: "Code sent",
        description: "Check your email for the new verification code.",
      });
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    }
  };

  return (
    <KeyboardAwareScrollView
      mode="layout"
      bottomOffset={32}
      style={{ flex: 1 }}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {subtitle}
        </Text>
      </View>

      <View style={styles.form}>
        <TextField isInvalid={!!fieldError}>
          <Animated.View style={shakeStyle}>
            <InputOTP
              maxLength={6}
              value={code}
              onChange={(v) => {
                setCode(v);
                clearError();
              }}
              pattern={REGEXP_ONLY_DIGITS}
              isInvalid={!!fieldError}
              isDisabled={isBusy}
            >
              <InputOTP.Group>
                <InputOTP.Slot index={0} />
                <InputOTP.Slot index={1} />
                <InputOTP.Slot index={2} />
              </InputOTP.Group>
              <InputOTP.Separator />
              <InputOTP.Group>
                <InputOTP.Slot index={3} />
                <InputOTP.Slot index={4} />
                <InputOTP.Slot index={5} />
              </InputOTP.Group>
            </InputOTP>
          </Animated.View>

          <FieldError>{fieldError}</FieldError>
        </TextField>

        <Button
          variant="primary"
          className="w-full mt-2 rounded-2xl"
          onPress={handleVerify}
          isDisabled={isBusy || code.length !== 6}
        >
          {isVerifying ? (
            <View className="flex-row items-center gap-2">
              <Spinner size="md" color="#FFFFFF" />
              <Button.Label>Verifying...</Button.Label>
            </View>
          ) : (
            <Button.Label>Verify</Button.Label>
          )}
        </Button>

        <View className="flex-row items-center justify-center gap-1 mt-4">
          <Text className="text-sm text-muted">
            Didn&apos;t receive a code?
          </Text>
          {resendCooldown > 0 ? (
            <Text className="text-sm text-muted font-semibold">
              Resend in {resendCooldown}s
            </Text>
          ) : (
            <LinkButton onPress={handleResend} isDisabled={isBusy}>
              {isResending ? (
                <Spinner size="sm" />
              ) : (
                <LinkButton.Label
                  style={{
                    color: colors.brandPrimarySoftForeground,
                    fontWeight: "600",
                  }}
                >
                  Resend
                </LinkButton.Label>
              )}
            </LinkButton>
          )}
        </View>

        {onBack && (
          <Button
            variant="ghost"
            className="w-full"
            onPress={onBack}
            isDisabled={isBusy}
          >
            <Button.Label style={{ color: colors.muted }}>
              Start over
            </Button.Label>
          </Button>
        )}
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: { gap: 6, marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 15 },
  form: { gap: 8 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 2,
  },
});
