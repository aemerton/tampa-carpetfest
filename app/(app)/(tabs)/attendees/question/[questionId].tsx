import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { Avatar } from "@/components/profile";
import { Button, ErrorText, Loading, Muted } from "@/components/ui";
import { useScreenData } from "@/lib/data";
import { loadEventAnswers, type AnswerCard } from "@/lib/questions";
import { colors, radius, spacing } from "@/lib/theme";

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Swipe through everyone's answer to one question, one card per person. */
export default function AnswerDeck() {
  const { questionId, eventId, start } = useLocalSearchParams<{
    questionId: string;
    eventId: string;
    start?: string; // profile id to show first (from someone's Q&A tab)
  }>();

  const { data, error } = useScreenData(async () => {
    const all = await loadEventAnswers(eventId);
    return all.find((q) => q.id === questionId) ?? null;
  }, [eventId, questionId]);

  // Shuffle once per visit, so coming back from a profile doesn't reshuffle.
  const [order, setOrder] = useState<string[] | null>(null);
  useEffect(() => {
    if (!data || order) return;
    const ids = shuffle(data.answers.map((a) => a.person.id));
    if (start && ids.includes(start)) {
      ids.splice(ids.indexOf(start), 1);
      ids.unshift(start);
    }
    setOrder(ids);
  }, [data, order, start]);

  const cards: AnswerCard[] = useMemo(() => {
    if (!data || !order) return [];
    const byId = new Map(data.answers.map((a) => [a.person.id, a]));
    const ordered = order.map((id) => byId.get(id)).filter((a): a is AnswerCard => !!a);
    // Anyone who answered since the deck opened goes at the end.
    const extra = data.answers.filter((a) => !order.includes(a.person.id));
    return [...ordered, ...extra];
  }, [data, order]);

  const listRef = useRef<FlatList<AnswerCard>>(null);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);

  function goTo(i: number) {
    if (!width || i < 0 || i >= cards.length) return;
    listRef.current?.scrollToOffset({ offset: i * width, animated: true });
    setIndex(i);
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (!width) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index && i >= 0 && i < cards.length) setIndex(i);
  }

  // Arrow keys on a computer.
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(index + 1);
      if (e.key === "ArrowLeft") goTo(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!data || !order) {
    return error ? (
      <View style={styles.page}>
        <ErrorText>{error}</ErrorText>
      </View>
    ) : (
      <Loading />
    );
  }

  return (
    <View style={styles.page}>
      <Stack.Screen options={{ headerTitle: "" }} />
      <Text style={styles.question}>{data.prompt}</Text>

      {cards.length === 0 ? (
        <Muted>No one at this event has answered this one yet.</Muted>
      ) : (
        <>
          <View style={{ flex: 1 }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
            {width ? (
              <FlatList
                ref={listRef}
                data={cards}
                keyExtractor={(c) => c.person.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
                renderItem={({ item }) => <AnswerCardView card={item} width={width} />}
              />
            ) : null}
          </View>

          <View style={styles.nav}>
            <NavButton icon="chevron-back" disabled={index === 0} onPress={() => goTo(index - 1)} />
            <Text style={styles.counter}>
              {index + 1} of {cards.length}
            </Text>
            <NavButton
              icon="chevron-forward"
              disabled={index >= cards.length - 1}
              onPress={() => goTo(index + 1)}
            />
          </View>
          {cards.length > 1 ? <Text style={styles.hint}>Swipe to see the next answer</Text> : null}
        </>
      )}
    </View>
  );
}

function AnswerCardView({ card, width }: { card: AnswerCard; width: number }) {
  const { person, answer } = card;
  return (
    <View style={{ width, paddingHorizontal: spacing.xs }}>
      <ScrollView
        style={styles.card}
        contentContainerStyle={styles.cardContent}
        showsVerticalScrollIndicator={false}
      >
        <Avatar uri={person.photo_url} name={person.full_name} size={104} glowing />
        <View style={{ alignItems: "center", gap: 2 }}>
          <Text style={styles.name}>{person.full_name}</Text>
          {person.business_name ? <Text style={styles.business}>{person.business_name}</Text> : null}
          {person.city_state ? <Muted>{person.city_state}</Muted> : null}
        </View>
        <View style={styles.divider} />
        <Text style={styles.answer}>{answer}</Text>
        <Button
          title="View profile"
          variant="secondary"
          onPress={() => router.push(`/attendees/${person.id}`)}
          style={{ alignSelf: "stretch", marginTop: spacing.md }}
        />
      </ScrollView>
    </View>
  );
}

function NavButton({
  icon,
  disabled,
  onPress,
}: {
  icon: "chevron-back" | "chevron-forward";
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityLabel={icon === "chevron-back" ? "Previous answer" : "Next answer"}
      style={({ pressed }) => [styles.navButton, (disabled || pressed) && { opacity: 0.35 }]}
    >
      <Ionicons name={icon} size={24} color={colors.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },
  question: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 27,
    textAlign: "center",
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardContent: {
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.md,
    flexGrow: 1,
    justifyContent: "center",
  },
  name: { color: colors.accent, fontSize: 20, fontWeight: "700", textAlign: "center" },
  business: { color: colors.text, fontSize: 15, fontWeight: "600", textAlign: "center" },
  divider: { width: 48, height: 2, backgroundColor: colors.border, borderRadius: 1 },
  answer: { color: colors.text, fontSize: 22, lineHeight: 31, textAlign: "center" },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  counter: { color: colors.text, fontSize: 16, fontWeight: "600" },
  hint: { color: colors.textMuted, fontSize: 13, textAlign: "center" },
});
