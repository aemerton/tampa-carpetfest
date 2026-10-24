// The year the app is being used for.
export const EVENT_YEAR = 2027;

// Earliest CarpetFest a person can mark as "attended" on their profile.
export const FIRST_EVENT_YEAR = 2018;

export const PAST_EVENT_YEARS: number[] = Array.from(
  { length: EVENT_YEAR - FIRST_EVENT_YEAR },
  (_, i) => FIRST_EVENT_YEAR + i
);
