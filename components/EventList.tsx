import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Muted } from "@/components/ui";
import { colors, radius, spacing } from "@/lib/theme";
import type { CarpetEvent } from "@/lib/types";

/** Tappable list of events (used for Previous Events and Manage Event). */
export function EventList({
  events,
  onPress,
  emptyText = "No previous events yet.",
}: {
  events: CarpetEvent[];
  onPress: (e: CarpetEvent) => void;
  emptyText?: string;
}) {
  if (!events.length) return <Muted>{emptyText}</Muted>;
  return (
    <View style={{ gap: spacing.sm }}>
      {events.map((e) => (
        <Pressable
          key={e.id}
          onPress={() => onPress(e)}
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
        >
          <Ionicons
            name={e.status === "active" ? "radio-button-on" : "ribbon"}
            size={22}
            color={colors.accent}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{e.name}</Text>
            <Muted>
              {e.status === "active"
                ? e.registration_open
                  ? "Active · registration open"
                  : "Active · registration closed"
                : "Closed"}
            </Muted>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  name: { color: colors.text, fontSize: 16, fontWeight: "700" },
});
