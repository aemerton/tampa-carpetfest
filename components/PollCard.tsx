import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Card, ErrorText, Muted } from "@/components/ui";
import { useScreenData } from "@/lib/data";
import { notify } from "@/lib/dialogs";
import { castVote, loadPoll, type PollOption, type PollState } from "@/lib/polls";
import { colors, radius, spacing } from "@/lib/theme";

/**
 * The event's poll on Home. Tap an option to vote; after voting you see the
 * live results and can tap another option to change your vote while it's open.
 * Renders nothing if the event has no poll.
 */
export function PollCard({
  eventId,
  userId,
  canVote,
}: {
  eventId: string;
  userId: string;
  canVote: boolean; // registered for the event
}) {
  const { data, error, refresh } = useScreenData(() => loadPoll(eventId, userId), [eventId, userId]);
  const [pending, setPending] = useState<string | null>(null);
  const [voteError, setVoteError] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const pollId = data?.poll.id;

  // Remember on this device whether the person minimized this poll.
  useEffect(() => {
    if (!pollId) return;
    AsyncStorage.getItem(collapseKey(pollId))
      .then((v) => setCollapsed(v === "1"))
      .catch(() => {});
  }, [pollId]);

  function setMinimized(value: boolean) {
    setCollapsed(value);
    if (!pollId) return;
    const key = collapseKey(pollId);
    (value ? AsyncStorage.setItem(key, "1") : AsyncStorage.removeItem(key)).catch(() => {});
  }

  if (!data) return error ? <ErrorText>{error}</ErrorText> : null;

  const { poll, options, myVote, results, total } = data;
  const voting = poll.is_open && canVote;
  // Only people who can see the results (voters and admins) can minimize.
  const canMinimize = !!results;

  if (canMinimize && collapsed) {
    return (
      <Pressable
        onPress={() => setMinimized(false)}
        accessibilityRole="button"
        accessibilityLabel={`Expand poll: ${poll.question}`}
        style={({ pressed }) => [styles.mini, pressed && { opacity: 0.7 }]}
      >
        <View style={styles.tag}>
          <Ionicons name="stats-chart" size={12} color={colors.onAccent} />
          <Text style={styles.tagText}>POLL</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.miniQuestion} numberOfLines={1}>
            {poll.question}
          </Text>
          <Text style={styles.miniSummary} numberOfLines={1}>
            {summary(data)}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color={colors.accent} />
      </Pressable>
    );
  }

  async function vote(option: PollOption) {
    if (!voting || pending || option.id === myVote) return;
    setVoteError("");
    setPending(option.id);
    try {
      await castVote(option.id);
      await refresh();
      notify(myVote ? `Vote changed to ${option.label}.` : "Thanks for voting!");
    } catch (e: any) {
      setVoteError(e?.message ?? "Couldn't save your vote.");
      await refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <Card style={styles.card}>
      <View style={styles.tagRow}>
        <View style={styles.tag}>
          <Ionicons name="stats-chart" size={12} color={colors.onAccent} />
          <Text style={styles.tagText}>POLL</Text>
        </View>
        <View style={styles.tagRight}>
          {!poll.is_open ? <Muted>Voting closed</Muted> : null}
          {canMinimize ? (
            <Pressable
              onPress={() => setMinimized(true)}
              hitSlop={10}
              accessibilityLabel="Minimize poll"
              style={styles.minimize}
            >
              <Text style={styles.minimizeText}>Minimize</Text>
              <Ionicons name="chevron-up" size={16} color={colors.accent} />
            </Pressable>
          ) : null}
        </View>
      </View>
      <Text style={styles.question}>{poll.question}</Text>

      <View style={{ gap: spacing.sm }}>
        {options.map((o) => (
          <OptionRow
            key={o.id}
            option={o}
            data={data}
            pending={pending === o.id}
            disabled={!voting || !!pending}
            onPress={() => vote(o)}
          />
        ))}
      </View>

      <ErrorText>{voteError}</ErrorText>
      <Muted>{footer(data, voting, canVote)}</Muted>
    </Card>
  );

  function footer(d: PollState, open: boolean, registered: boolean) {
    const count = `${total} ${total === 1 ? "vote" : "votes"}`;
    if (!registered) return results ? `${count} · Only registered attendees can vote.` : "Only registered attendees can vote.";
    if (!d.poll.is_open) return results ? `Final results · ${count}` : "Voting has closed.";
    if (!myVote) return "Tap an option to vote. Results show after you vote.";
    return `${count} · Tap a different option to change your vote.`;
  }
}

function OptionRow({
  option,
  data,
  pending,
  disabled,
  onPress,
}: {
  option: PollOption;
  data: PollState;
  pending: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const mine = data.myVote === option.id;
  const count = data.results?.[option.id] ?? 0;
  const pct = data.results && data.total ? Math.round((count / data.total) * 100) : 0;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: mine }}
      style={({ pressed }) => [
        styles.option,
        mine && styles.optionMine,
        pressed && { opacity: 0.7 },
      ]}
    >
      {data.results ? <View style={[styles.bar, { width: `${pct}%` }]} /> : null}
      <View style={styles.optionContent}>
        {pending ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : mine ? (
          <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
        ) : (
          <Ionicons name="ellipse-outline" size={20} color={colors.textMuted} />
        )}
        <Text style={[styles.optionLabel, mine && { color: colors.accent }]}>{option.label}</Text>
        {data.results ? (
          <Text style={styles.pct}>
            {pct}% <Text style={styles.count}>({count})</Text>
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const collapseKey = (pollId: string) => `carpetfest.pollCollapsed.${pollId}`;

/** One-line summary for the minimized poll: who's leading and your vote. */
function summary({ options, results, myVote, total, poll }: PollState): string {
  if (!results || !total) return "No votes yet";
  const top = Math.max(...options.map((o) => results[o.id] ?? 0));
  const leaders = options.filter((o) => (results[o.id] ?? 0) === top);
  const pct = Math.round((top / total) * 100);
  const lead =
    leaders.length > 1
      ? `Tied: ${leaders.map((o) => o.label).join(" & ")}`
      : `${poll.is_open ? "Leading" : "Winner"}: ${leaders[0].label} ${pct}%`;
  const mine = options.find((o) => o.id === myVote);
  return mine ? `${lead} · You: ${mine.label}` : lead;
}

const styles = StyleSheet.create({
  tagRight: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  minimize: { flexDirection: "row", alignItems: "center", gap: 2 },
  minimizeText: { color: colors.accent, fontSize: 13, fontWeight: "600" },
  mini: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  miniQuestion: { color: colors.text, fontSize: 14, fontWeight: "600" },
  miniSummary: { color: colors.textMuted, fontSize: 12 },
  card: { borderWidth: 1, borderColor: colors.accent, gap: spacing.md },
  tagRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tagText: { color: colors.onAccent, fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  question: { color: colors.text, fontSize: 18, fontWeight: "700", lineHeight: 25 },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    overflow: "hidden",
    minHeight: 48,
    justifyContent: "center",
  },
  optionMine: { borderColor: colors.accent },
  bar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(154,205,50,0.22)",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  optionLabel: { flex: 1, color: colors.text, fontSize: 16, fontWeight: "600" },
  pct: { color: colors.text, fontSize: 15, fontWeight: "700" },
  count: { color: colors.textMuted, fontSize: 13, fontWeight: "400" },
});
