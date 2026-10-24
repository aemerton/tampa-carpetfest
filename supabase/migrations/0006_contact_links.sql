-- Optional contact details and links on profiles.
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.

alter table public.profiles
  add column contact_email text,
  add column phone text,
  add column instagram text,
  add column facebook text,
  add column morph_market text,
  add column website text;

-- Profile edits are allowed column by column (so no one can make themselves
-- admin), so the new columns need to be added to that list.
grant update (contact_email, phone, instagram, facebook, morph_market, website)
  on public.profiles to authenticated;
