import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AttendeeList } from "@/components/AttendeeList";
import { EventList } from "@/components/EventList";
import { TabSwitcher } from "@/components/profile";
import { QuestionOverview } from "@/components/QuestionOverview";
import { Card, ErrorText, Header, Loading, Muted, SectionTitle } from "@/components/ui";
import { useUserId } from "@/lib/auth";
import { useScreenData } from "@/lib/data";
import { loadActiveEvent, loadEventAttendees, loadPastEvents } from "@/lib/events";
import { loadEventAnswers } from "@/lib/questions";
import { colors, spacing } from "@/lib/theme";

type View_ = "people" | "answers";

export default function Attendees() {
  const userId = useUserId();
  // Home's "Get to know everyone" card opens this tab with ?view=answers.
  const params = useLocalSearchParams<{ view?: string }>();
  const [view, setView] = useState<View_>(params.view === "answers" ? "answers" : "people");
  useEffect(() => {
    if (params.view === "answers" || params.view === "people") setView(params.view);
  }, [params.view]);

  const { data, error, refreshing, refresh } = useScreenData(async () => {
    const { event } = await loadActiveEvent(userId);
    if (event) {
      const [attendees, questions] = await Promise.all([
        loadEventAttendees(event.id),
        loadEventAnswers(event.id),
      ]);
      return { event, attendees, questions, past: [] };
    }
    return { event: null, attendees: null, questions: [], past: await loadPastEvents(userId) };
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

  // Active event: its attendee list, or everyone's answers to the questions.
  if (data.event) {
    const header = (
      <View style={{ gap: spacing.md }}>
        <Header title={`${data.event.name} Attendees`} logoSize={72} />
        <TabSwitcher<View_>
          tabs={[
            { id: "people", label: "People" },
            { id: "answers", label: "Answers" },
          ]}
          active={view}
          onChange={setView}
        />
      </View>
    );

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
        {view === "people" ? (
          <AttendeeList
            attendees={data.attendees}
            error={error}
            refreshing={refreshing}
            onRefresh={refresh}
            header={header}
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
                tintColor={colors.accent}
              />
            }
          >
            {header}
            <ErrorText>{error}</ErrorText>
            <QuestionOverview questions={data.questions} eventId={data.event.id} />
          </ScrollView>
        )}
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
