import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Avatar } from "@/components/profile";
import { Muted } from "@/components/ui";
import type { QuestionWithAnswers } from "@/lib/questions";
import { colors, radius, spacing } from "@/lib/theme";

const MAX_FACES = 5;

/** The list of questions, each with its answer count and a row of faces. */
export function QuestionOverview({
  questions,
  eventId,
}: {
  questions: QuestionWithAnswers[];
  eventId: string;
}) {
  if (!questions.length) return <Muted>No profile questions yet.</Muted>;

  return (
    <View style={{ gap: spacing.sm }}>
      <Muted>Tap a question to swipe through everyone's answers.</Muted>
      {questions.map((q) => {
        const count = q.answers.length;
        return (
          <Pressable
            key={q.id}
            disabled={!count}
            onPress={() =>
              router.push({
                pathname: "/attendees/question/[questionId]",
                params: { questionId: q.id, eventId },
              })
            }
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
          >
            <View style={{ flex: 1, gap: spacing.sm }}>
              <Text style={styles.prompt}>{q.prompt}</Text>
              {count ? (
                <View style={styles.footer}>
                  <View style={styles.faces}>
                    {q.answers.slice(0, MAX_FACES).map((a, i) => (
                      <View key={a.person.id} style={[styles.face, i > 0 && { marginLeft: -10 }]}>
                        <Avatar uri={a.person.photo_url} name={a.person.full_name} size={28} />
                      </View>
                    ))}
                  </View>
                  <Muted>
                    {count} {count === 1 ? "answer" : "answers"}
                  </Muted>
                </View>
              ) : (
                <Muted>No answers yet</Muted>
              )}
            </View>
            {count ? (
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  prompt: { color: colors.text, fontSize: 16, fontWeight: "600", lineHeight: 22 },
  footer: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  faces: { flexDirection: "row" },
  face: { borderRadius: 16, borderWidth: 2, borderColor: colors.surface },
});
