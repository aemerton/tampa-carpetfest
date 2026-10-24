import { Stack, useLocalSearchParams } from "expo-router";
import { AttendeeList } from "@/components/AttendeeList";
import { Header } from "@/components/ui";
import { useScreenData } from "@/lib/data";
import { loadEvent, loadEventAttendees } from "@/lib/events";

export default function PastEventAttendees() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { data, error, refreshing, refresh } = useScreenData(async () => {
    const [event, attendees] = await Promise.all([
      loadEvent(eventId),
      loadEventAttendees(eventId),
    ]);
    return { event, attendees };
  }, [eventId]);

  return (
    <>
      <Stack.Screen options={{ headerBackTitle: "Back" }} />
      <AttendeeList
        attendees={data?.attendees ?? null}
        error={error}
        refreshing={refreshing}
        onRefresh={refresh}
        emptyText="No one was on the list for this event."
        header={data ? <Header title={data.event.name} logoSize={64} /> : null}
      />
    </>
  );
}
