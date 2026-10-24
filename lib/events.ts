import { supabase } from "./supabase";
import type { CarpetEvent, ProfileSummary } from "./types";

export const PROFILE_SUMMARY_FIELDS =
  "id, full_name, business_name, city_state, favorite_species, photo_url";

/** The one active event (if any), and whether this user is on its list. */
export async function loadActiveEvent(
  userId: string
): Promise<{ event: CarpetEvent | null; registered: boolean }> {
  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("status", "active")
    .maybeSingle();
  if (error) throw error;
  if (!event) return { event: null, registered: false };

  const { count, error: regError } = await supabase
    .from("event_attendees")
    .select("profile_id", { count: "exact", head: true })
    .eq("event_id", event.id)
    .eq("profile_id", userId);
  if (regError) throw regError;
  return { event: event as CarpetEvent, registered: (count ?? 0) > 0 };
}

/** Closed events this person was on the list for, newest first (their badges). */
export async function loadPastEvents(profileId: string): Promise<CarpetEvent[]> {
  const { data, error } = await supabase
    .from("event_attendees")
    .select("events!inner(*)")
    .eq("profile_id", profileId)
    .eq("events.status", "closed");
  if (error) throw error;
  return (data as unknown as { events: CarpetEvent }[])
    .map((row) => row.events)
    .sort((a, b) => (b.closed_at ?? "").localeCompare(a.closed_at ?? ""));
}

export async function loadEvent(eventId: string): Promise<CarpetEvent> {
  const { data, error } = await supabase.from("events").select("*").eq("id", eventId).single();
  if (error) throw error;
  return data as CarpetEvent;
}

/** Everyone on an event's attendee list, sorted by name. */
export async function loadEventAttendees(eventId: string): Promise<ProfileSummary[]> {
  const { data, error } = await supabase
    .from("event_attendees")
    .select(`profiles!inner(${PROFILE_SUMMARY_FIELDS})`)
    .eq("event_id", eventId);
  if (error) throw error;
  return (data as unknown as { profiles: ProfileSummary }[])
    .map((row) => row.profiles)
    .filter((p) => p.full_name)
    .sort((a, b) => a.full_name.localeCompare(b.full_name));
}

/** Turns database error text into something friendly. */
export function friendlyError(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? "Something went wrong.";
  if (/Invalid code/i.test(msg)) return "That code isn't right. Check with the event host.";
  if (/Not allowed/i.test(msg)) return "Only event admins can do that.";
  if (/events_one_active|Close the current event/i.test(msg))
    return "There's already an active event. Close it first.";
  return msg;
}
