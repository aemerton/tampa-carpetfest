import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, Muted, SectionTitle } from "@/components/ui";
import { colors, spacing } from "@/lib/theme";
import type { ItineraryItem } from "@/lib/types";

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

const dayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

/** Itinerary grouped by day. With `editable`, tapping an item opens the editor. */
export function ItineraryDays({
  items,
  editable = false,
  emptyText = "The event schedule is coming soon.",
}: {
  items: ItineraryItem[];
  editable?: boolean;
  emptyText?: string;
}) {
  if (!items.length) return <Muted>{emptyText}</Muted>;

  const days: { label: string; items: ItineraryItem[] }[] = [];
  for (const item of items) {
    const label = dayLabel(item.starts_at);
    const last = days[days.length - 1];
    if (last?.label === label) last.items.push(item);
    else days.push({ label, items: [item] });
  }

  return (
    <View style={{ gap: spacing.md }}>
      {editable ? <Muted>Tap any item to edit or delete it.</Muted> : null}
      {days.map((day) => (
        <View key={day.label} style={{ gap: spacing.sm }}>
          <SectionTitle>{day.label}</SectionTitle>
          {day.items.map((item) => (
            <Pressable
              key={item.id}
              disabled={!editable}
              onPress={() => router.push({ pathname: "/event-editor", params: { id: item.id } })}
            >
              <Card style={styles.row}>
                <Text style={styles.time}>
                  {time(item.starts_at)}
                  {item.ends_at ? `\n– ${time(item.ends_at)}` : ""}
                </Text>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.title}>{item.title}</Text>
                  {item.location ? <Muted>{item.location}</Muted> : null}
                  {item.description ? <Text style={styles.body}>{item.description}</Text> : null}
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.md },
  time: { color: colors.accent, fontWeight: "700", width: 76, fontSize: 14 },
  title: { color: colors.text, fontSize: 16, fontWeight: "700" },
  body: { color: colors.text, fontSize: 15, lineHeight: 21, marginTop: 4 },
});
