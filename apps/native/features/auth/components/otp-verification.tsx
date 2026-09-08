import {
  Button,
  InputOTP,
  REGEXP_ONLY_DIGITS,
  Spinner,
  TextField,
  Label,
  FieldError,
  useToast,
} from "heroui-native";
import { useState, useCallback } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useThemeColors } from "@/lib/theme";

type OtpVerificationProps = {
  title: string;
  subtitle: string;
  onVerify: (code: string) => Promise<{ error?: string } | void>;
  onResend: () => Promise<{ error?: string } | void>;
  onBack?: () => void;
};

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

  const isBusy = isVerifying || isResending;

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
      return;
    }
    setFieldError(null);
    setIsVerifying(true);

    const result = await onVerify(code);
    setIsVerifying(false);

    if (result?.error) {
      // Auth failure — never reveal if it was expired, used, or wrong
      toast.show({
        variant: "danger",
        label: "Verification failed",
        description: result.error,
      });
    }
  };

  const handleResend = async () => {
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
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
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
          <Label className="text-sm font-semibold text-foreground">
            Verification Code
          </Label>

          <InputOTP
            maxLength={6}
            value={code}
            onChange={(v) => {
              setCode(v);
              clearError();
            }}
            pattern={REGEXP_ONLY_DIGITS}
            isInvalid={!!fieldError}
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

        <View className="flex-row items-center justify-center text-center mt-4">
          <Text className="text-sm text-muted">
            Didn&apos;t receive a code?
          </Text>
          <Button variant="ghost" onPress={handleResend} isDisabled={isBusy}>
            {isResending ? (
              <Spinner size="sm" />
            ) : (
              <Button.Label
                style={{
                  color: colors.brandPrimarySoftForeground,
                  fontWeight: "600",
                }}
              >
                Resend
              </Button.Label>
            )}
          </Button>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
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
