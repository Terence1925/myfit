-- MyFit schema: profiles, roles, programs, activity log, RLS.
-- Run via `supabase db push` (or paste into the SQL editor) once a project is linked.

create type public.app_role as enum ('admin', 'user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  sex text,
  age int,
  weight_kg numeric,
  height_cm numeric,
  sleep_hours text,
  sleep_quality text,
  stress_level text,
  activity_level text,
  goal text,
  bmr int,
  tdee int,
  calorie_target int,
  protein_g int,
  carbs_g int,
  fat_g int,
  recovery_score int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'user',
  primary key (user_id, role)
);

create table public.workout_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_name text not null,
  program_data jsonb not null,
  answers jsonb not null,
  nutrition jsonb not null,
  recovery_score int not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '12 weeks')
);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- security definer role check, used by every RLS policy below
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- auto-provision profile + default role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', 'New Client'));

  insert into public.user_roles (user_id, role)
  values (new.id, 'user');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.workout_programs enable row level security;
alter table public.activity_log enable row level security;

-- profiles: own row, or any row if admin
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));

-- user_roles: readable by self and admins; only admins may write
create policy "roles_select_own_or_admin" on public.user_roles
  for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "roles_write_admin_only" on public.user_roles
  for insert with check (public.has_role(auth.uid(), 'admin'));
create policy "roles_update_admin_only" on public.user_roles
  for update using (public.has_role(auth.uid(), 'admin'));
create policy "roles_delete_admin_only" on public.user_roles
  for delete using (public.has_role(auth.uid(), 'admin'));

-- workout_programs: users manage their own; admins see/manage all
create policy "programs_select_own_or_admin" on public.workout_programs
  for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "programs_insert_own" on public.workout_programs
  for insert with check (auth.uid() = user_id);
create policy "programs_delete_own_or_admin" on public.workout_programs
  for delete using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

-- activity_log: users see their own; admins see all; only server (service role) writes
create policy "activity_select_own_or_admin" on public.activity_log
  for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "activity_insert_own" on public.activity_log
  for insert with check (auth.uid() = user_id);

create index workout_programs_user_id_idx on public.workout_programs(user_id);
create index workout_programs_expires_at_idx on public.workout_programs(expires_at);
create index activity_log_user_id_idx on public.activity_log(user_id);
create index activity_log_created_at_idx on public.activity_log(created_at desc);
