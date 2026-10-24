import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, glow, radius, spacing } from "@/lib/theme";

/** Round photo with an initials fallback; `glowing` adds the mockup's green halo. */
export function Avatar({
  uri,
  name,
  size = 48,
  glowing = false,
}: {
  uri?: string | null;
  name?: string;
  size?: number;
  glowing?: boolean;
}) {
  const initials = (name ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const shape = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View
      style={[
        shape,
        glowing && glow,
        glowing && { borderWidth: 2, borderColor: colors.accent },
        styles.avatarWrap,
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={shape} />
      ) : initials ? (
        <Text style={{ color: colors.accent, fontWeight: "700", fontSize: size * 0.38 }}>
          {initials}
        </Text>
      ) : (
        <Ionicons name="person" size={size * 0.5} color={colors.textMuted} />
      )}
    </View>
  );
}

export function TabSwitcher<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <View style={styles.tabs}>
      {tabs.map((tab) => {
        const on = tab.id === active;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={[styles.tab, on && styles.tabOn]}
          >
            <Text style={[styles.tabText, on && styles.tabTextOn]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Badges for events someone attended. */
export function EventBadges({ names }: { names: string[] }) {
  return (
    <View style={styles.badges}>
      {names.map((name) => (
        <View key={name} style={[styles.badge, styles.badgeOn, styles.badgeRow]}>
          <Ionicons name="ribbon" size={14} color={colors.accent} />
          <Text style={styles.badgeText}>{name}</Text>
        </View>
      ))}
    </View>
  );
}

/** A row of pill buttons where exactly one is selected (e.g. Yes / No). */
export function ChoiceChips<T extends string | boolean>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.badges}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={String(o.value)} onPress={() => onChange(o.value)}>
            <View style={[styles.badge, on ? styles.badgeOn : styles.badgeOff, styles.choice]}>
              <Text style={[styles.badgeText, !on && { color: colors.textMuted }]}>{o.label}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/** "Label: value" line that hides itself when the value is empty. */
export function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <Text style={styles.info}>
      <Text style={styles.infoLabel}>{label}: </Text>
      {value}
    </Text>
  );
}

const styles = StyleSheet.create({
  avatarWrap: {
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  tabOn: { backgroundColor: colors.accent },
  tabText: { color: colors.text, fontSize: 14 },
  tabTextOn: { color: colors.onAccent, fontWeight: "700" },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  choice: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  badgeOn: { backgroundColor: colors.surface, borderColor: colors.accent },
  badgeOff: { backgroundColor: "transparent", borderColor: colors.border },
  badgeText: { color: colors.accent, fontSize: 13, fontWeight: "600" },
  info: { color: colors.text, fontSize: 16, lineHeight: 24 },
  infoLabel: { color: colors.textMuted },
});
