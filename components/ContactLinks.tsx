import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Card, SectionTitle } from "@/components/ui";
import { contactLinks } from "@/lib/contact";
import { notify } from "@/lib/dialogs";
import { colors, spacing } from "@/lib/theme";
import type { Profile } from "@/lib/types";

/** Tappable contact rows; renders nothing if the person filled none in. */
export function ContactLinks({ profile }: { profile: Profile }) {
  const links = contactLinks(profile);
  if (!links.length) return null;

  async function open(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      notify("Couldn't open that link on this device.", "error");
    }
  }

  return (
    <>
      <SectionTitle>Contact & links</SectionTitle>
      <Card style={{ paddingVertical: spacing.xs }}>
        {links.map((l, i) => (
          <Pressable
            key={l.key}
            onPress={() => open(l.url)}
            accessibilityRole="link"
            accessibilityLabel={`${l.label}: ${l.text}`}
            style={({ pressed }) => [
              styles.row,
              i > 0 && styles.divider,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Ionicons name={l.icon} size={20} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{l.label}</Text>
              <Text style={styles.text} numberOfLines={1}>
                {l.text}
              </Text>
            </View>
            <Ionicons name="open-outline" size={16} color={colors.textMuted} />
          </Pressable>
        ))}
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  label: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  text: { color: colors.text, fontSize: 16 },
});
