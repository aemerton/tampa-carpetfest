import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { DateInput, TimeInput } from "@/components/DateTimeInputs";
import { Button, ErrorText, Field, Loading, Muted, Screen } from "@/components/ui";
import { useIsAdmin } from "@/lib/auth";
import { combine, toDateStr, toTimeStr } from "@/lib/datetime";
import { confirm } from "@/lib/dialogs";
import { supabase } from "@/lib/supabase";
import { spacing } from "@/lib/theme";

function close() {
  if (router.canGoBack()) router.back();
  else router.replace("/itinerary");
}

export default function EventEditor() {
  // `id` edits an existing item; `eventId` creates one for that event.
  const { id, eventId } = useLocalSearchParams<{ id?: string; eventId?: string }>();
  const isAdmin = useIsAdmin();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      if (id) {
        const { data, error } = await supabase
          .from("itinerary_items")
          .select("*")
          .eq("id", id)
          .single();
        if (error) setError(error.message);
        else {
          const s = new Date(data.starts_at);
          setTitle(data.title);
          setDate(toDateStr(s));
          setStart(toTimeStr(s));
          setEnd(data.ends_at ? toTimeStr(new Date(data.ends_at)) : "");
          setLocation(data.location ?? "");
          setDescription(data.description ?? "");
        }
      } else {
        // New item: default to the same day as the latest item, so adding a
        // whole day's schedule doesn't mean re-picking the date every time.
        const { data } = eventId
          ? await supabase
              .from("itinerary_items")
              .select("starts_at")
              .eq("event_id", eventId)
              .order("starts_at", { ascending: false })
              .limit(1)
          : { data: null };
        setDate(toDateStr(data?.[0] ? new Date(data[0].starts_at) : new Date()));
      }
      setLoaded(true);
    }
    load();
  }, [id, eventId]);

  if (!isAdmin) {
    return (
      <Screen edges={[]}>
        <Muted>Only event admins can edit the itinerary.</Muted>
      </Screen>
    );
  }
  if (!loaded) return <Loading />;

  async function save() {
    setError("");
    if (!id && !eventId) {
      setError("Open this from an event to add items to it.");
      return;
    }
    if (!title.trim() || !date || !start) {
      setError("Add a title, a date, and a start time.");
      return;
    }
    const startsAt = combine(date, start);
    let endsAt: Date | null = null;
    if (end) {
      endsAt = combine(date, end);
      // An end time earlier than the start means it runs past midnight.
      if (endsAt <= startsAt) endsAt.setDate(endsAt.getDate() + 1);
    }

    setBusy(true);
    const values = {
      title: title.trim(),
      starts_at: startsAt.toISOString(),
      ends_at: endsAt ? endsAt.toISOString() : null,
      location: location.trim() || null,
      description: description.trim() || null,
    };
    const { error } = id
      ? await supabase.from("itinerary_items").update(values).eq("id", id)
      : await supabase.from("itinerary_items").insert({ ...values, event_id: eventId });
    setBusy(false);
    if (error) setError(error.message);
    else close();
  }

  async function remove() {
    if (!(await confirm("Delete this item?", "It will be removed from the itinerary."))) return;
    setBusy(true);
    const { error } = await supabase.from("itinerary_items").delete().eq("id", id!);
    setBusy(false);
    if (error) setError(error.message);
    else close();
  }

  return (
    <Screen edges={[]}>
      <Field label="What's happening" value={title} onChangeText={setTitle} placeholder="Welcome cookout" />
      <DateInput label="Date" value={date} onChange={setDate} />
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <TimeInput label="Starts" value={start} onChange={setStart} />
        <TimeInput label="Ends (optional)" value={end} onChange={setEnd} />
      </View>
      {end ? (
        <Button title="Remove end time" variant="ghost" onPress={() => setEnd("")} />
      ) : null}
      <Field label="Location" value={location} onChangeText={setLocation} placeholder="Back patio" />
      <Field
        label="Details"
        value={description}
        onChangeText={setDescription}
        multiline
        placeholder="Anything people should bring or know"
      />
      <ErrorText>{error}</ErrorText>
      <Button title={id ? "Save changes" : "Add to itinerary"} onPress={save} loading={busy} />
      {id ? <Button title="Delete" variant="ghost" onPress={remove} disabled={busy} /> : null}
      <Button title="Cancel" variant="ghost" onPress={close} disabled={busy} />
    </Screen>
  );
}
