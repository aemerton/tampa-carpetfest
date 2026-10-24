import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing } from "./theme";

/*
 * In-app messages instead of browser pop-ups:
 *   notify("Saved!")             → snackbar that slides up and fades away
 *   await confirm(title, text)   → styled Yes/Cancel dialog, resolves true/false
 * Both can be called from anywhere; <FeedbackProvider> (in the root layout)
 * draws them on top of every screen.
 */

type Kind = "success" | "error" | "info";
type ToastData = { id: number; message: string; kind: Kind };
type ConfirmData = {
  title: string;
  message: string;
  confirmLabel: string;
  resolve: (ok: boolean) => void;
};

let showToast: ((message: string, kind: Kind) => void) | null = null;
let showConfirm: ((data: ConfirmData) => void) | null = null;

export function notify(message: string, kind: Kind = "success") {
  showToast?.(message, kind);
}

export function confirm(
  title: string,
  message: string,
  confirmLabel = "Delete"
): Promise<boolean> {
  return new Promise((resolve) => {
    if (!showConfirm) return resolve(false);
    showConfirm({ title, message, confirmLabel, resolve });
  });
}

const TOAST_MS = 3200;
const useNative = Platform.OS !== "web";
const ICON: Record<Kind, React.ComponentProps<typeof Ionicons>["name"]> = {
  success: "checkmark-circle",
  error: "alert-circle",
  info: "information-circle",
};

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastData | null>(null);
  const [dialog, setDialog] = useState<ConfirmData | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let nextId = 0;
    showToast = (message, kind) => setToast({ id: ++nextId, message, kind });
    showConfirm = setDialog;
    return () => {
      showToast = null;
      showConfirm = null;
    };
  }, []);

  function hideToast() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: useNative }).start(
      () => setToast(null)
    );
  }

  // Slide in each new toast, then hide it after a few seconds.
  useEffect(() => {
    if (!toast) return;
    anim.setValue(0);
    Animated.spring(anim, { toValue: 1, useNativeDriver: useNative, bounciness: 6 }).start();
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(hideToast, TOAST_MS);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast?.id]);

  function answer(ok: boolean) {
    dialog?.resolve(ok);
    setDialog(null);
  }

  return (
    <View style={{ flex: 1 }}>
      {children}

      {toast ? (
        <View
          pointerEvents="box-none"
          style={[styles.toastLayer, { bottom: insets.bottom + 72 }]}
        >
          <Animated.View
            style={[
              styles.toast,
              toast.kind === "error" && { borderColor: colors.danger },
              {
                opacity: anim,
                transform: [
                  { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
                ],
              },
            ]}
          >
            <Pressable onPress={hideToast} style={styles.toastInner} accessibilityRole="alert">
              <Ionicons
                name={ICON[toast.kind]}
                size={22}
                color={toast.kind === "error" ? colors.danger : colors.accent}
              />
              <Text style={styles.toastText}>{toast.message}</Text>
            </Pressable>
          </Animated.View>
        </View>
      ) : null}

      <Modal
        visible={!!dialog}
        transparent
        animationType="fade"
        onRequestClose={() => answer(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => answer(false)}>
          {/* Inner Pressable stops taps on the card from closing it. */}
          <Pressable style={styles.dialog} onPress={() => {}}>
            <Text style={styles.dialogTitle}>{dialog?.title}</Text>
            <Text style={styles.dialogText}>{dialog?.message}</Text>
            <View style={styles.dialogButtons}>
              <Pressable
                onPress={() => answer(false)}
                style={({ pressed }) => [styles.dialogButton, pressed && { opacity: 0.6 }]}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => answer(true)}
                style={({ pressed }) => [
                  styles.dialogButton,
                  styles.confirmButton,
                  /delete|remove/i.test(dialog?.confirmLabel ?? "") && {
                    backgroundColor: colors.danger,
                  },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.confirmText}>{dialog?.confirmLabel}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  toastLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  toast: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  toastInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  toastText: { flex: 1, color: colors.text, fontSize: 15, lineHeight: 21 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  dialog: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
  },
  dialogTitle: { color: colors.text, fontSize: 18, fontWeight: "700" },
  dialogText: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  dialogButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  dialogButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
  },
  confirmButton: { backgroundColor: colors.accent },
  cancelText: { color: colors.text, fontSize: 15, fontWeight: "600" },
  confirmText: { color: colors.onAccent, fontSize: 15, fontWeight: "700" },
});
