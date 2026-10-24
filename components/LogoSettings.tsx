import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button, Card, ErrorText, Logo, Muted } from "@/components/ui";
import { useBranding } from "@/lib/branding";
import { confirm, notify } from "@/lib/dialogs";
import { deletePhotos, pickAndUploadPhoto } from "@/lib/photos";
import { supabase } from "@/lib/supabase";
import { colors, spacing } from "@/lib/theme";

/** Admin card for uploading a new app logo or going back to the built-in one. */
export function LogoSettings() {
  const { logoUrl, refresh } = useBranding();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(newUrl: string | null) {
    const { error } = await supabase
      .from("app_settings")
      .update({ logo_url: newUrl })
      .eq("id", 1);
    if (error) throw error;
    // Remove the old uploaded file so it doesn't linger in storage.
    if (logoUrl && logoUrl !== newUrl) await deletePhotos([logoUrl]);
    await refresh();
  }

  async function change() {
    setError("");
    setBusy(true);
    try {
      const url = await pickAndUploadPhoto("branding", "logo", { crop: false });
      if (url) {
        await save(url);
        notify("Logo updated for everyone.");
      }
    } catch (e: any) {
      setError(`Couldn't update the logo: ${e?.message ?? "unknown error"}`);
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    const ok = await confirm(
      "Go back to the original logo?",
      "Your uploaded logo will be removed.",
      "Reset logo"
    );
    if (!ok) return;
    setError("");
    setBusy(true);
    try {
      await save(null);
      notify("Logo reset to the original.");
    } catch (e: any) {
      setError(`Couldn't reset the logo: ${e?.message ?? "unknown error"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.preview}>
          <Logo size={80} />
        </View>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text style={styles.title}>App logo</Text>
          <Muted>
            {logoUrl ? "Custom logo" : "Original logo"} · shown on the login screen and at the
            top of every page.
          </Muted>
        </View>
      </View>
      <Muted>Best: a square PNG with a transparent background, at least 512×512.</Muted>
      <ErrorText>{error}</ErrorText>
      <Button title="Upload new logo" variant="secondary" onPress={change} loading={busy} />
      {logoUrl ? (
        <Button title="Reset to original" variant="ghost" onPress={reset} disabled={busy} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  preview: {
    width: 96,
    height: 96,
    borderRadius: 12,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: colors.text, fontSize: 16, fontWeight: "700" },
});
