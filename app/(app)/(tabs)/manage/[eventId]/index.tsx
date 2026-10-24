import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, Card, ErrorText, Loading, Muted } from "@/components/ui";
import { useScreenData } from "@/lib/data";
import { confirm, notify } from "@/lib/dialogs";
import { friendlyError, loadEvent } from "@/lib/events";
import { supabase } from "@/lib/supabase";
import { colors, radius, spacing } from "@/lib/theme";

export default function ManageEventDetail() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const { data, error, refresh } = useScreenData(async () => {
    const [event, codeRow, attendees, items, news, poll] = await Promise.all([
      loadEvent(eventId),
      supabase.from("event_codes").select("code").eq("event_id", eventId).maybeSingle(),
      count("event_attendees"),
      count("itinerary_items"),
      count("announcements"),
      supabase.from("event_polls").select("question, is_open").eq("event_id", eventId).maybeSingle(),
    ]);
    return { event, code: codeRow.data?.code ?? "", attendees, items, news, poll: poll.data };
  }, [eventId]);

  async function count(table: string) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);
    if (error) throw error;
    return count ?? 0;
  }

  if (!data) {
    return error ? (
      <View style={styles.page}>
        <ErrorText>{error}</ErrorText>
      </View>
    ) : (
      <Loading />
    );
  }
  const { event, code, attendees, items, news, poll } = data;
  const active = event.status === "active";

  async function closeEvent() {
    const ok = await confirm(
      `Close ${event.name}?`,
      `Everyone on the attendee list (${attendees} ${attendees === 1 ? "person" : "people"}) ` +
        "gets a badge for this event, and registration closes. Make sure the list is " +
        "accurate first.",
      "Close event"
    );
    if (!ok) return;
    await run("close_event", `${event.name} is closed. Badges have been given out.`);
  }

  async function reopenEvent() {
    const ok = await confirm(
      `Reopen ${event.name}?`,
      "It becomes the active event again. Registration stays closed until you turn it on.",
      "Reopen"
    );
    if (!ok) return;
    await run("reopen_event", `${event.name} is active again.`);
  }

  async function run(fn: "close_event" | "reopen_event", done: string) {
    setActionError("");
    setBusy(true);
    const { error } = await supabase.rpc(fn, { p_event: eventId });
    setBusy(false);
    if (error) setActionError(friendlyError(error));
    else {
      notify(done);
      refresh();
    }
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.page}>
      <Card>
        <Text style={styles.name}>{event.name}</Text>
        <Status active={active} open={event.registration_open} />
        {active ? (
          <Text style={styles.detail}>
            Code: <Text style={styles.code}>{code || "(none)"}</Text>
          </Text>
        ) : null}
        <Button
          title="Edit name, code, registration"
          variant="secondary"
          onPress={() => router.push({ pathname: "/manage/event-form", params: { id: eventId } })}
        />
      </Card>

      <Row
        icon="people"
        label="Attendee list"
        detail={`${attendees} registered`}
        onPress={() => router.push(`/manage/${eventId}/attendees`)}
      />
      <Row
        icon="calendar"
        label="Itinerary"
        detail={`${items} ${items === 1 ? "item" : "items"}`}
        onPress={() => router.push(`/manage/${eventId}/itinerary`)}
      />
      <Row
        icon="megaphone"
        label="Announcements"
        detail={`${news} posted`}
        onPress={() => router.push(`/manage/${eventId}/announcements`)}
      />
      <Row
        icon="stats-chart"
        label="Poll"
        detail={
          poll ? `${poll.is_open ? "Open" : "Closed"} · ${poll.question}` : "Not set up yet"
        }
        onPress={() => router.push(`/manage/${eventId}/poll`)}
      />

      <ErrorText>{actionError}</ErrorText>
      {active ? (
        <Card style={{ marginTop: spacing.lg }}>
          <Text style={styles.detailTitle}>When the event is over</Text>
          <Muted>
            Do a final check of the attendee list, then close the event. Everyone still on the
            list gets a badge on their profile.
          </Muted>
          <Button title="Close event" onPress={closeEvent} loading={busy} />
        </Card>
      ) : event.allow_self_report ? (
        <Muted>
          This event happened before the app, so attendees mark themselves with "Did you
          attend?" on their profile.
        </Muted>
      ) : (
        <Button title="Reopen event" variant="ghost" onPress={reopenEvent} loading={busy} />
      )}
    </ScrollView>
  );
}

function Status({ active, open }: { active: boolean; open: boolean }) {
  const text = active
    ? open
      ? "Active · registration open"
      : "Active · registration closed"
    : "Closed";
  return <Muted>{text}</Muted>;
}

function Row({
  icon,
  label,
  detail,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <Ionicons name={icon} size={22} color={colors.accent} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Muted>{detail}</Muted>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
    gap: spacing.md,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    backgroundColor: colors.bg,
  },
  name: { color: colors.accent, fontSize: 22, fontWeight: "700" },
  detail: { color: colors.text, fontSize: 16 },
  detailTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  code: { color: colors.accent, fontWeight: "700" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  rowLabel: { color: colors.text, fontSize: 16, fontWeight: "700" },
});
