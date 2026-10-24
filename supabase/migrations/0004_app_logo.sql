-- App-wide settings (currently just the logo), editable by admins in the app.
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.

create table public.app_settings (
  id int primary key default 1 check (id = 1), -- always exactly one row
  logo_url text,                               -- null = use the built-in logo
  updated_at timestamptz not null default now()
);
insert into public.app_settings (id) values (1);

alter table public.app_settings enable row level security;

-- Everyone can read it, even logged out, because the login screen shows the logo.
create policy "Anyone can read app settings"
  on public.app_settings for select to anon, authenticated
  using (true);

create policy "Admins can update app settings"
  on public.app_settings for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

revoke insert, delete on public.app_settings from anon, authenticated;

create trigger app_settings_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

-- Logo files go in the "branding/" folder of the photos bucket. Admins can
-- already upload anywhere in that bucket (0002), and no one else can write
-- outside their own folder.
