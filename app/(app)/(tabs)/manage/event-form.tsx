import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { Button, Card, ErrorText, Field, Loading, Muted, Screen } from "@/components/ui";
import { friendlyError } from "@/lib/events";
import { supabase } from "@/lib/supabase";
import { colors, spacing } from "@/lib/theme";

/** Create a new event (no `id`) or edit an existing one's details. */
export default function EventForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [loaded, setLoaded] = useState(!id);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from("events").select("*").eq("id", id).single(),
      supabase.from("event_codes").select("code").eq("event_id", id).maybeSingle(),
    ]).then(([event, codeRow]) => {
      if (event.error) setError(event.error.message);
      else {
        setName(event.data.name);
        setRegistrationOpen(event.data.registration_open);
        setIsActive(event.data.status === "active");
        setCode(codeRow.data?.code ?? "");
      }
      setLoaded(true);
    });
  }, [id]);

  if (!loaded) return <Loading />;

  async function save() {
    setError("");
    if (!name.trim() || !code.trim()) {
      setError("Give the event a name and a code.");
      return;
    }
    setBusy(true);
    if (id) {
      const { error } = await supabase.rpc("update_event", {
        p_event: id,
        p_name: name,
        p_code: code,
        p_registration_open: isActive && registrationOpen,
      });
      setBusy(false);
      if (error) setError(friendlyError(error));
      else router.back();
    } else {
      const { data, error } = await supabase.rpc("create_event", {
        p_name: name,
        p_code: code,
        p_registration_open: registrationOpen,
      });
      setBusy(false);
      if (error) setError(friendlyError(error));
      // Straight on to setting up the schedule.
      else router.replace({ pathname: "/manage/[eventId]/itinerary", params: { eventId: data, isNew: "1" } });
    }
  }

  return (
    <Screen edges={[]}>
      {!id ? (
        <Card>
          <Muted>
            After creating the event you'll set up its itinerary. You can change any of this
            later from Manage Event.
          </Muted>
        </Card>
      ) : null}
      <Field label="Event name" value={name} onChangeText={setName} placeholder="Tampa CarpetFest 2028" />
      <Field
        label="Event code"
        value={code}
        onChangeText={setCode}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="carpet28"
      />
      <Muted>
        People use this code to create an account or register. Not case-sensitive. Only admins
        can see it.
      </Muted>

      {isActive ? (
        <Card style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Open registration</Text>
            <Muted>
              {registrationOpen
                ? "On: people can sign up or register with the code."
                : "Off: no one new can join yet. Existing users see \"coming soon\"."}
            </Muted>
          </View>
          <Switch
            value={registrationOpen}
            onValueChange={setRegistrationOpen}
            trackColor={{ true: colors.accent, false: colors.border }}
            thumbColor={colors.text}
          />
        </Card>
      ) : null}

      <ErrorText>{error}</ErrorText>
      <Button title={id ? "Save changes" : "Create event"} onPress={save} loading={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  switchRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  switchLabel: { color: colors.text, fontSize: 16, fontWeight: "700" },
});
