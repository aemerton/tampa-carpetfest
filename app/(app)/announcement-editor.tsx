import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Button, ErrorText, Field, Loading, Muted, Screen } from "@/components/ui";
import { useIsAdmin } from "@/lib/auth";
import { confirm } from "@/lib/dialogs";
import { supabase } from "@/lib/supabase";

function close() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

export default function AnnouncementEditor() {
  // `id` edits an existing announcement; `eventId` creates one for that event.
  const { id, eventId } = useLocalSearchParams<{ id?: string; eventId?: string }>();
  const isAdmin = useIsAdmin();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loaded, setLoaded] = useState(!id);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("announcements")
      .select("title, body")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else {
          setTitle(data.title);
          setBody(data.body);
        }
        setLoaded(true);
      });
  }, [id]);

  if (!isAdmin) {
    return (
      <Screen edges={[]}>
        <Muted>Only event admins can post announcements.</Muted>
      </Screen>
    );
  }
  if (!loaded) return <Loading />;

  async function save() {
    setError("");
    if (!id && !eventId) {
      setError("Open this from an event to post to it.");
      return;
    }
    if (!title.trim() || !body.trim()) {
      setError("Add a title and a message.");
      return;
    }
    setBusy(true);
    const values = { title: title.trim(), body: body.trim() };
    const { error } = id
      ? await supabase.from("announcements").update(values).eq("id", id)
      : await supabase.from("announcements").insert({ ...values, event_id: eventId });
    setBusy(false);
    if (error) setError(error.message);
    else close();
  }

  async function remove() {
    if (!(await confirm("Delete this announcement?", "Everyone will stop seeing it."))) return;
    setBusy(true);
    const { error } = await supabase.from("announcements").delete().eq("id", id!);
    setBusy(false);
    if (error) setError(error.message);
    else close();
  }

  return (
    <Screen edges={[]}>
      <Field label="Title" value={title} onChangeText={setTitle} placeholder="Dinner moved to 7pm" />
      <Field
        label="Message"
        value={body}
        onChangeText={setBody}
        multiline
        placeholder="What do attendees need to know?"
        style={{ minHeight: 160 }}
      />
      <ErrorText>{error}</ErrorText>
      <Button title={id ? "Save changes" : "Post announcement"} onPress={save} loading={busy} />
      {id ? <Button title="Delete" variant="ghost" onPress={remove} disabled={busy} /> : null}
      <Button title="Cancel" variant="ghost" onPress={close} disabled={busy} />
    </Screen>
  );
}
