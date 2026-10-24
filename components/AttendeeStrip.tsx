import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Avatar } from "@/components/profile";
import { colors, spacing } from "@/lib/theme";
import type { ProfileSummary } from "@/lib/types";

/** Side-scrolling row of attendee photos; tap one to open their profile. */
export function AttendeeStrip({ attendees }: { attendees: ProfileSummary[] }) {
  if (!attendees.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      // Let the strip reach the screen edges while the rest of the page keeps its margins.
      style={styles.bleed}
    >
      {attendees.map((a) => (
        <Pressable
          key={a.id}
          onPress={() => router.push(`/attendees/${a.id}`)}
          accessibilityLabel={`Open ${a.full_name}'s profile`}
          style={({ pressed }) => [styles.person, pressed && { opacity: 0.6 }]}
        >
          <Avatar uri={a.photo_url} name={a.full_name} size={64} />
          <View style={{ gap: 1 }}>
            <Text style={styles.name} numberOfLines={2}>
              {a.full_name}
            </Text>
            {a.business_name ? (
              <Text style={styles.business} numberOfLines={1}>
                {a.business_name}
              </Text>
            ) : null}
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bleed: { marginHorizontal: -spacing.lg, flexGrow: 0 },
  row: { paddingHorizontal: spacing.lg, gap: spacing.md },
  person: { width: 84, alignItems: "center", gap: spacing.xs },
  name: { color: colors.accent, fontSize: 12, fontWeight: "600", textAlign: "center" },
  business: { color: colors.textMuted, fontSize: 10, textAlign: "center" },
});
