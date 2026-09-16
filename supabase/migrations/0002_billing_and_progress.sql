-- Adds subscription fields to profiles, plus body_metrics and workout_sessions tables.
-- Run after 0001_init.sql.

alter table public.profiles
  add column subscription_tier text not null default 'free',
  add column subscription_period text,
  add column subscription_status text not null default 'none',
  add column subscription_renews_at timestamptz,
  add column subscription_started_at timestamptz,
  add column stripe_customer_id text,
  add column stripe_subscription_id text;

create table public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date timestamptz not null,
  weight_kg numeric not null,
  body_fat_percent numeric,
  notes text,
  created_at timestamptz not null default now()
);

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid not null references public.workout_programs(id) on delete cascade,
  day int not null,
  day_name text not null,
  date timestamptz not null,
  exercises jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.body_metrics enable row level security;
alter table public.workout_sessions enable row level security;

create policy "body_metrics_select_own_or_admin" on public.body_metrics
  for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "body_metrics_insert_own" on public.body_metrics
  for insert with check (auth.uid() = user_id);
create policy "body_metrics_delete_own_or_admin" on public.body_metrics
  for delete using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create policy "workout_sessions_select_own_or_admin" on public.workout_sessions
  for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "workout_sessions_insert_own" on public.workout_sessions
  for insert with check (auth.uid() = user_id);

create index body_metrics_user_id_idx on public.body_metrics(user_id);
create index workout_sessions_program_day_idx on public.workout_sessions(program_id, day);
create index workout_sessions_user_id_idx on public.workout_sessions(user_id);

-- Service-role only: Stripe webhook needs to update subscription fields for any user,
-- bypassing RLS via the service_role key (which always bypasses RLS in Supabase).
-- No additional policy needed for that path.
