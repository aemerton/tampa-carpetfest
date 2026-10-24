import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBranding } from "@/lib/branding";
import { colors, radius, spacing } from "@/lib/theme";

/** Page wrapper: safe-area padding, dark background, optional scrolling. */
export function Screen({
  children,
  scroll = true,
  edges = ["top"],
}: {
  children: ReactNode;
  scroll?: boolean;
  edges?: ("top" | "bottom")[];
}) {
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {scroll ? (
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, { flex: 1 }]}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const DEFAULT_LOGO = require("@/assets/images/logo.png");

/** The app logo: the admin-uploaded one if set, otherwise the built-in one. */
export function Logo({ size = 96 }: { size?: number }) {
  const { logoUrl } = useBranding();
  return (
    <Image
      source={logoUrl ? { uri: logoUrl } : DEFAULT_LOGO}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessibilityLabel="Tampa CarpetFest logo"
    />
  );
}

/** Logo + title, as in the mockup's Header component. */
export function Header({ title, logoSize = 96 }: { title?: string; logoSize?: number }) {
  return (
    <View style={styles.header}>
      <Logo size={logoSize} />
      {title ? <Text style={styles.headerTitle}>{title}</Text> : null}
    </View>
  );
}

export function Field({
  label,
  style,
  ...props
}: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, props.multiline && styles.multiline, style]}
        {...props}
      />
    </View>
  );
}

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const isPrimary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" && styles.buttonSecondary,
        variant === "ghost" && styles.buttonGhost,
        (pressed || disabled) && { opacity: 0.6 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.onAccent : colors.accent} />
      ) : (
        <Text style={[styles.buttonText, !isPrimary && { color: colors.accent }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <Text style={styles.error}>{children}</Text>;
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
    gap: spacing.md,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },
  header: { alignItems: "center", paddingVertical: spacing.md },
  headerTitle: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: "700",
    marginTop: spacing.sm,
    textAlign: "center",
  },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  multiline: { minHeight: 96, textAlignVertical: "top" },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.accent,
  },
  buttonGhost: { backgroundColor: "transparent" },
  buttonText: { color: colors.onAccent, fontSize: 16, fontWeight: "700" },
  sectionTitle: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: "700",
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  error: { color: colors.danger, fontSize: 14 },
  muted: { color: colors.textMuted, fontSize: 14 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
});
