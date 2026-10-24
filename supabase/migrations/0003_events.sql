-- Events: one active event at a time, each with its own code, attendee
-- list, itinerary, and announcements. Moves existing data over to
-- "Tampa CarpetFest 2027" and creates a closed "Tampa CarpetFest 2026".
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.

begin;

------------------------------------------------------------------------------
-- Tables
------------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  status text not null default 'active' check (status in ('active', 'closed')),
  registration_open boolean not null default true,
  -- Lets people mark themselves as having attended (for events before the app).
  allow_self_report boolean not null default false,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

-- The database refuses a second active event.
create unique index events_one_active on public.events ((true)) where status = 'active';

-- Codes live in their own table so only admins can ever read them.
create table public.event_codes (
  event_id uuid primary key references public.events (id) on delete cascade,
  code text not null check (length(trim(code)) > 0)
);

create table public.event_attendees (
  event_id uuid not null references public.events (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  registered_at timestamptz not null default now(),
  primary key (event_id, profile_id)
);
create index event_attendees_profile on public.event_attendees (profile_id);

alter table public.events enable row level security;
alter table public.event_codes enable row level security;
alter table public.event_attendees enable row level security;

create policy "Logged-in users can view events"
  on public.events for select to authenticated using (true);

create policy "Admins can view event codes"
  on public.event_codes for select to authenticated using ((select public.is_admin()));

-- Attendee lists (and the badges they become) are visible to everyone logged in.
create policy "Logged-in users can view attendee lists"
  on public.event_attendees for select to authenticated using (true);

-- All changes to these three tables go through the functions below.

------------------------------------------------------------------------------
-- Existing data
------------------------------------------------------------------------------
insert into public.events (name, status, registration_open, allow_self_report, created_at, closed_at)
values ('Tampa CarpetFest 2026', 'closed', false, true, now(), now());

with e as (
  insert into public.events (name) values ('Tampa CarpetFest 2027') returning id
)
insert into public.event_codes (event_id, code) select id, 'carpet27' from e;

-- Anyone who already ticked 2026 on their profile gets credit for it.
insert into public.event_attendees (event_id, profile_id)
select e.id, p.id
from public.profiles p, public.events e
where e.name = 'Tampa CarpetFest 2026' and 2026 = any (p.years_attended);

-- Everyone who signed up so far did so with the 2027 code.
insert into public.event_attendees (event_id, profile_id)
select e.id, p.id from public.profiles p, public.events e where e.status = 'active';

alter table public.profiles drop column years_attended;

-- Itinerary and announcements now belong to an event.
alter table public.itinerary_items
  add column event_id uuid references public.events (id) on delete cascade;
alter table public.announcements
  add column event_id uuid references public.events (id) on delete cascade;
update public.itinerary_items set event_id = (select id from public.events where status = 'active');
update public.announcements set event_id = (select id from public.events where status = 'active');
alter table public.itinerary_items alter column event_id set not null;
alter table public.announcements alter column event_id set not null;
create index itinerary_items_event on public.itinerary_items (event_id, starts_at);
create index announcements_event on public.announcements (event_id, created_at);

------------------------------------------------------------------------------
-- Sign-up: the code must match the active event, and registration must be
-- open. Signing up registers you for that event.
------------------------------------------------------------------------------
create or replace function public.check_invite_code(p_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.events e
    join public.event_codes c on c.event_id = e.id
    where e.status = 'active'
      and e.registration_open
      and lower(trim(c.code)) = lower(trim(p_code))
  );
$$;

-- The BEFORE trigger on auth.users (enforce_invite_code) already calls
-- check_invite_code, so it now checks the active event's code automatically.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));

  insert into public.event_attendees (event_id, profile_id)
  select id, new.id from public.events where status = 'active';
  return new;
end;
$$;

drop table public.invite_codes;

------------------------------------------------------------------------------
-- Functions the app calls
------------------------------------------------------------------------------

-- An existing user registers for the active event with its code.
create function public.register_for_event(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event uuid;
begin
  if auth.uid() is null then
    raise exception 'Not logged in';
  end if;
  select e.id into v_event
  from public.events e
  join public.event_codes c on c.event_id = e.id
  where e.status = 'active'
    and e.registration_open
    and lower(trim(c.code)) = lower(trim(p_code));
  if v_event is null then
    raise exception 'Invalid code';
  end if;
  insert into public.event_attendees (event_id, profile_id)
  values (v_event, auth.uid())
  on conflict do nothing;
  return v_event;
end;
$$;

-- Adds or removes someone from an event's attendee list. Admins can do this
-- for anyone; people can only answer "did you attend?" for themselves on
-- events that allow it.
create function public.set_attendance(p_event uuid, p_profile uuid, p_attended boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() and not (
    p_profile = auth.uid()
    and exists (select 1 from public.events where id = p_event and allow_self_report)
  ) then
    raise exception 'Not allowed';
  end if;

  if p_attended then
    insert into public.event_attendees (event_id, profile_id)
    values (p_event, p_profile)
    on conflict do nothing;
  else
    delete from public.event_attendees where event_id = p_event and profile_id = p_profile;
  end if;
end;
$$;

create function public.create_event(p_name text, p_code text, p_registration_open boolean)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event uuid;
begin
  if not public.is_admin() then
    raise exception 'Not allowed';
  end if;
  if exists (select 1 from public.events where status = 'active') then
    raise exception 'Close the current event before creating a new one';
  end if;
  insert into public.events (name, registration_open)
  values (trim(p_name), p_registration_open)
  returning id into v_event;
  insert into public.event_codes (event_id, code) values (v_event, trim(p_code));
  return v_event;
end;
$$;

create function public.update_event(
  p_event uuid, p_name text, p_code text, p_registration_open boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not allowed';
  end if;
  update public.events
  set name = trim(p_name), registration_open = p_registration_open
  where id = p_event;
  insert into public.event_codes (event_id, code) values (p_event, trim(p_code))
  on conflict (event_id) do update set code = excluded.code;
end;
$$;

-- Closing an event turns its attendee list into everyone's badges.
create function public.close_event(p_event uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not allowed';
  end if;
  update public.events
  set status = 'closed', registration_open = false, closed_at = now()
  where id = p_event and status = 'active';
end;
$$;

-- For undoing an accidental close.
create function public.reopen_event(p_event uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not allowed';
  end if;
  if exists (select 1 from public.events where status = 'active' and id <> p_event) then
    raise exception 'Close the current event before reopening another one';
  end if;
  update public.events set status = 'active', closed_at = null where id = p_event;
end;
$$;

revoke execute on function
  public.register_for_event(text),
  public.set_attendance(uuid, uuid, boolean),
  public.create_event(text, text, boolean),
  public.update_event(uuid, text, text, boolean),
  public.close_event(uuid),
  public.reopen_event(uuid)
from public, anon;
grant execute on function
  public.register_for_event(text),
  public.set_attendance(uuid, uuid, boolean),
  public.create_event(text, text, boolean),
  public.update_event(uuid, text, text, boolean),
  public.close_event(uuid),
  public.reopen_event(uuid)
to authenticated;

commit;
