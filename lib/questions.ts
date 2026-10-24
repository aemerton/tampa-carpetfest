import { loadEventAttendees } from "./events";
import { supabase } from "./supabase";
import type { ProfileQuestion, ProfileSummary } from "./types";

export type AnswerCard = { person: ProfileSummary; answer: string };
export type QuestionWithAnswers = ProfileQuestion & { answers: AnswerCard[] };

/**
 * Every shown question with the answers from people registered for one
 * event. Only people on that event's attendee list are included.
 */
export async function loadEventAnswers(eventId: string): Promise<QuestionWithAnswers[]> {
  const [questions, attendees] = await Promise.all([
    loadQuestions(),
    loadEventAttendees(eventId),
  ]);
  if (!attendees.length) return questions.map((q) => ({ ...q, answers: [] }));

  const people = new Map(attendees.map((p) => [p.id, p]));
  const { data, error } = await supabase
    .from("profile_answers")
    .select("profile_id, question_id, answer")
    .in("profile_id", [...people.keys()]);
  if (error) throw error;

  const byQuestion = new Map<string, AnswerCard[]>();
  for (const row of data ?? []) {
    const person = people.get(row.profile_id);
    if (!person) continue;
    const list = byQuestion.get(row.question_id) ?? [];
    list.push({ person, answer: row.answer });
    byQuestion.set(row.question_id, list);
  }
  return questions.map((q) => ({ ...q, answers: byQuestion.get(q.id) ?? [] }));
}

/** Questions in display order. Pass `includeHidden` for the admin list. */
export async function loadQuestions(includeHidden = false): Promise<ProfileQuestion[]> {
  let query = supabase
    .from("profile_questions")
    .select("id, prompt, sort_order, active")
    .order("sort_order")
    .order("created_at");
  if (!includeHidden) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw error;
  return data as ProfileQuestion[];
}

/** A profile's answers, keyed by question id. */
export async function loadAnswers(profileId: string): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from("profile_answers")
    .select("question_id, answer")
    .eq("profile_id", profileId);
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((r) => [r.question_id, r.answer]));
}

/**
 * Saves only the answers that changed: new or edited ones are written,
 * answers cleared to blank are removed.
 */
export async function saveAnswers(
  profileId: string,
  before: Record<string, string>,
  after: Record<string, string>
) {
  const ids = new Set([...Object.keys(before), ...Object.keys(after)]);
  const upserts: { profile_id: string; question_id: string; answer: string }[] = [];
  const removals: string[] = [];

  for (const id of ids) {
    const next = (after[id] ?? "").trim();
    if (next === (before[id] ?? "").trim()) continue;
    if (next) upserts.push({ profile_id: profileId, question_id: id, answer: next });
    else if (before[id]) removals.push(id);
  }

  if (upserts.length) {
    const { error } = await supabase
      .from("profile_answers")
      .upsert(upserts, { onConflict: "profile_id,question_id" });
    if (error) throw error;
  }
  if (removals.length) {
    const { error } = await supabase
      .from("profile_answers")
      .delete()
      .eq("profile_id", profileId)
      .in("question_id", removals);
    if (error) throw error;
  }
}
