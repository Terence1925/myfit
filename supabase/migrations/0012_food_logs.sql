-- Food log: what each person ate, per day. Apply to the live database only after the feature is approved.
create table public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  meal text not null check (meal in ('breakfast', 'lunch', 'dinner', 'snack')),
  name text not null check (char_length(name) between 1 and 120),
  serving text not null default '1 serving',
  servings numeric not null check (servings > 0 and servings <= 100),
  kcal numeric not null check (kcal >= 0 and kcal <= 20000),
  protein_g numeric not null default 0 check (protein_g >= 0),
  carbs_g numeric not null default 0 check (carbs_g >= 0),
  fat_g numeric not null default 0 check (fat_g >= 0),
  created_at timestamptz not null default now()
);

alter table public.food_logs enable row level security;

create policy "food_logs_select_own" on public.food_logs
  for select using (auth.uid() = user_id);
create policy "food_logs_insert_own" on public.food_logs
  for insert with check (auth.uid() = user_id);
create policy "food_logs_delete_own" on public.food_logs
  for delete using (auth.uid() = user_id);

create index food_logs_user_date_idx on public.food_logs(user_id, log_date);
