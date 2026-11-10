-- Let people change the amount of a food they logged (servings and the numbers that go with them).
create policy "food_logs_update_own" on public.food_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Grams (or ml) in one serving, so an entry can be edited by weight. Older entries stay null.
alter table public.food_logs
  add column if not exists base_amount numeric,
  add column if not exists base_unit text;
