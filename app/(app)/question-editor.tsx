import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { Button, Card, ErrorText, Field, Loading, Muted, Screen } from "@/components/ui";
import { useIsAdmin } from "@/lib/auth";
import { confirm, notify } from "@/lib/dialogs";
import { supabase } from "@/lib/supabase";
import { colors, spacing } from "@/lib/theme";

function close() {
  if (router.canGoBack()) router.back();
  else router.replace("/manage/questions");
}

/** Add a profile question (no `id`) or edit/hide/delete an existing one. */
export default function QuestionEditor() {
  const { id, order } = useLocalSearchParams<{ id?: string; order?: string }>();
  const isAdmin = useIsAdmin();
  const [prompt, setPrompt] = useState("");
  const [active, setActive] = useState(true);
  const [answerCount, setAnswerCount] = useState(0);
  const [loaded, setLoaded] = useState(!id);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from("profile_questions").select("prompt, active").eq("id", id).single(),
      supabase
        .from("profile_answers")
        .select("question_id", { count: "exact", head: true })
        .eq("question_id", id),
    ]).then(([q, answers]) => {
      if (q.error) setError(q.error.message);
      else {
        setPrompt(q.data.prompt);
        setActive(q.data.active);
        setAnswerCount(answers.count ?? 0);
      }
      setLoaded(true);
    });
  }, [id]);

  if (!isAdmin) {
    return (
      <Screen edges={[]}>
        <Muted>Only event admins can edit profile questions.</Muted>
      </Screen>
    );
  }
  if (!loaded) return <Loading />;

  async function save() {
    setError("");
    if (!prompt.trim()) {
      setError("Write the question first.");
      return;
    }
    setBusy(true);
    const values = { prompt: prompt.trim(), active };
    const { error } = id
      ? await supabase.from("profile_questions").update(values).eq("id", id)
      : await supabase
          .from("profile_questions")
          .insert({ ...values, sort_order: Number(order) || 999 });
    setBusy(false);
    if (error) setError(error.message);
    else {
      notify(id ? "Question updated." : "Question added.");
      close();
    }
  }

  async function remove() {
    const ok = await confirm(
      "Delete this question?",
      answerCount
        ? `${answerCount} ${answerCount === 1 ? "person has" : "people have"} answered it, and ` +
            "those answers will be deleted too. To keep them, hide the question instead."
        : "No one has answered it yet.",
      "Delete"
    );
    if (!ok) return;
    setBusy(true);
    const { error } = await supabase.from("profile_questions").delete().eq("id", id!);
    setBusy(false);
    if (error) setError(error.message);
    else {
      notify("Question deleted.");
      close();
    }
  }

  return (
    <Screen edges={[]}>
      <Field
        label="Question"
        value={prompt}
        onChangeText={setPrompt}
        multiline
        placeholder="What's your favorite morph?"
        style={{ minHeight: 72 }}
      />
      {id ? (
        <Muted>
          {answerCount} {answerCount === 1 ? "answer" : "answers"} so far. Rewording keeps them,
          so only make small changes that don't change the meaning.
        </Muted>
      ) : null}

      <Card style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.switchLabel}>Show on profiles</Text>
          <Muted>
            {active
              ? "On: people can answer it and others can see the answers."
              : "Off: hidden everywhere, but answers are kept."}
          </Muted>
        </View>
        <Switch
          value={active}
          onValueChange={setActive}
          trackColor={{ true: colors.accent, false: colors.border }}
          thumbColor={colors.text}
        />
      </Card>

      <ErrorText>{error}</ErrorText>
      <Button title={id ? "Save changes" : "Add question"} onPress={save} loading={busy} />
      {id ? <Button title="Delete question" variant="ghost" onPress={remove} disabled={busy} /> : null}
      <Button title="Cancel" variant="ghost" onPress={close} disabled={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  switchRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  switchLabel: { color: colors.text, fontSize: 16, fontWeight: "700" },
});
