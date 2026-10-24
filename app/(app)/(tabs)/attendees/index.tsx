import { router } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AttendeeList } from "@/components/AttendeeList";
import { EventList } from "@/components/EventList";
import { Card, ErrorText, Header, Loading, Muted, SectionTitle } from "@/components/ui";
import { useUserId } from "@/lib/auth";
import { useScreenData } from "@/lib/data";
import { loadActiveEvent, loadEventAttendees, loadPastEvents } from "@/lib/events";
import { colors, spacing } from "@/lib/theme";

export default function Attendees() {
  const userId = useUserId();
  const { data, error, refreshing, refresh } = useScreenData(async () => {
    const { event } = await loadActiveEvent(userId);
    if (event) {
      return { event, attendees: await loadEventAttendees(event.id), past: [] };
    }
    return { event: null, attendees: null, past: await loadPastEvents(userId) };
  }, [userId]);

  if (!data) {
    return error ? (
      <SafeAreaView style={styles.page} edges={["top"]}>
        <ErrorText>{error}</ErrorText>
      </SafeAreaView>
    ) : (
      <Loading />
    );
  }

  // Active event: show its attendee list.
  if (data.event) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
        <AttendeeList
          attendees={data.attendees}
          error={error}
          refreshing={refreshing}
          onRefresh={refresh}
          header={<Header title={`${data.event.name} Attendees`} logoSize={72} />}
        />
      </SafeAreaView>
    );
  }

  // No active event: point to the events this person attended.
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Header title="Attendees" logoSize={72} />
        <Card>
          <Muted>No active event right now! Want to look back at a previous event?</Muted>
        </Card>
        <SectionTitle>Your previous events</SectionTitle>
        <EventList
          events={data.past}
          emptyText="You haven't been to a CarpetFest yet."
          onPress={(e) => router.push(`/attendees/event/${e.id}`)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
    gap: spacing.md,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },
});
