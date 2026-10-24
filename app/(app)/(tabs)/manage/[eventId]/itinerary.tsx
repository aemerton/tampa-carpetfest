import { router, useLocalSearchParams } from "expo-router";
import { ScrollView } from "react-native";
import { ItineraryDays } from "@/components/Itinerary";
import { Button, Card, ErrorText, Loading, Muted } from "@/components/ui";
import { useScreenData } from "@/lib/data";
import { loadEvent } from "@/lib/events";
import { supabase } from "@/lib/supabase";
import { colors, spacing } from "@/lib/theme";
import type { ItineraryItem } from "@/lib/types";

export default function ManageItinerary() {
  const { eventId, isNew } = useLocalSearchParams<{ eventId: string; isNew?: string }>();
  const { data, error } = useScreenData(async () => {
    const [event, items] = await Promise.all([
      loadEvent(eventId),
      supabase.from("itinerary_items").select("*").eq("event_id", eventId).order("starts_at"),
    ]);
    if (items.error) throw items.error;
    return { event, items: items.data as ItineraryItem[] };
  }, [eventId]);

  if (!data && !error) return <Loading />;

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{
        padding: spacing.lg,
        paddingBottom: spacing.xl * 2,
        gap: spacing.md,
        width: "100%",
        maxWidth: 560,
        alignSelf: "center",
      }}
    >
      {isNew ? (
        <Card style={{ borderWidth: 1, borderColor: colors.accent }}>
          <Muted>
            {data?.event.name} is created! Now add the itinerary. You can always come back and
            change it from Manage Event.
          </Muted>
          <Button
            title="Done for now"
            variant="secondary"
            onPress={() => router.replace(`/manage/${eventId}`)}
          />
        </Card>
      ) : null}
      <ErrorText>{error}</ErrorText>
      <Button
        title="+ Add itinerary item"
        onPress={() => router.push({ pathname: "/event-editor", params: { eventId } })}
      />
      {data ? (
        <ItineraryDays items={data.items} editable emptyText="No itinerary items yet." />
      ) : null}
    </ScrollView>
  );
}
