-- One poll per event ("Where should we eat?") with 2 to 4 options.
-- Registered attendees vote once and can change their vote while the poll
-- is open. Results (counts only, never who voted for what) are visible to
-- people who have voted, and to admins.
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.

begin;

create table public.event_polls (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.events (id) on delete cascade,
  question text not null check (length(trim(question)) > 0),
  is_open boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.event_polls (id) on delete cascade,
  label text not null check (length(trim(label)) > 0),
  sort_order int not null default 0,
  unique (id, poll_id)
);
create index poll_options_poll on public.poll_options (poll_id, sort_order);

create table public.poll_votes (
  poll_id uuid not null references public.event_polls (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  option_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (poll_id, profile_id), -- one vote per person per poll
  -- The chosen option must belong to the same poll. If an option is
  -- removed, votes for it are removed and those people can vote again.
  foreign key (option_id, poll_id) references public.poll_options (id, poll_id) on delete cascade
);
create index poll_votes_option on public.poll_votes (option_id);

create trigger event_polls_updated_at
  before update on public.event_polls
  for each row execute function public.set_updated_at();
create trigger poll_votes_updated_at
  before update on public.poll_votes
  for each row execute function public.set_updated_at();

alter table public.event_polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;

create policy "Logged-in users can view polls"
  on public.event_polls for select to authenticated using (true);
create policy "Admins can manage polls"
  on public.event_polls for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Logged-in users can view poll options"
  on public.poll_options for select to authenticated using (true);
create policy "Admins can manage poll options"
  on public.poll_options for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- People can only ever see their own vote. Voting goes through cast_vote().
create policy "Users can view their own vote"
  on public.poll_votes for select to authenticated
  using (profile_id = (select auth.uid()));

------------------------------------------------------------------------------
-- Functions the app calls
------------------------------------------------------------------------------

-- Vote, or change your vote, while the poll is open. Registered attendees only.
create function public.cast_vote(p_option uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_poll uuid;
  v_event uuid;
  v_open boolean;
begin
  if auth.uid() is null then
    raise exception 'Not logged in';
  end if;
  select o.poll_id, p.event_id, p.is_open into v_poll, v_event, v_open
  from public.poll_options o
  join public.event_polls p on p.id = o.poll_id
  where o.id = p_option;
  if v_poll is null then
    raise exception 'That option no longer exists';
  end if;
  if not v_open then
    raise exception 'This poll is closed';
  end if;
  if not exists (
    select 1 from public.event_attendees
    where event_id = v_event and profile_id = auth.uid()
  ) then
    raise exception 'Only registered attendees can vote';
  end if;

  insert into public.poll_votes (poll_id, profile_id, option_id)
  values (v_poll, auth.uid(), p_option)
  on conflict (poll_id, profile_id) do update set option_id = excluded.option_id;
end;
$$;

-- Vote counts per option, only for people who have voted (and admins).
-- Returns no rows for anyone else.
create function public.get_poll_results(p_poll uuid)
returns table (option_id uuid, votes bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (
    public.is_admin()
    or exists (
      select 1 from public.poll_votes v
      where v.poll_id = p_poll and v.profile_id = auth.uid()
    )
  ) then
    return;
  end if;
  return query
    select o.id, count(v.profile_id)
    from public.poll_options o
    left join public.poll_votes v on v.option_id = o.id
    where o.poll_id = p_poll
    group by o.id;
end;
$$;

-- Admins create or update an event's poll in one step. p_options is a list
-- like [{"id": "...", "label": "Tacos"}, {"label": "Pizza"}]: options with an
-- id are kept (and keep their votes), new ones are added, missing ones are
-- removed (along with their votes).
create function public.save_poll(
  p_event uuid, p_question text, p_options jsonb, p_is_open boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_poll uuid;
  v_count int := jsonb_array_length(coalesce(p_options, '[]'::jsonb));
  v_option jsonb;
  v_label text;
  i int;
begin
  if not public.is_admin() then
    raise exception 'Not allowed';
  end if;
  if length(trim(coalesce(p_question, ''))) = 0 then
    raise exception 'The poll needs a question';
  end if;
  if v_count < 2 or v_count > 4 then
    raise exception 'A poll needs 2 to 4 options';
  end if;

  insert into public.event_polls (event_id, question, is_open)
  values (p_event, trim(p_question), p_is_open)
  on conflict (event_id) do update
    set question = excluded.question, is_open = excluded.is_open
  returning id into v_poll;

  delete from public.poll_options
  where poll_id = v_poll
    and id not in (
      select (o ->> 'id')::uuid
      from jsonb_array_elements(p_options) o
      where coalesce(o ->> 'id', '') <> ''
    );

  for i in 0 .. v_count - 1 loop
    v_option := p_options -> i;
    v_label := trim(coalesce(v_option ->> 'label', ''));
    if v_label = '' then
      raise exception 'Options can''t be blank';
    end if;
    if coalesce(v_option ->> 'id', '') <> '' then
      update public.poll_options
      set label = v_label, sort_order = i
      where id = (v_option ->> 'id')::uuid and poll_id = v_poll;
    else
      insert into public.poll_options (poll_id, label, sort_order)
      values (v_poll, v_label, i);
    end if;
  end loop;

  return v_poll;
end;
$$;

revoke execute on function
  public.cast_vote(uuid),
  public.get_poll_results(uuid),
  public.save_poll(uuid, text, jsonb, boolean)
from public, anon;
grant execute on function
  public.cast_vote(uuid),
  public.get_poll_results(uuid),
  public.save_poll(uuid, text, jsonb, boolean)
to authenticated;

commit;
