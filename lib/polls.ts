import { supabase } from "./supabase";

export type Poll = { id: string; event_id: string; question: string; is_open: boolean };
export type PollOption = { id: string; label: string; sort_order: number };

export type PollState = {
  poll: Poll;
  options: PollOption[];
  myVote: string | null; // option id, or null if this person hasn't voted
  results: Record<string, number> | null; // null until they've voted (admins always see)
  total: number;
};

/** An event's poll with this person's vote and, if they may see them, results. */
export async function loadPoll(eventId: string, userId: string): Promise<PollState | null> {
  const { data: poll, error } = await supabase
    .from("event_polls")
    .select("id, event_id, question, is_open")
    .eq("event_id", eventId)
    .maybeSingle();
  if (error) throw error;
  if (!poll) return null;

  const [options, vote, results] = await Promise.all([
    supabase
      .from("poll_options")
      .select("id, label, sort_order")
      .eq("poll_id", poll.id)
      .order("sort_order"),
    supabase
      .from("poll_votes")
      .select("option_id")
      .eq("poll_id", poll.id)
      .eq("profile_id", userId)
      .maybeSingle(),
    supabase.rpc("get_poll_results", { p_poll: poll.id }),
  ]);
  if (options.error) throw options.error;
  if (vote.error) throw vote.error;
  if (results.error) throw results.error;

  const rows = (results.data ?? []) as { option_id: string; votes: number }[];
  const counts = rows.length
    ? Object.fromEntries(rows.map((r) => [r.option_id, Number(r.votes)]))
    : null;

  return {
    poll: poll as Poll,
    options: options.data as PollOption[],
    myVote: vote.data?.option_id ?? null,
    results: counts,
    total: counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0,
  };
}

export async function castVote(optionId: string) {
  const { error } = await supabase.rpc("cast_vote", { p_option: optionId });
  if (error) throw error;
}
