-- Tampa CarpetFest: initial database setup.
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.

------------------------------------------------------------------------------
-- Invite codes: signing up requires a valid, active code.
------------------------------------------------------------------------------
create table public.invite_codes (
  code text primary key,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
-- No policies: the app can never read this table directly.
alter table public.invite_codes enable row level security;

insert into public.invite_codes (code) values ('carpet27');

-- Lets the sign-up screen check a code before creating the account.
create function public.check_invite_code(p_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.invite_codes
    where lower(code) = lower(trim(p_code)) and active
  );
$$;
grant execute on function public.check_invite_code(text) to anon, authenticated;

-- The real enforcement: Supabase refuses to create any account without a
-- valid code, even if someone bypasses the app. The code is then removed
-- from the stored user data.
create function public.enforce_invite_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.check_invite_code(coalesce(new.raw_user_meta_data ->> 'invite_code', '')) then
    raise exception 'Invalid invite code';
  end if;
  new.raw_user_meta_data := new.raw_user_meta_data - 'invite_code';
  return new;
end;
$$;

create trigger enforce_invite_code
  before insert on auth.users
  for each row execute function public.enforce_invite_code();

------------------------------------------------------------------------------
-- Profiles: one per account, created automatically at sign-up.
------------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  business_name text,
  city_state text,
  bio text,
  photo_url text,
  favorite_species text,
  first_snake text,
  place_to_visit text,
  pet_reptile_name text,
  pet_reptile_species text,
  pet_reptile_morph text,
  pet_reptile_photo_url text,
  other_pet_name text,
  other_pet_type text,
  other_pet_photo_url text,
  years_attended int[] not null default '{}',
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Logged-in users can view profiles"
  on public.profiles for select to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- People can edit their own details, but never their admin flag.
revoke update on public.profiles from anon, authenticated;
grant update (
  full_name, business_name, city_state, bio, photo_url,
  favorite_species, first_snake, place_to_visit,
  pet_reptile_name, pet_reptile_species, pet_reptile_morph, pet_reptile_photo_url,
  other_pet_name, other_pet_type, other_pet_photo_url,
  years_attended
) on public.profiles to authenticated;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select is_admin from public.profiles where id = (select auth.uid())),
    false
  );
$$;

------------------------------------------------------------------------------
-- Itinerary and announcements: everyone logged in can read, admins can edit.
------------------------------------------------------------------------------
create table public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz,
  title text not null,
  location text,
  description text,
  created_at timestamptz not null default now()
);
alter table public.itinerary_items enable row level security;

create policy "Logged-in users can view the itinerary"
  on public.itinerary_items for select to authenticated
  using (true);

create policy "Admins can manage the itinerary"
  on public.itinerary_items for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);
alter table public.announcements enable row level security;

create policy "Logged-in users can view announcements"
  on public.announcements for select to authenticated
  using (true);

create policy "Admins can manage announcements"
  on public.announcements for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

------------------------------------------------------------------------------
-- Photo storage: each person can only upload or remove files in their own
-- folder. Files get random names and are viewable by link.
------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photos', 'photos', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

create policy "Users can upload their own photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can update their own photos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can delete their own photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
