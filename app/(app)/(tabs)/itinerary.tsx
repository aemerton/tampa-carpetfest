import { router } from "expo-router";
import { RefreshControl, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ItineraryDays } from "@/components/Itinerary";
import { Button, Card, ErrorText, Header, Loading, Muted } from "@/components/ui";
import { useIsAdmin, useUserId } from "@/lib/auth";
import { useScreenData } from "@/lib/data";
import { loadActiveEvent } from "@/lib/events";
import { supabase } from "@/lib/supabase";
import { colors, spacing } from "@/lib/theme";
import type { ItineraryItem } from "@/lib/types";

export default function Itinerary() {
  const userId = useUserId();
  const isAdmin = useIsAdmin();
  const { data, error, refreshing, refresh } = useScreenData(async () => {
    const { event } = await loadActiveEvent(userId);
    if (!event) return { event: null, items: [] as ItineraryItem[] };
    const { data, error } = await supabase
      .from("itinerary_items")
      .select("*")
      .eq("event_id", event.id)
      .order("starts_at");
    if (error) throw error;
    return { event, items: data as ItineraryItem[] };
  }, [userId]);

  if (!data && !error) return <Loading />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />
        }
      >
        <Header title={data?.event ? `${data.event.name} Itinerary` : "Itinerary"} logoSize={72} />
        <ErrorText>{error}</ErrorText>
        {data && !data.event ? (
          <Card>
            <Muted>No active event right now. The next schedule will show up here.</Muted>
          </Card>
        ) : null}
        {data?.event ? (
          <>
            {isAdmin ? (
              <Button
                title="+ Add itinerary item"
                variant="secondary"
                onPress={() =>
                  router.push({ pathname: "/event-editor", params: { eventId: data.event!.id } })
                }
              />
            ) : null}
            <ItineraryDays items={data.items} editable={isAdmin} />
          </>
        ) : null}
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
});
