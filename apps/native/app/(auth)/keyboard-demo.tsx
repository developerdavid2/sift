import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { useThemeColors } from "@/lib/theme";

type FormFieldProps = {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  isRequired?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "words";
  autoComplete?:
    "off" | "email" | "password" | "name" | "given-name" | "family-name";
  textContentType?:
    "none" | "givenName" | "familyName" | "emailAddress" | "password";
  flex?: boolean;
  togglePassword?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
};

function FormField({
  label,
  placeholder,
  value,
  onChangeText,
  isRequired = false,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
  autoComplete = "off",
  textContentType = "none",
  flex = false,
  togglePassword = false,
  showPassword = false,
  onTogglePassword,
}: FormFieldProps) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);

  const borderColor = focused ? colors.accent : colors.border;

  // When this field has a show/hide toggle, showPassword controls whether
  // the text is actually masked — secureTextEntry alone was never flipped.
  const effectiveSecureTextEntry = togglePassword
    ? !showPassword
    : secureTextEntry;

  return (
    <View style={[styles.field, flex && styles.fieldFlex]}>
      <Text style={[styles.fieldLabel, { color: colors.muted }]}>
        {label}
        {isRequired && <Text style={{ color: colors.accent }}> *</Text>}
      </Text>
      <View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={colors.fieldPlaceholder}
          secureTextEntry={effectiveSecureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          textContentType={textContentType}
          style={[
            styles.input,
            {
              backgroundColor: colors.field,
              borderColor,
              color: colors.foreground,
              paddingRight: togglePassword ? 44 : 14,
            },
          ]}
        />
        {togglePassword && (
          <Pressable
            style={styles.eyeButton}
            onPress={onTogglePassword}
            hitSlop={8}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={colors.muted}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function KeyboardDemoScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.back, { color: colors.accent }]}>
            {"< Back"}
          </Text>
        </Pressable>
        <Text style={[styles.label, { color: colors.foreground }]}>
          Keyboard bounce demo (pure RN)
        </Text>
      </View>

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
        <View style={styles.iconWrap}>
          <View
            style={[styles.iconCircle, { backgroundColor: colors.accentSoft }]}
          >
            <Ionicons name="person" size={48} color={colors.accent} />
          </View>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>
          Create your account
        </Text>

        <View style={styles.form}>
          <View style={styles.nameRow}>
            <FormField
              flex
              label="First name"
              placeholder="Ada"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              autoComplete="given-name"
              textContentType="givenName"
              isRequired
            />
            <FormField
              flex
              label="Last name"
              placeholder="Lovelace"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              autoComplete="family-name"
              textContentType="familyName"
              isRequired
            />
          </View>

          <FormField
            label="Email"
            placeholder="you@example.com"
            value={emailAddress}
            onChangeText={setEmailAddress}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            isRequired
          />

          <FormField
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            isRequired
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            togglePassword
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword((v) => !v)}
          />

          <FormField
            label="Confirm Password"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isRequired
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            togglePassword
            showPassword={showConfirmPassword}
            onTogglePassword={() => setShowConfirmPassword((v) => !v)}
          />

          {/* Terms checkbox */}
          <Pressable
            style={styles.termsRow}
            onPress={() => setAgreedToTerms((v) => !v)}
          >
            <View
              style={[
                styles.checkbox,
                { borderColor: agreedToTerms ? colors.accent : colors.border },
                agreedToTerms && { backgroundColor: colors.accent },
              ]}
            >
              {agreedToTerms && (
                <Ionicons name="checkmark" size={14} color="#fff" />
              )}
            </View>
            <Text style={[styles.termsText, { color: colors.muted }]}>
              I certify that I am 16 years of age or older, and I agree to the
              Terms of Service and have read the Privacy Policy.
            </Text>
          </Pressable>

          {/* Sign Up button */}
          <Pressable
            style={[styles.button, { backgroundColor: colors.accent }]}
            onPress={() => {}}
          >
            <Text
              style={[styles.buttonText, { color: colors.accentForeground }]}
            >
              Sign Up
            </Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  back: { fontSize: 16, fontWeight: "600" },
  label: { fontSize: 16, fontWeight: "700", flex: 1 },
  title: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  form: { gap: 16 },
  nameRow: { flexDirection: "row", gap: 12 },
  iconWrap: { alignItems: "center", marginBottom: 20 },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
  },
  field: { marginBottom: 20 },
  fieldFlex: { flex: 1 },
  fieldLabel: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  termsText: { flex: 1, fontSize: 13, lineHeight: 18 },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { fontSize: 16, fontWeight: "700" },
});
