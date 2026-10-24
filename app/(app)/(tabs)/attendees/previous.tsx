import { router } from "expo-router";
import { ScrollView } from "react-native";
import { EventList } from "@/components/EventList";
import { ErrorText, Loading, Muted } from "@/components/ui";
import { useUserId } from "@/lib/auth";
import { useScreenData } from "@/lib/data";
import { loadPastEvents } from "@/lib/events";
import { colors, spacing } from "@/lib/theme";

export default function PreviousEvents() {
  const userId = useUserId();
  const { data, error } = useScreenData(() => loadPastEvents(userId), [userId]);

  if (!data && !error) return <Loading />;

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{
        padding: spacing.lg,
        gap: spacing.md,
        width: "100%",
        maxWidth: 560,
        alignSelf: "center",
      }}
    >
      <Muted>Tap an event to see who was there.</Muted>
      <ErrorText>{error}</ErrorText>
      <EventList
        events={data ?? []}
        emptyText="You haven't been to a CarpetFest yet."
        onPress={(e) => router.push(`/attendees/event/${e.id}`)}
      />
    </ScrollView>
  );
}
