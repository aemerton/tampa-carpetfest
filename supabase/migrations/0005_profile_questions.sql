-- "Get to know you" profile questions that admins can add, edit, reorder,
-- and hide from the app. Starts with the 21 questions from 2026.
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.

begin;

create table public.profile_questions (
  id uuid primary key default gen_random_uuid(),
  prompt text not null check (length(trim(prompt)) > 0),
  sort_order int not null default 0,
  active boolean not null default true, -- hidden questions keep their answers
  created_at timestamptz not null default now()
);
create index profile_questions_order on public.profile_questions (sort_order);

create table public.profile_answers (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  question_id uuid not null references public.profile_questions (id) on delete cascade,
  answer text not null check (length(trim(answer)) > 0),
  updated_at timestamptz not null default now(),
  primary key (profile_id, question_id)
);
create index profile_answers_question on public.profile_answers (question_id);

create trigger profile_answers_updated_at
  before update on public.profile_answers
  for each row execute function public.set_updated_at();

alter table public.profile_questions enable row level security;
alter table public.profile_answers enable row level security;

create policy "Logged-in users can view questions"
  on public.profile_questions for select to authenticated using (true);

create policy "Admins can manage questions"
  on public.profile_questions for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Logged-in users can view answers"
  on public.profile_answers for select to authenticated using (true);

-- People manage their own answers; admins can fix anyone's (Manage button).
create policy "Users and admins can add answers"
  on public.profile_answers for insert to authenticated
  with check (profile_id = (select auth.uid()) or (select public.is_admin()));

create policy "Users and admins can change answers"
  on public.profile_answers for update to authenticated
  using (profile_id = (select auth.uid()) or (select public.is_admin()))
  with check (profile_id = (select auth.uid()) or (select public.is_admin()));

create policy "Users and admins can remove answers"
  on public.profile_answers for delete to authenticated
  using (profile_id = (select auth.uid()) or (select public.is_admin()));

insert into public.profile_questions (sort_order, prompt) values
  (1,  'A movie you''ve watched more than five times?'),
  (2,  'Where did you grow up mostly?'),
  (3,  'How many states have you lived in?'),
  (4,  'How old were you when you had your first job?'),
  (5,  'Ever work in food service?'),
  (6,  'What''s your preferred party/board game?'),
  (7,  'How many different countries have you visited?'),
  (8,  'How many times have you been to Australia?'),
  (9,  'How long ago did you acquire your first carpet python?'),
  (10, 'Keeping Morelia, what''s a beginner mistake you definitely made?'),
  (11, 'How many different subspecies of snakes have you kept?'),
  (12, 'How many different subspecies of snakes have you bred?'),
  (13, 'What''s the most baby snakes you''ve hatched and started in one season?'),
  (14, 'Do you have a Master''s Degree? PhD? What in?'),
  (15, 'Have you served in the military? Branch & highest rank?'),
  (16, 'What other animals have you bred?'),
  (17, 'Name one or two other hobbies you have.'),
  (18, 'What other pets do you currently have?'),
  (19, 'Roughly, do you read a book a week? How many per year?'),
  (20, 'Least favorite food?'),
  (21, 'Have you ever kept hot snakes?');

commit;
