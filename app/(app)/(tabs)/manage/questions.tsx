import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, ErrorText, Loading, Muted } from "@/components/ui";
import { useScreenData } from "@/lib/data";
import { loadQuestions } from "@/lib/questions";
import { supabase } from "@/lib/supabase";
import { colors, radius, spacing } from "@/lib/theme";
import type { ProfileQuestion } from "@/lib/types";

export default function ManageQuestions() {
  const [moving, setMoving] = useState(false);
  const [actionError, setActionError] = useState("");
  const { data, error, refresh } = useScreenData(() => loadQuestions(true));
  // Show reordering right away instead of waiting for the save.
  const [local, setLocal] = useState<ProfileQuestion[] | null>(null);
  const list = local ?? data;

  async function move(index: number, by: -1 | 1) {
    if (!list || moving) return;
    const target = index + by;
    if (target < 0 || target >= list.length) return;

    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    setLocal(next);
    setMoving(true);
    setActionError("");
    // Renumber everything 1..n and save only the rows whose number changed.
    const changed = next
      .map((q, i) => ({ q, order: i + 1 }))
      .filter(({ q, order }) => q.sort_order !== order);
    const results = await Promise.all(
      changed.map(({ q, order }) =>
        supabase.from("profile_questions").update({ sort_order: order }).eq("id", q.id)
      )
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) setActionError(failed.error.message);
    await refresh();
    setLocal(null);
    setMoving(false);
  }

  if (!list) {
    return error ? (
      <View style={styles.page}>
        <ErrorText>{error}</ErrorText>
      </View>
    ) : (
      <Loading />
    );
  }

  const nextOrder = list.reduce((max, q) => Math.max(max, q.sort_order), 0) + 1;
  let shownNumber = 0;

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.page}>
      <Muted>
        These show on everyone's profile under "Get to know you". Hidden questions keep their
        answers, so you can bring them back later.
      </Muted>
      <Button
        title="+ Add question"
        onPress={() =>
          router.push({ pathname: "/question-editor", params: { order: String(nextOrder) } })
        }
      />
      <ErrorText>{error || actionError}</ErrorText>
      {list.length === 0 ? <Muted>No questions yet.</Muted> : null}
      {list.map((q, i) => {
        if (q.active) shownNumber += 1;
        return (
          <View key={q.id} style={[styles.row, !q.active && { opacity: 0.55 }]}>
            <Pressable
              style={{ flex: 1, gap: 2 }}
              onPress={() => router.push({ pathname: "/question-editor", params: { id: q.id } })}
            >
              <Text style={styles.number}>{q.active ? `#${shownNumber}` : "Hidden"}</Text>
              <Text style={styles.prompt}>{q.prompt}</Text>
              <Text style={styles.edit}>Tap to edit</Text>
            </Pressable>
            <View style={styles.arrows}>
              <Pressable
                hitSlop={6}
                disabled={i === 0 || moving}
                onPress={() => move(i, -1)}
                accessibilityLabel="Move up"
              >
                <Ionicons
                  name="chevron-up"
                  size={22}
                  color={i === 0 ? colors.border : colors.accent}
                />
              </Pressable>
              <Pressable
                hitSlop={6}
                disabled={i === list.length - 1 || moving}
                onPress={() => move(i, 1)}
                accessibilityLabel="Move down"
              >
                <Ionicons
                  name="chevron-down"
                  size={22}
                  color={i === list.length - 1 ? colors.border : colors.accent}
                />
              </Pressable>
            </View>
          </View>
        );
      })}
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
    backgroundColor: colors.bg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  number: { color: colors.accent, fontSize: 13, fontWeight: "700" },
  prompt: { color: colors.text, fontSize: 15, lineHeight: 21 },
  edit: { color: colors.textMuted, fontSize: 12 },
  arrows: { gap: spacing.sm, alignItems: "center" },
});
