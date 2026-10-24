import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { Button, Card, ErrorText, Field, Loading, Muted, SectionTitle } from "@/components/ui";
import { useUserId } from "@/lib/auth";
import { confirm, notify } from "@/lib/dialogs";
import { friendlyError } from "@/lib/events";
import { loadPoll, type PollState } from "@/lib/polls";
import { supabase } from "@/lib/supabase";
import { colors, radius, spacing } from "@/lib/theme";

type DraftOption = { key: string; id?: string; label: string };

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 4;
let nextKey = 0;
const newOption = (label = "", id?: string): DraftOption => ({ key: `o${nextKey++}`, id, label });

/** Set up, edit, open/close, or delete an event's poll. */
export default function ManagePoll() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const userId = useUserId();
  const [state, setState] = useState<PollState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<DraftOption[]>([newOption(), newOption()]);
  const [isOpen, setIsOpen] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const s = await loadPoll(eventId, userId);
      setState(s);
      if (s) {
        setQuestion(s.poll.question);
        setIsOpen(s.poll.is_open);
        setOptions(s.options.map((o) => newOption(o.label, o.id)));
      }
    } catch (e: any) {
      setError(e?.message ?? "Couldn't load the poll.");
    }
    setLoaded(true);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  if (!loaded) return <Loading />;

  const votesFor = (id?: string) => (id && state?.results ? state.results[id] ?? 0 : 0);

  async function removeOption(o: DraftOption) {
    const votes = votesFor(o.id);
    if (votes) {
      const ok = await confirm(
        `Remove "${o.label}"?`,
        `${votes} ${votes === 1 ? "person voted" : "people voted"} for it. When you save, ` +
          "those votes are removed and they can vote again.",
        "Remove"
      );
      if (!ok) return;
    }
    setOptions((list) => list.filter((x) => x.key !== o.key));
  }

  async function save() {
    setError("");
    const cleaned = options.map((o) => ({ ...o, label: o.label.trim() }));
    if (!question.trim()) return setError("Write the poll question.");
    if (cleaned.some((o) => !o.label)) return setError("Fill in every option, or remove the empty ones.");
    if (cleaned.length < MIN_OPTIONS) return setError("A poll needs at least 2 options.");

    setBusy(true);
    const { error } = await supabase.rpc("save_poll", {
      p_event: eventId,
      p_question: question,
      p_options: cleaned.map((o) => (o.id ? { id: o.id, label: o.label } : { label: o.label })),
      p_is_open: isOpen,
    });
    setBusy(false);
    if (error) return setError(friendlyError(error));
    notify(state ? "Poll updated." : "Poll created! It's on everyone's Home screen now.");
    router.back();
  }

  async function remove() {
    const ok = await confirm(
      "Delete this poll?",
      `It disappears from Home and all ${state?.total ?? 0} votes are deleted.`,
      "Delete"
    );
    if (!ok) return;
    setBusy(true);
    const { error } = await supabase.from("event_polls").delete().eq("event_id", eventId);
    setBusy(false);
    if (error) return setError(error.message);
    notify("Poll deleted.");
    router.back();
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={styles.page}
      keyboardShouldPersistTaps="handled"
    >
      <Muted>
        One poll per event. It shows on Home for registered attendees, who can vote once and
        change their vote while it's open. Results show after someone votes.
      </Muted>

      <Field
        label="Question"
        value={question}
        onChangeText={setQuestion}
        placeholder="Where should we eat Saturday night?"
      />

      <SectionTitle>Options ({options.length} of {MAX_OPTIONS})</SectionTitle>
      {options.map((o, i) => (
        <View key={o.key} style={styles.optionRow}>
          <TextInput
            value={o.label}
            onChangeText={(v) =>
              setOptions((list) => list.map((x) => (x.key === o.key ? { ...x, label: v } : x)))
            }
            placeholder={`Option ${i + 1}`}
            placeholderTextColor={colors.textMuted}
            style={styles.optionInput}
          />
          {o.id && state?.results ? (
            <Text style={styles.votes}>{votesFor(o.id)} votes</Text>
          ) : null}
          {options.length > MIN_OPTIONS ? (
            <Pressable
              onPress={() => removeOption(o)}
              hitSlop={8}
              accessibilityLabel={`Remove option ${i + 1}`}
            >
              <Ionicons name="close-circle" size={24} color={colors.danger} />
            </Pressable>
          ) : null}
        </View>
      ))}
      {options.length < MAX_OPTIONS ? (
        <Button
          title="+ Add option"
          variant="ghost"
          onPress={() => setOptions((list) => [...list, newOption()])}
        />
      ) : null}

      <Card style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.switchLabel}>Open for voting</Text>
          <Muted>
            {isOpen
              ? "On: people can vote and change their vote."
              : "Off: votes are locked; voters still see the final results."}
          </Muted>
        </View>
        <Switch
          value={isOpen}
          onValueChange={setIsOpen}
          trackColor={{ true: colors.accent, false: colors.border }}
          thumbColor={colors.text}
        />
      </Card>

      {state ? (
        <Muted>
          {state.total} {state.total === 1 ? "vote" : "votes"} so far. Rewording an option keeps
          its votes.
        </Muted>
      ) : null}

      <ErrorText>{error}</ErrorText>
      <Button title={state ? "Save poll" : "Create poll"} onPress={save} loading={busy} />
      {state ? (
        <Button title="Delete poll" variant="ghost" onPress={remove} disabled={busy} />
      ) : null}
    </ScrollView>
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
  },
  optionRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  optionInput: {
    flex: 1,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  votes: { color: colors.textMuted, fontSize: 13 },
  switchRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  switchLabel: { color: colors.text, fontSize: 16, fontWeight: "700" },
});
