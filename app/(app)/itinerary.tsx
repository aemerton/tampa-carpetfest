import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, ErrorText, Header, Muted, SectionTitle } from "@/components/ui";
import { useScreenData } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { colors, spacing } from "@/lib/theme";
import type { ItineraryItem } from "@/lib/types";

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

const dayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

export default function Itinerary() {
  const { data, error, refreshing, refresh } = useScreenData(async () => {
    const { data, error } = await supabase
      .from("itinerary_items")
      .select("*")
      .order("starts_at");
    if (error) throw error;
    return data as ItineraryItem[];
  });

  // Group items by calendar day.
  const days: { label: string; items: ItineraryItem[] }[] = [];
  for (const item of data ?? []) {
    const label = dayLabel(item.starts_at);
    const last = days[days.length - 1];
    if (last?.label === label) last.items.push(item);
    else days.push({ label, items: [item] });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />
        }
      >
        <Header title="Itinerary" logoSize={72} />
        <ErrorText>{error}</ErrorText>
        {data && data.length === 0 ? <Muted>The event schedule is coming soon.</Muted> : null}
        {days.map((day) => (
          <View key={day.label} style={{ gap: spacing.sm }}>
            <SectionTitle>{day.label}</SectionTitle>
            {day.items.map((item) => (
              <Card key={item.id} style={styles.row}>
                <Text style={styles.time}>
                  {time(item.starts_at)}
                  {item.ends_at ? `\n– ${time(item.ends_at)}` : ""}
                </Text>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.title}>{item.title}</Text>
                  {item.location ? <Muted>{item.location}</Muted> : null}
                  {item.description ? (
                    <Text style={styles.body}>{item.description}</Text>
                  ) : null}
                </View>
              </Card>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
    gap: spacing.md,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },
  row: { flexDirection: "row", gap: spacing.md },
  time: { color: colors.accent, fontWeight: "700", width: 76, fontSize: 14 },
  title: { color: colors.text, fontSize: 16, fontWeight: "700" },
  body: { color: colors.text, fontSize: 15, lineHeight: 21, marginTop: 4 },
});
