import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Text } from "react-native";
import { AttendeeList } from "@/components/AttendeeList";
import { Muted } from "@/components/ui";
import { useScreenData } from "@/lib/data";
import { confirm } from "@/lib/dialogs";
import { friendlyError, loadEvent, loadEventAttendees } from "@/lib/events";
import { supabase } from "@/lib/supabase";
import { colors } from "@/lib/theme";
import type { ProfileSummary } from "@/lib/types";

export default function ManageAttendees() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [actionError, setActionError] = useState("");
  const { data, error, refreshing, refresh } = useScreenData(async () => {
    const [event, attendees] = await Promise.all([
      loadEvent(eventId),
      loadEventAttendees(eventId),
    ]);
    return { event, attendees };
  }, [eventId]);

  async function remove(a: ProfileSummary) {
    const ok = await confirm(
      `Remove ${a.full_name}?`,
      `They'll be taken off the ${data?.event.name} attendee list` +
        (data?.event.status === "closed" ? " and lose the badge for it." : "."),
      "Remove"
    );
    if (!ok) return;
    setActionError("");
    const { error } = await supabase.rpc("set_attendance", {
      p_event: eventId,
      p_profile: a.id,
      p_attended: false,
    });
    if (error) setActionError(friendlyError(error));
    refresh();
  }

  return (
    <AttendeeList
      attendees={data?.attendees ?? null}
      error={error || actionError}
      refreshing={refreshing}
      onRefresh={refresh}
      header={
        data ? (
          <Muted>
            Everyone on this list when {data.event.name} closes gets a badge. Remove anyone
            who can't make it.
          </Muted>
        ) : null
      }
      renderAction={(a) => (
        <Pressable hitSlop={10} onPress={() => remove(a)}>
          <Text style={{ color: colors.danger, fontWeight: "700" }}>Remove</Text>
        </Pressable>
      )}
    />
  );
}
